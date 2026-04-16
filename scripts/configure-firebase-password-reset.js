/**
 * Firebase Password Reset Configuration Script
 * 
 * This script helps configure Firebase for custom password reset URLs.
 * Run this script to get the configuration details needed for Firebase Console.
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const getFirebaseConfig = () => {
  const config = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    currentDomain: process.env.VITE_APP_DOMAIN || 'localhost:3000'
  };

  return config;
};

const generateConfiguration = () => {
  const config = getFirebaseConfig();
  
  console.log('🔧 Firebase Password Reset Configuration');
  console.log('=====================================\n');
  
  console.log('📋 Configuration Details:');
  console.log(`Project ID: ${config.projectId}`);
  console.log(`Auth Domain: ${config.authDomain}`);
  console.log(`Current Domain: ${config.currentDomain}\n`);
  
  console.log('🌐 Custom Password Reset URL:');
  console.log(`https://${config.currentDomain}/reset-password\n`);
  
  console.log('📝 Steps to Configure in Firebase Console:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log(`2. Select project: ${config.projectId}`);
  console.log('3. Go to Authentication > Templates');
  console.log('4. Click on "Password reset" template');
  console.log('5. Set Action URL to:');
  console.log(`   https://${config.currentDomain}/reset-password\n`);
  
  console.log('🔒 Authorized Domains:');
  console.log('1. Go to Authentication > Settings');
  console.log('2. Add these domains to "Authorized domains":');
  console.log(`   - ${config.currentDomain}`);
  if (config.currentDomain !== 'localhost:3000') {
    console.log(`   - www.${config.currentDomain}`);
  }
  console.log('\n');
  
  console.log('📧 Email Template Customization:');
  console.log('Subject: Reset your password for Procare Software');
  console.log('Message:');
  console.log('Hello,');
  console.log('');
  console.log('Follow this link to reset your Procare Software password for your %EMAIL% account.');
  console.log('');
  console.log('%LINK%');
  console.log('');
  console.log('If you didn\'t ask to reset your password, you can ignore this email.');
  console.log('');
  console.log('Thanks,');
  console.log('Your Procare Software team\n');
  
  console.log('✅ After configuration:');
  console.log('1. Test password reset flow');
  console.log('2. Verify email links go to custom page');
  console.log('3. Check that password reset works end-to-end\n');
  
  // Generate a configuration file
  const configData = {
    firebase: {
      projectId: config.projectId,
      authDomain: config.authDomain,
      customResetUrl: `https://${config.currentDomain}/reset-password`,
      authorizedDomains: [
        config.currentDomain,
        ...(config.currentDomain !== 'localhost:3000' ? [`www.${config.currentDomain}`] : [])
      ]
    },
    emailTemplate: {
      subject: 'Reset your password for Procare Software',
      message: `Hello,

Follow this link to reset your Procare Software password for your %EMAIL% account.

%LINK%

If you didn't ask to reset your password, you can ignore this email.

Thanks,
Your Procare Software team`
    }
  };
  
  const configPath = path.join(__dirname, '..', 'firebase-password-reset-config.json');
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  
  console.log(`📄 Configuration saved to: ${configPath}`);
};

// Run the configuration generator
generateConfiguration();
