import { NextRequest, NextResponse } from 'next/server'
import { getDB, updateDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { v4 as uuid } from 'uuid'

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

const VALID_TYPES = new Set(['movie', 'concert'])

function isValidDateISO(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

function isValidTimeHHMM(s: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(s)
}

function sanitizeSearch(raw: string): string {
  // strip control chars, limit length, trim
  return raw.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 100).trim()
}

export async function GET(req: NextRequest) {
  const db = getDB()
  const { searchParams } = new URL(req.url)
  const rawSearch = searchParams.get('search') || ''
  const search = sanitizeSearch(rawSearch).toLowerCase()
  const type = searchParams.get('type') || 'all'
  const city = searchParams.get('city') ? sanitizeSearch(searchParams.get('city')!) : 'all'

  // pagination: ?limit default 20, ?page default 1
  let limit = parseInt(searchParams.get('limit') || '20', 10)
  let page = parseInt(searchParams.get('page') || '1', 10)
  if (!Number.isFinite(limit) || limit <= 0) limit = 20
  if (!Number.isFinite(page) || page <= 0) page = 1
  limit = Math.min(50, Math.max(1, Math.floor(limit)))
  page = Math.min(1000, Math.max(1, Math.floor(page)))

  let events = db.events.map((ev) => {
    const venue = db.venues.find((v) => v.id === ev.venueId) || null
    const show = db.shows.find((s) => s.eventId === ev.id) || null
    const seats = show?.seats || []
    const totalSeats = seats.length
    const bookedCount = seats.filter((s) => s.status === 'booked').length
    const heldCount = seats.filter((s) => s.status === 'held').length
    const availableCount = seats.filter((s) => s.status === 'available').length
    const isSoldOut = totalSeats > 0 && availableCount === 0
    return {
      ...ev,
      venue,
      showId: show?.id || null,
      totalSeats,
      bookedCount,
      heldCount,
      availableCount,
      isSoldOut,
    }
  })

  if (search) {
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(search) ||
        e.description.toLowerCase().includes(search) ||
        e.venue?.name.toLowerCase().includes(search) ||
        e.venue?.city.toLowerCase().includes(search)
    )
  }
  if (type !== 'all') {
    // only filter if valid enum, else return empty to avoid injection confusion
    if (!VALID_TYPES.has(type)) events = []
    else events = events.filter((e) => e.type === type)
  }
  if (city !== 'all') {
    events = events.filter((e) => e.venue?.city === city)
  }

  const cities = [...new Set(db.venues.map((v) => v.city))]

  const total = events.length
  const start = (page - 1) * limit
  const paged = events.slice(start, start + limit)

  return NextResponse.json({ events: paged, cities, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user || (user.role !== 'organiser' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Organiser or Admin only' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { title, type, description, venueId, date, time, durationMinutes, pricing, image } = body

  // title 3-100
  if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 100) {
    return NextResponse.json({ error: 'Title must be 3-100 characters' }, { status: 400 })
  }
  // type enum
  if (typeof type !== 'string' || !VALID_TYPES.has(type)) {
    return NextResponse.json({ error: 'Type must be movie or concert' }, { status: 400 })
  }
  // description length 0-2000
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') return NextResponse.json({ error: 'Description must be a string' }, { status: 400 })
    if (description.trim().length > 2000) return NextResponse.json({ error: 'Description max 2000 chars' }, { status: 400 })
  }
  if (!venueId || typeof venueId !== 'string') return NextResponse.json({ error: 'venueId required' }, { status: 400 })
  if (!date || typeof date !== 'string' || !isValidDateISO(date)) {
    return NextResponse.json({ error: 'date must be ISO YYYY-MM-DD' }, { status: 400 })
  }
  if (!time || typeof time !== 'string' || !isValidTimeHHMM(time)) {
    return NextResponse.json({ error: 'time must be HH:MM (24h)' }, { status: 400 })
  }
  // duration 30-600
  let duration = 120
  if (durationMinutes !== undefined) {
    const d = Number(durationMinutes)
    if (!Number.isFinite(d) || !Number.isInteger(d) || d < 30 || d > 600) {
      return NextResponse.json({ error: 'durationMinutes must be integer 30-600' }, { status: 400 })
    }
    duration = d
  }

  // pricing: positive ints 50-10000
  const pricingNorm: Record<string, number> = {
    Premium: 899,
    Standard: 549,
    Economy: 299,
  }
  if (pricing !== undefined && pricing !== null) {
    if (typeof pricing !== 'object' || Array.isArray(pricing)) {
      return NextResponse.json({ error: 'pricing must be an object' }, { status: 400 })
    }
    for (const cat of ['Premium', 'Standard', 'Economy'] as const) {
      if (pricing[cat] !== undefined) {
        const n = Number(pricing[cat])
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 50 || n > 10000) {
          return NextResponse.json({ error: `pricing.${cat} must be integer 50-10000` }, { status: 400 })
        }
        pricingNorm[cat] = n
      }
    }
  }

  // image https only
  let safeImage: string | undefined
  if (image !== undefined && image !== null && String(image).trim() !== '') {
    if (typeof image !== 'string') return NextResponse.json({ error: 'Image must be a URL string' }, { status: 400 })
    const trimmed = image.trim()
    if (trimmed.length > 2048) return NextResponse.json({ error: 'Image URL too long' }, { status: 400 })
    if (!isValidHttpsUrl(trimmed)) return NextResponse.json({ error: 'Image must be a valid https URL' }, { status: 400 })
    safeImage = trimmed
  }

  const cleanTitle = escapeHtml(title.trim()).slice(0, 100)
  const cleanDesc = description ? escapeHtml(String(description).trim()).slice(0, 2000) : ''

  let created: { event: any; show: any } | null = null
  let err: string | null = null
  let errStatus = 400

  await updateDB((db) => {
    const venue = db.venues.find((v) => v.id === venueId)
    if (!venue) {
      err = 'Venue not found'
      errStatus = 404
      return
    }

    const eventId = uuid()
    const event = {
      id: eventId,
      title: cleanTitle,
      type: type as 'movie' | 'concert',
      description: cleanDesc,
      image: safeImage || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
      venueId,
      organiserId: user.id,
      date,
      time,
      durationMinutes: duration,
      pricing: pricingNorm as any,
      createdAt: new Date().toISOString(),
    }
    db.events.push(event)

    const seats = venue.seats.map((vs) => ({
      seatId: vs.id,
      row: vs.row,
      number: vs.number,
      label: vs.label,
      category: vs.category,
      price: pricingNorm[vs.category],
      status: 'available' as const,
    }))

    const show = {
      id: `s-${eventId}`,
      eventId,
      venueId: venue.id,
      date,
      time,
      seats,
      createdAt: new Date().toISOString(),
    }
    db.shows.push(show)
    created = { event, show }
  })

  if (err) return NextResponse.json({ error: err }, { status: errStatus })
  return NextResponse.json(created)
}
