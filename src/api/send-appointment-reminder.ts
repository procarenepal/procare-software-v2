// src/api/send-appointment-reminder.ts
import {
  doc,
  getDoc,
  collection,
  serverTimestamp,
  runTransaction,
  increment,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { smsService } from "../services/sendMessageService";

/**
 * API handler for sending appointment reminders
 * This function would be called by cron-jobs.org
 *
 * Expected request body:
 * {
 *   appointmentId: string;
 *   patientId: string;
 *   doctorId: string;
 *   clinicId: string;
 *   appointmentTime: string; // ISO date string
 * }
 */

export async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { appointmentId, patientId, doctorId, clinicId, appointmentTime } =
      req.body;

    // Validate required fields
    if (
      !appointmentId ||
      !patientId ||
      !doctorId ||
      !clinicId ||
      !appointmentTime
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get appointment data to verify it still exists and is not cancelled
    const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));

    if (!appointmentDoc.exists()) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const appointment = appointmentDoc.data();

    // Don't send reminder if appointment is cancelled or completed
    if (["cancelled", "completed", "no-show"].includes(appointment.status)) {
      return res.status(200).json({
        success: false,
        message: `Appointment ${appointmentId} is ${appointment.status}, reminder not sent`,
      });
    }

    // Get patient and doctor data
    const [patientDoc, doctorDoc, clinicDoc] = await Promise.all([
      getDoc(doc(db, "patients", patientId)),
      getDoc(doc(db, "doctors", doctorId)),
      getDoc(doc(db, "clinics", clinicId)),
    ]);

    if (!patientDoc.exists()) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patient = patientDoc.data();
    const doctor = doctorDoc.exists()
      ? doctorDoc.data()
      : { name: "your doctor" };
    const clinic = clinicDoc.exists()
      ? clinicDoc.data()
      : { name: "the clinic" };

    // Get phone number
    const phoneNumber = patient.mobile || patient.phone;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Patient has no phone number" });
    }

    // Format appointment date and time
    const appointmentDate = new Date(appointmentTime);
    const formattedDate = appointmentDate.toLocaleDateString();
    const formattedTime =
      appointment.startTime ||
      appointmentDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

    // Get SMS settings
    const smsSettings = await smsService.getSMSSettings(clinicId);

    if (!smsSettings) {
      return res.status(404).json({ error: "SMS settings not found" });
    }

    // Create reminder message
    const clinicName = clinic.hospitalName || clinic.name || "your clinic";
    const message = `Reminder: Your appointment is scheduled for ${formattedDate} at ${formattedTime} with Dr. ${doctor.name} at ${clinicName}. Please arrive 15 minutes early. Call ${clinic.phone || "the clinic"} if you need to reschedule.`;

    // Send SMS
    const response = await smsService.sendMessage(
      phoneNumber,
      message,
      smsSettings,
    );
    const isSuccess = response.success || response.isRawText;

    // Use transaction for atomic updates
    await runTransaction(db, async (transaction) => {
      // Create SMS log
      const logRef = doc(collection(db, "smsLogs"));
      const logData = {
        clinicId,
        patientId,
        patientName: patient.name,
        patientPhone: phoneNumber,
        doctorId,
        doctorName: doctor.name,
        message,
        status: isSuccess ? "sent" : "failed",
        type: "reminder",
        createdBy: "system",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!isSuccess) {
        logData["errorMessage"] = "SMS sending failed";
      }

      transaction.set(logRef, logData);

      // Update clinic SMS count
      const clinicRef = doc(db, "clinics", clinicId);

      transaction.update(clinicRef, {
        smsCount: increment(1),
      });

      // Update daily SMS count
      const settingsRef = doc(db, "smsSettings", clinicId);

      transaction.update(settingsRef, {
        currentDailySMS: increment(1),
      });

      // Update reminder status in the database
      const reminderRef = doc(collection(db, "appointmentReminders"));

      transaction.set(reminderRef, {
        appointmentId,
        patientId,
        doctorId,
        clinicId,
        message,
        status: isSuccess ? "sent" : "failed",
        sentAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    });

    return res.status(200).json({
      success: true,
      message: `Reminder sent successfully for appointment ${appointmentId}`,
    });
  } catch (error) {
    console.error("Error sending appointment reminder:", error);

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default handler;
