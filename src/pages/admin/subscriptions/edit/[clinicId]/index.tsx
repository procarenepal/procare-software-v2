import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import {
  IoArrowBackOutline,
  IoSaveOutline,
  IoAlertCircleOutline,
  IoRefreshOutline,
  IoCalendarOutline,
  IoBusinessOutline,
  IoCloseCircleOutline,
  IoCheckmarkCircleOutline,
  IoInformationCircleOutline,
  IoCardOutline,
  IoTimeOutline,
  IoWalletOutline,
  IoShieldCheckmarkOutline,
  IoStorefrontOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Badge } from "@heroui/badge";
import { Tooltip } from "@heroui/tooltip";
import { Progress } from "@heroui/progress";
import { Tabs, Tab } from "@heroui/tabs";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";

import { Clinic, SubscriptionPlan } from "@/types/models";
import { subscriptionService } from "@/services/subscriptionService";
import { clinicService } from "@/services/clinicService";
import { title } from "@/components/primitives";

export default function EditClinicSubscriptionPage() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("details");

  // Form state
  const [formData, setFormData] = useState<{
    planId: string;
    status: "active" | "suspended" | "cancelled";
    startDate: string;
    endDate: string;
    subscriptionType: "monthly" | "yearly";
  }>({
    planId: "",
    status: "active",
    startDate: "",
    endDate: "",
    subscriptionType: "monthly",
  });

  // Load clinic and subscription data
  useEffect(() => {
    const fetchData = async () => {
      if (!clinicId) return;

      try {
        setLoading(true);
        const [clinicData, plansData] = await Promise.all([
          clinicService.getClinicById(clinicId),
          subscriptionService.getAllSubscriptionPlans(),
        ]);

        if (!clinicData) {
          setError("Clinic not found");

          return;
        }

        setClinic(clinicData);
        setPlans(plansData.filter((plan) => plan.isActive));

        // Initialize form data with current values
        setFormData({
          planId: clinicData.subscriptionPlan || "",
          status: clinicData.subscriptionStatus || "active",
          subscriptionType: clinicData.subscriptionType || "monthly",
          startDate: clinicData.subscriptionStartDate
            ? formatDateForInput(clinicData.subscriptionStartDate)
            : formatDateForInput(new Date()),
          endDate: clinicData.subscriptionEndDate
            ? formatDateForInput(clinicData.subscriptionEndDate)
            : "",
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load clinic or subscription data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clinicId]);

  // Calculate end date based on start date and subscription type
  const calculateEndDate = (startDate: string, type: "monthly" | "yearly") => {
    const date = new Date(startDate);

    if (type === "monthly") {
      date.setMonth(date.getMonth() + 1);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }

    return formatDateForInput(date);
  };

  // Handle start date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;

    setFormData({
      ...formData,
      startDate: newStartDate,
      endDate: calculateEndDate(newStartDate, formData.subscriptionType),
    });
  };

  // Handle subscription type change
  const handleSubscriptionTypeChange = (type: "monthly" | "yearly") => {
    setFormData({
      ...formData,
      subscriptionType: type,
      endDate: calculateEndDate(formData.startDate, type),
    });
  };

  // Format date for input field
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get selected plan details
  const getSelectedPlan = () => {
    return plans.find((plan) => plan.id === formData.planId);
  };

  // Calculate subscription savings (yearly vs monthly)
  const calculateSavings = () => {
    const plan = getSelectedPlan();

    if (!plan) return null;

    if (
      formData.subscriptionType === "yearly" &&
      plan.monthlyPrice &&
      plan.yearlyPrice
    ) {
      const monthlyTotal = plan.monthlyPrice * 12;
      const yearlyCost = plan.yearlyPrice;
      const savings = monthlyTotal - yearlyCost;
      const savingsPercentage = Math.round((savings / monthlyTotal) * 100);

      return {
        amount: savings,
        percentage: savingsPercentage,
      };
    }

    return null;
  };

  // Calculate time left in subscription
  const calculateTimeLeft = () => {
    if (!formData.endDate) return null;

    const endDate = new Date(formData.endDate);
    const today = new Date();

    // Return null if end date is in the past
    if (endDate < today) return null;

    const diffTime = Math.abs(endDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId) return;

    try {
      setSaving(true);
      await subscriptionService.updateClinicSubscription(
        clinicId,
        formData.planId,
        new Date(formData.startDate),
        formData.endDate ? new Date(formData.endDate) : undefined,
        formData.status,
        formData.subscriptionType,
      );

      setSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

      // Refresh clinic data
      const updatedClinic = await clinicService.getClinicById(clinicId);

      if (updatedClinic) {
        setClinic(updatedClinic);
      }
    } catch (err) {
      console.error("Error updating subscription:", err);
      setError("Failed to update subscription details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner label="Loading clinic subscription details..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-danger/20 bg-danger/10">
        <CardBody>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <IoAlertCircleOutline className="w-12 h-12 text-danger" />
            <div className="text-center">
              <p className="text-xl font-semibold text-danger">{error}</p>
              <p className="text-sm text-danger/80 mt-1">
                Please try again or navigate back to the subscriptions page.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                color="warning"
                startContent={<IoRefreshOutline />}
                variant="bordered"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
              <Button
                as={Link}
                color="primary"
                href="/admin/subscriptions"
                variant="flat"
              >
                Back to Subscriptions
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!clinic) {
    return null;
  }

  const timeLeft = calculateTimeLeft();
  const savings = calculateSavings();

  return (
    <>
      {/* Header with breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs className="mb-4" size="sm">
          <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
          <BreadcrumbItem href="/admin/subscriptions">
            Subscriptions
          </BreadcrumbItem>
          <BreadcrumbItem>Edit Subscription</BreadcrumbItem>
        </Breadcrumbs>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={title({ size: "sm" })}>
                Edit Clinic Subscription
              </h1>
              <Badge
                color={
                  clinic.subscriptionStatus === "active"
                    ? "success"
                    : clinic.subscriptionStatus === "suspended"
                      ? "warning"
                      : "danger"
                }
              >
                {clinic.subscriptionStatus.charAt(0).toUpperCase() +
                  clinic.subscriptionStatus.slice(1)}
              </Badge>
            </div>
            <p className="text-default-600 mt-2 flex items-center gap-2">
              <IoBusinessOutline className="text-default-500" />
              Manage subscription for{" "}
              <span className="font-medium">{clinic.name}</span>
            </p>
          </div>

          <Button
            as={Link}
            color="default"
            href="/admin/subscriptions"
            startContent={<IoArrowBackOutline />}
            variant="flat"
          >
            Back to Subscriptions
          </Button>
        </div>
      </div>

      {/* Main content with tabs */}
      <Tabs
        classNames={{
          tab: "h-10",
          tabList: "gap-6 w-full relative rounded-none border-b border-divider",
        }}
        color="primary"
        selectedKey={activeTab}
        variant="underlined"
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab
          key="details"
          title={
            <div className="flex items-center gap-2">
              <IoInformationCircleOutline />
              <span>Subscription Details</span>
            </div>
          }
        >
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Clinic Info Card */}
            <Card className="md:col-span-4 border-none shadow-sm">
              <CardHeader className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary-100">
                  <IoBusinessOutline className="text-primary text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Clinic Information</h2>
                  <p className="text-sm text-default-500">Client details</p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary">
                      {clinic.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{clinic.name}</div>
                      <div className="text-xs text-default-500">
                        {clinic.clinicType}
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div className="flex items-center gap-3">
                    <IoMailOutline className="text-default-500" />
                    <div>
                      <div className="text-sm text-default-500">Email</div>
                      <div>{clinic.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <IoCallOutline className="text-default-500" />
                    <div>
                      <div className="text-sm text-default-500">Phone</div>
                      <div>{clinic.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <IoLocationOutline className="text-default-500" />
                    <div>
                      <div className="text-sm text-default-500">Location</div>
                      <div>{clinic.city}</div>
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <div className="text-sm text-default-500 mb-1">
                      Current Subscription
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Chip
                        color={
                          clinic.subscriptionStatus === "active"
                            ? "success"
                            : clinic.subscriptionStatus === "suspended"
                              ? "warning"
                              : "danger"
                        }
                        startContent={
                          clinic.subscriptionStatus === "active" ? (
                            <IoCheckmarkCircleOutline />
                          ) : (
                            <IoAlertCircleOutline />
                          )
                        }
                        variant="flat"
                      >
                        {clinic.subscriptionStatus.charAt(0).toUpperCase() +
                          clinic.subscriptionStatus.slice(1)}
                      </Chip>

                      {clinic.subscriptionType && (
                        <Chip
                          color="primary"
                          startContent={<IoTimeOutline />}
                          variant="flat"
                        >
                          {clinic.subscriptionType.charAt(0).toUpperCase() +
                            clinic.subscriptionType.slice(1)}
                        </Chip>
                      )}
                    </div>
                  </div>

                  {timeLeft && (
                    <div>
                      <div className="text-sm text-default-500 mb-1">
                        Time Remaining
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          className="max-w-[150px]"
                          color={timeLeft < 30 ? "warning" : "success"}
                          maxValue={365}
                          size="sm"
                          value={timeLeft}
                        />
                        <span className="text-sm font-medium">
                          {timeLeft} days
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
              <Divider />
              <CardFooter>
                <Button
                  fullWidth
                  as={Link}
                  color="primary"
                  href={`/admin/clinics/${clinicId}`}
                  size="sm"
                  variant="flat"
                >
                  View Clinic Details
                </Button>
              </CardFooter>
            </Card>

            {/* Subscription Edit Form */}
            <Card className="md:col-span-8 border-none shadow-sm">
              <CardHeader className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary-100">
                  <IoCardOutline className="text-primary text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Subscription Details
                  </h2>
                  <p className="text-sm text-default-500">
                    Manage subscription plan and settings
                  </p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Subscription Plan
                        </label>
                        <Select
                          isRequired
                          className="w-full"
                          items={plans}
                          placeholder="Select subscription plan"
                          startContent={
                            <IoShieldCheckmarkOutline className="text-default-400" />
                          }
                          value={formData.planId}
                          onChange={(e) =>
                            setFormData({ ...formData, planId: e.target.value })
                          }
                        >
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </Select>
                        {(plan) => <SelectItem>{plan.id}</SelectItem>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Subscription Status
                        </label>
                        <Select
                          isRequired
                          className="w-full"
                          startContent={
                            formData.status === "active" ? (
                              <IoCheckmarkCircleOutline className="text-success" />
                            ) : formData.status === "suspended" ? (
                              <IoAlertCircleOutline className="text-warning" />
                            ) : (
                              <IoCloseCircleOutline className="text-danger" />
                            )
                          }
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              status: e.target.value as
                                | "active"
                                | "suspended"
                                | "cancelled",
                            })
                          }
                        >
                          {/* @ts-ignore */}
                          <SelectItem key="active" value="active">
                            Active
                          </SelectItem>
                          {/* @ts-ignore */}
                          <SelectItem key="suspended" value="suspended">
                            Suspended
                          </SelectItem>
                          {/* @ts-ignore */}
                          <SelectItem key="cancelled" value="cancelled">
                            Cancelled
                          </SelectItem>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Subscription Type
                      </label>
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div
                            className={`border p-4 rounded-lg flex items-center gap-3 cursor-pointer ${
                              formData.subscriptionType === "monthly"
                                ? "border-primary bg-primary-50"
                                : "border-default-200"
                            }`}
                            onClick={() => {
                              const newEndDate = calculateEndDate(
                                formData.startDate,
                                "monthly",
                              );

                              setFormData({
                                ...formData,
                                subscriptionType: "monthly",
                                endDate: newEndDate,
                              });
                            }}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                formData.subscriptionType === "monthly"
                                  ? "border-primary"
                                  : "border-default-300"
                              }`}
                            >
                              {formData.subscriptionType === "monthly" && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">Monthly</div>
                              <div className="text-xs text-default-500">
                                Billed every month
                              </div>
                            </div>
                          </div>

                          <div
                            className={`border p-4 rounded-lg flex items-center gap-3 cursor-pointer ${
                              formData.subscriptionType === "yearly"
                                ? "border-primary bg-primary-50"
                                : "border-default-200"
                            }`}
                            onClick={() => {
                              const newEndDate = calculateEndDate(
                                formData.startDate,
                                "yearly",
                              );

                              setFormData({
                                ...formData,
                                subscriptionType: "yearly",
                                endDate: newEndDate,
                              });
                            }}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                formData.subscriptionType === "yearly"
                                  ? "border-primary"
                                  : "border-default-300"
                              }`}
                            >
                              {formData.subscriptionType === "yearly" && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">Yearly</div>
                                <div className="text-xs text-default-500">
                                  Billed annually
                                </div>
                              </div>
                              {savings && savings.percentage > 0 && (
                                <Chip color="success" size="sm">
                                  Save {savings.percentage}%
                                </Chip>
                              )}
                            </div>
                          </div>
                        </div>

                        {savings &&
                          savings.percentage > 0 &&
                          formData.subscriptionType === "yearly" && (
                            <div className="text-xs text-success flex items-center gap-1">
                              <IoWalletOutline />
                              Save NPR {savings.amount} with yearly billing
                              compared to monthly
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Start Date
                        </label>
                        <Input
                          isRequired
                          className="w-full"
                          startContent={
                            <IoCalendarOutline className="text-default-400" />
                          }
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => {
                            const newStartDate = e.target.value;
                            const newEndDate = calculateEndDate(
                              newStartDate,
                              formData.subscriptionType,
                            );

                            setFormData({
                              ...formData,
                              startDate: newStartDate,
                              endDate: newEndDate,
                            });
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium">
                            End Date (Optional)
                          </label>
                          <Tooltip content="Leave empty for auto-renewal">
                            <span className="text-xs text-default-400 flex items-center gap-1 cursor-help">
                              <IoInformationCircleOutline />
                              Auto-renewal
                            </span>
                          </Tooltip>
                        </div>
                        <Input
                          className="w-full"
                          startContent={
                            <IoCalendarOutline className="text-default-400" />
                          }
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {getSelectedPlan() && (
                      <div>
                        <Divider className="my-4" />
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold">
                            Selected Plan Details
                          </h3>
                          <Chip
                            color="primary"
                            startContent={<IoShieldCheckmarkOutline />}
                            variant="flat"
                          >
                            {getSelectedPlan()?.name}
                          </Chip>
                        </div>

                        <div className="bg-default-50 p-5 rounded-lg border border-default-200">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <IoStorefrontOutline className="text-primary" />
                                <div className="font-medium text-lg">
                                  {getSelectedPlan()?.name}
                                </div>
                              </div>
                              <p className="text-sm text-default-600 mt-1">
                                {getSelectedPlan()?.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="text-xl font-bold text-primary">
                                {formData.subscriptionType === "monthly" ? (
                                  <>
                                    NPR{" "}
                                    {getSelectedPlan()
                                      ?.discountedMonthlyPrice ||
                                      getSelectedPlan()?.monthlyPrice}
                                  </>
                                ) : (
                                  <>
                                    NPR{" "}
                                    {getSelectedPlan()?.discountedYearlyPrice ||
                                      getSelectedPlan()?.yearlyPrice}
                                  </>
                                )}
                                <span className="text-sm font-normal text-default-500">
                                  /
                                  {formData.subscriptionType === "monthly"
                                    ? "month"
                                    : "year"}
                                </span>
                              </div>

                              {/* Show old price if discounted */}
                              {formData.subscriptionType === "monthly" &&
                                getSelectedPlan()?.discountedMonthlyPrice &&
                                getSelectedPlan()?.monthlyPrice && (
                                  <div className="text-sm text-default-500 line-through">
                                    NPR {getSelectedPlan()?.monthlyPrice}/month
                                  </div>
                                )}

                              {formData.subscriptionType === "yearly" &&
                                getSelectedPlan()?.discountedYearlyPrice &&
                                getSelectedPlan()?.yearlyPrice && (
                                  <div className="text-sm text-default-500 line-through">
                                    NPR {getSelectedPlan()?.yearlyPrice}/year
                                  </div>
                                )}
                            </div>
                          </div>

                          <Divider className="my-3" />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-default-100 p-3 rounded">
                              <div className="text-xs text-default-500 mb-1">
                                Max Users
                              </div>
                              <div className="font-semibold flex items-center gap-1">
                                <span>{getSelectedPlan()?.maxUsers}</span>
                                <span className="text-xs text-default-400">
                                  users
                                </span>
                              </div>
                            </div>

                            <div className="bg-default-100 p-3 rounded">
                              <div className="text-xs text-default-500 mb-1">
                                Max Patients
                              </div>
                              <div className="font-semibold flex items-center gap-1">
                                <span>{getSelectedPlan()?.maxPatients}</span>
                                <span className="text-xs text-default-400">
                                  patients
                                </span>
                              </div>
                            </div>

                            <div className="bg-default-100 p-3 rounded">
                              <div className="text-xs text-default-500 mb-1">
                                Storage Limit
                              </div>
                              <div className="font-semibold flex items-center gap-1">
                                <span>{getSelectedPlan()?.storageLimitGB}</span>
                                <span className="text-xs text-default-400">
                                  GB
                                </span>
                              </div>
                            </div>
                          </div>

                          <h4 className="text-sm font-medium mb-2">
                            Plan Features
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            {getSelectedPlan()?.features.map(
                              (feature, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <IoCheckmarkCircleOutline className="text-success flex-shrink-0" />
                                  <span className="text-default-700">
                                    {feature}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>

                          {/* Show discount message */}
                          {((formData.subscriptionType === "monthly" &&
                            getSelectedPlan()?.discountedMonthlyPrice) ||
                            (formData.subscriptionType === "yearly" &&
                              getSelectedPlan()?.discountedYearlyPrice)) && (
                            <div className="mt-4 p-3 bg-success-50 rounded-md text-sm border border-success-200">
                              <div className="flex items-center gap-2">
                                <IoCheckmarkCircleOutline className="text-success" />
                                <span className="text-success font-medium">
                                  Special discount applied!
                                </span>
                              </div>
                              <p className="text-xs text-success-600 mt-1">
                                This plan is currently offered at a discounted
                                rate.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {success && (
                    <div className="mt-6 p-3 bg-success-50 border border-success-200 rounded-md flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="text-success text-lg" />
                      <span className="text-success">
                        Subscription updated successfully!
                      </span>
                    </div>
                  )}

                  {error && (
                    <div className="mt-6 p-3 bg-danger-50 border border-danger-200 rounded-md flex items-center gap-2">
                      <IoCloseCircleOutline className="text-danger text-lg" />
                      <span className="text-danger">{error}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      color="default"
                      type="button"
                      variant="flat"
                      onClick={() => navigate("/admin/subscriptions")}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      isLoading={saving}
                      startContent={!saving && <IoSaveOutline />}
                      type="submit"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </Tab>
        <Tab
          key="history"
          title={
            <div className="flex items-center gap-2">
              <IoTimeOutline />
              <span>Billing History</span>
            </div>
          }
        >
          <div className="mt-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex gap-3">
                <div className="p-2 rounded-lg bg-primary-100">
                  <IoWalletOutline className="text-primary text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Billing History</h2>
                  <p className="text-sm text-default-500">
                    Payment and subscription records
                  </p>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                {/* Placeholder for billing history - you can replace with actual data */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-default-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success-50 rounded-full">
                        <IoCheckmarkCircleOutline className="text-success" />
                      </div>
                      <div>
                        <div className="font-medium">
                          Monthly Subscription Payment
                        </div>
                        <div className="text-xs text-default-500">
                          May 1, 2025
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        NPR {getSelectedPlan()?.monthlyPrice || 0}
                      </div>
                      <Chip color="success" size="sm" variant="flat">
                        Paid
                      </Chip>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-default-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success-50 rounded-full">
                        <IoCheckmarkCircleOutline className="text-success" />
                      </div>
                      <div>
                        <div className="font-medium">
                          Monthly Subscription Payment
                        </div>
                        <div className="text-xs text-default-500">
                          Apr 1, 2025
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        NPR {getSelectedPlan()?.monthlyPrice || 0}
                      </div>
                      <Chip color="success" size="sm" variant="flat">
                        Paid
                      </Chip>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-default-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success-50 rounded-full">
                        <IoCheckmarkCircleOutline className="text-success" />
                      </div>
                      <div>
                        <div className="font-medium">
                          Monthly Subscription Payment
                        </div>
                        <div className="text-xs text-default-500">
                          Mar 1, 2025
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        NPR {getSelectedPlan()?.monthlyPrice || 0}
                      </div>
                      <Chip color="success" size="sm" variant="flat">
                        Paid
                      </Chip>
                    </div>
                  </div>
                </div>
              </CardBody>
              <Divider />
              <CardFooter>
                <Button
                  color="primary"
                  size="sm"
                  startContent={<IoSwapHorizontalOutline />}
                  variant="flat"
                >
                  View Complete Transaction History
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </>
  );
}
