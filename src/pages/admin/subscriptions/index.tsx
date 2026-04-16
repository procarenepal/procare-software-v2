import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoSearchOutline,
  IoCashOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoCloseCircleOutline,
  IoRefreshOutline,
  IoAddOutline,
  IoSettingsOutline,
} from "react-icons/io5";

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Chip,
  Input,
  Select,
  SelectItem,
  Progress,
  Spinner,
} from "@/components/ui";
import { title } from "@/components/primitives";
import { clinicService } from "@/services/clinicService";
import { subscriptionService } from "@/services/subscriptionService";
import { Clinic, SubscriptionPlan } from "@/types/models";

export default function SubscriptionsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    suspended: number;
    cancelled: number;
    byPlan: Record<string, number>;
    byType?: {
      monthly: number;
      yearly: number;
    };
  }>({
    total: 0,
    active: 0,
    suspended: 0,
    cancelled: 0,
    byPlan: {},
    byType: {
      monthly: 0,
      yearly: 0,
    },
  });

  // Load subscriptions data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const allClinics = await clinicService.getAllClinics();
        const allPlans = await subscriptionService.getAllSubscriptionPlans();
        const subStats =
          await subscriptionService.getDetailedSubscriptionStats();

        setClinics(allClinics);
        setPlans(allPlans);
        setStats(subStats);
      } catch (err) {
        console.error("Error fetching subscription data:", err);
        setError("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and search functions
  const filteredClinics = clinics.filter((clinic) => {
    // Apply search
    const matchesSearch =
      searchQuery === "" ||
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply status filter
    const matchesStatus =
      filterStatus === "all" || clinic.subscriptionStatus === filterStatus;

    // Apply plan filter
    const matchesPlan =
      filterPlan === "all" || clinic.subscriptionPlan === filterPlan;

    // Apply subscription type filter
    const matchesType =
      filterType === "all" || clinic.subscriptionType === filterType;

    return matchesSearch && matchesStatus && matchesPlan && matchesType;
  });

  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);

      if (isNaN(dateObj.getTime())) return "Invalid Date";

      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);

      return "Invalid Date";
    }
  };

  // Get plan name by ID
  const getPlanNameById = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);

    return plan ? plan.name : "Unknown Plan";
  };

  // Check if subscription is expired or expiring soon
  const getSubscriptionStatus = (clinic: Clinic) => {
    if (!clinic.subscriptionEndDate) return { status: "active", message: "" };

    const endDate = new Date(clinic.subscriptionEndDate);
    const today = new Date();
    const daysLeft = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysLeft < 0) {
      return {
        status: "expired",
        message: "Expired",
        color: "danger" as const,
      };
    } else if (daysLeft <= 7) {
      return {
        status: "expiring",
        message: `Expires in ${daysLeft} days`,
        color: "warning" as const,
      };
    } else if (daysLeft <= 30) {
      return {
        status: "expiring-soon",
        message: `Expires in ${daysLeft} days`,
        color: "primary" as const,
      };
    }

    return { status: "active", message: "", color: undefined };
  };

  // Handle status update
  const handleStatusUpdate = async (
    clinicId: string,
    newStatus: "active" | "suspended" | "cancelled",
  ) => {
    try {
      setLoading(true);
      await clinicService.updateSubscriptionStatus(clinicId, newStatus);

      // Update local state
      setClinics((prevClinics) =>
        prevClinics.map((clinic) =>
          clinic.id === clinicId
            ? { ...clinic, subscriptionStatus: newStatus }
            : clinic,
        ),
      );

      // Refresh stats
      const subStats = await subscriptionService.getDetailedSubscriptionStats();

      setStats(subStats);
    } catch (error) {
      console.error("Error updating subscription status:", error);
      setError("Failed to update subscription status. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner label="Loading subscription data..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardBody>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <IoAlertCircleOutline className="w-12 h-12 text-red-600" />
            <div className="text-center">
              <p className="text-xl font-semibold text-red-600">{error}</p>
              <p className="text-sm text-red-600/80 mt-1">
                Please try again or contact support if the issue persists.
              </p>
            </div>
            <Button
              color="warning"
              startContent={<IoRefreshOutline />}
              variant="bordered"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className={title({ size: "sm" })}>Subscription Management</h1>
          <p className="text-mountain-600 mt-2">
            Manage clinic subscriptions and plans
          </p>
        </div>

        <div className="flex gap-2 mt-4 sm:mt-0">
          <Link to="/admin/subscriptions/plans">
            <Button color="primary" startContent={<IoSettingsOutline />}>
              Manage Plans
            </Button>
          </Link>
          <Link to="/admin/clinics/new">
            <Button color="secondary" startContent={<IoAddOutline />}>
              New Clinic
            </Button>
          </Link>
        </div>
      </div>

      {/* Subscription Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-teal-50 border border-teal-100">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-mountain-700">
                  Total Subscriptions
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <IoCashOutline className="w-5 h-5 text-teal-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-health-50 border border-health-100">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-mountain-700">Active</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{stats.active}</p>
                  {stats.total > 0 && (
                    <Chip color="success" size="sm">
                      {Math.round((stats.active / stats.total) * 100)}%
                    </Chip>
                  )}
                </div>
              </div>
              <div className="p-3 bg-health-100 rounded-lg">
                <IoCheckmarkCircleOutline className="w-5 h-5 text-health-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-saffron-50 border border-saffron-100">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-mountain-700">
                  Suspended
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{stats.suspended}</p>
                  {stats.total > 0 && (
                    <Chip color="warning" size="sm">
                      {Math.round((stats.suspended / stats.total) * 100)}%
                    </Chip>
                  )}
                </div>
              </div>
              <div className="p-3 bg-saffron-100 rounded-lg">
                <IoAlertCircleOutline className="w-5 h-5 text-saffron-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-red-50 border border-red-100">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-mountain-700">
                  Cancelled
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                  {stats.total > 0 && (
                    <Chip color="danger" size="sm">
                      {Math.round((stats.cancelled / stats.total) * 100)}%
                    </Chip>
                  )}
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <IoCloseCircleOutline className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Subscription Type Distribution */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Subscription Type Distribution
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Subscriptions */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Monthly Subscriptions
                </span>
                <span className="text-sm font-medium">
                  {stats.byType?.monthly || 0} clinics
                </span>
              </div>
              <Progress
                className="h-2"
                color="primary"
                size="sm"
                value={
                  stats.total
                    ? ((stats.byType?.monthly || 0) / stats.total) * 100
                    : 0
                }
              />
              <div className="text-xs text-mountain-500 text-right">
                {stats.total
                  ? Math.round(
                      ((stats.byType?.monthly || 0) / stats.total) * 100,
                    )
                  : 0}
                % of total
              </div>
            </div>

            {/* Yearly Subscriptions */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Yearly Subscriptions
                </span>
                <span className="text-sm font-medium">
                  {stats.byType?.yearly || 0} clinics
                </span>
              </div>
              <Progress
                className="h-2"
                color="secondary"
                size="sm"
                value={
                  stats.total
                    ? ((stats.byType?.yearly || 0) / stats.total) * 100
                    : 0
                }
              />
              <div className="text-xs text-mountain-500 text-right">
                {stats.total
                  ? Math.round(
                      ((stats.byType?.yearly || 0) / stats.total) * 100,
                    )
                  : 0}
                % of total
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              className="flex-1"
              placeholder="Search clinics..."
              size="sm"
              startContent={<IoSearchOutline className="text-mountain-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex gap-2">
              <Select
                className="w-40"
                placeholder="Status"
                selectedKeys={filterStatus ? [filterStatus] : []}
                size="sm"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  setFilterStatus(selected || "all");
                }}
              >
                <SelectItem key="all">All Status</SelectItem>
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="suspended">Suspended</SelectItem>
                <SelectItem key="cancelled">Cancelled</SelectItem>
              </Select>
              <Select
                className="w-48"
                items={[{ id: "all", name: "All Plans" }, ...plans]}
                placeholder="Plan"
                selectedKeys={filterPlan ? [filterPlan] : []}
                size="sm"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  setFilterPlan(selected || "all");
                }}
              >
                {(plan) => <SelectItem key={plan.id}>{plan.name}</SelectItem>}
              </Select>
              <Select
                className="w-36"
                placeholder="Type"
                selectedKeys={filterType ? [filterType] : []}
                size="sm"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  setFilterType(selected || "all");
                }}
              >
                <SelectItem key="all">All Types</SelectItem>
                <SelectItem key="monthly">Monthly</SelectItem>
                <SelectItem key="yearly">Yearly</SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Subscription Table */}
      <Card className="shadow-md">
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold">Clinic Subscriptions</h2>
            <p className="text-sm text-mountain-500">
              Showing {filteredClinics.length} of {clinics.length} subscriptions
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-mountain-50">
                  <th className="py-3 px-4 text-left text-xs font-medium text-mountain-700">
                    Clinic
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-mountain-700">
                    Plan
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-mountain-700">
                    Type
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-mountain-700">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-mountain-700">
                    Start Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-mountain-700">
                    End Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-mountain-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mountain-100">
                {filteredClinics.map((clinic) => (
                  <tr
                    key={clinic.id}
                    className="group hover:bg-mountain-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium">{clinic.name}</div>
                      <div className="text-xs text-mountain-500">
                        {clinic.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{getPlanNameById(clinic.subscriptionPlan)}</div>
                      {clinic.subscriptionType === "monthly" ? (
                        <div className="text-xs text-mountain-500">
                          {(() => {
                            const plan = plans.find(
                              (p) => p.id === clinic.subscriptionPlan,
                            );

                            if (!plan) return "N/A";

                            return `NPR ${plan.discountedMonthlyPrice || plan.monthlyPrice}/month`;
                          })()}
                        </div>
                      ) : (
                        <div className="text-xs text-mountain-500">
                          {(() => {
                            const plan = plans.find(
                              (p) => p.id === clinic.subscriptionPlan,
                            );

                            if (!plan) return "N/A";

                            return `NPR ${plan.discountedYearlyPrice || plan.yearlyPrice}/year`;
                          })()}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        color={
                          clinic.subscriptionType === "yearly"
                            ? "primary"
                            : "default"
                        }
                        variant="flat"
                      >
                        {clinic.subscriptionType
                          ? clinic.subscriptionType.charAt(0).toUpperCase() +
                            clinic.subscriptionType.slice(1)
                          : "Monthly"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        color={
                          clinic.subscriptionStatus === "active"
                            ? "success"
                            : clinic.subscriptionStatus === "suspended"
                              ? "warning"
                              : "danger"
                        }
                        variant="flat"
                      >
                        {clinic.subscriptionStatus.charAt(0).toUpperCase() +
                          clinic.subscriptionStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {formatDate(clinic.subscriptionStartDate)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {formatDate(clinic.subscriptionEndDate)}
                      </div>
                      {(() => {
                        const { status, message, color } =
                          getSubscriptionStatus(clinic);

                        if (message && status !== "active") {
                          return (
                            <div className="text-xs mt-1">
                              <Chip color={color} size="sm" variant="flat">
                                {message}
                              </Chip>
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/subscriptions/edit/${clinic.id}`}>
                          <Button color="primary" size="sm" variant="flat">
                            Edit
                          </Button>
                        </Link>
                        {clinic.subscriptionStatus === "active" ? (
                          <Button
                            color="warning"
                            size="sm"
                            variant="flat"
                            onClick={() =>
                              handleStatusUpdate(clinic.id, "suspended")
                            }
                          >
                            Suspend
                          </Button>
                        ) : clinic.subscriptionStatus === "suspended" ? (
                          <Button
                            color="success"
                            size="sm"
                            variant="flat"
                            onClick={() =>
                              handleStatusUpdate(clinic.id, "active")
                            }
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button
                            color="success"
                            size="sm"
                            variant="flat"
                            onClick={() =>
                              handleStatusUpdate(clinic.id, "active")
                            }
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredClinics.length === 0 && (
                  <tr>
                    <td className="py-8" colSpan={7}>
                      <div className="text-center">
                        <p className="text-mountain-500 mb-2">
                          No subscriptions match your filters.
                        </p>
                        <Button
                          color="primary"
                          size="sm"
                          variant="flat"
                          onClick={() => {
                            setSearchQuery("");
                            setFilterStatus("all");
                            setFilterPlan("all");
                            setFilterType("all");
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
