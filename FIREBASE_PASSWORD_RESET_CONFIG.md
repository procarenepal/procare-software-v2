# Firebase Password Reset Configuration

This guide explains how to configure Firebase to use our custom password reset page instead of the default Firebase form.

## Problem
Firebase sends users to its default password reset form at:
`https://procaresoft.firebaseapp.com/__/auth/action?mode=action&oobCode=code`

## Solution
Configure Firebase to redirect to our custom reset page at:
`https://yourdomain.com/reset-password?oobCode=code`

## Steps to Configure

### 1. Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** > **Templates**
4. Click on **Password reset** template
5. In the **Action URL** field, enter:
   ```
   https://yourdomain.com/reset-password
   ```
   Replace `yourdomain.com` with your actual domain.

### 2. Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings**
2. Scroll down to **Authorized domains**
3. Add your domain to the list:
   - `yourdomain.com`
   - `www.yourdomain.com` (if applicable)

### 3. Email Template Customization

You can also customize the email template in **Authentication** > **Templates** > **Password reset**:

**Subject:**
```
Reset your password for Procare Software
```

**Message:**
```
Hello,

Follow this link to reset your Procare Software password for your %EMAIL% account.

%LINK%

If you didn't ask to reset your password, you can ignore this email.

Thanks,
Your Procare Software team
```

### 4. Code Configuration

The code is already configured to use custom action code settings. The `actionCodeSettings` in `src/config/firebase.ts` will:

- Redirect to `/reset-password` page
- Pass the `oobCode` as a URL parameter
- Handle the reset flow in our custom form

### 5. Testing

After configuration:

1. Request a password reset
2. Check the email for the reset link
3. Click the link - it should go to your custom reset page
4. Complete the password reset using our custom form

## Important Notes

- The domain must be whitelisted in Firebase Console
- The `handleCodeInApp: true` setting is required
- The URL must be accessible from the domain where the email is opened
- Test thoroughly in both development and production environments

## Troubleshooting

If the custom URL doesn't work:

1. Check that the domain is in the authorized domains list
2. Verify the URL format is correct
3. Ensure the reset page is accessible
4. Check browser console for any errors
5. Verify the `oobCode` parameter is being passed correctly
