import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { resetDB } from '@/lib/db'

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const db = await resetDB()
  return NextResponse.json({ ok: true, venues: db.venues.length, events: db.events.length })
}
