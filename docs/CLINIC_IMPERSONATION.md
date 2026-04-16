# Clinic Admin Impersonation

This document describes the impersonation feature that allows Super Administrators to temporarily access Clinic Administrator accounts for support purposes.

## Overview

The impersonation feature enables Super Administrators to log in as Clinic Administrators without knowing their actual passwords. This is useful for:

- Troubleshooting issues that are specific to a clinic
- Providing direct assistance to clinic staff
- Verifying configuration and settings
- Testing clinic-specific features

## How It Works

1. **Credential Storage**: A Super Admin can store a Clinic Admin's credentials (these are encrypted before storage)
2. **Impersonation**: When needed, the Super Admin can impersonate the Clinic Admin by clicking the "Impersonate" button
3. **Session Management**: During impersonation, a banner is displayed indicating that the session is being impersonated
4. **Audit Trail**: All actions performed during impersonation are logged in the audit trail with both the original Super Admin's ID and the impersonated Clinic Admin's ID
5. **Credential Removal**: When impersonation is no longer needed, credentials can be removed from the system

## Security Considerations

- Stored credentials are encrypted using AES encryption
- The encryption key is stored securely (not directly in the code)
- Impersonation sessions are clearly marked with a banner
- All impersonation activities are recorded in the audit logs
- Only Super Administrators have access to the impersonation feature
- Clinic Administrators are notified when their account is impersonated

## Accessing the Impersonation Feature

1. Log in as a Super Administrator
2. Navigate to **Admin > Clinics > Impersonation**
3. Use the interface to manage stored credentials and impersonation sessions

## Technical Implementation

The impersonation feature uses the following components:

- `ImpersonationPanel.tsx`: UI component for managing impersonation
- `impersonationService.ts`: Service for storing and retrieving encrypted credentials
- `impersonationBanner.tsx`: Banner displayed during impersonation sessions
- Firestore collection for storing encrypted credentials

## Best Practices

- Only use impersonation when absolutely necessary
- Remove stored credentials when they are no longer needed
- Always inform clinic administrators before impersonating their accounts
- Document the reason for impersonation in the support ticket or audit logs
- Do not modify critical settings without consultation with the clinic administrator
