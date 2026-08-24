import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { DB, User } from './types'
import { seedVenues, seedEvents, showsFromEvents } from './seed'
import { v4 as uuid } from 'uuid'

const DB_PATH = path.join(process.cwd(), 'data', 'store.json')

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
      return JSON.parse(raw)
    } catch {}
  }
  return createSeeded()
}

function createSeeded(): DB {
  const adminId = uuid()
  const organiserId = uuid()
  const customerId = uuid()
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
    reference: 'CURT-' + Math.random().toString(36).slice(2,7).toUpperCase(),
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
    cleanupHolds(memoryDB)
    cleanupWaitlistOffers(memoryDB)
  }
  return memoryDB
}

export async function saveDB(db: DB): Promise<void> {
  memoryDB = db
  ensureDataDir()
  const pending = writeQueue.then(() => {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
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
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
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
  for (const w of db.waitlist) {
    if (w.status === 'offered' && w.expiresAt && new Date(w.expiresAt).getTime() <= now) {
      w.status = 'expired'
      changed = true
      const next = db.waitlist
        .filter(x=> x.eventId===w.eventId && x.showId===w.showId && x.category===w.category && x.status==='waiting')
        .sort((a,b)=> a.position - b.position)[0]
      if (next) {
        const show = db.shows.find(s=> s.id===w.showId)
        const seat = show?.seats.find(s=> s.category===next.category && s.status==='available')
        if (seat) {
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
            db.emails.push({
              id: uuid(),
              to: user.email,
              subject: `Your seat is ready - ${seat.label} is reserved for you (10 min)`,
              html: `<p>Hi ${user.name},</p><p>A seat <b>${seat.label} (${next.category})</b> is now available. You have 10 minutes to confirm: <a href="/waitlist/claim?token=${token}">Claim seat</a></p>`,
              createdAt: new Date().toISOString(),
              type: 'waitlist_offer'
            })
          }
        }
      }
    }
  }
  return changed
}

export function findUserByEmail(email: string): User | undefined {
  return getDB().users.find(u=> u.email.toLowerCase()===email.toLowerCase())
}
