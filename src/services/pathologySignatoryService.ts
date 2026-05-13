import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { PathologySignatory } from "../types/models";

const PATHOLOGY_SIGNATORIES_COLLECTION = "pathologySignatories";

// Helper to strip out undefined values before sending data to Firestore
function removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });

  return cleaned as T;
}

/**
 * Service for managing pathology authorized signatories (Pathologists)
 */
export const pathologySignatoryService = {
  /**
   * Get all authorized signatories for a specific clinic
   */
  async getSignatoriesByClinic(
    clinicId: string,
    branchId?: string,
  ): Promise<PathologySignatory[]> {
    try {
      const signatoriesRef = collection(db, PATHOLOGY_SIGNATORIES_COLLECTION);
      let q = query(
        signatoriesRef,
        where("clinicId", "==", clinicId),
        where("isActive", "==", true),
      );

      if (branchId) {
        q = query(
          signatoriesRef,
          where("clinicId", "==", clinicId),
          where("branchId", "==", branchId),
          where("isActive", "==", true),
        );
      }

      const querySnapshot = await getDocs(q);
      const signatories: PathologySignatory[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        signatories.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as PathologySignatory);
      });

      // Sort in memory to avoid needing a Firestore composite index
      return signatories.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error getting pathology signatories by clinic:", error);
      throw error;
    }
  },

  /**
   * Create a new authorized signatory
   */
  async createSignatory(
    signatoryData: Omit<PathologySignatory, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const signatoriesRef = collection(db, PATHOLOGY_SIGNATORIES_COLLECTION);

      const now = Timestamp.now();
      const data = removeUndefinedFields({
        ...signatoryData,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(signatoriesRef, data);
      return docRef.id;
    } catch (error) {
      console.error("Error creating pathology signatory:", error);
      throw error;
    }
  },

  /**
   * Update an authorized signatory
   */
  async updateSignatory(
    id: string,
    updates: Partial<Omit<PathologySignatory, "id" | "createdAt" | "updatedAt">>,
  ): Promise<void> {
    try {
      const docRef = doc(db, PATHOLOGY_SIGNATORIES_COLLECTION, id);
      const now = Timestamp.now();

      const data = removeUndefinedFields({
        ...updates,
        updatedAt: now,
      });

      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating pathology signatory:", error);
      throw error;
    }
  },

  /**
   * Delete an authorized signatory (soft delete)
   */
  async deleteSignatory(id: string): Promise<void> {
    try {
      const docRef = doc(db, PATHOLOGY_SIGNATORIES_COLLECTION, id);
      const now = Timestamp.now();

      await updateDoc(docRef, {
        isActive: false,
        updatedAt: now,
      });
    } catch (error) {
      console.error("Error deleting pathology signatory:", error);
      throw error;
    }
  },
};
