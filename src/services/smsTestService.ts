import { Client, Functions } from "appwrite";

// Types for SMS testing
export interface SMSTestRequest {
  action:
    | "send_test_sms"
    | "send_batch_test"
    | "schedule_test"
    | "get_test_logs";
  phoneNumber?: string;
  message?: string;
  recipients?: Array<{ phoneNumber: string; message: string }>;
  scheduledTime?: string;
}

export interface SMSTestResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface SMSTestLog {
  $id: string;
  phone_number: string;
  message: string;
  status: "sent" | "failed" | "error" | "scheduled";
  response?: string;
  error_message?: string;
  test_type: "manual_test" | "batch_test" | "scheduled_test";
  scheduled_time?: string;
  timestamp: string;
}

class SMSTestService {
  private client: Client;
  private functions: Functions;
  private functionId: string;

  constructor() {
    this.client = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

    this.functions = new Functions(this.client);
    this.functionId = "sms-tester"; // This should match the function name in appwrite.json
  }

  /**
   * Check if the SMS function is running
   */
  async healthCheck(): Promise<SMSTestResponse> {
    try {
      const response = await this.functions.createExecution(
        this.functionId,
        "", // empty body - this will trigger the GET path in the function
        false, // not async
      );

      if (response.status === "completed") {
        try {
          const result = JSON.parse(response.responseBody);

          return result;
        } catch (parseError) {
          // If response is not JSON, check if it's a successful response
          if (response.responseStatusCode === 200) {
            return { success: true, message: "Function is running" };
          } else {
            throw new Error(
              `Function returned status ${response.responseStatusCode}`,
            );
          }
        }
      } else {
        throw new Error(
          `Function execution failed with status: ${response.status}`,
        );
      }
    } catch (error) {
      console.error("Health check failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send a test SMS
   */
  async sendTestSMS(
    phoneNumber: string,
    message: string,
  ): Promise<SMSTestResponse> {
    try {
      if (!phoneNumber || !message) {
        throw new Error("Phone number and message are required");
      }

      const payload: SMSTestRequest = {
        action: "send_test_sms",
        phoneNumber,
        message,
      };

      const response = await this.functions.createExecution(
        this.functionId,
        JSON.stringify(payload),
        false,
        "POST",
      );

      if (response.status === "completed") {
        return JSON.parse(response.responseBody);
      } else {
        throw new Error(`Function execution failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Test SMS failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send batch test SMS
   */
  async sendBatchTest(
    recipients: Array<{ phoneNumber: string; message: string }>,
  ): Promise<SMSTestResponse> {
    try {
      if (!recipients || recipients.length === 0) {
        throw new Error("Recipients array is required");
      }

      const payload: SMSTestRequest = {
        action: "send_batch_test",
        recipients,
      };

      const response = await this.functions.createExecution(
        this.functionId,
        JSON.stringify(payload),
        false,
        "POST",
      );

      if (response.status === "completed") {
        return JSON.parse(response.responseBody);
      } else {
        throw new Error(`Function execution failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Batch test failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Schedule a test SMS
   */
  async scheduleTest(
    phoneNumber: string,
    message: string,
    scheduledTime: string,
  ): Promise<SMSTestResponse> {
    try {
      if (!phoneNumber || !message || !scheduledTime) {
        throw new Error(
          "Phone number, message, and scheduled time are required",
        );
      }

      const payload: SMSTestRequest = {
        action: "schedule_test",
        phoneNumber,
        message,
        scheduledTime,
      };

      const response = await this.functions.createExecution(
        this.functionId,
        JSON.stringify(payload),
        false,
        "POST",
      );

      if (response.status === "completed") {
        return JSON.parse(response.responseBody);
      } else {
        throw new Error(`Function execution failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Schedule test failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get test logs
   */
  async getTestLogs(): Promise<SMSTestResponse> {
    try {
      const payload: SMSTestRequest = {
        action: "get_test_logs",
      };

      const response = await this.functions.createExecution(
        this.functionId,
        JSON.stringify(payload),
        false,
        "POST",
      );

      if (response.status === "completed") {
        return JSON.parse(response.responseBody);
      } else {
        throw new Error(`Function execution failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Get logs failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "");

    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return phoneNumber;
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phoneNumber: string): {
    isValid: boolean;
    message?: string;
  } {
    const cleaned = phoneNumber.replace(/\D/g, "");

    if (cleaned.length < 10) {
      return {
        isValid: false,
        message: "Phone number must be at least 10 digits",
      };
    }

    if (cleaned.length > 15) {
      return {
        isValid: false,
        message: "Phone number cannot exceed 15 digits",
      };
    }

    return { isValid: true };
  }

  /**
   * Get execution logs from Appwrite
   */
  async getFunctionLogs(): Promise<any> {
    try {
      // Note: This would require admin privileges in a real scenario
      // For now, we'll return the test logs instead
      return await this.getTestLogs();
    } catch (error) {
      console.error("Failed to get function logs:", error);
      throw error;
    }
  }
}

// Create a singleton instance
export const smsTestService = new SMSTestService();

// Export individual functions for convenience
export const sendTestSMS = smsTestService.sendTestSMS.bind(smsTestService);
export const sendBatchTest = smsTestService.sendBatchTest.bind(smsTestService);
export const scheduleTest = smsTestService.scheduleTest.bind(smsTestService);
export const getTestLogs = smsTestService.getTestLogs.bind(smsTestService);
export const healthCheck = smsTestService.healthCheck.bind(smsTestService);

export default smsTestService;
