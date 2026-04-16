import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { ClinicSettings } from "../types/models";

const CLINIC_SETTINGS_COLLECTION = "clinicSettings";

export const clinicSettingsService = {
  /**
   * Create or update clinic settings
   */
  async upsertClinicSettings(
    settingsData: Omit<ClinicSettings, "id" | "createdAt" | "updatedAt">,
  ): Promise<void> {
    try {
      // Use clinicId as document ID to ensure one settings document per clinic
      const docRef = doc(db, CLINIC_SETTINGS_COLLECTION, settingsData.clinicId);

      // Check if document exists
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Update existing settings
        await updateDoc(docRef, {
          ...settingsData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new settings
        await setDoc(docRef, {
          id: settingsData.clinicId,
          ...settingsData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error upserting clinic settings:", error);
      throw error;
    }
  },

  /**
   * Get clinic settings by clinic ID
   */
  async getClinicSettings(clinicId: string): Promise<ClinicSettings | null> {
    try {
      const docRef = doc(db, CLINIC_SETTINGS_COLLECTION, clinicId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as ClinicSettings;
      }

      // Return default settings if none exist
      return {
        id: clinicId,
        clinicId,
        sellsMedicines: false,
        enableInventoryManagement: false,
        enableLowStockAlerts: false,
        allowNegativeStock: false,
        requireBatchTracking: false,
        requireExpiryTracking: false,
        autoGenerateBarcode: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: "",
      };
    } catch (error) {
      console.error("Error fetching clinic settings:", error);
      throw error;
    }
  },

  /**
   * Update specific clinic settings
   */
  async updateClinicSettings(
    clinicId: string,
    updateData: Partial<ClinicSettings>,
    updatedBy: string,
  ): Promise<void> {
    try {
      const docRef = doc(db, CLINIC_SETTINGS_COLLECTION, clinicId);

      await updateDoc(docRef, {
        ...updateData,
        updatedBy,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating clinic settings:", error);
      throw error;
    }
  },

  /**
   * Check if clinic sells medicines
   */
  async doesClinicSellMedicines(clinicId: string): Promise<boolean> {
    try {
      const settings = await this.getClinicSettings(clinicId);

      return settings?.sellsMedicines || false;
    } catch (error) {
      console.error("Error checking if clinic sells medicines:", error);

      return false;
    }
  },

  /**
   * Get all clinics that sell medicines
   */
  async getClinicsThatSellMedicines(): Promise<ClinicSettings[]> {
    try {
      const q = query(
        collection(db, CLINIC_SETTINGS_COLLECTION),
        where("sellsMedicines", "==", true),
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as ClinicSettings[];
    } catch (error) {
      console.error("Error fetching clinics that sell medicines:", error);
      throw error;
    }
  },

  /**
   * Check if clinic can sell medicines (alias for doesClinicSellMedicines)
   */
  async canSellMedicines(clinicId: string): Promise<boolean> {
    return this.doesClinicSellMedicines(clinicId);
  },

  /**
   * Check if clinic has inventory management enabled
   */
  async hasInventoryManagement(clinicId: string): Promise<boolean> {
    try {
      const settings = await this.getClinicSettings(clinicId);

      return settings?.enableInventoryManagement || false;
    } catch (error) {
      console.error("Error checking inventory management:", error);

      return false;
    }
  },

  /**
   * Update medicine settings for a clinic
   */
  async updateMedicineSettings(
    clinicId: string,
    medicineSettings: any,
    userId?: string,
  ): Promise<void> {
    try {
      const docRef = doc(db, CLINIC_SETTINGS_COLLECTION, clinicId);

      // Check if document exists first
      const docSnap = await getDoc(docRef);

      // Transform the medicine settings to match our ClinicSettings model
      const settingsUpdate = {
        sellsMedicines: medicineSettings.canSellMedicines,
        enableInventoryManagement: medicineSettings.enableInventoryManagement,
        enableLowStockAlerts: true, // Always enable if inventory is enabled
        allowNegativeStock: medicineSettings.allowNegativeStock,
        requireBatchTracking: medicineSettings.enableBatchTracking,
        requireExpiryTracking: medicineSettings.enableBatchTracking,
        autoGenerateBarcode: false,
        lowStockThreshold: medicineSettings.lowStockThreshold,
        expiryAlertDays: medicineSettings.expiryAlertDays,
        autoReorderEnabled: medicineSettings.autoReorderEnabled,
        defaultReorderQuantity: medicineSettings.defaultReorderQuantity,
        requirePrescriptionForSale: medicineSettings.requirePrescriptionForSale,
        enableMedicineDiscounts: medicineSettings.enableMedicineDiscounts,
        defaultTaxRate: medicineSettings.defaultTaxRate,
        currency: medicineSettings.currency,
        invoiceFooterText: medicineSettings.invoiceFooterText,
        updatedAt: serverTimestamp(),
      };

      if (docSnap.exists()) {
        // Document exists, update it
        const updateData = userId
          ? { ...settingsUpdate, updatedBy: userId }
          : settingsUpdate;

        await updateDoc(docRef, updateData);
      } else {
        // Document doesn't exist, create it with default values
        const newSettings = {
          id: clinicId,
          clinicId: clinicId,
          ...settingsUpdate,
          createdAt: serverTimestamp(),
          createdBy: userId || "",
          updatedBy: userId || "",
        };

        await setDoc(docRef, newSettings);
      }
    } catch (error) {
      console.error("Error updating medicine settings:", error);
      throw error;
    }
  },
};
