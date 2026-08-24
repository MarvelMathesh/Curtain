import { NextRequest, NextResponse } from 'next/server'
import { getDBAsync } from '@/lib/db'
import { getTokenFromRequest, getUserFromTokenAsync } from '@/lib/auth'

function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return '***'
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  const maskedLocal = local.length <= 1 ? local[0] + '***' : local[0] + '***' + local.slice(-1)
  return `${maskedLocal}@${domain}`
}

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = await getUserFromTokenAsync(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  if (user.role !== 'organiser' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Organiser only' }, { status: 403 })
  }
  const db = await getDBAsync()
  const events = user.role === 'admin' ? db.events : db.events.filter((e) => e.organiserId === user.id)
  const eventIds = new Set(events.map((e) => e.id))
  const bookings = db.bookings.filter((b) => eventIds.has(b.eventId) && b.status === 'confirmed')
  const shows = db.shows.filter((s) => eventIds.has(s.eventId))

  const totalRevenue = bookings.reduce((a, b) => a + b.totalAmount, 0)
  const totalBookings = bookings.length
  const totalSeats = shows.reduce((a, s) => a + s.seats.length, 0)
  const bookedSeats = shows.reduce((a, s) => a + s.seats.filter((x) => x.status === 'booked').length, 0)

  const byEvent = events.map((ev) => {
    const evBookings = bookings.filter((b) => b.eventId === ev.id)
    const evShows = shows.filter((s) => s.eventId === ev.id)
    const seats = evShows.flatMap((s) => s.seats)
    const revenue = evBookings.reduce((a, b) => a + b.totalAmount, 0)
    const venue = db.venues.find((v) => v.id === ev.venueId) || null
    return {
      event: ev,
      venue,
      revenue,
      bookings: evBookings.length,
      seatsTotal: seats.length,
      seatsBooked: seats.filter((s) => s.status === 'booked').length,
      seatsHeld: seats.filter((s) => s.status === 'held').length,
      seatsAvailable: seats.filter((s) => s.status === 'available').length,
      occupancy: seats.length ? Math.round((seats.filter((s) => s.status === 'booked').length / seats.length) * 100) : 0,
    }
  })

  // Ensure no PII leak via recentBookings: mask email, do not expose raw email to organiser
  // Only expose minimal user info (id, masked email, initials). Never raw email/full name if not needed.
  const recentBookings = bookings
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((b) => {
      const ev = db.events.find((e) => e.id === b.eventId) || null
      const u = db.users.find((usr) => usr.id === b.userId) || null
      // Strip PII: mask email, only include name initials if needed, never full raw email in organiser view
      // For admin we still mask; full PII should require separate explicit consent endpoint.
      // Also strip qrDataUrl from stats view
      const { qrDataUrl, qrData, ...safeBooking } = b as any
      return {
        ...safeBooking,
        event: ev ? { id: ev.id, title: ev.title, date: ev.date, time: ev.time } : null,
        // minimal user projection with masked email, no raw PII
        user: u ? { id: u.id, name: u.name ? u.name.split(' ')[0] + '***' : '***', emailMasked: maskEmail(u.email) } : null,
        hasQr: !!qrDataUrl,
      }
    })

  return NextResponse.json({
    stats: { totalRevenue, totalBookings, totalSeats, bookedSeats, occupancy: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0, eventsCount: events.length },
    byEvent,
    recentBookings,
  })
}
