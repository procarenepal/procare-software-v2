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
import { ClinicType } from "../types/models";

import { pageService } from "./pageService";

const CLINIC_TYPES_COLLECTION = "clinic_types";

const mapClinicTypeDoc = (docSnap: any): ClinicType => {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
  } as ClinicType;
};

/**
 * Service for managing clinic type data in Firestore
 */
export const clinicTypeService = {
  /**
   * Create a new clinic type
   * @param {Partial<ClinicType>} clinicTypeData - Data for the new clinic type
   * @returns {Promise<string>} - ID of the created clinic type
   */
  async createClinicType(clinicTypeData: Partial<ClinicType>): Promise<string> {
    try {
      const clinicTypesRef = collection(db, CLINIC_TYPES_COLLECTION);
      const docRef = await addDoc(clinicTypesRef, {
        ...clinicTypeData,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Clinic type created with ID:", docRef.id);

      // Auto-assign pages that are marked for auto-assignment
      try {
        console.log("Starting auto-assignment process...");
        await pageService.autoAssignPagesToClinicType(docRef.id);
        console.log("Auto-assignment completed successfully");
      } catch (autoAssignError) {
        console.error(
          "Error auto-assigning pages to new clinic type:",
          autoAssignError,
        );
        // Don't throw here to avoid breaking clinic type creation
      }

      return docRef.id;
    } catch (error) {
      console.error("Error creating clinic type:", error);
      throw error;
    }
  },

  /**
   * Get a clinic type by ID
   * @param {string} id - Clinic type ID
   * @returns {Promise<ClinicType | null>} - Clinic type data or null if not found
   */
  async getClinicTypeById(id: string): Promise<ClinicType | null> {
    try {
      const docRef = doc(db, CLINIC_TYPES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return mapClinicTypeDoc(docSnap);
      }

      return null;
    } catch (error) {
      console.error("Error getting clinic type:", error);
      throw error;
    }
  },

  /**
   * Get all clinic types
   * @returns {Promise<ClinicType[]>} - Array of all clinic types
   */
  async getAllClinicTypes(): Promise<ClinicType[]> {
    try {
      const clinicTypesRef = collection(db, CLINIC_TYPES_COLLECTION);
      const querySnapshot = await getDocs(clinicTypesRef);

      return querySnapshot.docs.map((doc) => mapClinicTypeDoc(doc));
    } catch (error) {
      console.error("Error getting all clinic types:", error);
      throw error;
    }
  },

  /**
   * Get active clinic types
   * @returns {Promise<ClinicType[]>} - Array of active clinic types
   */
  async getActiveClinicTypes(): Promise<ClinicType[]> {
    try {
      const clinicTypesRef = collection(db, CLINIC_TYPES_COLLECTION);
      const q = query(clinicTypesRef, where("isActive", "==", true));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => mapClinicTypeDoc(doc));
    } catch (error) {
      console.error("Error getting active clinic types:", error);
      throw error;
    }
  },

  /**
   * Update a clinic type's information
   * @param {string} id - Clinic type ID
   * @param {Partial<ClinicType>} updateData - Updated clinic type data
   * @returns {Promise<void>}
   */
  async updateClinicType(
    id: string,
    updateData: Partial<ClinicType>,
  ): Promise<void> {
    try {
      const docRef = doc(db, CLINIC_TYPES_COLLECTION, id);

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating clinic type:", error);
      throw error;
    }
  },

  /**
   * Delete a clinic type
   * @param {string} id - Clinic type ID
   * @returns {Promise<void>}
   */
  async deleteClinicType(id: string): Promise<void> {
    try {
      const docRef = doc(db, CLINIC_TYPES_COLLECTION, id);

      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting clinic type:", error);
      throw error;
    }
  },

  /**
   * Toggle a clinic type's active status
   * @param {string} id - Clinic type ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<void>}
   */
  async toggleClinicTypeStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const docRef = doc(db, CLINIC_TYPES_COLLECTION, id);

      await updateDoc(docRef, {
        isActive: isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating clinic type status:", error);
      throw error;
    }
  },
};
