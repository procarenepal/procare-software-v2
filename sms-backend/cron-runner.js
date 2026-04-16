#!/usr/bin/env node

/**
 * Standalone Cron Job Runner for SMS Reminders
 * 
 * This file can be used to run cron jobs independently from the main server,
 * which is useful for distributed deployments or dedicated cron job servers.
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const { 
  initializeCronJobs,
  processScheduledReminders,
  discoverAndScheduleUpcomingAppointments,
  performDailyCleanup,
  performHealthCheck
} = require('./scheduler');

// Load environment variables
dotenv.config();

// MongoDB connection
let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI);

async function connectToDatabase() {
  try {
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGODB_DB_NAME);
    console.log('✅ Cron runner connected to MongoDB Atlas');
    
    // Make db available globally for scheduler functions
    global.db = db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Starting SMS Reminder Cron Job Runner...');
  console.log('📅 Time:', new Date().toISOString());
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  
  try {
    // Connect to database
    await connectToDatabase();
    
    // Check command line arguments for specific job execution
    const args = process.argv.slice(2);
    const jobType = args[0];
    
    if (jobType) {
      // Run specific job once and exit
      console.log(`🎯 Running specific job: ${jobType}`);
      
      switch (jobType) {
        case 'process-reminders':
          await processScheduledReminders();
          break;
        case 'discover-appointments':
          await discoverAndScheduleUpcomingAppointments();
          break;
        case 'daily-cleanup':
          await performDailyCleanup();
          break;
        case 'health-check':
          await performHealthCheck();
          break;
        default:
          console.log('❌ Unknown job type. Available jobs:');
          console.log('   - process-reminders');
          console.log('   - discover-appointments');
          console.log('   - daily-cleanup');
          console.log('   - health-check');
          process.exit(1);
      }
      
      console.log('✅ Job completed successfully');
      process.exit(0);
    } else {
      // Initialize and run all cron jobs continuously
      console.log('⏰ Initializing all cron jobs...');
      await initializeCronJobs();
      
      console.log('🎯 Cron jobs are now running. Press Ctrl+C to stop.');
      
      // Keep the process alive
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down cron job runner...');
        await mongoClient.close();
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        await mongoClient.close();
        process.exit(0);
      });
      
      // Log startup completion
      console.log('✅ SMS Reminder Cron Job Runner is active');
    }
    
  } catch (error) {
    console.error('❌ Error in cron job runner:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the cron runner
main().catch(error => {
  console.error('❌ Failed to start cron job runner:', error);
  process.exit(1);
});
