import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/config/firebase";
import { DoctorSpeciality } from "@/types/models";

export const specialityService = {
  /**
   * Create a new doctor speciality
   * @param {Partial<DoctorSpeciality>} specialityData - Speciality data to create
   * @returns {Promise<string>} - ID of the created speciality
   */
  async createSpeciality(
    specialityData: Partial<DoctorSpeciality>,
  ): Promise<string> {
    try {
      const specialitiesCollection = collection(db, "doctor_specialities");

      const docRef = await addDoc(specialitiesCollection, {
        ...specialityData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating speciality:", error);
      throw error;
    }
  },

  /**
   * Get a speciality by ID
   * @param {string} id - Speciality ID
   * @returns {Promise<DoctorSpeciality | null>} - Speciality data or null if not found
   */
  async getSpecialityById(id: string): Promise<DoctorSpeciality | null> {
    try {
      const docRef = doc(db, "doctor_specialities", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as DoctorSpeciality;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting speciality:", error);
      throw error;
    }
  },

  /**
   * Update a speciality
   * @param {string} id - Speciality ID
   * @param {Partial<DoctorSpeciality>} updateData - Fields to update
   * @returns {Promise<void>}
   */
  async updateSpeciality(
    id: string,
    updateData: Partial<DoctorSpeciality>,
  ): Promise<void> {
    try {
      const docRef = doc(db, "doctor_specialities", id);

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating speciality:", error);
      throw error;
    }
  },

  /**
   * Delete a speciality
   * @param {string} id - Speciality ID
   * @returns {Promise<void>}
   */
  async deleteSpeciality(id: string): Promise<void> {
    try {
      const docRef = doc(db, "doctor_specialities", id);

      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting speciality:", error);
      throw error;
    }
  },

  /**
   * Get all specialities for a clinic, optionally scoped by branch.
   * When branchId is provided: returns specialities for that branch plus clinic-wide defaults (missing/empty branchId).
   * @param {string} clinicId - Clinic ID
   * @param {boolean} activeOnly - Whether to return only active specialities
   * @param {string} [branchId] - Optional branch ID to scope results (branch-specific + clinic-wide defaults)
   * @returns {Promise<DoctorSpeciality[]>} - Array of specialities
   */
  async getSpecialitiesByClinic(
    clinicId: string,
    activeOnly: boolean = false,
    branchId?: string,
  ): Promise<DoctorSpeciality[]> {
    try {
      const specialitiesCollection = collection(db, "doctor_specialities");

      const queryConditions = [
        where("clinicId", "==", clinicId),
        orderBy("name", "asc"),
      ];

      if (activeOnly) {
        queryConditions.splice(1, 0, where("isActive", "==", true));
      }

      const q = query(specialitiesCollection, ...queryConditions);
      const querySnapshot = await getDocs(q);

      const specialities: DoctorSpeciality[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        specialities.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as DoctorSpeciality);
      });

      if (branchId) {
        return specialities.filter(
          (s) =>
            s.branchId === branchId ||
            !s.branchId ||
            (typeof s.branchId === "string" && s.branchId.trim() === ""),
        );
      }

      return specialities;
    } catch (error) {
      console.error("Error getting specialities by clinic:", error);
      throw error;
    }
  },

  /**
   * Get active specialities for dropdown usage, optionally scoped by branch.
   * @param {string} clinicId - Clinic ID
   * @param {string} [branchId] - Optional branch ID to show only that branch's specialities plus clinic-wide defaults
   * @returns {Promise<Array<{key: string, label: string}>>} - Array of key-label pairs
   */
  async getActiveSpecialitiesForDropdown(
    clinicId: string,
    branchId?: string,
  ): Promise<Array<{ key: string; label: string }>> {
    try {
      const specialities = await this.getSpecialitiesByClinic(
        clinicId,
        true,
        branchId,
      );

      return specialities.map((speciality) => ({
        key: speciality.key,
        label: speciality.name,
      }));
    } catch (error) {
      console.error("Error getting specialities for dropdown:", error);
      throw error;
    }
  },

  /**
   * Check if a speciality key already exists in a clinic
   * @param {string} clinicId - Clinic ID
   * @param {string} key - Speciality key to check
   * @param {string} excludeId - ID to exclude from check (for updates)
   * @returns {Promise<boolean>} - True if key exists
   */
  async isKeyExists(
    clinicId: string,
    key: string,
    excludeId?: string,
  ): Promise<boolean> {
    try {
      const specialitiesCollection = collection(db, "doctor_specialities");
      const q = query(
        specialitiesCollection,
        where("clinicId", "==", clinicId),
        where("key", "==", key),
      );

      const querySnapshot = await getDocs(q);

      if (excludeId) {
        // Check if any document other than the excluded one has this key
        return querySnapshot.docs.some((doc) => doc.id !== excludeId);
      }

      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking if key exists:", error);
      throw error;
    }
  },

  /**
   * Toggle speciality active status
   * @param {string} id - Speciality ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<void>}
   */
  async toggleSpecialityStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await this.updateSpeciality(id, { isActive });
    } catch (error) {
      console.error("Error toggling speciality status:", error);
      throw error;
    }
  },
};
