import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * Looks for service account JSON at:
 * 1. FIREBASE_SERVICE_ACCOUNT_PATH env var
 * 2. src/config/firebase-service-account.json
 */
export const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
      || path.resolve(__dirname, "firebase-service-account.json");

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log("[Firebase] Admin SDK initialized successfully");
    } else {
      console.warn("[Firebase] Service account file not found. Push notifications disabled.");
      console.warn(`[Firebase] Expected path: ${serviceAccountPath}`);
    }
  } catch (err) {
    console.error("[Firebase] Failed to initialize:", err.message);
  }

  return firebaseApp;
};

/**
 * Get Firebase Admin instance
 */
export const getFirebaseAdmin = () => admin;

/**
 * Check if Firebase is initialized
 */
export const isFirebaseInitialized = () => !!firebaseApp;

export default { initFirebase, getFirebaseAdmin, isFirebaseInitialized };
