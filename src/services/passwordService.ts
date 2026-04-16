import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  confirmPasswordReset,
  verifyPasswordResetCode,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth, actionCodeSettings } from "../config/firebase";

import { impersonationService } from "./impersonationService";

/**
 * Service for managing password updates and impersonation record synchronization
 */
export const passwordService = {
  /**
   * Update user password with proper validation and impersonation record sync
   * @param {string} currentPassword - Current password for re-authentication
   * @param {string} newPassword - New password to set
   * @returns {Promise<void>}
   */
  async updatePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const user = auth.currentUser;

      if (!user || !user.email) {
        throw new Error("No authenticated user found");
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );

      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Update impersonation record if it exists
      await this.updateImpersonationRecord(user.uid, user.email, newPassword);
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  },

  /**
   * Update password using reset code (for password reset flow)
   * @param {string} oobCode - Password reset code from email
   * @param {string} newPassword - New password to set
   * @returns {Promise<void>}
   */
  async updatePasswordWithResetCode(
    oobCode: string,
    newPassword: string,
  ): Promise<void> {
    try {
      // Verify the reset code first to get the email
      const email = await verifyPasswordResetCode(auth, oobCode);

      console.log(`🔄 Password reset initiated for email: ${email}`);

      // Confirm password reset
      await confirmPasswordReset(auth, oobCode, newPassword);
      console.log(`✅ Password reset completed for: ${email}`);

      // After password reset, the user should be automatically signed in
      // Wait a moment for the auth state to update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get the current user (should be signed in after password reset)
      const user = auth.currentUser;

      if (user && user.email === email) {
        console.log(`🔍 Found authenticated user: ${user.uid}`);
        await this.updateImpersonationRecord(user.uid, email, newPassword);
      } else {
        console.warn(
          `⚠️ Could not find authenticated user after password reset`,
        );
        console.warn(
          `⚠️ Impersonation record may not be updated automatically`,
        );

        // Try to find user by email in Firestore as fallback
        try {
          const { userService } = await import("./userService");
          const userByEmail = await userService.getUserByEmail(email);

          if (userByEmail) {
            console.log(
              `🔄 Found user data by email, updating impersonation record...`,
            );
            await this.updateImpersonationRecord(
              userByEmail.id,
              email,
              newPassword,
            );
          } else {
            console.warn(`⚠️ Could not find user data for email: ${email}`);
          }
        } catch (fallbackError) {
          console.warn(
            `⚠️ Fallback impersonation update failed:`,
            fallbackError,
          );
        }
      }
    } catch (error) {
      console.error("Error updating password with reset code:", error);
      throw error;
    }
  },

  /**
   * Update impersonation record with new password
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async updateImpersonationRecord(
    userId: string,
    email: string,
    newPassword: string,
  ): Promise<void> {
    try {
      console.log(`🔄 Checking impersonation record for user: ${userId}`);

      // Check if impersonation record exists
      const existingCredentials =
        await impersonationService.getCredentials(userId);

      if (existingCredentials) {
        console.log(
          `✅ Found existing impersonation record for ${email}, updating password...`,
        );

        // Update the stored credentials with new password
        await impersonationService.storeCredentials(userId, email, newPassword);

        console.log(
          `✅ Impersonation record updated successfully for ${email}`,
        );
        console.log(
          `🔐 Super admins can now impersonate this user with the new password`,
        );
      } else {
        console.log(
          `ℹ️ No impersonation record found for ${email} - no update needed`,
        );
      }
    } catch (error) {
      // Don't throw error for impersonation update failure
      // This is not critical for password update functionality
      console.warn("⚠️ Failed to update impersonation record:", error);
      console.warn(
        "⚠️ Super admins may need to re-store credentials for this user",
      );
    }
  },

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with isValid and message
   */
  validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters long",
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one number",
      };
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return {
        isValid: false,
        message:
          "Password must contain at least one special character (@$!%*?&)",
      };
    }

    return { isValid: true, message: "Password is strong" };
  },

  /**
   * Check if passwords match
   * @param {string} password - Password
   * @param {string} confirmPassword - Confirmation password
   * @returns {boolean} - Whether passwords match
   */
  passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  },

  /**
   * Send password reset email with custom action code settings
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  },
};
