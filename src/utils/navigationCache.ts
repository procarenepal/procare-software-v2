// src/utils/navigationCache.ts
import { navigationService } from "@/services/navigationService";

/**
 * Utility functions for managing navigation cache invalidation
 */
export const navigationCacheUtils = {
  /**
   * Invalidate navigation cache when user permissions change
   */
  invalidateUserPermissions: (
    userId: string,
    clinicId: string,
    role: string,
  ) => {
    navigationService.invalidateUserCache(userId, clinicId, role);
  },

  /**
   * Invalidate navigation cache when clinic settings change
   */
  invalidateClinicSettings: (clinicId: string) => {
    navigationService.invalidateClinicCache(clinicId);
  },

  /**
   * Invalidate navigation cache when pages are modified
   */
  invalidatePageChanges: (clinicId?: string) => {
    if (clinicId) {
      navigationService.invalidateClinicCache(clinicId);
    }
    // For super admin changes, we might need to invalidate all caches
    // but for now, we'll handle this per clinic
  },

  /**
   * Invalidate navigation cache when roles/permissions are modified
   */
  invalidateRolePermissions: (clinicId: string) => {
    navigationService.invalidateClinicCache(clinicId);
  },

  /**
   * Invalidate navigation cache when branch settings change
   */
  invalidateBranchSettings: (clinicId: string) => {
    navigationService.invalidateClinicCache(clinicId);
  },
};

/**
 * Hook to use navigation cache utilities
 */
export const useNavigationCacheUtils = () => {
  return navigationCacheUtils;
};
