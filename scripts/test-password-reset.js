/**
 * Test Password Reset Flow
 * 
 * This script helps test the password reset functionality locally.
 */

const { sendPasswordResetEmail } = require('firebase/auth');
const { auth } = require('../src/config/firebase');

const testPasswordReset = async () => {
  try {
    console.log('🧪 Testing Password Reset Flow...\n');
    
    // Test email (replace with your actual email)
    const testEmail = 'test@example.com';
    
    console.log('📧 Sending password reset email to:', testEmail);
    console.log('🔗 Expected reset URL: http://localhost:5173/reset-password\n');
    
    // Send password reset email
    await sendPasswordResetEmail(auth, testEmail, {
      url: 'http://localhost:5173/reset-password',
      handleCodeInApp: true,
    });
    
    console.log('✅ Password reset email sent successfully!');
    console.log('📬 Check your email for the reset link');
    console.log('🔗 The link should point to: http://localhost:5173/reset-password');
    
  } catch (error) {
    console.error('❌ Error testing password reset:', error.message);
  }
};

// Run the test
testPasswordReset();
