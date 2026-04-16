import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
} from "firebase/firestore";

import { db, auth } from "../config/firebase";
import {
  AppointmentBilling,
  AppointmentBillingSettings,
  AppointmentBillingItem,
  PaymentMethod,
} from "../types/models";

import { navigationService } from "./navigationService";

const APPOINTMENT_BILLING_COLLECTION = "appointmentBilling";
const APPOINTMENT_BILLING_SETTINGS_COLLECTION = "appointmentBillingSettings";

/**
 * Service for managing appointment billing operations including invoices and settings
 */
export const appointmentBillingService = {
  // =================== APPOINTMENT BILLING SETTINGS ===================

  /**
   * Get appointment billing settings for a clinic
   */
  async getBillingSettings(
    clinicId: string,
  ): Promise<AppointmentBillingSettings | null> {
    try {
      const settingsRef = doc(
        db,
        APPOINTMENT_BILLING_SETTINGS_COLLECTION,
        clinicId,
      );
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        const settings = {
          id: settingsDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as AppointmentBillingSettings;

        // Auto-migrate: If paymentMethods doesn't exist, initialize with defaults
        if (!Array.isArray(settings.paymentMethods)) {
          const defaultSettings = this.getDefaultBillingSettings(
            clinicId,
            "system",
          );

          settings.paymentMethods = defaultSettings.paymentMethods;
          settings.defaultPaymentMethod = defaultSettings.defaultPaymentMethod;

          // Update the database with the new payment methods
          await updateDoc(settingsRef, {
            paymentMethods: settings.paymentMethods,
            defaultPaymentMethod: settings.defaultPaymentMethod,
            updatedAt: Timestamp.now(),
          });
        }

        return settings;
      }

      return null;
    } catch (error) {
      console.error("Error getting billing settings:", error);
      throw error;
    }
  },

  /**
   * Create or update appointment billing settings for a clinic
   */
  async updateBillingSettings(
    clinicId: string,
    settings: Partial<AppointmentBillingSettings>,
    updatedBy: string,
  ): Promise<void> {
    try {
      const settingsRef = doc(
        db,
        APPOINTMENT_BILLING_SETTINGS_COLLECTION,
        clinicId,
      );
      const now = Timestamp.now();

      const data = {
        ...settings,
        clinicId,
        updatedAt: now,
        updatedBy,
      };

      // Check if settings exist
      const existingSettings = await getDoc(settingsRef);

      if (existingSettings.exists()) {
        await updateDoc(settingsRef, data);
      } else {
        // Create new settings with defaults
        const defaultSettings = this.getDefaultBillingSettings(
          clinicId,
          updatedBy,
        );

        await setDoc(settingsRef, {
          ...defaultSettings,
          ...data,
          createdAt: now,
        });
      }
    } catch (error) {
      console.error("Error updating billing settings:", error);
      throw error;
    }
  },

  /**
   * Enable appointment billing for a clinic (super admin only)
   */
  async enableBillingForClinic(
    clinicId: string,
    branchId: string,
    enabledBy: string,
  ): Promise<void> {
    try {
      const defaultSettings = this.getDefaultBillingSettings(
        clinicId,
        enabledBy,
      );

      defaultSettings.branchId = branchId;
      defaultSettings.enabledByAdmin = true;
      defaultSettings.isActive = true;

      const settingsRef = doc(
        db,
        APPOINTMENT_BILLING_SETTINGS_COLLECTION,
        clinicId,
      );

      await setDoc(settingsRef, {
        ...defaultSettings,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Invalidate navigation cache for all users in this clinic
      // This will force navigation to rebuild with billing menu items
      navigationService.invalidateClinicCache(clinicId);
    } catch (error) {
      console.error("Error enabling billing for clinic:", error);
      throw error;
    }
  },

  /**
   * Disable appointment billing for a clinic (super admin only)
   */
  async disableBillingForClinic(clinicId: string): Promise<void> {
    try {
      const settingsRef = doc(
        db,
        APPOINTMENT_BILLING_SETTINGS_COLLECTION,
        clinicId,
      );

      await updateDoc(settingsRef, {
        enabledByAdmin: false,
        isActive: false,
        updatedAt: Timestamp.now(),
      });

      // Invalidate navigation cache for all users in this clinic
      // This will force navigation to rebuild without billing menu items
      navigationService.invalidateClinicCache(clinicId);
    } catch (error) {
      console.error("Error disabling billing for clinic:", error);
      throw error;
    }
  },

  /**
   * Get default billing settings for new clinics
   */
  getDefaultBillingSettings(
    clinicId: string,
    createdBy: string,
  ): AppointmentBillingSettings {
    return {
      id: clinicId,
      clinicId,
      branchId: "",
      enabledByAdmin: false,
      isActive: false,
      invoicePrefix: "INV",
      nextInvoiceNumber: 1,
      defaultDiscountType: "percent",
      defaultDiscountValue: 0,
      defaultCommission: 0,
      enableTax: false,
      defaultTaxPercentage: 0,
      taxLabel: "Tax",
      paymentMethods: [
        {
          id: crypto.randomUUID(),
          name: "Cash",
          key: "cash",
          isEnabled: true,
          requiresReference: false,
          icon: "💵",
          description: "Cash payment",
          isCustom: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: createdBy,
        },
        {
          id: crypto.randomUUID(),
          name: "Credit/Debit Card",
          key: "card",
          isEnabled: true,
          requiresReference: true,
          icon: "💳",
          description: "Credit or debit card payment",
          isCustom: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: createdBy,
        },
        {
          id: crypto.randomUUID(),
          name: "eSewa",
          key: "esewa",
          isEnabled: true,
          requiresReference: true,
          icon: "📱",
          description: "eSewa digital wallet",
          isCustom: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: createdBy,
        },
        {
          id: crypto.randomUUID(),
          name: "Khalti",
          key: "khalti",
          isEnabled: true,
          requiresReference: true,
          icon: "📲",
          description: "Khalti digital wallet",
          isCustom: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: createdBy,
        },
        {
          id: crypto.randomUUID(),
          name: "Bank Transfer",
          key: "bank_transfer",
          isEnabled: false,
          requiresReference: true,
          icon: "🏦",
          description: "Bank transfer or online banking",
          isCustom: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: createdBy,
        },
        {
          id: crypto.randomUUID(),
          name: "Cheque",
          key: "cheque",
          isEnabled: false,
          requiresReference: true,
          icon: "📋",
          description: "Cheque payment",
          isCustom: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: createdBy,
        },
      ],
      defaultPaymentMethod: "cash",
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: createdBy,
    };
  },

  // =================== INVOICE OPERATIONS ===================

  /**
   * Generate next invoice number for a clinic
   */
  async generateInvoiceNumber(clinicId: string): Promise<string> {
    try {
      const settingsRef = doc(
        db,
        APPOINTMENT_BILLING_SETTINGS_COLLECTION,
        clinicId,
      );
      const settingsDoc = await getDoc(settingsRef);

      if (!settingsDoc.exists()) {
        throw new Error("Billing settings not found for clinic");
      }

      const settings = settingsDoc.data() as AppointmentBillingSettings;
      const invoiceNumber = `${settings.invoicePrefix}-${settings.nextInvoiceNumber.toString().padStart(4, "0")}`;

      // Increment the next invoice number
      await updateDoc(settingsRef, {
        nextInvoiceNumber: increment(1),
        updatedAt: Timestamp.now(),
      });

      return invoiceNumber;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      throw error;
    }
  },

  /**
   * Create a new appointment billing record
   */
  async createBilling(
    billingData: Omit<AppointmentBilling, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const billingRef = collection(db, APPOINTMENT_BILLING_COLLECTION);

      // Filter out undefined values to prevent Firestore errors
      const cleanedData: any = {};

      Object.keys(billingData).forEach((key) => {
        const value = (billingData as any)[key];

        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });

      const now = Timestamp.now();
      const data = {
        ...cleanedData,
        invoiceDate: Timestamp.fromDate(billingData.invoiceDate),
        paymentDate: billingData.paymentDate
          ? Timestamp.fromDate(billingData.paymentDate)
          : null,
        finalizedAt: billingData.finalizedAt
          ? Timestamp.fromDate(billingData.finalizedAt)
          : null,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(billingRef, data);

      console.log("Appointment billing created with ID:", docRef.id);

      return docRef.id;
    } catch (error) {
      console.error("Error creating appointment billing:", error);
      throw error;
    }
  },

  /**
   * Update an existing appointment billing record
   */
  async updateBilling(
    id: string,
    billingData: Partial<AppointmentBilling>,
  ): Promise<void> {
    try {
      const billingRef = doc(db, APPOINTMENT_BILLING_COLLECTION, id);

      // Filter out undefined values to prevent Firestore errors
      const cleanedData: any = {};

      Object.keys(billingData).forEach((key) => {
        const value = (billingData as any)[key];

        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });

      const data: any = {
        ...cleanedData,
        updatedAt: Timestamp.now(),
      };

      // Convert Date fields to Timestamps
      if (billingData.invoiceDate) {
        data.invoiceDate = Timestamp.fromDate(billingData.invoiceDate);
      }
      if (billingData.paymentDate) {
        data.paymentDate = Timestamp.fromDate(billingData.paymentDate);
      }
      if (billingData.finalizedAt) {
        data.finalizedAt = Timestamp.fromDate(billingData.finalizedAt);
      }

      await updateDoc(billingRef, data);
      console.log("Appointment billing updated:", id);
    } catch (error) {
      console.error("Error updating appointment billing:", error);
      throw error;
    }
  },

  /**
   * Get appointment billing by ID
   */
  async getBillingById(id: string): Promise<AppointmentBilling | null> {
    try {
      const billingRef = doc(db, APPOINTMENT_BILLING_COLLECTION, id);
      const billingDoc = await getDoc(billingRef);

      if (billingDoc.exists()) {
        const data = billingDoc.data();

        return {
          id: billingDoc.id,
          ...data,
          invoiceDate: data.invoiceDate?.toDate() || new Date(),
          paymentDate: data.paymentDate?.toDate() || null,
          finalizedAt: data.finalizedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as AppointmentBilling;
      }

      return null;
    } catch (error) {
      console.error("Error getting appointment billing:", error);
      throw error;
    }
  },

  /**
   * Get all appointment billing records for a clinic, optionally scoped by branch.
   */
  async getBillingByClinic(
    clinicId: string,
    branchId?: string,
  ): Promise<AppointmentBilling[]> {
    try {
      if (!clinicId) {
        console.error("No clinicId provided to getBillingByClinic");

        return [];
      }

      const currentUser = auth.currentUser;

      console.log(
        "Fetching billing records for clinic:",
        clinicId,
        branchId ? `branch: ${branchId}` : "all branches",
        "User:",
        currentUser?.uid,
      );

      const billingRef = collection(db, APPOINTMENT_BILLING_COLLECTION);

      const constraints: ReturnType<typeof where>[] = [
        where("clinicId", "==", clinicId),
      ];

      if (branchId) {
        constraints.push(where("branchId", "==", branchId));
      }
      const q = query(billingRef, ...constraints);

      const querySnapshot = await getDocs(q);
      const billingRecords: AppointmentBilling[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        billingRecords.push({
          id: doc.id,
          ...data,
          invoiceDate: data.invoiceDate?.toDate() || new Date(),
          paymentDate: data.paymentDate?.toDate() || null,
          finalizedAt: data.finalizedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as AppointmentBilling);
      });

      // Sort in memory by creation date (newest first)
      billingRecords.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      console.log(
        "Successfully fetched",
        billingRecords.length,
        "billing records",
      );

      return billingRecords;
    } catch (error) {
      console.error("Error getting billing records by clinic:", error);

      // Enhanced error logging
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          clinicId,
          userId: auth.currentUser?.uid || "not authenticated",
          userEmail: auth.currentUser?.email || "no email",
        });

        // Check if it's a permission error
        if (error.message.includes("Missing or insufficient permissions")) {
          console.error(
            "Permission denied - check Firestore rules and user authentication",
          );
          console.error("Current user clinicId:", auth.currentUser?.uid);
        }
      }

      // Return empty array instead of throwing to prevent complete page failure
      return [];
    }
  },

  /**
   * Get appointment billing records for a patient
   */
  async getBillingByPatient(
    patientId: string,
    clinicId: string,
  ): Promise<AppointmentBilling[]> {
    try {
      const billingRef = collection(db, APPOINTMENT_BILLING_COLLECTION);
      const q = query(
        billingRef,
        where("patientId", "==", patientId),
        where("clinicId", "==", clinicId),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      const billingRecords: AppointmentBilling[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        billingRecords.push({
          id: doc.id,
          ...data,
          invoiceDate: data.invoiceDate?.toDate() || new Date(),
          paymentDate: data.paymentDate?.toDate() || null,
          finalizedAt: data.finalizedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as AppointmentBilling);
      });

      return billingRecords;
    } catch (error) {
      console.error("Error getting billing records by patient:", error);
      throw error;
    }
  },

  /**
   * Delete an appointment billing record
   */
  async deleteBilling(id: string): Promise<void> {
    try {
      const billingRef = doc(db, APPOINTMENT_BILLING_COLLECTION, id);

      await deleteDoc(billingRef);
      console.log("Appointment billing deleted:", id);
    } catch (error) {
      console.error("Error deleting appointment billing:", error);
      throw error;
    }
  },

  /**
   * Finalize an invoice (change status from draft to finalized)
   */
  async finalizeInvoice(id: string, finalizedBy: string): Promise<void> {
    try {
      await this.updateBilling(id, {
        status: "finalized",
        finalizedBy,
        finalizedAt: new Date(),
      });
    } catch (error) {
      console.error("Error finalizing invoice:", error);
      throw error;
    }
  },

  /**
   * Record payment for an invoice
   */
  async recordPayment(
    id: string,
    paymentAmount: number,
    paymentMethod: string,
    paymentReference?: string,
    paymentNotes?: string,
  ): Promise<void> {
    try {
      const billing = await this.getBillingById(id);

      if (!billing) {
        throw new Error("Billing record not found");
      }

      const newPaidAmount = billing.paidAmount + paymentAmount;
      const newBalanceAmount = billing.totalAmount - newPaidAmount;

      let paymentStatus: "unpaid" | "partial" | "paid" = "unpaid";

      if (newPaidAmount >= billing.totalAmount) {
        paymentStatus = "paid";
      } else if (newPaidAmount > 0) {
        paymentStatus = "partial";
      }

      // Prepare update data, only including non-empty optional fields
      const updateData: Partial<AppointmentBilling> = {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus,
        paymentMethod,
        paymentDate: new Date(),
        status: paymentStatus === "paid" ? "paid" : billing.status,
      };

      // Only include paymentReference if it's not empty
      if (paymentReference && paymentReference.trim() !== "") {
        updateData.paymentReference = paymentReference.trim();
      }

      // Only include paymentNotes if it's not empty
      if (paymentNotes && paymentNotes.trim() !== "") {
        updateData.paymentNotes = paymentNotes.trim();
      }

      await this.updateBilling(id, updateData);
    } catch (error) {
      console.error("Error recording payment:", error);
      throw error;
    }
  },

  // =================== UTILITY FUNCTIONS ===================

  /**
   * Calculate invoice totals from items
   */
  calculateInvoiceTotals(
    items: AppointmentBillingItem[],
    discountType: "flat" | "percent",
    discountValue: number,
    taxPercentage: number,
  ): {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    let discountAmount = 0;

    if (discountType === "flat") {
      discountAmount = Math.min(discountValue, subtotal);
    } else {
      discountAmount = (subtotal * discountValue) / 100;
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxPercentage) / 100;
    const totalAmount = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
    };
  },

  /**
   * Check if billing is enabled for a clinic
   */
  async isBillingEnabled(clinicId: string): Promise<boolean> {
    try {
      const settings = await this.getBillingSettings(clinicId);

      return settings ? settings.enabledByAdmin && settings.isActive : false;
    } catch (error) {
      console.error("Error checking billing status:", error);

      return false;
    }
  },

  // =================== PAYMENT METHODS MANAGEMENT ===================

  /**
   * Add a new payment method to the clinic's billing settings
   */
  async addPaymentMethod(
    clinicId: string,
    paymentMethod: Omit<PaymentMethod, "id" | "createdAt" | "updatedAt">,
    updatedBy: string,
  ): Promise<void> {
    try {
      const settings = await this.getBillingSettings(clinicId);

      if (!settings) {
        throw new Error("Billing settings not found for clinic");
      }

      const newPaymentMethod: PaymentMethod = {
        id: crypto.randomUUID(),
        ...paymentMethod,
        isCustom: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy,
      };

      // Initialize paymentMethods if it doesn't exist or is not an array
      const currentPaymentMethods = Array.isArray(settings.paymentMethods)
        ? settings.paymentMethods
        : this.getDefaultBillingSettings(clinicId, updatedBy).paymentMethods;

      const updatedPaymentMethods = [
        ...currentPaymentMethods,
        newPaymentMethod,
      ];

      await this.updateBillingSettings(
        clinicId,
        {
          paymentMethods: updatedPaymentMethods,
        },
        updatedBy,
      );
    } catch (error) {
      console.error("Error adding payment method:", error);
      throw error;
    }
  },

  /**
   * Update an existing payment method in the clinic's billing settings
   */
  async updatePaymentMethod(
    clinicId: string,
    paymentMethodId: string,
    updates: Partial<Omit<PaymentMethod, "id" | "createdAt" | "isCustom">>,
    updatedBy: string,
  ): Promise<void> {
    try {
      const settings = await this.getBillingSettings(clinicId);

      if (!settings) {
        throw new Error("Billing settings not found for clinic");
      }

      // Initialize paymentMethods if it doesn't exist or is not an array
      const currentPaymentMethods = Array.isArray(settings.paymentMethods)
        ? settings.paymentMethods
        : this.getDefaultBillingSettings(clinicId, updatedBy).paymentMethods;

      const updatedPaymentMethods = currentPaymentMethods.map((method) => {
        if (method.id === paymentMethodId) {
          return {
            ...method,
            ...updates,
            updatedAt: new Date(),
            updatedBy,
          };
        }

        return method;
      });

      await this.updateBillingSettings(
        clinicId,
        {
          paymentMethods: updatedPaymentMethods,
        },
        updatedBy,
      );
    } catch (error) {
      console.error("Error updating payment method:", error);
      throw error;
    }
  },

  /**
   * Delete a payment method from the clinic's billing settings
   */
  async deletePaymentMethod(
    clinicId: string,
    paymentMethodId: string,
    updatedBy: string,
  ): Promise<void> {
    try {
      const settings = await this.getBillingSettings(clinicId);

      if (!settings) {
        throw new Error("Billing settings not found for clinic");
      }

      // Initialize paymentMethods if it doesn't exist or is not an array
      const currentPaymentMethods = Array.isArray(settings.paymentMethods)
        ? settings.paymentMethods
        : this.getDefaultBillingSettings(clinicId, updatedBy).paymentMethods;

      const methodToDelete = currentPaymentMethods.find(
        (method) => method.id === paymentMethodId,
      );

      if (!methodToDelete) {
        throw new Error("Payment method not found");
      }

      // Prevent deletion of non-custom methods (system defaults)
      if (!methodToDelete.isCustom) {
        throw new Error(
          "Cannot delete system default payment methods. You can disable them instead.",
        );
      }

      const updatedPaymentMethods = currentPaymentMethods.filter(
        (method) => method.id !== paymentMethodId,
      );

      // If the deleted method was the default, set the first enabled method as default
      let newDefaultPaymentMethod = settings.defaultPaymentMethod;

      if (settings.defaultPaymentMethod === methodToDelete.key) {
        const firstEnabledMethod = updatedPaymentMethods.find(
          (method) => method.isEnabled,
        );

        newDefaultPaymentMethod = firstEnabledMethod
          ? firstEnabledMethod.key
          : "cash";
      }

      await this.updateBillingSettings(
        clinicId,
        {
          paymentMethods: updatedPaymentMethods,
          defaultPaymentMethod: newDefaultPaymentMethod,
        },
        updatedBy,
      );
    } catch (error) {
      console.error("Error deleting payment method:", error);
      throw error;
    }
  },

  /**
   * Get enabled payment methods for a clinic
   */
  async getEnabledPaymentMethods(clinicId: string): Promise<PaymentMethod[]> {
    try {
      const settings = await this.getBillingSettings(clinicId);

      if (!settings) {
        return [];
      }

      // Initialize paymentMethods if it doesn't exist or is not an array
      const currentPaymentMethods = Array.isArray(settings.paymentMethods)
        ? settings.paymentMethods
        : [];

      return currentPaymentMethods.filter((method) => method.isEnabled);
    } catch (error) {
      console.error("Error getting enabled payment methods:", error);

      return [];
    }
  },
};
