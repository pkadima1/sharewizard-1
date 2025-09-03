import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Determine if we're in development or production
// This auto-detects the environment without needing env variables
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const isDevelopment = import.meta.env.DEV || isLocalhost;

// Force emulator usage in development
const useEmulators = isDevelopment;

// Export for use in other modules
export const isUsingEmulators = useEmulators;

console.log(`🔥 Firebase initialized in ${isDevelopment ? 'development' : 'production'} mode`);
console.log(`🔧 ${useEmulators ? 'Using emulators' : 'Using production services'}`);
console.log(`🌐 Hostname: ${typeof window !== 'undefined' ? window.location.hostname : 'server'}`);
console.log(`🔧 DEV mode: ${import.meta.env.DEV}`);
console.log(`🔧 isLocalhost: ${isLocalhost}`);
console.log(`🔧 useEmulators: ${useEmulators}`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Connect to emulators if in development mode
if (useEmulators) {
  try {
    // Connect to all emulators for consistent local development
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    console.log("✅ Connected to Functions emulator on 127.0.0.1:5001");
    
    // Connect to Firestore emulator to see the same data as functions
    connectFirestoreEmulator(db, "127.0.0.1", 8082);
    console.log("✅ Connected to Firestore emulator on 127.0.0.1:8082");
    
    // Only connect to Auth emulator if you have auth emulator running
    // For now, use production auth with emulator firestore
    // Uncomment this when you want full emulator setup:
    // connectAuthEmulator(auth, "http://127.0.0.1:9099");
    // console.log("✅ Connected to Auth emulator on 127.0.0.1:9099");
    
    // Connect to Storage emulator
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    console.log("✅ Connected to Storage emulator on 127.0.0.1:9199");
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
