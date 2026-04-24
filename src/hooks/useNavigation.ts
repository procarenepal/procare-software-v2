// src/hooks/useNavigation.ts
import { useState, useEffect, useCallback } from "react";

import { navigationService, NavItem } from "@/services/navigationService";
import { useAuthContext } from "@/context/AuthContext";

export interface NavigationState {
  navItems: NavItem[];
  loading: boolean;
  error: string | null;
  etag: string | null;
  lastRefresh: number;
  fromCache: boolean;
}

export const useNavigation = () => {
  const { currentUser, userData, clinicId } = useAuthContext();
  const [state, setState] = useState<NavigationState>({
    navItems: [],
    loading: true,
    error: null,
    etag: null,
    lastRefresh: 0,
    fromCache: false,
  });

  // Load navigation items
  const loadNavigation = useCallback(
    async (forceRefresh = false) => {
      if (!currentUser || !clinicId || !userData?.role) {
        setState((prev) => ({ ...prev, loading: false }));

        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = forceRefresh
          ? await navigationService.refreshNavigation(
              currentUser.uid,
              clinicId,
              userData.role,
            )
          : await navigationService.getNavigationItems(
              currentUser.uid,
              clinicId,
              userData.role,
              state.etag || undefined,
            );

        setState((prev) => ({
          ...prev,
          navItems: result.navItems,
          etag: result.etag,
          lastRefresh: Date.now(),
          fromCache: result.fromCache,
          loading: false,
          error: null,
        }));
      } catch (error) {
        console.error("Error loading navigation:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load navigation",
        }));
      }
    },
    [currentUser, clinicId, userData?.role, state.etag],
  );

  // Refresh navigation (bypass cache)
  const refreshNavigation = useCallback(() => {
    return loadNavigation(true);
  }, [loadNavigation]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    if (currentUser && clinicId && userData?.role) {
      navigationService.invalidateUserCache(
        currentUser.uid,
        clinicId,
        userData.role,
      );
    }
  }, [currentUser, clinicId, userData?.role]);

  // Check if navigation needs refresh (every 5 minutes)
  useEffect(() => {
    const checkForRefresh = () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - state.lastRefresh;
      const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

      if (timeSinceLastRefresh > REFRESH_INTERVAL && !state.loading) {
        loadNavigation();
      }
    };

    const interval = setInterval(checkForRefresh, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [state.lastRefresh, state.loading, loadNavigation]);

  // Initial load
  useEffect(() => {
    loadNavigation();
  }, [loadNavigation]);

  return {
    ...state,
    refreshNavigation,
    invalidateCache,
    reload: loadNavigation,
  };
};
