import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { db, auth } from "../config/firebase";
import { User, UserRole } from "../types/models";

const USERS_COLLECTION = "users";

/**
 * Service for managing user data in Firestore
 */
export const userService = {
  /**
   * Create a new user with Firebase Authentication and Firestore record
   * @param {string} email - User email
   * @param {string} password - Initial password
   * @param {Partial<User>} userData - Additional user data
   * @param {string} adminPassword - Password of the current admin user for re-authentication
   * @returns {Promise<string>} - ID of the created user
   */
  async createUser(
    email: string,
    password: string,
    userData: Partial<User>,
    adminPassword?: string,
  ): Promise<string> {
    try {
      // Store current admin information
      const currentUser = auth.currentUser;
      const adminEmail = currentUser?.email;

      if (!adminEmail) {
        throw new Error("No authenticated user found");
      }

      // If no admin password is provided, we're using the old behavior
      if (!adminPassword) {
        // For backward compatibility
        return this.createUserLegacy(email, password, userData);
      }

      // Create Firebase auth user (this automatically signs in as the new user)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      // Immediately sign out the newly created user
      await signOut(auth);

      // Sign back in as the admin
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      } catch (error) {
        throw new Error(
          "Failed to re-authenticate admin user. Please check your password.",
        );
      }

      // Now create user document in Firestore with admin privileges restored
      await setDoc(doc(db, USERS_COLLECTION, uid), {
        ...userData,
        email,
        id: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      });

      // Send password reset email so user sets their own password
      await sendPasswordResetEmail(auth, email);

      // Log user creation event
      try {
        const { auditLogService } = await import("./auditLogService");

        await auditLogService.logEvent(
          "user_created",
          userData.clinicId || "",
          {
            userId: uid,
            email,
            displayName: userData.displayName,
            role: userData.role,
            branchId: userData.branchId,
            isActive: true,
          },
          "success",
          undefined,
          {
            branchId: userData.branchId,
            targetUserId: uid,
          },
        );
      } catch (logError) {
        console.error("Failed to log user creation event:", logError);
      }

      return uid;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Error creating user:", error);

      // Extra debug logging to investigate email conflicts / collection state
      try {
        console.group(
          "[userService.createUser] Debug - Email conflict investigation",
        );
        console.log("Requested email:", email);
        console.log("User data passed:", userData);
        console.log("Firebase error code:", error?.code);

        // Inspect users collection for this email
        try {
          const usersRef = collection(db, USERS_COLLECTION);
          const qy = query(usersRef, where("email", "==", email));
          const snap = await getDocs(qy);

          console.log("[users collection] matching docs count:", snap.size);
          snap.docs.forEach((d) => {
            console.log("[users collection] doc id:", d.id, "data:", d.data());
          });
        } catch (usersDebugError) {
          console.warn(
            "[userService.createUser] Failed to inspect users collection for email:",
            usersDebugError,
          );
        }

        // Inspect doctors collection for this email (doctor-role users often mirror doctor emails)
        try {
          const {
            collection: dCollection,
            getDocs: dGetDocs,
            query: dQuery,
            where: dWhere,
          } = await import("firebase/firestore");
          const { db: dbInstance } = await import("../config/firebase");
          const doctorsRef = dCollection(dbInstance, "doctors");
          const dq = dQuery(
            doctorsRef,
            dWhere("email", "==", email.toLowerCase()),
          );
          const dSnap = await dGetDocs(dq);

          console.log("[doctors collection] matching docs count:", dSnap.size);
          dSnap.docs.forEach((d) => {
            console.log(
              "[doctors collection] doc id:",
              d.id,
              "data:",
              d.data(),
            );
          });
        } catch (doctorsDebugError) {
          console.warn(
            "[userService.createUser] Failed to inspect doctors collection for email:",
            doctorsDebugError,
          );
        }

        console.groupEnd();
      } catch (debugError) {
        console.warn(
          "[userService.createUser] Debug logging failed:",
          debugError,
        );
      }

      // Log user creation failure
      try {
        const { auditLogService } = await import("./auditLogService");

        await auditLogService.logEvent(
          "operation_failed",
          userData.clinicId || "",
          {
            operation: "user_created",
            email,
            displayName: userData.displayName,
            userData: userData,
          },
          "failure",
          errorMessage,
          {
            branchId: userData.branchId,
          },
        );
      } catch (logError) {
        console.error("Failed to log user creation failure:", logError);
      }

      throw error;
    }
  },

  /**
   * Legacy method for creating a user without maintaining admin session
   * @param {string} email - User email
   * @param {string} password - Initial password
   * @param {Partial<User>} userData - Additional user data
   * @returns {Promise<string>} - ID of the created user
   * @private
   */
  async createUserLegacy(
    email: string,
    password: string,
    userData: Partial<User>,
  ): Promise<string> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      // Create user document in Firestore
      await setDoc(doc(db, USERS_COLLECTION, uid), {
        ...userData,
        email,
        id: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      });

      // Send password reset email so user sets their own password
      await sendPasswordResetEmail(auth, email);

      return uid;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<User | null>} - User data or null if not found
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const docRef = doc(db, USERS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }

      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  },

  /**
   * Get all users for a specific clinic
   * @param {string} clinicId - ID of the clinic
   * @returns {Promise<User[]>} - Array of users in the clinic
   */
  async getClinicUsers(clinicId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("clinicId", "==", clinicId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as User,
      );
    } catch (error) {
      console.error("Error getting clinic users:", error);
      throw error;
    }
  },

  /**
   * Get all super admins
   * @returns {Promise<User[]>} - Array of super admin users
   */
  async getSuperAdmins(): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("role", "==", "super-admin"));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as User,
      );
    } catch (error) {
      console.error("Error getting super admins:", error);
      throw error;
    }
  },

  /**
   * Update a user's information
   * @param {string} id - User ID
   * @param {Partial<User>} updateData - Updated user data
   * @returns {Promise<void>}
   */
  async updateUser(id: string, updateData: Partial<User>): Promise<void> {
    try {
      // Get existing user data for logging
      const existingUser = await this.getUserById(id);

      if (!existingUser) {
        throw new Error("User not found");
      }

      const docRef = doc(db, USERS_COLLECTION, id);

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      // Log user update event
      try {
        const { auditLogService } = await import("./auditLogService");

        await auditLogService.logEvent(
          "user_updated",
          existingUser.clinicId || "",
          {
            userId: id,
            userEmail: existingUser.email,
            userName: existingUser.displayName,
            previousData: {
              displayName: existingUser.displayName,
              role: existingUser.role,
              isActive: existingUser.isActive,
            },
            updatedData: updateData,
          },
          "success",
          undefined,
          {
            branchId: existingUser.branchId,
            targetUserId: id,
          },
        );
      } catch (logError) {
        console.error("Failed to log user update event:", logError);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Error updating user:", error);

      // Log user update failure
      try {
        const existingUser = await this.getUserById(id);

        if (existingUser) {
          const { auditLogService } = await import("./auditLogService");

          await auditLogService.logEvent(
            "operation_failed",
            existingUser.clinicId || "",
            {
              operation: "user_updated",
              userId: id,
              userEmail: existingUser.email,
              userName: existingUser.displayName,
              updateData: updateData,
            },
            "failure",
            errorMessage,
            {
              branchId: existingUser.branchId,
              targetUserId: id,
            },
          );
        }
      } catch (logError) {
        console.error("Failed to log user update failure:", logError);
      }

      throw error;
    }
  },

  /**
   * Update a user's clinic assignment
   * @param {string} userId - User ID
   * @param {string} clinicId - New clinic ID
   * @returns {Promise<void>}
   */
  async updateUserClinic(userId: string, clinicId: string): Promise<void> {
    try {
      const docRef = doc(db, USERS_COLLECTION, userId);

      await updateDoc(docRef, {
        clinicId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user clinic:", error);
      throw error;
    }
  },

  /**
   * Activate or deactivate a user
   * @param {string} id - User ID
   * @param {boolean} isActive - Whether user should be active
   * @returns {Promise<void>}
   */
  async setUserActive(id: string, isActive: boolean): Promise<void> {
    try {
      const docRef = doc(db, USERS_COLLECTION, id);

      await updateDoc(docRef, {
        isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  },

  /**
   * Get all users for a specific clinic
   * @param {string} clinicId - Clinic ID
   * @returns {Promise<User[]>} - Array of users for the clinic
   */
  async getUsersByClinic(clinicId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("clinicId", "==", clinicId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          }) as User,
      );
    } catch (error) {
      console.error("Error getting clinic users:", error);
      throw error;
    }
  },

  /**
   * Update a user's role
   * @param {string} userId - User ID
   * @param {string} newRole - New role to assign
   * @returns {Promise<void>}
   */
  async updateUserRole(userId: string, newRole: string): Promise<void> {
    try {
      const docRef = doc(db, USERS_COLLECTION, userId);

      await updateDoc(docRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  /**
   * Deactivate a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deactivateUser(userId: string): Promise<void> {
    try {
      // Get existing user data for logging
      const existingUser = await this.getUserById(userId);

      if (!existingUser) {
        throw new Error("User not found");
      }

      const docRef = doc(db, USERS_COLLECTION, userId);

      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      // Log user deactivation event
      try {
        const { auditLogService } = await import("./auditLogService");

        await auditLogService.logEvent(
          "user_deactivated",
          existingUser.clinicId || "",
          {
            userId,
            userEmail: existingUser.email,
            userName: existingUser.displayName,
            role: existingUser.role,
          },
          "success",
          undefined,
          {
            branchId: existingUser.branchId,
            targetUserId: userId,
          },
        );
      } catch (logError) {
        console.error("Failed to log user deactivation event:", logError);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Error deactivating user:", error);

      // Log user deactivation failure
      try {
        const existingUser = await this.getUserById(userId);

        if (existingUser) {
          const { auditLogService } = await import("./auditLogService");

          await auditLogService.logEvent(
            "operation_failed",
            existingUser.clinicId || "",
            {
              operation: "user_deactivated",
              userId,
              userEmail: existingUser.email,
              userName: existingUser.displayName,
            },
            "failure",
            errorMessage,
            {
              branchId: existingUser.branchId,
              targetUserId: userId,
            },
          );
        }
      } catch (logError) {
        console.error("Failed to log user deactivation failure:", logError);
      }

      throw error;
    }
  },

  /**
   * Activate a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async activateUser(userId: string): Promise<void> {
    try {
      // Get existing user data for logging
      const existingUser = await this.getUserById(userId);

      if (!existingUser) {
        throw new Error("User not found");
      }

      const docRef = doc(db, USERS_COLLECTION, userId);

      await updateDoc(docRef, {
        isActive: true,
        updatedAt: serverTimestamp(),
      });

      // Log user activation event
      try {
        const { auditLogService } = await import("./auditLogService");

        await auditLogService.logEvent(
          "user_activated",
          existingUser.clinicId || "",
          {
            userId,
            userEmail: existingUser.email,
            userName: existingUser.displayName,
            role: existingUser.role,
          },
          "success",
          undefined,
          {
            branchId: existingUser.branchId,
            targetUserId: userId,
          },
        );
      } catch (logError) {
        console.error("Failed to log user activation event:", logError);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Error activating user:", error);

      // Log user activation failure
      try {
        const existingUser = await this.getUserById(userId);

        if (existingUser) {
          const { auditLogService } = await import("./auditLogService");

          await auditLogService.logEvent(
            "operation_failed",
            existingUser.clinicId || "",
            {
              operation: "user_activated",
              userId,
              userEmail: existingUser.email,
              userName: existingUser.displayName,
            },
            "failure",
            errorMessage,
            {
              branchId: existingUser.branchId,
              targetUserId: userId,
            },
          );
        }
      } catch (logError) {
        console.error("Failed to log user activation failure:", logError);
      }

      throw error;
    }
  },

  /**
   * Get all clinic admins
   * @returns {Promise<User[]>} - Array of clinic admin users
   */
  async getClinicAdmins(): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("role", "==", "clinic-admin"));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as User,
      );
    } catch (error) {
      console.error("Error getting clinic admins:", error);
      throw error;
    }
  },

  /**
   * Get user by email address
   * @param {string} email - User email
   * @returns {Promise<User | null>} - User data or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];

        return {
          id: doc.id,
          ...doc.data(),
        } as User;
      }

      return null;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  },

  /**
   * Get branch admin for a specific branch
   * @param {string} branchId - Branch ID
   * @returns {Promise<User | null>} - Branch admin user or null if not found
   */
  async getBranchAdmin(branchId: string): Promise<User | null> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(
        usersRef,
        where("branchId", "==", branchId),
        where("role", "==", "clinic-admin"),
        where("isActive", "==", true),
        limit(1),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];

        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as User;
      }

      return null;
    } catch (error) {
      console.error("Error getting branch admin:", error);
      throw error;
    }
  },

  /**
   * Create a branch admin user
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @param {string} displayName - Admin display name
   * @param {string} clinicId - Clinic ID
   * @param {string} branchId - Branch ID
   * @param {string} adminPassword - Current admin password for re-authentication
   * @returns {Promise<string>} - Created user ID
   */
  async createBranchAdmin(
    email: string,
    password: string,
    displayName: string,
    clinicId: string,
    branchId: string,
    adminPassword?: string,
  ): Promise<string> {
    try {
      const userData = {
        displayName,
        role: "clinic-admin" as UserRole,
        clinicId,
        branchId,
        isActive: true,
      };

      // Create the user first
      const userId = await this.createUser(
        email,
        password,
        userData,
        adminPassword,
      );

      // Import RBAC service to assign proper roles
      const { rbacService } = await import("./rbacService");

      // Check if clinic type has pages assigned, if not assign essential pages
      try {
        const availablePages =
          await rbacService.getAvailablePagesForClinic(clinicId);

        if (availablePages.length === 0) {
          console.warn(
            "No pages assigned to clinic type, attempting to assign essential pages",
          );

          // Import services for page assignment
          const { clinicService } = await import("./clinicService");
          const { clinicTypeService } = await import("./clinicTypeService");
          const { pageService } = await import("./pageService");

          // Get clinic and its type
          const clinic = await clinicService.getClinicById(clinicId);

          if (clinic) {
            // Get all available pages
            const allPages = await pageService.getAllPages();

            // Define essential pages that should be assigned by default
            const essentialPagePaths = [
              "/dashboard",
              "/dashboard/patients",
              "/dashboard/appointments",
              "/dashboard/doctors",
              "/dashboard/settings",
            ];

            const essentialPages = allPages.filter((page) =>
              essentialPagePaths.includes(page.path),
            );

            // Assign essential pages to the clinic type
            const { collection, doc, setDoc, Timestamp } = await import(
              "firebase/firestore"
            );
            const { db } = await import("../config/firebase");

            for (const page of essentialPages) {
              try {
                // Create clinic type page assignment directly
                const clinicTypePagesRef = collection(db, "clinic_type_pages");
                const assignmentDocRef = doc(clinicTypePagesRef);

                await setDoc(assignmentDocRef, {
                  id: assignmentDocRef.id,
                  clinicTypeId: clinic.clinicType,
                  pageId: page.id,
                  isEnabled: true,
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now(),
                });
              } catch (error) {
                console.warn(
                  `Failed to assign page ${page.name} to clinic type:`,
                  error,
                );
              }
            }
          }
        }
      } catch (error) {
        console.warn("Error checking/assigning clinic type pages:", error);
      }

      // Ensure branch-specific roles exist for this branch
      try {
        await rbacService.createBranchRoles(clinicId, branchId);
      } catch (error) {
        // If branch roles already exist, that's fine
        console.warn(
          "Branch roles may already exist or failed to create:",
          error,
        );
      }

      // Create or get the default clinic admin role for this clinic
      // Branch admins should have the same full access as regular clinic admins
      let adminRoleId: string;

      try {
        // First try to find existing "Clinic Administrator" role (full access)
        const existingRoles = await rbacService.getClinicRoles(clinicId);
        const fullAdminRole = existingRoles.find(
          (role) =>
            role.name === "Clinic Administrator" && !role.isBranchSpecific,
        );

        if (fullAdminRole) {
          adminRoleId = fullAdminRole.id;
        } else {
          // Create a new full access clinic admin role
          adminRoleId =
            await rbacService.createDefaultClinicAdminRole(clinicId);
        }
      } catch (error) {
        console.error(
          "Failed to get/create full admin role for branch admin:",
          error,
        );
        throw new Error(
          "Could not create or find clinic admin role with full access",
        );
      }

      // Assign the admin role to the user
      await rbacService.assignRolesToUser(userId, [adminRoleId], clinicId);

      return userId;
    } catch (error) {
      console.error("Error creating branch admin:", error);
      throw error;
    }
  },
};
