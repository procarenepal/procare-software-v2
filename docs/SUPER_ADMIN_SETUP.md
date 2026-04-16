# Super Admin Setup Guide

This guide explains how to set up the initial super admin account for the Procare Software multi-tenant clinic management platform.

## What is a Super Admin?

The Super Admin is the highest level of administrative user in the system with the following responsibilities:

- Registering new clinics on the platform
- Managing clinic subscriptions
- Monitoring overall platform usage
- Assigning clinic administrators
- Managing the global system settings

Unlike other users who are associated with specific clinics, the Super Admin has platform-wide access and is not tied to any specific clinic.

## Initial Setup

Follow these steps to set up the first Super Admin account:

### Prerequisites

Before running the setup script, make sure you have:

1. Completed the Firebase setup as described in the main README
2. Added all required Firebase configuration to your `.env` file
3. Built the project with `npm run build` or `pnpm build`

### Running the Super Admin Setup Script

1. Open a terminal in the project root directory.

2. Run the initialization script:

   ```bash
   npm run initialize-system
   ```

3. The script will check if a Super Admin account already exists:
   - If one exists, you'll be notified and can choose to reset the system initialization status
   - If no Super Admin exists, you'll proceed with account creation

4. Enter the required information when prompted:
   - Super Admin email address (must be a valid email)
   - Password (minimum 8 characters)
   - Display name

5. Confirm your entries when prompted.

6. The script will create the Super Admin account and initialize system permissions.

7. Upon successful completion, you'll receive a confirmation with the Super Admin ID.

### Logging In

Once the Super Admin account is created:

1. Navigate to the login page of your application.
2. Enter the Super Admin email and password.
3. You will be redirected to the Super Admin dashboard.

## Post-Setup Tasks

After creating the Super Admin account, you should:

1. **Register Your First Clinic**: Navigate to the "Clinics" section and click "Register New Clinic".

2. **Create a Default Admin for the Clinic**: When registering a clinic, you'll be prompted to specify a clinic administrator.

3. **Verify System Settings**: Check that all global system settings are configured correctly.

## Troubleshooting

### Unable to create Super Admin

If you encounter errors while creating the Super Admin account:

1. Check your Firebase configuration in the `.env` file.
2. Ensure Firebase Authentication is enabled in your Firebase project.
3. Verify that your Firebase project has Email/Password authentication enabled.
4. Check that Firestore database rules allow write operations.

### Super Admin account exists but can't log in

If a Super Admin account exists but you can't log in:

1. Use the password reset functionality on the login page.
2. If needed, you can use the Firebase Console to reset the user's password or create a new Super Admin.

## Security Considerations

The Super Admin account has full system access, so:

- Use a strong, unique password
- Limit the number of people with Super Admin access
- Consider using multi-factor authentication if available
- Keep your Firebase credentials secure

---

For any additional assistance, please contact the development team.
