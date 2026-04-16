const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const { 
  calculateReminderTime, 
  getClinicSMSSettings, 
  validateAppointmentData,
  isAppointmentTypeEnabled,
  getClinicAppointmentTypes,
  processScheduledReminders,
  discoverAndScheduleUpcomingAppointments,
  performDailyCleanup,
  performHealthCheck,
  initializeCronJobs
} = require('./scheduler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI);

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGODB_DB_NAME);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Authentication middleware
function authenticateAPI(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Invalid API key' 
    });
  }
  
  next();
}

// SMS sending utility function
async function sendSMS(phoneNumber, message) {
  try {
    // Clean and validate phone number
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (cleanPhoneNumber.length < 10) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // Prepare form data (same format as existing service)
    const formData = new URLSearchParams();
    formData.append("key", process.env.SMS_API_KEY);
    formData.append("contacts", cleanPhoneNumber);
    formData.append("senderid", process.env.SMS_SENDER_ID);
    formData.append("msg", message);

    const response = await axios.post(process.env.SMS_API_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'SMS Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Send instant SMS endpoint
app.post('/send-sms', authenticateAPI, async (req, res) => {
  try {
    const { phoneNumber, message, appointmentId } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }
    
    // Send SMS
    const smsResult = await sendSMS(phoneNumber, message);
    
    if (smsResult.success) {
      // Log SMS in database
      await db.collection('sms_logs').insertOne({
        phoneNumber,
        message,
        appointmentId,
        type: 'instant',
        status: 'sent',
        sentAt: new Date(),
        response: smsResult.data
      });
      
      res.json({
        success: true,
        message: 'SMS sent successfully',
        data: smsResult.data
      });
    } else {
      // Log failed SMS
      await db.collection('sms_logs').insertOne({
        phoneNumber,
        message,
        appointmentId,
        type: 'instant',
        status: 'failed',
        error: smsResult.error,
        attemptedAt: new Date()
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to send SMS',
        details: smsResult.error
      });
    }
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Schedule appointment reminder endpoint
app.post('/schedule-reminder', authenticateAPI, async (req, res) => {
  try {
    const appointmentData = req.body;
    const { 
      appointmentId, 
      patientPhone, 
      doctorName, 
      appointmentTime, 
      clinicName,
      appointmentType,
      clinicId
    } = appointmentData;
    
    // Validate appointment data
    const validation = validateAppointmentData(appointmentData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid appointment data',
        details: validation.errors
      });
    }
    
    // Check if reminder already exists
    const existingReminder = await db.collection('scheduled_reminders').findOne({
      appointmentId
    });
    
    if (existingReminder) {
      return res.json({
        success: true,
        message: 'Reminder already scheduled for this appointment',
        reminderId: existingReminder._id,
        reminderTime: existingReminder.reminderTime,
        status: existingReminder.status
      });
    }
    
    // Fetch clinic SMS settings
    const clinicSettings = await getClinicSMSSettings(clinicId);
    
    // Check if SMS reminders are enabled for this clinic
    if (!clinicSettings.enabled) {
      return res.status(400).json({
        success: false,
        error: 'SMS reminders are disabled for this clinic'
      });
    }
    
    // Check if appointment type is enabled for reminders (if specific types are configured)
    if (clinicSettings.enabledAppointmentTypes.length > 0 && 
        appointmentType && 
        !clinicSettings.enabledAppointmentTypes.includes(appointmentType)) {
      return res.status(400).json({
        success: false,
        error: `SMS reminders are not enabled for appointment type: ${appointmentType}`,
        enabledTypes: clinicSettings.enabledAppointmentTypes
      });
    }
    
    // Calculate optimal reminder time using smart scheduling logic
    const reminderTime = calculateReminderTime(
      appointmentTime, 
      clinicSettings.advanceNoticeHours,
      clinicSettings.businessHoursOnly,
      clinicSettings.businessStartHour,
      clinicSettings.businessEndHour
    );
    
    if (!reminderTime) {
      return res.status(400).json({
        success: false,
        error: 'Unable to schedule reminder - appointment is too close or in the past',
        appointmentTime: new Date(appointmentTime).toISOString(),
        currentTime: new Date().toISOString()
      });
    }
    
    // Create reminder record
    const reminder = {
      appointmentId,
      patientPhone,
      doctorName,
      appointmentTime: new Date(appointmentTime),
      clinicName,
      appointmentType,
      clinicId,
      status: 'scheduled',
      createdAt: new Date(),
      reminderTime: reminderTime,
      clinicSettings: {
        advanceNoticeHours: clinicSettings.advanceNoticeHours,
        businessHoursOnly: clinicSettings.businessHoursOnly,
        enabledAppointmentTypes: clinicSettings.enabledAppointmentTypes
      }
    };
    
    const result = await db.collection('scheduled_reminders').insertOne(reminder);
    
    // Log the scheduling action
    console.log(`✅ Reminder scheduled for appointment ${appointmentId}:`, {
      patientPhone,
      appointmentTime: new Date(appointmentTime).toISOString(),
      reminderTime: reminderTime.toISOString(),
      clinicId,
      appointmentType
    });
    
    res.json({
      success: true,
      message: 'Reminder scheduled successfully with smart scheduling logic',
      reminderId: result.insertedId,
      reminderTime: reminderTime.toISOString(),
      schedulingDetails: {
        appointmentTime: new Date(appointmentTime).toISOString(),
        hoursBeforeAppointment: ((new Date(appointmentTime) - reminderTime) / (1000 * 60 * 60)).toFixed(1),
        clinicAdvanceNoticeSetting: clinicSettings.advanceNoticeHours,
        businessHoursOnly: clinicSettings.businessHoursOnly
      }
    });
  } catch (error) {
    console.error('Schedule reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get clinic SMS settings endpoint
app.get('/clinic-settings/:clinicId', authenticateAPI, async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        error: 'Clinic ID is required'
      });
    }
    
    const clinicSettings = await getClinicSMSSettings(clinicId);
    
    res.json({
      success: true,
      data: clinicSettings
    });
  } catch (error) {
    console.error('Get clinic settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Test smart scheduling logic endpoint (for development/testing)
app.post('/test-scheduling', authenticateAPI, async (req, res) => {
  try {
    const { appointmentTime, clinicId } = req.body;
    
    if (!appointmentTime) {
      return res.status(400).json({
        success: false,
        error: 'Appointment time is required'
      });
    }
    
    // Fetch clinic settings if clinicId provided
    const clinicSettings = clinicId ? 
      await getClinicSMSSettings(clinicId) : 
      { advanceNoticeHours: 24, businessHoursOnly: false, businessStartHour: 9, businessEndHour: 17 };
    
    // Calculate reminder time
    const reminderTime = calculateReminderTime(
      appointmentTime,
      clinicSettings.advanceNoticeHours,
      clinicSettings.businessHoursOnly,
      clinicSettings.businessStartHour,
      clinicSettings.businessEndHour
    );
    
    const now = new Date();
    const appointment = new Date(appointmentTime);
    const hoursUntilAppointment = (appointment - now) / (1000 * 60 * 60);
    
    res.json({
      success: true,
      data: {
        currentTime: now.toISOString(),
        appointmentTime: appointment.toISOString(),
        hoursUntilAppointment: hoursUntilAppointment.toFixed(2),
        calculatedReminderTime: reminderTime ? reminderTime.toISOString() : null,
        hoursBeforeAppointment: reminderTime ? 
          ((appointment - reminderTime) / (1000 * 60 * 60)).toFixed(2) : null,
        willSkipReminder: !reminderTime,
        clinicSettings,
        schedulingRule: hoursUntilAppointment >= 24 ? 
          `Using clinic advance notice: ${clinicSettings.advanceNoticeHours} hours` :
          hoursUntilAppointment >= 4 ? '2 hours before appointment' :
          hoursUntilAppointment >= 2 ? '1 hour before appointment' :
          'Too close - skip reminder'
      }
    });
  } catch (error) {
    console.error('Test scheduling error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Cancel scheduled reminder endpoint
app.delete('/cancel-reminder/:appointmentId', authenticateAPI, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const result = await db.collection('scheduled_reminders').deleteOne({
      appointmentId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reminder not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Reminder cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get SMS logs endpoint
app.get('/sms-logs', authenticateAPI, async (req, res) => {
  try {
    const { appointmentId, limit = 50 } = req.query;
    
    let query = {};
    if (appointmentId) {
      query.appointmentId = appointmentId;
    }
    
    const logs = await db.collection('sms_logs')
      .find(query)
      .sort({ sentAt: -1, attemptedAt: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get SMS logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get appointment types for a clinic
app.get('/appointment-types/:clinicId', authenticateAPI, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { limit = 50 } = req.query;
    
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        error: 'Clinic ID is required'
      });
    }
    
    const appointmentTypes = await getClinicAppointmentTypes(clinicId, parseInt(limit));
    const clinicSettings = await getClinicSMSSettings(clinicId);
    
    res.json({
      success: true,
      data: {
        clinicId,
        enabledAppointmentTypes: clinicSettings.enabledAppointmentTypes,
        smsEnabled: clinicSettings.enabled,
        appointmentTypes: appointmentTypes.map(type => ({
          ...type,
          isEnabled: clinicSettings.enabledAppointmentTypes.length === 0 || 
                    clinicSettings.enabledAppointmentTypes.includes(type.appointmentType)
        }))
      }
    });
  } catch (error) {
    console.error('Get appointment types error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update clinic SMS settings endpoint
app.put('/clinic-settings/:clinicId', authenticateAPI, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { smsSettings } = req.body;
    
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        error: 'Clinic ID is required'
      });
    }
    
    if (!smsSettings) {
      return res.status(400).json({
        success: false,
        error: 'SMS settings are required'
      });
    }
    
    // Validate SMS settings structure
    const validSettings = {
      enabled: typeof smsSettings.enabled === 'boolean' ? smsSettings.enabled : true,
      advanceNoticeHours: 
        (typeof smsSettings.advanceNoticeHours === 'number' && smsSettings.advanceNoticeHours > 0) 
        ? smsSettings.advanceNoticeHours : 24,
      enabledAppointmentTypes: Array.isArray(smsSettings.enabledAppointmentTypes) 
        ? smsSettings.enabledAppointmentTypes : [],
      businessHoursOnly: typeof smsSettings.businessHoursOnly === 'boolean' 
        ? smsSettings.businessHoursOnly : false,
      businessStartHour: 
        (typeof smsSettings.businessStartHour === 'number' && 
         smsSettings.businessStartHour >= 0 && smsSettings.businessStartHour <= 23)
        ? smsSettings.businessStartHour : 9,
      businessEndHour: 
        (typeof smsSettings.businessEndHour === 'number' && 
         smsSettings.businessEndHour >= 1 && smsSettings.businessEndHour <= 24)
        ? smsSettings.businessEndHour : 17
    };
    
    // Update clinic settings
    const result = await db.collection('clinics').updateOne(
      { clinicId: clinicId },
      { 
        $set: { 
          smsSettings: validSettings,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`✅ Updated SMS settings for clinic ${clinicId}:`, validSettings);
    
    res.json({
      success: true,
      message: 'Clinic SMS settings updated successfully',
      data: validSettings,
      upserted: result.upsertedCount > 0
    });
  } catch (error) {
    console.error('Update clinic settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Bulk update appointment type settings
app.post('/bulk-update-appointment-types/:clinicId', authenticateAPI, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { enabledAppointmentTypes, action } = req.body;
    
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        error: 'Clinic ID is required'
      });
    }
    
    if (!Array.isArray(enabledAppointmentTypes)) {
      return res.status(400).json({
        success: false,
        error: 'enabledAppointmentTypes must be an array'
      });
    }
    
    // Get current settings
    const currentSettings = await getClinicSMSSettings(clinicId);
    let newEnabledTypes = [...currentSettings.enabledAppointmentTypes];
    
    switch (action) {
      case 'replace':
        newEnabledTypes = enabledAppointmentTypes;
        break;
      case 'add':
        enabledAppointmentTypes.forEach(type => {
          if (!newEnabledTypes.includes(type)) {
            newEnabledTypes.push(type);
          }
        });
        break;
      case 'remove':
        newEnabledTypes = newEnabledTypes.filter(type => 
          !enabledAppointmentTypes.includes(type)
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Use "replace", "add", or "remove"'
        });
    }
    
    // Update the clinic settings
    await db.collection('clinics').updateOne(
      { clinicId: clinicId },
      { 
        $set: { 
          'smsSettings.enabledAppointmentTypes': newEnabledTypes,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`✅ Bulk updated appointment types for clinic ${clinicId}:`, {
      action,
      requestedTypes: enabledAppointmentTypes,
      resultingTypes: newEnabledTypes
    });
    
    res.json({
      success: true,
      message: `Appointment types ${action}d successfully`,
      data: {
        action,
        requestedTypes: enabledAppointmentTypes,
        previousEnabledTypes: currentSettings.enabledAppointmentTypes,
        newEnabledTypes: newEnabledTypes
      }
    });
  } catch (error) {
    console.error('Bulk update appointment types error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Manual cron job triggers (for testing and monitoring)
app.post('/trigger-cron/:jobType', authenticateAPI, async (req, res) => {
  try {
    const { jobType } = req.params;
    const startTime = Date.now();
    let result;
    
    switch (jobType) {
      case 'process-reminders':
        console.log('🔧 Manually triggered: Process scheduled reminders');
        result = await processScheduledReminders();
        break;
        
      case 'discover-appointments':
        console.log('🔧 Manually triggered: Discover and schedule appointments');
        result = await discoverAndScheduleUpcomingAppointments();
        break;
        
      case 'daily-cleanup':
        console.log('🔧 Manually triggered: Daily cleanup');
        result = await performDailyCleanup();
        break;
        
      case 'health-check':
        console.log('🔧 Manually triggered: Health check');
        result = await performHealthCheck();
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid job type. Use: process-reminders, discover-appointments, daily-cleanup, health-check'
        });
    }
    
    const executionTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: `Cron job '${jobType}' executed successfully`,
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
      result: result
    });
  } catch (error) {
    console.error(`Error executing cron job ${req.params.jobType}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute cron job',
      details: error.message
    });
  }
});

// Get cron job status and statistics
app.get('/cron-status', authenticateAPI, async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    // Get recent system logs
    const recentLogs = await db.collection('system_logs').find({
      timestamp: { $gte: last24Hours }
    }).sort({ timestamp: -1 }).limit(20).toArray();
    
    // Get pending reminders count
    const pendingReminders = await db.collection('scheduled_reminders').countDocuments({
      status: 'scheduled',
      reminderTime: { $lte: now }
    });
    
    // Get scheduled reminders count
    const upcomingReminders = await db.collection('scheduled_reminders').countDocuments({
      status: 'scheduled',
      reminderTime: { $gt: now }
    });
    
    // Get today's SMS statistics
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStats = await db.collection('sms_logs').aggregate([
      { $match: { sentAt: { $gte: todayStart } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    const stats = {
      sent: todayStats.find(s => s._id === 'sent')?.count || 0,
      failed: todayStats.find(s => s._id === 'failed')?.count || 0
    };
    
    res.json({
      success: true,
      data: {
        timestamp: now.toISOString(),
        cronJobs: {
          status: 'running',
          schedules: {
            reminderProcessing: 'Every 15 minutes',
            appointmentDiscovery: 'Every hour',
            dailyCleanup: '2:00 AM daily',
            healthCheck: 'Every 5 minutes'
          }
        },
        statistics: {
          pendingReminders,
          upcomingReminders,
          todaysSms: stats
        },
        recentLogs: recentLogs.map(log => ({
          type: log.type,
          timestamp: log.timestamp,
          status: log.status,
          metrics: log.metrics,
          stats: log.stats
        }))
      }
    });
  } catch (error) {
    console.error('Error getting cron status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cron status'
    });
  }
});

// Start server
async function startServer() {
  try {
    // Connect to database first
    await connectToDatabase();
    
    // Initialize cron jobs after database connection
    console.log('🚀 Initializing SMS reminder cron jobs...');
    await initializeCronJobs();
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`✅ SMS Backend server running on port ${PORT}`);
      console.log(`📅 Cron jobs are active and monitoring appointments`);
      console.log(`🔗 Health check available at http://localhost:${PORT}/health`);
      console.log(`📊 Cron status available at GET /cron-status`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await mongoClient.close();
  process.exit(0);
});

startServer().catch(console.error);

module.exports = app;
