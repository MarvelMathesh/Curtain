import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { updateDB } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import { generateSignedQRDataUrl } from '@/lib/qr'
import { makeReference } from '@/lib/booking-reference'

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

export async function POST(req: NextRequest) {
  const tokenHeader = getTokenFromRequest(req)
  const user = getUserFromToken(tokenHeader || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  let body: any = {}
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const rawToken: string | undefined = body.offerToken || body.token || new URL(req.url).searchParams.get('token') || undefined
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  const offerToken = rawToken.trim().slice(0, 200)

  let bookingResult: any = null
  let errorMsg: string | null = null
  let errorStatus = 400

  await updateDB(async (db) => {
    const entry = db.waitlist.find((w) => w.offerToken === offerToken)
    if (!entry) {
      errorMsg = 'Invalid token'
      errorStatus = 404
      return
    }
    if (entry.userId !== user.id) {
      errorMsg = 'Not your waitlist entry'
      errorStatus = 403
      return
    }
    if (entry.status !== 'offered') {
      errorMsg = `Waitlist entry is ${entry.status}, not offered`
      errorStatus = 400
      return
    }
    if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now()) {
      entry.status = 'expired'
      errorMsg = 'Offer expired'
      errorStatus = 410
      return
    }
    const show = db.shows.find((s) => s.id === entry.showId)
    const event = db.events.find((e) => e.id === entry.eventId)
    if (!show || !event) {
      errorMsg = 'Show/Event not found'
      errorStatus = 404
      return
    }
    const seat = show.seats.find((s) => s.seatId === entry.seatIdOffered)
    if (!seat) {
      errorMsg = 'Offered seat not found'
      errorStatus = 404
      return
    }
    if (seat.status !== 'held' || seat.heldBy !== user.id) {
      errorMsg = 'Seat no longer held for you'
      errorStatus = 409
      return
    }

    // ensure reference uniqueness loop
    let reference = makeReference()
    let attempts = 0
    while (db.bookings.some((b) => b.reference === reference) && attempts < 5) {
      reference = makeReference()
      attempts++
    }
    if (db.bookings.some((b) => b.reference === reference)) {
      errorMsg = 'Failed to generate reference, retry'
      errorStatus = 500
      return
    }

    const { qrData, qrDataUrl } = await generateSignedQRDataUrl(reference, show.id, [seat.seatId])

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
      qrData,
      qrDataUrl,
      createdAt: new Date().toISOString(),
    }
    db.bookings.push(booking)

    const safeName = escapeHtml(user.name)
    const safeTitle = escapeHtml(event.title)
    const safeLabel = escapeHtml(seat.label)

    db.emails.push({
      id: uuid(),
      to: user.email,
      subject: `Your waitlist seat confirmed - ${safeTitle} · ${escapeHtml(reference)}`,
      html: `<p>Hi ${safeName},</p><p>Your waitlist seat <b>${safeLabel}</b> for <b>${safeTitle}</b> is confirmed. Reference: ${escapeHtml(reference)}</p><p>QR: ${escapeHtml(qrData)}</p>`,
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
  const tokenHeader = getTokenFromRequest(req)
  const user = getUserFromToken(tokenHeader || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token || typeof token !== 'string' || token.trim().length === 0) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  const clean = token.trim().slice(0, 200)
  const db = (await import('@/lib/db')).getDB()
  const entry = db.waitlist.find((w) => w.offerToken === clean)
  if (!entry || entry.userId !== user.id) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  const event = db.events.find((e) => e.id === entry.eventId) || null
  const show = db.shows.find((s) => s.id === entry.showId) || null
  const seat = show?.seats.find((s) => s.seatId === entry.seatIdOffered) || null
  const expired = entry.expiresAt ? new Date(entry.expiresAt).getTime() <= Date.now() : false
  // strip sensitive offerToken from response? Keep but client needs it; we already validated ownership
  return NextResponse.json({ entry: { ...entry, expired }, event, show, seat })
}
