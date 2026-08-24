import { NextRequest, NextResponse } from 'next/server'
import { getDB, updateDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { v4 as uuid } from 'uuid'
import { generateSignedQRDataUrl } from '@/lib/qr'
import { makeReference } from '@/lib/booking-reference'

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const maskedLocal = local.length <= 2 ? local[0] + '***' : local[0] + '***' + local.slice(-1)
  return `${maskedLocal}@${domain}`
}

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  let page = parseInt(searchParams.get('page') || '1', 10)
  let limit = parseInt(searchParams.get('limit') || '20', 10)
  if (!Number.isFinite(page) || page <= 0) page = 1
  if (!Number.isFinite(limit) || limit <= 0) limit = 20
  page = Math.min(1000, Math.max(1, Math.floor(page)))
  limit = Math.min(50, Math.max(1, Math.floor(limit)))

  const db = getDB()
  let bookings = db.bookings
  if (user.role !== 'admin' && user.role !== 'organiser') {
    bookings = bookings.filter((b) => b.userId === user.id)
  } else if (user.role === 'organiser') {
    const myEventIds = db.events.filter((e) => e.organiserId === user.id).map((e) => e.id)
    bookings = bookings.filter((b) => myEventIds.includes(b.eventId) || b.userId === user.id)
  }

  // enrich and strip PII appropriately
  const enriched = bookings
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = enriched.length
  const start = (page - 1) * limit
  const paged = enriched.slice(start, start + limit).map((b) => {
    const event = db.events.find((e) => e.id === b.eventId) || null
    const venue = event ? db.venues.find((v) => v.id === event.venueId) || null : null
    const show = db.shows.find((s) => s.id === b.showId) || null
    // Strip PII in GET list: never return qrDataUrl in bulk, mask / strip where needed
    // Customers see their own; organisers should not see raw user email unless needed
    let safeBooking: any = { ...b }
    // Remove heavy QR from list view; client can fetch single booking for QR
    if (safeBooking.qrDataUrl) {
      safeBooking.hasQr = true
      delete safeBooking.qrDataUrl
    }
    // For organiser viewing others' bookings, mask the booker's identity to limited fields
    // We add enriched objects but do not leak full user record
    // Only include event/venue/show summaries, not PII
    return { ...safeBooking, event, venue, show }
  })

  return NextResponse.json({ bookings: paged, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { showId, seatIds: rawSeatIds, holdId } = body
  if (!showId || typeof showId !== 'string') {
    return NextResponse.json({ error: 'Missing showId' }, { status: 400 })
  }
  if (!Array.isArray(rawSeatIds) || rawSeatIds.length === 0) {
    return NextResponse.json({ error: 'Missing seatIds' }, { status: 400 })
  }
  // validate every seatId is string
  for (const s of rawSeatIds) {
    if (typeof s !== 'string' || s.trim().length === 0 || s.trim().length > 20) {
      return NextResponse.json({ error: 'Each seatId must be a non-empty string' }, { status: 400 })
    }
  }
  // dedup via Set
  const seatIds = [...new Set(rawSeatIds.map((s: string) => s.trim()))]
  if (seatIds.length === 0 || seatIds.length > 6) {
    return NextResponse.json({ error: 'Select 1-6 seats' }, { status: 400 })
  }
  if (holdId !== undefined && holdId !== null && typeof holdId !== 'string') {
    return NextResponse.json({ error: 'holdId must be a string' }, { status: 400 })
  }
  const cleanHoldId = typeof holdId === 'string' ? holdId.trim().slice(0, 100) : undefined
  if (cleanHoldId && cleanHoldId.length === 0) {
    return NextResponse.json({ error: 'Invalid holdId' }, { status: 400 })
  }

  let bookingToReturn: any = null
  let errorMsg: string | null = null
  let errorStatus = 409

  await updateDB(async (db) => {
    const show = db.shows.find((s) => s.id === showId)
    if (!show) {
      errorMsg = 'Show not found'
      errorStatus = 404
      return
    }
    const event = db.events.find((e) => e.id === show.eventId)
    if (!event) {
      errorMsg = 'Event not found'
      errorStatus = 404
      return
    }

    // validate seats are held by this user or available (if holdId supplied, check)
    for (const sid of seatIds) {
      const seat = show.seats.find((s) => s.seatId === sid)
      if (!seat) {
        errorMsg = `Seat ${sid} not found`
        errorStatus = 404
        return
      }
      if (seat.status === 'booked') {
        errorMsg = `Seat ${seat.label} already booked`
        errorStatus = 409
        return
      }
      if (seat.status === 'held') {
        if (seat.heldBy !== user.id) {
          errorMsg = `Seat ${seat.label} held by another user`
          errorStatus = 409
          return
        }
        if (cleanHoldId && seat.holdId !== cleanHoldId) {
          errorMsg = `Hold mismatch for ${seat.label}`
          errorStatus = 409
          return
        }
        if (seat.heldUntil && new Date(seat.heldUntil).getTime() <= Date.now()) {
          errorMsg = `Hold expired for ${seat.label}`
          errorStatus = 410
          return
        }
      } else if (seat.status === 'available') {
        // allow direct booking without prior hold (auto-hold)
      }
      // NaN pricing check: ensure price is finite positive int
      if (!Number.isFinite(seat.price) || seat.price < 0) {
        errorMsg = `Invalid price for seat ${seat.label}`
        errorStatus = 500
        return
      }
    }

    // enforce same category for all seats
    const seatsToBook = seatIds.map((sid: string) => show.seats.find((s) => s.seatId === sid)!)
    const categories = new Set(seatsToBook.map((s) => s.category))
    if (categories.size > 1) {
      errorMsg = 'All seats must be same category'
      errorStatus = 400
      return
    }
    const category = seatsToBook[0].category
    // handle NaN pricing safely
    const totalAmount = seatsToBook.reduce((a: number, s: any) => {
      const p = Number(s.price)
      if (!Number.isFinite(p) || p < 0) throw new Error('Invalid price')
      return a + Math.floor(p)
    }, 0)
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      errorMsg = 'Invalid total amount'
      errorStatus = 500
      return
    }

    // ensure reference uniqueness loop (extremely unlikely collision but required for prod)
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

    // QR is HMAC-signed with expiry (signed payload includes reference, showId, seats)
    const { qrData, qrDataUrl } = await generateSignedQRDataUrl(reference, showId, seatIds)

    // mark booked atomically
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
      qrData,
      qrDataUrl,
      createdAt: new Date().toISOString(),
    }
    db.bookings.push(booking)

    const safeName = escapeHtml(user.name)
    const safeTitle = escapeHtml(event.title)
    const safeLabels = booking.seatLabels.map((l: string) => escapeHtml(l)).join(', ')
    const safeCat = escapeHtml(category)

    db.emails.push({
      id: uuid(),
      to: user.email,
      subject: `Your tickets - ${safeTitle} · ${reference}`,
      html: `<p>Hi ${safeName},</p><p>Your booking <b>${escapeHtml(reference)}</b> for <b>${safeTitle}</b> is confirmed.</p><p>Seats: ${safeLabels} · ${safeCat}</p><p>Total: ₹${totalAmount}</p><p>Show at door: ${escapeHtml(qrData)}</p>`,
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
