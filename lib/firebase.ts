// Clean Firebase initialization - used for auth/analytics in production
// Falls back gracefully when window is undefined (SSR) or analytics not supported
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Prevent double init in HMR / server
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

let analytics: Analytics | null = null
let auth: Auth | null = null
let db: Firestore | null = null

// Client-only initializations
if (typeof window !== 'undefined') {
  // Auth is safe to init client-side
  auth = getAuth(app)
  db = getFirestore(app)
  // Analytics only if supported (not in all browsers / SSR)
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app)
      } catch {}
    }
  })
} else {
  // Server: Firestore can be used with admin-like access if needed, but we keep file DB as primary
  // Initialize Firestore for server if needed (no analytics)
  try {
    db = getFirestore(app)
  } catch {}
  try {
    auth = getAuth(app)
  } catch {}
}

export { analytics, auth, db as firestore }
export default app
