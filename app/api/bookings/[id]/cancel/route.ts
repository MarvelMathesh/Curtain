import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { updateDB, WAITLIST_OFFER_TTL_MS } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  let result: any = null
  let errorMsg: string | null = null
  let errorStatus = 400

  await updateDB((db) => {
    const booking = db.bookings.find((b) => b.id === id || b.reference === id)
    if (!booking) { errorMsg = 'Booking not found'; errorStatus = 404; return }
    if (booking.status === 'cancelled') { errorMsg = 'Already cancelled'; errorStatus = 400; return }
    if (user.role === 'customer' && booking.userId !== user.id) { errorMsg = 'Not your booking'; errorStatus = 403; return }

    const show = db.shows.find((s) => s.id === booking.showId)
    const event = db.events.find((e) => e.id === booking.eventId)
    if (!show || !event) { errorMsg = 'Show/Event missing'; errorStatus = 500; return }

    // mark cancelled
    booking.status = 'cancelled'
    ;(booking as any).cancelledAt = new Date().toISOString()

    // free seats
    for (const sid of booking.seatIds) {
      const seat = show.seats.find((s) => s.seatId === sid)
      if (seat && seat.bookedBy === booking.userId) {
        seat.status = 'available'
        seat.bookedBy = undefined
      }
    }

    // email cancellation
    const bookingUser = db.users.find((u) => u.id === booking.userId)
    if (bookingUser) {
      db.emails.push({
        id: uuid(),
        to: bookingUser.email,
        subject: `Cancelled - ${event.title} · ${booking.reference}`,
        html: `<p>Hi ${bookingUser.name},</p><p>Your booking ${booking.reference} has been cancelled. Refund will be processed in 5-7 days.</p>`,
        bookingReference: booking.reference,
        createdAt: new Date().toISOString(),
        type: 'cancellation',
      })
    }

    // trigger waitlist: find next waiting entry for same event/show/category
    const waiting = db.waitlist
      .filter((w) => w.eventId === booking.eventId && w.showId === booking.showId && w.category === booking.category && w.status === 'waiting')
      .sort((a, b) => a.position - b.position)

    if (waiting.length > 0) {
      const next = waiting[0]
      // find an available seat of that category (one of the just freed)
      const freedSeat = show.seats.find((s) => booking.seatIds.includes(s.seatId) && s.category === next.category && s.status === 'available')
        || show.seats.find((s) => s.category === next.category && s.status === 'available')

      if (freedSeat) {
        const offerToken = uuid()
        const expiresAt = new Date(Date.now() + WAITLIST_OFFER_TTL_MS).toISOString()
        next.status = 'offered'
        next.offeredAt = new Date().toISOString()
        next.expiresAt = expiresAt
        next.offerToken = offerToken
        next.seatIdOffered = freedSeat.seatId

        freedSeat.status = 'held'
        freedSeat.heldBy = next.userId
        freedSeat.heldUntil = expiresAt
        freedSeat.holdId = `wl-${next.id}`

        const wlUser = db.users.find((u) => u.id === next.userId)
        if (wlUser) {
          db.emails.push({
            id: uuid(),
            to: wlUser.email,
            subject: `Your seat is ready - ${freedSeat.label} is reserved for you (10 min)`,
            html: `<p>Hi ${wlUser.name},</p><p>A seat <b>${freedSeat.label} (${next.category})</b> for <b>${event.title}</b> is now available. You have 10 minutes to confirm: <a href="/waitlist/claim?token=${offerToken}">Claim seat</a></p>`,
            createdAt: new Date().toISOString(),
            type: 'waitlist_offer',
          })
        }
      }
    }

    result = booking
  })

  if (errorMsg) return NextResponse.json({ error: errorMsg }, { status: errorStatus })
  return NextResponse.json({ booking: result, ok: true })
}
