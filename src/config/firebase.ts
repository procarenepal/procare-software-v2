// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Function to validate environment variables
const validateEnvVars = () => {
  const requiredVars = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ];

  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}. ` +
        `Please add them to your .env file.`,
    );
  }
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate environment variables
validateEnvVars();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
let analytics = null;

// Set default persistence to local storage for better UX across tabs
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting Firebase persistence:", error);
});

// Configure custom action code settings for password reset
const getActionCodeSettings = () => {
  const customDomain = import.meta.env.VITE_PASSWORD_RESET_DOMAIN;
  const baseUrl = customDomain || window.location.origin;

  return {
    url: `${baseUrl}/reset-password`,
    handleCodeInApp: true,
  };
};

const actionCodeSettings = getActionCodeSettings();

// Export action code settings for use in password reset
export { actionCodeSettings };

// Initialize analytics safely
// isSupported() returns a promise that resolves to true if analytics is supported in the current environment
// and not blocked by browser settings or extensions.
isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  })
  .catch((err) => {
    // Gracefully handle blocking (e.g., ERR_BLOCKED_BY_CLIENT from ad-blockers)
    console.debug("Firebase Analytics could not be initialized:", err.message);
  });

export { app, auth, db, storage, analytics };
