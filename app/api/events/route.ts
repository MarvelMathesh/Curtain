import { NextRequest, NextResponse } from 'next/server'
import { getDB, saveDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { v4 as uuid } from 'uuid'

export async function GET(req: NextRequest) {
  const db = getDB()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.toLowerCase() || ''
  const type = searchParams.get('type') || 'all'
  const city = searchParams.get('city') || 'all'

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
    events = events.filter((e) => e.type === type)
  }
  if (city !== 'all') {
    events = events.filter((e) => e.venue?.city === city)
  }

  const cities = [...new Set(db.venues.map((v) => v.city))]

  return NextResponse.json({ events, cities })
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user || (user.role !== 'organiser' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Organiser or Admin only' }, { status: 403 })
  }
  const body = await req.json()
  const { title, type, description, venueId, date, time, durationMinutes, pricing, image } = body
  if (!title || !type || !venueId || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const venue = getDB().venues.find((v) => v.id === venueId)
  if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })

  const db = getDB()
  const eventId = uuid()
  const pricingNorm = {
    Premium: Number(pricing?.Premium ?? 899),
    Standard: Number(pricing?.Standard ?? 549),
    Economy: Number(pricing?.Economy ?? 299),
  }
  const event = {
    id: eventId,
    title,
    type: type as 'movie' | 'concert',
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
    venueId,
    organiserId: user.id,
    date,
    time,
    durationMinutes: Number(durationMinutes) || 120,
    pricing: pricingNorm,
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
  await saveDB(db)
  return NextResponse.json({ event, show })
}
