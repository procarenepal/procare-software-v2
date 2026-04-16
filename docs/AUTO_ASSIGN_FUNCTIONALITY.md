# Auto-Assign Functionality for System Pages

## Overview

The auto-assign functionality allows system administrators to configure pages that should be automatically assigned to new clinic types when they are created. This streamlines the setup process for new clinic types by ensuring essential pages are available by default.

## How It Works

### 1. Page Configuration
- Each page in the system now has an optional `autoAssign` boolean field
- When `autoAssign` is set to `true`, the page will be automatically assigned to any new clinic types created
- This setting can be toggled when creating or editing pages in the admin interface

### 2. Automatic Assignment Process
- When a new clinic type is created, the system automatically:
  1. Queries all pages where `autoAssign = true` and `isActive = true`
  2. Creates `clinic_type_pages` relationships for each auto-assign page
  3. Sets `isEnabled = true` for all auto-assigned pages

### 3. Manual Override
- Clinic type administrators can still manually enable/disable auto-assigned pages
- Auto-assignment only happens during clinic type creation
- Existing assignments are preserved even if a page's auto-assign status changes

## Database Structure

### Pages Collection
```typescript
interface Page {
  id: string;
  name: string;
  path: string;
  description: string;
  icon?: string;
  isActive: boolean;
  order: number;
  autoAssign?: boolean; // NEW FIELD
  createdAt: Date;
  updatedAt: Date;
}
```

### Auto-Assignment Logic
```typescript
// When creating a new clinic type
const autoAssignPages = await pageService.getPagesForAutoAssign();
await pageService.autoAssignPagesToClinicType(newClinicTypeId);
```

## User Interface

### System Pages Management
- Added "AUTO-ASSIGN" column to the pages table
- Shows "Yes" (primary) or "No" (default) for each page
- Modal form includes auto-assign checkbox with helpful description

### Clinic Type Pages Management
- Auto-assigned pages show "(Auto-assigned)" indicator
- These pages are automatically selected when the clinic type is first created
- Can still be manually toggled on/off as needed

## Default Auto-Assign Configuration

The following pages are set to auto-assign by default:
- ✅ Dashboard - Essential for all clinic types
- ✅ Patients - Patient management is core functionality  
- ✅ Appointments - Appointment scheduling is essential
- ✅ Billing - Financial management is typically needed
- ✅ Reports - Reporting is important for most clinics
- ✅ Settings - Configuration access is essential

The following pages are NOT auto-assigned by default:
- ❌ Doctors - Not all clinic types need doctor management
- ❌ Inventory - Not all clinics need inventory tracking

## Migration

For existing systems, run the migration script to add the autoAssign field:

```bash
npm run migrate:auto-assign
```

This script will:
- Add `autoAssign: false` to all existing pages by default
- Set `autoAssign: true` for essential pages (Dashboard, Patients, etc.)
- Preserve existing clinic type page assignments

## API Methods

### New Service Methods

```typescript
// Get pages marked for auto-assignment
pageService.getPagesForAutoAssign(): Promise<Page[]>

// Auto-assign pages to a new clinic type
pageService.autoAssignPagesToClinicType(clinicTypeId: string): Promise<void>

// Assign a page to all existing clinic types
pageService.assignPageToAllClinicTypes(pageId: string): Promise<void>
```

### Updated Methods

```typescript
// Updated to handle auto-assign logic
pageService.updatePage(pageId: string, pageData: Partial<Page>): Promise<void>

// Updated to trigger auto-assignment
clinicTypeService.createClinicType(clinicTypeData: Partial<ClinicType>): Promise<string>
```

## Benefits

1. **Streamlined Setup**: New clinic types get essential pages automatically
2. **Consistency**: Ensures all clinic types have core functionality available
3. **Flexibility**: Can be customized per page and overridden per clinic type
4. **Backward Compatible**: Existing clinic types and assignments are preserved
5. **User-Friendly**: Clear visual indicators in the admin interface

## Future Enhancements

- Role-based auto-assignment (different pages for different clinic types)
- Bulk update tools for changing auto-assign settings
- Analytics on page usage across clinic types
- Templates for common clinic type configurations
