import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required Firebase environment variables:', missingVars);
  // In development, show helpful error
  if (import.meta.env.DEV) {
    throw new Error(`Missing Firebase environment variables: ${missingVars.join(', ')}. Please check your .env file.`);
  }
  // In production, use fallback values to prevent build failures
  console.warn('⚠️ Using fallback Firebase configuration for missing environment variables');
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:placeholder",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PLACEHOLDER"
};

// Determine if we're in development or production
// This auto-detects the environment without needing env variables
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const isDevelopment = import.meta.env.DEV || isLocalhost;

// Fine-grained emulator toggles to support hybrid dev (Functions on emulator, Firestore on prod)
// Defaults: Functions emulator ON in dev, Firestore/Storage/Auth emulators OFF unless explicitly enabled
const useFunctionsEmulator = isDevelopment && (import.meta.env.VITE_USE_FUNCTIONS_EMULATOR ?? "true") !== "false";
const useFirestoreEmulator = isDevelopment && (import.meta.env.VITE_USE_FIRESTORE_EMULATOR ?? "false") === "true";
const useAuthEmulator = isDevelopment && (import.meta.env.VITE_USE_AUTH_EMULATOR ?? "false") === "true";
const useStorageEmulator = isDevelopment && (import.meta.env.VITE_USE_STORAGE_EMULATOR ?? "false") === "true";

// Export for use in other modules (considering any emulator usage)
export const isUsingEmulators = useFunctionsEmulator || useFirestoreEmulator || useAuthEmulator || useStorageEmulator;

console.log(`🔥 Firebase initialized in ${isDevelopment ? 'development' : 'production'} mode`);
console.log(`🔧 Using emulators: ${isUsingEmulators}`);
console.log(`   - Functions emulator: ${useFunctionsEmulator}`);
console.log(`   - Firestore emulator: ${useFirestoreEmulator}`);
console.log(`   - Auth emulator: ${useAuthEmulator}`);
console.log(`   - Storage emulator: ${useStorageEmulator}`);
console.log(`🌐 Hostname: ${typeof window !== 'undefined' ? window.location.hostname : 'server'}`);
console.log(`🔧 DEV mode: ${import.meta.env.DEV}`);
console.log(`🔧 isLocalhost: ${isLocalhost}`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Connect to emulators if enabled (hybrid supported)
if (isUsingEmulators) {
  try {
    if (useFunctionsEmulator) {
      connectFunctionsEmulator(functions, "127.0.0.1", 5001);
      console.log("✅ Connected to Functions emulator on 127.0.0.1:5001");
    }

    if (useFirestoreEmulator) {
      connectFirestoreEmulator(db, "127.0.0.1", 8082);
      console.log("✅ Connected to Firestore emulator on 127.0.0.1:8082");
    }

    if (useAuthEmulator) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099");
      console.log("✅ Connected to Auth emulator on 127.0.0.1:9099");
    }

    if (useStorageEmulator) {
      connectStorageEmulator(storage, "127.0.0.1", 9199);
      console.log("✅ Connected to Storage emulator on 127.0.0.1:9199");
    }
  } catch (e) {
    console.error("❌ Failed to connect to emulators:", e);
  }
} else {
  console.log("🌐 Using production Firebase services");
}

// Initialize Analytics conditionally
export const initializeAnalytics = async () => {
  // Skip analytics in development
  if (isDevelopment) {
    return null;
  }
  
  const analyticsSupported = await isSupported();
  if (analyticsSupported) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
