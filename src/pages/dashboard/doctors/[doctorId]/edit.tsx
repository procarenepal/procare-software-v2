/**
 * Edit Doctor Page — Clinic Clarity without HeroUI
 */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { IoArrowBackOutline, IoSaveOutline } from "react-icons/io5";

import { title } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { doctorService } from "@/services/doctorService";
import { specialityService } from "@/services/specialityService";
import { addToast } from "@/components/ui/toast";
import { db } from "@/config/firebase";

// ── Custom UI Helpers ────────────────────────────────────────────────────────
function CustomInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  description,
  disabled,
  isInvalid,
  errorMessage,
  min,
  max,
  step,
}: any) {
  return (
    <div className={`flex flex-col gap-1.5 w-full`}>
      {label && (
        <label className="text-[13px] font-medium text-mountain-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div
        className={`flex items-center border rounded min-h-[38px] bg-white transition-colors ${
          isInvalid
            ? "border-red-300 focus-within:ring-red-100"
            : "border-mountain-200 focus-within:border-teal-500 focus-within:ring-teal-100"
        } focus-within:ring-1 ${disabled ? "bg-mountain-50" : ""}`}
      >
        <input
          className="flex-1 w-full text-[13.5px] px-3 py-1.5 bg-transparent outline-none text-mountain-800 placeholder:text-mountain-400 disabled:text-mountain-500"
          disabled={disabled}
          max={max}
          min={min}
          name={name}
          placeholder={placeholder}
          required={required}
          step={step}
          type={type}
          value={value}
          onChange={onChange}
        />
      </div>
      {(description || errorMessage) && (
        <p
          className={`text-[11.5px] ${isInvalid ? "text-red-500" : "text-mountain-500"}`}
        >
          {errorMessage || description}
        </p>
      )}
    </div>
  );
}

function CustomSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
}: any) {
  return (
    <div className={`flex flex-col gap-1.5 w-full`}>
      {label && (
        <label className="text-[13px] font-medium text-mountain-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        className={`w-full min-h-[38px] bg-white border border-mountain-200 text-mountain-800 text-[13.5px] rounded px-3 py-1.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-shadow`}
        name={name}
        required={required}
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
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function EditDoctorPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { clinicId, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialities, setSpecialities] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string>("");
  const [originalEmail, setOriginalEmail] = useState<string>("");
  const [doctorProfile, setDoctorProfile] = useState({
    name: "",
    doctorType: "",
    defaultCommission: "",
    speciality: "",
    phone: "",
    email: "",
    nmcNumber: "",
  });

  useEffect(() => {
    loadSpecialities();
    loadAdminEmails();
    loadDoctor();
  }, [clinicId, doctorId]);

  const loadSpecialities = async () => {
    if (!clinicId) return;
    try {
      const specialitiesData =
        await specialityService.getActiveSpecialitiesForDropdown(clinicId);

      setSpecialities(
        specialitiesData.map((s: any) => ({ value: s.key, label: s.label })),
      );
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to load specialities.",
        color: "danger",
      });
    }
  };

  const loadAdminEmails = async () => {
    if (!clinicId) return;
    try {
      const usersRef = collection(db, "users");
      const emails: string[] = [];
      const clinicAdminQuery = query(
        usersRef,
        where("clinicId", "==", clinicId),
        where("role", "==", "clinic-admin"),
      );
      const clinicAdminSnapshot = await getDocs(clinicAdminQuery);

      clinicAdminSnapshot.docs.forEach((doc) => {
        const userData = doc.data();

        if (userData.email) emails.push(userData.email.toLowerCase());
      });
      setAdminEmails(emails);
    } catch (error) {}
  };

  const loadDoctor = async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      const doctor = await doctorService.getDoctorById(doctorId);

      if (!doctor) {
        addToast({
          title: "Error",
          description: "Doctor not found.",
          color: "danger",
        });
        navigate("/dashboard/doctors");

        return;
      }
      const doctorEmail = doctor.email || "";

      setOriginalEmail(doctorEmail.toLowerCase());
      setDoctorProfile({
        name: doctor.name || "",
        doctorType: doctor.doctorType || "",
        defaultCommission:
          doctor.defaultCommission !== undefined
            ? String(doctor.defaultCommission)
            : "",
        speciality: doctor.speciality || "",
        phone: doctor.phone || "",
        email: doctorEmail,
        nmcNumber: doctor.nmcNumber || "",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to load doctor.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return "";
    const emailLower = email.toLowerCase().trim();

    if (emailLower === originalEmail) return "";
    if (adminEmails.includes(emailLower)) {
      return "This email is already used by a clinic or branch admin.";
    }

    return "";
  };

  const handleDoctorProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setDoctorProfile({ ...doctorProfile, [name]: value });
    if (name === "email") setEmailError(validateEmail(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId || !doctorId) return;
    if (
      !doctorProfile.name ||
      !doctorProfile.doctorType ||
      !doctorProfile.speciality ||
      !doctorProfile.phone ||
      !doctorProfile.nmcNumber
    ) {
      addToast({
        title: "Error",
        description: "Please fill in all required fields.",
        color: "danger",
      });

      return;
    }
    if (doctorProfile.email) {
      const err = validateEmail(doctorProfile.email);

      if (err) {
        setEmailError(err);

        return;
      }
    }

    setSaving(true);
    try {
      const updateData = {
        name: doctorProfile.name,
        doctorType: doctorProfile.doctorType as "regular" | "visiting",
        defaultCommission: parseFloat(doctorProfile.defaultCommission) || 0,
        speciality: doctorProfile.speciality,
        phone: doctorProfile.phone,
        email: doctorProfile.email || "",
        nmcNumber: doctorProfile.nmcNumber,
        clinicId,
        updatedBy: currentUser?.uid || "",
      };

      await doctorService.updateDoctor(doctorId, updateData);
      addToast({
        title: "Success",
        description: "Doctor updated successfully.",
        color: "success",
      });
      navigate(`/dashboard/doctors/${doctorId}`);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to update doctor.",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-full">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="bordered"
          onClick={() => navigate(`/dashboard/doctors/${doctorId}`)}
        >
          <IoArrowBackOutline className="w-5 h-5" />
        </Button>
        <div>
          <h1 className={title({ size: "sm" })}>Edit Doctor</h1>
          <p className="text-[14px] text-mountain-500 mt-1">
            Update the doctor information below
          </p>
        </div>
      </div>

      <form
        className="flex flex-col gap-6"
        id="doctor-edit-form"
        onSubmit={handleSubmit}
      >
        <div className="bg-white border border-mountain-200 rounded shadow-sm">
          <div className="px-5 py-4 border-b border-mountain-100 bg-mountain-50/50">
            <h4 className="font-semibold text-[15px] text-mountain-900 leading-none">
              Doctor Profile
            </h4>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CustomInput
                required
                label="Name"
                name="name"
                placeholder="Enter full name"
                value={doctorProfile.name}
                onChange={handleDoctorProfileChange}
              />
              <CustomSelect
                required
                label="Doctor Type"
                name="doctorType"
                options={[
                  { value: "regular", label: "Regular" },
                  { value: "visiting", label: "Visiting" },
                ]}
                placeholder="Select type"
                value={doctorProfile.doctorType}
                onChange={handleDoctorProfileChange}
              />
              <CustomInput
                label="Default Commission (%)"
                max="100"
                min="0"
                name="defaultCommission"
                placeholder="Enter %"
                step="0.01"
                type="number"
                value={doctorProfile.defaultCommission}
                onChange={handleDoctorProfileChange}
              />
              <CustomSelect
                required
                label="Speciality"
                name="speciality"
                options={specialities}
                placeholder="Select speciality"
                value={doctorProfile.speciality}
                onChange={handleDoctorProfileChange}
              />
              <CustomInput
                required
                label="Phone Number"
                name="phone"
                placeholder="Enter phone number"
                value={doctorProfile.phone}
                onChange={handleDoctorProfileChange}
              />
              <CustomInput
                errorMessage={emailError}
                isInvalid={!!emailError}
                label="Email"
                name="email"
                placeholder="Enter email address"
                type="email"
                value={doctorProfile.email}
                onChange={handleDoctorProfileChange}
              />
              <CustomInput
                required
                label="NMC Number (License)"
                name="nmcNumber"
                placeholder="Enter NMC license #"
                value={doctorProfile.nmcNumber}
                onChange={handleDoctorProfileChange}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button
            type="button"
            variant="bordered"
            onClick={() => navigate(`/dashboard/doctors/${doctorId}`)}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={saving}
            startContent={!saving && <IoSaveOutline />}
            type="submit"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
