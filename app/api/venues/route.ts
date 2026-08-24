import { NextRequest, NextResponse } from 'next/server'
import { getDBAsync, updateDBAsync } from '@/lib/db'
import { getTokenFromRequest, getUserFromTokenAsync } from '@/lib/auth'
import { generateVenueSeats } from '@/lib/seed'
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

export async function GET() {
  const db = await getDBAsync()
  return NextResponse.json({ venues: db.venues })
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = await getUserFromTokenAsync(token || undefined)
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, city, address, rows, cols, image } = body

  // zod-like validation: name 2-80, city 2-40
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return NextResponse.json({ error: 'Name must be 2-80 characters' }, { status: 400 })
  }
  if (typeof city !== 'string' || city.trim().length < 2 || city.trim().length > 40) {
    return NextResponse.json({ error: 'City must be 2-40 characters' }, { status: 400 })
  }
  if (address !== undefined && address !== null && typeof address !== 'string') {
    return NextResponse.json({ error: 'Address must be a string' }, { status: 400 })
  }
  if (address && address.trim().length > 120) {
    return NextResponse.json({ error: 'Address max 120 characters' }, { status: 400 })
  }

  // NaN-safe parse + clamp 4-20 (require at least 4x4 venue)
  const rawR = typeof rows === 'number' ? rows : parseInt(String(rows), 10)
  const rawC = typeof cols === 'number' ? cols : parseInt(String(cols), 10)
  if (!Number.isFinite(rawR) || !Number.isFinite(rawC)) {
    return NextResponse.json({ error: 'Rows and cols must be numbers' }, { status: 400 })
  }
  if (!Number.isInteger(rawR) || !Number.isInteger(rawC)) {
    return NextResponse.json({ error: 'Rows and cols must be integers' }, { status: 400 })
  }
  const r = Math.min(20, Math.max(4, rawR))
  const c = Math.min(20, Math.max(4, rawC))

  // image URL validation: https only via new URL
  let safeImage: string | undefined
  if (image !== undefined && image !== null && String(image).trim() !== '') {
    if (typeof image !== 'string') return NextResponse.json({ error: 'Image must be a URL string' }, { status: 400 })
    const trimmed = image.trim()
    if (trimmed.length > 2048) return NextResponse.json({ error: 'Image URL too long' }, { status: 400 })
    if (!isValidHttpsUrl(trimmed)) {
      return NextResponse.json({ error: 'Image must be a valid https URL' }, { status: 400 })
    }
    safeImage = trimmed
  }

  const cleanName = escapeHtml(name.trim()).slice(0, 80)
  const cleanCity = escapeHtml(city.trim()).slice(0, 40)
  const cleanAddress = address ? escapeHtml(String(address).trim()).slice(0, 120) : cleanCity

  const seats = generateVenueSeats(r, c)
  const venue = {
    id: uuid(),
    name: cleanName,
    city: cleanCity,
    address: cleanAddress || cleanCity,
    image: safeImage || 'https://images.unsplash.com/photo-1518834107812-67b0b288f498?w=800&q=80',
    rows: r,
    cols: c,
    seats,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  }

  let created: typeof venue | null = null
  await updateDBAsync((db) => {
    db.venues.push(venue)
    created = venue
  })

  return NextResponse.json({ venue: created })
}
