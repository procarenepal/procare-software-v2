import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  format,
  parseISO,
  isToday,
  isFuture,
  isPast,
  startOfDay,
  startOfMonth,
} from "date-fns";
import {
  IoSearchOutline,
  IoCloseOutline,
  IoChevronBack,
  IoChevronForward,
  IoRefreshOutline,
  IoEllipsisVertical,
  IoListOutline,
  IoGridOutline,
  IoAddOutline,
  IoTrashOutline,
  IoWarningOutline,
  IoDownloadOutline,
  IoCalendarOutline,
  IoEyeOutline,
  IoPencilOutline,
  IoPersonOutline,
} from "react-icons/io5";

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
import { appointmentService } from "@/services/appointmentService";
import { patientService } from "@/services/patientService";
import { doctorService } from "@/services/doctorService";
import { appointmentTypeService } from "@/services/appointmentTypeService";
import { branchService } from "@/services/branchService";
import {
  Appointment,
  Patient,
  Doctor,
  AppointmentType,
  Branch,
} from "@/types/models";
import {
  getBlinkingCssClass,
  getAppointmentColorById,
} from "@/utils/appointmentColors";

// Status color helper
const getStatusColorCls = (status: string) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-health-100 text-health-700 border-health-200";
    case "scheduled":
      return "bg-teal-100 text-teal-700 border-teal-200";
    case "in-progress":
      return "bg-saffron-100 text-saffron-700 border-saffron-200";
    case "completed":
      return "bg-health-100 text-health-700 border-health-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    case "no-show":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-mountain-100 text-mountain-600 border-mountain-200";
  }
};

const Avatar = ({ name }: { name: string }) => {
  const initials =
    name
      .replace(/[^A-Za-z ]/g, "")
      .split(" ")
      .filter((x) => x)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="w-8 h-8 rounded border border-mountain-200 bg-white text-mountain-600 flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm">
      {initials}
    </div>
  );
};

function Pagination({
  total,
  page,
  onChange,
}: {
  total: number;
  page: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center gap-1.5">
      <button
        aria-label="Previous page"
        className="w-9 h-9 flex items-center justify-center rounded border border-mountain-300 text-mountain-600 hover:bg-mountain-50 hover:text-teal-700 hover:border-teal-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        disabled={page === 1}
        onClick={() => onChange(Math.max(1, page - 1))}
      >
        <IoChevronBack className="w-5 h-5" />
      </button>
      <span className="text-[13px] font-medium text-mountain-700 px-3">
        Page {page} of {total}
      </span>
      <button
        aria-label="Next page"
        className="w-9 h-9 flex items-center justify-center rounded border border-mountain-300 text-mountain-600 hover:bg-mountain-50 hover:text-teal-700 hover:border-teal-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        disabled={page === total}
        onClick={() => onChange(Math.min(total, page + 1))}
      >
        <IoChevronForward className="w-5 h-5" />
      </button>
    </div>
  );
}

function CustomModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  isDanger = false,
}: any) {
  if (!isOpen) return null;
  const bodyEl =
    document.getElementById("dashboard-scroll-container") || document.body;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-mountain-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-white rounded border border-mountain-200 shadow-xl max-w-md w-full mx-4 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`px-5 py-4 border-b border-mountain-100 flex justify-between items-center ${isDanger ? "bg-red-50/50" : "bg-mountain-50/50"}`}
        >
          <h3
            className={`font-semibold text-[15px] flex items-center gap-2 ${isDanger ? "text-red-700" : "text-mountain-900"}`}
          >
            {isDanger ? <IoWarningOutline className="w-5 h-5" /> : null}
            {title}
          </h3>
          <button
            className="text-mountain-400 hover:text-mountain-700"
            onClick={onClose}
          >
            <IoCloseOutline className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 text-[14px] text-mountain-700 text-left">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-3 border-t border-mountain-100 bg-mountain-50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    bodyEl,
  );
}

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const { clinicId, userData, branchId } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);

  // Hover and status change state
  const [hoveredAppointment, setHoveredAppointment] = useState<string | null>(
    null,
  );
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Layout state
  const [layoutType, setLayoutType] = useState<"tabbed" | "table">("tabbed");
  const [selectedTab, setSelectedTab] = useState("today");

  // Data state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(
    [],
  );
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const itemsPerPage = 6;

  const isClinicAdmin =
    userData?.role === "clinic-admin" ||
    userData?.role === "clinic-super-admin" ||
    userData?.role === "super-admin";

  const mainBranchId = branches.find((b) => b.isMainBranch)?.id ?? null;
  const effectiveBranchId =
    branchId ??
    (mainBranchId && selectedBranchId === mainBranchId
      ? undefined
      : (selectedBranchId ?? undefined));

  // Load branches for clinic-wide admins (no fixed branchId)
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
        console.error("Appointments branches fetch error:", err);
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

  // Load static supporting data
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (!clinicId || !userData) return;
      setError(null);
      try {
        const userRole = userData.role;
        const isAdmin =
          userRole === "clinic-admin" ||
          userRole === "clinic-super-admin" ||
          userRole === "super-admin";
        let doctorId: string | null = null;

        if (!isAdmin && userData.email) {
          try {
            const matchingDoctor = await doctorService.getDoctorByEmail(
              clinicId,
              userData.email,
            );

            if (matchingDoctor) {
              doctorId = matchingDoctor.id;
              setCurrentDoctorId(doctorId);
            }
          } catch (error) {
            console.error("Error checking doctor linkage:", error);
          }
        } else {
          setCurrentDoctorId(null);
        }

        const [patientsData, doctorsData, appointmentTypesData] =
          await Promise.all([
            doctorId
              ? patientService.getPatientsByDoctor(
                  clinicId,
                  doctorId,
                  effectiveBranchId,
                )
              : patientService.getPatientsByClinic(clinicId, effectiveBranchId),
            doctorService.getDoctorsByClinic(clinicId, effectiveBranchId),
            appointmentTypeService.getAppointmentTypesByClinic(
              clinicId,
              effectiveBranchId,
            ),
          ]);

        if (!cancelled) {
          setPatients(patientsData);
          setDoctors(doctorsData);
          setAppointmentTypes(appointmentTypesData);
        }
      } catch (err) {
        console.error("Error loading appointments data:", err);
        setError("Failed to load appointments data. Please try again.");
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [clinicId, userData?.email, effectiveBranchId]);

  // Live sync
  useEffect(() => {
    if (!clinicId) return;
    let isActive = true;

    setLoading(true);

    const handleSnapshot = (data: Appointment[]) => {
      if (!isActive) return;
      setAppointments(data);
      setError(null);
      setLoading(false);
    };
    const handleError = (err: Error) => {
      if (!isActive) return;
      console.error("Appointment subscription error:", err);
      setError("Failed to load live appointments.");
      setLoading(false);
    };

    const unsubscribe = currentDoctorId
      ? appointmentService.subscribeToDoctorAppointments(
          currentDoctorId,
          effectiveBranchId,
          handleSnapshot,
          handleError,
        )
      : appointmentService.subscribeToClinicAppointments(
          clinicId,
          effectiveBranchId,
          handleSnapshot,
          handleError,
        );

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [clinicId, currentDoctorId, effectiveBranchId]);

  const getPatientNameById = (patientId: string) =>
    patients.find((p) => p.id === patientId)?.name || "Unknown Patient";
  const getPatientRegNumberById = (patientId: string) =>
    patients.find((p) => p.id === patientId)?.regNumber || "N/A";
  const getDoctorNameById = (doctorId: string) =>
    doctors.find((d) => d.id === doctorId)?.name || "Unknown Doctor";
  const getDoctorSpecialityById = (doctorId: string) =>
    doctors.find((d) => d.id === doctorId)?.speciality || "Unknown Speciality";
  const getAppointmentTypeNameById = (appointmentTypeId: string) =>
    appointmentTypes.find((at) => at.id === appointmentTypeId)?.name ||
    "General";

  const formatTimeTo12Hour = (time24: string): string => {
    if (!time24) return "Time not set";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${ampm}`;
  };

  const statusOptions = [
    { id: "all", name: "All Status" },
    { id: "scheduled", name: "Scheduled" },
    { id: "confirmed", name: "Confirmed" },
    { id: "in-progress", name: "In Progress" },
    { id: "completed", name: "Completed" },
    { id: "cancelled", name: "Cancelled" },
    { id: "no-show", name: "No Show" },
  ];

  const getTodayAppointments = () =>
    appointments.filter((appt) => isToday(appt.appointmentDate));
  const getUpcomingAppointments = () =>
    appointments.filter((appt) => isFuture(startOfDay(appt.appointmentDate)));
  const getPastAppointments = () => {
    const monthStart = startOfMonth(new Date());

    return appointments.filter((appt) => {
      const d = startOfDay(appt.appointmentDate);

      return isPast(d) && !isToday(d) && d >= monthStart;
    });
  };

  const formatAppointmentTime = (appointment: Appointment) => {
    const date = format(appointment.appointmentDate, "MMM dd, yyyy");
    let time = "Time not set";

    if (appointment.startTime && appointment.endTime) {
      time = `${formatTimeTo12Hour(appointment.startTime)} - ${formatTimeTo12Hour(appointment.endTime)}`;
    } else if (appointment.startTime) {
      time = formatTimeTo12Hour(appointment.startTime);
    }

    return { date, time };
  };

  const handleStatusChange = async (appointmentId: string, newStatus: any) => {
    setUpdatingStatus(appointmentId);
    try {
      await appointmentService.updateAppointmentStatus(
        appointmentId,
        newStatus,
      );
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointmentId ? { ...appt, status: newStatus } : appt,
        ),
      );
      addToast({
        title: "Status Updated",
        description: `Appointment has been ${newStatus.toLowerCase()}.`,
        color: "success",
      });
    } catch (err) {
      console.error("Error updating appointment status:", err);
      addToast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
        color: "danger",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusOptions = (currentStatus: string) =>
    statusOptions.filter(
      (s) => s.id !== "all" && s.id !== currentStatus.toLowerCase(),
    );

  const getBaseAppointments = () => {
    if (layoutType === "tabbed") {
      switch (selectedTab) {
        case "today":
          return getTodayAppointments();
        case "upcoming":
          return getUpcomingAppointments();
        case "past":
          return getPastAppointments();
        default:
          return appointments;
      }
    }

    return appointments;
  };

  const filteredAppointments = getBaseAppointments().filter((appt) => {
    const patientName = getPatientNameById(appt.patientId);
    const doctorName = getDoctorNameById(appt.doctorId);
    const matchesSearch =
      patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appt.reason &&
        appt.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (appt.appointmentTypeId &&
        getAppointmentTypeNameById(appt.appointmentTypeId)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));
    const matchesStatus =
      selectedStatus === "all" ||
      appt.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesDoctor =
      selectedDoctor === "all" || appt.doctorId === selectedDoctor;
    const matchesDate =
      layoutType === "tabbed" ||
      !selectedDate ||
      format(appt.appointmentDate, "yyyy-MM-dd") ===
        format(selectedDate, "yyyy-MM-dd");

    return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(a.appointmentDate);
    const dateB = new Date(b.appointmentDate);

    if (dateA.getTime() === dateB.getTime()) {
      if (a.startTime && b.startTime)
        return a.startTime.localeCompare(b.startTime);
    }

    return dateA.getTime() - dateB.getTime();
  });

  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    sortedAppointments.length,
  );
  const currentAppointments = sortedAppointments.slice(startIndex, endIndex);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    setIsCancelling(true);
    try {
      await appointmentService.updateAppointmentStatus(
        selectedAppointment.id,
        "cancelled",
      );
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === selectedAppointment.id
            ? { ...appt, status: "cancelled" }
            : appt,
        ),
      );
      addToast({
        title: "Appointment Cancelled",
        description: `The appointment has been cancelled.`,
        color: "success",
      });
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      addToast({
        title: "Error",
        description: "Failed to cancel the appointment.",
        color: "danger",
      });
    } finally {
      setIsCancelling(false);
      setSelectedAppointment(null);
      setIsCancelModalOpen(false);
    }
  };

  const renderAppointmentsList = (appointmentsToRender: Appointment[]) => {
    if (appointmentsToRender.length === 0) {
      return (
        <div className="py-12 text-center flex flex-col items-center">
          <IoCalendarOutline className="w-12 h-12 text-mountain-300 mb-3" />
          <p className="mt-2 text-[14.5px] font-medium text-mountain-800">
            No appointments found
          </p>
          <p className="text-[13px] text-mountain-500 mb-4">
            You have no appointments scheduled for this period.
          </p>
          <Link to="/dashboard/appointments/new">
            <Button color="primary" startContent={<IoAddOutline />}>
              Schedule Appointment
            </Button>
          </Link>
        </div>
      );
    }

    if (layoutType === "tabbed") {
      return (
        <div className="space-y-3">
          {appointmentsToRender.map((appointment) => {
            const patientName = getPatientNameById(appointment.patientId);
            const doctorName = getDoctorNameById(appointment.doctorId);
            const { date, time } = formatAppointmentTime(appointment);
            const apptTypeColor = appointmentTypes.find(
              (at) => at.id === appointment.appointmentTypeId,
            )?.color;

            return (
              <div
                key={appointment.id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-mountain-200 rounded shadow-sm hover:border-teal-300 transition-colors relative group ${getBlinkingCssClass(apptTypeColor)}`}
                onMouseEnter={() => setHoveredAppointment(appointment.id)}
                onMouseLeave={() => setHoveredAppointment(null)}
              >
                <div className="flex items-start md:items-center flex-1 gap-4">
                  <Avatar name={patientName} />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 w-full">
                    <div>
                      <p className="text-[13.5px] font-semibold text-mountain-900 leading-none mb-1">
                        {patientName}
                      </p>
                      <p className="text-[11.5px] font-medium text-mountain-500">
                        Reg #{getPatientRegNumberById(appointment.patientId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-mountain-800 leading-none mb-1">
                        Dr. {doctorName}
                      </p>
                      <p className="text-[11.5px] text-mountain-500">
                        {getDoctorSpecialityById(appointment.doctorId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-mountain-800 leading-none mb-1">
                        {date}
                      </p>
                      <p className="text-[11.5px] text-mountain-500">{time}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {apptTypeColor && apptTypeColor !== "none" && (
                          <div
                            className="w-2.5 h-2.5 rounded-full border border-mountain-300 shrink-0"
                            style={{
                              backgroundColor:
                                getAppointmentColorById(apptTypeColor)
                                  .lightColor,
                            }}
                          />
                        )}
                        <p className="text-[13px] font-medium text-mountain-800 leading-none truncate">
                          {getAppointmentTypeNameById(
                            appointment.appointmentTypeId,
                          )}
                        </p>
                      </div>
                      <p className="text-[11.5px] text-mountain-500 truncate">
                        {appointment.reason || appointment.notes || "No reason"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0 ml-0 md:ml-4 self-end md:self-auto border-t md:border-t-0 border-mountain-100 pt-3 md:pt-0 w-full md:w-auto">
                  <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                      <button
                        className={`text-[11px] font-medium px-2 py-1 rounded border flex items-center gap-1 transition-colors ${getStatusColorCls(appointment.status)} outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1`}
                        disabled={updatingStatus === appointment.id}
                        type="button"
                      >
                        {updatingStatus === appointment.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <IoRefreshOutline className="w-3.5 h-3.5" />
                        )}
                        {appointment.status || "Change"}
                      </button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      {getStatusOptions(appointment.status).map((status) => (
                        <DropdownItem
                          key={status.id}
                          onClick={() =>
                            handleStatusChange(appointment.id, status.id)
                          }
                        >
                          <span className="capitalize text-[13px]">
                            {status.name}
                          </span>
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>

                  <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                      <button className="p-1.5 text-mountain-500 hover:text-mountain-900 border border-transparent hover:border-mountain-200 rounded transition flex items-center justify-center">
                        <IoEllipsisVertical className="w-4 h-4" />
                      </button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="view"
                        onClick={() =>
                          navigate(`/dashboard/appointments/${appointment.id}`)
                        }
                      >
                        <span className="flex items-center gap-2">
                          <IoEyeOutline className="text-mountain-400" /> View
                          Details
                        </span>
                      </DropdownItem>
                      {appointment.status.toLowerCase() !== "cancelled" &&
                      appointment.status.toLowerCase() !== "completed" ? (
                        <DropdownItem
                          key="edit"
                          onClick={() =>
                            navigate(
                              `/dashboard/appointments/${appointment.id}/edit`,
                            )
                          }
                        >
                          <span className="flex items-center gap-2">
                            <IoPencilOutline className="text-mountain-400" />{" "}
                            Edit
                          </span>
                        </DropdownItem>
                      ) : null}
                      <DropdownItem
                        key="patient"
                        onClick={() =>
                          navigate(
                            `/dashboard/patients/${appointment.patientId}`,
                          )
                        }
                      >
                        <span className="flex items-center gap-2">
                          <IoPersonOutline className="text-mountain-400" />{" "}
                          Patient Profile
                        </span>
                      </DropdownItem>
                      {appointment.status.toLowerCase() !== "cancelled" &&
                      appointment.status.toLowerCase() !== "completed" ? (
                        <DropdownItem
                          key="cancel"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsCancelModalOpen(true);
                          }}
                        >
                          <span className="flex items-center gap-2 text-red-600">
                            <IoTrashOutline className="text-red-500" /> Cancel
                            Appt
                          </span>
                        </DropdownItem>
                      ) : null}
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={title({ size: "sm" })}>
            Appointments
            {currentDoctorId && (
              <span className="ml-3 text-[11px] font-semibold tracking-wider text-teal-700 bg-teal-100 uppercase px-2 py-0.5 rounded border border-teal-200">
                Doctor View
              </span>
            )}
          </h1>
          <p className="text-[13.5px] text-mountain-500 mt-1">
            {currentDoctorId
              ? "Manage your assigned patient appointments"
              : "Manage patient appointments"}
          </p>
        </div>
        <div className="flex gap-3 items-center">
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
          <div className="flex p-0.5 bg-mountain-100 rounded border border-mountain-200 shadow-inner">
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] font-medium transition ${layoutType === "tabbed" ? "bg-white text-teal-700 shadow-sm" : "text-mountain-600 hover:text-mountain-900"}`}
              type="button"
              onClick={() => setLayoutType("tabbed")}
            >
              <IoListOutline className="w-4 h-4" /> Tabs
            </button>
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] font-medium transition ${layoutType === "table" ? "bg-white text-teal-700 shadow-sm" : "text-mountain-600 hover:text-mountain-900"}`}
              type="button"
              onClick={() => setLayoutType("table")}
            >
              <IoGridOutline className="w-4 h-4" /> Table
            </button>
          </div>
          <Link to="/dashboard/appointments/new">
            <Button
              color="primary"
              startContent={<IoAddOutline className="w-4 h-4" />}
            >
              New
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-mountain-200 rounded shadow-sm">
        <div className="p-4 border-b border-mountain-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:flex-1 relative">
            <IoSearchOutline className="w-4 h-4 text-mountain-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              className="w-full pl-9 pr-3 py-1.5 h-[34px] border border-mountain-200 rounded text-[13px] text-mountain-800 placeholder:text-mountain-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-shadow"
              placeholder="Search appointments..."
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-mountain-400 hover:text-mountain-700"
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
              >
                <IoCloseOutline className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
            <select
              className="h-[34px] bg-white border border-mountain-200 text-mountain-700 text-[12.5px] rounded px-3 py-1 outline-none focus:border-teal-500 cursor-pointer min-w-[130px]"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              {statusOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="h-[34px] bg-white border border-mountain-200 text-mountain-700 text-[12.5px] rounded px-3 py-1 outline-none focus:border-teal-500 cursor-pointer max-w-[160px]"
              value={selectedDoctor}
              onChange={(e) => {
                setSelectedDoctor(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {layoutType === "table" && (
              <input
                className="h-[34px] bg-white border border-mountain-200 text-mountain-700 text-[12.5px] rounded px-3 py-1 outline-none focus:border-teal-500 cursor-pointer"
                type="date"
                value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  setSelectedDate(
                    e.target.value ? parseISO(e.target.value) : null,
                  );
                  setCurrentPage(1);
                }}
              />
            )}
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button
                  className="h-[34px] px-3 bg-white border border-mountain-200 text-mountain-700 text-[12.5px] font-medium rounded hover:bg-mountain-50 transition-colors flex items-center gap-1.5 outline-none focus:ring-2 ring-teal-500 ring-offset-1"
                  type="button"
                >
                  <IoDownloadOutline className="w-4 h-4" /> Export
                </button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="csv">Export CSV</DropdownItem>
                <DropdownItem key="pdf">Export PDF</DropdownItem>
                <DropdownItem key="print">Print</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="py-12 text-center flex flex-col items-center">
              <IoWarningOutline className="w-12 h-12 text-red-400 mb-3" />
              <p className="text-red-600 font-medium mb-1">
                Error loading appointments
              </p>
              <p className="text-mountain-500 text-[13px]">{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : layoutType === "tabbed" ? (
            <div className="flex flex-col w-full">
              <div className="flex gap-4 border-b border-mountain-200 w-full mb-4 px-1">
                {[
                  {
                    id: "today",
                    name: "Today",
                    count: getTodayAppointments().length,
                    color: "text-teal-700 bg-teal-100 border-teal-200",
                  },
                  {
                    id: "upcoming",
                    name: "Upcoming",
                    count: getUpcomingAppointments().length,
                    color: "text-saffron-700 bg-saffron-100 border-saffron-200",
                  },
                  {
                    id: "past",
                    name: "Past",
                    count: getPastAppointments().length,
                    color:
                      "text-mountain-600 bg-mountain-100 border-mountain-200",
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={`pb-2.5 px-2 relative text-[13.5px] font-medium transition-colors flex items-center gap-2 outline-none ${selectedTab === t.id ? "text-teal-700" : "text-mountain-500 hover:text-mountain-800"}`}
                    onClick={() => {
                      setSelectedTab(t.id);
                      setCurrentPage(1);
                    }}
                  >
                    {t.name}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${t.color}`}
                    >
                      {t.count}
                    </span>
                    {selectedTab === t.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>
              {renderAppointmentsList(currentAppointments)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-mountain-50 border-b border-mountain-200 text-[12px] uppercase font-semibold text-mountain-600 tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Patient</th>
                    <th className="py-2.5 px-4 font-semibold">Doctor</th>
                    <th className="py-2.5 px-4 font-semibold">Date & Time</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Type</th>
                    <th className="py-2.5 px-4 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mountain-100">
                  {currentAppointments.map((app) => {
                    const { date, time } = formatAppointmentTime(app);
                    const patName = getPatientNameById(app.patientId);
                    const dName = getDoctorNameById(app.doctorId);
                    const typeColor = appointmentTypes.find(
                      (at) => at.id === app.appointmentTypeId,
                    )?.color;

                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-mountain-50/50 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar name={patName} />
                            <span className="text-[13.5px] font-medium text-mountain-900">
                              {patName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[13px] text-mountain-800 font-medium">
                            {dName}
                          </div>
                          <div className="text-[11.5px] text-mountain-500">
                            {getDoctorSpecialityById(app.doctorId)}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[13px] text-mountain-800">
                          <div>{date}</div>
                          <div className="text-[11.5px] text-mountain-500">
                            {time}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Dropdown placement="bottom-start">
                            <DropdownTrigger>
                              <button
                                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${getStatusColorCls(app.status)} outline-none`}
                              >
                                {app.status || "Change"}
                              </button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              {getStatusOptions(app.status).map((s) => (
                                <DropdownItem
                                  key={s.id}
                                  onClick={() =>
                                    handleStatusChange(app.id, s.id)
                                  }
                                >
                                  {s.name}
                                </DropdownItem>
                              ))}
                            </DropdownMenu>
                          </Dropdown>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[13px] text-mountain-800">
                          <div className="flex items-center gap-1.5">
                            {typeColor && typeColor !== "none" && (
                              <div
                                className="w-2.5 h-2.5 rounded-full border border-mountain-300"
                                style={{
                                  backgroundColor:
                                    getAppointmentColorById(typeColor)
                                      .lightColor,
                                }}
                              />
                            )}
                            {getAppointmentTypeNameById(app.appointmentTypeId)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                              <button className="p-1.5 text-mountain-400 hover:text-mountain-800 rounded outline-none border border-transparent hover:border-mountain-200 transition">
                                <IoEllipsisVertical className="w-4 h-4" />
                              </button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem
                                key="view"
                                onClick={() =>
                                  (window.location.href = `/dashboard/appointments/${app.id}`)
                                }
                              >
                                View Details
                              </DropdownItem>
                              {app.status.toLowerCase() !== "cancelled" &&
                              app.status.toLowerCase() !== "completed" ? (
                                <DropdownItem
                                  key="edit"
                                  onClick={() =>
                                    (window.location.href = `/dashboard/appointments/${app.id}/edit`)
                                  }
                                >
                                  Edit
                                </DropdownItem>
                              ) : null}
                              <DropdownItem
                                key="cancel"
                                onClick={() => {
                                  setSelectedAppointment(app);
                                  setIsCancelModalOpen(true);
                                }}
                              >
                                <span className="text-red-500">
                                  Cancel Appt
                                </span>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {currentAppointments.length === 0 && (
                <div className="py-8 text-center text-mountain-500 text-[13px]">
                  No appointments match filters.
                </div>
              )}
            </div>
          )}
        </div>

        {filteredAppointments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-mountain-100 bg-mountain-50/50">
            <p className="text-[12.5px] text-mountain-500 mb-4 sm:mb-0">
              Showing {startIndex + 1} to {endIndex} of{" "}
              {filteredAppointments.length} appointments
            </p>
            <Pagination
              page={currentPage}
              total={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <CustomModal
        isDanger
        footer={
          <>
            <Button
              disabled={isCancelling}
              variant="bordered"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Keep It
            </Button>
            <Button
              color="danger"
              disabled={isCancelling}
              isLoading={isCancelling}
              onClick={handleCancelAppointment}
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancel"}
            </Button>
          </>
        }
        isOpen={isCancelModalOpen}
        title="Cancel Appointment"
        onClose={() => !isCancelling && setIsCancelModalOpen(false)}
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to cancel the appointment with{" "}
            <span className="font-semibold text-mountain-900">
              {selectedAppointment
                ? getPatientNameById(selectedAppointment.patientId)
                : ""}
            </span>
            ?
          </p>
          <div className="p-3 bg-red-50 border border-red-100 rounded text-red-700 text-[13px] flex items-start gap-2">
            <IoWarningOutline className="w-5 h-5 shrink-0" />
            <p>
              This action cannot be undone. The patient will no longer appear in
              the active schedule.
            </p>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
