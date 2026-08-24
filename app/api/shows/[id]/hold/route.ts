import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, getUserFromTokenAsync } from '@/lib/auth'
import { HOLD_TTL_MS, updateDBAsync } from '@/lib/db'
import { v4 as uuid } from 'uuid'

// Rate-limit note: In production use Redis/Upstash rate limiting (e.g., 10 hold requests / minute / IP+user).
// This in-memory DB cannot enforce distributed rate limits, so enforce at edge middleware.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(req)
  const user = await getUserFromTokenAsync(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { seatIds: rawSeatIds } = body
  if (!Array.isArray(rawSeatIds)) {
    return NextResponse.json({ error: 'seatIds must be an array' }, { status: 400 })
  }
  // validate every seatId is non-empty string
  for (const s of rawSeatIds) {
    if (typeof s !== 'string' || s.trim().length === 0 || s.trim().length > 20) {
      return NextResponse.json({ error: 'Each seatId must be a non-empty string (max 20)' }, { status: 400 })
    }
  }
  // dedup via Set
  const deduped = [...new Set(rawSeatIds.map((s: string) => s.trim()))]
  if (deduped.length === 0 || deduped.length > 6) {
    return NextResponse.json({ error: 'Select 1-6 seats' }, { status: 400 })
  }
  // also reject if dedup reduced count but original had duplicates >6 unique? Already handled.
  // if duplicates existed, we already deduped; continue with deduped

  let holdResult: { holdId: string; expiresAt: string; seats: string[] } | null = null
  let errorMsg: string | null = null
  let errorStatus = 409

  await updateDBAsync((db) => {
    const show = db.shows.find((s) => s.id === id)
    if (!show) {
      errorMsg = 'Show not found'
      errorStatus = 404
      return
    }
    // verify all seats exist and available or already held by same user
    for (const sid of deduped) {
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
      if (seat.status === 'held' && seat.heldBy !== user.id) {
        // if held but expired, cleanupHolds (called inside updateDB task after? but getDB also cleans) would have freed; but double-check expiry
        if (seat.heldUntil && new Date(seat.heldUntil).getTime() <= Date.now()) {
          // treat as available (will be overwritten)
        } else {
          errorMsg = `Seat ${seat.label} is held by another user`
          errorStatus = 409
          return
        }
      }
    }
    const holdId = uuid()
    const expiresAt = new Date(Date.now() + HOLD_TTL_MS).toISOString()
    for (const sid of deduped) {
      const seat = show.seats.find((s) => s.seatId === sid)!
      seat.status = 'held'
      seat.heldBy = user.id
      seat.heldUntil = expiresAt
      seat.holdId = holdId
    }
    holdResult = { holdId, expiresAt, seats: deduped }
  })

  if (errorMsg) return NextResponse.json({ error: errorMsg }, { status: errorStatus })
  return NextResponse.json(holdResult)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(req)
  const user = await getUserFromTokenAsync(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  let released = 0
  let errorMsg: string | null = null
  let body: any = {}
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const seatIds: string[] | undefined = Array.isArray(body?.seatIds) ? ([...new Set((body.seatIds as any[]).map((s: any) => String(s).trim()))] as string[]) : undefined
  const holdId: string | undefined = typeof body?.holdId === 'string' ? body.holdId.trim() : undefined

  if (seatIds) {
    for (const s of seatIds) {
      if (typeof s !== 'string' || s.length === 0 || s.length > 20) {
        return NextResponse.json({ error: 'Invalid seatIds' }, { status: 400 })
      }
    }
  }

  await updateDBAsync((db) => {
    const show = db.shows.find((s) => s.id === id)
    if (!show) {
      errorMsg = 'Show not found'
      return
    }
    for (const seat of show.seats) {
      const matchSeat = seatIds ? seatIds.includes(seat.seatId) : true
      const matchHold = holdId ? seat.holdId === holdId : true
      if (seat.status === 'held' && seat.heldBy === user.id && matchSeat && matchHold) {
        seat.status = 'available'
        seat.heldBy = undefined
        seat.heldUntil = undefined
        seat.holdId = undefined
        released++
      }
    }
  })

  if (errorMsg) return NextResponse.json({ error: errorMsg }, { status: 404 })
  return NextResponse.json({ ok: true, released })
}
