# Print Layout System

This document describes the unified print layout system that ensures all print outputs are perfectly synchronized with the settings configured in the print layout settings page.

## Architecture

The print layout system is built around three main components:

### 1. Shared Configuration (`PrintLayoutConfig`)
- **File**: `src/types/printLayout.ts`
- **Purpose**: Single source of truth for all print layout settings
- **Features**: Type-safe configuration with validation utilities

### 2. Print Layout Template (`PrintLayoutTemplate`)
- **File**: `src/components/PrintLayoutTemplate.tsx`
- **Purpose**: Unified HTML structure for all print outputs
- **Features**: Configurable header, content area, and footer

### 3. Print Layout Component (`PrintLayout`)
- **File**: `src/components/PrintLayout.tsx`
- **Purpose**: Main print wrapper that loads configuration and renders template
- **Features**: Automatic configuration loading, print-only visibility

## Usage

### Basic Usage

```tsx
import PrintLayout from '@/components/PrintLayout';

// Simple print layout
<PrintLayout
  documentTitle="Invoice"
  documentNumber="INV-001"
  documentDate="2024-01-15"
>
  <div>
    <h2>Invoice Details</h2>
    <p>Your document content here...</p>
  </div>
</PrintLayout>
```

### Advanced Usage

```tsx
import PrintLayout from '@/components/PrintLayout';

// Advanced print layout with custom properties
<PrintLayout
  documentTitle="Medical Prescription"
  documentSubtitle="Patient Treatment Plan"
  documentNumber="RX-2024-001"
  documentDate="January 15, 2024"
  showInPrint={false} // Hidden by default, only visible when printing
>
  <div className="prescription-content">
    <table>
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Dosage</th>
          <th>Frequency</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Medicine A</td>
          <td>10mg</td>
          <td>Twice daily</td>
        </tr>
      </tbody>
    </table>
  </div>
</PrintLayout>
```

## Configuration

All print layouts are controlled from the **Print Layout Settings** page (`/dashboard/settings/print-layout`).

### Available Settings

- **Clinic Information**: Name, address, phone, email, website
- **Logo**: Upload, position, size
- **Branding**: Primary and secondary colors
- **Footer**: Enable/disable footer and custom footer text

### Settings Applied To

- ✅ Purchase receipts
- ✅ Invoice prints
- ✅ Medical prescriptions (when implemented)
- ✅ Any document using `PrintLayout` component

## Benefits

1. **Perfect Synchronization**: All print outputs always match the settings page preview
2. **Single Source of Truth**: One place to configure all print layouts
3. **Type Safety**: TypeScript interfaces prevent configuration errors
4. **Consistency**: Unified HTML structure across all print outputs
5. **Maintainability**: Easy to update layout logic in one place

## Implementation Notes

- The `PrintLayoutTemplate` component handles all the complex layout logic
- Print-only CSS classes ensure content is hidden in normal view
- Configuration is automatically loaded from the database
- Settings are validated before saving
- All print outputs use the same base template structure

## Adding New Print Documents

To add a new print document:

1. Use the `PrintLayout` component as a wrapper
2. Add your document content as children
3. Specify document title, number, and date
4. The layout will automatically apply clinic configuration

```tsx
// Example: New report type
<PrintLayout
  documentTitle="Monthly Report"
  documentNumber="RPT-2024-01"
  documentDate="January 2024"
>
  <div>
    {/* Your report content */}
  </div>
</PrintLayout>
```

The system ensures that all print layouts stay synchronized with the settings page configuration without any additional setup required.
