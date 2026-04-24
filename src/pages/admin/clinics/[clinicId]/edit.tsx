import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { IoBusinessOutline } from "react-icons/io5";

import { title } from "@/components/primitives";
import { clinicService } from "@/services/clinicService";
import { subscriptionService } from "@/services/subscriptionService";
import { Clinic, SubscriptionPlan } from "@/types/models";

interface ClinicEditPageParams {
  clinicId: string;
}

export default function ClinicEditPage() {
  const { clinicId } = useParams<keyof ClinicEditPageParams>() as {
    clinicId: string;
  };
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [formData, setFormData] = useState<Partial<Clinic>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [clinicData, plansData] = await Promise.all([
          clinicService.getClinicById(clinicId),
          subscriptionService.getAllSubscriptionPlans(),
        ]);

        setClinic(clinicData);
        setFormData(clinicData);
        setPlans(plansData);
      } catch (err) {
        console.error("Error loading data:", err);
        addToast({
          title: "Error",
          description: "Failed to load clinic details",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clinicId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Clinic name is required";
    }

    if (!formData.email || formData.email.trim() === "") {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone || formData.phone.trim() === "") {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.city || formData.city.trim() === "") {
      newErrors.city = "City is required";
    }

    if (!formData.address || formData.address.trim() === "") {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        color: "danger",
      });

      return;
    }

    try {
      setSaving(true);
      await clinicService.updateClinic(clinicId, formData);
      addToast({
        title: "Success",
        description: "Clinic information updated successfully",
        color: "success",
      });
      navigate(`/admin/clinics/${clinicId}`);
    } catch (err) {
      console.error("Error updating clinic:", err);
      addToast({
        title: "Error",
        description: "Failed to update clinic information",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner label="Loading clinic details..." size="lg" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <Card className="max-w-lg mx-auto my-12 shadow-md">
        <CardHeader className="bg-danger/10 flex gap-3 items-center">
          <div className="p-2 rounded-full bg-danger/20">
            <svg
              fill="none"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                className="text-danger"
                d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-danger">Error</h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-6">
            <p className="text-xl mb-6 text-default-700">Clinic not found</p>
            <Button
              color="primary"
              size="lg"
              startContent={
                <svg
                  fill="none"
                  height="20"
                  viewBox="0 0 24 24"
                  width="20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 12H5M5 12L12 19M5 12L12 5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              }
              onClick={() => navigate("/admin/clinics")}
            >
              Back to Clinics
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      {/* Header */}
      <Card className="mb-6 shadow-sm border-none">
        <CardBody className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h1
                  className={title({
                    size: "sm",
                    className: "text-xl md:text-2xl",
                  })}
                >
                  Edit Clinic: {clinic.name}
                </h1>
                <p className="text-default-600 mt-1">
                  Update clinic information and settings
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                color="default"
                variant="flat"
                onClick={() => navigate(`/admin/clinics/${clinicId}`)}
              >
                Cancel
              </Button>
              <Button color="primary" isLoading={saving} onClick={handleSubmit}>
                Save Changes
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-default-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <IoBusinessOutline className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-default-800">
                    Basic Information
                  </p>
                  <p className="text-default-500 text-sm">
                    Update clinic's core details
                  </p>
                </div>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="name"
                  >
                    Clinic Name*
                  </label>
                  <Input
                    fullWidth
                    errorMessage={errors.name}
                    id="name"
                    isInvalid={!!errors.name}
                    name="name"
                    placeholder="Enter clinic name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="email"
                  >
                    Email Address*
                  </label>
                  <Input
                    fullWidth
                    errorMessage={errors.email}
                    id="email"
                    isInvalid={!!errors.email}
                    name="email"
                    placeholder="Enter clinic email"
                    type="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="phone"
                  >
                    Phone Number*
                  </label>
                  <Input
                    fullWidth
                    errorMessage={errors.phone}
                    id="phone"
                    isInvalid={!!errors.phone}
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="city"
                  >
                    City*
                  </label>
                  <Input
                    fullWidth
                    errorMessage={errors.city}
                    id="city"
                    isInvalid={!!errors.city}
                    name="city"
                    placeholder="Enter city name"
                    value={formData.city || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="state"
                  >
                    State/Province*
                  </label>
                  <Input
                    fullWidth
                    errorMessage={errors.state}
                    id="state"
                    isInvalid={!!errors.state}
                    name="state"
                    placeholder="Enter state"
                    value={formData.state || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="zipCode"
                  >
                    ZIP/Postal Code*
                  </label>
                  <Input
                    fullWidth
                    errorMessage={errors.zipCode}
                    id="zipCode"
                    isInvalid={!!errors.zipCode}
                    name="zipCode"
                    placeholder="Enter zip code"
                    value={formData.zipCode || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="country"
                  >
                    Country*
                  </label>
                  <Input
                    fullWidth
                    errorMessage={errors.country}
                    id="country"
                    isInvalid={!!errors.country}
                    name="country"
                    placeholder="Enter country"
                    value={formData.country || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="address"
                  >
                    Full Address*
                  </label>
                  <Textarea
                    fullWidth
                    errorMessage={errors.address}
                    id="address"
                    isInvalid={!!errors.address}
                    name="address"
                    placeholder="Enter full street address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="description"
                  >
                    Description
                  </label>
                  <Textarea
                    fullWidth
                    id="description"
                    minRows={3}
                    name="description"
                    placeholder="Enter clinic description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="bg-default-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/10">
                  <svg
                    className="text-warning"
                    fill="none"
                    height="20"
                    viewBox="0 0 24 24"
                    width="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 21H21M9 8H15M9 12H15M9 16H15M5 3H19C20.1046 3 21 3.89543 21 5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V5C3 3.89543 3.89543 3 5 3Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-default-800">
                    Subscription Settings
                  </p>
                  <p className="text-default-500 text-sm">
                    Manage subscription plan and status
                  </p>
                </div>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="subscriptionPlan"
                  >
                    Subscription Plan
                  </label>
                  <Select
                    fullWidth
                    id="subscriptionPlan"
                    placeholder="Select subscription plan"
                    selectedKeys={
                      formData.subscriptionPlan
                        ? new Set([formData.subscriptionPlan])
                        : new Set()
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;

                      handleSelectChange("subscriptionPlan", selectedKey);
                    }}
                  >
                    {plans &&
                      plans.map((plan) => (
                        <SelectItem key={plan.id}>{plan.name}</SelectItem>
                      ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="subscriptionStatus"
                  >
                    Subscription Status
                  </label>
                  <Select
                    fullWidth
                    id="subscriptionStatus"
                    placeholder="Select subscription status"
                    selectedKeys={
                      formData.subscriptionStatus
                        ? new Set([formData.subscriptionStatus])
                        : new Set()
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;

                      handleSelectChange("subscriptionStatus", selectedKey);
                    }}
                  >
                    <SelectItem key="active">Active</SelectItem>
                    <SelectItem key="suspended">Suspended</SelectItem>
                    <SelectItem key="cancelled">Cancelled</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-default-700"
                    htmlFor="subscriptionType"
                  >
                    Subscription Type
                  </label>
                  <Select
                    fullWidth
                    id="subscriptionType"
                    placeholder="Select subscription type"
                    selectedKeys={
                      formData.subscriptionType
                        ? new Set([formData.subscriptionType])
                        : new Set()
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;

                      handleSelectChange("subscriptionType", selectedKey);
                    }}
                  >
                    <SelectItem key="monthly">Monthly</SelectItem>
                    <SelectItem key="yearly">Yearly</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="mt-4 p-3 bg-default-50 rounded-lg border border-default-200">
                <div className="flex items-center gap-2">
                  <svg
                    className="text-warning"
                    fill="none"
                    height="18"
                    viewBox="0 0 24 24"
                    width="18"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 9V12.75M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12 15.75H12.0075V15.7575H12V15.75Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <p className="text-sm text-default-700">
                    <span className="font-medium">Note:</span> Changing
                    subscription plan or status will affect billing and access
                    to features.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mb-8">
          <Button
            color="default"
            variant="flat"
            onClick={() => navigate(`/admin/clinics/${clinicId}`)}
          >
            Cancel
          </Button>
          <Button color="primary" isLoading={saving} type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </>
  );
}
