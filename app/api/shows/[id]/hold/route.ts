import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'
import { HOLD_TTL_MS, updateDB } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { seatIds } = await req.json()
  if (!Array.isArray(seatIds) || seatIds.length === 0 || seatIds.length > 6) {
    return NextResponse.json({ error: 'Select 1-6 seats' }, { status: 400 })
  }

  let holdResult: { holdId: string; expiresAt: string; seats: string[] } | null = null
  let errorMsg: string | null = null

  await updateDB((db) => {
    const show = db.shows.find((s) => s.id === id)
    if (!show) { errorMsg = 'Show not found'; return }
    // verify all seats exist and available or already held by same user
    for (const sid of seatIds) {
      const seat = show.seats.find((s) => s.seatId === sid)
      if (!seat) { errorMsg = `Seat ${sid} not found`; return }
      if (seat.status === 'booked') { errorMsg = `Seat ${seat.label} already booked`; return }
      if (seat.status === 'held' && seat.heldBy !== user.id) { errorMsg = `Seat ${seat.label} is held by another user`; return }
    }
    const holdId = uuid()
    const expiresAt = new Date(Date.now() + HOLD_TTL_MS).toISOString()
    for (const sid of seatIds) {
      const seat = show.seats.find((s) => s.seatId === sid)!
      seat.status = 'held'
      seat.heldBy = user.id
      seat.heldUntil = expiresAt
      seat.holdId = holdId
    }
    holdResult = { holdId, expiresAt, seats: seatIds }
  })

  if (errorMsg) return NextResponse.json({ error: errorMsg }, { status: 409 })
  return NextResponse.json(holdResult)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  let released = 0
  let errorMsg: string | null = null
  const body = await req.json().catch(() => ({}))
  const seatIds: string[] | undefined = body?.seatIds
  const holdId: string | undefined = body?.holdId

  await updateDB((db) => {
    const show = db.shows.find((s) => s.id === id)
    if (!show) { errorMsg = 'Show not found'; return }
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
