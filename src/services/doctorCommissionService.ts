import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
} from "firebase/firestore";

import { db } from "@/config/firebase";
import { DoctorCommission, AppointmentBilling } from "@/types/models";

class DoctorCommissionService {
  private collectionName = "doctorCommissions";

  // Create commission record when invoice is created
  async createCommission(
    billing: AppointmentBilling,
    doctorCommissionPercent: number,
    createdBy: string,
  ): Promise<string> {
    try {
      // Create commission for both regular and visiting doctors
      // Commission will be created if doctor has commission percentage configured

      // Calculate total commission amount from all items.
      // Prefer per-item commission percentage when available, otherwise fall back to doctor's default.
      const totalCommissionAmount = billing.items.reduce((total, item) => {
        const percentage =
          typeof item.commission === "number"
            ? item.commission
            : doctorCommissionPercent;

        if (!percentage || percentage <= 0) {
          return total;
        }

        const itemCommissionAmount = (item.amount * percentage) / 100;

        return total + itemCommissionAmount;
      }, 0);

      // Derive an effective commission percentage for the record
      const invoiceBaseAmount =
        billing.totalAmount ||
        billing.items.reduce((sum, item) => sum + item.amount, 0);
      const effectiveCommissionPercentage =
        invoiceBaseAmount > 0
          ? (totalCommissionAmount / invoiceBaseAmount) * 100
          : doctorCommissionPercent;

      const commissionData: Omit<DoctorCommission, "id"> = {
        doctorId: billing.doctorId,
        doctorName: billing.doctorName,
        clinicId: billing.clinicId,
        branchId: billing.branchId,
        billingId: billing.id,
        invoiceNumber: billing.invoiceNumber,
        appointmentDate: billing.invoiceDate,
        patientId: billing.patientId,
        patientName: billing.patientName,
        appointmentTypes: billing.items.map((item) => item.appointmentTypeName),
        totalInvoiceAmount: billing.totalAmount,
        commissionPercentage: effectiveCommissionPercentage,
        commissionAmount: totalCommissionAmount,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
      };

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...commissionData,
        createdAt: Timestamp.fromDate(commissionData.createdAt),
        updatedAt: Timestamp.fromDate(commissionData.updatedAt),
        appointmentDate: Timestamp.fromDate(commissionData.appointmentDate),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating commission:", error);
      throw error;
    }
  }

  // Get all commissions for a doctor
  async getCommissionsByDoctor(
    doctorId: string,
    clinicId: string,
  ): Promise<DoctorCommission[]> {
    try {
      // Try ordered query first, fallback to simple query if index doesn't exist
      const simpleQuery = query(
        collection(db, this.collectionName),
        where("doctorId", "==", doctorId),
        where("clinicId", "==", clinicId),
      );

      let querySnapshot;

      try {
        // Try with orderBy for proper sorting
        const orderedQuery = query(
          collection(db, this.collectionName),
          where("doctorId", "==", doctorId),
          where("clinicId", "==", clinicId),
          orderBy("createdAt", "desc"),
        );

        querySnapshot = await getDocs(orderedQuery);
      } catch (indexError) {
        // Fallback to simple query if index doesn't exist
        querySnapshot = await getDocs(simpleQuery);
      }

      const commissions = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          appointmentDate: data.appointmentDate?.toDate() || new Date(),
          paidDate: data.paidDate?.toDate(),
        };
      }) as DoctorCommission[];

      return commissions;
    } catch (error) {
      console.error("Error getting commissions by doctor:", error);

      return [];
    }
  }

  // Get all commissions for a clinic
  async getCommissionsByClinic(clinicId: string): Promise<DoctorCommission[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("clinicId", "==", clinicId),
        orderBy("createdAt", "desc"),
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        appointmentDate: doc.data().appointmentDate?.toDate() || new Date(),
        paidDate: doc.data().paidDate?.toDate(),
      })) as DoctorCommission[];
    } catch (error) {
      console.error("Error getting commissions by clinic:", error);

      return [];
    }
  }

  // Pay commission to doctor
  async payCommission(
    commissionId: string,
    paidAmount: number,
    paymentMethod: string,
    paymentReference?: string,
    paymentNotes?: string,
    paidBy?: string,
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, commissionId);

      // Get current commission data
      const commissionDoc = await getDoc(docRef);

      if (!commissionDoc.exists()) {
        throw new Error("Commission record not found");
      }

      const currentCommission = commissionDoc.data() as DoctorCommission;

      // Validate payment amount
      if (paidAmount <= 0) {
        throw new Error("Payment amount must be greater than 0");
      }

      if (paidAmount > currentCommission.commissionAmount) {
        throw new Error("Payment amount cannot exceed commission amount");
      }

      // Update the commission record
      const updateData: any = {
        paidAmount: (currentCommission.paidAmount || 0) + paidAmount,
        paymentMethod,
        paidDate: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        status:
          (currentCommission.paidAmount || 0) + paidAmount >=
          currentCommission.commissionAmount
            ? "paid"
            : "pending",
      };

      // Only include optional fields if they have values
      if (paymentReference !== undefined) {
        updateData.paymentReference = paymentReference;
      }
      if (paymentNotes !== undefined) {
        updateData.paymentNotes = paymentNotes;
      }
      if (paidBy !== undefined) {
        updateData.paidBy = paidBy;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Error paying commission:", error);
      throw error;
    }
  }

  // Get commission statistics for a doctor
  async getCommissionStats(
    doctorId: string,
    clinicId: string,
  ): Promise<{
    totalCommission: number;
    paidCommission: number;
    pendingCommission: number;
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
  }> {
    try {
      const commissions = await this.getCommissionsByDoctor(doctorId, clinicId);

      const stats = commissions.reduce(
        (acc, commission) => {
          acc.totalCommission += commission.commissionAmount;
          acc.paidCommission += commission.paidAmount || 0;
          acc.totalInvoices += 1;

          if (commission.status === "paid") {
            acc.paidInvoices += 1;
          } else if (commission.status === "pending") {
            acc.pendingInvoices += 1;
          }

          return acc;
        },
        {
          totalCommission: 0,
          paidCommission: 0,
          pendingCommission: 0,
          totalInvoices: 0,
          paidInvoices: 0,
          pendingInvoices: 0,
        },
      );

      stats.pendingCommission = stats.totalCommission - stats.paidCommission;

      return stats;
    } catch (error) {
      console.error("Error getting commission stats:", error);

      return {
        totalCommission: 0,
        paidCommission: 0,
        pendingCommission: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
      };
    }
  }

  // Update commission status (for cancelling commissions)
  async updateCommissionStatus(
    commissionId: string,
    status: "pending" | "paid" | "cancelled",
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, commissionId);

      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Error updating commission status:", error);
      throw error;
    }
  }

  // Get commission by billing ID
  async getCommissionByBillingId(
    billingId: string,
  ): Promise<DoctorCommission | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("billingId", "==", billingId),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];

      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        appointmentDate: doc.data().appointmentDate?.toDate() || new Date(),
        paidDate: doc.data().paidDate?.toDate(),
      } as DoctorCommission;
    } catch (error) {
      console.error("Error getting commission by billing ID:", error);

      return null;
    }
  }
}

export const doctorCommissionService = new DoctorCommissionService();
