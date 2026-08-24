// Firebase Admin — fully lazy. The SDK is dynamically imported only when
// USE_FIRESTORE=true, so serverless bundles never include it in file-DB mode.
// (Static import of firebase-admin crashes Vercel functions via native grpc deps.)

let adminAuth: any = null
let adminDb: any = null
let initError: string | null = null
let initPromise: Promise<boolean> | null = null

async function tryInitAdmin(): Promise<boolean> {
  if (adminDb && adminAuth) return true
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
      if (!saJson && !saB64 && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        initError = 'No Firebase Admin credentials (set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS)'
        return false
      }
      // Dynamic import — only executed when credentials exist
      const adminAppMod = await import('firebase-admin/app')
      const { cert, applicationDefault } = adminAppMod as any
      const { getAuth: getAdminAuth } = await import('firebase-admin/auth')
      const { getFirestore: getAdminFirestore } = await import('firebase-admin/firestore')

      const apps = (adminAppMod as any).getApps()
      let app: any
      if (apps.length) {
        app = apps[0]
      } else if (saJson) {
        const svc = JSON.parse(saJson)
        app = (adminAppMod as any).initializeApp({ credential: cert(svc), projectId: svc.project_id || projectId })
      } else if (saB64) {
        const svc = JSON.parse(Buffer.from(saB64, 'base64').toString('utf-8'))
        app = (adminAppMod as any).initializeApp({ credential: cert(svc), projectId: svc.project_id || projectId })
      } else {
        app = (adminAppMod as any).initializeApp({ credential: applicationDefault(), projectId })
      }
      adminAuth = getAdminAuth(app)
      adminDb = getAdminFirestore(app)
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        console.log('[firebase-admin] Using Firestore emulator', process.env.FIRESTORE_EMULATOR_HOST)
      }
      return true
    } catch (e: any) {
      initError = e?.message || String(e)
      console.warn('[firebase-admin] init failed:', initError)
      return false
    }
  })()
  return initPromise
}

export async function getAdminAuthSafe(): Promise<any | null> {
  const ok = await tryInitAdmin()
  return ok ? adminAuth : null
}
export async function getAdminDb(): Promise<any | null> {
  const ok = await tryInitAdmin()
  return ok ? adminDb : null
}
export async function isAdminReady(): Promise<boolean> {
  return tryInitAdmin()
}
export function getAdminInitError(): string | null {
  return initError
}
// Sync flag: only checks the env toggle (no SDK load). Callers use the async
// helpers above when this returns true.
export function shouldUseFirestore(): boolean {
  return process.env.USE_FIRESTORE === 'true'
}
