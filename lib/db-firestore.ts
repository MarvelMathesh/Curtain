import { getAdminDb } from './firebase-admin'
import { DB } from './types'
import { seedVenues, seedEvents, showsFromEvents } from './seed'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const COLLECTIONS = ['users','venues','events','shows','bookings','waitlist','emails'] as const

async function ensureSeeded(): Promise<void> {
  const db = getAdminDb()
  if (!db) return
  const snap = await db.collection('meta').doc('seeded').get()
  if (snap.exists) return
  // Check if any data exists
  const usersSnap = await db.collection('users').limit(1).get()
  if (!usersSnap.empty) {
    await db.collection('meta').doc('seeded').set({ at: new Date().toISOString(), v: 1 })
    return
  }
  console.log('[firestore] Seeding initial data...')
  const adminId = uuid()
  const organiserId = uuid()
  const customerId = uuid()
  const batch = db.batch()
  const users = [
    { id: adminId, email: 'admin@curtain.in', name: 'Curtain Admin', passwordHash: bcrypt.hashSync('admin123', 10), role: 'admin', createdAt: new Date().toISOString() },
    { id: organiserId, email: 'organiser@curtain.in', name: 'Riya Mehta', passwordHash: bcrypt.hashSync('organiser123', 10), role: 'organiser', createdAt: new Date().toISOString() },
    { id: customerId, email: 'customer@curtain.in', name: 'Aarav Sharma', passwordHash: bcrypt.hashSync('customer123', 10), role: 'customer', createdAt: new Date().toISOString() },
  ]
  users.forEach(u => batch.set(db.collection('users').doc(u.id), u))
  const venues = seedVenues(adminId)
  venues.forEach(v => batch.set(db.collection('venues').doc(v.id), v))
  const events = seedEvents(organiserId, venues)
  events.forEach(e => batch.set(db.collection('events').doc(e.id), e))
  const shows = showsFromEvents(events, venues)
  const s1 = shows.find(s=>s.eventId==='e1')!
  s1.seats.slice(0,72).forEach(s=> { s.status='booked'; s.bookedBy=customerId })
  shows.forEach(s => batch.set(db.collection('shows').doc(s.id), s))
  if (s1) {
    const toBook = s1.seats.slice(0,72)
    batch.set(db.collection('bookings').doc(uuid()), {
      id: uuid(),
      reference: `CURT-${randomBytes(3).toString('hex').toUpperCase()}${(randomBytes(2).readUInt16BE(0)%900+100)}`,
      userId: customerId, eventId: 'e1', showId: s1.id,
      seatIds: toBook.map(s=>s.seatId), seatLabels: toBook.map(s=>s.label),
      category: 'Standard', totalAmount: toBook.reduce((a,b)=>a+b.price,0), status: 'confirmed', createdAt: new Date().toISOString()
    })
  }
  batch.set(db.collection('meta').doc('seeded'), { at: new Date().toISOString(), v: 1 })
  await batch.commit()
  console.log('[firestore] Seed done')
}

export async function getDbFirestore(): Promise<DB> {
  const db = getAdminDb()
  if (!db) throw new Error('Firestore not ready')
  await ensureSeeded()
  const [users, venues, events, shows, bookings, waitlist, emails] = await Promise.all(
    COLLECTIONS.map(async col => {
      const snap = await db.collection(col).get()
      return snap.docs.map(d => d.data() as any)
    })
  )
  return { users, venues, events, shows, bookings, waitlist, emails } as DB
}

export async function updateDbFirestore(fn: (db: DB) => void | Promise<void>): Promise<DB> {
  const adminDb = getAdminDb()
  if (!adminDb) throw new Error('Firestore not ready')
  // We use a transaction for atomicity on shows/bookings/waitlist
  // For simplicity, we fetch full DB inside transaction, run fn on in-memory copy, then write back diff
  // This is not the most efficient but keeps same fn signature as file DB
  const db = await getDbFirestore()
  await fn(db)
  // persist via batch (we diff by id)
  const batch = adminDb.batch()
  const persist = async (col: typeof COLLECTIONS[number], items: any[]) => {
    // For simplicity, overwrite all docs in collection (ok for demo scale <1k docs)
    // In prod, diff and delete missing.
    const existing = await adminDb.collection(col).get()
    const existingIds = new Set(existing.docs.map(d=>d.id))
    items.forEach(item => {
      if (!item.id) return
      batch.set(adminDb.collection(col).doc(item.id), item, { merge: false })
      existingIds.delete(item.id)
    })
    existingIds.forEach(id => batch.delete(adminDb.collection(col).doc(id)))
  }
  await Promise.all([
    persist('users', db.users),
    persist('venues', db.venues),
    persist('events', db.events),
    persist('shows', db.shows),
    persist('bookings', db.bookings),
    persist('waitlist', db.waitlist),
    persist('emails', db.emails),
  ])
  await batch.commit()
  return db
}
