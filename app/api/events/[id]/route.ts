import { NextRequest, NextResponse } from 'next/server'
import { getDB, saveDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDB()
  const event = db.events.find((e) => e.id === id)
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  const venue = db.venues.find((v) => v.id === event.venueId) || null
  const show = db.shows.find((s) => s.eventId === event.id) || null
  const seats = show?.seats || []
  const totalSeats = seats.length
  const bookedCount = seats.filter((s) => s.status === 'booked').length
  const availableCount = seats.filter((s) => s.status === 'available').length
  const heldCount = seats.filter((s) => s.status === 'held').length
  return NextResponse.json({
    event: { ...event, venue, showId: show?.id, totalSeats, bookedCount, availableCount, heldCount, isSoldOut: availableCount === 0 && totalSeats > 0 },
    venue,
    show,
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user || (user.role !== 'organiser' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const db = getDB()
  const idx = db.events.findIndex((e) => e.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const ev = db.events[idx]
  if (user.role === 'organiser' && ev.organiserId !== user.id) {
    return NextResponse.json({ error: 'Not your event' }, { status: 403 })
  }
  db.events.splice(idx, 1)
  db.shows = db.shows.filter((s) => s.eventId !== id)
  db.bookings = db.bookings.filter((b) => b.eventId !== id)
  db.waitlist = db.waitlist.filter((w) => w.eventId !== id)
  await saveDB(db)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user || (user.role !== 'organiser' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const db = getDB()
  const event = db.events.find((e) => e.id === id)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.role === 'organiser' && event.organiserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const allowed = ['title', 'description', 'image', 'date', 'time', 'durationMinutes', 'pricing'] as const
  for (const k of allowed) if (body[k] !== undefined) (event as any)[k] = body[k]
  await saveDB(db)
  return NextResponse.json({ event })
}
