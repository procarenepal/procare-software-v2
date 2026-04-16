#!/usr/bin/env node
/**
 * System Initialization Script with Admin SDK
 * 
 * This script uses the Firebase Admin SDK to bypass security rules
 * and initialize the system directly.
 */

// Using CommonJS syntax for Node.js
require('dotenv').config();
const admin = require('firebase-admin');
const { createUserWithEmailAndPassword, getAuth } = require('firebase/auth');
const { initializeApp } = require('firebase/app');
const readline = require('readline');

// Initialize Firebase Admin with application default credentials or service account
let serviceAccount;
try {
  // Try to load from environment variable first
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Otherwise, prompt for the service account path
    console.log('No service account found in environment variables.');
    console.log('Please download a service account key file from the Firebase console');
    console.log('at: https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk');
    
    // Will continue without admin SDK, using client SDK with security rules override
    console.log('\nContinuing with client SDK - this may still fail if security rules are too restrictive.');
  }
} catch (error) {
  console.error('Error parsing service account JSON:', error);
  process.exit(1);
}

// Initialize Admin SDK if we have service account credentials
let adminApp;
if (serviceAccount) {
  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

// Also initialize the regular Firebase SDK for auth operations
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

// Function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to validate password
function isValidPassword(password) {
  return password.length >= 8;
}

// Main initialization function
async function initializeSystem() {
  console.log('\n=== Procare Software System Initialization (Admin Access) ===\n');
  
  try {
    const db = adminApp ? admin.firestore() : null;
    
    if (!db) {
      console.log('⚠️ Running without Admin SDK - operations may fail due to security rules.');
      console.log('Please follow the instructions at the end to deploy proper security rules.\n');
    }
    
    let isInitialized = false;
    
    // Check if system is already initialized
    if (db) {
      try {
        const docRef = db.collection('system_config').doc('system_status');
        const docSnap = await docRef.get();
        
        if (docSnap.exists && docSnap.data().initialized) {
          isInitialized = true;
        } else {
          // Also check if any super admin exists
          const usersRef = db.collection('users');
          const querySnapshot = await usersRef.where('role', '==', 'super-admin').get();
          isInitialized = !querySnapshot.empty;
        }
      } catch (error) {
        console.error('Error checking system initialization:', error);
      }
    } else {
      // Without admin access, assume not initialized
      console.log('Skipping initialization check due to lack of admin access.');
    }
    
    if (isInitialized) {
      console.log('\n⚠️  System appears to be already initialized and a super admin already exists.');
      
      const resetConfirmation = await question('Do you want to continue anyway? (y/N): ');
      
      if (resetConfirmation.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        rl.close();
        return;
      }
    }
    
    console.log('\n📋 Creating Super Admin Account');
    console.log('This account will have full access to manage the entire platform.\n');
    
    // Get super admin email
    let email = '';
    while (!isValidEmail(email)) {
      email = (await question('Enter Super Admin Email: ')).trim();
      
      if (!isValidEmail(email)) {
        console.log('❌ Invalid email format. Please enter a valid email.');
      }
    }
    
    // Get super admin password
    let password = '';
    while (!isValidPassword(password)) {
      password = (await question('Enter Super Admin Password (min 8 characters): ')).trim();
      
      if (!isValidPassword(password)) {
        console.log('❌ Password must be at least 8 characters long.');
      }
    }
    
    // Get display name
    let displayName = '';
    while (!displayName) {
      displayName = (await question('Enter Super Admin Name: ')).trim();
      
      if (!displayName) {
        console.log('❌ Name cannot be empty.');
      }
    }
    
    // Confirm details
    console.log('\n--- Please confirm the details ---');
    console.log(`Email: ${email}`);
    console.log(`Name: ${displayName}`);
    
    const confirmDetails = await question('\nIs this information correct? (Y/n): ');
    
    if (confirmDetails.toLowerCase() === 'n') {
      console.log('Operation cancelled by user.');
      rl.close();
      return;
    }
    
    console.log('\n🔄 Creating super admin account...');
    
    // Create user in Firebase Auth
    let userCredential;
    let uid;
    
    try {
      if (adminApp) {
        // Use admin SDK to create user
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName
        });
        uid = userRecord.uid;
        console.log(`✅ User created in Firebase Auth with ID: ${uid}`);
      } else {
        // Use client SDK
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
        console.log(`✅ User created in Firebase Auth with ID: ${uid}`);
      }
    } catch (error) {
      console.error('Error creating user in Firebase Auth:', error);
      rl.close();
      process.exit(1);
    }
    
    // Initialize roles in Firestore
    console.log('🔄 Initializing system roles...');
    
    const roles = [
      {
        name: 'Super Admin',
        description: 'Full access to all system features',
        systemRole: 'super-admin',
        permissions: ['*'],
        createdAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date(),
        updatedAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date()
      },
      {
        name: 'Clinic Admin',
        description: 'Full access to clinic features',
        systemRole: 'clinic-admin',
        permissions: ['clinic:*', 'users:*', 'patients:*', 'appointments:*'],
        createdAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date(),
        updatedAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date()
      },
      {
        name: 'Doctor',
        description: 'Access to patient and appointment features',
        systemRole: 'doctor',
        permissions: ['patients:read', 'patients:write', 'appointments:*'],
        createdAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date(),
        updatedAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date()
      },
      {
        name: 'Nurse',
        description: 'Limited access to patient and appointment features',
        systemRole: 'nurse',
        permissions: ['patients:read', 'patients:write', 'appointments:read', 'appointments:write'],
        createdAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date(),
        updatedAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date()
      },
      {
        name: 'Receptionist',
        description: 'Access to appointment scheduling',
        systemRole: 'receptionist',
        permissions: ['patients:read', 'appointments:read', 'appointments:write'],
        createdAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date(),
        updatedAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date()
      },
      {
        name: 'Staff',
        description: 'Basic access to system',
        systemRole: 'staff',
        permissions: ['patients:read', 'appointments:read'],
        createdAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date(),
        updatedAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date()
      }
    ];
    
    try {
      if (db) {
        // Use admin SDK for batch operations
        const batch = db.batch();
        
        // Add all roles
        for (const role of roles) {
          const { systemRole } = role;
          const roleRef = db.collection('roles').doc(systemRole);
          batch.set(roleRef, role);
        }
        
        // Create the user document
        const userDocRef = db.collection('users').doc(uid);
        batch.set(userDocRef, {
          email,
          displayName,
          role: 'super-admin',
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Set system as initialized
        const systemStatusRef = db.collection('system_config').doc('system_status');
        batch.set(systemStatusRef, {
          initialized: true,
          initializedBy: uid,
          initializedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Commit the batch
        await batch.commit();
        console.log('✅ System roles and user data created in Firestore');
      } else {
        console.log('⚠️ Skipping Firestore operations due to lack of admin access.');
        console.log('You will need to set up Firestore security rules and try again.');
      }
    } catch (error) {
      console.error('Error initializing system in Firestore:', error);
      // Continue execution to show next steps
    }
    
    console.log('\n==== Next Steps ====');
    console.log('1. Deploy Firestore security rules using:');
    console.log('   firebase deploy --only firestore:rules');
    console.log('\n2. Log in to the application with:');
    console.log(`   Email: ${email}`);
    console.log('   Password: (the password you entered)');
    
  } catch (error) {
    console.error('\n❌ Error during system initialization:');
    console.error(error);
  } finally {
    if (rl) rl.close();
    // Need to explicitly exit since Firebase keeps connections open
    setTimeout(() => {
      if (adminApp) {
        adminApp.delete().then(() => process.exit(0));
      } else {
        process.exit(0);
      }
    }, 1000);
  }
}

// Run the initialization
initializeSystem();
