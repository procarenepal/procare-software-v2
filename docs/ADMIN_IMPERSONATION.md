# Admin Impersonation Feature

This document describes the clinic admin impersonation feature available to super-admins.

## Overview

The impersonation feature allows super-admins to log in as any clinic admin without knowing their password. This is useful for troubleshooting issues, providing support, or demonstrating features within a specific clinic's environment.

## How It Works

1. The system stores encrypted clinic admin credentials in a secure Firestore collection.
2. Only super-admins have access to the impersonation functionality.
3. Credentials are encrypted using AES encryption via CryptoJS before being stored.
4. When a super-admin wants to impersonate a clinic admin, the system:
   - Retrieves the encrypted credentials
   - Decrypts the password
   - Logs in as the clinic admin

## Security Considerations

- Passwords are encrypted using a secure encryption key before storage
- Only super-admins can access this feature
- The encryption key is only available on the client-side for authenticated super-admins
- Consider rotating the encryption key periodically for enhanced security

## Usage Instructions

1. Navigate to the Super Admin Dashboard
2. Find the "Clinic Admin Impersonation" panel
3. For a new clinic admin you want to impersonate:
   - Click "Store Credentials"
   - Enter the admin's password
   - Click "Store Credentials" to save
4. For clinic admins with stored credentials:
   - Click "Impersonate" to log in as that admin
   - Use "Remove" to delete stored credentials when no longer needed

## Important Notes

- This feature bypasses normal authentication channels and should be used responsibly
- All impersonation activities should be logged and monitored
- Inform clinic admins that super-admins have this capability for support purposes
- Consider implementing additional safeguards like approval workflows or notification systems
