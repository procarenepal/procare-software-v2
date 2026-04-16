#!/usr/bin/env node
/**
 * System Initialization Script with Debugging
 * 
 * This script identifies where Firebase permission errors occur
 */

// Using CommonJS syntax
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore, collection, doc, getDoc, getDocs, setDoc, query, where, serverTimestamp } = require('firebase/firestore');
const { createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const readline = require('readline');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create readline interface
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

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('=== Firebase Permission Debugging ===');

async function runTests() {
  try {
    // Test 1: Reading from 'system_config' collection
    console.log('\nTest 1: Reading from system_config collection');
    try {
      const docRef = doc(db, 'system_config', 'system_status');
      console.log('Getting document reference...');
      const docSnap = await getDoc(docRef);
      console.log('Document exists:', docSnap.exists());
      if (docSnap.exists()) {
        console.log('Document data:', docSnap.data());
      }
      console.log('✅ Test 1 passed: Can read from system_config collection');
    } catch (error) {
      console.error('❌ Test 1 failed: Cannot read from system_config collection');
      console.error(`Error: ${error.message}`);
      console.error('Code:', error.code);
    }

    // Test 2: Reading from 'users' collection
    console.log('\nTest 2: Reading from users collection');
    try {
      const usersRef = collection(db, 'users');
      console.log('Getting collection reference...');
      const usersSnap = await getDocs(usersRef);
      console.log('Number of users:', usersSnap.size);
      console.log('✅ Test 2 passed: Can read from users collection');
    } catch (error) {
      console.error('❌ Test 2 failed: Cannot read from users collection');
      console.error(`Error: ${error.message}`);
      console.error('Code:', error.code);
    }

    // Test 3: Querying 'users' collection
    console.log('\nTest 3: Querying users collection');
    try {
      const usersRef = collection(db, 'users');
      console.log('Creating query...');
      const q = query(usersRef, where('role', '==', 'super-admin'));
      const querySnapshot = await getDocs(q);
      console.log('Number of super admins:', querySnapshot.size);
      console.log('✅ Test 3 passed: Can query users collection');
    } catch (error) {
      console.error('❌ Test 3 failed: Cannot query users collection');
      console.error(`Error: ${error.message}`);
      console.error('Code:', error.code);
    }

    // Test 4: Writing to 'system_config' collection
    console.log('\nTest 4: Writing to system_config collection');
    try {
      console.log('Writing test document...');
      const testDocRef = doc(db, 'system_config', 'test_permissions');
      await setDoc(testDocRef, {
        test: true,
        timestamp: serverTimestamp()
      });
      console.log('✅ Test 4 passed: Can write to system_config collection');
    } catch (error) {
      console.error('❌ Test 4 failed: Cannot write to system_config collection');
      console.error(`Error: ${error.message}`);
      console.error('Code:', error.code);
    }

    // Test 5: Writing to 'roles' collection
    console.log('\nTest 5: Writing to roles collection');
    try {
      console.log('Writing test role...');
      const testRoleRef = doc(db, 'roles', 'test_role');
      await setDoc(testRoleRef, {
        name: 'Test Role',
        permissions: ['test'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Test 5 passed: Can write to roles collection');
    } catch (error) {
      console.error('❌ Test 5 failed: Cannot write to roles collection');
      console.error(`Error: ${error.message}`);
      console.error('Code:', error.code);
    }

    // Test 6: Creating a user (optional - will only run if you confirm)
    console.log('\nTest 6: Creating a user (This will create a real test user in Firebase Auth)');
    const shouldRunTest6 = await question('Run user creation test? (y/N): ');
    
    if (shouldRunTest6.toLowerCase() === 'y') {
      try {
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'Test1234!';
        
        console.log(`Creating test user with email: ${testEmail}`);
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        console.log('User created with ID:', userCredential.user.uid);
        
        console.log('Updating user profile...');
        await updateProfile(userCredential.user, {
          displayName: 'Test User'
        });
        
        console.log('Writing user to Firestore...');
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: testEmail,
          displayName: 'Test User',
          role: 'test-user',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ Test 6 passed: Can create a user and write to users collection');
      } catch (error) {
        console.error('❌ Test 6 failed: Cannot create a user or write to users collection');
        console.error(`Error: ${error.message}`);
        console.error('Code:', error.code);
      }
    } else {
      console.log('Test 6 skipped.');
    }

  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    rl.close();
    // Need to explicitly exit since Firebase keeps connections open
    setTimeout(() => process.exit(0), 1000);
  }
}

// Run the tests
runTests();
