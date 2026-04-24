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
import {
  getPrintBrandingCSS,
  getPrintHeaderHTML,
  getPrintFooterHTML,
} from "@/utils/printBranding";
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
      const clinicData =
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

      // Generate and open print window
      const printContent = generateComprehensivePrintContent({
        patient,
        clinic: clinicData,
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

        addToast({
          title: "Report Generated",
          description: "Comprehensive patient report generated successfully",
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
      prescriptions = [],
      noteEntries = [],
      medicalReportResponses = null,
      medicalReportFields = [],
      billingRecords = [],
      isBillingEnabled,
    } = data;

    // Global Branding Utility
    const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig) : "";
    const headerHtml = layoutConfig
      ? getPrintHeaderHTML(layoutConfig, clinic)
      : "";
    const footerHtml = layoutConfig ? getPrintFooterHTML(layoutConfig) : "";

    return `<!DOCTYPE html>
<html>
<head>
  <title>Comprehensive Patient Report - ${patient.name}</title>
  <style>
    body { font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: white; color: #333; line-height: 1.5; font-size: 11px; }
    .print-container { max-width: 100%; margin: 0; background: white; display: flex; flex-direction: column; padding: 0; box-sizing: border-box; }
    
    ${brandingCSS}

    .content { flex: 1; padding: 15mm; min-height: 0; }
    
    .document-title { text-align: center; margin: 10px 0 25px 0; }
    .document-title h2 { font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; }
    .document-subtitle { font-size: 13px; color: #64748b; margin: 5px 0; font-weight: 500; }
    
    .patient-overview { background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 25px; border: 1px solid #f1f5f9; }
    .patient-overview h3 { margin: 0 0 10px 0; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
    .patient-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .patient-field { display: flex; gap: 5px; align-items: baseline; }
    .patient-field .label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; white-space: nowrap; }
    .patient-field .value { font-size: 11px; color: #1e293b; font-weight: 500; }

    .section { margin-bottom: 30px; }
    .section-header { color: #475569; padding: 5px 0; margin-bottom: 12px; font-weight: 800; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; letter-spacing: 0.05em; }
    
    .report-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    
    .card { padding: 12px; margin-bottom: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; }
    .card-header { font-weight: 700; color: #1e293b; margin-bottom: 5px; font-size: 11px; text-transform: uppercase; }
    .card-content { font-size: 11px; color: #334155; line-height: 1.5; }
    .card-meta { font-size: 9px; color: #64748b; margin-top: 8px; padding-top: 5px; border-top: 1px solid #f1f5f9; font-weight: 500; }

    .med-item { margin-bottom: 6px; padding: 6px; background: #f8fafc; border-radius: 4px; font-size: 10px; border-left: 3px solid #cbd5e1; }
    .med-name { font-weight: 700; color: #1e293b; }
    .med-details { color: #64748b; }

    .empty-state { text-align: center; color: #94a3b8; font-style: italic; padding: 20px; font-size: 11px; }

    @media print { body { padding: 0; margin: 0; } .print-container { height: 100vh; padding: 0; max-width: 100%; } .section, .patient-overview, .card { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="print-container">
    ${headerHtml}

    <div class="content">
      <div class="document-title">
        <h2>Comprehensive Health Record</h2>
        <p class="document-subtitle">Patient Medical Summary</p>
      </div>
      
      <div class="patient-overview">
        <h3>Patient Identification</h3>
        <div class="patient-grid">
          <div class="patient-field"><span class="label">Name:</span><span class="value">${patient.name}</span></div>
          <div class="patient-field"><span class="label">Reg #:</span><span class="value">${patient.regNumber || "N/A"}</span></div>
          <div class="patient-field"><span class="label">Age:</span><span class="value">${patient.dob ? calculateAge(patient.dob) : "N/A"} Years</span></div>
          <div class="patient-field"><span class="label">Gender:</span><span class="value">${patient.gender || "N/A"}</span></div>
          <div class="patient-field"><span class="label">Blood:</span><span class="value">${patient.bloodGroup || "N/A"}</span></div>
          <div class="patient-field"><span class="label">Contact:</span><span class="value">${patient.mobile || "N/A"}</span></div>
        </div>
      </div>

      <div class="report-grid">
        <div class="report-col">
          <div class="section">
            <div class="section-header">Clinical History & Reports</div>
            ${medicalReportResponses &&
        medicalReportFields.length > 0 &&
        Object.keys(medicalReportResponses.fieldValues || {}).length > 0
        ? medicalReportFields
          .map((field: any) => {
            const response =
              medicalReportResponses.fieldValues?.[field.fieldKey];

            if (!response || response === "") return "";

            return `
                  <div class="card">
                    <div class="card-header">${field.fieldLabel}</div>
                    <div class="card-content">
                      ${Array.isArray(response) ? response.join(", ") : response}
                    </div>
                  </div>
                `;
          })
          .join("")
        : '<div class="empty-state">No clinical report entries found.</div>'
      }
          </div>

          <div class="section">
            <div class="section-header">Clinical Progress Notes</div>
            ${noteEntries.length > 0
        ? noteEntries
          .map(
            (note: any) => `
                <div class="card">
                  <div class="card-header">${note.sectionLabel || "Note Entry"}</div>
                  <div class="card-content">${note.content}</div>
                </div>
              `,
          )
          .join("")
        : '<div class="empty-state">No progress notes recorded.</div>'
      }
          </div>
        </div>

        <div class="report-col">
          <div class="section">
            <div class="section-header">Medication Treatment Plans</div>
            ${prescriptions && prescriptions.length > 0
        ? prescriptions
          .map(
            (p: any) => `
                <div class="card">
                  <div class="card-header">PRESCRIPTION #${p.prescriptionNo}</div>
                  <div class="card-content">
                    ${p.items && p.items.length > 0
                ? p.items
                  .map(
                    (item: any) => `
                        <div class="med-item">
                          <div class="med-name">${item.medicineName}</div>
                          <div class="med-details">${item.dosage || ""} | ${item.frequency || ""} | ${item.duration || ""}</div>
                        </div>
                      `,
                  )
                  .join("")
                : '<div class="empty-state">No items.</div>'
              }
                  </div>
                  <div class="card-meta">Issued on: ${p.prescriptionDate ? new Date(p.prescriptionDate).toLocaleDateString() : "N/A"}</div>
                </div>
              `,
          )
          .join("")
        : '<div class="empty-state">No active prescriptions.</div>'
      }
          </div>

          ${isBillingEnabled
        ? `
          <div class="section">
            <div class="section-header">Financial Summary</div>
            ${billingRecords.length > 0
          ? billingRecords
            .map(
              (b: any) => `
                <div class="card">
                  <div class="card-header">INVOICE #${b.billNumber}</div>
                  <div style="display:flex; justify-content:space-between; font-weight:600; font-size:11px; margin-top:5px;">
                    <span>Total Amount:</span>
                    <span>NPR ${b.totalAmount?.toLocaleString() || "0"}</span>
                  </div>
                  <div class="card-meta">Status: ${b.status?.toUpperCase() || "PENDING"}</div>
                </div>
              `,
            )
            .join("")
          : '<div class="empty-state">No billing records found.</div>'
        }
          </div>
          `
        : ""
      }
        </div>
      </div>
    </div>

    ${footerHtml}
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        window.onafterprint = function() { window.close(); };
      }, 500);
    };
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
                  ${selectedTab === tab.key
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
