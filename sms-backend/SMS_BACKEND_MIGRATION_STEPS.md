# Migrating SMS Reminders to a Custom Node.js Backend

This document outlines the step-by-step process to retire Appwrite Functions for SMS reminders and implement a new Node.js Express backend (to be deployed on Vercel) for handling SMS reminders and instant SMS sending. The new backend will support smart scheduling rules and appointment-type-specific reminders.

## 1. Project Structure & Preparation

1.1. **Create a new folder** in your project root named `sms-backend`.

1.2. **Initialize a Node.js project** inside `sms-backend`:
   - Run `npm init -y` to create a `package.json`.

1.3. **Install dependencies**:
   - Express for API server: `npm install express`
   - Node-cron (or similar) for scheduling: `npm install node-cron`
   - Any SMS provider SDK or HTTP client (e.g., `axios`): `npm install axios`
   - (Optional) dotenv for environment variables: `npm install dotenv`

1.4. **Set up your environment variables** for SMS API keys, database URLs, etc.

## 2. Implementing the Express Backend

2.1. **Create an Express server** with endpoints for:
   - Sending instant SMS (`POST /send-sms`)
   - Scheduling appointment reminders (`POST /schedule-reminder`)
   - (Optional) Health check (`GET /health`)

2.2. **Implement authentication** (API key or JWT) to secure your endpoints.

2.3. **Connect to your database** (Firestore, MongoDB, etc.) to fetch appointments, clinic settings, and patient/doctor info.

## 3. Smart Scheduling Logic ✅ COMPLETE

3.1. **✅ IMPLEMENTED: Smart scheduling rules for reminders:**

- **24+ hours away:** Schedule reminder using the clinic's "advance notice" setting (e.g., 24 hours before).
- **4-24 hours away:** Automatically adjust to 2 hours before appointment.
- **2-4 hours away:** Schedule 1 hour before appointment.
- **Less than 2 hours:** Skip reminder (do not send).

3.2. **✅ IMPLEMENTED: Reminder time calculation** based on the appointment's start time and current time.

**Implementation Details:**
- Enhanced `calculateReminderTime()` function in `scheduler.js`
- Integrated with clinic SMS settings from database
- Added business hours support
- Comprehensive validation and error handling
- Added `/test-scheduling` endpoint for testing logic
- Added `/clinic-settings/:clinicId` endpoint to view clinic settings
- See `SMART_SCHEDULING_GUIDE.md` for complete documentation

## 4. Appointment-Type-Specific Reminders ✅ COMPLETE

4.1. **✅ IMPLEMENTED: Fetch the clinic's SMS settings** to check if reminders are enabled for a specific appointment type.

4.2. **✅ IMPLEMENTED: Only schedule reminders** for appointments matching the configured appointment type (as set in your frontend's settings tab).

**Implementation Details:**
- Enhanced `getClinicSMSSettings()` with `enabledAppointmentTypes` support
- Added `isAppointmentTypeEnabled()` function for validation
- Updated `/schedule-reminder` endpoint with appointment type filtering
- Added comprehensive appointment type management endpoints:
  - `GET /appointment-types/:clinicId` - Get all appointment types with stats
  - `PUT /clinic-settings/:clinicId` - Update complete SMS settings
  - `POST /bulk-update-appointment-types/:clinicId` - Bulk manage appointment types
- Enhanced cron job to filter by appointment type before processing
- Added statistics and reporting for appointment types
- See `APPOINTMENT_TYPES_GUIDE.md` for complete documentation

## 5. Cron Job for Automated Reminders ✅ COMPLETE

5.1. **✅ IMPLEMENTED: Multiple cron jobs** (using node-cron) that run at different intervals:
   - **Reminder Processing**: Every 15 minutes - Process and send due reminders
   - **Appointment Discovery**: Every hour - Find new appointments and schedule reminders  
   - **Daily Cleanup**: 2:00 AM daily - Remove old records and orphaned data
   - **Health Monitoring**: Every 5 minutes - Monitor system health and performance

5.2. **✅ IMPLEMENTED: Comprehensive idempotency** mechanisms to prevent duplicate reminders:
   - Unique appointment ID checking before scheduling
   - Status tracking (scheduled/sent/failed/skipped)
   - Retry logic with backoff for failed sends
   - Database constraints to prevent duplicates

**Implementation Details:**
- Enhanced `initializeCronJobs()` with 4 specialized cron jobs
- Added `discoverAndScheduleUpcomingAppointments()` for automatic appointment discovery
- Added `performDailyCleanup()` for maintenance and cleanup
- Added `performHealthCheck()` for system monitoring
- Created `cron-runner.js` for standalone cron job execution
- Added API endpoints for manual cron job triggers (`/trigger-cron/:jobType`)
- Added comprehensive monitoring endpoint (`/cron-status`)
- Enhanced database with system logging collection
- Updated package.json with cron job scripts
- Integrated cron jobs with server startup process
- See `CRON_JOBS_GUIDE.md` for complete documentation

**Key Features:**
- **Smart Discovery**: Automatically finds appointments from your database
- **Multiple Deployment Options**: Integrated, standalone, or API-triggered
- **Comprehensive Monitoring**: Health checks, performance metrics, and logging
- **Production Ready**: Error handling, retry logic, and graceful shutdown

## 6. Integrating with the Frontend

6.1. **Update your frontend** to call the new backend's API endpoints for:
   - Sending instant SMS
   - Scheduling/cancelling reminders

6.2. **Remove all Appwrite Function calls** related to SMS from your frontend and backend code.

## 7. Deployment

7.1. **Deploy the `sms-backend` folder** to Vercel as a serverless Node.js API.

7.2. **Set environment variables** in Vercel for production use.

7.3. **Test all endpoints** and scheduling logic in production.

## 8. Monitoring & Maintenance

8.1. **Add logging and error handling** to all backend endpoints and cron jobs.

8.2. **Set up alerts** for failed SMS sends or backend errors (optional).

---

**Note:**
- The smart scheduling rules and appointment-type filtering must match the logic currently in your frontend (see `SettingsTab.tsx`).
- All reminders and instant SMS should now flow through your new backend API.
- Keep your SMS provider credentials secure and never expose them to the frontend.
