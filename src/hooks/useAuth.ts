import { useState, useEffect, useCallback, useMemo } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../config/firebase";
import { User } from "../types/models";
import { subscriptionMonitorService } from "../services/subscriptionMonitorService";
import { onInvalidation } from "../services/invalidationChannel";
import { userService } from "../services/userService";

// Extended user type that includes Firebase user and our custom user data
interface ExtendedUser extends FirebaseUser {
  clinicId?: string;
  role?: string;
  isActive?: boolean;
  userData?: User;
}

export function useAuth(options: { dataOnly?: boolean } = {}) {
  const { dataOnly = false } = options;

  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [userClaims, setUserClaims] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  // Added optimization state
  const [subscriptionValid, setSubscriptionValid] = useState<boolean | null>(
    null,
  );
  const [subscriptionLastChecked, setSubscriptionLastChecked] = useState<
    number | null
  >(null);
  const [permissionsReady, setPermissionsReady] = useState<boolean>(false);

  // Register new user - this is typically only used by admins in this system
  const register = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Login existing user
  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout current user
  const logout = async () => {
    // Stop subscription monitoring before logout
    subscriptionMonitorService.stopMonitoring();

    return signOut(auth);
  };

  // Get the user data from Firestore
  const getUserData = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDoc.data() as User;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);

      return null;
    }
  };

  // Check if the user has admin permissions for a clinic
  const isClinicAdmin = useCallback((): boolean => {
    return (
      (userData?.role === "clinic-admin" ||
        userData?.role === "clinic-super-admin") &&
      Boolean(userData?.clinicId)
    );
  }, [userData?.role, userData?.clinicId]);

  // Check if the user is a super admin
  const isSuperAdmin = useCallback((): boolean => {
    return userData?.role === "super-admin";
  }, [userData?.role]);

  // Check if the user has permission to access a specific page
  const hasPagePermission = useCallback(
    async (pageId: string): Promise<boolean> => {
      if (userData?.role === "super-admin") {
        return true; // Super admin has all permissions
      }

      if (!currentUser || !clinicId) {
        return false;
      }

      try {
        const { rbacService } = await import("../services/rbacService");

        return await rbacService.hasPagePermission(
          currentUser.uid,
          clinicId,
          pageId,
        );
      } catch (error) {
        console.error("Error checking page permission:", error);

        return false;
      }
    },
    [currentUser, clinicId, userData?.role],
  );

  // Synchronous cache-only permission check (returns null if not cached yet)
  const hasPagePermissionSync = useCallback(
    (pageId: string): boolean | null => {
      if (userData?.role === "super-admin") return true;
      if (!currentUser || !clinicId) return false;
      try {
        const { cacheService } = require("../services/cacheService");
        const perms = cacheService.getUserPermissions(
          currentUser.uid,
          clinicId,
        );

        if (!perms) return null;

        return perms.pagePermissions.get(pageId) ?? false;
      } catch {
        return null;
      }
    },
    [currentUser, clinicId, userData?.role],
  );

  // Check if the user has permission to access a specific page by path (faster cached version)
  const hasPagePermissionByPath = useCallback(
    async (pagePath: string): Promise<boolean> => {
      if (userData?.role === "super-admin") {
        return true; // Super admin has all permissions
      }

      if (!currentUser || !clinicId) {
        return false;
      }

      try {
        const { rbacService } = await import("../services/rbacService");
        const pageId = await rbacService.getPageIdByPath(
          currentUser.uid,
          clinicId,
          pagePath,
        );

        if (!pageId) {
          return false;
        }

        return await rbacService.hasPagePermission(
          currentUser.uid,
          clinicId,
          pageId,
        );
      } catch (error) {
        console.error("Error checking page permission by path:", error);

        return false;
      }
    },
    [currentUser, clinicId, userData?.role],
  );

  // Preload user permissions for better performance
  const preloadPermissions = useCallback(async (): Promise<void> => {
    if (userData?.role === "super-admin" || !currentUser || !clinicId) {
      setPermissionsReady(true); // Super admin treats as ready immediately

      return; // Super admin doesn't need RBAC, or no user/clinic
    }

    try {
      const { rbacService } = await import("../services/rbacService");

      await rbacService.preloadUserPermissions(currentUser.uid, clinicId);
      setPermissionsReady(true);
    } catch (error) {
      console.error("Error preloading user permissions:", error);
      setPermissionsReady(false);
    }
  }, [currentUser, clinicId, userData?.role]);

  // Check clinic subscription status
  const checkClinicSubscription = useCallback(async (): Promise<boolean> => {
    if (userData?.role === "super-admin" || !userData?.clinicId) {
      setSubscriptionValid(true);
      setSubscriptionLastChecked(Date.now());

      return true; // Super admin or no clinic - always allow
    }

    try {
      const { clinicService } = await import("../services/clinicService");
      const clinic = await clinicService.getClinicById(userData.clinicId);

      if (!clinic) {
        return false; // Clinic not found
      }

      // Check if subscription is suspended, cancelled or expired
      const isSubscriptionSuspended = clinic.subscriptionStatus === "suspended";
      const isSubscriptionCancelled = clinic.subscriptionStatus === "cancelled";
      const isSubscriptionExpired =
        clinic.subscriptionEndDate &&
        new Date(clinic.subscriptionEndDate) < new Date();

      const valid =
        !isSubscriptionSuspended &&
        !isSubscriptionCancelled &&
        !isSubscriptionExpired;

      setSubscriptionValid(valid);
      setSubscriptionLastChecked(Date.now());

      return valid;
    } catch (error) {
      console.error("Error checking clinic subscription:", error);
      setSubscriptionValid(true);
      setSubscriptionLastChecked(Date.now());

      return true; // Default to allowing access if check fails
    }
  }, [userData?.role, userData?.clinicId]);

  // Get accessible pages for the current user
  const getAccessiblePages = useCallback(async (): Promise<any[]> => {
    if (userData?.role === "super-admin") {
      // Super admin can access all pages
      try {
        const { pageService } = await import("../services/pageService");

        return await pageService.getAllPages();
      } catch (error) {
        console.error("Error getting all pages for super admin:", error);

        return [];
      }
    }

    if (!currentUser || !clinicId) {
      return [];
    }

    try {
      const { rbacService } = await import("../services/rbacService");

      return await rbacService.getAccessiblePagesForUser(
        currentUser.uid,
        clinicId,
      );
    } catch (error) {
      console.error("Error getting accessible pages:", error);

      return [];
    }
  }, [currentUser, clinicId, userData?.role]);

  // Update profile information (name, phone, photoURL)
  const updateProfileInfo = async (data: {
    displayName?: string;
    phone?: string;
    photoURL?: string;
  }) => {
    if (!currentUser) throw new Error("No user logged in");

    try {
      // 1. Update Firebase Auth Profile (for displayName and photoURL)
      if (data.displayName || data.photoURL) {
        await updateProfile(currentUser, {
          displayName: data.displayName || currentUser.displayName,
          photoURL: data.photoURL || currentUser.photoURL,
        });
      }

      // 2. Update Firestore User Document
      await userService.updateUser(currentUser.uid, {
        displayName: data.displayName,
        phone: data.phone,
        photoURL: data.photoURL,
      });

      // 3. Update Local State for immediate UI feedback
      const updatedUserData = { ...userData, ...data } as User;

      setUserData(updatedUserData);

      const updatedCurrentUser = { ...currentUser, ...data } as ExtendedUser;

      updatedCurrentUser.userData = updatedUserData;
      setCurrentUser(updatedCurrentUser);

      return { success: true };
    } catch (error) {
      console.error("Error updating profile info:", error);
      throw error;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    if (dataOnly) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const isImpersonating =
        localStorage.getItem("isImpersonating") === "true";

      if (firebaseUser) {
        try {
          // Get the ID token result which contains custom claims
          const idTokenResult = await firebaseUser.getIdTokenResult();

          setUserClaims(idTokenResult.claims);

          // Fetch additional user data from Firestore
          const userDataFromFirestore = await getUserData(firebaseUser.uid);

          if (userDataFromFirestore) {
            // Check if user is active (but skip if in impersonation mode)
            if (!userDataFromFirestore.isActive && !isImpersonating) {
              // If user is inactive, sign them out (unless we're impersonating them)
              await signOut(auth);
              setCurrentUser(null);
              setUserData(null);
              setClinicId(null);
              setLoading(false);

              return;
            }

            // Check clinic subscription status for non-super-admin users (but skip if impersonating)
            if (
              userDataFromFirestore.role !== "super-admin" &&
              userDataFromFirestore.clinicId &&
              !isImpersonating
            ) {
              try {
                const { clinicService } = await import(
                  "../services/clinicService"
                );
                const clinic = await clinicService.getClinicById(
                  userDataFromFirestore.clinicId,
                );

                if (clinic) {
                  // Check if subscription is suspended, cancelled or expired
                  const isSubscriptionSuspended =
                    clinic.subscriptionStatus === "suspended";
                  const isSubscriptionCancelled =
                    clinic.subscriptionStatus === "cancelled";
                  const isSubscriptionExpired =
                    clinic.subscriptionEndDate &&
                    new Date(clinic.subscriptionEndDate) < new Date();

                  if (
                    isSubscriptionSuspended ||
                    isSubscriptionCancelled ||
                    isSubscriptionExpired
                  ) {
                    // Sign out users from clinics with suspended/cancelled/expired subscriptions
                    await signOut(auth);
                    setCurrentUser(null);
                    setUserData(null);
                    setClinicId(null);
                    setSubscriptionValid(false);
                    setSubscriptionLastChecked(Date.now());
                    setLoading(false);

                    return;
                  }
                  setSubscriptionValid(true);
                  setSubscriptionLastChecked(Date.now());
                }
              } catch (error) {
                console.error(
                  "Error checking clinic subscription status:",
                  error,
                );
                // Continue with login if clinic check fails (don't block access due to technical error)
                setSubscriptionValid(true);
                setSubscriptionLastChecked(Date.now());
              }
            } else {
              setSubscriptionValid(true);
              setSubscriptionLastChecked(Date.now());
            }

            // Create extended user object
            const extendedUser = firebaseUser as ExtendedUser;

            extendedUser.clinicId = userDataFromFirestore.clinicId;
            extendedUser.role = userDataFromFirestore.role;
            extendedUser.isActive = userDataFromFirestore.isActive;
            extendedUser.userData = userDataFromFirestore;
            // Set user data and preload permissions
            setCurrentUser(extendedUser);
            setUserData(userDataFromFirestore);
            setClinicId(userDataFromFirestore.clinicId || null);

            // Start subscription monitoring for non-super-admin users
            if (
              userDataFromFirestore.role !== "super-admin" &&
              userDataFromFirestore.clinicId
            ) {
              subscriptionMonitorService.startMonitoring(
                userDataFromFirestore.clinicId,
                userDataFromFirestore.role,
              );
            }

            // Preload permissions after setting user data (but don't wait for it)
            // Only preload for non-super-admin users with a clinic
            if (
              userDataFromFirestore.role !== "super-admin" &&
              userDataFromFirestore.clinicId
            ) {
              // Use setTimeout to not block the auth state change
              setTimeout(async () => {
                try {
                  const { rbacService } = await import(
                    "../services/rbacService"
                  );

                  await rbacService.preloadUserPermissions(
                    firebaseUser.uid,
                    userDataFromFirestore.clinicId,
                  );
                  setPermissionsReady(true);
                } catch (error) {
                  console.error(
                    "Error preloading permissions after auth:",
                    error,
                  );
                  setPermissionsReady(false);
                }
              }, 100); // Small delay to let auth state settle
            }
          } else {
            // User exists in Firebase Auth but not in Firestore
            if (isImpersonating) {
              // Clear impersonation flags and sign out
              localStorage.removeItem("isImpersonating");
              localStorage.removeItem("impersonatingAdminId");
              await signOut(auth);
              setCurrentUser(null);
              setUserData(null);
              setClinicId(null);
            } else {
              // Normal case - user exists in Firebase Auth but not in Firestore
              setCurrentUser(firebaseUser as ExtendedUser);
            }
          }
        } catch (error) {
          console.error("Error getting user claims:", error);
          setCurrentUser(firebaseUser as ExtendedUser);
        }
      } else {
        // No user is logged in - ensure subscription monitoring is stopped
        subscriptionMonitorService.stopMonitoring();

        setCurrentUser(null);
        setUserData(null);
        setClinicId(null);
        setSubscriptionValid(null);
        setPermissionsReady(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [dataOnly]);

  // Focus / visibility-based subscription revalidation (throttled)
  useEffect(() => {
    if (dataOnly) return;
    const MIN_INTERVAL = 3 * 60 * 1000; // 3 minutes

    function maybeRevalidate() {
      if (!currentUser || userData?.role === "super-admin") return;
      const now = Date.now();

      if (
        subscriptionLastChecked &&
        now - subscriptionLastChecked < MIN_INTERVAL
      )
        return;
      checkClinicSubscription();
    }
    function onFocus() {
      maybeRevalidate();
    }
    function onVisibility() {
      if (document.visibilityState === "visible") maybeRevalidate();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    dataOnly,
    currentUser,
    userData?.role,
    subscriptionLastChecked,
    checkClinicSubscription,
  ]);

  // Listen for cross-tab permission invalidations
  useEffect(() => {
    if (dataOnly || !currentUser || !clinicId) return;
    const off = onInvalidation((msg) => {
      if (msg.type === "permissions-invalidated" && msg.clinicId === clinicId) {
        if (msg.userIds && !msg.userIds.includes(currentUser.uid)) return;
        (async () => {
          try {
            const { rbacService } = await import("../services/rbacService");

            await rbacService.clearUserPermissionsCache(
              currentUser.uid,
              clinicId,
            );
            setPermissionsReady(false);
            await rbacService.preloadUserPermissions(currentUser.uid, clinicId);
            setPermissionsReady(true);
          } catch (e) {
            console.error("Error handling permission invalidation", e);
          }
        })();
      }
    });

    return () => {
      off();
    };
  }, [dataOnly, currentUser, clinicId]);

  // Memoize the return value to prevent unnecessary re-renders in consumers
  return useMemo(
    () => ({
      currentUser,
      userData,
      userClaims,
      isLoading: loading,
      clinicId,
      subscriptionValid,
      subscriptionLastChecked,
      permissionsReady,
      register,
      login,
      logout,
      getUserData,
      isClinicAdmin,
      isSuperAdmin,
      hasPagePermission,
      hasPagePermissionSync,
      hasPagePermissionByPath,
      preloadPermissions,
      getAccessiblePages,
      checkClinicSubscription,
      updateProfileInfo,
    }),
    [
      currentUser,
      userData,
      userClaims,
      loading,
      clinicId,
      subscriptionValid,
      subscriptionLastChecked,
      permissionsReady,
      isClinicAdmin,
      isSuperAdmin,
      hasPagePermission,
      hasPagePermissionSync,
      hasPagePermissionByPath,
      preloadPermissions,
      getAccessiblePages,
      checkClinicSubscription,
    ],
  );
}
