import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const db = getDB()
  const booking = db.bookings.find((b) => b.id === id || b.reference === id)
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (user.role === 'customer' && booking.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'organiser') {
    const ev = db.events.find((e) => e.id === booking.eventId)
    if (ev && ev.organiserId !== user.id && booking.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  const event = db.events.find((e) => e.id === booking.eventId) || null
  const venue = event ? db.venues.find((v) => v.id === event.venueId) || null : null
  const show = db.shows.find((s) => s.id === booking.showId) || null
  return NextResponse.json({ booking: { ...booking, event, venue, show } })
}
