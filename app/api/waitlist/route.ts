import { NextRequest, NextResponse } from 'next/server'
import { getDB, saveDB, WAITLIST_OFFER_TTL_MS } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { v4 as uuid } from 'uuid'

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const db = getDB()
  let list = db.waitlist
  if (user.role === 'customer') list = list.filter((w) => w.userId === user.id)
  // enrich
  const enriched = list
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((w) => {
      const event = db.events.find((e) => e.id === w.eventId) || null
      const show = db.shows.find((s) => s.id === w.showId) || null
      const venue = event ? db.venues.find((v) => v.id === event.venueId) || null : null
      return { ...w, event, show, venue }
    })
  return NextResponse.json({ waitlist: enriched })
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const { eventId, showId, category } = await req.json()
  if (!eventId || !showId || !category) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const validCat = ['Premium', 'Standard', 'Economy']
  if (!validCat.includes(category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })

  const db = getDB()
  const show = db.shows.find((s) => s.id === showId)
  const event = db.events.find((e) => e.id === eventId)
  if (!show || !event) return NextResponse.json({ error: 'Show/Event not found' }, { status: 404 })

  // check already in waitlist for same show+category and not expired/cancelled
  const existing = db.waitlist.find((w) => w.userId === user.id && w.showId === showId && w.category === category && ['waiting', 'offered'].includes(w.status))
  if (existing) return NextResponse.json({ error: 'Already in waitlist for this category', waitlist: existing }, { status: 400 })

  // check if there is available seat of that category -> suggest booking directly
  const avail = show.seats.find((s) => s.category === category && s.status === 'available')
  if (avail) {
    return NextResponse.json({ error: `Seats available in ${category} - book directly instead of waitlist` }, { status: 400 })
  }

  const position = db.waitlist.filter((w) => w.showId === showId && w.category === category && ['waiting', 'offered'].includes(w.status)).length + 1

  const entry = {
    id: uuid(),
    eventId,
    showId,
    category: category as any,
    userId: user.id,
    email: user.email,
    name: user.name,
    position,
    status: 'waiting' as const,
    createdAt: new Date().toISOString(),
  }
  db.waitlist.push(entry)
  await saveDB(db)
  return NextResponse.json({ waitlist: entry })
}

export async function DELETE(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const db = getDB()
  const entry = db.waitlist.find((w) => w.id === id)
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (entry.userId !== user.id && user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  entry.status = 'cancelled'
  await saveDB(db)
  return NextResponse.json({ ok: true })
}
