/**
 * Edit Expert Page
 */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";

import { title } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { expertService } from "@/services/expertService";
import { specialityService } from "@/services/specialityService";
import { addToast } from "@/components/ui/toast";
import { Expert } from "@/types/models";

// ── Custom UI Helpers ────────────────────────────────────────────────────────
function CustomInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: any) {
  return (
    <div className={`flex flex-col gap-1.5 w-full`}>
      {label && (
        <label className="text-[13px] font-medium text-mountain-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="border border-mountain-200 rounded min-h-[38px] bg-white focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-100">
        <input
          className="w-full text-[13.5px] px-3 py-1.5 bg-transparent outline-none text-mountain-800"
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
          onChange={onChange}
        />
      </div>
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
        className="w-full min-h-[38px] bg-white border border-mountain-200 text-mountain-800 text-[13.5px] rounded px-3 py-1.5 outline-none focus:border-teal-500"
        name={name}
        required={required}
        value={value}
        onChange={onChange}
      >
        {placeholder && (
          <option disabled value="">
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

export default function EditExpertPage() {
  const { expertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const { clinicId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialities, setSpecialities] = useState<any[]>([]);
  const [expertProfile, setExpertProfile] = useState<Partial<Expert>>({});

  useEffect(() => {
    if (expertId && clinicId) loadData();
  }, [expertId, clinicId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, specs] = await Promise.all([
        expertService.getExpertById(expertId!),
        specialityService.getActiveSpecialitiesForDropdown(clinicId!),
      ]);

      if (!data) return navigate("/dashboard/experts");
      setExpertProfile(data);
      setSpecialities(
        specs.map((s: any) => ({ value: s.key, label: s.label })),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await expertService.updateExpert(expertId!, expertProfile);
      addToast({
        title: "Success",
        description: "Expert updated.",
        color: "success",
      });
      navigate(`/dashboard/experts/${expertId}`);
    } catch {
      addToast({
        title: "Error",
        description: "Update failed.",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-12 flex justify-center">
        <Spinner />
      </div>
    );

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="bordered" onClick={() => navigate(-1)}>
          <IoArrowBackOutline />
        </Button>
        <h1 className={title({ size: "sm" })}>Edit Expert</h1>
      </div>
      <form
        className="bg-white border rounded p-6 shadow-sm grid grid-cols-2 gap-6"
        onSubmit={handleUpdate}
      >
        <CustomInput
          required
          label="Name"
          name="name"
          value={expertProfile.name}
          onChange={(e: any) =>
            setExpertProfile({ ...expertProfile, name: e.target.value })
          }
        />
        <CustomSelect
          label="Speciality"
          name="speciality"
          options={specialities}
          value={expertProfile.speciality}
          onChange={(e: any) =>
            setExpertProfile({ ...expertProfile, speciality: e.target.value })
          }
        />
        <CustomInput
          required
          label="Phone"
          name="phone"
          value={expertProfile.phone}
          onChange={(e: any) =>
            setExpertProfile({ ...expertProfile, phone: e.target.value })
          }
        />
        <CustomInput
          label="Email"
          name="email"
          value={expertProfile.email}
          onChange={(e: any) =>
            setExpertProfile({ ...expertProfile, email: e.target.value })
          }
        />
        <CustomInput
          required
          label="License Number"
          name="licenseNumber"
          value={expertProfile.licenseNumber}
          onChange={(e: any) =>
            setExpertProfile({
              ...expertProfile,
              licenseNumber: e.target.value,
            })
          }
        />
        <div className="col-span-2 flex justify-end gap-3">
          <Button variant="bordered" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button color="primary" isLoading={saving} type="submit">
            Update Expert
          </Button>
        </div>
      </form>
    </div>
  );
}
