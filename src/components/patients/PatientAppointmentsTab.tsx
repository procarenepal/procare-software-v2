/**
 * PatientAppointmentsTab — Clinic Clarity, zero HeroUI
 * Custom flat table, filter chips, inline status dropdown.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IoCalendarOutline,
  IoAddOutline,
  IoEyeOutline,
  IoRefreshOutline,
} from "react-icons/io5";

import { useAuth } from "@/hooks/useAuth";
import { appointmentService } from "@/services/appointmentService";
import { doctorService } from "@/services/doctorService";
import { appointmentTypeService } from "@/services/appointmentTypeService";
import { Appointment, Doctor, AppointmentType } from "@/types/models";
import { addToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/dropdown";

interface PatientAppointmentsTabProps {
  patientId: string;
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-teal-100 text-teal-700 border-teal-200",
  confirmed: "bg-health-100 text-health-700 border-health-200",
  "in-progress": "bg-saffron-100 text-saffron-700 border-saffron-200",
  completed: "bg-mountain-100 text-mountain-600 border-mountain-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  "no-show": "bg-red-100 text-red-600 border-red-200",
};

const ALL_STATUSES = [
  { id: "scheduled", name: "Scheduled" },
  { id: "confirmed", name: "Confirmed" },
  { id: "in-progress", name: "In Progress" },
  { id: "completed", name: "Completed" },
  { id: "cancelled", name: "Cancelled" },
  { id: "no-show", name: "No Show" },
] as const;

type StatusKey = (typeof ALL_STATUSES)[number]["id"];

function StatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_STYLE[status.toLowerCase()] ||
    "bg-mountain-100 text-mountain-600 border-mountain-200";

  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

// Inline status change dropdown
function StatusDropdown({
  appointmentId,
  current,
  onChanged,
}: {
  appointmentId: string;
  current: string;
  onChanged: (id: string, s: StatusKey) => void;
}) {
  const options = ALL_STATUSES.filter((s) => s.id !== current.toLowerCase());

  return (
    <Dropdown placement="bottom-start">
      <DropdownTrigger>
        <button
          className="inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
          type="button"
        >
          <IoRefreshOutline className="w-3 h-3" /> Change
        </button>
      </DropdownTrigger>
      <DropdownMenu>
        {options.map((s) => (
          <DropdownItem
            key={s.id}
            startContent={
              <span
                className={`w-2 h-2 rounded-full ${STATUS_STYLE[s.id]?.split(" ")[0] || "bg-mountain-300"}`}
              />
            }
            onClick={() => onChanged(appointmentId, s.id)}
          >
            {s.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PatientAppointmentsTab({
  patientId,
}: PatientAppointmentsTabProps) {
  const { clinicId } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "scheduled" | "completed" | "cancelled"
  >("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId || !clinicId) return;
    setLoading(true);
    Promise.all([
      appointmentService.getAppointmentsByClinic(clinicId),
      doctorService.getDoctorsByClinic(clinicId),
      appointmentTypeService.getAppointmentTypesByClinic(clinicId),
    ])
      .then(([all, docs, types]) => {
        const mine = all
          .filter((a) => a.patientId === patientId)
          .sort(
            (a, b) =>
              new Date(b.appointmentDate).getTime() -
              new Date(a.appointmentDate).getTime(),
          );

        setAppointments(mine);
        setDoctors(docs);
        setAppointmentTypes(types);
      })
      .catch((err) => {
        console.error(err);
        addToast({
          title: "Error",
          description: "Failed to load appointments.",
          color: "danger",
        });
      })
      .finally(() => setLoading(false));
  }, [patientId, clinicId]);

  const getDoctorName = (id: string) => {
    const d = doctors.find((x) => x.id === id);

    return d ? `Dr. ${d.name}` : "Unknown";
  };
  const getTypeName = (id: string) => {
    const t = appointmentTypes.find((x) => x.id === id);

    return t?.name || "General";
  };

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  const fmtTime = (t: string) => {
    try {
      return new Date(`1970-01-01T${t}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return t;
    }
  };

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: StatusKey,
  ) => {
    setUpdatingStatus(appointmentId);
    try {
      await appointmentService.updateAppointmentStatus(
        appointmentId,
        newStatus,
      );
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: newStatus } : a,
        ),
      );
      addToast({ title: "Status updated", color: "success" });
    } catch {
      addToast({
        title: "Error",
        description: "Failed to update status.",
        color: "danger",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filtered = appointments.filter(
    (a) => filter === "all" || a.status === filter,
  );

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === "scheduled").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const FILTERS = [
    { key: "all", label: `All (${stats.total})` },
    { key: "scheduled", label: `Scheduled (${stats.scheduled})` },
    { key: "completed", label: `Completed (${stats.completed})` },
    { key: "cancelled", label: `Cancelled (${stats.cancelled})` },
  ] as const;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Loading appointments…" size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-section-title text-mountain-900">Appointments</h2>
          <p className="text-[12.5px] text-mountain-400">
            Appointment history and schedule
          </p>
        </div>
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

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`text-[11.5px] font-medium px-3 py-1 rounded border transition-colors
              ${
                filter === f.key
                  ? "bg-teal-700 text-white border-teal-700"
                  : "bg-white text-mountain-600 border-mountain-200 hover:border-teal-400 hover:text-teal-700"
              }`}
            type="button"
            onClick={() => setFilter(f.key as any)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table / empty */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-mountain-200 rounded py-12 text-center">
          <IoCalendarOutline className="mx-auto w-10 h-10 text-mountain-300 mb-3" />
          <p className="text-[13px] font-medium text-mountain-600 mb-1">
            No appointments found
          </p>
          <p className="text-[12px] text-mountain-400 mb-4">
            {filter === "all"
              ? "No appointments scheduled yet."
              : `No ${filter} appointments.`}
          </p>
          <Link
            className="no-underline"
            to={`/dashboard/appointments/new?patientId=${patientId}`}
          >
            <Button
              color="primary"
              size="sm"
              startContent={<IoAddOutline className="w-3.5 h-3.5" />}
            >
              Schedule Appointment
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-mountain-200 rounded overflow-visible">
          <div className="overflow-visible">
            <table className="w-full">
              <thead>
                <tr className="bg-mountain-50 border-b border-mountain-100">
                  {[
                    "Date & Time",
                    "Type",
                    "Doctor",
                    "Status",
                    "Reason",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-2 px-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.06em] text-mountain-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-mountain-100">
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <p className="text-[12.5px] font-medium text-mountain-800">
                        {fmtDate(a.appointmentDate)}
                      </p>
                      {(a.startTime || a.endTime) && (
                        <p className="text-[11px] text-mountain-400">
                          {a.startTime && fmtTime(a.startTime)}
                          {a.startTime && a.endTime && " – "}
                          {a.endTime && fmtTime(a.endTime)}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[12.5px] text-mountain-700">
                      {getTypeName(a.appointmentTypeId)}
                    </td>
                    <td className="py-2.5 px-3 text-[12.5px] text-mountain-600">
                      {getDoctorName(a.doctorId)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {updatingStatus === a.id ? (
                          <Spinner size="xs" />
                        ) : (
                          <StatusDropdown
                            appointmentId={a.id}
                            current={a.status}
                            onChanged={handleStatusChange}
                          />
                        )}
                        <StatusBadge status={a.status} />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[12px] text-mountain-500 max-w-[140px] truncate">
                      {a.reason || "—"}
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        className="no-underline"
                        to={`/dashboard/appointments/${a.id}`}
                      >
                        <Button
                          color="default"
                          size="sm"
                          startContent={
                            <IoEyeOutline className="w-3.5 h-3.5" />
                          }
                          variant="bordered"
                        >
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
