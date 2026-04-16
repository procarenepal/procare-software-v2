import { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { isToday, isFuture, isPast, startOfDay, format } from "date-fns";

// Services
import {
  IoPersonOutline,
  IoCalendarOutline,
  IoMedicalOutline,
  IoWarningOutline,
  IoAlertCircleOutline,
  IoRefreshOutline,
  IoChevronForwardOutline,
  IoAddOutline,
  IoStarOutline,
  IoDocumentTextOutline,
  IoCloseOutline,
} from "react-icons/io5";

import { appointmentService } from "@/services/appointmentService";
import { patientService } from "@/services/patientService";
import { doctorService } from "@/services/doctorService";
import { appointmentTypeService } from "@/services/appointmentTypeService";
import { enquiryService } from "@/services/enquiryService";
import { branchService } from "@/services/branchService";

// Context
import { useTheme } from "@/context/ThemeContext";
import { useAuthContext } from "@/context/AuthContext";

// Types
import {
  Appointment,
  Patient,
  Doctor,
  AppointmentType,
  Enquiry,
  EnquiryStatus,
  Branch,
} from "@/types/models";

// Custom UI — zero HeroUI
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Icons

// Lazy chart components
const PatientVisitsChart = lazy(() =>
  import("./components/Charts").then((m) => ({
    default: m.PatientVisitsChart,
  })),
);
const AppointmentStatusChart = lazy(() =>
  import("./components/Charts").then((m) => ({
    default: m.AppointmentStatusChart,
  })),
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalPatients: number;
  criticalPatients: number;
  todaysAppointments: number;
  activeDoctors: number;
}

interface ChartDataType {
  patientVisits: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      fill: boolean;
      backgroundColor: string;
      borderColor: string;
      tension: number;
    }[];
  };
  appointmentStatus: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderWidth: number;
      borderColor: string;
    }[];
  };
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  confirmed: "bg-teal-100 text-teal-700",
  scheduled: "bg-sky-100 text-sky-700",
  "in-progress": "bg-saffron-100 text-saffron-700",
  completed: "bg-health-100 text-health-700",
  cancelled: "bg-red-100 text-red-600",
  default: "bg-mountain-100 text-mountain-600",
};

const ENQUIRY_BADGE: Record<string, string> = {
  new: "bg-teal-100 text-teal-700",
  contacted: "bg-saffron-100 text-saffron-700",
  scheduled: "bg-sky-100 text-sky-700",
  converted: "bg-health-100 text-health-700",
  closed: "bg-mountain-100 text-mountain-500",
};

function statusBadge(status: string) {
  return STATUS_BADGE[status] ?? STATUS_BADGE.default;
}
function enquiryBadge(status: string) {
  return ENQUIRY_BADGE[status] ?? STATUS_BADGE.default;
}

// ── Micro components ──────────────────────────────────────────────────────────

/** Clinic Clarity stat card */
interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  iconBg?: string;
  href: string;
  alert?: boolean;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg = "bg-teal-100 text-teal-700",
  href,
  alert,
}: StatCardProps) {
  return (
    <Link className="block group no-underline" to={href}>
      <div className="bg-white border border-mountain-200 rounded p-3 hover:border-teal-300 transition-colors duration-100">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/* Label — section-label style from spec */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-mountain-400 mb-1">
              {label}
            </p>
            {/* KPI value — 22px/700 from spec */}
            <p
              className={`text-stat-sm leading-none ${alert ? "text-red-600" : "text-mountain-900"}`}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {sub && <p className="text-[11px] text-mountain-400 mt-1">{sub}</p>}
          </div>
          <div
            className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${iconBg}`}
          >
            {icon}
          </div>
        </div>
        {/* Bottom accent line */}
        <div className="mt-3 flex items-center gap-1 text-[11px] text-mountain-400 group-hover:text-teal-600 transition-colors">
          <span>View details</span>
          <IoChevronForwardOutline className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}

/** Inline tab strip — custom, replaces HeroUI Tabs */
interface TabStripProps {
  tabs: { key: string; label: string; count?: number }[];
  selected: string;
  onChange: (key: string) => void;
}

function TabStrip({ tabs, selected, onChange }: TabStripProps) {
  return (
    <div className="flex gap-1 border-b border-mountain-100 mb-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-75 border-b-2 -mb-px ${
            selected === t.key
              ? "border-teal-700 text-teal-700"
              : "border-transparent text-mountain-500 hover:text-mountain-800"
          }`}
          type="button"
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                selected === t.key
                  ? "bg-teal-100 text-teal-700"
                  : "bg-mountain-100 text-mountain-500"
              }`}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Section card header row */
function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-mountain-100">
      <p className="text-[12.5px] font-semibold text-mountain-900">{title}</p>
      <Link
        className="text-[11px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5 no-underline"
        to={href}
      >
        View all <IoChevronForwardOutline className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardIndexPage() {
  const { isDark } = useTheme();
  const { clinicId, userData, branchId } = useAuthContext();
  const isClinicAdmin =
    userData?.role === "clinic-super-admin" ||
    userData?.role === "clinic-admin";

  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    criticalPatients: 0,
    todaysAppointments: 0,
    activeDoctors: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>(
    [],
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(
    [],
  );
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const [apptTab, setApptTab] = useState("today");
  const [enquiryTab, setEnquiryTab] = useState<EnquiryStatus | "all">("new");

  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    // Only show once per user based on localStorage
    if (!localStorage.getItem("uiAnnouncementSeen")) {
      setShowAnnouncement(true);
    }
  }, []);

  const mainBranchId = branches.find((b) => b.isMainBranch)?.id ?? null;
  const effectiveBranchId =
    branchId ??
    (mainBranchId && selectedBranchId === mainBranchId
      ? undefined
      : (selectedBranchId ?? undefined));

  const closeAnnouncement = () => {
    localStorage.setItem("uiAnnouncementSeen", "true");
    setShowAnnouncement(false);
  };

  // ── Filters ───────────────────────────────────────────────────────────────
  const todayAppts = recentAppointments.filter((a) =>
    isToday(a.appointmentDate),
  );
  const upcomingAppts = recentAppointments.filter((a) =>
    isFuture(startOfDay(a.appointmentDate)),
  );
  const pastAppts = recentAppointments.filter(
    (a) => isPast(startOfDay(a.appointmentDate)) && !isToday(a.appointmentDate),
  );

  const filteredAppts =
    apptTab === "today"
      ? todayAppts
      : apptTab === "upcoming"
        ? upcomingAppts
        : apptTab === "past"
          ? pastAppts
          : recentAppointments.slice(0, 6);

  const filteredEnquiries =
    enquiryTab === "all"
      ? enquiries
      : enquiries.filter((e) => e.status === enquiryTab);

  const enquiryCount = (s: string) =>
    s === "all"
      ? enquiries.length
      : enquiries.filter((e) => e.status === s).length;

  // ── Branch list for clinic-wide admins (no fixed branchId) ────────────────
  useEffect(() => {
    if (!clinicId) return;
    if (!isClinicAdmin || branchId) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await branchService.getClinicBranches(clinicId, true);

        if (cancelled) return;
        setBranches(data);
        if (data.length > 0) {
          // Ordered by isMainBranch desc in service; first entry is main branch
          setSelectedBranchId((prev) => prev ?? data[0].id);
        } else {
          setSelectedBranchId(null);
        }
      } catch (err) {
        console.error("Dashboard branches fetch error:", err);
        if (!cancelled) {
          setBranches([]);
          setSelectedBranchId(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clinicId, isClinicAdmin, branchId]);

  // ── Data fetch (all in parallel to avoid waterfall) ────────────────────────
  useEffect(() => {
    if (!clinicId) return;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const branchScopedId = effectiveBranchId;
        const [allPatients, allDoctors, allAppTypes, allAppts, allEnquiries] =
          await Promise.all([
            patientService.getPatientsByClinic(clinicId, branchScopedId),
            doctorService.getDoctorsByClinic(clinicId, branchScopedId),
            appointmentTypeService.getAppointmentTypesByClinic(
              clinicId,
              branchScopedId,
            ),
            appointmentService.getAppointmentsByClinic(
              clinicId,
              branchScopedId,
            ),
            enquiryService.getEnquiries(clinicId, branchScopedId, {
              dateField: "createdAt",
            }),
          ]);

        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
        );
        const todayCount = allAppts.filter((a) => {
          const t = new Date(a.appointmentDate);

          return t >= start && t <= end;
        }).length;

        setPatients(allPatients);
        setDoctors(allDoctors);
        setAppointmentTypes(allAppTypes);
        setAppointments(allAppts);
        setEnquiries(allEnquiries.slice(0, 20));
        setRecentAppointments(
          allAppts
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .slice(0, 10),
        );
        setStats({
          totalPatients: allPatients.length,
          criticalPatients: allPatients.filter((p) => p.isCritical).length,
          todaysAppointments: todayCount,
          activeDoctors: allDoctors.filter((d) => d.isActive).length,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clinicId, effectiveBranchId]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const getChartData = (): ChartDataType => {
    const primaryColor = isDark ? "#2dd4bf" : "#0f766e";
    const secondaryColor = isDark ? "#4ade80" : "#16a34a";
    const warningColor = isDark ? "#fbbf24" : "#d97706";
    const dangerColor = isDark ? "#f87171" : "#e11d48";

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const cur = new Date();
    const months: string[] = [];
    const visitData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const mo = new Date(cur.getFullYear(), cur.getMonth() - i, 1);
      const end = new Date(
        cur.getFullYear(),
        cur.getMonth() - i + 1,
        0,
        23,
        59,
        59,
        999,
      );

      months.push(monthNames[mo.getMonth()]);
      visitData.push(
        patients.filter((p) => {
          const d = new Date(p.createdAt);

          return d >= mo && d <= end;
        }).length,
      );
    }

    const counts = {
      confirmed: 0,
      scheduled: 0,
      "in-progress": 0,
      completed: 0,
      cancelled: 0,
    };

    appointments.forEach((a) => {
      if (a.status in counts) (counts as any)[a.status]++;
    });

    return {
      patientVisits: {
        labels: months,
        datasets: [
          {
            label: "Patient Registrations",
            data: visitData,
            fill: false,
            backgroundColor: primaryColor,
            borderColor: primaryColor,
            tension: 0.3,
          },
        ],
      },
      appointmentStatus: {
        labels: [
          "Confirmed",
          "Scheduled",
          "In Progress",
          "Completed",
          "Cancelled",
        ],
        datasets: [
          {
            label: "Appointments",
            data: [
              counts.confirmed,
              counts.scheduled,
              counts["in-progress"],
              counts.completed,
              counts.cancelled,
            ],
            backgroundColor: [
              secondaryColor,
              primaryColor,
              warningColor,
              "#8b5cf6",
              dangerColor,
            ],
            borderWidth: 2,
            borderColor: isDark ? "#18181b" : "#ffffff",
          },
        ],
      },
    };
  };

  const chartData = getChartData();

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: isDark ? "#e2e8f0" : "#475569",
          boxWidth: 10,
          padding: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: isDark ? "#94a3b8" : "#64748b", font: { size: 11 } },
        grid: { color: isDark ? "#27272a" : "#f1f5f9" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: isDark ? "#94a3b8" : "#64748b", font: { size: 11 } },
        grid: { color: isDark ? "#27272a" : "#f1f5f9" },
      },
    },
  };

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: isDark ? "#e2e8f0" : "#475569",
          boxWidth: 10,
          padding: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: { label: (c: any) => `${c.label}: ${c.parsed} appts` },
      },
    },
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime12 = (t24: string): string => {
    if (!t24) return "—";
    const [h, m] = t24.split(":").map(Number);

    return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };

  const apptTypeName = (id: string) =>
    appointmentTypes.find((t) => t.id === id)?.name ?? "General";

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Spinner label="Loading dashboard…" size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-3">
        <IoAlertCircleOutline className="w-8 h-8 text-red-400" />
        <p className="text-sm text-mountain-600">{error}</p>
        <Button
          color="primary"
          size="sm"
          startContent={<IoRefreshOutline />}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* ── Page header — spec: clarity-page-header pattern ────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          {/* spec: page title 15px/700/-0.02em */}
          <h1 className="text-page-title text-mountain-900 leading-tight">
            Dashboard
          </h1>
          {/* spec: body 13px/400 */}
          <p className="text-[13px] text-mountain-400 mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Branch selector (clinic admins without fixed branch) + Quick actions */}
        <div className="flex flex-wrap gap-2 items-center">
          {!branchId && isClinicAdmin && branches.length > 0 && (
            <div className="flex items-center gap-1 mr-2">
              <span className="text-[11px] text-mountain-500">Branch</span>
              <select
                className="h-8 px-2.5 py-0 text-[12px] border border-mountain-200 rounded bg-white text-mountain-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                value={selectedBranchId ?? ""}
                onChange={(e) => setSelectedBranchId(e.target.value || null)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.isMainBranch ? " (all branches)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick actions — spec: clarity-btn compact */}
          <Link className="no-underline" to="/dashboard/appointments/new">
            <Button
              color="primary"
              size="sm"
              startContent={<IoAddOutline className="w-3.5 h-3.5" />}
            >
              New Appointment
            </Button>
          </Link>
          <Link className="no-underline" to="/dashboard/patients/new">
            <Button
              color="primary"
              size="sm"
              startContent={<IoPersonOutline className="w-3.5 h-3.5" />}
              variant="bordered"
            >
              New Patient
            </Button>
          </Link>
          <Link className="no-underline" to="/dashboard/daily-report">
            <Button
              color="default"
              size="sm"
              startContent={<IoDocumentTextOutline className="w-3.5 h-3.5" />}
              variant="bordered"
            >
              Daily Report
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI stat cards — 4-col grid ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          href="/dashboard/patients"
          icon={<IoPersonOutline className="w-4 h-4" />}
          iconBg="bg-teal-100 text-teal-700"
          label="Total Patients"
          sub="All registered"
          value={stats.totalPatients}
        />
        <StatCard
          alert={stats.criticalPatients > 0}
          href="/dashboard/patients"
          icon={<IoWarningOutline className="w-4 h-4" />}
          iconBg="bg-red-100 text-red-600"
          label="Critical Patients"
          sub="Need attention"
          value={stats.criticalPatients}
        />
        <StatCard
          href="/dashboard/appointments"
          icon={<IoCalendarOutline className="w-4 h-4" />}
          iconBg="bg-sky-100 text-sky-600"
          label="Today's Appointments"
          sub="Scheduled today"
          value={stats.todaysAppointments}
        />
        <StatCard
          href="/dashboard/doctors"
          icon={<IoMedicalOutline className="w-4 h-4" />}
          iconBg="bg-health-100 text-health-700"
          label="Active Doctors"
          sub="Currently available"
          value={stats.activeDoctors}
        />
      </div>

      {/* ── Row 2: Patient visits chart + Appointments list ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Patient visits (line chart) */}
        <div className="bg-white border border-mountain-200 rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-mountain-100">
            {/* spec: section label 11px/600/uppercase */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-mountain-400">
              Patient Registrations
            </p>
            <p className="text-[12.5px] font-semibold text-mountain-900 mt-0.5">
              Last 6 months
            </p>
          </div>
          <div className="p-3 h-[220px]">
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center">
                  <Spinner label="Loading chart…" size="sm" />
                </div>
              }
            >
              <PatientVisitsChart
                data={chartData.patientVisits}
                options={chartOpts}
              />
            </Suspense>
          </div>
        </div>

        {/* Appointments tabbed list */}
        <div className="bg-white border border-mountain-200 rounded overflow-hidden flex flex-col">
          <SectionHeader href="/dashboard/appointments" title="Appointments" />

          <div className="px-3 pt-2">
            <TabStrip
              selected={apptTab}
              tabs={[
                { key: "today", label: "Today", count: todayAppts.length },
                {
                  key: "upcoming",
                  label: "Upcoming",
                  count: upcomingAppts.length,
                },
                { key: "past", label: "Past", count: pastAppts.length },
              ]}
              onChange={setApptTab}
            />
          </div>

          <div
            className="flex-1 overflow-y-auto px-1 pb-2"
            style={{ maxHeight: "234px" }}
          >
            {filteredAppts.length === 0 ? (
              <div className="py-8 text-center">
                <IoCalendarOutline className="w-6 h-6 mx-auto mb-1.5 text-mountain-300" />
                <p className="text-[12px] text-mountain-400">No appointments</p>
              </div>
            ) : (
              filteredAppts.slice(0, 6).map((appt) => {
                const doctor = doctors.find((d) => d.id === appt.doctorId);
                const patient = patients.find((p) => p.id === appt.patientId);

                return (
                  <div
                    key={appt.id}
                    className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        className="text-[12.5px] font-medium text-mountain-900 hover:text-teal-700 truncate block no-underline"
                        to={`/dashboard/patients/${patient?.id}`}
                      >
                        {patient?.name ?? "Unknown Patient"}
                      </Link>
                      <p className="text-[11px] text-mountain-400 truncate">
                        Dr. {doctor?.name ?? "Unknown"} ·{" "}
                        {apptTypeName(appt.appointmentTypeId)} ·{" "}
                        {formatTime12(appt.startTime ?? "")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded ${statusBadge(appt.status)}`}
                    >
                      {appt.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Status doughnut + Enquiries ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Appointment status breakdown (doughnut) — 2/3 width */}
        <div className="lg:col-span-2 bg-white border border-mountain-200 rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-mountain-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-mountain-400">
              Status Breakdown
            </p>
            <p className="text-[12.5px] font-semibold text-mountain-900 mt-0.5">
              Appointment distribution
            </p>
          </div>
          <div className="p-3 h-[220px]">
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center">
                  <Spinner label="Loading chart…" size="sm" />
                </div>
              }
            >
              <AppointmentStatusChart
                data={chartData.appointmentStatus}
                options={doughnutOpts}
              />
            </Suspense>
          </div>
        </div>

        {/* Enquiries — 1/3 width */}
        <div className="bg-white border border-mountain-200 rounded overflow-hidden flex flex-col">
          <SectionHeader href="/dashboard/enquiries" title="Enquiries" />

          <div className="px-3 pt-2">
            <TabStrip
              selected={enquiryTab}
              tabs={[
                { key: "new", label: "New", count: enquiryCount("new") },
                {
                  key: "contacted",
                  label: "Contacted",
                  count: enquiryCount("contacted"),
                },
                {
                  key: "converted",
                  label: "Done",
                  count: enquiryCount("converted"),
                },
                { key: "all", label: "All", count: enquiryCount("all") },
              ]}
              onChange={(v) => setEnquiryTab(v as EnquiryStatus | "all")}
            />
          </div>

          <div
            className="flex-1 overflow-y-auto px-1 pb-2"
            style={{ maxHeight: "234px" }}
          >
            {filteredEnquiries.length === 0 ? (
              <div className="py-8 text-center">
                <IoStarOutline className="w-6 h-6 mx-auto mb-1.5 text-mountain-300" />
                <p className="text-[12px] text-mountain-400">No enquiries</p>
              </div>
            ) : (
              filteredEnquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-mountain-900 truncate">
                      {enq.fullName}
                    </p>
                    <p className="text-[11px] text-mountain-400 truncate">
                      {enq.phone}
                      {enq.source ? ` · ${enq.source}` : ""} ·{" "}
                      {enq.createdAt
                        ? format(new Date(enq.createdAt), "MMM dd")
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded ${enquiryBadge(enq.status)}`}
                  >
                    {enq.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAnnouncement && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 overflow-hidden"
          onClick={closeAnnouncement}
        >
          <div
            className="bg-white border border-mountain-200 rounded max-w-md w-full flex flex-col shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-4 py-3 border-b border-mountain-100 bg-gradient-to-r from-teal-50 to-white">
              <h3 className="text-[15px] font-semibold text-teal-900 flex items-center gap-2">
                <IoStarOutline className="text-teal-600" /> UI Update
                Announcement
              </h3>
              <button
                className="text-mountain-400 hover:text-mountain-700"
                type="button"
                onClick={closeAnnouncement}
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 text-[13.5px] text-mountain-800 space-y-3">
              <p className="text-[15px]">
                <strong>Gradual release of All new UI</strong>
              </p>
              <p className="text-mountain-600 text-[13px]">
                We are excited to announce a refresh to our interface! You will
                start seeing a more modern, cleaner, and faster experience
                across different parts of our application as we roll out these
                changes.
              </p>
            </div>
            <div className="flex justify-end px-4 py-3 border-t border-mountain-100 bg-mountain-50">
              <Button color="primary" size="sm" onClick={closeAnnouncement}>
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
