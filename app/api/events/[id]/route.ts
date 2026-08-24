import { NextRequest, NextResponse } from 'next/server'
import { getDB, updateDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
function isValidHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:'
  } catch {
    return false
  }
}
function isValidDateISO(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}
function isValidTimeHHMM(s: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(s)
}

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

  let error: string | null = null
  let status = 404

  await updateDB((db) => {
    const idx = db.events.findIndex((e) => e.id === id)
    if (idx === -1) {
      error = 'Not found'
      status = 404
      return
    }
    const ev = db.events[idx]
    if (user.role === 'organiser' && ev.organiserId !== user.id) {
      error = 'Not your event'
      status = 403
      return
    }

    // Prevent hard delete if bookings exist -> either reject or soft handling
    const hasConfirmedBookings = db.bookings.some((b) => b.eventId === id && b.status === 'confirmed')
    if (hasConfirmedBookings) {
      error = 'Cannot delete event with existing confirmed bookings - cancel bookings first'
      status = 409
      return
    }

    // Also block if any seat is booked (defense in depth)
    const relatedShows = db.shows.filter((s) => s.eventId === id)
    const anyBookedSeat = relatedShows.some((s) => s.seats.some((seat) => seat.status === 'booked'))
    if (anyBookedSeat) {
      error = 'Cannot delete event with booked seats'
      status = 409
      return
    }

    db.events.splice(idx, 1)
    db.shows = db.shows.filter((s) => s.eventId !== id)
    db.bookings = db.bookings.filter((b) => b.eventId !== id)
    db.waitlist = db.waitlist.filter((w) => w.eventId !== id)
  })

  if (error) return NextResponse.json({ error }, { status })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user || (user.role !== 'organiser' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // validate body keys
  const allowed = new Set(['title', 'description', 'image', 'date', 'time', 'durationMinutes', 'pricing'])
  for (const k of Object.keys(body)) {
    if (!allowed.has(k)) {
      return NextResponse.json({ error: `Invalid field: ${k}` }, { status: 400 })
    }
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 3 || body.title.trim().length > 100) {
      return NextResponse.json({ error: 'Title must be 3-100 characters' }, { status: 400 })
    }
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') return NextResponse.json({ error: 'Description must be a string' }, { status: 400 })
    if (body.description.trim().length > 2000) return NextResponse.json({ error: 'Description max 2000 chars' }, { status: 400 })
  }
  if (body.image !== undefined) {
    if (typeof body.image !== 'string' || body.image.trim().length === 0) return NextResponse.json({ error: 'Image must be a non-empty https URL' }, { status: 400 })
    const trimmed = body.image.trim()
    if (trimmed.length > 2048) return NextResponse.json({ error: 'Image URL too long' }, { status: 400 })
    if (!isValidHttpsUrl(trimmed)) return NextResponse.json({ error: 'Image must be a valid https URL' }, { status: 400 })
  }
  if (body.date !== undefined) {
    if (typeof body.date !== 'string' || !isValidDateISO(body.date)) return NextResponse.json({ error: 'date must be ISO YYYY-MM-DD' }, { status: 400 })
  }
  if (body.time !== undefined) {
    if (typeof body.time !== 'string' || !isValidTimeHHMM(body.time)) return NextResponse.json({ error: 'time must be HH:MM' }, { status: 400 })
  }
  if (body.durationMinutes !== undefined) {
    const d = Number(body.durationMinutes)
    if (!Number.isFinite(d) || !Number.isInteger(d) || d < 30 || d > 600) {
      return NextResponse.json({ error: 'durationMinutes must be integer 30-600' }, { status: 400 })
    }
  }
  if (body.pricing !== undefined) {
    if (typeof body.pricing !== 'object' || body.pricing === null || Array.isArray(body.pricing)) {
      return NextResponse.json({ error: 'pricing must be an object' }, { status: 400 })
    }
    for (const cat of ['Premium', 'Standard', 'Economy'] as const) {
      if (body.pricing[cat] !== undefined) {
        const n = Number(body.pricing[cat])
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 50 || n > 10000) {
          return NextResponse.json({ error: `pricing.${cat} must be integer 50-10000` }, { status: 400 })
        }
      }
    }
  }

  let updated: any = null
  let error: string | null = null
  let status = 400

  await updateDB((db) => {
    const event = db.events.find((e) => e.id === id)
    if (!event) {
      error = 'Not found'
      status = 404
      return
    }
    if (user.role === 'organiser' && event.organiserId !== user.id) {
      error = 'Forbidden'
      status = 403
      return
    }

    // If pricing is changing, prevent divergence if bookings exist
    if (body.pricing !== undefined) {
      const show = db.shows.find((s) => s.eventId === id)
      const hasBookings = db.bookings.some((b) => b.eventId === id && b.status === 'confirmed')
      const hasBookedSeats = show ? show.seats.some((s) => s.status === 'booked') : false
      if (hasBookings || hasBookedSeats) {
        error = 'Cannot change pricing after bookings exist'
        status = 409
        return
      }
      // Apply validated pricing
      for (const cat of ['Premium', 'Standard', 'Economy'] as const) {
        if (body.pricing[cat] !== undefined) {
          (event.pricing as any)[cat] = Number(body.pricing[cat])
        }
      }
      // propagate to show seats that are not booked (available/held)
      if (show) {
        for (const seat of show.seats) {
          if (seat.status !== 'booked') {
            const newPrice = (event.pricing as any)[seat.category]
            if (Number.isFinite(newPrice)) seat.price = newPrice
          }
        }
      }
    }

    // Apply other fields with escaping/sanitization
    if (body.title !== undefined) {
      event.title = escapeHtml(body.title.trim()).slice(0, 100)
    }
    if (body.description !== undefined) {
      event.description = escapeHtml(String(body.description).trim()).slice(0, 2000)
    }
    if (body.image !== undefined) {
      event.image = body.image.trim()
    }
    if (body.date !== undefined) {
      event.date = body.date
      // also sync show date if exists
      const show = db.shows.find((s) => s.eventId === id)
      if (show) show.date = body.date
    }
    if (body.time !== undefined) {
      event.time = body.time
      const show = db.shows.find((s) => s.eventId === id)
      if (show) show.time = body.time
    }
    if (body.durationMinutes !== undefined) {
      event.durationMinutes = Number(body.durationMinutes)
    }

    updated = event
  })

  if (error) return NextResponse.json({ error }, { status })
  return NextResponse.json({ event: updated })
}
