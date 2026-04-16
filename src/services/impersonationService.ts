import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import CryptoJS from "crypto-js";

import { db, auth } from "../config/firebase";

const IMPERSONATION_COLLECTION = "impersonation_credentials";

// Secret key for encryption/decryption - in a real app, this should be stored securely
// For example, you might use an environment variable or a secure key management service
const SECRET_KEY = "Procare Software-impersonation-key-2025";

/**
 * Service for managing impersonation data in Firestore
 */
export const impersonationService = {
  /**
   * Store clinic admin credentials for future impersonation
   * @param {string} adminId - User ID of the clinic admin
   * @param {string} email - Admin email
   * @param {string} password - Admin password (will be encrypted)
   * @returns {Promise<void>}
   */
  async storeCredentials(
    adminId: string,
    email: string,
    password: string,
  ): Promise<void> {
    try {
      // Encrypt the password
      const encryptedPassword = CryptoJS.AES.encrypt(
        password,
        SECRET_KEY,
      ).toString();

      // Store in Firestore
      await setDoc(doc(db, IMPERSONATION_COLLECTION, adminId), {
        adminId,
        email,
        encryptedPassword,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error storing credentials:", error);
      throw error;
    }
  },

  /**
   * Get stored credentials for a clinic admin
   * @param {string} adminId - User ID of the clinic admin
   * @returns {Promise<{ email: string, password: string } | null>} - Decrypted credentials
   */
  async getCredentials(
    adminId: string,
  ): Promise<{ email: string; password: string } | null> {
    try {
      const docRef = doc(db, IMPERSONATION_COLLECTION, adminId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        if (!data.encryptedPassword) {
          return null;
        }

        // Decrypt the password
        const decryptedPassword = CryptoJS.AES.decrypt(
          data.encryptedPassword,
          SECRET_KEY,
        ).toString(CryptoJS.enc.Utf8);

        if (!decryptedPassword) {
          return null;
        }

        return {
          email: data.email,
          password: decryptedPassword,
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting credentials:", error);
      throw error;
    }
  },

  /**
   * Impersonate a clinic admin
   * @param {string} adminId - User ID of the clinic admin to impersonate
   * @returns {Promise<boolean>} - Success status
   */
  async impersonateAdmin(adminId: string): Promise<boolean> {
    try {
      // First check if the user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", adminId));

      if (!userDoc.exists()) {
        throw new Error(
          "Admin user not found in database. The user may have been deleted.",
        );
      }

      const userData = userDoc.data();

      // Get stored credentials
      const credentials = await this.getCredentials(adminId);

      if (!credentials) {
        throw new Error("No stored credentials found for this admin");
      }

      // Set a flag in localStorage to indicate impersonation mode
      localStorage.setItem("isImpersonating", "true");
      localStorage.setItem("impersonatingAdminId", adminId);

      // Sign in with the clinic admin credentials
      await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );

      return true;
    } catch (error) {
      // Clear the impersonation flags if login failed
      localStorage.removeItem("isImpersonating");
      localStorage.removeItem("impersonatingAdminId");

      // Provide more specific error messages
      if (error.code === "auth/user-not-found") {
        throw new Error(
          "Admin user account not found. The user may have been deleted.",
        );
      } else if (error.code === "auth/wrong-password") {
        throw new Error(
          "Invalid password. The stored credentials may be outdated.",
        );
      } else if (error.code === "auth/user-disabled") {
        throw new Error("Admin user account has been disabled.");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error(
          "Too many failed login attempts. Please try again later.",
        );
      } else {
        throw new Error(`Authentication failed: ${error.message}`);
      }
    }
  },

  /**
   * Remove stored credentials for a clinic admin
   * @param {string} adminId - User ID of the clinic admin
   * @returns {Promise<void>}
   */
  async removeCredentials(adminId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, IMPERSONATION_COLLECTION, adminId));
    } catch (error) {
      console.error("Error removing credentials:", error);
      throw error;
    }
  },

  /**
   * Check if credentials exist for a clinic admin
   * @param {string} adminId - User ID of the clinic admin
   * @returns {Promise<boolean>}
   */
  async hasStoredCredentials(adminId: string): Promise<boolean> {
    try {
      const docRef = doc(db, IMPERSONATION_COLLECTION, adminId);
      const docSnap = await getDoc(docRef);

      return docSnap.exists();
    } catch (error) {
      console.error("Error checking credentials:", error);
      throw error;
    }
  },
};
