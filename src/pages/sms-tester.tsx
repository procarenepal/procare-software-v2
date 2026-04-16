import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardBody,
  CardHeader,
} from "@heroui/react";
import {
  PhoneIcon,
  MessageSquareIcon,
  ClockIcon,
  SendIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import { smsTestService, SMSTestLog } from "../services/smsTestService";

interface TestResult {
  type: "single" | "batch" | "scheduled";
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
}

export default function SMSTesterPage() {
  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [batchRecipients, setBatchRecipients] = useState<
    Array<{ phoneNumber: string; message: string }>
  >([{ phoneNumber: "", message: "" }]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<SMSTestLog[]>([]);
  const [functionStatus, setFunctionStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

  // Check function health on mount
  useEffect(() => {
    checkFunctionHealth();
  }, []);

  const checkFunctionHealth = async () => {
    setFunctionStatus("checking");
    try {
      const response = await smsTestService.healthCheck();

      setFunctionStatus(response.success ? "online" : "offline");
      if (!response.success) {
        toast.error("SMS function is not available");
      }
    } catch (error) {
      setFunctionStatus("offline");
      toast.error("Failed to connect to SMS function");
    }
  };

  const sendTestSMS = async () => {
    if (!phoneNumber || !message) {
      toast.error("Phone number and message are required");

      return;
    }

    const validation = smsTestService.validatePhoneNumber(phoneNumber);

    if (!validation.isValid) {
      toast.error(validation.message || "Invalid phone number");

      return;
    }

    setLoading(true);
    try {
      const response = await smsTestService.sendTestSMS(phoneNumber, message);

      const result: TestResult = {
        type: "single",
        success: response.success,
        message: response.success
          ? "SMS sent successfully"
          : response.error || "Failed to send SMS",
        details: response.data,
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);

      if (response.success) {
        toast.success("Test SMS sent successfully!");
        setPhoneNumber("");
        setMessage("");
      } else {
        toast.error(response.error || "Failed to send SMS");
      }
    } catch (error) {
      const result: TestResult = {
        type: "single",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);
      toast.error("Failed to send test SMS");
    } finally {
      setLoading(false);
    }
  };

  const sendBatchTest = async () => {
    const validRecipients = batchRecipients.filter(
      (r) => r.phoneNumber && r.message,
    );

    if (validRecipients.length === 0) {
      toast.error("Please add at least one valid recipient");

      return;
    }

    // Validate phone numbers
    for (const recipient of validRecipients) {
      const validation = smsTestService.validatePhoneNumber(
        recipient.phoneNumber,
      );

      if (!validation.isValid) {
        toast.error(`Invalid phone number: ${recipient.phoneNumber}`);

        return;
      }
    }

    setLoading(true);
    try {
      const response = await smsTestService.sendBatchTest(validRecipients);

      const result: TestResult = {
        type: "batch",
        success: response.success,
        message: response.success
          ? `Batch test completed: ${response.data?.successful || 0}/${response.data?.total || 0} successful`
          : response.error || "Batch test failed",
        details: response.data,
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);

      if (response.success) {
        toast.success(
          `Batch test completed: ${response.data?.successful || 0}/${response.data?.total || 0} successful`,
        );
        setBatchRecipients([{ phoneNumber: "", message: "" }]);
      } else {
        toast.error(response.error || "Batch test failed");
      }
    } catch (error) {
      const result: TestResult = {
        type: "batch",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);
      toast.error("Failed to send batch test");
    } finally {
      setLoading(false);
    }
  };

  const scheduleTest = async () => {
    if (!phoneNumber || !message || !scheduledTime) {
      toast.error("All fields are required for scheduled test");

      return;
    }

    const validation = smsTestService.validatePhoneNumber(phoneNumber);

    if (!validation.isValid) {
      toast.error(validation.message || "Invalid phone number");

      return;
    }

    const scheduleDate = new Date(scheduledTime);

    if (scheduleDate <= new Date()) {
      toast.error("Scheduled time must be in the future");

      return;
    }

    setLoading(true);
    try {
      // Convert to ISO string to include timezone information
      const scheduledTimeISO = scheduleDate.toISOString();
      const response = await smsTestService.scheduleTest(
        phoneNumber,
        message,
        scheduledTimeISO,
      );

      const result: TestResult = {
        type: "scheduled",
        success: response.success,
        message: response.success
          ? `SMS scheduled for ${new Date(scheduledTime).toLocaleString()}`
          : response.error || "Failed to schedule SMS",
        details: response.data,
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);

      if (response.success) {
        toast.success("SMS scheduled successfully!");
        setPhoneNumber("");
        setMessage("");
        setScheduledTime("");
      } else {
        toast.error(response.error || "Failed to schedule SMS");
      }
    } catch (error) {
      const result: TestResult = {
        type: "scheduled",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };

      setTestResults((prev) => [result, ...prev]);
      toast.error("Failed to schedule SMS");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await smsTestService.getTestLogs();

      if (response.success && response.data) {
        setLogs(response.data);
        toast.success("Logs refreshed");
      } else {
        toast.error("Failed to fetch logs");
      }
    } catch (error) {
      toast.error("Failed to fetch logs");
    }
  };

  const addBatchRecipient = () => {
    setBatchRecipients((prev) => [...prev, { phoneNumber: "", message: "" }]);
  };

  const removeBatchRecipient = (index: number) => {
    setBatchRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBatchRecipient = (
    index: number,
    field: "phoneNumber" | "message",
    value: string,
  ) => {
    setBatchRecipients((prev) =>
      prev.map((recipient, i) =>
        i === index ? { ...recipient, [field]: value } : recipient,
      ),
    );
  };

  const getMinDateTime = () => {
    const now = new Date();

    now.setMinutes(now.getMinutes() + 1); // At least 1 minute in the future

    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SMS Tester</h1>
        <p className="text-gray-600">
          Test SMS functionality using Appwrite functions
        </p>

        {/* Function Status */}
        <div className="flex items-center gap-2 mt-4">
          <div
            className={`w-3 h-3 rounded-full ${
              functionStatus === "online"
                ? "bg-green-500"
                : functionStatus === "offline"
                  ? "bg-red-500"
                  : "bg-yellow-500"
            }`}
          />
          <span className="text-sm">
            Function Status:{" "}
            {functionStatus === "online"
              ? "Online"
              : functionStatus === "offline"
                ? "Offline"
                : "Checking..."}
          </span>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onClick={checkFunctionHealth}
          >
            <RefreshCwIcon size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Testing Forms */}
        <div className="space-y-6">
          {/* Single SMS Test */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <SendIcon size={20} />
                Single SMS Test
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
                isDisabled={functionStatus !== "online"}
                isLoading={loading}
                startContent={!loading && <SendIcon size={16} />}
                onClick={sendTestSMS}
              >
                Send Test SMS
              </Button>
            </CardBody>
          </Card>

          {/* Scheduled SMS Test */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ClockIcon size={20} />
                Scheduled SMS Test
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                description="When to send the SMS"
                label="Schedule Time"
                min={getMinDateTime()}
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
              <Button
                color="secondary"
                isDisabled={functionStatus !== "online"}
                isLoading={loading}
                startContent={!loading && <ClockIcon size={16} />}
                onClick={scheduleTest}
              >
                Schedule SMS
              </Button>
            </CardBody>
          </Card>

          {/* Batch SMS Test */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquareIcon size={20} />
                Batch SMS Test
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {batchRecipients.map((recipient, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <Input
                    className="flex-1"
                    label={`Phone ${index + 1}`}
                    placeholder="Phone number"
                    value={recipient.phoneNumber}
                    onChange={(e) =>
                      updateBatchRecipient(index, "phoneNumber", e.target.value)
                    }
                  />
                  <Input
                    className="flex-1"
                    label={`Message ${index + 1}`}
                    placeholder="Message"
                    value={recipient.message}
                    onChange={(e) =>
                      updateBatchRecipient(index, "message", e.target.value)
                    }
                  />
                  {batchRecipients.length > 1 && (
                    <Button
                      color="danger"
                      size="sm"
                      variant="light"
                      onClick={() => removeBatchRecipient(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="bordered"
                  onClick={addBatchRecipient}
                >
                  Add Recipient
                </Button>
                <Button
                  color="warning"
                  isDisabled={functionStatus !== "online"}
                  isLoading={loading}
                  startContent={!loading && <SendIcon size={16} />}
                  onClick={sendBatchTest}
                >
                  Send Batch Test
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Results and Logs */}
        <div className="space-y-6">
          {/* Test Results */}
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

          {/* Logs */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">SMS Logs</h2>
              <Button size="sm" variant="bordered" onClick={fetchLogs}>
                <RefreshCwIcon size={16} />
                Refresh
              </Button>
            </CardHeader>
            <CardBody>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No logs available
                  </p>
                ) : (
                  logs.map((log) => (
                    <div key={log.$id} className="p-2 border rounded-lg">
                      <div className="flex justify-between items-start text-sm">
                        <span className="font-medium">
                          {smsTestService.formatPhoneNumber(log.phone_number)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            log.status === "sent"
                              ? "bg-green-100 text-green-800"
                              : log.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : log.status === "scheduled"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {log.message}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                        <span>{log.test_type}</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-red-600 mt-1">
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
