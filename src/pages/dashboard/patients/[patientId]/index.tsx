import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  IoArrowBackOutline,
  IoCalendarOutline,
  IoCreateOutline,
  IoMedicalOutline,
  IoDocumentTextOutline,
  IoInformationCircleOutline,
  IoWarningOutline,
  IoWalletOutline,
  IoReceiptOutline,
  IoPrintOutline,
} from "react-icons/io5";

import { useAuth } from "@/hooks/useAuth";
import { patientService } from "@/services/patientService";
import { appointmentBillingService } from "@/services/appointmentBillingService";
import { appointmentService } from "@/services/appointmentService";
import { prescriptionService } from "@/services/prescriptionService";
import { clinicService } from "@/services/clinicService";
import { doctorService } from "@/services/doctorService";
import { MedicalRecordsService } from "@/services/medicalRecordsService";
import { PatientNoteEntriesService } from "@/services/patientNoteEntriesService";
import { MedicalReportResponseService } from "@/services/medicalReportResponseService";
import { medicalReportFieldService } from "@/services/medicalReportFieldService";
import { Patient } from "@/types/models";
// ── Custom UI (zero HeroUI) ───────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Divider } from "@/components/ui/divider";
import { addToast } from "@/components/ui/toast";

// Import tab components
import PatientOverviewTab from "@/components/patients/PatientOverviewTab";
import PatientAppointmentsTab from "@/components/patients/PatientAppointmentsTab";
import PatientMedicalRecordsTab from "@/components/patients/PatientMedicalRecordsTab";
import { PatientMedicalReportTab } from "@/components/patients/PatientMedicalReportTab";
import PatientNotesTab from "@/components/patients/PatientNotesTab";
import PatientBillingTab from "@/components/patients/PatientBillingTab";
import PatientPrescriptionsTab from "@/components/patients/PatientPrescriptionsTab";

export default function PatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { clinicId, currentUser, userData, isLoading: authLoading } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(
    searchParams.get("tab") || "overview",
  );
  const [isBillingEnabled, setIsBillingEnabled] = useState(false);
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  // Update selectedTab if URL changes (e.g. back button)
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");

    if (tabFromUrl && tabFromUrl !== selectedTab) {
      setSelectedTab(tabFromUrl);
    } else if (!tabFromUrl && selectedTab !== "overview") {
      setSelectedTab("overview");
    }
  }, [searchParams]);

  // Update URL when tab is selected
  const handleTabChange = (tabKey: string) => {
    setSelectedTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  useEffect(() => {
    loadPatient();
    checkBillingSettings();
  }, [patientId, clinicId]);

  const loadPatient = async () => {
    if (!patientId || !clinicId) return;

    try {
      setLoading(true);
      const patientData = await patientService.getPatientById(patientId);

      setPatient(patientData);
    } catch (error) {
      console.error("Error loading patient:", error);
      addToast({
        title: "Error",
        description: "Failed to load patient information.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkBillingSettings = async () => {
    if (!clinicId) return;

    try {
      const settings =
        await appointmentBillingService.getBillingSettings(clinicId);

      setIsBillingEnabled(settings?.enabledByAdmin && settings?.isActive);
    } catch (error) {
      console.error("Error checking billing settings:", error);
      setIsBillingEnabled(false);
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dob: Date): number => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Generate comprehensive patient print
  const handlePrintAll = async () => {
    if (!patient || !clinicId) {
      addToast({
        title: "Error",
        description: "Patient information not available for printing.",
        color: "danger",
      });

      return;
    }

    setIsGeneratingPrint(true);

    try {
      // Gather all patient data with error handling for each service
      const results = await Promise.allSettled([
        clinicService.getClinicById(clinicId),
        clinicService.getPrintLayoutConfig(clinicId),
        doctorService.getDoctorsByClinic(clinicId).catch((err) => {
          console.warn("Failed to fetch doctors:", err);

          return [];
        }),
        appointmentService
          .getAppointmentsByClinic(clinicId)
          .then((all) => all.filter((apt) => apt.patientId === patientId))
          .catch((err) => {
            console.warn("Failed to fetch appointments:", err);

            return [];
          }),
        prescriptionService
          .getPrescriptionsByPatient(patientId)
          .then(async (prescriptions) => {
            // Fetch prescription items for each prescription
            const prescriptionsWithItems = await Promise.all(
              prescriptions.map(async (prescription) => {
                try {
                  const items = await prescriptionService.getPrescriptionItems(
                    prescription.id,
                  );

                  return { ...prescription, items };
                } catch (err) {
                  console.warn(
                    `Failed to fetch items for prescription ${prescription.id}:`,
                    err,
                  );

                  return { ...prescription, items: [] };
                }
              }),
            );

            return prescriptionsWithItems;
          })
          .catch((err) => {
            console.warn("Failed to fetch prescriptions:", err);

            return [];
          }),
        MedicalRecordsService.getDocumentsByPatient(patientId, clinicId).catch(
          (err) => {
            console.warn("Failed to fetch documents:", err);

            return [];
          },
        ),
        MedicalRecordsService.getXraysByPatient(patientId, clinicId).catch(
          (err) => {
            console.warn("Failed to fetch X-rays:", err);

            return [];
          },
        ),
        PatientNoteEntriesService.getPatientNoteEntries(
          clinicId,
          patientId,
        ).catch((err) => {
          console.warn("Failed to fetch note entries:", err);

          return [];
        }),
        MedicalReportResponseService.getPatientResponses(
          clinicId,
          patientId,
        ).catch((err) => {
          console.warn("Failed to fetch medical report responses:", err);

          return null;
        }),
        medicalReportFieldService.getFields(clinicId).catch((err) => {
          console.warn("Failed to fetch medical report fields:", err);

          return [];
        }),
        isBillingEnabled
          ? appointmentBillingService
              .getBillingByPatient(patientId, clinicId)
              .catch((err) => {
                console.warn("Failed to fetch billing records:", err);

                return [];
              })
          : Promise.resolve([]),
      ]);

      // Extract data from results with proper fallbacks
      const clinic =
        results[0].status === "fulfilled" ? results[0].value : null;
      const layoutConfig =
        results[1].status === "fulfilled" ? results[1].value : null;
      const doctors = results[2].status === "fulfilled" ? results[2].value : [];
      const appointments =
        results[3].status === "fulfilled" ? results[3].value : [];
      const prescriptions =
        results[4].status === "fulfilled" ? results[4].value : [];
      const documents =
        results[5].status === "fulfilled" ? results[5].value : [];
      const xrays = results[6].status === "fulfilled" ? results[6].value : [];
      const noteEntries =
        results[7].status === "fulfilled" ? results[7].value : [];
      const medicalReportResponses =
        results[8].status === "fulfilled" ? results[8].value : null;
      const medicalReportFields =
        results[9].status === "fulfilled" ? results[9].value : [];
      const billingRecords =
        results[10].status === "fulfilled" ? results[10].value : [];

      // Debug: Log prescriptions data
      console.log("Prescriptions data for print:", prescriptions);
      console.log("Prescriptions length:", prescriptions?.length || 0);

      // Generate and open print window
      const printContent = generateComprehensivePrintContent({
        patient,
        clinic,
        layoutConfig,
        doctors,
        appointments,
        prescriptions,
        documents,
        xrays,
        noteEntries,
        medicalReportResponses,
        medicalReportFields,
        billingRecords,
        isBillingEnabled,
      });

      const printWindow = window.open("", "_blank", "width=1200,height=800");

      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Check which data was successfully loaded
        const loadedSections = [];

        if (appointments.length > 0) loadedSections.push("appointments");
        if (prescriptions.length > 0) loadedSections.push("prescriptions");
        if (documents.length > 0) loadedSections.push("documents");
        if (xrays.length > 0) loadedSections.push("X-rays");
        if (noteEntries.length > 0) loadedSections.push("notes");
        if (billingRecords.length > 0) loadedSections.push("billing");

        const successMessage =
          loadedSections.length > 0
            ? `Comprehensive patient report generated with: ${loadedSections.join(", ")}`
            : "Basic patient report generated successfully";

        addToast({
          title: "Report Generated",
          description: successMessage,
          color: "success",
        });
      } else {
        throw new Error("Unable to open print window");
      }
    } catch (error) {
      console.error("Error generating comprehensive print:", error);
      addToast({
        title: "Error",
        description:
          "Failed to generate comprehensive patient report. Please try again.",
        color: "danger",
      });
    } finally {
      setIsGeneratingPrint(false);
    }
  };

  const generateComprehensivePrintContent = (data: any) => {
    const {
      patient,
      clinic,
      layoutConfig,
      doctors = [],
      appointments = [],
      prescriptions = [],
      documents = [],
      xrays = [],
      noteEntries = [],
      medicalReportResponses = null,
      medicalReportFields = [],
      billingRecords = [],
      isBillingEnabled,
    } = data;

    // Helper functions
    const formatCurrency = (amount: number) => `NPR ${amount.toLocaleString()}`;
    const formatDateTime = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    };

    const formatTimeTo12Hour = (time24: string): string => {
      if (!time24) return "Not specified";
      const [hours, minutes] = time24.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;

      return `${hour12}:${minutes} ${ampm}`;
    };

    // Helper function to get doctor name from appointment
    const getDoctorNameFromAppointment = (appointment: any): string => {
      // First try to find doctor by ID
      if (appointment.doctorId && doctors.length > 0) {
        const doctor = doctors.find((d: any) => d.id === appointment.doctorId);

        if (doctor) return doctor.name;
      }

      // Try multiple possible field names for doctor information
      if (appointment.doctorName) return appointment.doctorName;
      if (appointment.doctor) return appointment.doctor;

      return "Unknown";
    };

    return `<!DOCTYPE html>
<html>
<head>
  <title>Comprehensive Patient Report - ${patient.name}</title>
  <style>
    :root {
      --primary: ${layoutConfig?.primaryColor || "#2563eb"};
      --bg: #ffffff;
      --text: #334155;
      --muted: #64748b;
      --border: #e2e8f0;
      --soft: #f8fafc;
      --heading: #0f172a;
      --radius: 6px;
      --space-xs: 4px;
      --space-sm: 8px;
      --space-md: 12px;
      --space-lg: 16px;
      --font-sm: 10px;
      --font-md: 12px;
      --font-lg: 16px;
    }

    /* Base */
    body { font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif; margin:0; color:var(--text); background:var(--bg); font-size:11px; line-height:1.35; }
    .print-container { padding: 10mm; box-sizing: border-box; }

    /* Header */
    .header { border-bottom: 2px solid var(--primary); padding-bottom: var(--space-md); margin-bottom: var(--space-lg); }
    .header-content { display:flex; justify-content:space-between; align-items:flex-start; gap: var(--space-lg); }
    .header-left { display:flex; align-items:center; gap: var(--space-lg); }
    .logo { height:60px; width:auto; object-fit:contain; }
    .clinic-info h1 { margin:0; color: var(--primary); font-size: var(--font-lg); font-weight:700; }
    .clinic-info p, .header-right { margin:2px 0; font-size: var(--font-sm); color: var(--muted); }
    .header-right { text-align:right; color: var(--text); }

    /* Titles */
    .document-title { text-align:center; margin: var(--space-lg) 0; }
    .document-subtitle { font-size: var(--font-md); color: var(--muted); margin: var(--space-sm) 0; }

    /* Patient overview */
    .patient-overview { background: var(--soft); border-radius: var(--radius); padding: var(--space-md); margin-bottom: var(--space-lg); }
    .patient-overview h3 { margin:0 0 var(--space-sm) 0; color: var(--primary); font-size: var(--font-md); border-bottom:1px solid var(--border); padding-bottom: var(--space-xs); }
    .patient-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-sm); }
    .patient-field { display:flex; gap: var(--space-xs); align-items:center; }
    .patient-field .label { font-size: 9px; font-weight:600; color: var(--muted); text-transform:uppercase; letter-spacing:.3px; white-space:nowrap; }
    .patient-field .value { font-size: var(--font-sm); color: var(--text); font-weight:500; }

    /* Sections */
    .section { margin-bottom: var(--space-lg); }
    .section-header {  color:var(--primary); padding: var(--space-sm) var(--space-md); margin:0 0 var(--space-sm) 0; font-weight:600; font-size: var(--font-sm); text-transform:uppercase; letter-spacing:.3px; }
    .section-content { padding: 0 var(--space-xs); }

    /* Table */
    .data-table { width:100%; border-collapse:collapse; font-size: 9px; }
    .data-table td { padding: 4px 6px; vertical-align:top; }
    .data-table tr:nth-child(even) { background: var(--soft); }
    /* 3-column layout table */
    .layout-table { width:100%; table-layout: fixed; border-collapse: separate; border-spacing: var(--space-sm); }
    .layout-table td { vertical-align: top; }
    .layout-table td:first-child { width: 25%; } /* Medical Reports */
    .layout-table td:nth-child(2) { width: 55%; } /* Prescriptions - wider when available */
    .layout-table td:last-child { width: 20%; } /* Notes - narrower when prescriptions available */

    /* Cards */
    .card { padding: var(--space-sm); margin-bottom: var(--space-sm); background:#fff; }
    .card-header { font-weight:600; color:#374151; margin-bottom: var(--space-xs); font-size: var(--font-sm); }
    .card-content { font-size: var(--font-sm); color:#4b5563; line-height:1.4; }
    .card-meta { font-size: 9px; color:#9ca3af; margin-top: var(--space-xs); padding-top: var(--space-xs); border-top:1px solid #f3f4f6; }

    /* Badges */
    .status { display:inline-block; padding: 1px 6px; border-radius: 10px; font-size: 8px; font-weight:600; text-transform:uppercase; }
    .status.active{ background:#dcfce7; color:#166534; }
    .status.completed{ background:#dbeafe; color:#1e40af; }
    .status.cancelled{ background:#fee2e2; color:#991b1b; }
    .status.scheduled{ background:#e0e7ff; color:#3730a3; }
    .status.paid{ background:#dcfce7; color:#166534; }
    .status.unpaid{ background:#fee2e2; color:#991b1b; }
    .status.partial{ background:#fef3c7; color:#92400e; }

    /* Utilities */
    .empty-state { text-align:center; color:#9ca3af; font-style:italic; padding: var(--space-lg); }
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }
    
    /* Footer */
    .footer { border-top:1px solid var(--border); padding-top: var(--space-md); margin-top: 24px; text-align:center; font-size: var(--font-sm); color: var(--muted); }

    /* Print tweaks */
    @media print {
      body { margin:0; font-size:10px; line-height:1.25; }
      .print-container { padding: 8mm; }
      .section, .patient-overview, .card { break-inside: avoid; }
      .patient-grid { grid-template-columns: repeat(3, 1fr); }
      .layout-table td:first-child { width: 25%; } /* Medical Reports */
      .layout-table td:nth-child(2) { width: 55%; } /* Prescriptions - wider when available */
      .layout-table td:last-child { width: 20%; } /* Notes - narrower when prescriptions available */
    }
  </style>
</head>
<body>
  <div class="print-container">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="header-left">
          ${layoutConfig?.logoUrl ? `<img src="${layoutConfig.logoUrl}" alt="Logo" class="logo" />` : ""}
          <div class="clinic-info">
            <h1>${clinic?.name || layoutConfig?.clinicName || "Clinic Name"}</h1>
            ${layoutConfig?.tagline ? `<p>${layoutConfig.tagline}</p>` : ""}
            ${layoutConfig?.address || clinic?.address ? `<p>${layoutConfig?.address || clinic?.address}</p>` : ""}
            ${layoutConfig?.city || clinic?.city || layoutConfig?.state || layoutConfig?.zipCode ? `<p>${layoutConfig?.city || clinic?.city || ""}${layoutConfig?.state ? `, ${layoutConfig.state}` : ""} ${layoutConfig?.zipCode || ""}</p>` : ""}
            ${layoutConfig?.website ? `<p>Website: ${layoutConfig.website}</p>` : ""}
          </div>
        </div>
        <div class="header-right">
          ${layoutConfig?.phone || clinic?.phone ? `<p><strong>Phone:</strong> ${layoutConfig?.phone || clinic?.phone}</p>` : ""}
          ${layoutConfig?.email || clinic?.email ? `<p><strong>Email:</strong> ${layoutConfig?.email || clinic?.email}</p>` : ""}
          <p><strong>Generated:</strong> ${formatDateTime(new Date())}</p>
        </div>
      </div>
    </div>
    
    <!-- Patient Overview -->
    <div class="patient-overview">
      <h3>Patient Information</h3>
      <div class="patient-grid">
        ${
          patient.name !== undefined && patient.name !== null
            ? `
        <div class="patient-field">
          <div class="label">Full Name: </div>
          <div class="value">${patient.name}</div>
        </div>
        `
            : ""
        }
        ${
          patient.regNumber !== undefined && patient.regNumber !== null
            ? `
        <div class="patient-field">
          <div class="label">Registration Number: </div>
          <div class="value">${patient.regNumber}</div>
        </div>
        `
            : ""
        }
        ${
          patient.dob !== undefined && patient.dob !== null
            ? `
        <div class="patient-field">
          <div class="label">Age: </div>
          <div class="value">${calculateAge(patient.dob)} years</div>
        </div>
        `
            : ""
        }
        ${
          patient.gender !== undefined && patient.gender !== null
            ? `
        <div class="patient-field">
          <div class="label">Gender: </div>
          <div class="value">${patient.gender}</div>
        </div>
        `
            : ""
        }
        ${
          patient.bloodGroup !== undefined && patient.bloodGroup !== null
            ? `
        <div class="patient-field">
          <div class="label">Blood Group: </div>
          <div class="value">${patient.bloodGroup}</div>
        </div>
        `
            : ""
        }
        ${
          patient.dob !== undefined && patient.dob !== null
            ? `
        <div class="patient-field">
          <div class="label">Date of Birth: </div>
          <div class="value">${formatDate(patient.dob)}</div>
        </div>
        `
            : ""
        }
        ${
          patient.mobile !== undefined && patient.mobile !== null
            ? `
        <div class="patient-field">
          <div class="label">Mobile: </div>
          <div class="value">${patient.mobile}</div>
        </div>
        `
            : ""
        }
        ${
          patient.email !== undefined &&
          patient.email !== null &&
          patient.email !== ""
            ? `
        <div class="patient-field">
          <div class="label">Email: </div>
          <div class="value">${patient.email}</div>
        </div>
        `
            : ""
        }
        ${
          patient.address !== undefined && patient.address !== null
            ? `
        <div class="patient-field">
          <div class="label">Address: </div>
          <div class="value">${patient.address}</div>
        </div>
        `
            : ""
        }
        ${
          patient.createdAt !== undefined && patient.createdAt !== null
            ? `
        <div class="patient-field">
          <div class="label">Registration Date: </div>
          <div class="value">${formatDateTime(patient.createdAt)}</div>
        </div>
        `
            : ""
        }
      </div>
    </div>
    <!-- Three-column table layout -->
    <!-- Always show the 3-column table -->
    <table class="layout-table">
      <tr>
        <td>
          ${
            medicalReportResponses &&
            medicalReportFields.length > 0 &&
            Object.keys(medicalReportResponses.fieldValues || {}).length > 0
              ? `
          <div class="section">
            <div class="section-header">Medical Reports</div>
            <div class="section-content">
              ${medicalReportFields
                .map((field) => {
                  const response =
                    medicalReportResponses.fieldValues?.[field.fieldKey];

                  if (
                    !response ||
                    response === undefined ||
                    response === null ||
                    response === ""
                  )
                    return "";

                  return `
                  <div class="card">
                    ${field.fieldLabel ? `<div class=\"card-header\">${field.fieldLabel}</div>` : ""}
                    <div class="card-content">
                      ${Array.isArray(response) ? response.join(", ") : response}
                    </div>
                  </div>
                `;
                })
                .filter((card) => card !== "")
                .join("")}
            </div>
          </div>
          `
              : ""
          }
        </td>
        <td>
          <div class="section">
            <div class="section-header">Prescriptions</div>
            <div class="section-content">
              ${
                prescriptions && prescriptions.length > 0
                  ? `
                ${prescriptions
                  .map((prescription) => {
                    let prescriptionDate, createdDate;

                    try {
                      prescriptionDate = prescription.prescriptionDate
                        ? formatDate(prescription.prescriptionDate)
                        : "Unknown Date";
                      createdDate = prescription.createdAt
                        ? formatDateTime(prescription.createdAt)
                        : "Unknown Date";
                    } catch (error) {
                      prescriptionDate = "Unknown Date";
                      createdDate = "Unknown Date";
                    }

                    return `
                  <div class="card">
                   <div class="card-content">
                      ${
                        prescription.items && prescription.items.length > 0
                          ? `
                        <div style="margin-top: 8px;">
                          <div style="margin-left: 8px; margin-top: 4px;">
                            ${prescription.items
                              .map(
                                (item) => `
                              <div style="margin-bottom: 6px; padding: 4px; background: #f8fafc; border-radius: 4px; font-size: 9px;">
                                <span>${item.medicineName || "Unknown Medicine"}</span> - ${item.dosage ? `<span>${item.dosage}</span>` : ""} - ${item.frequency ? `<span>${item.frequency}</span>` : ""} - ${item.time ? `<span style="margin-left: 8px;">${item.time}</span>` : ""} for ${item.duration ? `<span> ${item.duration}</span>` : ""}
                              </div>
                            `,
                              )
                              .join("")}
                          </div>
                        </div>
                      `
                          : '<p style="color: #9ca3af; font-style: italic;">No medicines prescribed</p>'
                      }
                    </div>
                  </div>
                `;
                  })
                  .join("")}
              `
                  : `
                <div class="empty-state">No prescriptions found for this patient.</div>
              `
              }
            </div>
          </div>
        </td>
        <td>
${
  noteEntries.length > 0
    ? `
    <div class="section">
      <div class="section-header">Patient Notes</div>
      <div class="section-content">
        ${noteEntries
          .map(
            (note) => `
          <div class="card">
                  ${note.sectionLabel ? `<div class=\"card-header\">${note.sectionLabel}</div>` : ""}
            ${
              note.content
                ? `
            <div class="card-content">
              ${note.content}
            </div>
            `
                : ""
            }
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
          `
    : ""
}
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <div class="footer">
      <p>This comprehensive report was generated on ${formatDateTime(new Date())} for ${patient.name}</p>
    </div>
  </div>
  
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 800);
    });
    
    window.addEventListener('afterprint', function() {
      window.close();
    });
    
    window.addEventListener('beforeunload', function() {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage('printComplete', '*');
      }
    });
  </script>
</body>
</html>`;
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner label="Loading patient…" size="lg" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-16 text-center">
        <IoWarningOutline className="mx-auto text-mountain-300 w-12 h-12 mb-3" />
        <p className="text-[13px] text-mountain-500 mb-4">Patient not found.</p>
        <Link className="no-underline" to="/dashboard/patients">
          <Button color="primary" size="sm">
            Back to Patients
          </Button>
        </Link>
      </div>
    );
  }

  // ── Tab definitions ─────────────────────────────────────────────────────────
  const TABS = [
    {
      key: "overview",
      icon: <IoInformationCircleOutline className="w-4 h-4" />,
      label: "Overview",
    },
    {
      key: "medical-records",
      icon: <IoDocumentTextOutline className="w-4 h-4" />,
      label: "Medical Records",
    },
    {
      key: "medical-report",
      icon: <IoMedicalOutline className="w-4 h-4" />,
      label: "Medical Report",
    },
    {
      key: "appointments",
      icon: <IoCalendarOutline className="w-4 h-4" />,
      label: "Appointments",
    },
    {
      key: "notes",
      icon: <IoDocumentTextOutline className="w-4 h-4" />,
      label: "Notes",
    },
    {
      key: "prescriptions",
      icon: <IoReceiptOutline className="w-4 h-4" />,
      label: "Prescriptions",
    },
    ...(isBillingEnabled
      ? [
          {
            key: "billing",
            icon: <IoWalletOutline className="w-4 h-4" />,
            label: "Billing",
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            aria-label="Back"
            className="p-1.5 rounded border border-mountain-200 text-mountain-500 hover:text-teal-700 hover:border-teal-400 transition-colors"
            type="button"
            onClick={() => navigate(-1)}
          >
            <IoArrowBackOutline className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-page-title text-mountain-900 leading-tight">
              Patient Profile
              {patient?.isCritical && (
                <span className="ml-2 text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded align-middle">
                  ⚠ CRITICAL
                </span>
              )}
            </h1>
            <p className="text-[13px] text-mountain-400 mt-0.5">
              View and manage patient information
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            color="default"
            isLoading={isGeneratingPrint}
            size="sm"
            startContent={<IoPrintOutline className="w-3.5 h-3.5" />}
            variant="bordered"
            onClick={handlePrintAll}
          >
            {isGeneratingPrint ? "Generating…" : "Print All"}
          </Button>
          <Link
            className="no-underline"
            to={`/dashboard/patients/${patientId}/edit`}
          >
            <Button
              color="primary"
              size="sm"
              startContent={<IoCreateOutline className="w-3.5 h-3.5" />}
              variant="bordered"
            >
              Edit
            </Button>
          </Link>
          <Link
            className="no-underline"
            to={`/dashboard/appointments/new?patientId=${patientId}`}
          >
            <Button
              color="primary"
              size="sm"
              startContent={<IoCalendarOutline className="w-3.5 h-3.5" />}
            >
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Tabbed content shell ────────────────────────────────────────── */}
      <div className="bg-white border border-mountain-200 rounded overflow-hidden">
        {/* Custom tab strip — matches spec: underline style, teal active */}
        <div className="flex overflow-x-auto border-b border-mountain-200 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`
                inline-flex items-center gap-1.5 px-4 py-3 text-[12.5px] font-medium whitespace-nowrap
                border-b-2 transition-colors shrink-0
                ${
                  selectedTab === tab.key
                    ? "border-teal-700 text-teal-700 bg-teal-50/40"
                    : "border-transparent text-mountain-500 hover:text-mountain-800 hover:bg-mountain-50"
                }
              `}
              type="button"
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {selectedTab === "overview" && (
            <>
              <PatientOverviewTab patient={patient} />
              <Divider className="my-5" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: Medical Reports */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-section-title text-mountain-800">
                    Medical Reports
                  </h3>
                  <PatientMedicalReportTab
                    clinicId={clinicId!}
                    patientId={patientId!}
                  />
                </div>
                {/* Middle: Appointments + Prescriptions */}
                <div className="flex flex-col gap-5 lg:col-span-2">
                  <div>
                    <h3 className="text-section-title text-mountain-800 mb-3">
                      Appointments
                    </h3>
                    <PatientAppointmentsTab patientId={patientId!} />
                  </div>
                  <div>
                    <h3 className="text-section-title text-mountain-800 mb-3">
                      Prescriptions
                    </h3>
                    <PatientPrescriptionsTab patientId={patientId!} />
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedTab === "medical-records" && (
            <PatientMedicalRecordsTab patientId={patientId!} />
          )}

          {selectedTab === "medical-report" && (
            <PatientMedicalReportTab
              clinicId={clinicId!}
              patientId={patientId!}
            />
          )}

          {selectedTab === "appointments" && (
            <PatientAppointmentsTab patientId={patientId!} />
          )}

          {selectedTab === "notes" && (
            <PatientNotesTab clinicId={clinicId!} patientId={patientId!} />
          )}

          {selectedTab === "prescriptions" && (
            <PatientPrescriptionsTab patientId={patientId!} />
          )}

          {selectedTab === "billing" && isBillingEnabled && (
            <PatientBillingTab patientId={patientId!} />
          )}
        </div>
      </div>
    </div>
  );
}
