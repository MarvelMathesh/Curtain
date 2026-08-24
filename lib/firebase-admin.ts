import { initializeApp as initAdmin, getApps as getAdminApps, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'

let adminApp: ReturnType<typeof initAdmin> | null = null
let adminAuth: ReturnType<typeof getAdminAuth> | null = null
let adminDb: ReturnType<typeof getAdminFirestore> | null = null
let initError: string | null = null

function tryInitAdmin() {
  if (adminApp) return adminApp
  if (getAdminApps().length) {
    adminApp = getAdminApps()[0]!
    try { adminAuth = getAdminAuth(adminApp) } catch {}
    try { adminDb = getAdminFirestore(adminApp) } catch {}
    return adminApp
  }
  // Try service account from env
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
  try {
    if (saJson) {
      const svc = JSON.parse(saJson)
      adminApp = initAdmin({ credential: cert(svc), projectId: svc.project_id || projectId })
    } else if (saB64) {
      const svc = JSON.parse(Buffer.from(saB64, 'base64').toString('utf-8'))
      adminApp = initAdmin({ credential: cert(svc), projectId: svc.project_id || projectId })
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      adminApp = initAdmin({ credential: applicationDefault(), projectId })
    } else {
      // Fallback: try init with projectId only (works with ADC on GCP, else will fail gracefully)
      if (projectId) {
        try {
          adminApp = initAdmin({ projectId })
        } catch (e: any) {
          if (!e.message?.includes('already exists')) throw e
          adminApp = getAdminApps()[0]!
        }
      } else {
        initError = 'No Firebase Admin credentials (set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS)'
        return null
      }
    }
    adminAuth = getAdminAuth(adminApp)
    adminDb = getAdminFirestore(adminApp)
    // Helpful for emulator
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      console.log('[firebase-admin] Using Firestore emulator', process.env.FIRESTORE_EMULATOR_HOST)
    }
    return adminApp
  } catch (e: any) {
    initError = e.message || String(e)
    console.warn('[firebase-admin] init failed:', initError)
    return null
  }
}

// Lazy getters
export function getAdminApp() {
  if (!adminApp) tryInitAdmin()
  return adminApp
}
export function getAdminAuthSafe() {
  if (!adminAuth) tryInitAdmin()
  return adminAuth
}
export function getAdminDb() {
  if (!adminDb) tryInitAdmin()
  return adminDb
}
export function isAdminReady(): boolean {
  return !!getAdminDb() && !!getAdminAuthSafe()
}
export function getAdminInitError(): string | null {
  return initError
}
// Helper to check if Firestore should be used
export function shouldUseFirestore(): boolean {
  return process.env.USE_FIRESTORE === 'true' && isAdminReady()
}
