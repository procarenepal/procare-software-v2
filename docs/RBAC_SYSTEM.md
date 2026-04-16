# Role-Based Access Control (RBAC) System

## Overview

This document describes the comprehensive RBAC system implemented for the multi-tenant clinic platform. The system provides fine-grained access control based on pages assigned to clinic types, allowing clinic administrators to manage user roles and permissions effectively.

## Architecture

### Core Components

1. **Enhanced RBAC Service** (`src/services/rbacService.ts`)
2. **Role Management UI** (`src/components/rbac/RoleManagement.tsx`)
3. **User Management UI** (`src/components/rbac/UserManagement.tsx`)
4. **Protected Route Component** (`src/components/rbac/ProtectedRoute.tsx`)
5. **Enhanced useAuth Hook** (`src/hooks/useAuth.ts`)
6. **Integrated Clinic Service** (`src/services/clinicService.ts`)

## Key Features

### 1. Page-Based Permissions
- Permissions are tied to specific pages
- Pages must first be assigned to clinic types by super admins
- Clinic admins can only assign permissions for pages available to their clinic type
- This ensures proper isolation between clinic types

### 2. Automatic Setup
When a new clinic is created:
- A default "Clinic Administrator" role is created with access to ALL available pages
- Other default roles are created (Doctor, Nurse, Receptionist, Billing Staff)
- A clinic admin user is automatically created and assigned the admin role
- The admin user receives a password reset email

### 3. Dual Role System
- **Legacy Roles**: Maintained for backward compatibility (`clinic-admin`, `doctor`, etc.)
- **RBAC Roles**: New granular roles with specific page permissions
- Users can have both a legacy role and multiple RBAC roles

## Database Structure

### Collections

#### `roles`
```typescript
{
  id: string;
  clinicId: string;
  name: string;
  description: string;
  permissions: string[]; // Array of page IDs
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `user_role_assignments`
```typescript
{
  userId: string;
  roleId: string;
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage Guide

### For Super Admins

1. **Assign Pages to Clinic Types**
   - Use the existing page assignment system
   - Pages assigned here become available for RBAC in clinics of that type

2. **Create Clinics with RBAC**
   ```typescript
   const result = await clinicService.createClinic(
     clinicData,
     'admin@clinic.com',
     'Admin Name'
   );
   ```

### For Clinic Admins

1. **Access RBAC Management**
   - Navigate to `/admin/rbac`
   - Two tabs: Role Management and User Management

2. **Create Custom Roles**
   - Click "Create Role"
   - Assign page permissions from available pages
   - Save the role

3. **Manage Users**
   - Create new users with email/name
   - Assign legacy role for compatibility
   - Assign RBAC roles for specific permissions
   - Activate/deactivate users as needed

### For Developers

#### Using Protected Routes

```tsx
import { ProtectedRoute } from '../components/rbac';

// Protect by page ID
<ProtectedRoute pageId="page-id">
  <YourComponent />
</ProtectedRoute>

// Protect by page path
<ProtectedRoute pagePath="/dashboard/patients">
  <YourComponent />
</ProtectedRoute>

// Require clinic admin
<ProtectedRoute requireClinicAdmin={true}>
  <AdminComponent />
</ProtectedRoute>

// Require super admin
<ProtectedRoute requireSuperAdmin={true}>
  <SuperAdminComponent />
</ProtectedRoute>
```

#### Checking Permissions in Components

```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { hasPagePermission } = useAuth();
  
  const handleAction = async () => {
    const canAccess = await hasPagePermission('page-id');
    if (canAccess) {
      // Perform action
    }
  };
}
```

#### Getting Accessible Pages

```tsx
import { useAuth } from '../hooks/useAuth';

function NavigationComponent() {
  const { getAccessiblePages } = useAuth();
  
  useEffect(() => {
    const loadPages = async () => {
      const pages = await getAccessiblePages();
      // Build navigation menu with accessible pages
    };
    loadPages();
  }, []);
}
```

## API Reference

### rbacService

#### Role Management
- `createRole(roleData)` - Create a new role
- `getRoleById(id)` - Get role by ID
- `getClinicRoles(clinicId)` - Get all roles for a clinic
- `updateRole(id, updateData)` - Update a role
- `deleteRole(id)` - Delete a role and assignments

#### Permission Management
- `getAvailablePagesForClinic(clinicId)` - Get pages available to a clinic
- `hasPagePermission(userId, clinicId, pageId)` - Check user page permission
- `getAccessiblePagesForUser(userId, clinicId)` - Get user's accessible pages

#### User Role Assignments
- `assignRolesToUser(userId, roleIds, clinicId)` - Assign roles to user
- `getUserRoleAssignments(userId, clinicId)` - Get user's role assignments
- `getClinicUsersWithRoles(clinicId)` - Get all users with their roles

#### Initialization
- `createDefaultClinicAdminRole(clinicId)` - Create default admin role
- `createDefaultClinicRoles(clinicId)` - Create default roles

### Enhanced useAuth Hook

New methods:
- `hasPagePermission(pageId): Promise<boolean>` - Check page access
- `getAccessiblePages(): Promise<Page[]>` - Get accessible pages

## Integration with Existing Systems

### Page Assignment System
- The RBAC system builds on top of the existing clinic type page assignment
- Super admins assign pages to clinic types
- Clinic admins create roles using those assigned pages
- This maintains proper isolation and prevents privilege escalation

### Legacy Role System
- Existing legacy roles are preserved for backward compatibility
- New RBAC roles work alongside legacy roles
- Migration path allows gradual adoption

### User Management
- Integrates with existing user service
- Maintains existing user creation and management flows
- Adds role assignment on top of existing functionality

## Security Considerations

1. **Isolation**: Clinics can only access pages assigned to their clinic type
2. **Least Privilege**: Users start with no RBAC roles and must be explicitly assigned
3. **Audit Trail**: All role assignments are tracked with timestamps
4. **Fail-Safe**: Permission checks default to denial if errors occur
5. **Super Admin Override**: Super admins maintain access to all functions

## Migration Strategy

1. **Phase 1**: Deploy RBAC system alongside existing permissions
2. **Phase 2**: Train clinic admins to use new role management
3. **Phase 3**: Gradually migrate users to RBAC roles
4. **Phase 4**: Deprecate legacy permission checks (optional)

## Troubleshooting

### Common Issues

1. **User can't access page despite role assignment**
   - Check if page is assigned to clinic type
   - Verify role has permission for the page
   - Ensure user has the role assigned

2. **Role creation fails**
   - Verify clinic admin permissions
   - Check if clinic exists and is active
   - Ensure page permissions are valid

3. **Permission checks are slow**
   - Consider caching strategies for frequently checked permissions
   - Implement permission preloading for critical paths

## Future Enhancements

1. **Permission Caching**: Implement Redis-based permission caching
2. **Advanced Permissions**: Add resource-level permissions (e.g., own patients only)
3. **Time-based Permissions**: Add role assignments with expiration dates
4. **Audit Logging**: Enhanced audit trail for all permission changes
5. **Bulk Operations**: Bulk user role assignments and management 