'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LandingBackground } from '@/components/landing-background'
import { TicketHeader } from '@/components/ticketing/header'
import { SeatMap } from '@/components/curtain/seat-map'
import { HoldTimer } from '@/components/curtain/hold-timer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { Clock, Ticket, Crown, Users, Star, MapPin } from 'lucide-react'

export default function ShowPage() {
  const params = useParams() as { id: string }
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [hold, setHold] = useState<{ holdId: string; expiresAt: string } | null>(null)
  const [booking, setBooking] = useState<any>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [waitlistCategory, setWaitlistCategory] = useState<string>('Premium')

  const fetchShow = useCallback(async () => {
    const r = await fetch(`/api/shows/${params.id}`, { cache: 'no-store' })
    const j = await r.json()
    setData(j)
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    fetchShow()
    const id = setInterval(fetchShow, 4000)
    return () => clearInterval(id)
  }, [fetchShow])

  const onToggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 6) return prev
      return [...prev, id]
    })
  }

  const handleHold = async () => {
    setMsg(null)
    if (!user) { setMsg('Sign in to hold seats'); return }
    const r = await fetch(`/api/shows/${params.id}/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ seatIds: selected }),
    })
    const j = await r.json()
    if (!r.ok) setMsg(j.error || 'Hold failed')
    else {
      setHold({ holdId: j.holdId, expiresAt: j.expiresAt })
      setMsg(`Held for 10 minutes - ${selected.length} seats`)
    }
    fetchShow()
  }

  const handleRelease = async () => {
    if (!hold) return
    await fetch(`/api/shows/${params.id}/hold`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ holdId: hold.holdId }),
    })
    setHold(null)
    setSelected([])
    setMsg('Hold released')
    fetchShow()
  }

  const handleBook = async () => {
    setMsg(null)
    if (!user) { setMsg('Sign in to book'); return }
    if (!hold) { setMsg('Hold seats first'); return }
    const r = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ showId: params.id, seatIds: selected, holdId: hold.holdId }),
    })
    const j = await r.json()
    if (!r.ok) setMsg(j.error || 'Booking failed')
    else {
      setBooking(j.booking)
      setMsg(`Booked ✓ ${j.booking.reference}`)
      setHold(null)
    }
    fetchShow()
  }

  const handleWaitlist = async () => {
    if (!user) { setMsg('Sign in to join waitlist'); return }
    const eventId = data?.event?.id
    if (!eventId) return
    const r = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ eventId, showId: params.id, category: waitlistCategory }),
    })
    const j = await r.json()
    if (!r.ok) setMsg(j.error || 'Waitlist failed')
    else setMsg(`Waitlisted for ${waitlistCategory} - position ${j.waitlist.position}`)
  }

  if (loading || !data) {
    return (
      <div className="relative min-h-screen">
        <LandingBackground />
        <TicketHeader />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
          <div className="h-96 rounded-2xl bg-muted animate-pulse" />
        </main>
      </div>
    )
  }

  const { show, event, venue, stats } = data
  const seats = show.seats as any[]
  const selectedSeats = seats.filter((s) => selected.includes(s.seatId))
  const total = selectedSeats.reduce((a, b) => a + b.price, 0)
  const category = selectedSeats[0]?.category || waitlistCategory

  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <TicketHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <Link href={`/events/${event?.id}`} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Back to {event?.title}
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{event?.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {venue?.name} · {venue?.city}
              </span>
              <span className="opacity-30">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> {show.date} {show.time}
              </span>
              <Badge variant="secondary" className="ml-1">
                {stats.booked}/{stats.total} booked
              </Badge>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground">Map polls every 4s · Hold 10m</span>
            {hold && <HoldTimer expiresAt={hold.expiresAt} onExpire={() => setHold(null)} />}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <SeatMap seats={seats} selected={selected} onToggle={onToggle} />
            <div className="mt-6 rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1">
                  <Crown className="size-3.5 text-amber-600" /> Premium ₹{event?.pricing?.Premium}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-200 px-3 py-1">
                  <Users className="size-3.5 text-violet-600" /> Standard ₹{event?.pricing?.Standard}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1">
                  <Star className="size-3.5 text-sky-600" /> Economy ₹{event?.pricing?.Economy}
                </span>
              </div>
              <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                <span>{stats.available} available</span>
                <span>·</span>
                <span>{stats.held} held</span>
                <span>·</span>
                <span>{stats.booked} booked</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 self-start">
            <Card className="p-5 gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Ticket className="size-4 text-primary" /> {selected.length} seats selected
                </div>
                {selected.length > 0 && (
                  <button onClick={() => setSelected([])} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                    Clear
                  </button>
                )}
              </div>

              {selectedSeats.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.map((s) => (
                    <span key={s.seatId} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {s.label} · {s.category} · ₹{s.price}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tap seats on the map - up to 6.</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-bold">₹{total.toLocaleString('en-IN')}</span>
              </div>

              <div className="grid gap-2">
                <Button
                  disabled={selected.length === 0 || !!hold}
                  onClick={handleHold}
                  className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {hold ? 'Held ✓' : `Hold ${selected.length ? `· ₹${total}` : ''}`}
                </Button>
                {hold ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleRelease}>
                      Release
                    </Button>
                    <Button onClick={handleBook} className="bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] text-white hover:opacity-90">
                      Book now
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" disabled onClick={handleBook} title={hold ? '' : 'Hold first'}>
                    Book - hold first
                  </Button>
                )}
              </div>

              {msg && <p className="text-xs rounded-lg bg-muted px-3 py-2">{msg}</p>}

              {booking && (
                <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-3">
                  <p className="text-sm font-semibold text-emerald-900">Confirmed - {booking.reference}</p>
                  <p className="text-xs text-emerald-800 mt-1">
                    Seats {booking.seatLabels?.join(', ')} · ₹{booking.totalAmount}
                  </p>
                  {booking.qrDataUrl && <img src={booking.qrDataUrl} alt="QR" className="mt-3 mx-auto size-36 bg-white p-2 rounded-xl border" />}
                  <Link href="/bookings" className="mt-3 inline-flex text-xs font-semibold text-emerald-700 hover:underline">
                    View all tickets →
                  </Link>
                </div>
              )}
            </Card>

            <Card className="p-5 gap-3">
              <div className="text-sm font-semibold">Sold out? Join waitlist</div>
              <p className="text-xs text-muted-foreground">Pick a category - on cancellation, next gets 10-min email with claim link.</p>
              <div className="flex gap-2">
                {(['Premium', 'Standard', 'Economy'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setWaitlistCategory(c)}
                    className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${waitlistCategory === c ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card hover:bg-accent'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <Button variant="secondary" onClick={handleWaitlist} className="w-full rounded-lg">
                Join {waitlistCategory} waitlist
              </Button>
              <Link href="/waitlist" className="text-xs font-semibold text-primary hover:underline">
                My waitlist →
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
