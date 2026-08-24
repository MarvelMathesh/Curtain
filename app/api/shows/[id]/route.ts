import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDB()
  const show = db.shows.find((s) => s.id === id)
  if (!show) return NextResponse.json({ error: 'Show not found' }, { status: 404 })
  const event = db.events.find((e) => e.id === show.eventId) || null
  const venue = db.venues.find((v) => v.id === show.venueId) || null
  const stats = {
    total: show.seats.length,
    available: show.seats.filter((s) => s.status === 'available').length,
    held: show.seats.filter((s) => s.status === 'held').length,
    booked: show.seats.filter((s) => s.status === 'booked').length,
  }
  // strip PII: never expose heldBy/bookedBy to client; frontend only needs status
  const sanitizedShow = {
    ...show,
    seats: show.seats.map(({ heldBy, bookedBy, ...rest }) => rest),
  }
  return NextResponse.json({ show: sanitizedShow, event, venue, stats })
}
