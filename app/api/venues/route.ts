import { NextRequest, NextResponse } from 'next/server'
import { getDB, saveDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { generateVenueSeats } from '@/lib/seed'
import { v4 as uuid } from 'uuid'
export async function GET() {
  const db = getDB()
  return NextResponse.json({ venues: db.venues })
}
export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const { name, city, address, rows, cols, image } = await req.json()
  if (!name || !city || !rows || !cols) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const r = Math.min(20, Math.max(1, parseInt(rows)))
  const c = Math.min(20, Math.max(1, parseInt(cols)))
  const seats = generateVenueSeats(r, c)
  const venue = {
    id: uuid(),
    name, city, address: address || city, image: image || 'https://images.unsplash.com/photo-1518834107812-67b0b288f498?w=800&q=80',
    rows: r, cols: c, seats, createdBy: user.id, createdAt: new Date().toISOString()
  }
  const db = getDB()
  db.venues.push(venue)
  await saveDB(db)
  return NextResponse.json({ venue })
}
