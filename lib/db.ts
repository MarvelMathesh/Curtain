import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { DB, User } from './types'
import { seedVenues, seedEvents, showsFromEvents } from './seed'
import { v4 as uuid } from 'uuid'
import { randomBytes } from 'crypto'

// In serverless (Vercel) the repo FS is read-only/ephemeral; /tmp is the only writable.
// We keep file DB for demo/dev only. In production, warn and use /tmp.
const isProd = process.env.NODE_ENV === 'production'
const DB_PATH = isProd
  ? path.join('/tmp', 'curtain-store.json')
  : path.join(process.cwd(), 'data', 'store.json')

let memoryDB: DB | null = null
let writeQueue: Promise<void> = Promise.resolve()

function ensureDataDir() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function loadFromDisk(): DB {
  ensureDataDir()
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      // basic shape guard
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.shows)) return parsed as DB
      console.warn('[db] store.json shape invalid, reseeding')
    } catch (e) {
      console.warn('[db] store.json parse failed, reseeding', e)
    }
  }
  if (isProd) {
    console.warn('[db] Using ephemeral /tmp store in production — data will be lost on redeploy/scale. Use external DB (Postgres/Firestore) for durability.')
  }
  return createSeeded()
}

function createSeeded(): DB {
  const adminId = uuid()
  const organiserId = uuid()
  const customerId = uuid()
  // Seed demo accounts only in dev or when explicitly allowed
  // In prod we still seed for demo but warn
  if (isProd) console.warn('[db] Seeding demo curtain.* accounts — change passwords via admin panel')
  const users: User[] = [
    { id: adminId, email: 'admin@curtain.in', name: 'Curtain Admin', passwordHash: bcrypt.hashSync('admin123', 10), role: 'admin', createdAt: new Date().toISOString() },
    { id: organiserId, email: 'organiser@curtain.in', name: 'Riya Mehta', passwordHash: bcrypt.hashSync('organiser123', 10), role: 'organiser', createdAt: new Date().toISOString() },
    { id: customerId, email: 'customer@curtain.in', name: 'Aarav Sharma', passwordHash: bcrypt.hashSync('customer123', 10), role: 'customer', createdAt: new Date().toISOString() },
  ]
  const venues = seedVenues(adminId)
  const events = seedEvents(organiserId, venues)
  const shows = showsFromEvents(events, venues)
  const s1 = shows.find(s=>s.eventId==='e1')!
  const toBook = s1.seats.slice(0, 72)
  toBook.forEach(ss=> { ss.status='booked'; ss.bookedBy=customerId })
  const bookingsSeed: DB['bookings'] = toBook.length ? [{
    id: uuid(),
    reference: `CURT-${randomBytes(3).toString('hex').toUpperCase()}${(randomBytes(2).readUInt16BE(0)%900+100)}`,
    userId: customerId,
    eventId: 'e1',
    showId: s1.id,
    seatIds: toBook.map(s=>s.seatId),
    seatLabels: toBook.map(s=>s.label),
    category: 'Standard' as const,
    totalAmount: toBook.reduce((a,b)=>a+b.price,0),
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }] : []
  return { users, venues, events, shows, bookings: bookingsSeed, waitlist: [], emails: [] }
}

export function getDB(): DB {
  if (!memoryDB) {
    memoryDB = loadFromDisk()
    cleanupHolds(memoryDB)
    cleanupWaitlistOffers(memoryDB)
  } else {
    // Avoid mutating outside lock — only read cleanup that is idempotent and single-instance
    // For strict correctness, callers that need lock should use updateDB
    cleanupHolds(memoryDB)
    cleanupWaitlistOffers(memoryDB)
  }
  return memoryDB
}

function atomicWrite(filePath: string, data: string) {
  const tmp = `${filePath}.tmp.${process.pid}`
  fs.writeFileSync(tmp, data)
  fs.renameSync(tmp, filePath)
}

export async function saveDB(db: DB): Promise<void> {
  memoryDB = db
  ensureDataDir()
  const pending = writeQueue.then(() => {
    atomicWrite(DB_PATH, JSON.stringify(db, null, 2))
  })
  writeQueue = pending.catch(()=>{})
  await pending
}

export async function updateDB(fn: (db: DB)=> void | Promise<void>): Promise<DB> {
  const db = getDB()
  let result!: DB
  const task = async () => {
    await fn(db)
    cleanupHolds(db)
    cleanupWaitlistOffers(db)
    atomicWrite(DB_PATH, JSON.stringify(db, null, 2))
    result = db
  }
  const prev = writeQueue
  let resolveQueue!: ()=>void
  writeQueue = new Promise<void>(res=> resolveQueue=res)
  await prev
  try { await task() } finally { resolveQueue() }
  return result
}

export async function resetDB(): Promise<DB> {
  const seeded = createSeeded()
  memoryDB = seeded
  await saveDB(seeded)
  return seeded
}

export const HOLD_TTL_MS = 10 * 60 * 1000
export const WAITLIST_OFFER_TTL_MS = 10 * 60 * 1000

export function cleanupHolds(db: DB) {
  const now = Date.now()
  let changed = false
  for (const show of db.shows) {
    for (const seat of show.seats) {
      if (seat.status === 'held' && seat.heldUntil) {
        if (new Date(seat.heldUntil).getTime() <= now) {
          seat.status = 'available'
          seat.heldBy = undefined
          seat.heldUntil = undefined
          seat.holdId = undefined
          changed = true
        }
      }
    }
  }
  return changed
}

export function cleanupWaitlistOffers(db: DB) {
  const now = Date.now()
  let changed = false
  // collect expired first to avoid mutating while iterating seat allocation conflicts
  const expired: typeof db.waitlist = []
  for (const w of db.waitlist) {
    if (w.status === 'offered' && w.expiresAt && new Date(w.expiresAt).getTime() <= now) {
      w.status = 'expired'
      changed = true
      expired.push(w)
    }
  }
  for (const w of expired) {
    const next = db.waitlist
      .filter(x=> x.eventId===w.eventId && x.showId===w.showId && x.category===w.category && x.status==='waiting')
      .sort((a,b)=> a.position - b.position)[0]
    if (!next) continue
    const show = db.shows.find(s=> s.id===w.showId)
    // pick first *still* available after previous promotions in this loop
    const seat = show?.seats.find(s=> s.category===next.category && s.status==='available')
    if (!seat) continue
    const token = uuid()
    next.status='offered'
    next.offeredAt = new Date().toISOString()
    next.expiresAt = new Date(Date.now()+ WAITLIST_OFFER_TTL_MS).toISOString()
    next.offerToken = token
    next.seatIdOffered = seat.seatId
    seat.status='held'
    seat.heldBy = next.userId
    seat.heldUntil = next.expiresAt
    seat.holdId = `wl-${next.id}`
    const user = db.users.find(u=> u.id===next.userId)
    if (user) {
      const safeName = escapeHtml(user.name)
      const safeLabel = escapeHtml(seat.label)
      const safeCat = escapeHtml(next.category)
      db.emails.push({
        id: uuid(),
        to: user.email,
        subject: `Your seat is ready - ${safeLabel} is reserved for you (10 min)`,
        html: `<p>Hi ${safeName},</p><p>A seat <b>${safeLabel} (${safeCat})</b> is now available. You have 10 minutes to confirm: <a href="/waitlist/claim?token=${encodeURIComponent(token)}">Claim seat</a></p>`,
        createdAt: new Date().toISOString(),
        type: 'waitlist_offer'
      })
    }
  }
  return changed
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
}

export function findUserByEmail(email: string): User | undefined {
  return getDB().users.find(u=> u.email.toLowerCase()===email.toLowerCase())
}
