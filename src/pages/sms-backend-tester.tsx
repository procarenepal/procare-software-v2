import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  PhoneIcon,
  ClockIcon,
  SendIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  SettingsIcon,
  BarChart3Icon,
  ServerIcon,
  CalendarIcon,
  UserIcon,
  BuildingIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  smsBackendService,
  AppointmentData,
  ClinicSettings,
  CronStatus,
  SMSLog,
} from "../services/smsBackendService";

interface TestResult {
  type: "instant" | "schedule" | "cancel" | "cron" | "test-scheduling";
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
}

export default function SMSBackendTesterPage() {
  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [appointmentData, setAppointmentData] = useState<
    Partial<AppointmentData>
  >({
    appointmentId: "",
    patientPhone: "",
    doctorName: "Dr. Smith",
    appointmentTime: "",
    clinicName: "Test Clinic",
    appointmentType: "consultation",
    clinicId: "test_clinic",
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<string>("testing");

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
    loadSMSLogs();
  }, []);

  const checkBackendHealth = async () => {
    setBackendStatus("checking");
    try {
      const response = await smsBackendService.healthCheck();

      setBackendStatus(response.success ? "online" : "offline");
      if (!response.success) {
        toast.error("SMS Backend is not available");
      }
    } catch (error) {
      setBackendStatus("offline");
      toast.error("Failed to connect to SMS Backend");
    }
  };

  const loadSMSLogs = async () => {
    try {
      const response = await smsBackendService.getSMSLogs();

      if (response.success && response.data) {
        setSmsLogs(response.data);
      }
    } catch (error) {
      console.error("Failed to load SMS logs:", error);
    }
  };

  const loadCronStatus = async () => {
    try {
      const response = await smsBackendService.getCronStatus();

      if (response.success && response.data) {
        setCronStatus(response.data);
      }
    } catch (error) {
      console.error("Failed to load cron status:", error);
      toast.error("Failed to load cron status");
    }
  };

  const loadClinicSettings = async () => {
    if (!appointmentData.clinicId) {
      toast.error("Please enter a clinic ID first");

      return;
    }

    try {
      const response = await smsBackendService.getClinicSettings(
        appointmentData.clinicId,
      );

      if (response.success && response.data) {
        setClinicSettings(response.data);
        toast.success("Clinic settings loaded");
      } else {
        toast.error(response.error || "Failed to load clinic settings");
      }
    } catch (error) {
      console.error("Failed to load clinic settings:", error);
      toast.error("Failed to load clinic settings");
    }
  };

  const sendInstantSMS = async () => {
    if (!phoneNumber || !message) {
      toast.error("Phone number and message are required");

      return;
    }

    const validation = smsBackendService.validatePhoneNumber(phoneNumber);

    if (!validation.isValid) {
      toast.error(validation.message || "Invalid phone number");

      return;
    }

    setLoading(true);
    try {
      const response = await smsBackendService.sendInstantSMS(
        phoneNumber,
        message,
      );

      const result: TestResult = {
        type: "instant",
        success: response.success,
        message: response.success
          ? "Instant SMS sent successfully"
          : response.error || "Failed to send SMS",
        details: response.data,
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);

      if (response.success) {
        toast.success("Instant SMS sent successfully!");
        setPhoneNumber("");
        setMessage("");
        loadSMSLogs(); // Refresh logs
      } else {
        toast.error(response.error || "Failed to send SMS");
      }
    } catch (error) {
      const result: TestResult = {
        type: "instant",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);
      toast.error("Failed to send instant SMS");
    } finally {
      setLoading(false);
    }
  };

  const scheduleReminder = async () => {
    const validation =
      smsBackendService.validateAppointmentData(appointmentData);

    if (!validation.isValid) {
      toast.error(`Validation errors: ${validation.errors.join(", ")}`);

      return;
    }

    setLoading(true);
    try {
      const response = await smsBackendService.scheduleReminder(
        appointmentData as AppointmentData,
      );

      const result: TestResult = {
        type: "schedule",
        success: response.success,
        message: response.success
          ? "Reminder scheduled successfully"
          : response.error || "Failed to schedule reminder",
        details: response.data,
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);

      if (response.success) {
        toast.success("Reminder scheduled successfully!");
        // Clear appointment data but keep defaults
        setAppointmentData((prev) => ({
          ...prev,
          appointmentId: "",
          patientPhone: "",
          appointmentTime: "",
        }));
      } else {
        toast.error(response.error || "Failed to schedule reminder");
      }
    } catch (error) {
      const result: TestResult = {
        type: "schedule",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);
      toast.error("Failed to schedule reminder");
    } finally {
      setLoading(false);
    }
  };

  const cancelReminder = async () => {
    if (!appointmentData.appointmentId) {
      toast.error("Appointment ID is required to cancel reminder");

      return;
    }

    setLoading(true);
    try {
      const response = await smsBackendService.cancelReminder(
        appointmentData.appointmentId,
      );

      const result: TestResult = {
        type: "cancel",
        success: response.success,
        message: response.success
          ? "Reminder cancelled successfully"
          : response.error || "Failed to cancel reminder",
        details: response.data,
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);

      if (response.success) {
        toast.success("Reminder cancelled successfully!");
      } else {
        toast.error(response.error || "Failed to cancel reminder");
      }
    } catch (error) {
      const result: TestResult = {
        type: "cancel",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);
      toast.error("Failed to cancel reminder");
    } finally {
      setLoading(false);
    }
  };

  const testSchedulingLogic = async () => {
    if (!appointmentData.appointmentTime) {
      toast.error("Appointment time is required");

      return;
    }

    setLoading(true);
    try {
      const response = await smsBackendService.testScheduling(
        appointmentData.appointmentTime,
        appointmentData.clinicId,
      );

      const result: TestResult = {
        type: "test-scheduling",
        success: response.success,
        message: response.success
          ? "Scheduling logic test completed"
          : response.error || "Scheduling test failed",
        details: response.data,
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);

      if (response.success) {
        toast.success("Scheduling logic test completed!");
      } else {
        toast.error(response.error || "Scheduling test failed");
      }
    } catch (error) {
      const result: TestResult = {
        type: "test-scheduling",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);
      toast.error("Failed to test scheduling logic");
    } finally {
      setLoading(false);
    }
  };

  const triggerCronJob = async (
    jobType:
      | "process-reminders"
      | "discover-appointments"
      | "daily-cleanup"
      | "health-check",
  ) => {
    setLoading(true);
    try {
      const response = await smsBackendService.triggerCronJob(jobType);

      const result: TestResult = {
        type: "cron",
        success: response.success,
        message: response.success
          ? `Cron job '${jobType}' executed successfully`
          : response.error || "Cron job failed",
        details: response.data,
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);

      if (response.success) {
        toast.success(`Cron job '${jobType}' executed successfully!`);
        loadCronStatus(); // Refresh cron status
        loadSMSLogs(); // Refresh logs
      } else {
        toast.error(response.error || "Cron job failed");
      }
    } catch (error) {
      const result: TestResult = {
        type: "cron",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);
      toast.error("Failed to execute cron job");
    } finally {
      setLoading(false);
    }
  };

  const generateSampleAppointment = () => {
    const sample = smsBackendService.generateSampleAppointment();

    setAppointmentData(sample);
    toast.success("Sample appointment data generated");
  };

  const getMinDateTime = () => {
    const now = new Date();

    now.setMinutes(now.getMinutes() + 5); // At least 5 minutes in the future

    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SMS Backend Tester</h1>
        <p className="text-gray-600">
          Test the new Node.js Express SMS backend APIs
        </p>

        {/* Backend Status */}
        <div className="flex items-center gap-2 mt-4">
          <div
            className={`w-3 h-3 rounded-full ${
              backendStatus === "online"
                ? "bg-green-500"
                : backendStatus === "offline"
                  ? "bg-red-500"
                  : "bg-yellow-500"
            }`}
          />
          <span className="text-sm">
            Backend Status:{" "}
            {backendStatus === "online"
              ? "Online"
              : backendStatus === "offline"
                ? "Offline"
                : "Checking..."}
          </span>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onClick={checkBackendHealth}
          >
            <RefreshCwIcon size={16} />
          </Button>
        </div>
      </div>

      <Tabs
        className="w-full"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab
          key="testing"
          title={
            <div className="flex items-center gap-2">
              <SendIcon size={16} />
              Testing
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            {/* Testing Forms */}
            <div className="space-y-6">
              {/* Instant SMS Test */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <SendIcon size={20} />
                    Instant SMS Test
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Input
                    description="Format: +1234567890 or 1234567890"
                    label="Phone Number"
                    placeholder="Enter phone number"
                    startContent={<PhoneIcon size={16} />}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <Textarea
                    description="Test message content"
                    label="Message"
                    minRows={3}
                    placeholder="Enter your test message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button
                    color="primary"
                    isDisabled={backendStatus !== "online"}
                    isLoading={loading}
                    startContent={!loading && <SendIcon size={16} />}
                    onClick={sendInstantSMS}
                  >
                    Send Instant SMS
                  </Button>
                </CardBody>
              </Card>

              {/* Appointment Reminder Test */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <CalendarIcon size={20} />
                      Schedule Reminder Test
                    </h2>
                    <Button
                      size="sm"
                      variant="bordered"
                      onClick={generateSampleAppointment}
                    >
                      Generate Sample
                    </Button>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Appointment ID"
                      placeholder="e.g., apt_123"
                      value={appointmentData.appointmentId || ""}
                      onChange={(e) =>
                        setAppointmentData((prev) => ({
                          ...prev,
                          appointmentId: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Patient Phone"
                      placeholder="+1234567890"
                      startContent={<PhoneIcon size={16} />}
                      value={appointmentData.patientPhone || ""}
                      onChange={(e) =>
                        setAppointmentData((prev) => ({
                          ...prev,
                          patientPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Doctor Name"
                      placeholder="Dr. Smith"
                      startContent={<UserIcon size={16} />}
                      value={appointmentData.doctorName || ""}
                      onChange={(e) =>
                        setAppointmentData((prev) => ({
                          ...prev,
                          doctorName: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Clinic Name"
                      placeholder="Test Clinic"
                      startContent={<BuildingIcon size={16} />}
                      value={appointmentData.clinicName || ""}
                      onChange={(e) =>
                        setAppointmentData((prev) => ({
                          ...prev,
                          clinicName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Appointment Time"
                      min={getMinDateTime()}
                      type="datetime-local"
                      value={appointmentData.appointmentTime || ""}
                      onChange={(e) =>
                        setAppointmentData((prev) => ({
                          ...prev,
                          appointmentTime: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Appointment Type"
                      placeholder="consultation"
                      value={appointmentData.appointmentType || ""}
                      onChange={(e) =>
                        setAppointmentData((prev) => ({
                          ...prev,
                          appointmentType: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Input
                    label="Clinic ID"
                    placeholder="test_clinic"
                    value={appointmentData.clinicId || ""}
                    onChange={(e) =>
                      setAppointmentData((prev) => ({
                        ...prev,
                        clinicId: e.target.value,
                      }))
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      color="secondary"
                      isDisabled={backendStatus !== "online"}
                      isLoading={loading}
                      startContent={!loading && <ClockIcon size={16} />}
                      onClick={scheduleReminder}
                    >
                      Schedule Reminder
                    </Button>
                    <Button
                      color="warning"
                      isDisabled={
                        backendStatus !== "online" ||
                        !appointmentData.appointmentId
                      }
                      isLoading={loading}
                      variant="bordered"
                      onClick={cancelReminder}
                    >
                      Cancel Reminder
                    </Button>
                    <Button
                      color="primary"
                      isDisabled={
                        backendStatus !== "online" ||
                        !appointmentData.appointmentTime
                      }
                      isLoading={loading}
                      variant="bordered"
                      onClick={testSchedulingLogic}
                    >
                      Test Scheduling Logic
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Test Results */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Test Results</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No test results yet
                      </p>
                    ) : (
                      testResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            result.success
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <CheckCircleIcon
                                  className="text-green-600"
                                  size={16}
                                />
                              ) : (
                                <AlertCircleIcon
                                  className="text-red-600"
                                  size={16}
                                />
                              )}
                              <span className="font-medium capitalize">
                                {result.type} Test
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {result.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{result.message}</p>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-600 cursor-pointer">
                                Details
                              </summary>
                              <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab
          key="cron"
          title={
            <div className="flex items-center gap-2">
              <ServerIcon size={16} />
              Cron Jobs
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            {/* Cron Job Controls */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <ServerIcon size={20} />
                      Manual Cron Job Triggers
                    </h2>
                    <Button
                      size="sm"
                      variant="bordered"
                      onClick={loadCronStatus}
                    >
                      <RefreshCwIcon size={16} />
                      Refresh Status
                    </Button>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      color="primary"
                      isDisabled={backendStatus !== "online"}
                      isLoading={loading}
                      startContent={!loading && <RefreshCwIcon size={16} />}
                      onClick={() => triggerCronJob("process-reminders")}
                    >
                      Process Reminders
                    </Button>
                    <Button
                      color="secondary"
                      isDisabled={backendStatus !== "online"}
                      isLoading={loading}
                      startContent={!loading && <CalendarIcon size={16} />}
                      onClick={() => triggerCronJob("discover-appointments")}
                    >
                      Discover Appointments
                    </Button>
                    <Button
                      color="warning"
                      isDisabled={backendStatus !== "online"}
                      isLoading={loading}
                      onClick={() => triggerCronJob("daily-cleanup")}
                    >
                      Daily Cleanup
                    </Button>
                    <Button
                      color="success"
                      isDisabled={backendStatus !== "online"}
                      isLoading={loading}
                      onClick={() => triggerCronJob("health-check")}
                    >
                      Health Check
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Cron Status Display */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Cron Job Status</h2>
                </CardHeader>
                <CardBody>
                  {cronStatus ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Schedules</h3>
                        <div className="space-y-1 text-sm">
                          {Object.entries(cronStatus.cronJobs.schedules).map(
                            ([job, schedule]) => (
                              <div key={job} className="flex justify-between">
                                <span className="capitalize">
                                  {job.replace(/([A-Z])/g, " $1")}
                                </span>
                                <span className="text-gray-600">
                                  {schedule}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                      <Divider />
                      <div>
                        <h3 className="font-medium mb-2">Statistics</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">
                              Pending Reminders
                            </div>
                            <div className="text-lg font-semibold">
                              {cronStatus.statistics.pendingReminders}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">
                              Upcoming Reminders
                            </div>
                            <div className="text-lg font-semibold">
                              {cronStatus.statistics.upcomingReminders}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">SMS Sent Today</div>
                            <div className="text-lg font-semibold text-green-600">
                              {cronStatus.statistics.todaysSms.sent}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">
                              SMS Failed Today
                            </div>
                            <div className="text-lg font-semibold text-red-600">
                              {cronStatus.statistics.todaysSms.failed}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Button
                        isDisabled={backendStatus !== "online"}
                        onClick={loadCronStatus}
                      >
                        Load Cron Status
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab
          key="logs"
          title={
            <div className="flex items-center gap-2">
              <BarChart3Icon size={16} />
              Logs & Settings
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            {/* SMS Logs */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">SMS Logs</h2>
                <Button size="sm" variant="bordered" onClick={loadSMSLogs}>
                  <RefreshCwIcon size={16} />
                  Refresh
                </Button>
              </CardHeader>
              <CardBody>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {smsLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No logs available
                    </p>
                  ) : (
                    smsLogs.map((log, index) => (
                      <div key={index} className="p-2 border rounded-lg">
                        <div className="flex justify-between items-start text-sm">
                          <span className="font-medium">
                            {smsBackendService.formatPhoneNumber(
                              log.phoneNumber,
                            )}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              log.status === "sent"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {log.message}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                          <span>{log.type}</span>
                          <span>
                            {log.sentAt
                              ? new Date(log.sentAt).toLocaleString()
                              : log.attemptedAt
                                ? new Date(log.attemptedAt).toLocaleString()
                                : "N/A"}
                          </span>
                        </div>
                        {log.error && (
                          <p className="text-xs text-red-600 mt-1">
                            {log.error}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Clinic Settings */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Clinic Settings</h2>
                <Button
                  size="sm"
                  variant="bordered"
                  onClick={loadClinicSettings}
                >
                  <SettingsIcon size={16} />
                  Load Settings
                </Button>
              </CardHeader>
              <CardBody>
                {clinicSettings ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>SMS Enabled</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          clinicSettings.enabled
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {clinicSettings.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Advance Notice Hours</span>
                      <span>{clinicSettings.advanceNoticeHours}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Business Hours Only</span>
                      <span>
                        {clinicSettings.businessHoursOnly ? "Yes" : "No"}
                      </span>
                    </div>
                    {clinicSettings.businessHoursOnly && (
                      <div className="flex justify-between items-center">
                        <span>Business Hours</span>
                        <span>
                          {clinicSettings.businessStartHour}:00 -{" "}
                          {clinicSettings.businessEndHour}:00
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium mb-2">
                        Enabled Appointment Types
                      </div>
                      <div className="text-sm">
                        {clinicSettings.enabledAppointmentTypes.length === 0 ? (
                          <span className="text-gray-500">
                            All types enabled
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {clinicSettings.enabledAppointmentTypes.map(
                              (type, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                >
                                  {type}
                                </span>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">
                      No clinic settings loaded
                    </p>
                    <p className="text-xs text-gray-400">
                      Enter a clinic ID in the appointment form and click "Load
                      Settings"
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
