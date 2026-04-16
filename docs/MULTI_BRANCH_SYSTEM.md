# Multi-Branch Clinic System

## Overview

The Multi-Branch Clinic System allows a single clinic to manage multiple physical locations (branches) under one unified platform. This system provides hierarchical management with role-based access control and branch-level data isolation.

## System Architecture

### Role Hierarchy

```
Platform Super Admin
├── Clinic Super Admin (manages all branches of one clinic)
│   ├── Branch Admin (manages one specific branch)
│   │   ├── Doctor (branch-specific)
│   │   ├── Nurse (branch-specific)
│   │   ├── Receptionist (branch-specific)
│   │   └── Billing Staff (branch-specific)
│   └── Other Branch Admins...
└── Other Clinic Super Admins...
```

### Key Roles

1. **Platform Super Admin**
   - Manages the entire platform
   - Can enable/disable multi-branch feature for clinics
   - Has full access to all clinics and branches

2. **Clinic Super Admin**
   - Manages all branches of their clinic
   - Can create new branches
   - Can assign branch admins
   - Has overview access to all branch data
   - Cannot access other clinics

3. **Branch Admin (Clinic Admin)**
   - Manages one specific branch
   - Full control over branch operations
   - Cannot access other branches directly
   - Manages branch staff

4. **Branch Staff (Doctors, Nurses, etc.)**
   - Access limited to their assigned branch
   - Role-based permissions within the branch

## Data Models

### Updated Models for Multi-Branch Support

#### Clinic Model
```typescript
interface Clinic {
  id: string;
  name: string;
  // ... existing fields
  
  // Multi-branch fields
  isMultiBranchEnabled: boolean;
  totalBranches?: number;
  maxBranches?: number;
}
```

#### Branch Model
```typescript
interface Branch {
  id: string;
  clinicId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  isMainBranch: boolean;
  isActive: boolean;
  managerId?: string;
  operatingHours?: OperatingHours;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

#### User Model (Updated)
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  clinicId?: string; // null for super-admin
  branchId?: string; // null for clinic-super-admin and super-admin
  role: UserRole;
  // ... other fields
}
```

#### UserRole (Updated)
```typescript
type UserRole = 'super-admin' | 'clinic-super-admin' | 'clinic-admin' | 'doctor' | 'nurse' | 'receptionist' | 'billing-staff';
```

### Branch-Specific Models

All operational data models now include `branchId` for branch-level isolation:

- Patient
- Appointment
- Doctor
- Medicine inventory
- Medical records
- Visitor logs
- Call logs
- And more...

## Services

### BranchService

New service for managing branches:

```typescript
const branchService = {
  createBranch(branchData: Partial<Branch>): Promise<string>
  getBranchById(id: string): Promise<Branch | null>
  getClinicBranches(clinicId: string, activeOnly?: boolean): Promise<Branch[]>
  getMainBranch(clinicId: string): Promise<Branch | null>
  updateBranch(id: string, updateData: Partial<Branch>): Promise<void>
  deactivateBranch(id: string): Promise<void>
  setMainBranch(branchId: string): Promise<void>
  isMultiBranchEnabled(clinicId: string): Promise<boolean>
  createDefaultMainBranch(clinicId: string): Promise<string>
}
```

### Updated ClinicService

Extended with multi-branch functionality:

```typescript
// New methods
enableMultiBranch(clinicId: string, maxBranches?: number): Promise<void>
disableMultiBranch(clinicId: string): Promise<void>
```

### Updated RBACService

Enhanced with branch-level roles:

```typescript
// New methods
createDefaultClinicSuperAdminRole(clinicId: string): Promise<string>
createBranchRoles(clinicId: string, branchId: string): Promise<void>
```

## Implementation Guide

### 1. Enabling Multi-Branch for a Clinic

**IMPORTANT: Only Platform Super Admins can enable multi-branch functionality**

```typescript
// Platform super admin enables multi-branch (ROLE VERIFICATION ENFORCED)
await clinicService.enableMultiBranch(clinicId, 5); // Max 5 branches
await branchService.createDefaultMainBranch(clinicId);
await rbacService.createDefaultClinicSuperAdminRole(clinicId);

// The service automatically verifies the current user is a super admin
// Throws error if unauthorized: "Access denied. Only platform super admins can enable multi-branch functionality."
```

### 2. Creating a New Branch

```typescript
// Clinic super admin creates new branch
const branchData = {
  clinicId: 'clinic-123',
  name: 'Downtown Branch',
  code: 'DT',
  address: '123 Main St',
  city: 'Cityville',
  phone: '+1234567890',
  isMainBranch: false
};

const branchId = await branchService.createBranch(branchData);
await rbacService.createBranchRoles(clinicId, branchId);
```

### 3. Assigning Users to Branches

```typescript
// Assign a user to a specific branch
await userService.updateUser(userId, {
  branchId: 'branch-123',
  role: 'clinic-admin'
});

// Assign clinic-wide role (clinic super admin)
await userService.updateUser(userId, {
  branchId: null, // Clinic-wide access
  role: 'clinic-super-admin'
});
```

### 4. Data Filtering by Branch

```typescript
// Get patients for specific branch
const patients = await patientService.getBranchPatients(branchId);

// Get all patients for clinic (clinic super admin view)
const allPatients = await patientService.getClinicPatients(clinicId);
```

## Security Considerations

### Multi-Branch Access Control

**Platform Super Admin Exclusive Controls:**
- **Enable Multi-Branch**: ONLY platform super admins can enable multi-branch functionality for clinics
- **Disable Multi-Branch**: ONLY platform super admins can disable multi-branch functionality
- **Set Branch Limits**: Control maximum number of branches per clinic
- **Override Restrictions**: Bypass normal branch limitations when needed

### Data Isolation

1. **Branch-Level Isolation**: Users can only access data from their assigned branch
2. **Clinic-Level Access**: Clinic super admins can access all branch data within their clinic
3. **Cross-Clinic Prevention**: No access to other clinics' data
4. **Multi-Branch Gatekeeper**: Platform control prevents unauthorized multi-branch enablement

### Permission Checks

```typescript
// Example permission check middleware
const checkBranchAccess = async (userId: string, branchId: string) => {
  const user = await userService.getUserById(userId);
  
  if (user.role === 'super-admin') return true;
  if (user.role === 'clinic-super-admin' && user.clinicId === clinic.id) return true;
  if (user.branchId === branchId) return true;
  
  return false;
};

// Multi-branch control check
const checkMultiBranchControl = async (userId: string) => {
  const user = await userService.getUserById(userId);
  return user.role === 'super-admin'; // ONLY super admins
};
```

## Database Schema Changes

### Firestore Collections

```
clinics/
  - isMultiBranchEnabled: boolean
  - maxBranches: number
  - totalBranches: number

branches/
  - clinicId: string
  - name: string
  - code: string
  - isMainBranch: boolean
  - isActive: boolean

users/
  - clinicId: string (existing)
  - branchId: string (new)

patients/
  - clinicId: string (existing)
  - branchId: string (new)

// Similar updates for all operational collections
```

## Migration Strategy

### Existing Single-Branch Clinics

1. **Backward Compatibility**: Existing clinics continue to work without multi-branch
2. **Optional Migration**: Platform admin can enable multi-branch when needed
3. **Default Main Branch**: System automatically creates a "Main Branch" when enabled

### Migration Steps

```typescript
// For existing clinic
const clinicId = 'existing-clinic-123';

// 1. Enable multi-branch
await clinicService.enableMultiBranch(clinicId);

// 2. Create main branch with existing clinic data
const mainBranchId = await branchService.createDefaultMainBranch(clinicId);

// 3. Migrate existing data to main branch
await migrateExistingDataToBranch(clinicId, mainBranchId);

// 4. Update user roles
await updateExistingUsersForMultiBranch(clinicId, mainBranchId);
```

## Admin Interface

### Branch Management Tab

Added to the clinic detail page in admin panel:

- **Enable Multi-Branch**: Button to enable the feature
- **Branch List**: View all branches with status
- **Add Branch**: Create new branches
- **Edit Branch**: Modify branch details
- **Set Main Branch**: Designate primary branch

### Features

1. **Branch Overview**: List all branches with key information
2. **Branch Limits**: Display current vs maximum branches
3. **Status Management**: Activate/deactivate branches
4. **Main Branch**: Set and identify the primary branch

## API Endpoints

### Branch Management

```typescript
// GET /api/clinics/:clinicId/branches
// POST /api/clinics/:clinicId/branches
// PUT /api/branches/:branchId
// DELETE /api/branches/:branchId
// POST /api/branches/:branchId/set-main
```

### Multi-Branch Controls

```typescript
// POST /api/clinics/:clinicId/enable-multi-branch
// POST /api/clinics/:clinicId/disable-multi-branch
```

## Testing Strategy

### Unit Tests

1. **Service Layer**: Test all branch operations
2. **Permission Checks**: Verify role-based access
3. **Data Isolation**: Ensure branch data separation

### Integration Tests

1. **End-to-End Workflows**: Complete branch creation process
2. **User Role Assignment**: Test role assignments across branches
3. **Data Access**: Verify proper data filtering

### Test Cases

```typescript
describe('Multi-Branch System', () => {
  test('Clinic super admin can access all branch data', async () => {
    // Test implementation
  });
  
  test('Branch admin can only access their branch data', async () => {
    // Test implementation
  });
  
  test('Cannot access other clinic branches', async () => {
    // Test implementation
  });
});
```

## Future Enhancements

### Planned Features

1. **Branch-to-Branch Transfer**: Move patients/data between branches
2. **Consolidated Reporting**: Cross-branch analytics for clinic super admins
3. **Branch Templates**: Standardize branch setup with templates
4. **Inter-Branch Communication**: Internal messaging system
5. **Resource Sharing**: Share doctors/staff across branches

### Scalability Considerations

1. **Performance**: Optimize queries for large multi-branch clinics
2. **Caching**: Branch-specific data caching strategies
3. **Load Balancing**: Distribution across branches
4. **Monitoring**: Branch-level monitoring and alerts

## Conclusion

The Multi-Branch Clinic System provides a comprehensive solution for managing multiple clinic locations while maintaining proper access controls and data isolation. The system is designed for scalability and can handle clinics from single branches to complex multi-location organizations. 