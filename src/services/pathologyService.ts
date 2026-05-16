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
  writeBatch,
} from "firebase/firestore";

import { db } from "../config/firebase";
import {
  PathologyOrder,
  PathologyTestTemplate,
  PathologyCategory,
  PathologyUnit,
  PathologyParameter,
  PathologyTestType,
} from "../types/models";



const PATHOLOGY_TEST_TEMPLATES_COLLECTION = "pathologyTestTemplates";
const PATHOLOGY_ORDERS_COLLECTION = "pathologyOrders";
const PATHOLOGY_CATEGORIES_COLLECTION = "pathologyCategories";
const PATHOLOGY_UNITS_COLLECTION = "pathologyUnits";
const PATHOLOGY_PARAMETERS_COLLECTION = "pathologyParameters";
const PATHOLOGY_TEST_TYPES_COLLECTION = "pathologyTestTypes";

// Helper to strip out undefined values before sending data to Firestore
function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  // Handle Firebase Timestamps specifically if they exist
  if ((obj as any).toDate && typeof (obj as any).toDate === 'function') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item)) as any;
  }

  const cleaned: Record<string, any> = {};
  Object.entries(obj as any).forEach(([key, value]) => {
    if (value !== undefined) {
      cleaned[key] = removeUndefinedFields(value);
    }
  });

  return cleaned as T;
}

/**
 * Service for managing pathology data
 */
export const pathologyService = {
  // ============= PATHOLOGY TEST TEMPLATES (New Hospital Workflow) =============

  async getTestTemplatesByClinic(
    clinicId: string,
    branchId?: string,
  ): Promise<PathologyTestTemplate[]> {
    try {
      const ref = collection(db, PATHOLOGY_TEST_TEMPLATES_COLLECTION);
      let q = query(
        ref,
        where("clinicId", "==", clinicId),
        where("isActive", "==", true),
      );

      if (branchId) {
        q = query(
          ref,
          where("clinicId", "==", clinicId),
          where("branchId", "==", branchId),
          where("isActive", "==", true),
        );
      }


      const querySnapshot = await getDocs(q);
      const templates: PathologyTestTemplate[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        templates.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as PathologyTestTemplate);
      });

      return templates.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
      console.error("Error getting pathology templates:", error);
      throw error;
    }
  },

  async createTestTemplate(
    data: Omit<PathologyTestTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, PATHOLOGY_TEST_TEMPLATES_COLLECTION), {
      ...removeUndefinedFields(data),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async updateTestTemplate(id: string, updates: Partial<PathologyTestTemplate>): Promise<void> {
    const docRef = doc(db, PATHOLOGY_TEST_TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
      ...removeUndefinedFields(updates),
      updatedAt: Timestamp.now(),
    });
  },

  async deleteTestTemplate(id: string): Promise<void> {
    const docRef = doc(db, PATHOLOGY_TEST_TEMPLATES_COLLECTION, id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  },

  // ============= PATHOLOGY ORDERS (New Hospital Workflow) =============

  async getOrdersByClinic(
    clinicId: string,
    branchId?: string,
  ): Promise<PathologyOrder[]> {
    try {
      const ref = collection(db, PATHOLOGY_ORDERS_COLLECTION);
      let q = query(
        ref,
        where("clinicId", "==", clinicId),
        where("isActive", "==", true),
      );

      if (branchId) {
        q = query(
          ref,
          where("clinicId", "==", clinicId),
          where("branchId", "==", branchId),
          where("isActive", "==", true),
        );
      }

      console.log(`[Service Diagnostic] getOrdersByClinic: clinicId=${clinicId}, branchId=${branchId}`);
      const querySnapshot = await getDocs(q);
      console.log(`[Service Diagnostic] Query returned ${querySnapshot.size} documents`);
      const orders: PathologyOrder[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          collectionDate: data.collectionDate?.toDate(),
          receivedDate: data.receivedDate?.toDate(),
          completedDate: data.completedDate?.toDate(),
          verifiedDate: data.verifiedDate?.toDate(),
        } as PathologyOrder);
      });

      return orders.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    } catch (error) {
      console.error("Error getting pathology orders:", error);
      throw error;
    }
  },

  async createOrder(
    data: Omit<PathologyOrder, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, PATHOLOGY_ORDERS_COLLECTION), {
      ...removeUndefinedFields(data),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async updateOrder(id: string, updates: Partial<PathologyOrder>): Promise<void> {
    const docRef = doc(db, PATHOLOGY_ORDERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...removeUndefinedFields(updates),
      updatedAt: Timestamp.now(),
    });
  },

  async deleteOrder(id: string): Promise<void> {
    const docRef = doc(db, PATHOLOGY_ORDERS_COLLECTION, id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  },


  /**
   * Generates a unique accession number (Lab ID)
   */
  async generateAccessionNumber(clinicId: string): Promise<string> {
    const ref = collection(db, PATHOLOGY_ORDERS_COLLECTION);
    const q = query(ref, where("clinicId", "==", clinicId));

    const snap = await getDocs(q);
    const count = snap.size + 1;
    const year = new Date().getFullYear();
    return `LAB-${year}-${count.toString().padStart(5, "0")}`;
  },

  // ============= LEGACY PATHOLOGY TESTS (Maintain Compatibility) =============

  /**
   * Get all pathology tests for a specific clinic
   * Note: patientId is now optional, patientName is required
   */
  async getTestsByClinic(
    clinicId: string,
    branchId?: string,
  ): Promise<any[]> {
    try {
      const testsRef = collection(db, "pathologyTests");
      let q = query(
        testsRef,
        where("clinicId", "==", clinicId),
        where("isActive", "==", true),
      );

      if (branchId) {
        q = query(
          testsRef,
          where("clinicId", "==", clinicId),
          where("branchId", "==", branchId),
          where("isActive", "==", true),
        );
      }


      const querySnapshot = await getDocs(q);
      const tests: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        tests.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      return tests.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    } catch (error) {
      console.error("Error getting pathology tests by clinic:", error);
      throw error;
    }
  },

  /**
   * Get a pathology test by ID
   */
  async getTestById(id: string): Promise<any | null> {
    try {
      const docRef = doc(db, "pathologyTests", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting pathology test by ID:", error);
      throw error;
    }
  },

  /**
   * Create a new pathology test
   */
  async createTest(
    testData: any,
  ): Promise<string> {
    try {
      const testsRef = collection(db, "pathologyTests");

      const now = Timestamp.now();
      const data = removeUndefinedFields({
        ...testData,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(testsRef, data);

      return docRef.id;
    } catch (error) {
      console.error("Error creating pathology test:", error);
      throw error;
    }
  },

  /**
   * Update a pathology test
   */
  async updateTest(
    id: string,
    updates: any,
  ): Promise<void> {
    try {
      const docRef = doc(db, "pathologyTests", id);
      const now = Timestamp.now();

      const data = removeUndefinedFields({
        ...updates,
        updatedAt: now,
      });

      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating pathology test:", error);
      throw error;
    }
  },

  /**
   * Delete a pathology test (soft delete)
   */
  async deleteTest(id: string): Promise<void> {
    try {
      const docRef = doc(db, "pathologyTests", id);
      const now = Timestamp.now();

      await updateDoc(docRef, {
        isActive: false,
        updatedAt: now,
      });
    } catch (error) {
      console.error("Error deleting pathology test:", error);
      throw error;
    }
  },

  /**
   * Migrate legacy tests to the modern PathologyOrder system
   */
  async migrateLegacyTests(clinicId: string, branchId: string, userId: string): Promise<{ success: number, failed: number }> {
    try {
      const legacyTests = await this.getTestsByClinic(clinicId, branchId);
      let successCount = 0;
      let failedCount = 0;

      for (const test of legacyTests) {
        if (test.migrated) continue;

        try {
          // Generate a new accession number for each
          const orderNumber = await this.generateAccessionNumber(clinicId);
          
          const orderData: Omit<PathologyOrder, "id" | "createdAt" | "updatedAt"> = {
            orderNumber,
            patientId: test.patientId || "",
            patientName: test.patientName || "Unknown Patient",
            patientAge: test.patientAge || 0,
            patientGender: test.patientGender || "other",
            testTemplateIds: [],
            testNames: [test.testName || "Legacy Test"],
            status: "completed",
            results: (test.parameters || []).map((p: any) => ({
              parameterName: p.parameterName || p.name || "Unknown",
              value: p.patientResult || p.value || "",
              unit: p.unit || "",
              referenceRange: p.referenceRange || "",
              status: "normal",
              isHeader: p.isHeader || false,
            })),
            labTechnicianName: test.labTechnicianName,
            labTechnicianId: test.labTechnicianId,
            clinicId,
            branchId,
            isActive: true,
            createdBy: userId,
            completedDate: test.createdAt || new Date(),
          };

          await this.createOrder(orderData);
          
          // Mark as migrated
          const legacyRef = doc(db, "pathologyTests", test.id);
          await updateDoc(legacyRef, { migrated: true });
          
          successCount++;
        } catch (err) {
          console.error(`Failed to migrate test ${test.id}:`, err);
          failedCount++;
        }
      }

      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error("Migration error:", error);
      throw error;
    }
  },

  // ============= PATHOLOGY CATEGORIES =============

  /**
   * Get all pathology categories for a specific clinic
   */
  async getCategoriesByClinic(
    clinicId: string,
    branchId?: string,
  ): Promise<PathologyCategory[]> {
    try {
      const categoriesRef = collection(db, PATHOLOGY_CATEGORIES_COLLECTION);
      let q = query(
        categoriesRef,
        where("clinicId", "==", clinicId),
        where("isActive", "==", true),
      );

      if (branchId) {
        q = query(
          categoriesRef,
          where("clinicId", "==", clinicId),
          where("branchId", "==", branchId),
          where("isActive", "==", true),
        );
      }


      const querySnapshot = await getDocs(q);
      const categories: PathologyCategory[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        categories.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as PathologyCategory);
      });

      return categories.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
      console.error("Error getting pathology categories by clinic:", error);
      throw error;
    }
  },

  /**
   * Get a pathology category by ID
   */
  async getCategoryById(id: string): Promise<PathologyCategory | null> {
    try {
      const docRef = doc(db, PATHOLOGY_CATEGORIES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as PathologyCategory;
      }

      return null;
    } catch (error) {
      console.error("Error getting pathology category by ID:", error);
      throw error;
    }
  },

  /**
   * Create a new pathology category
   */
  async createCategory(
    categoryData: Omit<PathologyCategory, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const categoriesRef = collection(db, PATHOLOGY_CATEGORIES_COLLECTION);

      // Check if category already exists by name (case-insensitive approximation via exact match)
      const q = query(
        categoriesRef,
        where("clinicId", "==", categoryData.clinicId),
        where("branchId", "==", categoryData.branchId),
        where("name", "==", categoryData.name.trim())
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        if (!existingDoc.data().isActive) {
          await updateDoc(doc(db, PATHOLOGY_CATEGORIES_COLLECTION, existingDoc.id), {
            isActive: true,
            updatedAt: Timestamp.now()
          });
        }
        return existingDoc.id;
      }

      const now = Timestamp.now();
      const data = removeUndefinedFields({
        ...categoryData,
        name: categoryData.name.trim(),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(categoriesRef, data);

      return docRef.id;
    } catch (error) {
      console.error("Error creating pathology category:", error);
      throw error;
    }
  },

  /**
   * Update a pathology category
   */
  async updateCategory(
    id: string,
    updates: Partial<Omit<PathologyCategory, "id" | "createdAt" | "updatedAt">>,
  ): Promise<void> {
    try {
      const docRef = doc(db, PATHOLOGY_CATEGORIES_COLLECTION, id);
      const now = Timestamp.now();

      const data = removeUndefinedFields({
        ...updates,
        updatedAt: now,
      });

      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating pathology category:", error);
      throw error;
    }
  },

  /**
   * Delete a pathology category (soft delete)
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      // 1. Mark the category as inactive
      const catRef = doc(db, PATHOLOGY_CATEGORIES_COLLECTION, id);
      batch.update(catRef, {
        isActive: false,
        updatedAt: now,
      });

      // 2. Mark all parameters in this category as inactive
      const paramsRef = collection(db, PATHOLOGY_PARAMETERS_COLLECTION);
      const qParams = query(paramsRef, where("categoryId", "==", id));
      const paramsSnap = await getDocs(qParams);
      
      paramsSnap.forEach((paramDoc) => {
        batch.update(paramDoc.ref, {
          isActive: false,
          updatedAt: now,
        });
      });

      // 3. Mark all test templates in this category as inactive
      const templatesRef = collection(db, PATHOLOGY_TEST_TEMPLATES_COLLECTION);
      const qTemplates = query(templatesRef, where("categoryId", "==", id));
      const templatesSnap = await getDocs(qTemplates);
      
      templatesSnap.forEach((templateDoc) => {
        batch.update(templateDoc.ref, {
          isActive: false,
          updatedAt: now,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error deleting pathology category and its parameters:", error);
      throw error;
    }
  },

  // ============= PATHOLOGY UNITS =============

  /**
   * Get all pathology units for a specific clinic
   */
  async getUnitsByClinic(
    clinicId: string,
    branchId?: string,
  ): Promise<PathologyUnit[]> {
    try {
      const unitsRef = collection(db, PATHOLOGY_UNITS_COLLECTION);
      let q = query(
        unitsRef,
        where("clinicId", "==", clinicId),
        where("isActive", "==", true),
      );

      if (branchId) {
        q = query(
          unitsRef,
          where("clinicId", "==", clinicId),
          where("branchId", "==", branchId),
          where("isActive", "==", true),
        );
      }


      const querySnapshot = await getDocs(q);
      const units: PathologyUnit[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        units.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as PathologyUnit);
      });

      return units.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
      console.error("Error getting pathology units by clinic:", error);
      throw error;
    }
  },

  /**
   * Get a pathology unit by ID
   */
  async getUnitById(id: string): Promise<PathologyUnit | null> {
    try {
      const docRef = doc(db, PATHOLOGY_UNITS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as PathologyUnit;
      }

      return null;
    } catch (error) {
      console.error("Error getting pathology unit by ID:", error);
      throw error;
    }
  },

  /**
   * Create a new pathology unit
   */
  async createUnit(
    unitData: Omit<PathologyUnit, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const unitsRef = collection(db, PATHOLOGY_UNITS_COLLECTION);

      const now = Timestamp.now();
      const data = removeUndefinedFields({
        ...unitData,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(unitsRef, data);

      return docRef.id;
    } catch (error) {
      console.error("Error creating pathology unit:", error);
      throw error;
    }
  },

  /**
   * Update a pathology unit
   */
  async updateUnit(
    id: string,
    updates: Partial<Omit<PathologyUnit, "id" | "createdAt" | "updatedAt">>,
  ): Promise<void> {
    try {
      const docRef = doc(db, PATHOLOGY_UNITS_COLLECTION, id);
      const now = Timestamp.now();

      const data = removeUndefinedFields({
        ...updates,
        updatedAt: now,
      });

      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating pathology unit:", error);
      throw error;
    }
  },

  /**
   * Delete a pathology unit (soft delete)
   */
  async deleteUnit(id: string): Promise<void> {
    try {
      const docRef = doc(db, PATHOLOGY_UNITS_COLLECTION, id);
      const now = Timestamp.now();

      await updateDoc(docRef, {
        isActive: false,
        updatedAt: now,
      });
    } catch (error) {
      console.error("Error deleting pathology unit:", error);
      throw error;
    }
  },

  // ============= PATHOLOGY PARAMETERS =============

  /**
   * Get all pathology parameters for a specific clinic
   */
  async getParametersByClinic(
    clinicId: string,
    branchId?: string,
  ): Promise<PathologyParameter[]> {
    try {
      const parametersRef = collection(db, PATHOLOGY_PARAMETERS_COLLECTION);
      let q = query(
        parametersRef,
        where("clinicId", "==", clinicId),
        where("isActive", "==", true),
      );

      if (branchId) {
        q = query(
          parametersRef,
          where("clinicId", "==", clinicId),
          where("branchId", "==", branchId),
          where("isActive", "==", true),
        );
      }


      const querySnapshot = await getDocs(q);
      const parameters: PathologyParameter[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        parameters.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as PathologyParameter);
      });

      return parameters.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
      console.error("Error getting pathology parameters by clinic:", error);
      throw error;
    }
  },

  /**
   * Get a pathology parameter by ID
   */
  async getParameterById(id: string): Promise<PathologyParameter | null> {
    try {
      const docRef = doc(db, PATHOLOGY_PARAMETERS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as PathologyParameter;
      }

      return null;
    } catch (error) {
      console.error("Error getting pathology parameter by ID:", error);
      throw error;
    }
  },

  /**
   * Create a new pathology parameter
   */
  async createParameter(
    parameterData: Omit<PathologyParameter, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const parametersRef = collection(db, PATHOLOGY_PARAMETERS_COLLECTION);

      const now = Timestamp.now();
      const data = removeUndefinedFields({
        ...parameterData,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(parametersRef, data);

      // Auto-create unit if it is provided and doesn't exist
      if (parameterData.unit && parameterData.unit.trim()) {
        const unitName = parameterData.unit.trim();
        const unitsRef = collection(db, "pathologyUnits");
        const q = query(
          unitsRef, 
          where("clinicId", "==", parameterData.clinicId), 
          where("branchId", "==", parameterData.branchId), 
          where("name", "==", unitName)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(unitsRef, {
            name: unitName,
            clinicId: parameterData.clinicId,
            branchId: parameterData.branchId,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdBy: parameterData.createdBy || ""
          });
        } else {
          const existingDoc = snapshot.docs[0];
          if (!existingDoc.data().isActive) {
            await updateDoc(doc(db, "pathologyUnits", existingDoc.id), {
              isActive: true,
              updatedAt: now
            });
          }
        }
      }

      return docRef.id;
    } catch (error) {
      console.error("Error creating pathology parameter:", error);
      throw error;
    }
  },

  /**
   * Update a pathology parameter
   */
  async updateParameter(
    id: string,
    updates: Partial<
      Omit<PathologyParameter, "id" | "createdAt" | "updatedAt">
    >,
  ): Promise<void> {
    try {
      const docRef = doc(db, PATHOLOGY_PARAMETERS_COLLECTION, id);
      const now = Timestamp.now();

      const data = removeUndefinedFields({
        ...updates,
        updatedAt: now,
      });

      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating pathology parameter:", error);
      throw error;
    }
  },

  /**
   * Delete a pathology parameter (soft delete)
   */
  async deleteParameter(id: string): Promise<void> {
    try {
      const docRef = doc(db, PATHOLOGY_PARAMETERS_COLLECTION, id);
      const now = Timestamp.now();

      await updateDoc(docRef, {
        isActive: false,
        updatedAt: now,
      });
    } catch (error) {
      console.error("Error deleting pathology parameter:", error);
      throw error;
    }
  },

  /**
   * Bulk delete pathology parameters (soft delete)
   */
  async bulkDeleteParameters(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      ids.forEach((id) => {
        const docRef = doc(db, PATHOLOGY_PARAMETERS_COLLECTION, id);
        batch.update(docRef, {
          isActive: false,
          updatedAt: now,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error bulk deleting pathology parameters:", error);
      throw error;
    }
  },

  // ============= PATHOLOGY TEST TYPES =============

  /**
   * Get all pathology test types for a specific clinic
   */
  async getTestTypesByClinic(
    clinicId: string,
    branchId?: string,
  ): Promise<PathologyTestType[]> {
    try {
      const testTypesRef = collection(db, PATHOLOGY_TEST_TYPES_COLLECTION);
      let q = query(
        testTypesRef,
        where("clinicId", "==", clinicId),
        where("isActive", "==", true),
      );

      if (branchId) {
        q = query(
          testTypesRef,
          where("clinicId", "==", clinicId),
          where("branchId", "==", branchId),
          where("isActive", "==", true),
        );
      }


      const querySnapshot = await getDocs(q);
      const testTypes: PathologyTestType[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        testTypes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as PathologyTestType);
      });

      return testTypes.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
      console.error("Error getting pathology test types by clinic:", error);
      throw error;
    }
  },

  /**
   * Get a pathology test type by ID
   */
  async getTestTypeById(id: string): Promise<PathologyTestType | null> {
    try {
      const docRef = doc(db, PATHOLOGY_TEST_TYPES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as PathologyTestType;
      }

      return null;
    } catch (error) {
      console.error("Error getting pathology test type by ID:", error);
      throw error;
    }
  },

  /**
   * Create a new pathology test type
   */
  async createTestType(
    testTypeData: Omit<PathologyTestType, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const testTypesRef = collection(db, PATHOLOGY_TEST_TYPES_COLLECTION);

      const now = Timestamp.now();
      const data = removeUndefinedFields({
        ...testTypeData,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(testTypesRef, data);

      return docRef.id;
    } catch (error) {
      console.error("Error creating pathology test type:", error);
      throw error;
    }
  },

  /**
   * Update a pathology test type
   */
  async updateTestType(
    id: string,
    updates: Partial<Omit<PathologyTestType, "id" | "createdAt" | "updatedAt">>,
  ): Promise<void> {
    try {
      const docRef = doc(db, PATHOLOGY_TEST_TYPES_COLLECTION, id);
      const now = Timestamp.now();

      const data = removeUndefinedFields({
        ...updates,
        updatedAt: now,
      });

      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating pathology test type:", error);
      throw error;
    }
  },

  /**
   * Delete a pathology test type (soft delete)
   */
  async deleteTestType(id: string): Promise<void> {
    try {
      const docRef = doc(db, PATHOLOGY_TEST_TYPES_COLLECTION, id);
      const now = Timestamp.now();

      await updateDoc(docRef, {
        isActive: false,
        updatedAt: now,
      });
    } catch (error) {
      console.error("Error deleting pathology test type:", error);
      throw error;
    }
  },

  /**
   * Seed a standard CBC test with all parameters
   */
  async seedCBCTest(clinicId: string, branchId: string, userId: string): Promise<boolean> {
    try {
      // 1. Create Hematology Category
      const categoryId = await this.createCategory({
        name: "Hematology",
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      });

      const getOrCreateParam = async (paramData: any) => {
        const existingParams = await this.getParametersByClinic(clinicId, branchId);
        const existing = existingParams.find(p => p.name === paramData.name);
        if (existing) {
          await this.updateParameter(existing.id, { ...paramData, updatedAt: new Date() });
          return existing.id;
        }
        return await this.createParameter(paramData);
      };

      // 2. Create Parameters
      const hbId = await getOrCreateParam({
        name: "Hemoglobin", unit: "gm/dl", isGenderSensitive: true, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        maleRange: { min: 14.0, max: 18.0, description: "14.0 - 18.0 gm/dl", tiers: [{ label: "Low", min: 0, max: 13.9, status: "abnormal" }, { label: "Normal", min: 14.0, max: 18.0, status: "normal" }, { label: "High", min: 18.1, max: 100, status: "abnormal" }] },
        femaleRange: { min: 12.0, max: 16.0, description: "12.0 - 16.0 gm/dl", tiers: [{ label: "Low", min: 0, max: 11.9, status: "abnormal" }, { label: "Normal", min: 12.0, max: 16.0, status: "normal" }, { label: "High", min: 16.1, max: 100, status: "abnormal" }] }
      });
      const tlcId = await getOrCreateParam({
        name: "Total Leucocyte Count", unit: "Cells/cumm", isGenderSensitive: false, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 4000, max: 11000, description: "4000 - 11000 Cells/cumm", tiers: [{ label: "Low", min: 0, max: 3999, status: "abnormal" }, { label: "Normal", min: 4000, max: 11000, status: "normal" }, { label: "High", min: 11001, max: 100000, status: "abnormal" }] }
      });
      const diffHeaderId = await getOrCreateParam({
        name: "Differential Leucocyte Count", unit: "", isHeader: true, indentationLevel: 0, categoryId, clinicId, branchId, isActive: true,
        allRange: { description: "" }
      });
      const neutroId = await getOrCreateParam({
        name: "Neutrophil", unit: "%", isGenderSensitive: false, indentationLevel: 1, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 40, max: 75, description: "40 - 75 %" }
      });
      const lymphoId = await getOrCreateParam({
        name: "Lymphocyte", unit: "%", isGenderSensitive: false, indentationLevel: 1, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 20, max: 45, description: "20 - 45 %" }
      });
      const monoId = await getOrCreateParam({
        name: "Monocyte", unit: "%", isGenderSensitive: false, indentationLevel: 1, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 1, max: 10, description: "1 - 10 %" }
      });
      const eosinoId = await getOrCreateParam({
        name: "Eosinophil", unit: "%", isGenderSensitive: false, indentationLevel: 1, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 0, max: 6, description: "0 - 6 %" }
      });
      const basoId = await getOrCreateParam({
        name: "Basophil", unit: "%", isGenderSensitive: false, indentationLevel: 1, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 0, max: 1, description: "0 - 1 %" }
      });
      const plateletId = await getOrCreateParam({
        name: "Total Platelet Count", unit: "Cells/cumm", isGenderSensitive: false, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 150000, max: 400000, description: "150,000 - 400,000 Cells/cumm", tiers: [{ label: "Low", min: 0, max: 149999, status: "abnormal" }, { label: "Normal", min: 150000, max: 400000, status: "normal" }, { label: "High", min: 400001, max: 2000000, status: "abnormal" }] }
      });
      const rbcId = await getOrCreateParam({
        name: "Total RBC Count", unit: "million", isGenderSensitive: true, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        maleRange: { min: 4.5, max: 5.5, description: "4.5 - 5.5 million" },
        femaleRange: { min: 4.0, max: 5.0, description: "4.0 - 5.0 million" }
      });
      const pcvId = await getOrCreateParam({
        name: "PCV", unit: "%", isGenderSensitive: false, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 40, max: 54, description: "40 - 54 %" }
      });
      const mcvId = await getOrCreateParam({
        name: "MCV", unit: "fl", isGenderSensitive: false, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 82, max: 92, description: "82 - 92 fl" }
      });
      const mchId = await getOrCreateParam({
        name: "MCH", unit: "pg", isGenderSensitive: false, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 26, max: 34, description: "26 - 34 pg" }
      });
      const mchcId = await getOrCreateParam({
        name: "MCHC", unit: "%", isGenderSensitive: false, resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 32, max: 36, description: "32 - 36 %" }
      });

      const parameterIds = [hbId, tlcId, diffHeaderId, neutroId, lymphoId, monoId, eosinoId, basoId, plateletId, rbcId, pcvId, mcvId, mchId, mchcId];

      // 3. Create Test Template
      await this.createTestTemplate({
        name: "Complete Blood Count (CBC)",
        categoryId,
        categoryName: "Hematology",
        price: 500,
        parameters: parameterIds,
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        targetType: "category"
      });
      return true;
    } catch (error) {
      console.error("Error seeding CBC test:", error);
      throw error;
    }
  },

  /**
   * Seed HIV Test (4th Gen Duo)
   */
  /**
   * Seed HIV Test (4th Gen Duo)
   */
  async seedHIVTest(clinicId: string, branchId: string, userId: string): Promise<boolean> {
    try {
      // 1. Create Category
      const categoryId = await this.createCategory({
        name: "Immunology/Serology",
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      });

      const getOrCreateParam = async (paramData: any) => {
        const existingParams = await this.getParametersByClinic(clinicId, branchId);
        const existing = existingParams.find(p => p.name === paramData.name);
        if (existing) {
          await this.updateParameter(existing.id, { ...paramData, updatedAt: new Date() });
          return existing.id;
        }
        return await this.createParameter(paramData);
      };

      // 2. Create Parameters
      const hiv1Id = await getOrCreateParam({
        name: "HIV-1 Antibody", unit: "", resultType: "qualitative", isGenderSensitive: false, categoryId, clinicId, branchId, isActive: true,
        allRange: { description: "Non-Reactive" }
      });
      const hiv2Id = await getOrCreateParam({
        name: "HIV-2 Antibody", unit: "", resultType: "qualitative", isGenderSensitive: false, categoryId, clinicId, branchId, isActive: true,
        allRange: { description: "Non-Reactive" }
      });
      const p24Id = await getOrCreateParam({
        name: "p24 Antigen", unit: "", resultType: "qualitative", isGenderSensitive: false, categoryId, clinicId, branchId, isActive: true,
        allRange: { description: "Non-Reactive" }
      });

      const parameterIds = [hiv1Id, hiv2Id, p24Id];

      // 3. Create Test Template
      await this.createTestTemplate({
        name: "HIV I & II Duo (4th Gen Screening)",
        categoryId,
        categoryName: "Immunology/Serology",
        price: 800,
        parameters: parameterIds,
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        targetType: "category"
      });

      return true;
    } catch (error) {
      console.error("Error seeding HIV test:", error);
      throw error;
    }
  },

  /**
   * Seed a standard Lipid Profile test with multi-tier dynamic ranges
   */
  async seedLipidProfile(clinicId: string, branchId: string, userId: string): Promise<boolean> {
    try {
      // 1. Create Category
      const categoryId = await this.createCategory({
        name: "Biochemistry (Lipid Profile)",
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      });

      // 2. Define Parameters with Update Logic
      const existingParams = await this.getParametersByClinic(clinicId, branchId);

      const getOrCreateParam = async (paramData: any) => {
        const existing = existingParams.find(p => p.name === paramData.name);
        if (existing) {
          await this.updateParameter(existing.id, { ...paramData, updatedAt: new Date() });
          return existing.id;
        }
        return await this.createParameter(paramData);
      };

      const ldlId = await getOrCreateParam({
        name: "LDL Cholesterol (Direct)",
        unit: "mg/dL",
        resultType: "numeric",
        isGenderSensitive: false,
        categoryId,
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        allRange: {
          description: "Optimal: <100, Near optimal: 100-129, Borderline high: 130-159, High: 160-189, Very high: >190",
          tiers: [
            { label: "Optimal", min: 0, max: 100, status: "normal" },
            { label: "Near Optimal", min: 100.01, max: 129.99, status: "borderline" },
            { label: "Borderline High", min: 130, max: 159.99, status: "borderline" },
            { label: "High", min: 160, max: 189.99, status: "high" },
            { label: "Very High", min: 190, max: 1000, status: "critical" }
          ]
        },
        maleRange: { description: "Optimal: <100" },
        femaleRange: { description: "Optimal: <100" }
      });

      const hdlId = await getOrCreateParam({
        name: "HDL Cholesterol",
        unit: "mg/dL",
        resultType: "numeric",
        isGenderSensitive: false,
        categoryId,
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        allRange: {
          description: "Low: <40, Normal: 40-60, High: >60",
          min: 40,
          max: 60
        }
      });

      const trigId = await getOrCreateParam({
        name: "Triglycerides",
        unit: "mg/dL",
        resultType: "numeric",
        isGenderSensitive: false,
        categoryId,
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        allRange: {
          description: "Normal: <150, Borderline: 150-199, High: 200-499, Very High: >500",
          max: 150,
          tiers: [
            { label: "Normal", min: 0, max: 149.99, status: "normal" },
            { label: "Borderline", min: 150, max: 199.99, status: "borderline" },
            { label: "High", min: 200, max: 499.99, status: "high" },
            { label: "Very High", min: 500, max: 5000, status: "critical" }
          ]
        }
      });

      const headerId = await getOrCreateParam({
        name: "Lipid Profile",
        unit: "",
        isHeader: true,
        indentationLevel: 0,
        categoryId,
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        allRange: { description: "" }
      });

      // 4. Create Test Template
      await this.createTestTemplate({
        name: "Lipid Profile Panel",
        categoryId,
        categoryName: "Biochemistry (Lipid Profile)",
        price: 1200,
        parameters: [headerId, ldlId, hdlId, trigId],
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        targetType: "category"
      });

      return true;
    } catch (error) {
      console.error("Error seeding Lipid Profile:", error);
      throw error;
    }
  },
  /**
   * Seed a Comprehensive Renal Function Test (RFT) with nested clinical headers
   */
  async seedRFTTest(clinicId: string, branchId: string, userId: string): Promise<boolean> {
    try {
      // 1. Create Category
      const categoryId = await this.createCategory({
        name: "Biochemistry (Renal Profile)",
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      });

      const getOrCreateParam = async (paramData: any) => {
        const existingParams = await this.getParametersByClinic(clinicId, branchId);
        const existing = existingParams.find(p => p.name === paramData.name);
        if (existing) {
          await this.updateParameter(existing.id, { ...paramData, updatedAt: new Date() });
          return existing.id;
        }
        return await this.createParameter(paramData);
      };

      // 2. Define Parameters
      const kidneyHeaderId = await getOrCreateParam({
        name: "Kidney Function Profile",
        unit: "",
        isHeader: true,
        indentationLevel: 0,
        categoryId, clinicId, branchId, isActive: true,
        allRange: { description: "" }
      });

      const ureaId = await getOrCreateParam({
        name: "Blood Urea",
        unit: "mg/dL",
        allRange: { min: 10, max: 50, description: "10-50 mg/dL" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      const creatinineId = await getOrCreateParam({
        name: "Serum Creatinine",
        unit: "mg/dL",
        allRange: { min: 0.6, max: 1.2, description: "0.6-1.2 mg/dL" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      const uricId = await getOrCreateParam({
        name: "Uric Acid",
        unit: "mg/dL",
        allRange: { min: 3.5, max: 7.2, description: "3.5-7.2 mg/dL" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      const electrolyteHeaderId = await getOrCreateParam({
        name: "Serum Electrolytes",
        unit: "",
        isHeader: true,
        indentationLevel: 0,
        categoryId, clinicId, branchId, isActive: true,
        allRange: { description: "" }
      });

      const sodiumId = await getOrCreateParam({
        name: "Sodium (Na+)",
        unit: "mEq/L",
        allRange: { min: 135, max: 145, description: "135-145 mEq/L" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      const potassiumId = await getOrCreateParam({
        name: "Potassium (K+)",
        unit: "mEq/L",
        allRange: { min: 3.5, max: 5.1, description: "3.5-5.1 mEq/L" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      // 3. Create Test Template
      await this.createTestTemplate({
        name: "Renal Function Test (RFT) Comprehensive",
        categoryId,
        categoryName: "Biochemistry (Renal Profile)",
        price: 1500,
        parameters: [kidneyHeaderId, ureaId, creatinineId, uricId, electrolyteHeaderId, sodiumId, potassiumId],
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        targetType: "category"
      });

      return true;
    } catch (error) {
      console.error("Error seeding RFT test:", error);
      throw error;
    }
  },

  /**
   * Seed a Comprehensive Liver Function Test (LFT) with nested clinical headers
   */
  async seedLFTTest(clinicId: string, branchId: string, userId: string): Promise<boolean> {
    try {
      // 1. Create Category
      const categoryId = await this.createCategory({
        name: "Biochemistry (Liver Profile)",
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      });

      const getOrCreateParam = async (paramData: any) => {
        const existingParams = await this.getParametersByClinic(clinicId, branchId);
        const existing = existingParams.find(p => p.name === paramData.name);
        if (existing) {
          await this.updateParameter(existing.id, { ...paramData, updatedAt: new Date() });
          return existing.id;
        }
        return await this.createParameter(paramData);
      };

      // 2. Define Parameters
      const bilirubinHeaderId = await getOrCreateParam({
        name: "Bilirubin Profile",
        unit: "",
        isHeader: true,
        indentationLevel: 0,
        categoryId, clinicId, branchId, isActive: true,
        allRange: { description: "" }
      });

      const totalBiliId = await getOrCreateParam({
        name: "Bilirubin Total",
        unit: "mg/dL",
        allRange: { min: 0.1, max: 1.2, description: "0.1-1.2 mg/dL" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      const directBiliId = await getOrCreateParam({
        name: "Bilirubin Direct",
        unit: "mg/dL",
        allRange: { min: 0.0, max: 0.3, description: "0.0-0.3 mg/dL" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      const enzymeHeaderId = await getOrCreateParam({
        name: "Liver Enzymes",
        unit: "",
        isHeader: true,
        indentationLevel: 0,
        categoryId, clinicId, branchId, isActive: true,
        allRange: { description: "" }
      });

      const sgptId = await getOrCreateParam({
        name: "SGPT (ALT)",
        unit: "U/L",
        allRange: { min: 0, max: 40, description: "Up to 40 U/L" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      const sgotId = await getOrCreateParam({
        name: "SGOT (AST)",
        unit: "U/L",
        allRange: { min: 0, max: 40, description: "Up to 40 U/L" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      const alpId = await getOrCreateParam({
        name: "Alkaline Phosphatase (ALP)",
        unit: "U/L",
        allRange: { min: 44, max: 147, description: "44-147 U/L" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      const proteinHeaderId = await getOrCreateParam({
        name: "Protein Profile",
        unit: "",
        isHeader: true,
        indentationLevel: 0,
        categoryId, clinicId, branchId, isActive: true,
        allRange: { description: "" }
      });

      const totalProteinId = await getOrCreateParam({
        name: "Total Protein",
        unit: "g/dL",
        allRange: { min: 6.0, max: 8.3, description: "6.0-8.3 g/dL" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      const albuminId = await getOrCreateParam({
        name: "Albumin",
        unit: "g/dL",
        allRange: { min: 3.5, max: 5.0, description: "3.5-5.0 g/dL" },
        indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, resultType: 'numeric'
      });

      // 3. Create Test Template
      await this.createTestTemplate({
        name: "Liver Function Test (LFT) Panel",
        categoryId,
        categoryName: "Biochemistry (Liver Profile)",
        price: 1300,
        parameters: [bilirubinHeaderId, totalBiliId, directBiliId, enzymeHeaderId, sgptId, sgotId, alpId, proteinHeaderId, totalProteinId, albuminId],
        clinicId,
        branchId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        targetType: "category"
      });

      return true;
    } catch (error) {
      console.error("Error seeding LFT test:", error);
      throw error;
    }
  },

  /**
   * Seed a Comprehensive Urine Analysis Test
   */
  async seedUrineTest(clinicId: string, branchId: string, userId: string): Promise<boolean> {
    try {
      const categoryId = await this.createCategory({
        name: "Urine Analysis",
        clinicId, branchId, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: userId
      });

      const getOrCreateParam = async (paramData: any) => {
        const existingParams = await this.getParametersByClinic(clinicId, branchId);
        const existing = existingParams.find(p => p.name === paramData.name);
        if (existing) {
          await this.updateParameter(existing.id, { ...paramData, updatedAt: new Date() });
          return existing.id;
        }
        return await this.createParameter(paramData);
      };

      // 1. Physical Examination
      const physicalHeader = await getOrCreateParam({
        name: "Physical Examination", isHeader: true, indentationLevel: 0,
        categoryId, clinicId, branchId, isActive: true, allRange: { description: "" }
      });
      const colorId = await getOrCreateParam({
        name: "Color", unit: "", resultType: "text", indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, allRange: { description: "Pale Yellow" }
      });
      const transparencyId = await getOrCreateParam({
        name: "Transparency", unit: "", resultType: "text", indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, allRange: { description: "Clear" }
      });

      // 2. Chemical Examination
      const chemicalHeader = await getOrCreateParam({
        name: "Chemical Examination", isHeader: true, indentationLevel: 0,
        categoryId, clinicId, branchId, isActive: true, allRange: { description: "" }
      });
      const reactionId = await getOrCreateParam({
        name: "Reaction (pH)", unit: "", resultType: "numeric", indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, allRange: { min: 4.5, max: 8.0, description: "4.5-8.0" }
      });
      const albuminId = await getOrCreateParam({
        name: "Albumin (Protein)", unit: "", resultType: "qualitative", indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, allRange: { description: "Nil" }
      });
      const sugarId = await getOrCreateParam({
        name: "Sugar (Glucose)", unit: "", resultType: "qualitative", indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, allRange: { description: "Nil" }
      });

      // 3. Microscopic Examination
      const microscopicHeader = await getOrCreateParam({
        name: "Microscopic Examination", isHeader: true, indentationLevel: 0,
        categoryId, clinicId, branchId, isActive: true, allRange: { description: "" }
      });
      const pusCellsId = await getOrCreateParam({
        name: "Pus Cells", unit: "/hpf", resultType: "text", indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, allRange: { description: "0-5 /hpf" }
      });
      const rbcId = await getOrCreateParam({
        name: "R.B.C.", unit: "/hpf", resultType: "text", indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, allRange: { description: "0-2 /hpf" }
      });
      const epithelialId = await getOrCreateParam({
        name: "Epithelial Cells", unit: "/hpf", resultType: "text", indentationLevel: 1,
        categoryId, clinicId, branchId, isActive: true, allRange: { description: "Few" }
      });

      await this.createTestTemplate({
        name: "Urine Routine & Microscopic Examination",
        categoryId,
        categoryName: "Urine Analysis",
        price: 350,
        parameters: [physicalHeader, colorId, transparencyId, chemicalHeader, reactionId, albuminId, sugarId, microscopicHeader, pusCellsId, rbcId, epithelialId],
        clinicId, branchId, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: userId, targetType: "category"
      });

      return true;
    } catch (error) {
      console.error("Error seeding Urine test:", error);
      throw error;
    }
  },

  /**
   * Seed a Thyroid Function Test (T3, T4, TSH)
   */
  async seedThyroidPanel(clinicId: string, branchId: string, userId: string): Promise<boolean> {
    try {
      const categoryId = await this.createCategory({
        name: "Thyroid Profile",
        clinicId, branchId, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: userId
      });

      const getOrCreateParam = async (paramData: any) => {
        const existingParams = await this.getParametersByClinic(clinicId, branchId);
        const existing = existingParams.find(p => p.name === paramData.name);
        if (existing) return existing.id;
        return await this.createParameter(paramData);
      };

      const t3Id = await getOrCreateParam({
        name: "Total Triiodothyronine (T3)", unit: "ng/dL", resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 80, max: 200, description: "80 - 200 ng/dL" }
      });
      const t4Id = await getOrCreateParam({
        name: "Total Thyroxine (T4)", unit: "µg/dL", resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 4.5, max: 12.0, description: "4.5 - 12.0 µg/dL" }
      });
      const tshId = await getOrCreateParam({
        name: "Thyroid Stimulating Hormone (TSH)", unit: "µIU/mL", resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 0.45, max: 4.5, description: "0.45 - 4.5 µIU/mL" }
      });

      await this.createTestTemplate({
        name: "Thyroid Function Test (TFT)",
        categoryId,
        categoryName: "Thyroid Profile",
        price: 1200,
        parameters: [t3Id, t4Id, tshId],
        clinicId, branchId, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: userId, targetType: "category"
      });

      return true;
    } catch (error) {
      console.error("Error seeding Thyroid panel:", error);
      throw error;
    }
  },

  /**
   * Seed a Diabetes / Blood Sugar Panel
   */
  async seedBloodSugarPanel(clinicId: string, branchId: string, userId: string): Promise<boolean> {
    try {
      const categoryId = await this.createCategory({
        name: "Diabetes Profile",
        clinicId, branchId, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: userId
      });

      const getOrCreateParam = async (paramData: any) => {
        const existingParams = await this.getParametersByClinic(clinicId, branchId);
        const existing = existingParams.find(p => p.name === paramData.name);
        if (existing) return existing.id;
        return await this.createParameter(paramData);
      };

      const fastingId = await getOrCreateParam({
        name: "Blood Sugar Fasting (BSF)", unit: "mg/dL", resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 70, max: 100, description: "70 - 100 mg/dL" },
        tiers: [
          { name: "Normal", min: 70, max: 100, color: "success" },
          { name: "Prediabetes", min: 100, max: 125, color: "warning" },
          { name: "Diabetes", min: 126, max: 500, color: "danger" }
        ]
      });

      const ppId = await getOrCreateParam({
        name: "Blood Sugar Post Prandial (BSPP)", unit: "mg/dL", resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 70, max: 140, description: "70 - 140 mg/dL" },
        tiers: [
          { name: "Normal", min: 70, max: 140, color: "success" },
          { name: "Prediabetes", min: 140, max: 199, color: "warning" },
          { name: "Diabetes", min: 200, max: 600, color: "danger" }
        ]
      });

      const hba1cId = await getOrCreateParam({
        name: "HbA1c (Glycosylated Hemoglobin)", unit: "%", resultType: "numeric", categoryId, clinicId, branchId, isActive: true,
        allRange: { min: 4.0, max: 5.6, description: "4.0 - 5.6 %" },
        tiers: [
          { name: "Normal", min: 4.0, max: 5.6, color: "success" },
          { name: "Prediabetes", min: 5.7, max: 6.4, color: "warning" },
          { name: "Diabetes", min: 6.5, max: 20, color: "danger" }
        ]
      });

      await this.createTestTemplate({
        name: "Diabetes Screening Panel",
        categoryId,
        categoryName: "Diabetes Profile",
        price: 1500,
        parameters: [fastingId, ppId, hba1cId],
        clinicId, branchId, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: userId, targetType: "category"
      });

      return true;
    } catch (error) {
      console.error("Error seeding Diabetes panel:", error);
      throw error;
    }
  },

  /**
   * Bulk Seed Selected Tests from master pathologySeederData
   */
  async seedSelectedTests(
    testIds: string[], 
    clinicId: string, 
    branchId: string, 
    userId: string,
    onProgress?: (current: number, total: number, currentName: string) => void
  ): Promise<boolean> {
    try {
      const { pathologySeederData } = await import('./pathologySeederData');
      
      const getOrCreateParam = async (paramData: any) => {
        const existingParams = await this.getParametersByClinic(clinicId, branchId);
        const existing = existingParams.find(p => p.name === paramData.name);
        if (existing) {
          await this.updateParameter(existing.id, { ...paramData, updatedAt: new Date() });
          return existing.id;
        }
        return await this.createParameter(paramData);
      };

      for (let i = 0; i < testIds.length; i++) {
        const testId = testIds[i];
        const seedData = pathologySeederData.find(t => t.id === testId);
        if (!seedData) continue;

        if (onProgress) {
          onProgress(i + 1, testIds.length, seedData.name);
        }

        // 1. Create or Find Category
        const categoryId = await this.createCategory({
          name: seedData.categoryName,
          clinicId, branchId, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: userId
        });

        // 2. Create Parameters
        const parameterIds: string[] = [];
        for (const p of seedData.parameters) {
          const paramId = await getOrCreateParam({
            ...p,
            categoryId, clinicId, branchId, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: userId
          });
          parameterIds.push(paramId);
        }

        // 3. Create Test Template (update if exists)
        const existingTemplates = await this.getTestTemplatesByClinic(clinicId, branchId);
        const existingTemplate = existingTemplates.find(t => t.name === seedData.name);
        
        const templateData = {
          name: seedData.name,
          categoryId,
          categoryName: seedData.categoryName,
          price: seedData.price,
          targetType: seedData.targetType,
          parameters: parameterIds,
          clinicId, branchId, isActive: true, updatedAt: new Date(), createdBy: userId
        };

        if (existingTemplate) {
          await updateDoc(doc(db, "pathologyTestTemplates", existingTemplate.id), templateData);
        } else {
          await this.createTestTemplate({
            ...templateData,
            createdAt: new Date()
          });
        }
      }

      return true;
    } catch (error) {
      console.error("Error seeding selected tests:", error);
      throw error;
    }
  }
};


