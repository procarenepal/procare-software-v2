import type { QueryDocumentSnapshot } from "firebase/firestore";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { Patient } from "../types/models";

import { cacheService } from "@/services/cacheService";

const PATIENTS_COLLECTION = "patients";

/**
 * Service for managing patient data in Firestore
 */
export const patientService = {
  /**
   * Generate the next registration number for a clinic
   * @param {string} clinicId - ID of the clinic
   * @returns {Promise<string>} - Next registration number in sequence
   */
  async getNextRegistrationNumber(clinicId: string): Promise<string> {
    try {
      const patientsRef = collection(db, PATIENTS_COLLECTION);

      // 1) Prefer numeric ordering when available to avoid lexicographic errors
      try {
        const qNumeric = query(
          patientsRef,
          where("clinicId", "==", clinicId),
          orderBy("regNumberNumeric", "desc"),
          limit(1),
        );
        const snapNumeric = await getDocs(qNumeric);

        if (!snapNumeric.empty) {
          const last = snapNumeric.docs[0].data() as any;
          const lastNum =
            typeof last.regNumberNumeric === "number"
              ? last.regNumberNumeric
              : parseInt(String(last.regNumber || ""), 10);
          const next = isNaN(lastNum) ? 1 : lastNum + 1;

          return String(next);
        }
      } catch (e) {
        // Field may not exist on older records; fall back below
      }

      // 2) Fallback: fetch recent patients by createdAt and compute max numeric reg
      const qRecent = query(
        patientsRef,
        where("clinicId", "==", clinicId),
        orderBy("createdAt", "desc"),
        limit(100),
      );
      const recentSnap = await getDocs(qRecent);

      if (recentSnap.empty) {
        return "1";
      }

      let maxReg = 0;

      recentSnap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const regStr = String(data.regNumber ?? "").trim();
        const parsed = parseInt(regStr, 10);

        if (!isNaN(parsed) && parsed > maxReg) maxReg = parsed;
        if (
          typeof data.regNumberNumeric === "number" &&
          data.regNumberNumeric > maxReg
        )
          maxReg = data.regNumberNumeric;
      });

      return String((maxReg || 0) + 1);
    } catch (error) {
      console.error("Error generating next registration number:", error);
      throw error;
    }
  },

  /**
   * Create a new patient
   * @param {Partial<Patient>} patientData - Data for the new patient
   * @returns {Promise<string>} - ID of the created patient
   */
  async createPatient(patientData: Partial<Patient>): Promise<string> {
    try {
      const patientsRef = collection(db, PATIENTS_COLLECTION);
      const regNumberNumeric = patientData.regNumber
        ? parseInt(String(patientData.regNumber), 10)
        : undefined;
      const docRef = await addDoc(patientsRef, {
        ...patientData,
        ...(regNumberNumeric && !isNaN(regNumberNumeric)
          ? { regNumberNumeric }
          : {}),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Invalidate cache to ensure new patient appears in search immediately
      if (patientData.clinicId) {
        cacheService.invalidateClinicPatients(patientData.clinicId);
        // Also invalidate doctor-specific cache if patient has a doctorId
        if (patientData.doctorId) {
          cacheService.invalidateDoctorPatients(
            patientData.clinicId,
            patientData.doctorId,
          );
        }
      }

      return docRef.id;
    } catch (error) {
      console.error("Error creating patient:", error);
      throw error;
    }
  },

  /**
   * Get a patient by ID
   * @param {string} id - Patient ID
   * @returns {Promise<Patient | null>} - Patient data or null if not found
   */
  async getPatientById(id: string): Promise<Patient | null> {
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();
        const dob = data.dob ? new Date(data.dob.seconds * 1000) : undefined;
        const bsDate = data.bsDate
          ? new Date(data.bsDate.seconds * 1000)
          : undefined;

        return {
          id: docSnap.id,
          ...data,
          createdAt,
          updatedAt,
          dob,
          bsDate,
        } as Patient;
      }

      return null;
    } catch (error) {
      console.error("Error getting patient:", error);
      throw error;
    }
  },

  /**
   * Get all patients for a specific clinic.
   * Optionally scope by branch for branch-aware views.
   * @param {string} clinicId - ID of the clinic
   * @param {string} [branchId] - Optional branch ID to filter patients by
   * @returns {Promise<Patient[]>} - Array of patients for the clinic (ordered by registration number descending)
   */
  async getPatientsByClinic(
    clinicId: string,
    branchId?: string,
  ): Promise<Patient[]> {
    try {
      const patientsRef = collection(db, PATIENTS_COLLECTION);

      // For clinic-wide queries, use cache; for branch-scoped queries, always hit Firestore
      if (!branchId) {
        const cached = cacheService.getClinicPatients(clinicId) as
          | Patient[]
          | null;

        if (cached && !this.shouldBypassPatientsCache(cached)) {
          return cached as Patient[];
        }
      }

      const baseConstraints: any[] = [
        where("clinicId", "==", clinicId),
        where("isActive", "==", true),
      ];

      if (branchId) {
        baseConstraints.push(where("branchId", "==", branchId));
      }

      // Prefer numeric ordering when available
      let q: any;

      try {
        const numericConstraints = [
          ...baseConstraints,
          orderBy("regNumberNumeric", "desc"),
        ];
        const probeQ = query(patientsRef, ...numericConstraints, limit(1));

        await getDocs(probeQ);
        q = query(patientsRef, ...numericConstraints);
      } catch {
        const fallbackConstraints = [
          ...baseConstraints,
          orderBy("regNumber", "desc"),
        ];

        q = query(patientsRef, ...fallbackConstraints);
      }

      const querySnapshot = await getDocs(q);

      const patients: Patient[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();
        const dob = data.dob ? new Date(data.dob.seconds * 1000) : undefined;
        const bsDate = data.bsDate
          ? new Date(data.bsDate.seconds * 1000)
          : undefined;

        patients.push({
          id: docSnap.id,
          ...data,
          createdAt,
          updatedAt,
          dob,
          bsDate,
        } as Patient);
      });

      // Only cache the full clinic-wide list; branch-scoped results are not cached separately
      if (!branchId) {
        cacheService.setClinicPatients(clinicId, patients);
      }

      return patients;
    } catch (error) {
      console.error("Error getting patients by clinic:", error);
      throw error;
    }
  },

  /**
   * Update a patient's information
   * @param {string} id - Patient ID
   * @param {Partial<Patient>} updateData - Updated patient data
   * @returns {Promise<void>}
   */
  async updatePatient(
    id: string,
    updateData: Partial<Patient> | Record<string, any>,
  ): Promise<void> {
    try {
      // Get patient data before update to know clinicId and doctorId for cache invalidation
      const existingPatient = await this.getPatientById(id);
      const clinicId =
        existingPatient?.clinicId || (updateData as any).clinicId;
      const oldDoctorId = existingPatient?.doctorId;
      const newDoctorId = (updateData as any).doctorId;

      // Filter out undefined values as Firebase doesn't support them
      const cleanedUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined),
      );

      const docRef = doc(db, PATIENTS_COLLECTION, id);

      await updateDoc(docRef, {
        ...cleanedUpdateData,
        updatedAt: serverTimestamp(),
      });

      // Invalidate cache to ensure updated patient appears correctly in search
      if (clinicId) {
        cacheService.invalidateClinicPatients(clinicId);
        // Invalidate old doctor cache if doctor changed
        if (oldDoctorId) {
          cacheService.invalidateDoctorPatients(clinicId, oldDoctorId);
        }
        // Invalidate new doctor cache if doctor changed
        if (newDoctorId && newDoctorId !== oldDoctorId) {
          cacheService.invalidateDoctorPatients(clinicId, newDoctorId);
        }
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      throw error;
    }
  },

  /**
   * Delete a patient (hard delete - permanently removes the document)
   * @param {string} id - Patient ID to delete
   * @returns {Promise<void>}
   */
  async deletePatient(id: string): Promise<void> {
    try {
      // Get patient data before delete to know clinicId and doctorId for cache invalidation
      const existingPatient = await this.getPatientById(id);
      const clinicId = existingPatient?.clinicId;
      const doctorId = existingPatient?.doctorId;

      const docRef = doc(db, PATIENTS_COLLECTION, id);

      await deleteDoc(docRef); // Hard delete

      // Invalidate cache to ensure deleted patient is removed from search
      if (clinicId) {
        cacheService.invalidateClinicPatients(clinicId);
        if (doctorId) {
          cacheService.invalidateDoctorPatients(clinicId, doctorId);
        }
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      throw error;
    }
  },

  /**
   * Search patients by name, email, or phone for a specific clinic
   * @param {string} clinicId - ID of the clinic
   * @param {string} searchTerm - Search term
   * @returns {Promise<Patient[]>} - Array of matching patients
   */
  async searchPatients(
    clinicId: string,
    searchTerm: string,
  ): Promise<Patient[]> {
    try {
      // Get all patients for the clinic first, then filter client-side
      // Firestore doesn't support complex text search natively
      const allPatients = await this.getPatientsByClinic(clinicId);

      const lowerSearchTerm = searchTerm.toLowerCase();

      return allPatients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(lowerSearchTerm) ||
          patient.email?.toLowerCase().includes(lowerSearchTerm) ||
          patient.mobile.includes(searchTerm) ||
          patient.phone?.includes(searchTerm) ||
          patient.regNumber.includes(searchTerm),
      );
    } catch (error) {
      console.error("Error searching patients:", error);
      throw error;
    }
  },

  /**
   * Get patients by doctor for a specific clinic.
   * Optionally scope by branch for branch-aware views.
   * @param {string} clinicId - ID of the clinic
   * @param {string} doctorId - ID of the doctor
   * @param {string} [branchId] - Optional branch ID to filter by
   * @returns {Promise<Patient[]>} - Array of patients assigned to the doctor
   */
  async getPatientsByDoctor(
    clinicId: string,
    doctorId: string,
    branchId?: string,
  ): Promise<Patient[]> {
    try {
      const patientsRef = collection(db, PATIENTS_COLLECTION);

      // Only use cache for clinic-wide, doctor-scoped queries
      if (!branchId) {
        const cached = cacheService.getDoctorPatients(clinicId, doctorId) as
          | Patient[]
          | null;

        if (cached && !this.shouldBypassPatientsCache(cached)) {
          return cached as Patient[];
        }
      }

      const constraints: any[] = [
        where("clinicId", "==", clinicId),
        where("doctorId", "==", doctorId),
        where("isActive", "==", true),
      ];

      if (branchId) {
        constraints.push(where("branchId", "==", branchId));
      }

      const q = query(patientsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const patients: Patient[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Convert Firebase Timestamp objects to JavaScript Date objects
        const createdAt = data.createdAt
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt.seconds * 1000)
          : new Date();
        const dob = data.dob ? new Date(data.dob.seconds * 1000) : undefined;
        const bsDate = data.bsDate
          ? new Date(data.bsDate.seconds * 1000)
          : undefined;

        patients.push({
          id: docSnap.id,
          ...data,
          createdAt,
          updatedAt,
          dob,
          bsDate,
        } as Patient);
      });

      if (!branchId) {
        cacheService.setDoctorPatients(clinicId, doctorId, patients);
      }

      return patients;
    } catch (error) {
      console.error("Error getting patients by doctor:", error);
      throw error;
    }
  },

  /**
   * Paginated patients for a clinic with optional filters.
   * Does not use cache; always fetches fresh from Firestore.
   * @param clinicId - ID of the clinic
   * @param options - pageSize, lastDoc (cursor), doctorId, searchPrefix, gender, isCritical
   * @returns { patients, lastDoc }
   */
  async getPatientsByClinicPaginated(
    clinicId: string,
    options: {
      pageSize: number;
      lastDoc?: QueryDocumentSnapshot | null;
      doctorId?: string;
      searchPrefix?: string;
      gender?: string;
      isCritical?: boolean;
      branchId?: string;
    },
  ): Promise<{ patients: Patient[]; lastDoc: QueryDocumentSnapshot | null }> {
    const {
      pageSize,
      lastDoc,
      doctorId,
      searchPrefix,
      gender,
      isCritical,
      branchId,
    } = options;
    const prefix = searchPrefix?.trim();
    const hasNameSearch = Boolean(prefix);

    if (import.meta.env.DEV) {
      console.log(
        "%c[PatientsSearch:service] getPatientsByClinicPaginated",
        "color: #0d9488",
        {
          clinicId,
          searchPrefix: searchPrefix ?? "(none)",
          prefix: prefix ?? "(none)",
          hasNameSearch,
          gender,
          isCritical,
          pageSize,
          hasCursor: !!lastDoc,
        },
      );
    }

    const patientsRef = collection(db, PATIENTS_COLLECTION);

    const baseConstraints: any[] = [
      where("clinicId", "==", clinicId),
      where("isActive", "==", true),
    ];

    if (branchId) baseConstraints.push(where("branchId", "==", branchId));
    if (doctorId) baseConstraints.push(where("doctorId", "==", doctorId));
    if (gender) baseConstraints.push(where("gender", "==", gender));
    if (isCritical === true)
      baseConstraints.push(where("isCritical", "==", true));
    if (isCritical === false)
      baseConstraints.push(where("isCritical", "==", false));

    let q: any;

    if (hasNameSearch) {
      baseConstraints.push(where("name", ">=", prefix));
      baseConstraints.push(where("name", "<=", prefix + "\uf8ff"));
      baseConstraints.push(orderBy("name"));
      q = query(patientsRef, ...baseConstraints);
    } else {
      try {
        baseConstraints.push(orderBy("regNumberNumeric", "desc"));
        const probeQ = query(patientsRef, ...baseConstraints, limit(1));

        await getDocs(probeQ);
        q = query(patientsRef, ...baseConstraints);
      } catch {
        baseConstraints.pop(); // remove regNumberNumeric orderBy
        baseConstraints.push(orderBy("regNumber", "desc"));
        q = query(patientsRef, ...baseConstraints);
      }
    }

    const paginatedQ = lastDoc
      ? query(q, startAfter(lastDoc), limit(pageSize))
      : query(q, limit(pageSize));
    const snapshot = await getDocs(paginatedQ);

    const patients: Patient[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const createdAt = data.createdAt
        ? new Date(data.createdAt.seconds * 1000)
        : new Date();
      const updatedAt = data.updatedAt
        ? new Date(data.updatedAt.seconds * 1000)
        : new Date();
      const dob = data.dob ? new Date(data.dob.seconds * 1000) : undefined;
      const bsDate = data.bsDate
        ? new Date(data.bsDate.seconds * 1000)
        : undefined;

      patients.push({
        id: docSnap.id,
        ...data,
        createdAt,
        updatedAt,
        dob,
        bsDate,
      } as Patient);
    });

    const last =
      snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    if (import.meta.env.DEV) {
      console.log(
        "%c[PatientsSearch:service] getPatientsByClinicPaginated result",
        "color: #0d9488",
        {
          searchPrefix: searchPrefix ?? "(none)",
          returnedCount: patients.length,
        },
      );
    }

    return { patients, lastDoc: last };
  },

  /**
   * Get total count of patients for a clinic with the same filters as getPatientsByClinicPaginated.
   */
  async getPatientsCountByClinic(
    clinicId: string,
    options: {
      doctorId?: string;
      searchPrefix?: string;
      gender?: string;
      isCritical?: boolean;
      branchId?: string;
    },
  ): Promise<number> {
    const { doctorId, searchPrefix, gender, isCritical, branchId } =
      options as {
        doctorId?: string;
        searchPrefix?: string;
        gender?: string;
        isCritical?: boolean;
        branchId?: string;
      };
    const prefix = searchPrefix?.trim();
    const hasNameSearch = Boolean(prefix);

    if (
      typeof window !== "undefined" &&
      (window as any).__DEBUG_PATIENTS_SEARCH
    ) {
      console.log("[PatientsSearch:service] getPatientsCountByClinic", {
        searchPrefix: searchPrefix ?? "(none)",
        hasNameSearch,
      });
    }

    const patientsRef = collection(db, PATIENTS_COLLECTION);

    const baseConstraints: any[] = [
      where("clinicId", "==", clinicId),
      where("isActive", "==", true),
    ];

    if (branchId) baseConstraints.push(where("branchId", "==", branchId));
    if (doctorId) baseConstraints.push(where("doctorId", "==", doctorId));
    if (gender) baseConstraints.push(where("gender", "==", gender));
    if (isCritical === true)
      baseConstraints.push(where("isCritical", "==", true));
    if (isCritical === false)
      baseConstraints.push(where("isCritical", "==", false));

    let q: any;

    if (hasNameSearch) {
      baseConstraints.push(where("name", ">=", prefix));
      baseConstraints.push(where("name", "<=", prefix + "\uf8ff"));
      baseConstraints.push(orderBy("name"));
      q = query(patientsRef, ...baseConstraints);
    } else {
      try {
        baseConstraints.push(orderBy("regNumberNumeric", "desc"));
        q = query(patientsRef, ...baseConstraints);
        const countSnap = await getCountFromServer(q);

        return countSnap.data().count;
      } catch {
        baseConstraints.pop();
        baseConstraints.push(orderBy("regNumber", "desc"));
        q = query(patientsRef, ...baseConstraints);
      }
    }

    const countSnap = await getCountFromServer(q);
    const count = countSnap.data().count;

    if (import.meta.env.DEV) {
      console.log(
        "%c[PatientsSearch:service] getPatientsCountByClinic result",
        "color: #0d9488",
        {
          searchPrefix: searchPrefix ?? "(none)",
          count,
        },
      );
    }

    return count;
  },
};

// Helper: Evaluate whether cached patient list should be bypassed
// We bypass if we detect obviously wrong DOBs (e.g., set to "today") and missing ages
// which can happen if older code defaulted DOB to current date.
(patientService as any).shouldBypassPatientsCache = (
  patients: Patient[],
): boolean => {
  try {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (const p of patients) {
      const hasBadDob =
        p.dob instanceof Date &&
        Math.abs(now.getTime() - p.dob.getTime()) < oneDayMs;
      const missingAge =
        !(typeof (p as any).age === "number" && (p as any).age > 0) &&
        typeof (p as any).age !== "string";

      if (hasBadDob && missingAge) return true;
    }

    return false;
  } catch {
    return false;
  }
};
