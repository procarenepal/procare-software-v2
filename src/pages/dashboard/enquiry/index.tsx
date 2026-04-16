import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { format, startOfToday, addDays, subDays, startOfDay } from "date-fns";
import * as XLSX from "xlsx";
import {
  IoAddOutline,
  IoFilterOutline,
  IoRefreshOutline,
  IoDownloadOutline,
  IoPersonOutline,
  IoCallOutline,
  IoCalendarOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoCloseOutline,
} from "react-icons/io5";

import { useAuthContext } from "@/context/AuthContext";
import { enquiryService } from "@/services/enquiryService";
import { Enquiry, EnquiryStatus } from "@/types/models";
import { addToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type DatePreset = "all" | "today" | "yesterday" | "tomorrow";

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "all", label: "All" },
  { key: "yesterday", label: "Yesterday" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
];

const STATUS_OPTIONS: {
  key: EnquiryStatus | "all";
  label: string;
  color: "primary" | "warning" | "secondary" | "success" | "danger" | "default";
}[] = [
  { key: "all", label: "All Statuses", color: "default" },
  { key: "new", label: "New", color: "primary" },
  { key: "contacted", label: "Contacted", color: "warning" },
  // Backward-compatible: underlying status key stays `scheduled` but UI label is "Technician"
  { key: "scheduled", label: "Technician", color: "secondary" },
  // Backward-compatible: underlying status key stays `converted` but UI label is "Done"
  { key: "converted", label: "Done", color: "success" },
  { key: "closed", label: "Closed", color: "danger" },
];

const ACTION_OPTIONS: { key: "call" | "offer" | "council"; label: string }[] = [
  { key: "call", label: "Call" },
  { key: "offer", label: "Offer" },
  { key: "council", label: "Council" },
];

const defaultForm = {
  fullName: "",
  phone: "",
  reasonForVisit: "",
  appointmentDate: "",
  source: "",
  note: "",
  lastContactedAt: "",
  nextContactAt: "",
  action: "" as "" | "call" | "offer" | "council",
  status: "new" as EnquiryStatus,
};

export default function EnquiriesPage() {
  const { clinicId, userData, currentUser } = useAuthContext();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [dateField, setDateField] = useState<"appointmentDate" | "createdAt">(
    "appointmentDate",
  );
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "all">(
    "all",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);

  const filteredEnquiries = useMemo(() => enquiries, [enquiries]);

  useEffect(() => {
    if (!clinicId) return;
    fetchEnquiries();
  }, [
    clinicId,
    userData?.branchId,
    datePreset,
    rangeStart,
    rangeEnd,
    dateField,
    statusFilter,
  ]);

  const computeDateRange = () => {
    if (rangeStart || rangeEnd) {
      let start: Date | undefined;
      let end: Date | undefined;

      if (rangeStart) {
        start = startOfDay(new Date(rangeStart));
      }
      if (rangeEnd) {
        end = startOfDay(new Date(rangeEnd));
      }

      if (start && end && end < start) {
        const tmp = start;

        start = end;
        end = tmp;
      }

      const result: { startDate?: Date; endDate?: Date } = {};

      if (start) {
        result.startDate = start;
      }
      if (end) {
        result.endDate = addDays(end, 1);
      }

      return result;
    }
    if (datePreset === "all") return {};
    const today = startOfToday();

    if (datePreset === "today") {
      return { startDate: today, endDate: addDays(today, 1) };
    }
    if (datePreset === "yesterday") {
      const start = subDays(today, 1);

      return { startDate: start, endDate: today };
    }
    // tomorrow
    const tomorrow = addDays(today, 1);

    return { startDate: tomorrow, endDate: addDays(tomorrow, 1) };
  };

  const fetchEnquiries = async () => {
    if (!clinicId) return;
    setIsLoading(true);
    try {
      const dateRange = computeDateRange();
      const data = await enquiryService.getEnquiries(
        clinicId,
        userData?.branchId,
        {
          status: statusFilter,
          dateField,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      );

      setEnquiries(data);
    } catch (error) {
      console.error("Failed to load enquiries:", error);
      addToast({
        title: "Error",
        description: "Unable to load enquiries at the moment.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormState = () => {
    setForm(defaultForm);
    setEditingEnquiry(null);
  };

  const handleOpenModal = (enquiry?: Enquiry) => {
    if (enquiry) {
      setEditingEnquiry(enquiry);
      setForm({
        fullName: enquiry.fullName,
        phone: enquiry.phone,
        reasonForVisit: enquiry.reasonForVisit || "",
        appointmentDate: enquiry.appointmentDate
          ? format(enquiry.appointmentDate, "yyyy-MM-dd")
          : "",
        source: enquiry.source || "",
        note: enquiry.note || "",
        lastContactedAt: enquiry.lastContactedAt
          ? format(enquiry.lastContactedAt, "yyyy-MM-dd")
          : "",
        nextContactAt: enquiry.nextContactAt
          ? format(enquiry.nextContactAt, "yyyy-MM-dd")
          : "",
        action: enquiry.action || "",
        status: enquiry.status,
      });
    } else {
      resetFormState();
    }
    setIsModalOpen(true);
  };

  const handleSaveEnquiry = async () => {
    if (!clinicId || !currentUser?.uid) return;
    if (!form.fullName.trim() || !form.phone.trim()) {
      addToast({
        title: "Validation Error",
        description: "Full name and phone are required.",
        color: "warning",
      });

      return;
    }

    setIsSaving(true);
    try {
      if (editingEnquiry) {
        await enquiryService.updateEnquiry(editingEnquiry.id, {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          reasonForVisit: form.reasonForVisit.trim() || undefined,
          appointmentDate: form.appointmentDate
            ? new Date(form.appointmentDate)
            : undefined,
          source: form.source.trim() || undefined,
          note: form.note.trim() || undefined,
          lastContactedAt: form.lastContactedAt
            ? new Date(form.lastContactedAt)
            : undefined,
          nextContactAt: form.nextContactAt
            ? new Date(form.nextContactAt)
            : undefined,
          action: form.action || undefined,
          status: form.status,
        });
        addToast({
          title: "Updated",
          description: "Enquiry updated successfully.",
          color: "success",
        });
      } else {
        await enquiryService.createEnquiry({
          clinicId,
          branchId: userData?.branchId || "",
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          reasonForVisit: form.reasonForVisit.trim() || undefined,
          appointmentDate: form.appointmentDate
            ? new Date(form.appointmentDate)
            : undefined,
          source: form.source.trim() || undefined,
          note: form.note.trim() || undefined,
          lastContactedAt: form.lastContactedAt
            ? new Date(form.lastContactedAt)
            : undefined,
          nextContactAt: form.nextContactAt
            ? new Date(form.nextContactAt)
            : undefined,
          action: form.action || undefined,
          status: form.status,
          createdBy: currentUser.uid,
        });
        addToast({
          title: "Created",
          description: "Enquiry recorded successfully.",
          color: "success",
        });
      }

      await fetchEnquiries();
      setIsModalOpen(false);
      resetFormState();
    } catch (error) {
      console.error("Failed to save enquiry:", error);
      addToast({
        title: "Error",
        description: "Unable to save enquiry right now.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (enquiryId: string) => {
    if (!confirm("Delete this enquiry? This cannot be undone.")) return;
    try {
      await enquiryService.deleteEnquiry(enquiryId);
      await fetchEnquiries();
      addToast({
        title: "Deleted",
        description: "Enquiry removed successfully.",
        color: "success",
      });
    } catch (error) {
      console.error("Failed to delete enquiry:", error);
      addToast({
        title: "Error",
        description: "Unable to delete enquiry right now.",
        color: "danger",
      });
    }
  };

  const handleStatusChange = async (
    enquiryId: string,
    status: EnquiryStatus,
  ) => {
    try {
      await enquiryService.updateEnquiryStatus(enquiryId, status);
      setEnquiries((prev) =>
        prev.map((enquiry) =>
          enquiry.id === enquiryId ? { ...enquiry, status } : enquiry,
        ),
      );
      addToast({
        title: "Status Updated",
        description: "Enquiry status updated.",
        color: "success",
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      addToast({
        title: "Error",
        description: "Unable to update status right now.",
        color: "danger",
      });
    }
  };

  const exportEnquiriesToXLSX = () => {
    if (filteredEnquiries.length === 0) {
      addToast({
        title: "No data",
        description:
          "There are no enquiries to export for the selected filters.",
        color: "warning",
      });

      return;
    }

    try {
      const exportData = filteredEnquiries.map((enquiry) => {
        const opt = STATUS_OPTIONS.find((o) => o.key === enquiry.status);
        const statusLabel = (opt?.label || enquiry.status).toString();

        return {
          "Full Name": enquiry.fullName,
          Phone: enquiry.phone,
          "Reason For Visit": enquiry.reasonForVisit || "",
          "Appointment Date": enquiry.appointmentDate
            ? format(enquiry.appointmentDate, "yyyy-MM-dd")
            : "",
          Source: enquiry.source || "",
          "Last Contacted": enquiry.lastContactedAt
            ? format(enquiry.lastContactedAt, "yyyy-MM-dd")
            : "",
          "Next Contact": enquiry.nextContactAt
            ? format(enquiry.nextContactAt, "yyyy-MM-dd")
            : "",
          Action: enquiry.action
            ? (ACTION_OPTIONS.find((o) => o.key === enquiry.action)?.label ??
              enquiry.action)
            : "",
          Status: statusLabel,
          "Created At": enquiry.createdAt
            ? format(enquiry.createdAt, "yyyy-MM-dd HH:mm")
            : "",
          Notes: enquiry.note || "",
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();

      if (exportData.length > 0) {
        const colWidths = Object.keys(exportData[0]).map((key) => ({
          wch: Math.max(key.length, 15),
        }));

        (ws as any)["!cols"] = colWidths;
      }

      XLSX.utils.book_append_sheet(wb, ws, "Enquiries");

      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `enquiries_export_${currentDate}.xlsx`;

      XLSX.writeFile(wb, filename);

      addToast({
        title: "Export Successful",
        description: `Enquiries exported successfully as ${filename}.`,
        color: "success",
      });
    } catch (error) {
      console.error("Error exporting enquiries:", error);
      addToast({
        title: "Export Failed",
        description: "Failed to export enquiries. Please try again.",
        color: "danger",
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-mountain-900">
            Enquiries
          </h1>
          <p className="text-[13.5px] text-mountain-500 mt-1">
            Log social media and marketing leads in one place.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            disabled={isLoading}
            startContent={<IoRefreshOutline />}
            variant="bordered"
            onClick={fetchEnquiries}
          >
            Refresh
          </Button>
          <Button
            disabled={isLoading || filteredEnquiries.length === 0}
            startContent={<IoDownloadOutline />}
            variant="bordered"
            onClick={exportEnquiriesToXLSX}
          >
            Export Excel
          </Button>
          <Button
            color="primary"
            startContent={<IoAddOutline />}
            onClick={() => handleOpenModal()}
          >
            Add Enquiry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="clarity-card bg-white border border-mountain-200 rounded">
        <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center gap-2">
          <IoFilterOutline className="w-4 h-4 text-mountain-500" />
          <span className="text-[13px] font-semibold text-mountain-900">
            Filters
          </span>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4 lg:items-center">
            {/* Date presets */}
            <div className="flex flex-col gap-2">
              <p className="text-[12.5px] text-mountain-500">Date presets</p>
              <div className="inline-flex rounded border border-mountain-200 bg-mountain-50 overflow-hidden">
                {DATE_PRESETS.map((preset) => {
                  const active = datePreset === preset.key;

                  return (
                    <button
                      key={preset.key}
                      className={`px-3 py-1.5 text-[12px] border-r border-mountain-200 last:border-r-0 ${
                        active
                          ? "bg-white text-teal-700 font-medium"
                          : "text-mountain-600 hover:bg-white hover:text-mountain-900"
                      }`}
                      type="button"
                      onClick={() => {
                        setDatePreset(preset.key);
                        setRangeStart("");
                        setRangeEnd("");
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date range */}
            <div className="flex flex-col gap-1.5 w-[220px] shrink-0">
              <label className="text-[13px] font-medium text-mountain-700">
                Date range
              </label>
              <div className="flex gap-2 min-w-0">
                <input
                  className="h-[32px] min-w-0 flex-1 border border-mountain-200 rounded px-2 text-[13px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                  placeholder="From"
                  type="date"
                  value={rangeStart}
                  onChange={(e) => {
                    setRangeStart(e.target.value);
                    setDatePreset("all");
                  }}
                />
                <input
                  className="h-[32px] min-w-0 flex-1 border border-mountain-200 rounded px-2 text-[13px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                  placeholder="To"
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => {
                    setRangeEnd(e.target.value);
                    setDatePreset("all");
                  }}
                />
              </div>
            </div>

            {/* Date field */}
            <div className="flex flex-col gap-1.5 w-[150px]">
              <label className="text-[13px] font-medium text-mountain-700">
                Date field
              </label>
              <select
                className="h-[32px] border border-mountain-200 rounded px-2 text-[13px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                value={dateField}
                onChange={(e) =>
                  setDateField(
                    e.target.value as "appointmentDate" | "createdAt",
                  )
                }
              >
                <option value="appointmentDate">Appointment date</option>
                <option value="createdAt">Created date</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5 w-[170px]">
              <label className="text-[13px] font-medium text-mountain-700">
                Status
              </label>
              <select
                className="h-[32px] border border-mountain-200 rounded px-2 text-[13px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as EnquiryStatus | "all")
                }
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiries table */}
      <div className="clarity-card bg-white border border-mountain-200 rounded">
        <div className="p-0">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-[13.5px] text-mountain-500">
                No enquiries found for the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="clarity-table w-full text-left border-collapse whitespace-normal">
                <thead>
                  <tr className="bg-mountain-50 border-b border-mountain-200">
                    <th className="px-3 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                      Name
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                      Phone
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                      Appt Date
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                      Source
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                      Last contacted
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                      Next contact
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                      Action
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                      Status
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                      Created
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-mountain-600 uppercase tracking-[0.08em]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mountain-100 bg-white">
                  {filteredEnquiries.map((enquiry) => (
                    <tr
                      key={enquiry.id}
                      className="hover:bg-mountain-50/40 transition-colors"
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-col">
                          <span className="text-[13.5px] font-medium flex items-center gap-2 text-mountain-900">
                            <IoPersonOutline className="text-mountain-400" />
                            {enquiry.fullName}
                          </span>
                          {enquiry.reasonForVisit && (
                            <span className="text-[11.5px] text-mountain-500 mt-0.5">
                              {enquiry.reasonForVisit}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <IoCallOutline className="text-mountain-400" />
                          {enquiry.phone}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {enquiry.appointmentDate ? (
                          <div className="flex items-center gap-2">
                            <IoCalendarOutline className="text-mountain-400" />
                            {format(enquiry.appointmentDate, "MMM dd, yyyy")}
                          </div>
                        ) : (
                          <span className="text-mountain-400 text-[13px]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-[13px] text-mountain-800">
                        {enquiry.source || "—"}
                      </td>
                      <td className="px-3 py-2 align-top text-[13px] text-mountain-800">
                        {enquiry.lastContactedAt
                          ? format(enquiry.lastContactedAt, "MMM dd, yyyy")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 align-top text-[13px] text-mountain-800">
                        {enquiry.nextContactAt
                          ? format(enquiry.nextContactAt, "MMM dd, yyyy")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 align-top text-[13px] text-mountain-800">
                        {enquiry.action
                          ? (ACTION_OPTIONS.find(
                              (o) => o.key === enquiry.action,
                            )?.label ?? enquiry.action)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {(() => {
                          const opt = STATUS_OPTIONS.find(
                            (o) => o.key === enquiry.status,
                          );
                          const label = (
                            opt?.label || enquiry.status
                          ).toString();
                          const cls =
                            opt?.color === "success"
                              ? "bg-health-100 text-health-700 border-health-200"
                              : opt?.color === "warning"
                                ? "bg-saffron-100 text-saffron-700 border-saffron-200"
                                : opt?.color === "secondary"
                                  ? "bg-teal-100 text-teal-700 border-teal-200"
                                  : opt?.color === "danger"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : opt?.color === "primary"
                                      ? "bg-teal-100 text-teal-700 border-teal-200"
                                      : "bg-mountain-100 text-mountain-700 border-mountain-200";

                          return (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${cls}`}
                            >
                              {label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2 align-top text-[13px] text-mountain-800">
                        {enquiry.createdAt
                          ? format(enquiry.createdAt, "MMM dd, yyyy HH:mm")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="bordered"
                              onClick={() => handleOpenModal(enquiry)}
                            >
                              <IoCreateOutline className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              variant="bordered"
                              onClick={() => handleDelete(enquiry.id)}
                            >
                              <IoTrashOutline className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-mountain-500">
                              Status:
                            </span>
                            <select
                              className="h-[28px] border border-mountain-200 rounded px-2 text-[12.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                              value={enquiry.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  enquiry.id,
                                  e.target.value as EnquiryStatus,
                                )
                              }
                            >
                              {STATUS_OPTIONS.filter(
                                (o) => o.key !== "all",
                              ).map((option) => (
                                <option key={option.key} value={option.key}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal - custom overlay */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-mountain-900/40 backdrop-blur-sm"
              onClick={() => {
                if (!isSaving) {
                  setIsModalOpen(false);
                  resetFormState();
                }
              }}
            />
            <div className="relative z-10 bg-white border border-mountain-200 rounded-md w-full max-w-2xl mx-4">
              <div className="px-5 py-3 border-b border-mountain-100 bg-mountain-50/60 flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-mountain-900">
                    {editingEnquiry ? "Edit Enquiry" : "New Enquiry"}
                  </h2>
                  <p className="text-[12px] text-mountain-500 mt-0.5">
                    Capture lead details and optional appointment date.
                  </p>
                </div>
                <button
                  className="text-mountain-400 hover:text-mountain-700"
                  type="button"
                  onClick={() => {
                    if (!isSaving) {
                      setIsModalOpen(false);
                      resetFormState();
                    }
                  }}
                >
                  <IoCloseOutline className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-mountain-700">
                      Full Name<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      type="text"
                      value={form.fullName}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-mountain-700">
                      Phone<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      type="text"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-mountain-700">
                      Reason for Visit
                    </label>
                    <input
                      className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      type="text"
                      value={form.reasonForVisit}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          reasonForVisit: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-mountain-700">
                      Appointment Date
                    </label>
                    <input
                      className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      type="date"
                      value={form.appointmentDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          appointmentDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-mountain-700">
                      Last contacted
                    </label>
                    <input
                      className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      type="date"
                      value={form.lastContactedAt}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          lastContactedAt: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-mountain-700">
                      Source
                    </label>
                    <input
                      className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      placeholder="Facebook, Instagram, Referral..."
                      type="text"
                      value={form.source}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, source: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-mountain-700">
                      Next contacted
                    </label>
                    <input
                      className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      type="date"
                      value={form.nextContactAt}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          nextContactAt: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-mountain-700">
                      Action
                    </label>
                    <select
                      className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      value={form.action}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          action: e.target.value as
                            | ""
                            | "call"
                            | "offer"
                            | "council",
                        }))
                      }
                    >
                      <option value="">—</option>
                      {ACTION_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium text-mountain-700">
                      Status
                    </label>
                    <select
                      className="h-[32px] border border-mountain-200 rounded px-3 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          status: e.target.value as EnquiryStatus,
                        }))
                      }
                    >
                      {STATUS_OPTIONS.filter((opt) => opt.key !== "all").map(
                        (option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-mountain-700">
                    Notes
                  </label>
                  <textarea
                    className="min-h-[80px] border border-mountain-200 rounded px-3 py-2 text-[13.5px] text-mountain-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                    placeholder="Add any special instructions or notes..."
                    value={form.note}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50 flex justify-end gap-3">
                <Button
                  disabled={isSaving}
                  variant="bordered"
                  onClick={() => {
                    if (!isSaving) {
                      setIsModalOpen(false);
                      resetFormState();
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isLoading={isSaving}
                  onClick={handleSaveEnquiry}
                >
                  {editingEnquiry ? "Update Enquiry" : "Create Enquiry"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
