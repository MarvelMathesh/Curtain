import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  if (user.role !== 'organiser' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Organiser only' }, { status: 403 })
  }
  const db = getDB()
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

  const recentBookings = bookings
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((b) => {
      const ev = db.events.find((e) => e.id === b.eventId) || null
      const u = db.users.find((usr) => usr.id === b.userId) || null
      return { ...b, event: ev, user: u ? { id: u.id, name: u.name, email: u.email } : null }
    })

  return NextResponse.json({
    stats: { totalRevenue, totalBookings, totalSeats, bookedSeats, occupancy: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0, eventsCount: events.length },
    byEvent,
    recentBookings,
  })
}
