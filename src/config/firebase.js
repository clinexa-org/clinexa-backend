import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 * Priority:
 * 1. Environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL)
 * 2. FIREBASE_SERVICE_ACCOUNT_PATH env var
 * 3. src/config/firebase-service-account.json file
 */
export const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    // Debug: Log which env vars are present
    console.log("[Firebase] Checking environment variables...");
    console.log("[Firebase] FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "SET" : "NOT SET");
    console.log("[Firebase] FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? `SET (${process.env.FIREBASE_PRIVATE_KEY.length} chars)` : "NOT SET");
    console.log("[Firebase] FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "SET" : "NOT SET");

    // Option 1: Use environment variables (recommended for Vercel)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Check if private key has correct format
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error("[Firebase] ERROR: Private key missing BEGIN header!");
      }
      if (!privateKey.includes('-----END PRIVATE KEY-----')) {
        console.error("[Firebase] ERROR: Private key missing END footer!");
      }

      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };

      const config = {
        credential: admin.credential.cert(serviceAccount)
      };

      if (process.env.FIREBASE_DATABASE_URL) {
        config.databaseURL = process.env.FIREBASE_DATABASE_URL;
      }

      firebaseApp = admin.initializeApp(config);
      
      console.log("[Firebase] Admin SDK initialized from environment variables ✓");
      if (config.databaseURL) console.log("[Firebase] Realtime Database configured ✓");
      return firebaseApp;
    }

    // Option 2: Use service account file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
      || path.resolve(__dirname, "firebase-service-account.json");

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log("[Firebase] Admin SDK initialized from file");
    } else {
      console.warn("[Firebase] No Firebase credentials found. Push notifications disabled.");
      console.warn("[Firebase] Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL env vars.");
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
