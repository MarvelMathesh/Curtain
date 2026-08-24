import { NextRequest, NextResponse } from 'next/server'
import { getDB, updateDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { v4 as uuid } from 'uuid'
import { generateQRDataUrl } from '@/lib/qr'
import { makeReference } from '@/lib/booking-reference'

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const db = getDB()
  let bookings = db.bookings
  if (user.role !== 'admin' && user.role !== 'organiser') {
    bookings = bookings.filter((b) => b.userId === user.id)
  } else if (user.role === 'organiser') {
    const myEventIds = db.events.filter((e) => e.organiserId === user.id).map((e) => e.id)
    bookings = bookings.filter((b) => myEventIds.includes(b.eventId) || b.userId === user.id)
  }
  // enrich
  const enriched = bookings
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((b) => {
      const event = db.events.find((e) => e.id === b.eventId) || null
      const venue = event ? db.venues.find((v) => v.id === event.venueId) || null : null
      const show = db.shows.find((s) => s.id === b.showId) || null
      return { ...b, event, venue, show }
    })
  return NextResponse.json({ bookings: enriched })
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { showId, seatIds, holdId } = await req.json()
  if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return NextResponse.json({ error: 'Missing showId or seatIds' }, { status: 400 })
  }
  if (seatIds.length > 6) return NextResponse.json({ error: 'Max 6 seats' }, { status: 400 })

  let bookingToReturn: any = null
  let errorMsg: string | null = null
  let errorStatus = 409

  await updateDB(async (db) => {
    const show = db.shows.find((s) => s.id === showId)
    if (!show) { errorMsg = 'Show not found'; errorStatus = 404; return }
    const event = db.events.find((e) => e.id === show.eventId)
    if (!event) { errorMsg = 'Event not found'; errorStatus = 404; return }

    // validate seats are held by this user or available (if holdId supplied, check)
    for (const sid of seatIds) {
      const seat = show.seats.find((s) => s.seatId === sid)
      if (!seat) { errorMsg = `Seat ${sid} not found`; return }
      if (seat.status === 'booked') { errorMsg = `Seat ${seat.label} already booked`; return }
      if (seat.status === 'held') {
        if (seat.heldBy !== user.id) { errorMsg = `Seat ${seat.label} held by another user`; return }
        if (holdId && seat.holdId !== holdId) { errorMsg = `Hold mismatch for ${seat.label}`; return }
        // check expiry
        if (seat.heldUntil && new Date(seat.heldUntil).getTime() <= Date.now()) { errorMsg = `Hold expired for ${seat.label}`; return }
      } else if (seat.status === 'available') {
        // allow direct booking without prior hold (auto-hold)
      }
    }

    // ensure all same category? allow mixed but booking.category = first seat category
    const seatsToBook = seatIds.map((sid: string) => show.seats.find((s) => s.seatId === sid)!)
    const category = seatsToBook[0].category
    const totalAmount = seatsToBook.reduce((a: number, s: any) => a + s.price, 0)
    const reference = makeReference()
    const qrData = `CURTAIN:${reference}:${showId}:${seatIds.join(',')}`
    const qrDataUrl = await generateQRDataUrl(qrData)

    // mark booked
    for (const seat of seatsToBook) {
      seat.status = 'booked'
      seat.bookedBy = user.id
      seat.heldBy = undefined
      seat.heldUntil = undefined
      seat.holdId = undefined
    }

    const booking = {
      id: uuid(),
      reference,
      userId: user.id,
      eventId: event.id,
      showId: show.id,
      seatIds: seatIds as string[],
      seatLabels: seatsToBook.map((s: any) => s.label),
      category,
      totalAmount,
      status: 'confirmed' as const,
      qrDataUrl,
      createdAt: new Date().toISOString(),
    }
    db.bookings.push(booking)

    db.emails.push({
      id: uuid(),
      to: user.email,
      subject: `Your tickets - ${event.title} · ${reference}`,
      html: `<p>Hi ${user.name},</p><p>Your booking <b>${reference}</b> for <b>${event.title}</b> is confirmed.</p><p>Seats: ${booking.seatLabels.join(', ')} · ${category}</p><p>Total: ₹${totalAmount}</p><p>Show at door: ${qrData}</p>`,
      bookingReference: reference,
      qrDataUrl,
      createdAt: new Date().toISOString(),
      type: 'booking_confirmation',
    })

    bookingToReturn = booking
  })

  if (errorMsg) return NextResponse.json({ error: errorMsg }, { status: errorStatus })
  return NextResponse.json({ booking: bookingToReturn })
}
