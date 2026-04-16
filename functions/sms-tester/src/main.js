import { Client, Databases, Storage } from 'node-appwrite';

// SMS Service implementation adapted for Appwrite function
class SMSService {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY || "";
    this.senderId = process.env.SMS_SENDER_ID || "";
    this.apiUrl = process.env.SMS_API_URL || "";
  }

  async sendMessage(phoneNumber, message) {
    try {
      if (!phoneNumber || !message) {
        throw new Error('Phone number and message are required');
      }

      // Clean phone number
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      if (cleanPhoneNumber.length < 10) {
        throw new Error('Invalid phone number format');
      }

      // Prepare form data
      const formData = new URLSearchParams();
      formData.append("key", this.apiKey);
      formData.append("contacts", cleanPhoneNumber);
      formData.append("senderid", this.senderId);
      formData.append("msg", message);

      // Send SMS request
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const responseText = await response.text();

      // Parse response
      let data;
      try {
        data = JSON.parse(responseText);
        data.success = true;
      } catch (e) {
        // For Samaya SMS API, check for successful patterns
        const isSuccess = responseText.includes('success') || 
                         responseText.includes('sent') ||
                         responseText.includes('SMS-SHOOT-ID') ||
                         responseText.includes('delivered');
        
        data = { 
          response: responseText, 
          isRawText: true, 
          success: isSuccess
        };
      }

      return data;
    } catch (error) {
      console.error("Error sending SMS:", error);
      throw error;
    }
  }

  async logSMSResult(databases, logData) {
    try {
      await databases.createDocument(
        process.env.DATABASE_ID,
        'sms_test_logs',
        'unique()',
        {
          ...logData,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error("Error logging SMS result:", error);
    }
  }
}

export default async ({ req, res, log, error }) => {
  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const smsService = new SMSService();

  try {
    const { method } = req;
    
    // Handle health check - either GET request or POST with empty/no action
    if (method === 'GET' || !req.body || req.body.trim() === '' || req.body === '{}') {
      return res.json({
        success: true,
        message: 'SMS Tester Function is running',
        timestamp: new Date().toISOString()
      });
    }

    if (method === 'POST') {
      const { action, phoneNumber, message, testType, scheduledTime } = JSON.parse(req.body || '{}');

      switch (action) {
        case 'send_test_sms':
          return await handleTestSMS(smsService, databases, phoneNumber, message, res, log);
        
        case 'send_batch_test':
          return await handleBatchTest(smsService, databases, req.body, res, log);
        
        case 'schedule_test':
          return await handleScheduledTest(smsService, databases, { phoneNumber, message, scheduledTime }, res, log);
        
        case 'get_test_logs':
          return await handleGetLogs(databases, res);
        
        default:
          return res.json({ success: false, message: 'Invalid action' }, 400);
      }
    }

    return res.json({ success: false, message: 'Method not allowed' }, 405);

  } catch (err) {
    error('Function error:', err);
    return res.json({ 
      success: false, 
      message: 'Internal server error',
      error: err.message 
    }, 500);
  }
};

async function handleTestSMS(smsService, databases, phoneNumber, message, res, log) {
  try {
    log(`Sending test SMS to ${phoneNumber}`);
    
    const result = await smsService.sendMessage(phoneNumber, message);
    
    // Log the result
    await smsService.logSMSResult(databases, {
      phone_number: phoneNumber,
      message,
      status: result.success ? 'sent' : 'failed',
      response: JSON.stringify(result),
      test_type: 'manual_test'
    });

    log(`SMS test result: ${result.success ? 'Success' : 'Failed'}`);
    
    return res.json({
      success: true,
      data: {
        sent: result.success,
        response: result,
        phoneNumber,
        message
      }
    });
  } catch (err) {
    log(`SMS test failed: ${err.message}`);
    
    // Log the error
    await smsService.logSMSResult(databases, {
      phone_number: phoneNumber,
      message,
      status: 'error',
      error_message: err.message,
      test_type: 'manual_test'
    });

    return res.json({
      success: false,
      message: 'Failed to send test SMS',
      error: err.message
    }, 500);
  }
}

async function handleBatchTest(smsService, databases, requestBody, res, log) {
  try {
    const { recipients } = JSON.parse(requestBody);
    
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.json({ success: false, message: 'Recipients array is required' }, 400);
    }

    log(`Starting batch SMS test for ${recipients.length} recipients`);
    
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await smsService.sendMessage(recipient.phoneNumber, recipient.message);
        
        await smsService.logSMSResult(databases, {
          phone_number: recipient.phoneNumber,
          message: recipient.message,
          status: result.success ? 'sent' : 'failed',
          response: JSON.stringify(result),
          test_type: 'batch_test'
        });

        results.push({
          phoneNumber: recipient.phoneNumber,
          success: result.success,
          response: result
        });
      } catch (err) {
        await smsService.logSMSResult(databases, {
          phone_number: recipient.phoneNumber,
          message: recipient.message,
          status: 'error',
          error_message: err.message,
          test_type: 'batch_test'
        });

        results.push({
          phoneNumber: recipient.phoneNumber,
          success: false,
          error: err.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    log(`Batch SMS test completed: ${successCount}/${recipients.length} successful`);

    return res.json({
      success: true,
      data: {
        total: recipients.length,
        successful: successCount,
        failed: recipients.length - successCount,
        results
      }
    });
  } catch (err) {
    return res.json({
      success: false,
      message: 'Batch test failed',
      error: err.message
    }, 500);
  }
}

async function handleScheduledTest(smsService, databases, { phoneNumber, message, scheduledTime }, res, log) {
  try {
    const now = new Date();
    const scheduleDate = new Date(scheduledTime);
    
    // Log timezone information for debugging
    log(`Received scheduledTime: ${scheduledTime}`);
    log(`Parsed scheduleDate: ${scheduleDate.toISOString()}`);
    log(`Current server time: ${now.toISOString()}`);
    
    if (scheduleDate <= now) {
      return res.json({ 
        success: false, 
        message: `Scheduled time must be in the future. Received: ${scheduleDate.toISOString()}, Current: ${now.toISOString()}` 
      }, 400);
    }

    // Save scheduled SMS to database - the scheduler function will process it
    // scheduledTime should already be in ISO format from frontend
    await smsService.logSMSResult(databases, {
      phone_number: phoneNumber,
      message,
      status: 'scheduled',
      scheduled_time: scheduleDate.toISOString(), // Store in UTC
      test_type: 'scheduled_test'
    });

    log(`SMS scheduled for ${scheduleDate.toISOString()} (UTC) to ${phoneNumber} - will be processed by scheduler`);

    return res.json({
      success: true,
      data: {
        phoneNumber,
        message,
        scheduledTime: scheduleDate.toISOString(),
        status: 'scheduled',
        note: 'SMS has been scheduled and will be sent automatically by the background scheduler'
      }
    });
  } catch (err) {
    log(`Failed to schedule SMS: ${err.message}`);
    return res.json({
      success: false,
      message: 'Failed to schedule SMS',
      error: err.message
    }, 500);
  }
}

async function handleGetLogs(databases, res) {
  try {
    const logs = await databases.listDocuments(
      process.env.DATABASE_ID,
      'sms_test_logs',
      [],
      100, // limit
      0,    // offset
      [],
      ['timestamp'],
      ['DESC']
    );

    return res.json({
      success: true,
      data: logs.documents
    });
  } catch (err) {
    return res.json({
      success: false,
      message: 'Failed to fetch logs',
      error: err.message
    }, 500);
  }
} 