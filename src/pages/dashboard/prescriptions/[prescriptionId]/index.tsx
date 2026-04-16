/**
 * Prescription Detail Page — Clinic Clarity without HeroUI
 */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  IoArrowBackOutline,
  IoCreateOutline,
  IoDownloadOutline,
  IoPrintOutline,
} from "react-icons/io5";

import { title } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { addToast } from "@/components/ui/toast";
import { prescriptionService } from "@/services/prescriptionService";
import { patientService } from "@/services/patientService";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointmentService";
import { appointmentTypeService } from "@/services/appointmentTypeService";
import { clinicService } from "@/services/clinicService";
import { useAuthContext } from "@/context/AuthContext";
import { Prescription, PrescriptionItem } from "@/types/medical-records";
import { Patient, Doctor, Appointment } from "@/types/models";
import { PrintLayoutConfig } from "@/types/printLayout";

interface PrescriptionWithDetails extends Prescription {
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  doctorName?: string;
  doctorSpeciality?: string;
  items?: PrescriptionItem[];
  appointmentInfo?: Appointment;
  appointmentTypeName?: string;
}

export default function PrescriptionDetailPage() {
  const navigate = useNavigate();
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const [searchParams] = useSearchParams();
  const { clinicId, userData } = useAuthContext();
  const effectiveBranchId = userData?.branchId ?? undefined;

  const [prescription, setPrescription] =
    useState<PrescriptionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layoutConfig, setLayoutConfig] = useState<PrintLayoutConfig | null>(
    null,
  );
  const [clinic, setClinic] = useState<any>(null);

  const formatDate = (date: Date | null | undefined | string) => {
    if (!date) return "N/A";
    const d = new Date(date);

    if (isNaN(d.getTime())) return "N/A";

    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchPrescriptionData = async () => {
      if (!prescriptionId) return;

      try {
        setLoading(true);
        setError(null);

        const prescriptionData =
          await prescriptionService.getPrescriptionById(prescriptionId);

        if (!prescriptionData) {
          setError("Prescription not found");

          return;
        }
        if (
          effectiveBranchId != null &&
          prescriptionData.branchId !== effectiveBranchId
        ) {
          setError("You don't have access to this prescription.");
          setPrescription(null);
          setLoading(false);

          return;
        }

        const prescriptionItems =
          await prescriptionService.getPrescriptionItems(prescriptionId);

        let clinicData = null;
        let layoutConfigData = null;

        if (clinicId) {
          [clinicData, layoutConfigData] = await Promise.all([
            clinicService.getClinicById(clinicId),
            clinicService.getPrintLayoutConfig(clinicId),
          ]);
        }

        let patientData: Patient | null = null;

        try {
          patientData = await patientService.getPatientById(
            prescriptionData.patientId,
          );
        } catch (e) {}

        let doctorData: Doctor | null = null;

        try {
          doctorData = await doctorService.getDoctorById(
            prescriptionData.doctorId,
          );
        } catch (e) {}

        let appointmentData: Appointment | null = null;
        let appointmentTypeName: string | undefined;

        if (prescriptionData.appointmentId) {
          try {
            appointmentData = await appointmentService.getAppointmentById(
              prescriptionData.appointmentId,
            );
            if (appointmentData?.appointmentTypeId) {
              const appointmentType =
                await appointmentTypeService.getAppointmentTypeById(
                  appointmentData.appointmentTypeId,
                );

              appointmentTypeName = appointmentType?.name;
            }
          } catch (e) {}
        }

        const combinedData: PrescriptionWithDetails = {
          ...prescriptionData,
          items: prescriptionItems,
          patientName: patientData?.name || "Unknown Patient",
          patientAge: patientData?.age,
          patientGender: patientData?.gender,
          patientPhone: patientData?.phone || patientData?.mobile,
          doctorName: doctorData?.name || "Unknown Doctor",
          doctorSpeciality: doctorData?.speciality,
          appointmentInfo: appointmentData || undefined,
          appointmentTypeName: appointmentTypeName,
        };

        setPrescription(combinedData);
        if (clinicData) setClinic(clinicData);
        if (layoutConfigData) setLayoutConfig(layoutConfigData);
      } catch (err) {
        console.error("Error fetching prescription:", err);
        setError("Failed to load prescription data");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptionData();
  }, [prescriptionId, clinicId, effectiveBranchId]);

  useEffect(() => {
    if (!loading && prescription && searchParams.get("print") === "true") {
      setTimeout(() => handlePrint(), 300);
    }
  }, [loading, prescription, searchParams]);

  const handleEdit = () =>
    navigate(`/dashboard/prescriptions/${prescriptionId}/edit`);

  const handlePrint = () => {
    if (!prescription) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (printWindow) {
      const itemsHtml =
        prescription.items
          ?.map(
            (item) =>
              `<tr>
          <td class="text-left">${item.medicineName}</td>
          <td class="text-center">${item.dosage}</td>
          <td class="text-center">${item.frequency}</td>
          <td class="text-center">${item.duration}</td>
          <td class="text-center">${item.time}</td>
        </tr>`,
          )
          .join("") || "";

      const printContent = `<!DOCTYPE html>
<html>
<head>
  <title>Prescription - ${prescription.prescriptionNo}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: white; color: #333; }
    .print-container { max-width: 100%; margin: 0; background: white; display: flex; flex-direction: column; height: 100vh; padding: 10mm; box-sizing: border-box; }
    .header { border-bottom: 2px solid #333; padding-bottom: ${layoutConfig?.headerHeight === "compact" ? "10px" : layoutConfig?.headerHeight === "expanded" ? "20px" : "15px"}; margin-bottom: ${layoutConfig?.headerHeight === "compact" ? "10px" : layoutConfig?.headerHeight === "expanded" ? "20px" : "15px"}; }
    .header-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
    .header-left { display: flex; align-items: center; gap: 20px; ${layoutConfig?.logoPosition === "center" ? "justify-content: center; text-align: center;" : layoutConfig?.logoPosition === "right" ? "justify-content: flex-end; text-align: right;" : "justify-content: flex-start; text-align: left;"} }
    .header-right { text-align: right; font-size: ${layoutConfig?.fontSize === "small" ? "11px" : layoutConfig?.fontSize === "large" ? "14px" : "12px"}; color: #333; line-height: 1.4; }
    .logo { ${layoutConfig?.logoSize === "small" ? "height: 40px;" : layoutConfig?.logoSize === "large" ? "height: 80px;" : "height: 60px;"} width: auto; object-fit: contain; }
    .clinic-info { ${layoutConfig?.logoPosition === "center" ? "text-align: center;" : ""} }
    .clinic-name { font-weight: bold; color: ${layoutConfig?.primaryColor || "#2563eb"}; margin: 0; font-size: ${layoutConfig?.fontSize === "small" ? "20px" : layoutConfig?.fontSize === "large" ? "30px" : "26px"}; }
    .tagline { font-size: ${layoutConfig?.fontSize === "small" ? "12px" : layoutConfig?.fontSize === "large" ? "16px" : "14px"}; color: #666; margin: 5px 0; }
    .clinic-details { margin-top: 10px; color: #333; font-size: ${layoutConfig?.fontSize === "small" ? "11px" : layoutConfig?.fontSize === "large" ? "14px" : "12px"}; }
    .document-title { text-align: center; margin: 20px 0; }
    .document-title h2 { font-size: 18px; font-weight: 600; margin: 0; text-transform: uppercase; }
    .document-subtitle { font-size: 14px; color: #666; margin: 5px 0; }
    .document-info { display: flex; justify-content: space-between; margin-top: 10px; font-size: 14px; color: #666; }
    .content { flex: 1; padding: 10px 0; min-height: 0; }
    .patient-doctor-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 20px; }
    .info-section { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
    .info-section h3 { margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #333; }
    .info-item { margin-bottom: 5px; }
    .info-label { font-weight: 500; color: #666; display: inline-block; width: 80px; }
    .info-value { color: #333; }
    .prescription-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .prescription-table th, .prescription-table td { border: 1px solid #333; padding: 10px; font-size: 12px; }
    .prescription-table th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
    .prescription-table td.text-left { text-align: left; }
    .prescription-table td.text-center { text-align: center; }
    .prescription-table td.text-right { text-align: right; }
    .notes-section { margin-top: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
    .notes-section h3 { margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #333; }
    .signature-section { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
    .signature-box { text-align: center; border-top: 1px solid #333; padding-top: 5px; min-width: 200px; }
    .footer { border-top: 1px solid #333; padding-top: 10px; margin-top: auto; text-align: center; font-size: ${layoutConfig?.fontSize === "small" ? "11px" : layoutConfig?.fontSize === "large" ? "13px" : "12px"}; color: #666; flex-shrink: 0; }
    @media print { body { padding: 0; margin: 0; } .print-container { height: 100vh; padding: 5mm; max-width: 100%; box-sizing: border-box; } }
  </style>
</head>
<body>
  <div class="print-container">
    <div class="header">
      <div class="header-content">
        <div class="header-left">
          ${layoutConfig?.logoUrl ? `<img src="${layoutConfig.logoUrl}" alt="Logo" class="logo" />` : ""}
          <div class="clinic-info">
            <h1 class="clinic-name">${clinic?.name || layoutConfig?.clinicName || "Clinic Name"}</h1>
            ${layoutConfig?.tagline ? `<p class="tagline">${layoutConfig.tagline}</p>` : ""}
            <div class="clinic-details">
              <p>${layoutConfig?.address || clinic?.address || ""}</p>
              <p>${layoutConfig?.city || clinic?.city || ""}${layoutConfig?.state ? `, ${layoutConfig.state}` : ""} ${layoutConfig?.zipCode || ""}</p>
              ${layoutConfig?.website ? `<p>Website: ${layoutConfig.website}</p>` : ""}
            </div>
          </div>
        </div>
        <div class="header-right">
          <p><strong>Phone:</strong> ${layoutConfig?.phone || clinic?.phone || ""}</p>
          <p><strong>Email:</strong> ${layoutConfig?.email || clinic?.email || ""}</p>
        </div>
      </div>
    </div>
    <div class="document-title">
      <h2>Medical Prescription</h2>
      <p class="document-subtitle">Patient Treatment Plan</p>
      <div class="document-info">
        <span>Prescription No: ${prescription.prescriptionNo}</span>
        <span>Date: ${formatDate(prescription.prescriptionDate)}</span>
      </div>
    </div>
    <div class="content">
      <div class="patient-doctor-info">
        <div class="info-section">
          <h3>Patient Information</h3>
          <div class="info-item"><span class="info-label">Name:</span><span class="info-value">${prescription.patientName}</span></div>
          <div class="info-item"><span class="info-label">Age:</span><span class="info-value">${prescription.patientAge || "N/A"} years</span></div>
          <div class="info-item"><span class="info-label">Gender:</span><span class="info-value">${prescription.patientGender || "N/A"}</span></div>
          <div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${prescription.patientPhone || "N/A"}</span></div>
        </div>
        <div class="info-section">
          <h3>Doctor Information</h3>
          <div class="info-item"><span class="info-label">Name:</span><span class="info-value">${prescription.doctorName}</span></div>
          <div class="info-item"><span class="info-label">Speciality:</span><span class="info-value">${prescription.doctorSpeciality || "N/A"}</span></div>
          ${
            prescription.appointmentInfo
              ? `
            <div class="info-item"><span class="info-label">Appt. Date:</span><span class="info-value">${formatDate(prescription.appointmentInfo.appointmentDate)}</span></div>
            <div class="info-item"><span class="info-label">Appt. Type:</span><span class="info-value">${prescription.appointmentTypeName || (prescription.appointmentInfo.appointmentType ? prescription.appointmentInfo.appointmentType.replace(/-/g, " ") : "N/A")}</span></div>
          `
              : ""
          }
        </div>
      </div>
      <table class="prescription-table">
        <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Time</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ${prescription.notes ? `<div class="notes-section"><h3>Notes & Instructions</h3><p>${prescription.notes}</p></div>` : ""}
      <div class="signature-section">
        <div class="signature-box"><p>Patient Signature</p></div>
        <div class="signature-box"><p>Doctor Signature</p></div>
      </div>
    </div>
    <div class="footer">
      <p>${layoutConfig?.footerText || "Thank you for choosing our healthcare services"}</p>
    </div>
  </div>
  <script>
    window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 500); });
    window.addEventListener('afterprint', function() { window.close(); });
    window.addEventListener('beforeunload', function() { if (window.opener && !window.opener.closed) { window.opener.postMessage('printComplete', '*'); } });
  </script>
</body>
</html>`;

      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      addToast({
        title: "Error",
        description:
          "Unable to open print window. Please check your browser settings.",
        color: "danger",
      });
    }
  };

  const handleDownload = () =>
    addToast({
      title: "Download",
      description: "Download functionality will be implemented soon.",
      color: "primary",
    });

  const statusColors: Record<string, string> = {
    active: "bg-teal-50 text-teal-700 border-teal-200",
    completed: "bg-mountain-100 text-mountain-800 border-mountain-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className={title({ size: "sm" })}>Prescription Details</h1>
        </div>
        <div className="bg-white border border-mountain-200 rounded p-12 flex items-center justify-center shadow-sm">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white border border-mountain-200 rounded shadow-sm">
        <p className="text-red-500 text-lg mb-4">
          {error || "Prescription not found"}
        </p>
        <Button
          startContent={<IoArrowBackOutline />}
          variant="bordered"
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <Button isIconOnly variant="bordered" onClick={() => navigate(-1)}>
            <IoArrowBackOutline className="w-4 h-4" />
          </Button>
          <div>
            <h1 className={title({ size: "sm" })}>Prescription Details</h1>
            <p className="text-[14.5px] font-semibold text-mountain-800 tracking-wide mt-1">
              #{prescription.prescriptionNo}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            startContent={<IoCreateOutline className="w-4 h-4" />}
            variant="bordered"
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            startContent={<IoPrintOutline className="w-4 h-4" />}
            variant="bordered"
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            color="primary"
            startContent={<IoDownloadOutline className="w-4 h-4" />}
            onClick={handleDownload}
          >
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-mountain-200 rounded shadow-sm">
            <div className="px-5 py-4 border-b border-mountain-100 bg-mountain-50/50">
              <h4 className="font-semibold text-[15px] text-mountain-900 leading-none">
                Patient Information
              </h4>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                    Name
                  </p>
                  <p className="font-medium text-[14.5px] text-mountain-900">
                    {prescription.patientName}
                  </p>
                </div>
                <div>
                  <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                    Age
                  </p>
                  <p className="font-medium text-[14.5px] text-mountain-900">
                    {prescription.patientAge} years
                  </p>
                </div>
                <div>
                  <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                    Gender
                  </p>
                  <p className="font-medium text-[14.5px] text-mountain-900 capitalize">
                    {prescription.patientGender}
                  </p>
                </div>
                <div>
                  <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                    Phone
                  </p>
                  <p className="font-medium text-[14.5px] text-mountain-900">
                    {prescription.patientPhone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-mountain-200 rounded shadow-sm">
            <div className="px-5 py-4 border-b border-mountain-100 bg-mountain-50/50">
              <h4 className="font-semibold text-[15px] text-mountain-900 leading-none">
                Doctor Information
              </h4>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                    Name
                  </p>
                  <p className="font-medium text-[14.5px] text-mountain-900">
                    {prescription.doctorName}
                  </p>
                </div>
                <div>
                  <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                    Speciality
                  </p>
                  <p className="font-medium text-[14.5px] text-mountain-900">
                    {prescription.doctorSpeciality}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {prescription.appointmentInfo && (
            <div className="bg-white border border-mountain-200 rounded shadow-sm">
              <div className="px-5 py-4 border-b border-mountain-100 bg-mountain-50/50">
                <h4 className="font-semibold text-[15px] text-mountain-900 leading-none">
                  Appointment Information
                </h4>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                      Appointment Date
                    </p>
                    <p className="font-medium text-[14.5px] text-mountain-900">
                      {formatDate(prescription.appointmentInfo.appointmentDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                      Type
                    </p>
                    <p className="font-medium text-[14.5px] text-mountain-900 capitalize">
                      {prescription.appointmentTypeName ||
                        (prescription.appointmentInfo.appointmentType
                          ? prescription.appointmentInfo.appointmentType.replace(
                              /-/g,
                              " ",
                            )
                          : "Not specified")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                      Status
                    </p>
                    <p className="font-medium text-[14.5px] text-mountain-900 capitalize">
                      {prescription.appointmentInfo.status || "N/A"}
                    </p>
                  </div>
                  {prescription.appointmentInfo.reason && (
                    <div>
                      <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                        Reason
                      </p>
                      <p className="font-medium text-[14.5px] text-mountain-900">
                        {prescription.appointmentInfo.reason}
                      </p>
                    </div>
                  )}
                </div>
                {prescription.appointmentInfo.notes && (
                  <div className="pt-2 border-t border-mountain-100">
                    <p className="text-[12.5px] text-mountain-500 font-medium tracking-wide pb-1">
                      Notes
                    </p>
                    <p className="font-medium text-[14.5px] text-mountain-900">
                      {prescription.appointmentInfo.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white border border-mountain-200 rounded shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-mountain-100 bg-mountain-50/50">
              <h4 className="font-semibold text-[15px] text-mountain-900 leading-none">
                Prescribed Medicines
              </h4>
            </div>
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-mountain-50 border-b border-mountain-200">
                    <th className="px-5 py-3 text-[13px] font-semibold text-mountain-700 w-1/4">
                      Medicine
                    </th>
                    <th className="px-5 py-3 text-[13px] font-semibold text-mountain-700 w-1/6">
                      Dosage
                    </th>
                    <th className="px-5 py-3 text-[13px] font-semibold text-mountain-700 w-1/6">
                      Duration
                    </th>
                    <th className="px-5 py-3 text-[13px] font-semibold text-mountain-700 w-1/6">
                      Time
                    </th>
                    <th className="px-5 py-3 text-[13px] font-semibold text-mountain-700 w-1/6">
                      Frequency
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mountain-100">
                  {prescription.items?.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-mountain-50/30 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-[13.5px] text-mountain-900">
                          {item.medicineName}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[13.5px] text-mountain-700">
                        {item.dosage}
                      </td>
                      <td className="px-5 py-3 text-[13.5px] text-mountain-700">
                        {item.duration}
                      </td>
                      <td className="px-5 py-3 text-[13.5px] text-mountain-700 capitalize">
                        {item.time}
                      </td>
                      <td className="px-5 py-3 text-[13.5px] text-mountain-700 capitalize">
                        {item.frequency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {prescription.notes && (
            <div className="bg-white border border-mountain-200 rounded shadow-sm">
              <div className="px-5 py-4 border-b border-mountain-100 bg-mountain-50/50">
                <h4 className="font-semibold text-[15px] text-mountain-900 leading-none">
                  Notes & Instructions
                </h4>
              </div>
              <div className="p-6">
                <p className="text-[13.5px] text-mountain-800 leading-relaxed">
                  {prescription.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          <div className="bg-white border border-mountain-200 rounded shadow-sm">
            <div className="px-5 py-4 border-b border-mountain-100 bg-mountain-50/50">
              <h4 className="font-semibold text-[15px] text-mountain-900 leading-none">
                Summary
              </h4>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-mountain-600 font-medium tracking-wide">
                  Prescription No.
                </span>
                <span className="font-bold text-mountain-900">
                  {prescription.prescriptionNo}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13.5px] pt-4 border-t border-mountain-100">
                <span className="text-mountain-600 font-medium tracking-wide">
                  Date
                </span>
                <span className="font-semibold text-mountain-900">
                  {formatDate(prescription.prescriptionDate)}
                </span>
              </div>
              {prescription.appointmentInfo && (
                <div className="flex justify-between items-center text-[13.5px] pt-4 border-t border-mountain-100">
                  <span className="text-mountain-600 font-medium tracking-wide">
                    Appt. Date
                  </span>
                  <span className="font-semibold text-mountain-900">
                    {formatDate(prescription.appointmentInfo.appointmentDate)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-[13.5px] pt-4 border-t border-mountain-100">
                <span className="text-mountain-600 font-medium tracking-wide">
                  Status
                </span>
                <span
                  className={`inline-flex px-2 py-0.5 border rounded text-[11.5px] font-medium capitalize ${statusColors[prescription.status] || statusColors.completed}`}
                >
                  {prescription.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13.5px] pt-4 border-t border-mountain-100">
                <span className="text-mountain-600 font-medium tracking-wide">
                  Total Medicines
                </span>
                <span className="font-bold text-mountain-900">
                  {prescription.items?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13.5px] pt-4 border-t border-mountain-100">
                <span className="text-mountain-600 font-medium tracking-wide">
                  Created
                </span>
                <span className="font-semibold text-mountain-900">
                  {formatDate(prescription.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13.5px] pt-4 border-t border-mountain-100">
                <span className="text-mountain-600 font-medium tracking-wide">
                  Last Updated
                </span>
                <span className="font-semibold text-mountain-900">
                  {formatDate(prescription.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
