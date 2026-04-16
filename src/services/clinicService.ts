import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";
import { Clinic } from "../types/models";

import { PrintLayoutConfig } from "@/types/printLayout";

const CLINICS_COLLECTION = "clinics";

/**
 * Helper function to verify if current user is a super admin
 * @returns {Promise<boolean>} - True if user is super admin
 */
const verifyIsSuperAdmin = async (): Promise<boolean> => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) return false;

    const { userService } = await import("./userService");
    const userData = await userService.getUserById(currentUser.uid);

    return userData?.role === "super-admin";
  } catch (error) {
    console.error("Error verifying super admin status:", error);

    return false;
  }
};

/**
 * Service for managing clinic data in Firestore
 */
export const clinicService = {
  /**
   * Create a new clinic with automatic RBAC setup
   * @param {Partial<Clinic>} clinicData - Data for the new clinic
   * @param {string} adminEmail - Email for the clinic admin user
   * @param {string} adminName - Name for the clinic admin user
   * @returns {Promise<{clinicId: string, adminUserId: string}>} - IDs of created clinic and admin user
   */
  async createClinic(
    clinicData: Partial<Clinic>,
    adminEmail?: string,
    adminName?: string,
  ): Promise<string | { clinicId: string; adminUserId: string }> {
    try {
      // Create the clinic first
      const clinicsRef = collection(db, CLINICS_COLLECTION);

      // Filter out undefined values to avoid Firestore errors
      const cleanedClinicData = Object.fromEntries(
        Object.entries({
          ...clinicData,
          subscriptionStatus: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).filter(([_, value]) => value !== undefined),
      );

      const docRef = await addDoc(clinicsRef, cleanedClinicData);

      const clinicId = docRef.id;

      // If admin details provided, set up RBAC system
      if (adminEmail && adminName) {
        const { rbacService } = await import("./rbacService");
        const { userService } = await import("./userService");

        // Create default clinic admin role with all available pages
        const adminRoleId =
          await rbacService.createDefaultClinicAdminRole(clinicId);

        // Create other default roles
        await rbacService.createDefaultClinicRoles(clinicId);

        // Create clinic admin user
        const temporaryPassword = "ClinicAdmin123!"; // User will get password reset email

        const adminUserId = await userService.createUser(
          adminEmail,
          temporaryPassword,
          {
            displayName: adminName,
            clinicId,
            role: "clinic-admin",
            isActive: true,
          },
        );

        // Assign the clinic admin role to the user
        await rbacService.assignRolesToUser(
          adminUserId,
          [adminRoleId],
          clinicId,
        );

        return { clinicId, adminUserId };
      }

      // Return just clinic ID if no admin setup requested
      return clinicId;
    } catch (error) {
      console.error("Error creating clinic:", error);
      throw error;
    }
  },

  /**
   * Create a new clinic (legacy method without RBAC)
   * @param {Partial<Clinic>} clinicData - Data for the new clinic
   * @returns {Promise<string>} - ID of the created clinic
   */
  async createClinicLegacy(clinicData: Partial<Clinic>): Promise<string> {
    try {
      const clinicsRef = collection(db, CLINICS_COLLECTION);

      // Filter out undefined values to avoid Firestore errors
      const cleanedClinicData = Object.fromEntries(
        Object.entries({
          ...clinicData,
          subscriptionStatus: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).filter(([_, value]) => value !== undefined),
      );

      const docRef = await addDoc(clinicsRef, cleanedClinicData);

      return docRef.id;
    } catch (error) {
      console.error("Error creating clinic:", error);
      throw error;
    }
  },

  /**
   * Get a clinic by ID
   * @param {string} id - Clinic ID
   * @returns {Promise<Clinic | null>} - Clinic data or null if not found
   */
  async getClinicById(id: string): Promise<Clinic | null> {
    try {
      const docRef = doc(db, CLINICS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();
        const subscriptionStartDate = data.subscriptionStartDate
          ? new Date(data.subscriptionStartDate.seconds * 1000)
          : new Date();
        const subscriptionEndDate = data.subscriptionEndDate
          ? new Date(data.subscriptionEndDate.seconds * 1000)
          : undefined;

        return {
          id: docSnap.id,
          ...data,
          createdAt,
          updatedAt,
          subscriptionStartDate,
          subscriptionEndDate,
        } as Clinic;
      }

      return null;
    } catch (error) {
      console.error("Error getting clinic:", error);
      throw error;
    }
  },

  /**
   * Get all clinics
   * @returns {Promise<Clinic[]>} - Array of all clinics
   */
  async getAllClinics(): Promise<Clinic[]> {
    try {
      const clinicsRef = collection(db, CLINICS_COLLECTION);
      const querySnapshot = await getDocs(clinicsRef);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();
        const subscriptionStartDate = data.subscriptionStartDate
          ? new Date(data.subscriptionStartDate.seconds * 1000)
          : new Date();
        const subscriptionEndDate = data.subscriptionEndDate
          ? new Date(data.subscriptionEndDate.seconds * 1000)
          : undefined;

        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
          subscriptionStartDate,
          subscriptionEndDate,
        } as Clinic;
      });
    } catch (error) {
      console.error("Error getting all clinics:", error);
      throw error;
    }
  },

  /**
   * Update a clinic's information
   * @param {string} id - Clinic ID
   * @param {Partial<Clinic>} updateData - Updated clinic data
   * @returns {Promise<void>}
   */
  async updateClinic(id: string, updateData: Partial<Clinic>): Promise<void> {
    try {
      const docRef = doc(db, CLINICS_COLLECTION, id);

      // Filter out undefined values to avoid Firestore errors
      const cleanedUpdateData = Object.fromEntries(
        Object.entries({
          ...updateData,
          updatedAt: serverTimestamp(),
        }).filter(([_, value]) => value !== undefined),
      );

      await updateDoc(docRef, cleanedUpdateData);
    } catch (error) {
      console.error("Error updating clinic:", error);
      throw error;
    }
  },

  /**
   * Update a clinic's subscription status
   * @param {string} id - Clinic ID
   * @param {'active' | 'suspended' | 'cancelled'} status - New status
   * @returns {Promise<void>}
   */
  async updateSubscriptionStatus(
    id: string,
    status: "active" | "suspended" | "cancelled",
  ): Promise<void> {
    try {
      const docRef = doc(db, CLINICS_COLLECTION, id);

      // Filter out undefined values to avoid Firestore errors
      const cleanedUpdateData = Object.fromEntries(
        Object.entries({
          subscriptionStatus: status,
          updatedAt: serverTimestamp(),
        }).filter(([_, value]) => value !== undefined),
      );

      await updateDoc(docRef, cleanedUpdateData);
    } catch (error) {
      console.error("Error updating subscription status:", error);
      throw error;
    }
  },

  /**
   * Enable multi-branch functionality for a clinic
   * @param {string} clinicId - Clinic ID
   * @param {number} maxBranches - Maximum number of branches allowed
   * @returns {Promise<void>}
   */
  async enableMultiBranch(
    clinicId: string,
    maxBranches: number = 5,
  ): Promise<void> {
    try {
      // Verify that the current user is a super admin
      const isSuperAdmin = await verifyIsSuperAdmin();

      if (!isSuperAdmin) {
        throw new Error(
          "Access denied. Only platform super admins can enable multi-branch functionality.",
        );
      }

      const docRef = doc(db, CLINICS_COLLECTION, clinicId);

      await updateDoc(docRef, {
        isMultiBranchEnabled: true,
        maxBranches,
        totalBranches: 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error enabling multi-branch:", error);
      throw error;
    }
  },

  /**
   * Disable multi-branch functionality for a clinic
   * @param {string} clinicId - Clinic ID
   * @returns {Promise<void>}
   */
  async disableMultiBranch(clinicId: string): Promise<void> {
    try {
      // Verify that the current user is a super admin
      const isSuperAdmin = await verifyIsSuperAdmin();

      if (!isSuperAdmin) {
        throw new Error(
          "Access denied. Only platform super admins can disable multi-branch functionality.",
        );
      }

      const docRef = doc(db, CLINICS_COLLECTION, clinicId);

      await updateDoc(docRef, {
        isMultiBranchEnabled: false,
        maxBranches: null,
        totalBranches: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error disabling multi-branch:", error);
      throw error;
    }
  },

  /**
   * Delete a clinic (simple - only clinic document)
   * @param {string} id - Clinic ID to delete
   * @returns {Promise<void>}
   * @deprecated Use deleteClinicWithAllData for comprehensive deletion
   */
  async deleteClinic(id: string): Promise<void> {
    try {
      const docRef = doc(db, CLINICS_COLLECTION, id);

      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting clinic:", error);
      throw error;
    }
  },

  /**
   * Comprehensively delete a clinic and ALL related data
   * This includes: users, branches, roles, patients, doctors, appointments, and all other clinic-specific data
   * @param {string} clinicId - Clinic ID to delete
   * @returns {Promise<{ deletedCounts: Record<string, number> }>} - Summary of deleted items
   */
  async deleteClinicWithAllData(
    clinicId: string,
  ): Promise<{ deletedCounts: Record<string, number> }> {
    try {
      // Verify that the current user is a super admin
      const isSuperAdmin = await verifyIsSuperAdmin();

      if (!isSuperAdmin) {
        throw new Error(
          "Access denied. Only platform super admins can delete clinics.",
        );
      }

      // Verify clinic exists
      const clinic = await this.getClinicById(clinicId);

      if (!clinic) {
        throw new Error("Clinic not found");
      }

      const deletedCounts: Record<string, number> = {};

      // Delete in batches for better performance and error handling
      console.log(
        `Starting comprehensive deletion of clinic: ${clinic.name} (${clinicId})`,
      );

      // Step 1: Delete User Role Assignments first (to avoid orphaned relationships)
      console.log("Deleting user role assignments...");
      const userRoleAssignmentsRef = collection(db, "user_role_assignments");
      const userRoleAssignmentsQuery = query(
        userRoleAssignmentsRef,
        where("clinicId", "==", clinicId),
      );
      const userRoleAssignmentsSnapshot = await getDocs(
        userRoleAssignmentsQuery,
      );

      let batch = writeBatch(db);
      let batchCount = 0;

      for (const doc of userRoleAssignmentsSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      deletedCounts.userRoleAssignments =
        userRoleAssignmentsSnapshot.docs.length;

      // Step 2: Delete Roles
      console.log("Deleting roles...");
      const rolesRef = collection(db, "roles");
      const rolesQuery = query(rolesRef, where("clinicId", "==", clinicId));
      const rolesSnapshot = await getDocs(rolesQuery);

      batch = writeBatch(db);
      batchCount = 0;

      for (const doc of rolesSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      deletedCounts.roles = rolesSnapshot.docs.length;

      // Step 3: Delete Medical Records Data
      console.log("Deleting medical records data...");
      const collections = [
        "medicalReportResponses",
        "patientNoteEntries",
        "patientNotes",
        "medical_report_fields",
        "notes_sections",
      ];

      for (const collectionName of collections) {
        try {
          console.log(`Processing collection: ${collectionName}`);
          const collectionRef = collection(db, collectionName);
          const collectionQuery = query(
            collectionRef,
            where("clinicId", "==", clinicId),
          );
          const collectionSnapshot = await getDocs(collectionQuery);

          batch = writeBatch(db);
          batchCount = 0;

          for (const doc of collectionSnapshot.docs) {
            batch.delete(doc.ref);
            batchCount++;

            if (batchCount >= 500) {
              await batch.commit();
              batch = writeBatch(db);
              batchCount = 0;
            }
          }

          if (batchCount > 0) {
            await batch.commit();
          }

          deletedCounts[collectionName] = collectionSnapshot.docs.length;
          console.log(
            `Deleted ${collectionSnapshot.docs.length} documents from ${collectionName}`,
          );
        } catch (error) {
          console.error(
            `Error deleting from collection ${collectionName}:`,
            error,
          );
          deletedCounts[collectionName] = 0;
          // Continue with other collections even if one fails
        }
      }

      // Step 4: Delete Medicine-related data
      console.log("Deleting medicine-related data...");
      const medicineCollections = [
        "stockTransactions",
        "medicineStock",
        "suppliers",
        "medicines",
        "medicineCategories",
        "medicineBrands",
      ];

      for (const collectionName of medicineCollections) {
        try {
          console.log(`Processing collection: ${collectionName}`);
          const collectionRef = collection(db, collectionName);
          const collectionQuery = query(
            collectionRef,
            where("clinicId", "==", clinicId),
          );
          const collectionSnapshot = await getDocs(collectionQuery);

          batch = writeBatch(db);
          batchCount = 0;

          for (const doc of collectionSnapshot.docs) {
            batch.delete(doc.ref);
            batchCount++;

            if (batchCount >= 500) {
              await batch.commit();
              batch = writeBatch(db);
              batchCount = 0;
            }
          }

          if (batchCount > 0) {
            await batch.commit();
          }

          deletedCounts[collectionName] = collectionSnapshot.docs.length;
          console.log(
            `Deleted ${collectionSnapshot.docs.length} documents from ${collectionName}`,
          );
        } catch (error) {
          console.error(
            `Error deleting from collection ${collectionName}:`,
            error,
          );
          deletedCounts[collectionName] = 0;
          // Continue with other collections even if one fails
        }
      }

      // Step 5: Delete Appointments (before patients and doctors)
      console.log("Deleting appointments...");
      const appointmentsRef = collection(db, "appointments");
      const appointmentsQuery = query(
        appointmentsRef,
        where("clinicId", "==", clinicId),
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);

      batch = writeBatch(db);
      batchCount = 0;

      for (const doc of appointmentsSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      deletedCounts.appointments = appointmentsSnapshot.docs.length;

      // Step 6: Delete other clinic-specific data
      console.log("Deleting other clinic data...");
      const otherCollections = [
        "appointment_types",
        "doctor_specialities",
        "patient_contacts",
        "patients",
        "doctors",
        "visitors",
        "callLogs",
        "clinicSettings",
        "invitations",
      ];

      for (const collectionName of otherCollections) {
        try {
          console.log(`Processing collection: ${collectionName}`);
          const collectionRef = collection(db, collectionName);
          const collectionQuery = query(
            collectionRef,
            where("clinicId", "==", clinicId),
          );
          const collectionSnapshot = await getDocs(collectionQuery);

          batch = writeBatch(db);
          batchCount = 0;

          for (const doc of collectionSnapshot.docs) {
            batch.delete(doc.ref);
            batchCount++;

            if (batchCount >= 500) {
              await batch.commit();
              batch = writeBatch(db);
              batchCount = 0;
            }
          }

          if (batchCount > 0) {
            await batch.commit();
          }

          deletedCounts[collectionName] = collectionSnapshot.docs.length;
          console.log(
            `Deleted ${collectionSnapshot.docs.length} documents from ${collectionName}`,
          );
        } catch (error) {
          console.error(
            `Error deleting from collection ${collectionName}:`,
            error,
          );
          deletedCounts[collectionName] = 0;
          // Continue with other collections even if one fails
        }
      }

      // Step 7: Delete Branches
      console.log("Deleting branches...");
      const branchesRef = collection(db, "branches");
      const branchesQuery = query(
        branchesRef,
        where("clinicId", "==", clinicId),
      );
      const branchesSnapshot = await getDocs(branchesQuery);

      batch = writeBatch(db);
      batchCount = 0;

      for (const doc of branchesSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      deletedCounts.branches = branchesSnapshot.docs.length;

      // Step 8: Delete Users (keep for last since they might be needed for authentication during deletion)
      console.log("Deleting users...");
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, where("clinicId", "==", clinicId));
      const usersSnapshot = await getDocs(usersQuery);

      batch = writeBatch(db);
      batchCount = 0;

      for (const doc of usersSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      deletedCounts.users = usersSnapshot.docs.length;

      // Step 9: Finally delete the clinic itself
      console.log("Deleting clinic document...");
      const clinicRef = doc(db, CLINICS_COLLECTION, clinicId);

      await deleteDoc(clinicRef);
      deletedCounts.clinic = 1;

      console.log(
        `Clinic deletion completed successfully. Summary:`,
        deletedCounts,
      );

      return { deletedCounts };
    } catch (error) {
      console.error("Error during comprehensive clinic deletion:", error);
      throw new Error(`Failed to delete clinic: ${error.message}`);
    }
  },

  /**
   * Get clinics by subscription status
   * @param {string} status - Subscription status to filter by
   * @returns {Promise<Clinic[]>} - Array of matching clinics
   */
  async getClinicsBySubscriptionStatus(
    status: "active" | "suspended" | "cancelled",
  ): Promise<Clinic[]> {
    try {
      const clinicsRef = collection(db, CLINICS_COLLECTION);
      const q = query(clinicsRef, where("subscriptionStatus", "==", status));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();
        const subscriptionStartDate = data.subscriptionStartDate
          ? new Date(data.subscriptionStartDate.seconds * 1000)
          : new Date();
        const subscriptionEndDate = data.subscriptionEndDate
          ? new Date(data.subscriptionEndDate.seconds * 1000)
          : undefined;

        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
          subscriptionStartDate,
          subscriptionEndDate,
        } as Clinic;
      });
    } catch (error) {
      console.error("Error getting clinics by subscription status:", error);
      throw error;
    }
  },

  /**
   * Get clinics by subscription plan
   * @param {string} planId - Subscription plan ID to filter by
   * @returns {Promise<Clinic[]>} - Array of matching clinics
   */
  async getClinicsBySubscriptionPlan(planId: string): Promise<Clinic[]> {
    try {
      const clinicsRef = collection(db, CLINICS_COLLECTION);
      const q = query(clinicsRef, where("subscriptionPlan", "==", planId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();
        const subscriptionStartDate = data.subscriptionStartDate
          ? new Date(data.subscriptionStartDate.seconds * 1000)
          : new Date();
        const subscriptionEndDate = data.subscriptionEndDate
          ? new Date(data.subscriptionEndDate.seconds * 1000)
          : undefined;

        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
          subscriptionStartDate,
          subscriptionEndDate,
        } as Clinic;
      });
    } catch (error) {
      console.error("Error getting clinics by subscription plan:", error);
      throw error;
    }
  },

  /**
   * Get clinics with expiring subscriptions (within 30 days)
   * @returns {Promise<Clinic[]>} - Array of clinics with expiring subscriptions
   */
  async getClinicsWithExpiringSubscriptions(): Promise<Clinic[]> {
    try {
      // Only super admins can query all clinics
      const isSuperAdmin = await verifyIsSuperAdmin();

      if (!isSuperAdmin) {
        throw new Error(
          "Access denied. Only super admins can query clinic subscription data.",
        );
      }

      const clinicsRef = collection(db, CLINICS_COLLECTION);
      const thirtyDaysFromNow = new Date();

      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const q = query(
        clinicsRef,
        where("subscriptionEndDate", "<=", thirtyDaysFromNow),
        where("subscriptionStatus", "==", "active"),
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();
        const subscriptionStartDate = data.subscriptionStartDate
          ? new Date(data.subscriptionStartDate.seconds * 1000)
          : new Date();
        const subscriptionEndDate = data.subscriptionEndDate
          ? new Date(data.subscriptionEndDate.seconds * 1000)
          : undefined;

        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
          subscriptionStartDate,
          subscriptionEndDate,
        } as Clinic;
      });
    } catch (error) {
      console.error(
        "Error getting clinics with expiring subscriptions:",
        error,
      );
      throw error;
    }
  },

  /**
   * Get print layout configuration for a clinic
   * @param {string} clinicId - Clinic ID
   * @returns {Promise<any | null>} - Print layout configuration or null if not found
   */
  async getPrintLayoutConfig(
    clinicId: string,
  ): Promise<PrintLayoutConfig | null> {
    try {
      const docRef = doc(db, "clinic_print_layouts", clinicId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();

        return {
          id: docSnap.id,
          ...data,
          createdAt,
          updatedAt,
        } as PrintLayoutConfig;
      }

      return null;
    } catch (error) {
      console.error("Error getting print layout config:", error);
      throw error;
    }
  },

  /**
   * Save print layout configuration for a clinic
   * @param {any} configData - Print layout configuration data
   * @returns {Promise<void>}
   */
  async savePrintLayoutConfig(configData: PrintLayoutConfig): Promise<void> {
    try {
      const docRef = doc(db, "clinic_print_layouts", configData.clinicId);

      // Filter out undefined values to avoid Firestore errors
      const cleanedConfigData = Object.fromEntries(
        Object.entries({
          ...configData,
          updatedAt: serverTimestamp(),
          createdAt: configData.createdAt || serverTimestamp(),
        }).filter(([_, value]) => value !== undefined),
      );

      await setDoc(docRef, cleanedConfigData, { merge: true });
    } catch (error) {
      console.error("Error saving print layout config:", error);
      throw error;
    }
  },

  /**
   * Delete print layout configuration for a clinic
   * @param {string} clinicId - Clinic ID
   * @returns {Promise<void>}
   */
  async deletePrintLayoutConfig(clinicId: string): Promise<void> {
    try {
      const docRef = doc(db, "clinic_print_layouts", clinicId);

      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting print layout config:", error);
      throw error;
    }
  },
};
