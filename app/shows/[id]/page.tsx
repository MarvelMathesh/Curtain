'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
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
import { useToast } from '@/components/ui/toast'
import { Clock, Ticket, Crown, Users, Star, MapPin } from 'lucide-react'

export default function ShowPage() {
  const params = useParams() as { id: string }
  const { user } = useAuth()
  const { add } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [hold, setHold] = useState<{ holdId: string; expiresAt: string } | null>(null)
  const [booking, setBooking] = useState<any>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [waitlistCategory, setWaitlistCategory] = useState<string>('Premium')
  const [isHolding, setIsHolding] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [isWaitlisting, setIsWaitlisting] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const prevDataRef = useRef<string>('')

  const fetchShow = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const ac = new AbortController()
    abortRef.current = ac
    try {
      const r = await fetch(`/api/shows/${encodeURIComponent(params.id)}`, { cache: 'no-store', signal: ac.signal })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to load show')
      const serialized = JSON.stringify(j)
      if (serialized !== prevDataRef.current) {
        prevDataRef.current = serialized
        setData(j)
      } else {
        // dedup: still update if first load
        if (!prevDataRef.current) setData(j)
      }
      setError(null)
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Failed to load show')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchShow()
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      fetchShow()
    }, 4000)
    const onVis = () => {
      if (typeof document !== 'undefined' && !document.hidden) fetchShow()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      abortRef.current?.abort()
    }
  }, [fetchShow])

  const onToggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 6) {
        add({ title: 'Max 6 seats', description: 'You can select up to 6 seats.', variant: 'error' })
        return prev
      }
      return [...prev, id]
    })
  }

  const handleHold = async () => {
    setMsg(null)
    if (!user) {
      add({ title: 'Sign in required', description: 'Sign in to hold seats', variant: 'error' })
      setMsg('Sign in to hold seats')
      return
    }
    if (selected.length === 0) {
      add({ title: 'Select seats', description: 'Select at least one seat', variant: 'error' })
      return
    }
    if (isHolding) return
    setIsHolding(true)
    try {
      const seatIds = [...new Set(selected)]
      const r = await fetch(`/api/shows/${encodeURIComponent(params.id)}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seatIds }),
      })
      const j = await r.json()
      if (!r.ok) {
        const m = j.error || 'Hold failed'
        setMsg(m)
        add({ title: 'Hold failed', description: m, variant: 'error' })
      } else {
        setHold({ holdId: j.holdId, expiresAt: j.expiresAt })
        const m = `Held for 10 minutes - ${seatIds.length} seats`
        setMsg(m)
        add({ title: 'Seats held', description: m, variant: 'success' })
      }
      fetchShow()
    } catch (e: any) {
      const m = e?.message || 'Hold failed'
      setMsg(m)
      add({ title: 'Hold failed', description: m, variant: 'error' })
    } finally {
      setIsHolding(false)
    }
  }

  const handleRelease = async () => {
    if (!hold) return
    if (isReleasing) return
    setIsReleasing(true)
    try {
      await fetch(`/api/shows/${encodeURIComponent(params.id)}/hold`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ holdId: hold.holdId }),
      })
      setHold(null)
      setSelected([])
      setMsg('Hold released')
      add({ title: 'Hold released', variant: 'default' })
      fetchShow()
    } finally {
      setIsReleasing(false)
    }
  }

  const handleBook = async () => {
    setMsg(null)
    if (!user) {
      add({ title: 'Sign in required', description: 'Sign in to book', variant: 'error' })
      setMsg('Sign in to book')
      return
    }
    if (!hold) {
      add({ title: 'Hold required', description: 'Hold seats first', variant: 'error' })
      setMsg('Hold seats first')
      return
    }
    if (isBooking) return
    setIsBooking(true)
    try {
      const seatIds = [...new Set(selected)]
      const r = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ showId: params.id, seatIds, holdId: hold.holdId }),
      })
      const j = await r.json()
      if (!r.ok) {
        const m = j.error || 'Booking failed'
        setMsg(m)
        add({ title: 'Booking failed', description: m, variant: 'error' })
      } else {
        setBooking(j.booking)
        const m = `Booked ✓ ${j.booking.reference}`
        setMsg(m)
        add({ title: 'Booked', description: m, variant: 'success' })
        setHold(null)
      }
      fetchShow()
    } catch (e: any) {
      const m = e?.message || 'Booking failed'
      setMsg(m)
      add({ title: 'Booking failed', description: m, variant: 'error' })
    } finally {
      setIsBooking(false)
    }
  }

  const handleWaitlist = async () => {
    if (!user) {
      add({ title: 'Sign in required', description: 'Sign in to join waitlist', variant: 'error' })
      setMsg('Sign in to join waitlist')
      return
    }
    if (isWaitlisting) return
    setIsWaitlisting(true)
    try {
      const eventId = data?.event?.id
      if (!eventId) return
      const r = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventId, showId: params.id, category: waitlistCategory }),
      })
      const j = await r.json()
      if (!r.ok) {
        const m = j.error || 'Waitlist failed'
        setMsg(m)
        add({ title: 'Waitlist failed', description: m, variant: 'error' })
      } else {
        const m = `Waitlisted for ${waitlistCategory} - position ${j.waitlist.position}`
        setMsg(m)
        add({ title: 'Waitlisted', description: m, variant: 'success' })
      }
    } finally {
      setIsWaitlisting(false)
    }
  }

  const handleHoldExpired = useCallback(() => {
    setHold(null)
    const m = 'Hold expired - seats released'
    setMsg(m)
    add({ title: 'Hold expired', description: m, variant: 'error' })
    fetchShow()
  }, [add, fetchShow])

  if (loading || !data) {
    if (error) {
      return (
        <div className="relative min-h-screen">
          <LandingBackground />
          <TicketHeader />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
            <div role="alert" aria-live="assertive" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
              <p className="font-semibold">Failed to load show</p>
              <p className="text-muted-foreground mt-1">{error}</p>
              <Button onClick={() => { setLoading(true); setError(null); fetchShow() }} className="mt-3" variant="outline" size="sm">Retry</Button>
            </div>
          </main>
        </div>
      )
    }
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
        <Link href={`/events/${encodeURIComponent(event?.id ?? '')}`} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Back to {event?.title}
        </Link>

        {error && (
          <div role="alert" aria-live="assertive" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}

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
            {hold && <HoldTimer expiresAt={hold.expiresAt} onExpire={handleHoldExpired} />}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <SeatMap seats={seats} selected={selected} onToggle={onToggle} />
            <div className="mt-6 rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-amber-900 dark:text-amber-200">
                  <Crown className="size-3.5 text-amber-600" /> Premium ₹{event?.pricing?.Premium}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 px-3 py-1 text-violet-900 dark:text-violet-200">
                  <Users className="size-3.5 text-violet-600" /> Standard ₹{event?.pricing?.Standard}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 px-3 py-1 text-sky-900 dark:text-sky-200">
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
                <div className="flex flex-wrap gap-1.5" aria-live="polite" aria-atomic="true">
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
                  disabled={selected.length === 0 || !!hold || isHolding}
                  onClick={handleHold}
                  aria-busy={isHolding}
                  className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isHolding ? 'Holding…' : hold ? 'Held ✓' : `Hold ${selected.length ? `· ₹${total}` : ''}`}
                </Button>
                {hold ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleRelease} disabled={isReleasing} aria-busy={isReleasing}>
                      {isReleasing ? 'Releasing…' : 'Release'}
                    </Button>
                    <Button onClick={handleBook} disabled={isBooking} aria-busy={isBooking} className="bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] text-white hover:opacity-90">
                      {isBooking ? 'Booking…' : 'Book now'}
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" disabled onClick={handleBook} title={hold ? '' : 'Hold first'}>
                    Book - hold first
                  </Button>
                )}
              </div>

              {msg && <p role="status" aria-live="polite" className="text-xs rounded-lg bg-muted px-3 py-2">{msg}</p>}

              {booking && (
                <div className="rounded-xl border bg-emerald-500/15 border-emerald-500/30 p-3">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Confirmed - {booking.reference}</p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                    Seats {booking.seatLabels?.join(', ')} · ₹{booking.totalAmount}
                  </p>
                  {booking.qrDataUrl && <img src={booking.qrDataUrl} alt={`QR code for booking ${booking.reference}`} className="mt-3 mx-auto size-36 bg-white p-2 rounded-xl border" loading="lazy" decoding="async" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }} />}
                  <Button asChild variant="link" size="sm" className="mt-2 px-0 h-auto text-emerald-700 dark:text-emerald-300">
                    <Link href="/bookings">View all tickets →</Link>
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-5 gap-3">
              <div className="text-sm font-semibold">Sold out? Join waitlist</div>
              <p className="text-xs text-muted-foreground">Pick a category - on cancellation, next gets 10-min email with claim link.</p>
              <div className="flex gap-2" role="group" aria-label="Waitlist category">
                {(['Premium', 'Standard', 'Economy'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setWaitlistCategory(c)}
                    aria-pressed={waitlistCategory === c}
                    className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${waitlistCategory === c ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card hover:bg-accent'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <Button variant="secondary" onClick={handleWaitlist} disabled={isWaitlisting} aria-busy={isWaitlisting} className="w-full rounded-lg">
                {isWaitlisting ? 'Joining…' : `Join ${waitlistCategory} waitlist`}
              </Button>
              <Button asChild variant="link" size="sm" className="px-0 h-auto">
                <Link href="/waitlist">My waitlist →</Link>
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
