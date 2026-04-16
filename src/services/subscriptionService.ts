import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { SubscriptionPlan } from "../types/models";

const SUBSCRIPTION_PLANS_COLLECTION = "subscriptionPlans";

/**
 * Service for managing subscription plans in Firestore
 */
export const subscriptionService = {
  /**
   * Create a new subscription plan
   * @param {Partial<SubscriptionPlan>} planData - Data for the new subscription plan
   * @returns {Promise<string>} - ID of the created plan
   */
  async createSubscriptionPlan(
    planData: Partial<SubscriptionPlan>,
  ): Promise<string> {
    try {
      const plansRef = collection(db, SUBSCRIPTION_PLANS_COLLECTION);
      const docRef = await addDoc(plansRef, {
        ...planData,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      throw error;
    }
  },

  /**
   * Get a subscription plan by ID
   * @param {string} id - Plan ID
   * @returns {Promise<SubscriptionPlan | null>} - Plan data or null if not found
   */
  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | null> {
    try {
      const docRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();

        return {
          id: docSnap.id,
          ...data,
          createdAt,
          updatedAt,
        } as SubscriptionPlan;
      }

      return null;
    } catch (error) {
      console.error("Error getting subscription plan:", error);
      throw error;
    }
  },

  /**
   * Get all subscription plans
   * @returns {Promise<SubscriptionPlan[]>} - Array of all subscription plans
   */
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plansRef = collection(db, SUBSCRIPTION_PLANS_COLLECTION);
      const querySnapshot = await getDocs(plansRef);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();

        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
        } as SubscriptionPlan;
      });
    } catch (error) {
      console.error("Error getting all subscription plans:", error);
      throw error;
    }
  },

  /**
   * Get active subscription plans
   * @returns {Promise<SubscriptionPlan[]>} - Array of active subscription plans
   */
  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plansRef = collection(db, SUBSCRIPTION_PLANS_COLLECTION);
      const q = query(plansRef, where("isActive", "==", true));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();

        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt,
        } as SubscriptionPlan;
      });
    } catch (error) {
      console.error("Error getting active subscription plans:", error);
      throw error;
    }
  },

  /**
   * Update a subscription plan
   * @param {string} id - Plan ID
   * @param {Partial<SubscriptionPlan>} updateData - Updated plan data
   * @returns {Promise<void>}
   */
  async updateSubscriptionPlan(
    id: string,
    updateData: Partial<SubscriptionPlan>,
  ): Promise<void> {
    try {
      const docRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, id);

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      throw error;
    }
  },

  /**
   * Delete a subscription plan
   * @param {string} id - Plan ID to delete
   * @returns {Promise<void>}
   */
  async deleteSubscriptionPlan(id: string): Promise<void> {
    try {
      const docRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, id);

      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      throw error;
    }
  },

  /**
   * Toggle a subscription plan's active status
   * @param {string} id - Plan ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<void>}
   */
  async toggleSubscriptionPlanStatus(
    id: string,
    isActive: boolean,
  ): Promise<void> {
    try {
      const docRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, id);

      await updateDoc(docRef, {
        isActive: isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error toggling subscription plan status:", error);
      throw error;
    }
  },

  /**
   * Update a clinic's subscription plan
   * @param {string} clinicId - Clinic ID
   * @param {string} planId - Subscription plan ID
   * @param {Date} startDate - Subscription start date
   * @param {Date} endDate - Subscription end date (optional)
   * @param {'active' | 'suspended' | 'cancelled'} status - Subscription status
   * @param {'monthly' | 'yearly'} subscriptionType - Type of subscription (monthly or yearly)
   * @returns {Promise<void>}
   */
  async updateClinicSubscription(
    clinicId: string,
    planId: string,
    startDate: Date,
    endDate?: Date,
    status: "active" | "suspended" | "cancelled" = "active",
    subscriptionType: "monthly" | "yearly" = "yearly",
  ): Promise<void> {
    try {
      const clinicRef = doc(db, "clinics", clinicId);

      await updateDoc(clinicRef, {
        subscriptionPlan: planId,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate || null,
        subscriptionStatus: status,
        subscriptionType: subscriptionType,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating clinic subscription:", error);
      throw error;
    }
  },

  /**
   * Get subscription statistics
   * @returns {Promise<{total: number, active: number, suspended: number, cancelled: number}>}
   */
  async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    cancelled: number;
    byPlan: Record<string, number>;
  }> {
    try {
      const clinicsRef = collection(db, "clinics");
      const querySnapshot = await getDocs(clinicsRef);

      let total = 0;
      let active = 0;
      let suspended = 0;
      let cancelled = 0;
      const byPlan: Record<string, number> = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        total++;

        // Count by status
        if (data.subscriptionStatus === "active") active++;
        else if (data.subscriptionStatus === "suspended") suspended++;
        else if (data.subscriptionStatus === "cancelled") cancelled++;

        // Count by plan
        if (data.subscriptionPlan) {
          byPlan[data.subscriptionPlan] =
            (byPlan[data.subscriptionPlan] || 0) + 1;
        }
      });

      return { total, active, suspended, cancelled, byPlan };
    } catch (error) {
      console.error("Error getting subscription stats:", error);
      throw error;
    }
  },

  /**
   * Get detailed subscription statistics including monthly vs yearly breakdown
   * @returns {Promise<Object>} Detailed subscription statistics
   */
  async getDetailedSubscriptionStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    cancelled: number;
    byPlan: Record<string, number>;
    byType: {
      monthly: number;
      yearly: number;
    };
  }> {
    try {
      const clinicsRef = collection(db, "clinics");
      const querySnapshot = await getDocs(clinicsRef);

      let total = 0;
      let active = 0;
      let suspended = 0;
      let cancelled = 0;
      const byPlan: Record<string, number> = {};
      const byType = {
        monthly: 0,
        yearly: 0,
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        total++;

        // Count by status
        if (data.subscriptionStatus === "active") active++;
        else if (data.subscriptionStatus === "suspended") suspended++;
        else if (data.subscriptionStatus === "cancelled") cancelled++;

        // Count by plan
        if (data.subscriptionPlan) {
          byPlan[data.subscriptionPlan] =
            (byPlan[data.subscriptionPlan] || 0) + 1;
        }

        // Count by subscription type
        if (data.subscriptionType === "monthly") {
          byType.monthly++;
        } else if (data.subscriptionType === "yearly") {
          byType.yearly++;
        }
      });

      return { total, active, suspended, cancelled, byPlan, byType };
    } catch (error) {
      console.error("Error getting detailed subscription stats:", error);
      throw error;
    }
  },
};
