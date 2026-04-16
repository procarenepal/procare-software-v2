# Railway SMS Backend Deployment Guide

## Overview
This guide covers deploying just the SMS Backend service with cron jobs on Railway.

## Quick Deployment Steps

### 1. Create New Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project" 
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. **Important**: Select only the `sms-backend` folder as the root directory

### 2. Configure Environment Variables

In Railway project settings → Variables, add:

```bash
# Required Variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
MONGODB_DB_NAME=procaresoft_sms
SMS_API_KEY=your_sms_api_key_here
SMS_SENDER_ID=your_sms_sender_id_here
SMS_API_URL=your_sms_provider_url_here
API_SECRET_KEY=your_secret_key_for_authentication

# Environment Settings
NODE_ENV=production
PORT=3000
```

### 3. Deploy

Railway will automatically:
- Detect it's a Node.js project
- Install dependencies with `npm ci`
- Start the service with `npm start`
- Run cron jobs automatically (they're integrated in server.js)

### 4. Verify Deployment

Once deployed, test these endpoints:
- `https://your-app.up.railway.app/health` - Health check
- `https://your-app.up.railway.app/cron-status` - Cron jobs status

## Cron Jobs Configuration

Your SMS backend runs these cron jobs automatically:
- **Process Reminders**: Every 15 minutes
- **Discover Appointments**: Every hour
- **Daily Cleanup**: 2:00 AM daily
- **Health Check**: Every 5 minutes

## API Endpoints

Your SMS backend provides these endpoints:
- `POST /send-sms` - Send instant SMS
- `POST /schedule-reminder` - Schedule appointment reminder
- `GET /sms-logs` - Get SMS delivery logs
- `GET /cron-status` - Check cron job status
- `POST /trigger-cron/:jobType` - Manual cron job triggers

## Database Setup Options

### Option 1: Use Existing MongoDB Atlas
Just add your existing MongoDB Atlas connection string to Railway environment variables.

### Option 2: Railway MongoDB Plugin
1. In Railway project, click "New Service"
2. Search for "MongoDB" 
3. Deploy MongoDB service
4. Railway will provide connection details

### Option 3: Railway PostgreSQL (if you want to switch)
1. Click "New Service" → "Database" → "PostgreSQL"
2. Update your code to use PostgreSQL instead of MongoDB

## Frontend Integration

Update your main application to point to the Railway SMS backend:

```javascript
// In your main app, update API calls to:
const SMS_BACKEND_URL = 'https://your-sms-backend.up.railway.app';

// Example API call:
fetch(`${SMS_BACKEND_URL}/schedule-reminder`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_secret_key'
  },
  body: JSON.stringify(appointmentData)
});
```

## Monitoring & Logs

1. **Railway Dashboard**: View logs and metrics
2. **Application Logs**: Monitor cron job execution
3. **Health Endpoints**: Check service status
4. **Database Monitoring**: Monitor SMS logs collection

## Scaling

Railway can automatically scale your SMS backend based on usage. The cron jobs will continue running regardless of scaling.

## Troubleshooting

### Common Issues:

1. **Cron Jobs Not Running**:
   - Check Railway logs for errors
   - Verify environment variables are set
   - Test manual cron triggers: `POST /trigger-cron/process-reminders`

2. **Database Connection Issues**:
   - Verify MONGODB_URI is correct
   - Check database name matches
   - Ensure database allows connections from Railway IPs

3. **SMS Not Sending**:
   - Check SMS API credentials
   - Verify SMS provider URL is correct
   - Check SMS logs: `GET /sms-logs`

### Debug Commands:

```bash
# Check cron status
curl https://your-app.up.railway.app/cron-status

# Manually trigger reminder processing
curl -X POST https://your-app.up.railway.app/trigger-cron/process-reminders \
  -H "X-API-Key: your_secret_key"

# Check recent SMS logs
curl https://your-app.up.railway.app/sms-logs \
  -H "X-API-Key: your_secret_key"
```

## Production Considerations

1. **API Security**: Keep your API_SECRET_KEY secure
2. **Rate Limiting**: Consider implementing rate limiting for SMS endpoints
3. **Error Handling**: Monitor failed SMS attempts
4. **Database Indexing**: Ensure proper indexes on appointment queries
5. **Backup Strategy**: Regular database backups

Your SMS backend with cron jobs will be fully functional on Railway!
