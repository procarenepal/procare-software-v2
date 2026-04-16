import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  IoArrowBackOutline,
  IoSaveOutline,
  IoPersonOutline,
  IoMedicalOutline,
  IoAddOutline,
  IoWarningOutline,
  IoCloseOutline,
} from "react-icons/io5";

import { title } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthContext } from "@/context/AuthContext";
import { patientService } from "@/services/patientService";
import { doctorService } from "@/services/doctorService";
import { Patient, Doctor } from "@/types/models";
import { addToast } from "@/components/ui/toast";

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
  readOnly,
  className,
}: any) {
  return (
    <div className={`flex flex-col gap-1.5 w-full relative ${className || ""}`}>
      {label && (
        <label className="text-[13px] font-medium text-mountain-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div
        className={`flex items-center border border-mountain-200 rounded min-h-[38px] bg-white focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-100 ${disabled || readOnly ? "bg-mountain-50" : ""}`}
      >
        {type === "textarea" ? (
          <textarea
            className="flex-1 w-full text-[13.5px] px-3 py-2 bg-transparent outline-none text-mountain-800 placeholder:text-mountain-400 disabled:text-mountain-500 min-h-[80px]"
            disabled={disabled}
            name={name}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
            onChange={onChange}
          />
        ) : (
          <input
            className="flex-1 w-full text-[13.5px] px-3 py-1.5 bg-transparent outline-none text-mountain-800 placeholder:text-mountain-400 disabled:text-mountain-500"
            disabled={disabled}
            name={name}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            type={type}
            value={value}
            onChange={onChange}
          />
        )}
      </div>
      {description && (
        <p className="text-[11.5px] text-mountain-500">{description}</p>
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
  disabled,
  required,
  description,
}: any) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[13px] font-medium text-mountain-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        className="h-[38px] bg-white border border-mountain-200 text-mountain-800 text-[13.5px] rounded px-3 py-1 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-shadow disabled:bg-mountain-50 disabled:text-mountain-500"
        disabled={disabled}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
      >
        <option disabled hidden value="">
          Select an option
        </option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {description && (
        <p className="text-[11.5px] text-mountain-500">{description}</p>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function PatientEditPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { clinicId, currentUser } = useAuthContext();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [convertingDate, setConvertingDate] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    regNumber: "",
    name: "",
    address: "",
    mobile: "",
    email: "",
    gender: "",
    dob: "",
    bsDate: "",
    bloodGroup: "",
    age: "",
    referredBy: "",
    phone: "",
    doctor: "",
    medicalConditions: [] as string[],
  });

  // State for medical conditions input
  const [medicalConditionInput, setMedicalConditionInput] = useState("");

  // Load patient data and doctors
  useEffect(() => {
    if (patientId && clinicId) {
      loadPatientData();
      loadDoctors();
    } else if (patientId && !clinicId) {
      addToast({
        title: "Error",
        description: "Clinic ID missing. Please log in again.",
        color: "danger",
      });
      navigate("/dashboard/patients");
    }
  }, [patientId, clinicId]);

  const loadPatientData = async () => {
    if (!patientId || !clinicId) return;
    try {
      setLoading(true);
      const patientData = await patientService.getPatientById(patientId);

      if (!patientData || patientData.clinicId !== clinicId) {
        addToast({
          title: "Error",
          description: "Patient not found.",
          color: "danger",
        });
        navigate("/dashboard/patients");

        return;
      }
      setPatient(patientData);

      setFormData({
        regNumber: patientData.regNumber,
        name: patientData.name,
        address: patientData.address,
        mobile: patientData.mobile,
        email: patientData.email || "",
        gender: patientData.gender || "",
        dob: patientData.dob
          ? new Date(patientData.dob).toISOString().split("T")[0]
          : "",
        bsDate: patientData.bsDate
          ? new Date(patientData.bsDate).toISOString().split("T")[0]
          : "",
        bloodGroup: patientData.bloodGroup || "",
        age:
          typeof patientData.age === "number" && !isNaN(patientData.age)
            ? patientData.age.toString()
            : patientData.dob
              ? calculateAge(
                  new Date(patientData.dob).toISOString().split("T")[0],
                )
              : "",
        referredBy: patientData.referredBy || "",
        phone: patientData.phone || "",
        doctor: patientData.doctorId,
        medicalConditions: patientData.medicalConditions || [],
      });
    } catch (error) {
      console.error("Error loading patient data:", error);
      addToast({
        title: "Error",
        description: "Failed to load patient data.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    if (!clinicId) return;
    try {
      setDoctorsLoading(true);
      const doctorsData = await doctorService.getDoctorsByClinic(clinicId);

      setDoctors(doctorsData.filter((doctor) => doctor.isActive));
    } catch (error) {
      console.error("Error loading doctors:", error);
      addToast({
        title: "Error",
        description: "Failed to load doctors.",
        color: "danger",
      });
    } finally {
      setDoctorsLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return "";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    )
      age--;

    return age.toString();
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    if (name === "mobile" && value) {
      if (!value.startsWith("+977") && value.length === 1 && /^\d$/.test(value))
        updatedFormData.mobile = `+977${value}`;
      else if (value.startsWith("+977")) updatedFormData.mobile = value;
      else if (
        formData.mobile.startsWith("+977") &&
        value.length > formData.mobile.length
      )
        updatedFormData.mobile = value;
      else if (formData.mobile.startsWith("+977") && value.length < 4)
        updatedFormData.mobile = "+977";
      else updatedFormData.mobile = value;
    }

    if (name === "dob" && value) {
      const age = calculateAge(value);

      updatedFormData.age = age;
      setConvertingDate(true);
      try {
        updatedFormData.bsDate = "";
      } catch (error) {
        console.error("Error converting date:", error);
      } finally {
        setConvertingDate(false);
      }
    } else if (name === "bsDate" && value) {
      setConvertingDate(true);
      try {
        updatedFormData.dob = "";
        updatedFormData.age = "";
      } catch (error) {
        console.error("Error converting date:", error);
      } finally {
        setConvertingDate(false);
      }
    }
    setFormData(updatedFormData);
  };

  const handleAddMedicalCondition = () => {
    const condition = medicalConditionInput.trim();

    if (condition && !formData.medicalConditions.includes(condition)) {
      setFormData((prev) => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, condition],
      }));
      setMedicalConditionInput("");
    }
  };

  const handleRemoveMedicalCondition = (conditionToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter(
        (c) => c !== conditionToRemove,
      ),
    }));
  };

  const handleMedicalConditionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMedicalCondition();
    }
  };

  const validateForm = (): boolean => {
    if (
      !formData.regNumber ||
      !formData.name ||
      !formData.address ||
      !formData.mobile ||
      !formData.doctor
    ) {
      addToast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        color: "warning",
      });

      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (!patientId || !clinicId || !currentUser) {
        addToast({
          title: "Error",
          description: "Missing required information.",
          color: "danger",
        });

        return;
      }
      const updatedPatientData: any = {
        regNumber: formData.regNumber,
        name: formData.name,
        address: formData.address,
        mobile: formData.mobile,
        email: formData.email || "",
        referredBy: formData.referredBy || "",
        phone: formData.phone || "",
        doctorId: formData.doctor,
        medicalConditions: formData.medicalConditions,
      };

      if (formData.gender) updatedPatientData.gender = formData.gender;
      if (formData.bloodGroup)
        updatedPatientData.bloodGroup = formData.bloodGroup;
      if (formData.dob) updatedPatientData.dob = new Date(formData.dob);
      if (formData.bsDate)
        updatedPatientData.bsDate = new Date(formData.bsDate);
      if (formData.dob && formData.age)
        updatedPatientData.age = parseInt(formData.age, 10);

      await patientService.updatePatient(patientId, updatedPatientData);
      addToast({
        title: "Success",
        description: "Patient information updated successfully.",
        color: "success",
      });
      navigate(`/dashboard/patients/${patientId}`);
    } catch (error) {
      console.error("Error updating patient:", error);
      addToast({
        title: "Error",
        description: "Failed to update patient.",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className={title({ size: "sm" })}>Edit Patient</h1>
        </div>
        <div className="bg-white border border-mountain-200 rounded p-12 flex items-center justify-center shadow-sm">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-white border border-mountain-200 rounded p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <IoWarningOutline className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-[15px] font-semibold text-mountain-900 mb-1">
          Patient Not Found
        </h3>
        <p className="text-[13.5px] text-mountain-500 mb-6">
          The patient you're looking for could not be found or doesn't belong to
          this clinic.
        </p>
        <Button color="primary" onClick={() => navigate("/dashboard/patients")}>
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            startContent={<IoArrowBackOutline />}
            variant="bordered"
            onClick={() => navigate(`/dashboard/patients/${patientId}`)}
          >
            Back
          </Button>
          <div>
            <h1 className={title({ size: "sm" })}>Edit Patient</h1>
            <p className="text-[13.5px] text-mountain-500 mt-1">
              Update patient information
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="bordered"
            onClick={() => navigate(`/dashboard/patients/${patientId}`)}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={saving}
            isLoading={saving}
            startContent={<IoSaveOutline />}
            onClick={handleSubmit}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Patient Profile Section */}
        <div className="bg-white border border-mountain-200 rounded shadow-sm">
          <div className="px-5 py-4 border-b border-mountain-100 bg-mountain-50/50 flex items-center gap-3">
            <div className="p-1.5 bg-white rounded border border-mountain-200 shadow-sm">
              <IoPersonOutline className="text-teal-600 text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-mountain-900 leading-none mb-1">
                Patient Information
              </h3>
              <p className="text-[12.5px] text-mountain-500">
                Basic patient details and contact information
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CustomInput
                disabled
                readOnly
                required
                description="Registration number cannot be changed"
                label="Registration Number"
                name="regNumber"
                value={formData.regNumber}
                onChange={handleFormChange}
              />
              <CustomInput
                required
                label="Full Name"
                name="name"
                placeholder="Enter patient's full name"
                value={formData.name}
                onChange={handleFormChange}
              />
              <CustomInput
                required
                description="Include country code (e.g., +977)"
                label="Mobile Number"
                name="mobile"
                placeholder="Enter mobile number"
                value={formData.mobile}
                onChange={handleFormChange}
              />
              <CustomInput
                label="Email Address"
                name="email"
                placeholder="Enter email address"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
              />
              <CustomInput
                label="Phone Number"
                name="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleFormChange}
              />
              <CustomSelect
                label="Gender"
                name="gender"
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
                value={formData.gender}
                onChange={handleFormChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <CustomInput
                disabled={convertingDate}
                label="Date of Birth (AD)"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleFormChange}
              />
              <CustomInput
                description="Optional Bikram Sambat date"
                disabled={convertingDate}
                label="Date of Birth (BS)"
                name="bsDate"
                type="date"
                value={formData.bsDate}
                onChange={handleFormChange}
              />
              <CustomInput
                readOnly
                description="Auto-calculated from DOB"
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleFormChange}
              />
              <CustomSelect
                label="Blood Group"
                name="bloodGroup"
                options={[
                  { value: "A+", label: "A+" },
                  { value: "A-", label: "A-" },
                  { value: "B+", label: "B+" },
                  { value: "B-", label: "B-" },
                  { value: "AB+", label: "AB+" },
                  { value: "AB-", label: "AB-" },
                  { value: "O+", label: "O+" },
                  { value: "O-", label: "O-" },
                ]}
                value={formData.bloodGroup}
                onChange={handleFormChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <CustomInput
                required
                label="Address"
                name="address"
                placeholder="Enter patient's address"
                type="textarea"
                value={formData.address}
                onChange={handleFormChange}
              />
              <div className="flex flex-col gap-6">
                <CustomInput
                  label="Referred By"
                  name="referredBy"
                  placeholder="Enter referral source"
                  value={formData.referredBy}
                  onChange={handleFormChange}
                />
                <CustomSelect
                  required
                  disabled={doctorsLoading}
                  label="Assigned Doctor"
                  name="doctor"
                  options={doctors.map((d) => ({
                    value: d.id,
                    label: `${d.name} - ${d.speciality}`,
                  }))}
                  value={formData.doctor}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Medical Conditions Section */}
        <div className="bg-white border border-mountain-200 rounded shadow-sm">
          <div className="px-5 py-4 border-b border-mountain-100 bg-mountain-50/50 flex items-center gap-3">
            <div className="p-1.5 bg-white rounded border border-mountain-200 shadow-sm">
              <IoMedicalOutline className="text-teal-600 text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-mountain-900 leading-none mb-1">
                Medical Conditions
              </h3>
              <p className="text-[12.5px] text-mountain-500">
                Add any known medical conditions or allergies
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center border border-mountain-200 rounded min-h-[38px] bg-white focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-100">
                  <input
                    className="flex-1 w-full text-[13.5px] px-3 py-1.5 bg-transparent outline-none text-mountain-800 placeholder:text-mountain-400"
                    placeholder="Enter medical condition"
                    value={medicalConditionInput}
                    onChange={(e) => setMedicalConditionInput(e.target.value)}
                    onKeyPress={handleMedicalConditionKeyPress}
                  />
                </div>
              </div>
              <Button
                color="primary"
                disabled={!medicalConditionInput.trim()}
                startContent={<IoAddOutline />}
                variant="bordered"
                onClick={handleAddMedicalCondition}
              >
                Add
              </Button>
            </div>

            {formData.medicalConditions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.medicalConditions.map((condition, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-mountain-50 border border-mountain-200 rounded text-[12.5px] font-medium text-mountain-800"
                  >
                    {condition}
                    <button
                      className="text-mountain-400 hover:text-red-500 focus:outline-none"
                      type="button"
                      onClick={() => handleRemoveMedicalCondition(condition)}
                    >
                      <IoCloseOutline className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-mountain-500 italic">
                No medical conditions added yet. Add conditions above if any.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
