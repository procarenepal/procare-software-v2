const cron = require('node-cron');
const { MongoClient } = require('mongodb');
const axios = require('axios');
require('dotenv').config();

let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI);

// Connect to database
async function connectToDatabase() {
  try {
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGODB_DB_NAME);
    console.log('Cron job connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// SMS sending utility
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

// Fetch clinic SMS settings from database
async function getClinicSMSSettings(clinicId) {
  try {
    const clinic = await db.collection('clinics').findOne({ 
      clinicId: clinicId 
    });
    
    if (!clinic || !clinic.smsSettings) {
      // Return default settings if clinic not found or no SMS settings
      return {
        enabled: true,
        advanceNoticeHours: 24,
        enabledAppointmentTypes: [], // Empty array means all types enabled
        businessHoursOnly: false,
        businessStartHour: 9,
        businessEndHour: 17
      };
    }
    
    return {
      enabled: clinic.smsSettings.enabled || true,
      advanceNoticeHours: clinic.smsSettings.advanceNoticeHours || 24,
      enabledAppointmentTypes: clinic.smsSettings.enabledAppointmentTypes || [],
      businessHoursOnly: clinic.smsSettings.businessHoursOnly || false,
      businessStartHour: clinic.smsSettings.businessStartHour || 9,
      businessEndHour: clinic.smsSettings.businessEndHour || 17
    };
  } catch (error) {
    console.error('Error fetching clinic SMS settings:', error);
    // Return default settings on error
    return {
      enabled: true,
      advanceNoticeHours: 24,
      enabledAppointmentTypes: [],
      businessHoursOnly: false,
      businessStartHour: 9,
      businessEndHour: 17
    };
  }
}

// Enhanced smart scheduling logic
function calculateReminderTime(appointmentTime, clinicAdvanceNoticeSetting = 24, businessHoursOnly = false, businessStartHour = 9, businessEndHour = 17) {
  const now = new Date();
  const appointment = new Date(appointmentTime);
  const hoursUntilAppointment = (appointment - now) / (1000 * 60 * 60);
  
  // If appointment is in the past, skip
  if (hoursUntilAppointment <= 0) {
    console.log('Appointment is in the past, skipping reminder');
    return null;
  }
  
  let reminderTime;
  
  // Smart scheduling rules based on time until appointment
  if (hoursUntilAppointment >= 24) {
    // Use clinic's advance notice setting (default 24 hours before)
    reminderTime = new Date(appointment.getTime() - (clinicAdvanceNoticeSetting * 60 * 60 * 1000));
  } else if (hoursUntilAppointment >= 4 && hoursUntilAppointment < 24) {
    // Automatically adjust to 2 hours before appointment
    reminderTime = new Date(appointment.getTime() - (2 * 60 * 60 * 1000));
  } else if (hoursUntilAppointment >= 2 && hoursUntilAppointment < 4) {
    // Schedule 1 hour before appointment
    reminderTime = new Date(appointment.getTime() - (1 * 60 * 60 * 1000));
  } else {
    // Less than 2 hours - skip reminder (do not send)
    console.log(`Appointment is less than 2 hours away (${hoursUntilAppointment.toFixed(2)} hours), skipping reminder`);
    return null;
  }
  
  // If business hours only is enabled, adjust reminder time
  if (businessHoursOnly) {
    reminderTime = adjustToBusinessHours(reminderTime, businessStartHour, businessEndHour);
  }
  
  // Ensure reminder is not scheduled for the past
  if (reminderTime <= now) {
    console.log('Calculated reminder time is in the past, adjusting to immediate send');
    reminderTime = new Date(now.getTime() + (5 * 60 * 1000)); // 5 minutes from now
  }
  
  return reminderTime;
}

// Helper function to adjust reminder time to business hours
function adjustToBusinessHours(reminderTime, businessStartHour, businessEndHour) {
  const adjusted = new Date(reminderTime);
  const hour = adjusted.getHours();
  
  // If reminder is before business hours, move to start of business hours
  if (hour < businessStartHour) {
    adjusted.setHours(businessStartHour, 0, 0, 0);
  }
  // If reminder is after business hours, move to start of next business day
  else if (hour >= businessEndHour) {
    adjusted.setDate(adjusted.getDate() + 1);
    adjusted.setHours(businessStartHour, 0, 0, 0);
  }
  
  return adjusted;
}

// Validate appointment data for reminder scheduling
function validateAppointmentData(appointmentData) {
  const required = ['appointmentId', 'patientPhone', 'appointmentTime', 'clinicId'];
  const missing = required.filter(field => !appointmentData[field]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      errors: [`Missing required fields: ${missing.join(', ')}`]
    };
  }
  
  // Validate phone number format (basic check)
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  if (!phoneRegex.test(appointmentData.patientPhone)) {
    return {
      valid: false,
      errors: ['Invalid phone number format']
    };
  }
  
  // Validate appointment time is in the future
  const appointmentTime = new Date(appointmentData.appointmentTime);
  if (appointmentTime <= new Date()) {
    return {
      valid: false,
      errors: ['Appointment time must be in the future']
    };
  }
  
  return { valid: true, errors: [] };
}

// Check if appointment type is enabled for SMS reminders
function isAppointmentTypeEnabled(appointmentType, clinicSettings) {
  // If no specific types are configured, all types are enabled
  if (!clinicSettings.enabledAppointmentTypes || clinicSettings.enabledAppointmentTypes.length === 0) {
    return {
      enabled: true,
      reason: 'All appointment types enabled (no specific filtering)'
    };
  }
  
  // If appointment type is not provided, assume enabled (backward compatibility)
  if (!appointmentType) {
    return {
      enabled: true,
      reason: 'Appointment type not specified, assuming enabled'
    };
  }
  
  // Check if the specific appointment type is in the enabled list
  const isEnabled = clinicSettings.enabledAppointmentTypes.includes(appointmentType);
  
  return {
    enabled: isEnabled,
    reason: isEnabled 
      ? `Appointment type "${appointmentType}" is enabled for SMS reminders`
      : `Appointment type "${appointmentType}" is not enabled for SMS reminders. Enabled types: ${clinicSettings.enabledAppointmentTypes.join(', ')}`
  };
}

// Get all unique appointment types from scheduled reminders (for management purposes)
async function getClinicAppointmentTypes(clinicId, limit = 50) {
  try {
    const appointmentTypes = await db.collection('scheduled_reminders').aggregate([
      {
        $match: {
          clinicId: clinicId,
          appointmentType: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$appointmentType',
          count: { $sum: 1 },
          latestUsed: { $max: '$createdAt' },
          statuses: { 
            $push: '$status' 
          }
        }
      },
      {
        $project: {
          appointmentType: '$_id',
          count: 1,
          latestUsed: 1,
          sentCount: {
            $size: {
              $filter: {
                input: '$statuses',
                cond: { $eq: ['$$this', 'sent'] }
              }
            }
          },
          failedCount: {
            $size: {
              $filter: {
                input: '$statuses',
                cond: { $eq: ['$$this', 'failed'] }
              }
            }
          }
        }
      },
      { $sort: { count: -1, latestUsed: -1 } },
      { $limit: limit }
    ]).toArray();

    return appointmentTypes;
  } catch (error) {
    console.error('Error getting clinic appointment types:', error);
    return [];
  }
}

// Generate reminder message
function generateReminderMessage(doctorName, appointmentTime, clinicName) {
  const appointment = new Date(appointmentTime);
  const dateStr = appointment.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = appointment.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `Reminder: You have an appointment with Dr. ${doctorName} on ${dateStr} at ${timeStr} at ${clinicName}. Please arrive 15 minutes early.`;
}

// Process scheduled reminders
async function processScheduledReminders() {
  try {
    console.log('Processing scheduled reminders...');
    
    // Get all pending reminders
    const reminders = await db.collection('scheduled_reminders').find({
      status: 'scheduled'
    }).toArray();
    
    const now = new Date();
    console.log(`Found ${reminders.length} scheduled reminders to process`);
    
    for (const reminder of reminders) {
      try {
        // Fetch clinic SMS settings
        const clinicSettings = await getClinicSMSSettings(reminder.clinicId);
        
        // Check if SMS reminders are enabled for this clinic
        if (!clinicSettings.enabled) {
          await db.collection('scheduled_reminders').updateOne(
            { _id: reminder._id },
            { 
              $set: { 
                status: 'skipped',
                reason: 'SMS reminders disabled for this clinic',
                processedAt: now
              }
            }
          );
          console.log(`Skipped reminder for appointment ${reminder.appointmentId} - SMS disabled for clinic`);
          continue;
        }
        
        // Check if appointment type is enabled for reminders
        const appointmentTypeCheck = isAppointmentTypeEnabled(reminder.appointmentType, clinicSettings);
        if (!appointmentTypeCheck.enabled) {
          await db.collection('scheduled_reminders').updateOne(
            { _id: reminder._id },
            { 
              $set: { 
                status: 'skipped',
                reason: appointmentTypeCheck.reason,
                processedAt: now
              }
            }
          );
          console.log(`Skipped reminder for appointment ${reminder.appointmentId} - ${appointmentTypeCheck.reason}`);
          continue;
        }
        
        // Calculate reminder time if not already calculated
        if (!reminder.reminderTime) {
          const reminderTime = calculateReminderTime(
            reminder.appointmentTime, 
            clinicSettings.advanceNoticeHours,
            clinicSettings.businessHoursOnly,
            clinicSettings.businessStartHour,
            clinicSettings.businessEndHour
          );
          
          if (!reminderTime) {
            // Skip reminder - calculated as not suitable for sending
            await db.collection('scheduled_reminders').updateOne(
              { _id: reminder._id },
              { 
                $set: { 
                  status: 'skipped',
                  reason: 'Reminder time calculation resulted in skip (too close to appointment or past appointment)',
                  processedAt: now
                }
              }
            );
            console.log(`Skipped reminder for appointment ${reminder.appointmentId} - calculated as unsuitable`);
            continue;
          }
          
          // Update reminder with calculated time
          await db.collection('scheduled_reminders').updateOne(
            { _id: reminder._id },
            { 
              $set: { 
                reminderTime,
                clinicSettings: {
                  advanceNoticeHours: clinicSettings.advanceNoticeHours,
                  businessHoursOnly: clinicSettings.businessHoursOnly
                }
              }
            }
          );
          
          reminder.reminderTime = reminderTime;
          console.log(`Updated reminder time for appointment ${reminder.appointmentId}: ${reminderTime.toISOString()}`);
        }
        
        // Check if it's time to send the reminder
        if (now >= reminder.reminderTime && reminder.status === 'scheduled') {
          // Generate message
          const message = generateReminderMessage(
            reminder.doctorName,
            reminder.appointmentTime,
            reminder.clinicName
          );
          
          console.log(`Sending reminder for appointment ${reminder.appointmentId} to ${reminder.patientPhone}`);
          
          // Send SMS
          const smsResult = await sendSMS(reminder.patientPhone, message);
          
          if (smsResult.success) {
            // Update reminder status
            await db.collection('scheduled_reminders').updateOne(
              { _id: reminder._id },
              { 
                $set: { 
                  status: 'sent',
                  sentAt: now,
                  message: message,
                  smsResponse: smsResult.data
                }
              }
            );
            
            // Log SMS
            await db.collection('sms_logs').insertOne({
              phoneNumber: reminder.patientPhone,
              message: message,
              appointmentId: reminder.appointmentId,
              clinicId: reminder.clinicId,
              type: 'reminder',
              status: 'sent',
              sentAt: now,
              response: smsResult.data
            });
            
            console.log(`✅ Reminder sent successfully for appointment ${reminder.appointmentId}`);
          } else {
            // Mark as failed
            await db.collection('scheduled_reminders').updateOne(
              { _id: reminder._id },
              { 
                $set: { 
                  status: 'failed',
                  error: smsResult.error,
                  attemptedAt: now,
                  retryCount: (reminder.retryCount || 0) + 1
                }
              }
            );
            
            // Log failed SMS
            await db.collection('sms_logs').insertOne({
              phoneNumber: reminder.patientPhone,
              message: message,
              appointmentId: reminder.appointmentId,
              clinicId: reminder.clinicId,
              type: 'reminder',
              status: 'failed',
              error: smsResult.error,
              attemptedAt: now
            });
            
            console.error(`❌ Failed to send reminder for appointment ${reminder.appointmentId}:`, smsResult.error);
            
            // Schedule retry if retry count is less than 3
            if ((reminder.retryCount || 0) < 2) {
              const retryTime = new Date(now.getTime() + (30 * 60 * 1000)); // Retry in 30 minutes
              await db.collection('scheduled_reminders').updateOne(
                { _id: reminder._id },
                { 
                  $set: { 
                    status: 'scheduled',
                    reminderTime: retryTime,
                    lastFailedAt: now
                  }
                }
              );
              console.log(`Scheduled retry for appointment ${reminder.appointmentId} at ${retryTime.toISOString()}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing reminder ${reminder._id}:`, error);
        
        // Mark reminder as failed due to processing error
        await db.collection('scheduled_reminders').updateOne(
          { _id: reminder._id },
          { 
            $set: { 
              status: 'failed',
              error: `Processing error: ${error.message}`,
              attemptedAt: now
            }
          }
        ).catch(err => console.error('Failed to update reminder status:', err));
      }
    }
    
    // Clean up old processed reminders (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const cleanupResult = await db.collection('scheduled_reminders').deleteMany({
      $or: [
        { status: 'sent', sentAt: { $lt: thirtyDaysAgo } },
        { status: 'failed', attemptedAt: { $lt: thirtyDaysAgo } },
        { status: 'skipped', processedAt: { $lt: thirtyDaysAgo } }
      ]
    });
    
    if (cleanupResult.deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${cleanupResult.deletedCount} old reminder records`);
    }
    
  } catch (error) {
    console.error('Error processing scheduled reminders:', error);
  }
}

// Initialize cron job
async function initializeCronJobs() {
  await connectToDatabase();
  
  // Primary reminder processing job - every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    console.log('🔄 Running primary reminder processing cron job...');
    processScheduledReminders().catch(error => {
      console.error('❌ Error in primary reminder processing:', error);
    });
  });
  
  // Appointment discovery job - every hour
  cron.schedule('0 * * * *', () => {
    console.log('🔍 Running appointment discovery cron job...');
    discoverAndScheduleUpcomingAppointments().catch(error => {
      console.error('❌ Error in appointment discovery:', error);
    });
  });
  
  // Cleanup job - daily at 2 AM
  cron.schedule('0 2 * * *', () => {
    console.log('🗑️ Running daily cleanup cron job...');
    performDailyCleanup().catch(error => {
      console.error('❌ Error in daily cleanup:', error);
    });
  });
  
  // Health check job - every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    performHealthCheck().catch(error => {
      console.error('❌ Error in health check:', error);
    });
  });
  
  console.log('✅ SMS reminder cron jobs initialized with multiple schedules:');
  console.log('   - Reminder processing: Every 15 minutes');
  console.log('   - Appointment discovery: Every hour');
  console.log('   - Daily cleanup: 2:00 AM daily');
  console.log('   - Health check: Every 5 minutes');
}

// Query and schedule upcoming appointments from external appointments collection
async function discoverAndScheduleUpcomingAppointments() {
  try {
    console.log('📅 Discovering upcoming appointments for scheduling...');
    
    // Get appointments from the next 48 hours that don't have reminders scheduled
    const now = new Date();
    const next48Hours = new Date(now.getTime() + (48 * 60 * 60 * 1000));
    
    // Query appointments collection (adjust collection name and fields as needed)
    const upcomingAppointments = await db.collection('appointments').find({
      appointmentTime: {
        $gte: now,
        $lte: next48Hours
      },
      status: { $nin: ['cancelled', 'completed'] }, // Exclude cancelled/completed
      // Add any other filters needed for your appointment structure
    }).toArray();
    
    console.log(`📋 Found ${upcomingAppointments.length} upcoming appointments to check`);
    
    let newRemindersCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const appointment of upcomingAppointments) {
      try {
        // Check if reminder already exists
        const existingReminder = await db.collection('scheduled_reminders').findOne({
          appointmentId: appointment.appointmentId || appointment._id.toString()
        });
        
        if (existingReminder) {
          skippedCount++;
          continue;
        }
        
        // Get clinic settings to check if SMS is enabled
        const clinicSettings = await getClinicSMSSettings(appointment.clinicId);
        
        if (!clinicSettings.enabled) {
          skippedCount++;
          console.log(`⏭️ SMS disabled for clinic ${appointment.clinicId}, skipping appointment`);
          continue;
        }
        
        // Check appointment type filtering
        const appointmentTypeCheck = isAppointmentTypeEnabled(
          appointment.appointmentType, 
          clinicSettings
        );
        
        if (!appointmentTypeCheck.enabled) {
          skippedCount++;
          console.log(`⏭️ ${appointmentTypeCheck.reason}, skipping appointment`);
          continue;
        }
        
        // Calculate reminder time
        const reminderTime = calculateReminderTime(
          appointment.appointmentTime,
          clinicSettings.advanceNoticeHours,
          clinicSettings.businessHoursOnly,
          clinicSettings.businessStartHour,
          clinicSettings.businessEndHour
        );
        
        if (!reminderTime) {
          skippedCount++;
          console.log(`⏭️ Cannot calculate suitable reminder time for appointment ${appointment.appointmentId || appointment._id}`);
          continue;
        }
        
        // Create reminder record
        const reminderData = {
          appointmentId: appointment.appointmentId || appointment._id.toString(),
          patientPhone: appointment.patientPhone || appointment.patient?.phone,
          doctorName: appointment.doctorName || appointment.doctor?.name || 'Your Doctor',
          appointmentTime: new Date(appointment.appointmentTime),
          clinicName: appointment.clinicName || appointment.clinic?.name || 'Your Clinic',
          appointmentType: appointment.appointmentType || 'appointment',
          clinicId: appointment.clinicId,
          status: 'scheduled',
          createdAt: now,
          reminderTime: reminderTime,
          source: 'auto-discovery',
          clinicSettings: {
            advanceNoticeHours: clinicSettings.advanceNoticeHours,
            businessHoursOnly: clinicSettings.businessHoursOnly,
            enabledAppointmentTypes: clinicSettings.enabledAppointmentTypes
          }
        };
        
        // Validate required fields
        if (!reminderData.patientPhone || !reminderData.appointmentTime) {
          errorCount++;
          console.log(`❌ Missing required fields for appointment ${reminderData.appointmentId}`);
          continue;
        }
        
        // Insert reminder
        await db.collection('scheduled_reminders').insertOne(reminderData);
        newRemindersCount++;
        
        console.log(`✅ Scheduled reminder for appointment ${reminderData.appointmentId} at ${reminderTime.toISOString()}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing appointment ${appointment.appointmentId || appointment._id}:`, error.message);
      }
    }
    
    console.log(`📊 Appointment discovery completed:`, {
      totalAppointments: upcomingAppointments.length,
      newReminders: newRemindersCount,
      skipped: skippedCount,
      errors: errorCount
    });
    
  } catch (error) {
    console.error('❌ Error in appointment discovery:', error);
  }
}

// Perform daily cleanup tasks
async function performDailyCleanup() {
  try {
    console.log('🧹 Starting daily cleanup tasks...');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Clean up old reminder records
    const reminderCleanup = await db.collection('scheduled_reminders').deleteMany({
      $or: [
        { status: 'sent', sentAt: { $lt: thirtyDaysAgo } },
        { status: 'failed', attemptedAt: { $lt: sevenDaysAgo } },
        { status: 'skipped', processedAt: { $lt: sevenDaysAgo } }
      ]
    });
    
    // Clean up old SMS logs
    const logCleanup = await db.collection('sms_logs').deleteMany({
      $or: [
        { status: 'sent', sentAt: { $lt: thirtyDaysAgo } },
        { status: 'failed', attemptedAt: { $lt: sevenDaysAgo } }
      ]
    });
    
    // Clean up orphaned reminders (appointments that no longer exist)
    const orphanedReminders = await db.collection('scheduled_reminders').find({
      status: 'scheduled',
      createdAt: { $lt: sevenDaysAgo }
    }).toArray();
    
    let orphanedCount = 0;
    for (const reminder of orphanedReminders) {
      // Check if appointment still exists (adjust based on your appointment collection structure)
      const appointmentExists = await db.collection('appointments').findOne({
        $or: [
          { appointmentId: reminder.appointmentId },
          { _id: reminder.appointmentId }
        ]
      });
      
      if (!appointmentExists) {
        await db.collection('scheduled_reminders').deleteOne({ _id: reminder._id });
        orphanedCount++;
      }
    }
    
    console.log('✅ Daily cleanup completed:', {
      removedReminders: reminderCleanup.deletedCount,
      removedLogs: logCleanup.deletedCount,
      removedOrphaned: orphanedCount,
      timestamp: now.toISOString()
    });
    
    // Update cleanup log
    await db.collection('system_logs').insertOne({
      type: 'daily_cleanup',
      timestamp: now,
      stats: {
        removedReminders: reminderCleanup.deletedCount,
        removedLogs: logCleanup.deletedCount,
        removedOrphaned: orphanedCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error in daily cleanup:', error);
  }
}

// Perform health check for cron job system
async function performHealthCheck() {
  try {
    // Check database connection
    await db.admin().ping();
    
    // Check for stuck reminders (scheduled but past due)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    
    const stuckReminders = await db.collection('scheduled_reminders').countDocuments({
      status: 'scheduled',
      reminderTime: { $lt: oneHourAgo }
    });
    
    // Check for recent activity
    const recentActivity = await db.collection('sms_logs').countDocuments({
      sentAt: { $gte: new Date(now.getTime() - (24 * 60 * 60 * 1000)) }
    });
    
    // Log health status every hour (only log on first check of each hour)
    if (now.getMinutes() < 5) {
      console.log('💚 Health check:', {
        timestamp: now.toISOString(),
        dbConnected: true,
        stuckReminders: stuckReminders,
        recentActivity: recentActivity
      });
      
      // Store health check log
      await db.collection('system_logs').insertOne({
        type: 'health_check',
        timestamp: now,
        status: 'healthy',
        metrics: {
          stuckReminders,
          recentActivity,
          dbConnected: true
        }
      });
    }
    
    // Alert on stuck reminders (threshold: more than 10)
    if (stuckReminders > 10) {
      console.warn(`⚠️ Warning: ${stuckReminders} stuck reminders detected`);
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    // Log health check failure
    await db.collection('system_logs').insertOne({
      type: 'health_check',
      timestamp: new Date(),
      status: 'failed',
      error: error.message
    }).catch(() => {}); // Ignore if this fails too
  }
}

module.exports = {
  initializeCronJobs,
  processScheduledReminders,
  discoverAndScheduleUpcomingAppointments,
  performDailyCleanup,
  performHealthCheck,
  calculateReminderTime,
  generateReminderMessage,
  getClinicSMSSettings,
  validateAppointmentData,
  adjustToBusinessHours,
  isAppointmentTypeEnabled,
  getClinicAppointmentTypes
};
