# ETag Cache System for Dashboard Navigation

## Overview

The ETag cache system has been implemented to optimize the dashboard sidebar navigation performance by caching navigation structures and only updating them when the underlying data changes.

## Architecture

### Core Components

1. **CacheService** (`src/services/cacheService.ts`)
   - Manages in-memory cache with ETag support
   - Handles cache invalidation and cleanup
   - Provides TTL (Time To Live) management

2. **NavigationService** (`src/services/navigationService.ts`)
   - Builds navigation structures based on user roles and permissions
   - Integrates with CacheService for ETag-based caching
   - Supports different navigation structures for different user types

3. **useNavigation Hook** (`src/hooks/useNavigation.ts`)
   - React hook for managing navigation state
   - Handles automatic refresh intervals
   - Provides cache invalidation utilities

4. **NavigationCacheUtils** (`src/utils/navigationCache.ts`)
   - Utility functions for cache invalidation
   - Used by other services to invalidate cache when data changes

## Features

### ETag-Based Caching
- Each navigation structure has a unique ETag generated from its content
- Client-side ETag comparison prevents unnecessary re-renders
- Cache invalidation happens only when data actually changes

### Role-Based Navigation
- **Super Admin**: Access to all pages globally
- **Clinic Super Admin**: Special clinic management pages + RBAC
- **Regular Users**: RBAC-filtered pages based on permissions

### Automatic Cache Management
- **TTL**: 5-minute default cache expiration
- **Auto-refresh**: Checks for updates every minute
- **Cleanup**: Removes expired cache entries every 10 minutes

### Cache Invalidation Triggers
- Page creation, update, or deletion
- Role/permission changes
- Clinic settings modifications
- Branch configuration changes

## Usage

### In Dashboard Layout

```tsx
// The dashboard now uses the useNavigation hook
const { navItems, loading, error, etag, fromCache, refreshNavigation } = useNavigation();
```

### Cache Invalidation in Services

```tsx
import { navigationCacheUtils } from '@/utils/navigationCache';

// When a page is modified
navigationCacheUtils.invalidatePageChanges();

// When user permissions change
navigationCacheUtils.invalidateUserPermissions(userId, clinicId, role);

// When clinic settings change
navigationCacheUtils.invalidateClinicSettings(clinicId);
```

## Benefits

1. **Performance**: Reduced API calls and faster navigation rendering
2. **Efficiency**: Only updates when data actually changes
3. **User Experience**: Instant navigation loading from cache
4. **Scalability**: Handles multiple users and clinics efficiently

## Cache Status Indicators

The dashboard now shows:
- **Cache Status**: "Cached" or "Fresh" indicator in sidebar footer
- **ETag Info**: Truncated ETag in refresh button tooltip
- **Loading States**: Skeleton loaders during fetch operations
- **Error Handling**: Fallback UI for cache/fetch errors

## Configuration

### Cache TTL
```tsx
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
```

### Refresh Intervals
```tsx
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
```

## Future Enhancements

1. **Persistent Cache**: Store cache in localStorage for offline support
2. **WebSocket Updates**: Real-time cache invalidation
3. **Selective Invalidation**: More granular cache invalidation
4. **Cache Metrics**: Performance monitoring and analytics
5. **Compressed ETags**: Reduce ETag size for better performance

## Technical Details

### ETag Generation
ETags are generated using a hash of the navigation data structure:
```tsx
private generateETag(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}
```

### Cache Key Structure
```
nav:{userId}:{clinicId}:{role}
```

### Cache Entry Structure
```tsx
interface CacheEntry<T> {
  data: T;
  etag: string;
  timestamp: number;
  ttl: number;
}
```

## Testing

To test the cache system:

1. **Load Dashboard**: First load should show "Fresh" status
2. **Refresh Navigation**: Should show "Cached" status if no changes
3. **Modify Pages**: Cache should invalidate and show "Fresh" status
4. **Role Changes**: Navigation should update when user roles change
5. **Multi-User**: Different users should have separate cache entries

## Monitoring

Check cache statistics in development:
```tsx
import { cacheService } from '@/services/cacheService';

console.log(cacheService.getCacheStats());
```

The ETag cache system provides a robust, efficient solution for dashboard navigation that scales with your application's growth while maintaining excellent user experience.
