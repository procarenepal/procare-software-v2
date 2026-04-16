import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoBusinessOutline,
  IoCheckmarkCircleOutline,
  IoStatsChartOutline,
  IoSpeedometerOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoAlertCircleOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoAddCircleOutline,
} from "react-icons/io5";

import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Input,
  Chip,
  Progress,
  Spinner,
} from "@/components/ui";
import { title } from "@/components/primitives";
import { clinicService } from "@/services/clinicService";
import { useAuthContext } from "@/context/AuthContext";
import { Clinic } from "@/types/models";

// Admin dashboard layout

export default function AdminPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicCount, setClinicCount] = useState<number>(0);
  const [activeClinicCount, setActiveClinicCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useAuthContext();

  // Load clinics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const allClinics = await clinicService.getAllClinics();

        setClinics(allClinics);
        setClinicCount(allClinics.length);
        const activeCount = allClinics.filter(
          (c) => c.subscriptionStatus === "active",
        ).length;

        setActiveClinicCount(activeCount);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load platform data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner label="Loading dashboard data..." size="lg" />
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
              className="mt-2"
              color="warning"
              variant="flat"
              onClick={() => window.location.reload()}
            >
              Retry Loading
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  const subscriptionRate =
    clinicCount > 0 ? Math.round((activeClinicCount / clinicCount) * 100) : 0;

  // Compute meaningful subscription insights from real data
  const now = new Date();
  const thirtyDaysFromNow = new Date(now);

  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const thirtyDaysAgo = new Date(now);

  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const expiringSoon = clinics.filter((c) => {
    if (!c.subscriptionEndDate || c.subscriptionStatus !== "active")
      return false;
    const end =
      c.subscriptionEndDate instanceof Date
        ? c.subscriptionEndDate
        : new Date(String(c.subscriptionEndDate));

    return end >= now && end <= thirtyDaysFromNow;
  });

  const suspended = clinics.filter((c) => c.subscriptionStatus === "suspended");
  const newThisMonth = clinics.filter((c) => {
    const created =
      c.createdAt instanceof Date ? c.createdAt : new Date(String(c.createdAt));

    return created >= thirtyDaysAgo;
  });

  return (
    <>
      {/* Admin welcome header with search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className={title({ size: "sm" })}>Platform Overview</h1>
          <p className="text-mountain-600 mt-2">
            Monitor and manage the entire healthcare platform from this central
            dashboard.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            className="w-full md:w-72"
            placeholder="Search clinics..."
            size="sm"
            startContent={<IoSearchOutline className="text-mountain-400" />}
          />
          <Button
            isIconOnly
            className="bg-mountain-100"
            size="sm"
            variant="flat"
          >
            <IoFilterOutline />
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-teal-50 border border-teal-100">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-mountain-600">
                  Total Clinics
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold">{clinicCount}</p>
                  <Chip color="primary" size="sm">
                    +4 new
                  </Chip>
                </div>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <IoBusinessOutline className="w-6 h-6 text-teal-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-health-50 border border-health-100">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-mountain-600">
                  Active Clinics
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold">{activeClinicCount}</p>
                  <Chip color="success" size="sm">
                    Active
                  </Chip>
                </div>
              </div>
              <div className="p-3 bg-health-100 rounded-lg">
                <IoCheckmarkCircleOutline className="w-6 h-6 text-health-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-saffron-50 border border-saffron-100">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-mountain-600">
                  Subscription Rate
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold">{subscriptionRate}%</p>
                  <Chip color="warning" size="sm">
                    Active
                  </Chip>
                </div>
              </div>
              <div className="p-3 bg-saffron-100 rounded-lg">
                <IoStatsChartOutline className="w-6 h-6 text-saffron-600" />
              </div>
            </div>
            <Progress
              className="mt-4"
              color="warning"
              value={subscriptionRate}
            />
          </CardBody>
        </Card>

        <Card className="bg-health-50 border border-health-100">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-mountain-600">
                  Platform Health
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold">98%</p>
                  <Chip color="secondary" size="sm">
                    Excellent
                  </Chip>
                </div>
              </div>
              <div className="p-3 bg-health-100 rounded-lg">
                <IoSpeedometerOutline className="w-6 h-6 text-health-600" />
              </div>
            </div>
            <Progress className="mt-4" color="success" value={98} />
          </CardBody>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="mb-8 bg-mountain-50 border border-mountain-200">
        <CardHeader>
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/clinics/new">
              <Button
                color="primary"
                startContent={<IoBusinessOutline />}
                variant="solid"
              >
                Register New Clinic
              </Button>
            </Link>
            <Link to="/admin/clinics">
              <Button
                color="secondary"
                startContent={<IoFilterOutline />}
                variant="bordered"
              >
                Manage Clinics
              </Button>
            </Link>
            <Link to="/admin/subscriptions">
              <Button
                color="success"
                startContent={<IoStatsChartOutline />}
                variant="bordered"
              >
                View Subscriptions
              </Button>
            </Link>
            <Link to="/admin/clinics/impersonation">
              <Button
                color="primary"
                startContent={<IoPersonOutline />}
                variant="bordered"
              >
                Clinic Impersonation
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent clinics */}
        <Card className="lg:col-span-2 border border-mountain-200">
          <CardHeader className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Recent Clinics</h2>
              <p className="text-sm text-mountain-500">
                Latest registered healthcare facilities
              </p>
            </div>
            <Link to="/admin/clinics">
              <Button color="primary" size="sm" variant="light">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full clarity-table">
                <thead>
                  <tr className="bg-mountain-50">
                    <th className="py-3 px-4 text-left text-xs font-medium text-mountain-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-mountain-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-mountain-600 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-mountain-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mountain-100">
                  {clinics.slice(0, 5).map((clinic) => (
                    <tr
                      key={clinic.id}
                      className="group hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium">{clinic.name}</div>
                        <div className="text-xs text-mountain-500">
                          {clinic.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Chip
                          color={
                            clinic.subscriptionStatus === "active"
                              ? "success"
                              : clinic.subscriptionStatus === "suspended"
                                ? "warning"
                                : "danger"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {clinic.subscriptionStatus.charAt(0).toUpperCase() +
                            clinic.subscriptionStatus.slice(1)}
                        </Chip>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-medium">
                            CA
                          </div>
                          <span className="text-sm">Clinic Admin</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/admin/clinics/${clinic.id}`}>
                            <Button color="primary" size="sm" variant="flat">
                              View
                            </Button>
                          </Link>
                          <Link to={`/admin/clinics/${clinic.id}/edit`}>
                            <Button
                              color="secondary"
                              size="sm"
                              variant="bordered"
                            >
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {clinics.length === 0 && (
                    <tr>
                      <td className="py-8" colSpan={4}>
                        <div className="text-center">
                          <p className="text-mountain-500 mb-2">
                            No clinics registered yet.
                          </p>
                          <Link to="/admin/clinics/new">
                            <Button color="primary" size="sm" variant="flat">
                              Register your first clinic
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Subscriptions & Renewals — actionable insights */}
        <Card className="border border-mountain-200">
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold">
                Subscriptions & Renewals
              </h2>
              <p className="text-sm text-mountain-500">
                Actionable insights from your platform
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {/* Expiring soon */}
              <div className="rounded-md border border-saffron-200 bg-saffron-50/50 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <IoTimeOutline className="w-4 h-4 text-saffron-600" />
                    <span className="text-sm font-medium text-saffron-800">
                      Expiring in 30 days
                    </span>
                  </div>
                  <span className="text-lg font-bold text-saffron-700">
                    {expiringSoon.length}
                  </span>
                </div>
                <p className="text-xs text-saffron-700/80">
                  Active subscriptions ending soon — follow up for renewal
                </p>
                {expiringSoon.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {expiringSoon.slice(0, 3).map((c) => {
                      const end =
                        c.subscriptionEndDate instanceof Date
                          ? c.subscriptionEndDate
                          : new Date(String(c.subscriptionEndDate));

                      return (
                        <li key={c.id} className="text-xs flex justify-between">
                          <Link
                            className="text-teal-700 hover:underline truncate mr-2"
                            to={`/admin/clinics/${c.id}`}
                          >
                            {c.name}
                          </Link>
                          <span className="text-saffron-600 shrink-0">
                            {end.toLocaleDateString()}
                          </span>
                        </li>
                      );
                    })}
                    {expiringSoon.length > 3 && (
                      <li className="text-xs text-mountain-500">
                        +{expiringSoon.length - 3} more
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Suspended */}
              <div className="rounded-md border border-red-200 bg-red-50/50 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <IoAlertCircleOutline className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      Suspended
                    </span>
                  </div>
                  <span className="text-lg font-bold text-red-700">
                    {suspended.length}
                  </span>
                </div>
                <p className="text-xs text-red-700/80">
                  Clinics with suspended access — review and reactivate
                </p>
                {suspended.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {suspended.slice(0, 3).map((c) => (
                      <li key={c.id} className="text-xs">
                        <Link
                          className="text-teal-700 hover:underline truncate block"
                          to={`/admin/clinics/${c.id}`}
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                    {suspended.length > 3 && (
                      <li className="text-xs text-mountain-500">
                        +{suspended.length - 3} more
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* New this month */}
              <div className="rounded-md border border-health-200 bg-health-50/50 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <IoAddCircleOutline className="w-4 h-4 text-health-600" />
                    <span className="text-sm font-medium text-health-800">
                      New this month
                    </span>
                  </div>
                  <span className="text-lg font-bold text-health-700">
                    {newThisMonth.length}
                  </span>
                </div>
                <p className="text-xs text-health-700/80">
                  Clinics registered in the last 30 days
                </p>
              </div>
            </div>
          </CardBody>
          <CardFooter>
            <Link className="w-full" to="/admin/subscriptions">
              <Button
                fullWidth
                color="primary"
                size="sm"
                startContent={<IoStatsChartOutline className="w-4 h-4" />}
                variant="flat"
              >
                Manage Subscriptions
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
