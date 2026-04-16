# RBAC Implementation Example

This document provides a practical example of implementing the RBAC system in your application.

## Example: Protecting a Patient Management Page

Here's how to implement the RBAC system for a patient management page:

### 1. Using ProtectedRoute Wrapper

```tsx
// src/pages/dashboard/patients/index.tsx
import React from 'react';
import { ProtectedRoute } from '../../../components/rbac';
import { PatientList } from '../../../components/patients/PatientList';

export default function PatientsPage() {
  return (
    <ProtectedRoute pagePath="/dashboard/patients">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Patient Management</h1>
        <PatientList />
      </div>
    </ProtectedRoute>
  );
}
```

### 2. Checking Permissions in Components

```tsx
// src/components/patients/PatientList.tsx
import React, { useState, useEffect } from 'react';
import { Button, Table } from '@heroui/react';
import { PlusIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PatientCreateModal } from './PatientCreateModal';

export const PatientList: React.FC = () => {
  const { hasPagePermission } = useAuth();
  const [canCreatePatients, setCanCreatePatients] = useState(false);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const checkPermissions = async () => {
      // Check if user can create patients (might be a different page/permission)
      const createPermission = await hasPagePermission('patients-create-page-id');
      setCanCreatePatients(createPermission);
    };

    checkPermissions();
  }, [hasPagePermission]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Patients</h2>
        {canCreatePatients && (
          <Button color="primary" startContent={<PlusIcon size={16} />}>
            Add Patient
          </Button>
        )}
      </div>
      
      {/* Patient table implementation */}
      <Table>
        {/* Table content */}
      </Table>
    </div>
  );
};
```

### 3. Dynamic Navigation Based on Permissions

```tsx
// src/components/navigation/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Page } from '../../types/models';

export const Sidebar: React.FC = () => {
  const { getAccessiblePages, isSuperAdmin } = useAuth();
  const [accessiblePages, setAccessiblePages] = useState<Page[]>([]);

  useEffect(() => {
    const loadPages = async () => {
      if (isSuperAdmin()) {
        // Super admin sees all pages
        const { pageService } = await import('../../services/pageService');
        const allPages = await pageService.getAllPages();
        setAccessiblePages(allPages);
      } else {
        // Regular users see only accessible pages
        const pages = await getAccessiblePages();
        setAccessiblePages(pages);
      }
    };

    loadPages();
  }, [getAccessiblePages, isSuperAdmin]);

  return (
    <nav className="space-y-2">
      {accessiblePages
        .filter(page => page.showInSidebar)
        .map(page => (
          <a
            key={page.id}
            href={page.path}
            className="block px-4 py-2 rounded-md hover:bg-gray-100"
          >
            {page.name}
          </a>
        ))}
    </nav>
  );
};
```

### 4. Setting Up RBAC in Existing Clinic Creation

```tsx
// src/pages/admin/clinics/new.tsx
import React, { useState } from 'react';
import { Button, Input, Card, CardBody } from '@heroui/react';
import { clinicService } from '../../../services/clinicService';
import toast from 'react-hot-toast';

export default function NewClinicPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    adminEmail: '',
    adminName: '',
    clinicType: '',
    // ... other fields
  });

  const handleSubmit = async () => {
    try {
      // Create clinic with RBAC setup
      const result = await clinicService.createClinic(
        {
          name: formData.name,
          email: formData.email,
          clinicType: formData.clinicType,
          // ... other clinic data
        },
        formData.adminEmail,  // Admin email for RBAC setup
        formData.adminName    // Admin name for RBAC setup
      );

      if (typeof result === 'object') {
        toast.success(
          `Clinic created successfully! Admin user created with ID: ${result.adminUserId}`
        );
      } else {
        toast.success('Clinic created successfully!');
      }
    } catch (error) {
      toast.error('Failed to create clinic');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardBody className="space-y-4">
        <h1 className="text-2xl font-bold">Create New Clinic</h1>
        
        <Input
          label="Clinic Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        
        <Input
          label="Clinic Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />

        {/* RBAC Setup Fields */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Administrator Setup</h3>
          
          <Input
            label="Admin Email"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
            description="The clinic administrator will receive login credentials"
          />
          
          <Input
            label="Admin Name"
            value={formData.adminName}
            onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
          />
        </div>

        <Button color="primary" onPress={handleSubmit}>
          Create Clinic
        </Button>
      </CardBody>
    </Card>
  );
}
```

### 5. Adding RBAC Link to Admin Navigation

```tsx
// src/components/admin/AdminNavigation.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export const AdminNavigation: React.FC = () => {
  const { isClinicAdmin, isSuperAdmin } = useAuth();

  return (
    <nav className="space-y-2">
      {isSuperAdmin() && (
        <>
          <a href="/admin/clinics">Clinic Management</a>
          <a href="/admin/clinic-types">Clinic Types</a>
          <a href="/admin/system/pages">Page Management</a>
        </>
      )}
      
      {isClinicAdmin() && (
        <>
          <a href="/admin/settings">Clinic Settings</a>
          <a href="/admin/rbac">Role & User Management</a>
          <a href="/admin/staff">Staff Management</a>
        </>
      )}
    </nav>
  );
};
```

## Testing the Implementation

### 1. Create a Test Clinic

```typescript
// In your admin panel or script
const testClinic = await clinicService.createClinic(
  {
    name: 'Test Clinic',
    email: 'test@clinic.com',
    clinicType: 'general-clinic',
    city: 'Test City',
    phone: '123-456-7890',
    subscriptionPlan: 'basic',
    subscriptionType: 'monthly'
  },
  'admin@testclinic.com',
  'Test Admin'
);
```

### 2. Verify RBAC Setup

1. Check that roles were created in Firestore
2. Verify admin user was created
3. Test login with admin credentials
4. Access the RBAC management page at `/admin/rbac`

### 3. Test Permission Flow

1. Create a custom role with limited permissions
2. Create a test user and assign the custom role
3. Login as the test user
4. Verify they can only access permitted pages

## Common Integration Patterns

### Pattern 1: Conditional Rendering
```tsx
const [canEdit, setCanEdit] = useState(false);

useEffect(() => {
  hasPagePermission('edit-page-id').then(setCanEdit);
}, []);

return (
  <div>
    <ViewComponent />
    {canEdit && <EditComponent />}
  </div>
);
```

### Pattern 2: Route-Level Protection
```tsx
// In your router setup
<Route path="/dashboard/patients" element={
  <ProtectedRoute pageId="patients-page-id">
    <PatientsPage />
  </ProtectedRoute>
} />
```

### Pattern 3: Action-Level Protection
```tsx
const handleDelete = async () => {
  const canDelete = await hasPagePermission('delete-page-id');
  if (!canDelete) {
    toast.error('You do not have permission to delete');
    return;
  }
  
  // Proceed with deletion
};
```

This implementation provides a complete, production-ready RBAC system that integrates seamlessly with your existing application while maintaining security and usability. 