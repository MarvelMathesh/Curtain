import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { updateDB } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { generateQRDataUrl } from '@/lib/qr'
import { makeReference } from '@/lib/booking-reference'

export async function POST(req: NextRequest) {
  const tokenHeader = getTokenFromRequest(req)
  const user = getUserFromToken(tokenHeader || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const offerToken: string | undefined = body.offerToken || body.token || new URL(req.url).searchParams.get('token') || undefined
  if (!offerToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  let bookingResult: any = null
  let errorMsg: string | null = null
  let errorStatus = 400

  await updateDB(async (db) => {
    const entry = db.waitlist.find((w) => w.offerToken === offerToken)
    if (!entry) { errorMsg = 'Invalid token'; errorStatus = 404; return }
    if (entry.userId !== user.id) { errorMsg = 'Not your waitlist entry'; errorStatus = 403; return }
    if (entry.status !== 'offered') { errorMsg = `Waitlist entry is ${entry.status}, not offered`; errorStatus = 400; return }
    if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now()) {
      entry.status = 'expired'
      errorMsg = 'Offer expired'; errorStatus = 410; return
    }
    const show = db.shows.find((s) => s.id === entry.showId)
    const event = db.events.find((e) => e.id === entry.eventId)
    if (!show || !event) { errorMsg = 'Show/Event not found'; errorStatus = 404; return }
    const seat = show.seats.find((s) => s.seatId === entry.seatIdOffered)
    if (!seat) { errorMsg = 'Offered seat not found'; errorStatus = 404; return }
    if (seat.status !== 'held' || seat.heldBy !== user.id) { errorMsg = 'Seat no longer held for you'; errorStatus = 409; return }

    // book it
    const reference = makeReference()
    const qrData = `CURTAIN:${reference}:${show.id}:${seat.seatId}`
    const qrDataUrl = await generateQRDataUrl(qrData)

    seat.status = 'booked'
    seat.bookedBy = user.id
    seat.heldBy = undefined
    seat.heldUntil = undefined
    seat.holdId = undefined

    entry.status = 'converted'

    const booking = {
      id: uuid(),
      reference,
      userId: user.id,
      eventId: entry.eventId,
      showId: entry.showId,
      seatIds: [seat.seatId],
      seatLabels: [seat.label],
      category: entry.category,
      totalAmount: seat.price,
      status: 'confirmed' as const,
      qrDataUrl,
      createdAt: new Date().toISOString(),
    }
    db.bookings.push(booking)

    db.emails.push({
      id: uuid(),
      to: user.email,
      subject: `Your waitlist seat confirmed - ${event.title} · ${reference}`,
      html: `<p>Hi ${user.name},</p><p>Your waitlist seat <b>${seat.label}</b> for <b>${event.title}</b> is confirmed. Reference: ${reference}</p>`,
      bookingReference: reference,
      qrDataUrl,
      createdAt: new Date().toISOString(),
      type: 'booking_confirmation',
    })

    bookingResult = booking
  })

  if (errorMsg) return NextResponse.json({ error: errorMsg }, { status: errorStatus })
  return NextResponse.json({ booking: bookingResult, ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  const db = (await import('@/lib/db')).getDB()
  const entry = db.waitlist.find((w) => w.offerToken === token)
  if (!entry) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  const event = db.events.find((e) => e.id === entry.eventId) || null
  const show = db.shows.find((s) => s.id === entry.showId) || null
  const seat = show?.seats.find((s) => s.seatId === entry.seatIdOffered) || null
  const expired = entry.expiresAt ? new Date(entry.expiresAt).getTime() <= Date.now() : false
  return NextResponse.json({ entry: { ...entry, expired }, event, show, seat })
}
