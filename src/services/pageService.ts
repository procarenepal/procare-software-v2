// src/services/pageService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/config/firebase";
import { Page, ClinicTypePage } from "@/types/models";
import { navigationCacheUtils } from "@/utils/navigationCache";

export const pageService = {
  // Get all available pages
  getAllPages: async (): Promise<Page[]> => {
    try {
      const pagesRef = collection(db, "pages");
      const q = query(pagesRef, orderBy("order", "asc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          }) as Page,
      );
    } catch (error) {
      console.error("Error getting pages:", error);
      throw error;
    }
  },

  // Get a page by ID
  getPageById: async (pageId: string): Promise<Page | null> => {
    try {
      const docRef = doc(db, "pages", pageId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
      } as Page;
    } catch (error) {
      console.error("Error getting page:", error);
      throw error;
    }
  },

  // Create a new page
  createPage: async (
    pageData: Omit<Page, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> => {
    try {
      const pagesRef = collection(db, "pages");
      const now = Timestamp.now();

      const data = {
        ...pageData,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(pagesRef, data);

      // Invalidate navigation cache for page changes
      navigationCacheUtils.invalidatePageChanges();

      return docRef.id;
    } catch (error) {
      console.error("Error creating page:", error);
      throw error;
    }
  },

  // Update an existing page
  updatePage: async (
    pageId: string,
    pageData: Partial<Omit<Page, "id" | "createdAt" | "updatedAt">>,
  ): Promise<void> => {
    try {
      const docRef = doc(db, "pages", pageId);

      // Get the current page data to check if autoAssign status is changing
      const currentPageDoc = await getDoc(docRef);
      const currentPage = currentPageDoc.exists()
        ? (currentPageDoc.data() as Page)
        : null;

      await updateDoc(docRef, {
        ...pageData,
        updatedAt: Timestamp.now(),
      });

      // Handle auto-assign status changes
      if (currentPage && pageData.hasOwnProperty("autoAssign")) {
        const wasAutoAssign = currentPage.autoAssign || false;
        const isNowAutoAssign = pageData.autoAssign || false;

        if (!wasAutoAssign && isNowAutoAssign) {
          // Page is now set to auto-assign - assign to all existing clinic types
          await pageService.assignPageToAllClinicTypes(pageId);
        } else if (wasAutoAssign && !isNowAutoAssign) {
          // Page is no longer auto-assign - optionally remove from all clinic types
          // (You might want to keep existing assignments and just prevent future auto-assignments)
          console.log(
            `Page ${pageId} auto-assign disabled - existing assignments retained`,
          );
        }
      }

      // Invalidate navigation cache for page changes
      navigationCacheUtils.invalidatePageChanges();
    } catch (error) {
      console.error("Error updating page:", error);
      throw error;
    }
  },

  // Delete a page
  deletePage: async (pageId: string): Promise<void> => {
    try {
      const docRef = doc(db, "pages", pageId);

      await deleteDoc(docRef);

      // Also delete all clinic type page assignments
      const clinicTypePagesRef = collection(db, "clinic_type_pages");
      const q = query(clinicTypePagesRef, where("pageId", "==", pageId));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Invalidate navigation cache for page changes
      navigationCacheUtils.invalidatePageChanges();
    } catch (error) {
      console.error("Error deleting page:", error);
      throw error;
    }
  },

  // Assign pages to a clinic type
  assignPagesToClinicType: async (
    clinicTypeId: string,
    pageIds: string[],
  ): Promise<void> => {
    try {
      const batch = writeBatch(db);
      const clinicTypePagesRef = collection(db, "clinic_type_pages");

      // First, query and delete all existing assignments for this clinic type
      const existingQuery = query(
        clinicTypePagesRef,
        where("clinicTypeId", "==", clinicTypeId),
      );
      const existingSnapshot = await getDocs(existingQuery);

      existingSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Then create new assignments
      const now = Timestamp.now();

      pageIds.forEach((pageId) => {
        const newDocRef = doc(clinicTypePagesRef);

        batch.set(newDocRef, {
          id: newDocRef.id,
          clinicTypeId,
          pageId,
          isEnabled: true,
          createdAt: now,
          updatedAt: now,
        });
      });

      await batch.commit();

      // IMPORTANT: Update role permissions for all clinics of this type
      await pageService.updateRolePermissionsForClinicType(
        clinicTypeId,
        pageIds,
      );

      // Invalidate caches for all clinics of this clinic type so sidebar updates immediately
      try {
        const { navigationService } = await import("./navigationService");
        const { cacheService } = await import("./cacheService");
        const { userService } = await import("./userService");

        const clinicsRef = collection(db, "clinics");
        const clinicsQuery = query(
          clinicsRef,
          where("clinicType", "==", clinicTypeId),
        );
        const clinicsSnapshot = await getDocs(clinicsQuery);

        for (const clinicDoc of clinicsSnapshot.docs) {
          const clinicId = clinicDoc.id;

          // Clear clinic pages cache and navigation cache
          cacheService.clearClinicPages(clinicId);
          navigationService.invalidateClinicCache(clinicId);

          // Clear user permissions cache for all users in this clinic
          try {
            const users = await userService.getUsersByClinic(clinicId);

            users.forEach((user: any) => {
              cacheService.clearUserPermissions(user.id, clinicId);
              navigationService.invalidateUserCache(
                user.id,
                clinicId,
                user.role || user?.roles?.[0]?.name || "",
              );
            });
          } catch (userErr) {
            console.error(
              "Error clearing user permissions cache for clinic:",
              clinicId,
              userErr,
            );
          }
        }
      } catch (cacheError) {
        console.error("Error invalidating caches:", cacheError);
        // Don't throw - cache invalidation failure shouldn't break the assignment
      }
    } catch (error) {
      console.error("Error assigning pages to clinic type:", error);
      throw error;
    }
  },

  // Get pages assigned to a clinic type
  getPagesForClinicType: async (clinicTypeId: string): Promise<Page[]> => {
    try {
      const clinicTypePagesRef = collection(db, "clinic_type_pages");
      const q = query(
        clinicTypePagesRef,
        where("clinicTypeId", "==", clinicTypeId),
        where("isEnabled", "==", true),
      );

      const snapshot = await getDocs(q);
      const pageIds = snapshot.docs.map((doc) => doc.data().pageId);

      if (pageIds.length === 0) {
        return [];
      }

      // Get all active pages
      const pagesRef = collection(db, "pages");
      const pagesQuery = query(
        pagesRef,
        where("isActive", "==", true),
        orderBy("order", "asc"),
      );
      const pagesSnapshot = await getDocs(pagesQuery);

      const allPages = pagesSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          }) as Page,
      );

      // Filter pages by those assigned to the clinic type
      return allPages.filter((page) => pageIds.includes(page.id));
    } catch (error) {
      console.error("Error getting pages for clinic type:", error);
      throw error;
    }
  },

  // Get ClinicTypePage assignments
  getClinicTypePageAssignments: async (
    clinicTypeId: string,
  ): Promise<ClinicTypePage[]> => {
    try {
      const clinicTypePagesRef = collection(db, "clinic_type_pages");
      const q = query(
        clinicTypePagesRef,
        where("clinicTypeId", "==", clinicTypeId),
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          }) as ClinicTypePage,
      );
    } catch (error) {
      console.error("Error getting clinic type page assignments:", error);
      throw error;
    }
  },

  // Get pages that are marked for auto-assignment
  getPagesForAutoAssign: async (): Promise<Page[]> => {
    try {
      const pagesRef = collection(db, "pages");
      const q = query(
        pagesRef,
        where("autoAssign", "==", true),
        where("isActive", "==", true),
      );
      const snapshot = await getDocs(q);

      const pages = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          }) as Page,
      );

      // Sort by order manually
      pages.sort((a, b) => a.order - b.order);

      console.log("getPagesForAutoAssign query result:", pages.length, "pages");
      console.log(
        "Auto-assign pages:",
        pages.map((p) => ({
          name: p.name,
          autoAssign: p.autoAssign,
          isActive: p.isActive,
        })),
      );

      return pages;
    } catch (error) {
      console.error("Error getting auto-assign pages:", error);
      throw error;
    }
  },

  // Auto-assign pages to a new clinic type
  autoAssignPagesToClinicType: async (clinicTypeId: string): Promise<void> => {
    try {
      console.log("Getting auto-assign pages for clinic type:", clinicTypeId);
      const autoAssignPages = await pageService.getPagesForAutoAssign();

      console.log(
        "Auto-assign pages found:",
        autoAssignPages.length,
        autoAssignPages.map((p) => p.name),
      );

      if (autoAssignPages.length === 0) {
        console.log("No pages to auto-assign");

        return; // No pages to auto-assign
      }

      const batch = writeBatch(db);
      const clinicTypePagesRef = collection(db, "clinic_type_pages");
      const now = Timestamp.now();

      autoAssignPages.forEach((page) => {
        const newDocRef = doc(clinicTypePagesRef);
        const assignmentData = {
          id: newDocRef.id,
          clinicTypeId,
          pageId: page.id,
          isEnabled: true,
          createdAt: now,
          updatedAt: now,
        };

        console.log("Adding assignment:", assignmentData);
        batch.set(newDocRef, assignmentData);
      });

      await batch.commit();
      console.log("Auto-assignment batch committed successfully");
    } catch (error) {
      console.error("Error auto-assigning pages to clinic type:", error);
      throw error;
    }
  },

  // Assign a single page to all existing clinic types
  assignPageToAllClinicTypes: async (pageId: string): Promise<void> => {
    try {
      // Get all active clinic types
      const clinicTypesRef = collection(db, "clinic_types");
      const clinicTypesQuery = query(
        clinicTypesRef,
        where("isActive", "==", true),
      );
      const clinicTypesSnapshot = await getDocs(clinicTypesQuery);

      if (clinicTypesSnapshot.empty) {
        return; // No clinic types to assign to
      }

      const batch = writeBatch(db);
      const clinicTypePagesRef = collection(db, "clinic_type_pages");
      const now = Timestamp.now();

      clinicTypesSnapshot.docs.forEach((clinicTypeDoc) => {
        const newDocRef = doc(clinicTypePagesRef);

        batch.set(newDocRef, {
          id: newDocRef.id,
          clinicTypeId: clinicTypeDoc.id,
          pageId: pageId,
          isEnabled: true,
          createdAt: now,
          updatedAt: now,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error assigning page to all clinic types:", error);
      throw error;
    }
  },

  // Get pages organized in a hierarchical tree structure
  getPagesTree: async (): Promise<Page[]> => {
    try {
      const allPages = await pageService.getAllPages();

      // Separate root pages and sub-pages
      const rootPages = allPages.filter((page) => !page.parentId);
      const subPages = allPages.filter((page) => page.parentId);

      // Build the tree structure
      const buildTree = (pages: Page[]): Page[] => {
        return pages
          .map((page) => {
            const children = subPages.filter(
              (child) => child.parentId === page.id,
            );

            return {
              ...page,
              hasSubmenu: children.length > 0,
            };
          })
          .sort((a, b) => a.order - b.order);
      };

      return buildTree(rootPages);
    } catch (error) {
      console.error("Error getting pages tree:", error);
      throw error;
    }
  },

  // Get child pages for a specific parent page
  getChildPages: async (parentId: string): Promise<Page[]> => {
    try {
      const pagesRef = collection(db, "pages");
      const q = query(
        pagesRef,
        where("parentId", "==", parentId),
        where("isActive", "==", true),
        orderBy("order", "asc"),
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          }) as Page,
      );
    } catch (error) {
      console.error("Error getting child pages:", error);
      throw error;
    }
  },

  // Get all root pages (pages without parent)
  getRootPages: async (): Promise<Page[]> => {
    try {
      const pagesRef = collection(db, "pages");
      const q = query(
        pagesRef,
        where("parentId", "==", null),
        where("isActive", "==", true),
        orderBy("order", "asc"),
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          }) as Page,
      );
    } catch (error) {
      console.error("Error getting root pages:", error);
      throw error;
    }
  },

  // Get navigation structure for clinic dashboard with hierarchical support
  getNavigationForClinicType: async (clinicTypeId: string): Promise<any[]> => {
    try {
      // Get pages assigned to this clinic type
      const assignedPages =
        await pageService.getPagesForClinicType(clinicTypeId);
      const assignedPageIds = assignedPages.map((p) => p.id);

      // Get all pages to build the hierarchy
      const allPages = await pageService.getAllPages();

      // Filter to only include assigned pages and their hierarchy
      const getPageWithChildren = (page: Page): any => {
        if (!assignedPageIds.includes(page.id)) return null;

        const children = allPages
          .filter(
            (child) =>
              child.parentId === page.id && assignedPageIds.includes(child.id),
          )
          .map((child) => ({
            ...child,
            children: [], // Child pages don't have nested children (only 1 level deep)
          }))
          .sort((a, b) => a.order - b.order);

        return {
          ...page,
          children,
          hasSubmenu: children.length > 0,
        };
      };

      // Start with root pages that are assigned
      const navigation = allPages
        .filter((page) => !page.parentId && assignedPageIds.includes(page.id))
        .map(getPageWithChildren)
        .filter((page): page is any => page !== null)
        .sort((a, b) => a.order - b.order);

      return navigation;
    } catch (error) {
      console.error("Error getting navigation for clinic type:", error);
      throw error;
    }
  },

  // Update role permissions for all clinics of a specific clinic type
  updateRolePermissionsForClinicType: async (
    clinicTypeId: string,
    pageIds: string[],
  ): Promise<void> => {
    try {
      console.log(
        "Updating role permissions for clinic type:",
        clinicTypeId,
        "with pages:",
        pageIds,
      );

      // Get all clinics with this clinic type
      const clinicsRef = collection(db, "clinics");
      const clinicsQuery = query(
        clinicsRef,
        where("clinicType", "==", clinicTypeId),
      );
      const clinicsSnapshot = await getDocs(clinicsQuery);

      if (clinicsSnapshot.empty) {
        console.log("No clinics found for clinic type:", clinicTypeId);

        return;
      }

      // Import rbacService here to avoid circular dependencies
      const { rbacService } = await import("./rbacService");

      // Update roles for each clinic
      const updatePromises = clinicsSnapshot.docs.map(async (clinicDoc) => {
        const clinicId = clinicDoc.id;

        console.log("Updating roles for clinic:", clinicId);

        try {
          // Get all roles for this clinic
          const roles = await rbacService.getClinicRoles(clinicId);

          // Update each role to include the new page permissions
          const roleUpdatePromises = roles.map(async (role) => {
            // Create a new permissions array that includes all current permissions plus new pages
            const currentPermissions = role.permissions || [];
            const updatedPermissions = [
              ...new Set([...currentPermissions, ...pageIds]),
            ];

            console.log(`Updating role ${role.name} in clinic ${clinicId}:`, {
              currentPermissions: currentPermissions.length,
              newPermissions: updatedPermissions.length,
              addedPages: pageIds.filter(
                (id) => !currentPermissions.includes(id),
              ),
            });

            // Only update if there are actually new permissions to add
            if (updatedPermissions.length > currentPermissions.length) {
              await rbacService.updateRole(role.id, {
                permissions: updatedPermissions,
              });
            }
          });

          await Promise.all(roleUpdatePromises);
          console.log(
            `Successfully updated ${roles.length} roles for clinic ${clinicId}`,
          );
        } catch (error) {
          console.error(`Error updating roles for clinic ${clinicId}:`, error);
          // Continue with other clinics even if one fails
        }
      });

      await Promise.all(updatePromises);
      console.log(
        "Role permissions update completed for clinic type:",
        clinicTypeId,
      );
    } catch (error) {
      console.error("Error updating role permissions for clinic type:", error);
      throw error;
    }
  },
};

export default pageService;
