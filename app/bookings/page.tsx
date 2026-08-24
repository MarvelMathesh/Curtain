'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LandingBackground } from '@/components/landing-background'
import { TicketHeader } from '@/components/ticketing/header'
import { BookingTicket } from '@/components/curtain/booking-ticket'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const load = async () => {
    const r = await fetch('/api/bookings', { credentials: 'include' })
    const j = await r.json()
    if (r.ok) setBookings(j.bookings || [])
    else setMsg(j.error || 'Failed to load')
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const cancel = async (id: string) => {
    if (!confirm('Cancel this booking? Seat will be freed for waitlist.')) return
    const r = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST', credentials: 'include' })
    const j = await r.json()
    if (!r.ok) setMsg(j.error || 'Cancel failed')
    else { setMsg('Cancelled - refund in 5-7 days'); load() }
  }

  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <TicketHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Your tickets</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">QR at entry · Cancel anytime · Waitlist auto-fires on cancel.</p>
          </div>
          <Link href="/events">
            <Button variant="outline" className="rounded-full">Browse events</Button>
          </Link>
        </div>

        {msg && <p className="mt-6 rounded-xl bg-muted px-4 py-2 text-sm">{msg}</p>}

        {loading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="mt-8 p-8 text-center gap-3">
            <p className="font-semibold">No bookings yet</p>
            <p className="text-sm text-muted-foreground">Browse events, open the seat map, hold and book. Your QR will appear here.</p>
            <Link href="/events"><Button className="mt-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Browse events</Button></Link>
          </Card>
        ) : (
          <div className="mt-8 grid gap-6">
            {bookings.map((b) => (
              <div key={b.id} className="space-y-3">
                <BookingTicket booking={b} event={b.event} venue={b.venue} />
                <div className="flex items-center gap-2">
                  <Badge variant={b.status === 'confirmed' ? 'premium' : 'destructive'} className="capitalize">{b.status}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleString()} · {b.showId}</span>
                  <div className="ml-auto flex gap-2">
                    <Link href={`/bookings`}><Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(b.reference)}>Copy ref</Button></Link>
                    {b.status === 'confirmed' && <Button variant="destructive" size="sm" onClick={() => cancel(b.id)}>Cancel booking</Button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
