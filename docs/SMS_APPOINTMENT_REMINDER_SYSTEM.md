# SMS Appointment Reminder System

This document explains how the SMS appointment reminder system works in ProCareSoft.

## Overview

The SMS appointment reminder system automatically sends SMS reminders to patients before their scheduled appointments. The system integrates with the clinic's appointment management workflow and uses cron-jobs.org for scheduling the reminder messages.

## Features

- **Configurable reminder timing**: Set how many hours before the appointment to send reminders (default: 24 hours)
- **Appointment type filtering**: Optionally restrict reminders to specific appointment types
- **Automatic scheduling**: Reminders are scheduled when appointments are created
- **Clinic-specific settings**: Each clinic can have its own reminder settings
- **Daily SMS limits**: Respects the daily SMS sending limits configured for each clinic

## How It Works

1. When a new appointment is created (either through the appointment form or the new patient form), the system checks if SMS reminders are enabled for the clinic.
2. If enabled, the system checks if the appointment type is eligible for reminders based on the clinic's settings.
3. If eligible, the system schedules a reminder task with cron-jobs.org to be executed at the appropriate time before the appointment.
4. When the scheduled time arrives, cron-jobs.org calls the `/api/send-appointment-reminder` endpoint with the appointment details.
5. The API endpoint verifies the appointment status (to avoid sending reminders for cancelled appointments) and sends the SMS using the configured SMS provider.
6. The system logs the SMS sending activity and updates the clinic's daily SMS count.

## Configuration

Reminder settings can be configured in the SMS Communication Center under the Settings tab:

1. **Enable automatic appointment reminders**: Toggle to enable/disable the reminder system
2. **Reminder Hours**: Set how many hours before the appointment to send the reminder (1-168 hours)
3. **Appointment Type for SMS**: Optionally restrict reminders to a specific appointment type

## Technical Implementation

The system uses:

- **Firebase Firestore**: For storing appointment data, SMS logs, and reminder settings
- **cron-jobs.org**: For scheduling the reminder delivery
- **SMS Provider API**: For sending the actual SMS messages
- **Environment Variables**: For storing API keys and configuration

## Troubleshooting

If appointment reminders are not being sent:

1. Check if reminders are enabled in the SMS Settings
2. Verify that the appointment type matches the configured type (if specified)
3. Check if the patient has a valid phone number
4. Check the daily SMS limit hasn't been reached
5. Look for any errors in the SMS logs

## Related Files

- `src/services/sendMessageService.ts`: Contains the core SMS functionality
- `src/pages/dashboard/communication/components/SettingsTab.tsx`: UI for configuring reminders
- `src/pages/dashboard/appointments/new.tsx`: Appointment creation with reminder scheduling
- `src/pages/dashboard/new-patient.tsx`: New patient creation with appointment and reminder
- `src/api/send-appointment-reminder.ts`: API handler for cron-jobs.org
- `pages/api/send-appointment-reminder.ts`: API route for the reminder endpoint
