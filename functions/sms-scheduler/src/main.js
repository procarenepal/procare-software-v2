import { Client, Databases, Query } from 'node-appwrite';

// SMS Service implementation for the scheduler
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
    log('SMS Scheduler started - checking for scheduled messages...');

    const now = new Date();
    const currentTimeString = now.toISOString();
    log(`Current server time (UTC): ${currentTimeString}`);

    // First, get ALL scheduled SMS to debug
    const allScheduledSMS = await databases.listDocuments(
      process.env.DATABASE_ID,
      'sms_test_logs',
      [
        Query.equal('status', 'scheduled')
      ]
    );

    log(`Total scheduled SMS in database: ${allScheduledSMS.documents.length}`);
    
    // Log each scheduled SMS for debugging
    allScheduledSMS.documents.forEach(sms => {
      const scheduledDate = new Date(sms.scheduled_time);
      const isValid = !isNaN(scheduledDate.getTime());
      const isDue = isValid && scheduledDate <= now;
      log(`Scheduled SMS: ${sms.phone_number}, scheduled for: ${sms.scheduled_time}, valid: ${isValid}, due: ${isDue}`);
    });

    // Query for scheduled SMS that are due (using proper date comparison)
    const dueSMS = allScheduledSMS.documents.filter(sms => {
      if (!sms.scheduled_time) return false;
      
      const scheduledDate = new Date(sms.scheduled_time);
      if (isNaN(scheduledDate.getTime())) {
        log(`Invalid date format for SMS ${sms.$id}: ${sms.scheduled_time}`);
        return false;
      }
      
      const isDue = scheduledDate <= now;
      log(`SMS ${sms.phone_number}: scheduled ${scheduledDate.toISOString()} (UTC), current ${now.toISOString()} (UTC), due: ${isDue}`);
      return isDue;
    });

    log(`Found ${dueSMS.length} scheduled SMS to process`);

    if (dueSMS.length === 0) {
      return res.json({
        success: true,
        message: 'No scheduled SMS to process',
        timestamp: currentTimeString,
        processed: 0,
        totalScheduled: allScheduledSMS.documents.length
      });
    }

    let successCount = 0;
    let failureCount = 0;

    // Process each scheduled SMS
    for (const sms of dueSMS) {
      try {
        log(`Processing scheduled SMS to ${sms.phone_number}`);

        // Send the SMS
        const result = await smsService.sendMessage(sms.phone_number, sms.message);

        // Update the database record
        await databases.updateDocument(
          process.env.DATABASE_ID,
          'sms_test_logs',
          sms.$id,
          {
            status: result.success ? 'sent' : 'failed',
            response: JSON.stringify(result),
            error_message: result.success ? null : (result.error || 'Failed to send SMS'),
            timestamp: now.toISOString() // Update timestamp to when it was actually sent
          }
        );

        if (result.success) {
          successCount++;
          log(`✅ SMS sent successfully to ${sms.phone_number}`);
        } else {
          failureCount++;
          log(`❌ SMS failed to ${sms.phone_number}: ${result.error || 'Unknown error'}`);
        }

      } catch (err) {
        failureCount++;
        log(`❌ Error processing SMS to ${sms.phone_number}: ${err.message}`);

        // Update record as failed
        try {
          await databases.updateDocument(
            process.env.DATABASE_ID,
            'sms_test_logs',
            sms.$id,
            {
              status: 'failed',
              error_message: err.message,
              timestamp: now.toISOString()
            }
          );
        } catch (updateErr) {
          log(`Failed to update error status for ${sms.$id}: ${updateErr.message}`);
        }
      }
    }

    const totalProcessed = successCount + failureCount;
    log(`SMS Scheduler completed: ${successCount} sent, ${failureCount} failed out of ${totalProcessed} total`);

    return res.json({
      success: true,
      message: `Processed ${totalProcessed} scheduled SMS`,
      timestamp: currentTimeString,
      processed: totalProcessed,
      sent: successCount,
      failed: failureCount,
      details: dueSMS.map(sms => ({
        id: sms.$id,
        phone: sms.phone_number,
        scheduled_time: sms.scheduled_time
      }))
    });

  } catch (err) {
    error('SMS Scheduler error:', err);
    return res.json({ 
      success: false, 
      message: 'SMS scheduler failed',
      error: err.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}; 