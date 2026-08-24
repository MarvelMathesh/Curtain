// Clean Firebase initialization - used for auth/analytics in production
// Falls back gracefully when env missing (Vercel without vars) or SSR
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

function isConfigValid() {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
}

let app: ReturnType<typeof initializeApp> | null = null
if (getApps().length) {
  app = getApps()[0] as any
} else if (isConfigValid()) {
  try {
    app = initializeApp(firebaseConfig)
  } catch (e: any) {
    console.warn('[firebase] init failed:', e?.message)
    app = null
  }
} else {
  console.warn('[firebase] Missing NEXT_PUBLIC_FIREBASE_* — Firebase disabled, using file DB fallback')
}

let analytics: Analytics | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (app) {
  if (typeof window !== 'undefined') {
    try { auth = getAuth(app) } catch {}
    try { db = getFirestore(app) } catch {}
    isAnalyticsSupported().then((supported) => {
      if (supported && app) {
        try { analytics = getAnalytics(app) } catch {}
      }
    })
  } else {
    try { db = getFirestore(app) } catch {}
    try { auth = getAuth(app) } catch {}
  }
}

export { analytics, auth, db as firestore, app }
export default app
