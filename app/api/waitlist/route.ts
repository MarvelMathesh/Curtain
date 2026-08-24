import { NextRequest, NextResponse } from 'next/server'
import { getDB, updateDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { v4 as uuid } from 'uuid'

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const db = getDB()
  let list = db.waitlist
  if (user.role === 'customer') list = list.filter((w) => w.userId === user.id)
  // pagination for waitlist GET
  const { searchParams } = new URL(req.url)
  let page = parseInt(searchParams.get('page') || '1', 10)
  let limit = parseInt(searchParams.get('limit') || '20', 10)
  if (!Number.isFinite(page) || page <= 0) page = 1
  if (!Number.isFinite(limit) || limit <= 0) limit = 20
  page = Math.min(1000, Math.max(1, Math.floor(page)))
  limit = Math.min(50, Math.max(1, Math.floor(limit)))

  const enriched = list
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = enriched.length
  const start = (page - 1) * limit
  const paged = enriched.slice(start, start + limit).map((w) => {
    const event = db.events.find((e) => e.id === w.eventId) || null
    const show = db.shows.find((s) => s.id === w.showId) || null
    const venue = event ? db.venues.find((v) => v.id === event.venueId) || null : null
    return { ...w, event, show, venue }
  })
  return NextResponse.json({ waitlist: paged, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
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

  const { eventId, showId, category } = body
  if (!eventId || typeof eventId !== 'string' || !showId || typeof showId !== 'string' || !category || typeof category !== 'string') {
    return NextResponse.json({ error: 'Missing fields: eventId, showId, category required' }, { status: 400 })
  }

  const validCat = ['Premium', 'Standard', 'Economy'] as const
  if (!validCat.includes(category as any)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })

  // trim and validate lengths
  const cleanEventId = eventId.trim().slice(0, 100)
  const cleanShowId = showId.trim().slice(0, 100)
  const cleanCategory = category.trim() as typeof validCat[number]

  let created: any = null
  let error: string | null = null
  let status = 400

  await updateDB((db) => {
    const show = db.shows.find((s) => s.id === cleanShowId)
    const event = db.events.find((e) => e.id === cleanEventId)
    if (!show || !event) {
      error = 'Show/Event not found'
      status = 404
      return
    }
    // ensure show belongs to event
    if (show.eventId !== event.id) {
      error = 'Show does not belong to event'
      status = 400
      return
    }

    // html escape check - category is enum safe, but ensure show.category exists
    // dedup check inside lock (atomic)
    const existing = db.waitlist.find((w) => w.userId === user.id && w.showId === cleanShowId && w.category === cleanCategory && ['waiting', 'offered'].includes(w.status))
    if (existing) {
      error = 'Already in waitlist for this category'
      status = 400
      return
    }

    // check if there is available seat of that category -> suggest booking directly
    const avail = show.seats.find((s) => s.category === cleanCategory && s.status === 'available')
    if (avail) {
      error = `Seats available in ${escapeHtml(cleanCategory)} - book directly instead of waitlist`
      status = 400
      return
    }

    // atomic position: count waiting/offered for this show+category under lock
    const position = db.waitlist.filter((w) => w.showId === cleanShowId && w.category === cleanCategory && ['waiting', 'offered'].includes(w.status)).length + 1

    const entry = {
      id: uuid(),
      eventId: cleanEventId,
      showId: cleanShowId,
      category: cleanCategory as any,
      userId: user.id,
      email: user.email, // stored for lookup but not exposed cross-user (GET filters)
      name: escapeHtml(user.name).slice(0, 80),
      position,
      status: 'waiting' as const,
      createdAt: new Date().toISOString(),
    }
    db.waitlist.push(entry)
    created = entry
  })

  if (error) {
    // include existing waitlist entry in response if dup
    if (error === 'Already in waitlist for this category') {
      // fetch existing for convenience (outside lock, best effort)
      const db = getDB()
      const existing = db.waitlist.find((w) => w.userId === user.id && w.showId === cleanShowId && w.category === cleanCategory && ['waiting', 'offered'].includes(w.status))
      return NextResponse.json({ error, waitlist: existing }, { status })
    }
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json({ waitlist: created })
}

export async function DELETE(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id || typeof id !== 'string' || id.trim().length === 0) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const cleanId = id.trim().slice(0, 100)

  let error: string | null = null
  let status = 400
  await updateDB((db) => {
    const entry = db.waitlist.find((w) => w.id === cleanId)
    if (!entry) {
      error = 'Not found'
      status = 404
      return
    }
    if (entry.userId !== user.id && user.role !== 'admin') {
      error = 'Forbidden'
      status = 403
      return
    }
    entry.status = 'cancelled'
  })

  if (error) return NextResponse.json({ error }, { status })
  return NextResponse.json({ ok: true })
}
