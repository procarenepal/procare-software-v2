/**
 * Prescriptions List Page — Clinic Clarity without HeroUI
 */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getPrintBrandingCSS,
  getPrintHeaderHTML,
  getPrintFooterHTML,
} from "@/utils/printBranding";
import { clinicService } from "@/services/clinicService";
import { PrintLayoutConfig } from "@/types/printLayout";
import {
  IoAddOutline,
  IoEyeOutline,
  IoCloseOutline,
  IoCreateOutline,
  IoDownloadOutline,
  IoEllipsisVerticalOutline,
  IoFilterOutline,
  IoTrashOutline,
  IoSearchOutline,
  IoReceiptOutline,
  IoPrintOutline,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";
import * as XLSX from "xlsx";

import { title } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/dropdown";
import { useAuthContext } from "@/context/AuthContext";
import { addToast } from "@/components/ui/toast";
import { prescriptionService } from "@/services/prescriptionService";
import { patientService } from "@/services/patientService";
import { doctorService } from "@/services/doctorService";
import { branchService } from "@/services/branchService";
import { Prescription } from "@/types/medical-records";
import { Branch } from "@/types/models";

// ── Types ───────────────────────────────────────────────────────────────────
interface ExtendedPrescription extends Prescription {
  patientName: string;
  doctorName: string;
  itemsCount: number;
}

// ── Custom UI Helpers ────────────────────────────────────────────────────────
function CustomInput({
  value,
  onChange,
  placeholder,
  startContent,
  className,
  type = "text",
}: any) {
  return (
    <div
      className={`flex items-center border border-mountain-200 rounded min-h-[36px] bg-white focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-100 ${className || ""}`}
    >
      {startContent && (
        <div className="pl-3 pr-2 text-mountain-400 flex items-center">
          {startContent}
        </div>
      )}
      <input
        className="flex-1 w-full text-[13px] px-2 py-1.5 bg-transparent outline-none text-mountain-800 placeholder:text-mountain-400"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  className,
  placeholder,
}: any) {
  return (
    <select
      className={`h-[36px] bg-white border border-mountain-200 text-mountain-800 text-[13px] rounded px-3 py-1 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-shadow ${className || ""}`}
      value={value}
      onChange={onChange}
    >
      {placeholder && (
        <option disabled hidden value="">
          {placeholder}
        </option>
      )}
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ModalShell({ isOpen, onClose, title, children, size = "md" }: any) {
  if (!isOpen) return null;
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };
  const maxWidth = sizeClasses[size as keyof typeof sizeClasses] || "max-w-md";

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-white rounded shadow-lg w-full ${maxWidth} pointer-events-auto flex flex-col max-h-[90vh]`}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-mountain-100">
            <h3 className="text-[15px] font-semibold text-mountain-900">
              {title}
            </h3>
            <button
              className="text-mountain-400 hover:text-mountain-600"
              onClick={onClose}
            >
              <IoCloseOutline className="w-5 h-5" />
            </button>
          </div>
          <div className="px-5 py-4 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function PrescriptionsPage() {
  const navigate = useNavigate();
  const { clinicId, userData, branchId: contextBranchId } = useAuthContext();

  const branchId = userData?.branchId ?? contextBranchId ?? null;
  const isClinicAdmin =
    userData?.role === "clinic-admin" ||
    userData?.role === "clinic-super-admin" ||
    userData?.role === "super-admin";

  const [prescriptions, setPrescriptions] = useState<ExtendedPrescription[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchMap, setBranchMap] = useState<Record<string, string>>({});
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [layoutConfig, setLayoutConfig] = useState<PrintLayoutConfig | null>(null);
  const [clinic, setClinic] = useState<any>(null);

  const effectiveBranchId = branchId ?? selectedBranchId ?? undefined;

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load branches for clinic admins (no fixed branchId)
  useEffect(() => {
    if (!clinicId || !isClinicAdmin || branchId) return;
    let cancelled = false;

    (async () => {
      try {
        const [branchesData, clinicData, layoutData] = await Promise.all([
          branchService.getClinicBranches(clinicId, true),
          clinicService.getClinicById(clinicId),
          clinicService.getPrintLayoutConfig(clinicId),
        ]);

        if (cancelled) return;
        setBranches(branchesData);
        if (clinicData) setClinic(clinicData);
        if (layoutData) setLayoutConfig(layoutData);

        const map: Record<string, string> = {};

        branchesData.forEach((b) => {
          map[b.id] = b.name;
        });
        setBranchMap(map);
        if (branchesData.length > 0) {
          const mainOrFirst =
            branchesData.find((b) => b.isMainBranch)?.id ?? branchesData[0].id;

          setSelectedBranchId((prev) => prev ?? mainOrFirst);
        } else {
          setSelectedBranchId(null);
        }
      } catch (err) {
        console.error("Prescriptions branches fetch error:", err);
        if (!cancelled) {
          setBranches([]);
          setBranchMap({});
          setSelectedBranchId(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clinicId, isClinicAdmin, branchId]);

  // Load layout for non-admin or if admin but skipped above
  useEffect(() => {
    if (!clinicId || (isClinicAdmin && !branchId)) return;
    (async () => {
      try {
        const [clinicData, layoutData] = await Promise.all([
          clinicService.getClinicById(clinicId),
          clinicService.getPrintLayoutConfig(clinicId),
        ]);

        if (clinicData) setClinic(clinicData);
        if (layoutData) setLayoutConfig(layoutData);
      } catch (err) {
        console.error("Error loading print layout:", err);
      }
    })();
  }, [clinicId, isClinicAdmin, branchId]);

  useEffect(() => {
    if (branchId) setSelectedBranchId(null);
  }, [branchId]);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!clinicId) return;
      try {
        setLoading(true);
        setError(null);
        const prescriptionsData =
          await prescriptionService.getPrescriptionsByClinic(
            clinicId,
            effectiveBranchId,
          );

        const extendedPrescriptions = await Promise.all(
          prescriptionsData.map(async (prescription) => {
            const [patient, doctor] = await Promise.all([
              patientService
                .getPatientById(prescription.patientId)
                .catch(() => null),
              doctorService
                .getDoctorById(prescription.doctorId)
                .catch(() => null),
            ]);
            let itemsCount = 0;

            try {
              const items = await prescriptionService.getPrescriptionItems(
                prescription.id,
              );

              itemsCount = items.length;
            } catch (e) { }

            return {
              ...prescription,
              patientName: patient ? patient.name : "Unknown Patient",
              doctorName: doctor ? `Dr. ${doctor.name}` : "Unknown Doctor",
              itemsCount,
            } as ExtendedPrescription;
          }),
        );

        extendedPrescriptions.sort(
          (a, b) =>
            new Date(b.prescriptionDate).getTime() -
            new Date(a.prescriptionDate).getTime(),
        );
        setPrescriptions(extendedPrescriptions);
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
        setError("Failed to load prescriptions. Please try again.");
        addToast({
          title: "Error",
          description: "Failed to load prescriptions.",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [clinicId, effectiveBranchId]);

  const formatDate = (date: Date | string): string => {
    if (!date) return "N/A";
    const d = new Date(date);

    if (isNaN(d.getTime())) return "N/A";

    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  const filteredPrescriptions = prescriptions.filter((p) => {
    const term = searchTerm.toLowerCase();
    const searchMatch =
      p.patientName.toLowerCase().includes(term) ||
      p.doctorName.toLowerCase().includes(term) ||
      p.prescriptionNo.toLowerCase().includes(term);
    const statusMatch = selectedStatus === "all" || p.status === selectedStatus;
    const doctorMatch =
      selectedDoctor === "all" || p.doctorId === selectedDoctor;

    const pDate = new Date(p.prescriptionDate);
    const dateMatch =
      (!dateRange.start || pDate >= new Date(dateRange.start)) &&
      (!dateRange.end || pDate <= new Date(dateRange.end));

    return searchMatch && statusMatch && doctorMatch && dateMatch;
  });

  const uniqueDoctors = Array.from(
    new Set(prescriptions.map((p) => ({ id: p.doctorId, name: p.doctorName }))),
  ).filter((d, i, self) => self.findIndex((sd) => sd.id === d.id) === i);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPrescriptions.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPrescriptions = filteredPrescriptions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedDoctor("all");
    setDateRange({ start: "", end: "" });
    setCurrentPage(1);
    setIsFiltersOpen(false);
  };

  const hasAdvancedFilters =
    selectedStatus !== "all" ||
    selectedDoctor !== "all" ||
    dateRange.start ||
    dateRange.end;

  const exportPrescriptionsToXLSX = () => {
    try {
      const exportData = filteredPrescriptions.map((p) => ({
        "Prescription No.": p.prescriptionNo,
        "Patient Name": p.patientName,
        Doctor: p.doctorName,
        "Prescription Date": formatDate(p.prescriptionDate),
        Status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
        "Medicines Count": p.itemsCount,
        Notes: p.notes || "",
        "Created Date": formatDate(p.createdAt),
        "Updated Date": formatDate(p.updatedAt),
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws["!cols"] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
      ];
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, ws, "Prescriptions");
      const filename = `prescriptions_export_${new Date().toISOString().split("T")[0]}.xlsx`;

      XLSX.writeFile(wb, filename);
      addToast({
        title: "Success",
        description: `Exported as ${filename}`,
        color: "success",
      });
    } catch (e) {
      addToast({
        title: "Error",
        description: "Failed to export Excel.",
        color: "danger",
      });
    }
  };

  const exportPrescriptionsToCSV = () => {
    try {
      const exportData = filteredPrescriptions.map((p) => ({
        "Prescription No.": p.prescriptionNo,
        "Patient Name": p.patientName,
        Doctor: p.doctorName,
        "Prescription Date": formatDate(p.prescriptionDate),
        Status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
        "Medicines Count": p.itemsCount,
        Notes: p.notes || "",
        "Created Date": formatDate(p.createdAt),
        "Updated Date": formatDate(p.updatedAt),
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, ws, "Prescriptions");
      const filename = `prescriptions_export_${new Date().toISOString().split("T")[0]}.csv`;

      XLSX.writeFile(wb, filename, { bookType: "csv" });
      addToast({
        title: "Success",
        description: `Exported as ${filename}`,
        color: "success",
      });
    } catch (e) {
      addToast({
        title: "Error",
        description: "Failed to export CSV.",
        color: "danger",
      });
    }
  };

  const printPrescriptions = () => {
    try {
      const printWindow = window.open("", "_blank");

      if (!printWindow) throw new Error();

      const brandingCSS = layoutConfig ? getPrintBrandingCSS(layoutConfig) : "";
      const headerHTML = layoutConfig ? getPrintHeaderHTML(layoutConfig, clinic) : "";
      const footerHTML = layoutConfig ? getPrintFooterHTML(layoutConfig) : "";

      const printContent = `
        <!DOCTYPE html><html><head><title>Prescriptions Report</title>
        <style>
          body { font-family: Arial; margin: 0; padding: 0; background: white; color: #333; }
          .print-container { width: 100%; display: flex; flex-direction: column; }
          .content { flex: 1; padding: 15mm; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; font-size: 20px; text-align: center; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .meta { color: #666; margin-bottom: 20px; font-size: 12px; }
          ${brandingCSS}
          @media print { body { padding: 0; } .print-container { min-height: auto; } }
        </style></head><body>
          <div class="print-container">
            ${headerHTML}
            <div class="content">
              <h1>Prescriptions Report</h1>
              <div class="meta"><p>Generated on: ${new Date().toLocaleString()}</p><p>Total Prescriptions: ${filteredPrescriptions.length}</p></div>
              <table>
                <thead><tr><th>No.</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Status</th><th>Items</th></tr></thead>
                <tbody>${filteredPrescriptions.map((p) => `<tr><td>${p.prescriptionNo}</td><td>${p.patientName}</td><td>${p.doctorName}</td><td>${formatDate(p.prescriptionDate)}</td><td>${p.status}</td><td>${p.itemsCount}</td></tr>`).join("")}</tbody>
              </table>
            </div>
            ${footerHTML}
          </div>
        </body></html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.addEventListener("onafterprint", () => printWindow.close());
    } catch (e) {
      addToast({
        title: "Error",
        description: "Failed to trigger print.",
        color: "danger",
      });
    }
  };

  const statusColors: Record<string, string> = {
    active: "bg-teal-50 text-teal-700 border border-teal-200",
    completed: "bg-mountain-100 text-mountain-800 border border-mountain-200",
    cancelled: "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={title({ size: "sm" })}>Prescriptions</h1>
          <p className="text-[13.5px] text-mountain-500 mt-1">
            Manage patient prescriptions and medical records
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!branchId && isClinicAdmin && branches.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-mountain-500">Branch</span>
              <select
                className="h-8 px-2.5 py-0 text-[12px] border border-mountain-200 rounded bg-white text-mountain-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                value={selectedBranchId ?? ""}
                onChange={(e) => setSelectedBranchId(e.target.value || null)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button startContent={<IoDownloadOutline />} variant="bordered">
                Export
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Export options">
              <DropdownItem
                key="excel"
                startContent={<IoDownloadOutline />}
                onClick={exportPrescriptionsToXLSX}
              >
                Export to Excel
              </DropdownItem>
              <DropdownItem
                key="csv"
                startContent={<IoDownloadOutline />}
                onClick={exportPrescriptionsToCSV}
              >
                Export to CSV
              </DropdownItem>
              <DropdownItem
                key="print"
                startContent={<IoPrintOutline />}
                onClick={printPrescriptions}
              >
                Print Report
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Button
            color="primary"
            startContent={<IoAddOutline />}
            onClick={() => navigate("/dashboard/prescriptions/new")}
          >
            New Prescription
          </Button>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white border border-mountain-200 rounded shadow-sm">
        {/* Controls */}
        <div className="p-4 border-b border-mountain-100 bg-mountain-50/50 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-[14px] text-mountain-800">
              Search & Filter
            </h4>
            <div className="flex gap-2">
              {hasAdvancedFilters && (
                <Button
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  size="sm"
                  startContent={<IoTrashOutline />}
                  variant="ghost"
                  onClick={clearAllFilters}
                >
                  Clear Filters
                </Button>
              )}
              <Button
                size="sm"
                startContent={<IoFilterOutline />}
                variant="flat"
                onClick={() => setIsFiltersOpen(true)}
              >
                Advanced Filters
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <CustomInput
              className="flex-1 w-full md:w-auto"
              placeholder="Search by patient, doctor, or Rx No..."
              startContent={<IoSearchOutline />}
              value={searchTerm}
              onChange={(e: any) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <CustomSelect
              className="w-full md:w-36"
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              value={selectedStatus}
              onChange={(e: any) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            />
            <CustomSelect
              className="w-full md:w-48"
              options={[
                { value: "all", label: "All Doctors" },
                ...uniqueDoctors.map((d) => ({ value: d.id, label: d.name })),
              ]}
              value={selectedDoctor}
              onChange={(e: any) => {
                setSelectedDoctor(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {hasAdvancedFilters && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-mountain-100">
              {selectedStatus !== "all" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded text-[12px] font-medium text-teal-800">
                  Status: <span className="capitalize">{selectedStatus}</span>
                  <button
                    className="text-teal-600 hover:text-teal-900"
                    onClick={() => setSelectedStatus("all")}
                  >
                    <IoAddOutline className="w-3.5 h-3.5 rotate-45" />
                  </button>
                </div>
              )}
              {selectedDoctor !== "all" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-mountain-100 border border-mountain-200 rounded text-[12px] font-medium text-mountain-800">
                  Doctor:{" "}
                  {uniqueDoctors.find((d) => d.id === selectedDoctor)?.name}
                  <button
                    className="text-mountain-400 hover:text-mountain-600"
                    onClick={() => setSelectedDoctor("all")}
                  >
                    <IoAddOutline className="w-3.5 h-3.5 rotate-45" />
                  </button>
                </div>
              )}
              {(dateRange.start || dateRange.end) && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-[12px] font-medium text-blue-800">
                  Date: {dateRange.start || "Any"} - {dateRange.end || "Any"}
                  <button
                    className="text-blue-600 hover:text-blue-900"
                    onClick={() => setDateRange({ start: "", end: "" })}
                  >
                    <IoAddOutline className="w-3.5 h-3.5 rotate-45" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters Modal */}
        <ModalShell
          isOpen={isFiltersOpen}
          size="md"
          title="Advanced Filters"
          onClose={() => setIsFiltersOpen(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-mountain-700">
                From Date
              </label>
              <input
                className="px-3 py-1.5 border border-mountain-200 rounded text-[13px] focus:outline-none focus:border-teal-500"
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-mountain-700">
                To Date
              </label>
              <input
                className="px-3 py-1.5 border border-mountain-200 rounded text-[13px] focus:outline-none focus:border-teal-500"
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="bordered"
              onClick={() => {
                setDateRange({ start: "", end: "" });
                setIsFiltersOpen(false);
              }}
            >
              Reset Range
            </Button>
            <Button color="primary" onClick={() => setIsFiltersOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </ModalShell>

        {/* Table/Content Area */}
        <div className="p-0 overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-[300px]">
              <Spinner size="md" />
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-[300px] gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                <span className="text-red-500">⚠️</span>
              </div>
              <h3 className="text-[14px] font-semibold text-mountain-800">
                Error Loading Prescriptions
              </h3>
              <p className="text-[13px] text-mountain-500 max-w-sm">{error}</p>
              <Button color="primary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : currentPrescriptions.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-[300px] gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-mountain-50 flex items-center justify-center border border-mountain-100">
                <IoReceiptOutline className="w-6 h-6 text-mountain-400" />
              </div>
              <h3 className="text-[14px] font-semibold text-mountain-800">
                {searchTerm || hasAdvancedFilters
                  ? "No prescriptions match your criteria"
                  : "No prescriptions created yet"}
              </h3>
              <p className="text-[13px] text-mountain-500 max-w-sm">
                {searchTerm || hasAdvancedFilters
                  ? "Try removing some filters or change your search term."
                  : "Start writing prescriptions for your patients."}
              </p>
              {!searchTerm && !hasAdvancedFilters && (
                <Button
                  color="primary"
                  startContent={<IoAddOutline />}
                  onClick={() => navigate("/dashboard/prescriptions/new")}
                >
                  Create First Prescription
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-mountain-50/50 border-b border-mountain-200">
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    No.
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    Patient
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    Doctor
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    Date
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    Medicines
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[12.5px] font-semibold text-mountain-600 w-24">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mountain-100">
                {currentPrescriptions.map((prescription) => (
                  <tr
                    key={prescription.id}
                    className="hover:bg-mountain-50/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        className="text-[13.5px] font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                        to={`/dashboard/prescriptions/${prescription.id}`}
                      >
                        {prescription.prescriptionNo}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[13.5px] font-medium text-mountain-900">
                      {prescription.patientName}
                    </td>
                    <td className="px-5 py-3 text-[13.5px] text-mountain-700">
                      {prescription.doctorName}
                    </td>
                    <td className="px-5 py-3 text-[13.5px] text-mountain-600">
                      {formatDate(prescription.prescriptionDate)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-[13px] text-mountain-700">
                        <span className="font-semibold text-mountain-900">
                          {prescription.itemsCount}
                        </span>
                        rx
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11.5px] font-medium capitalize ${statusColors[prescription.status] || statusColors.completed}`}
                      >
                        {prescription.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13.5px]">
                      <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            className="text-mountain-500"
                            size="sm"
                            variant="ghost"
                          >
                            <IoEllipsisVerticalOutline />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                          <DropdownItem
                            startContent={<IoEyeOutline />}
                            onClick={() =>
                              navigate(
                                `/dashboard/prescriptions/${prescription.id}`,
                              )
                            }
                          >
                            View Details
                          </DropdownItem>
                          <DropdownItem
                            startContent={<IoCreateOutline />}
                            onClick={() =>
                              navigate(
                                `/dashboard/prescriptions/${prescription.id}/edit`,
                              )
                            }
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem
                            color="danger"
                            startContent={<IoTrashOutline />}
                            onClick={() => {
                              /* TODO: Implement delete */
                            }}
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && currentPrescriptions.length > 0 && (
          <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50/30 flex items-center justify-between">
            <p className="text-[12.5px] text-mountain-500">
              Showing{" "}
              <span className="font-medium text-mountain-900">
                {startIndex + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-mountain-900">
                {Math.min(
                  startIndex + itemsPerPage,
                  filteredPrescriptions.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-mountain-900">
                {filteredPrescriptions.length}
              </span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                isIconOnly
                disabled={currentPage === 1}
                size="sm"
                variant="bordered"
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <IoChevronBack className="w-3.5 h-3.5" />
              </Button>
              <div className="px-3 text-[13px] font-medium text-mountain-700">
                {currentPage} / {totalPages}
              </div>
              <Button
                isIconOnly
                disabled={currentPage === totalPages}
                size="sm"
                variant="bordered"
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <IoChevronForward className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
