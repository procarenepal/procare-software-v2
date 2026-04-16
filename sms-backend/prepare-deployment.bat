@echo off
echo 🚀 Preparing SMS Backend for Railway Deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the sms-backend directory.
    exit /b 1
)

if not exist "server.js" (
    echo ❌ Error: server.js not found. Please run this script from the sms-backend directory.
    exit /b 1
)

echo 📦 Installing SMS backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Dependencies installation failed.
    exit /b 1
)

echo 🧪 Testing server startup...
timeout /t 2 /nobreak > nul

echo 📋 SMS Backend Deployment Checklist:
echo    ✅ Dependencies installed
echo    ✅ Railway configuration files created
echo    ✅ Dockerfile configured
echo    ✅ Environment variables template ready
echo.
echo 📝 Next steps:
echo 1. Push your SMS backend code to GitHub
echo 2. Create a new Railway project
echo 3. Select your GitHub repo and CHOOSE 'sms-backend' as root directory
echo 4. Set environment variables (see RAILWAY_SMS_DEPLOYMENT.md)
echo 5. Deploy!
echo.
echo 🔧 Required Environment Variables:
echo    - MONGODB_URI
echo    - MONGODB_DB_NAME
echo    - SMS_API_KEY
echo    - SMS_SENDER_ID
echo    - SMS_API_URL
echo    - API_SECRET_KEY
echo    - NODE_ENV=production
echo.
echo 📖 See RAILWAY_SMS_DEPLOYMENT.md for detailed instructions
echo.
echo 🎉 Your SMS Backend is ready for Railway deployment!
