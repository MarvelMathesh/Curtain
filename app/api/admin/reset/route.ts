import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, getUserFromTokenAsync } from '@/lib/auth'
import { resetDBAsync } from '@/lib/db'

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = await getUserFromTokenAsync(token || undefined)
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const db = await resetDBAsync()
  return NextResponse.json({ ok: true, venues: db.venues.length, events: db.events.length })
}
