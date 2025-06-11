/**
 * Firebase Admin configuration for hybrid development
 * This ensures Functions emulator connects to production Firestore
 */

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore as getFirestoreAdmin } from 'firebase-admin/firestore';

let app: any;

export function initializeFirebaseAdmin() {
  // Check if app already exists
  if (getApps().length > 0) {
    app = getApp();
    console.log('✅ Using existing Firebase Admin app');
    return app;
  }

  try {
    // Check if we're in the emulator environment
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || 
                      process.env.NODE_ENV === 'development';

    if (isEmulator) {
      // In emulator mode, explicitly connect to production Firestore
      console.log('🔧 Initializing Firebase Admin for emulator with production services');
      
      // Remove any emulator environment variables that might interfere
      delete process.env.FIRESTORE_EMULATOR_HOST;
      
      app = initializeApp({
        projectId: 'engperfecthlc',
      });
      
    } else {
      // Production mode - use default initialization
      console.log('🌐 Initializing Firebase Admin for production');
      app = initializeApp();
    }

    console.log('✅ Firebase Admin initialized successfully');
    return app;

  } catch (error: any) {
    if (error.code === 'app/duplicate-app') {
      // App already exists
      app = getApp();
      console.log('✅ Using existing Firebase Admin app');
      return app;
    } else {
      console.error('❌ Firebase Admin initialization error:', error);
      throw error;
    }
  }
}

export function getFirestore() {
  const app = initializeFirebaseAdmin();
  return getFirestoreAdmin(app);
}
