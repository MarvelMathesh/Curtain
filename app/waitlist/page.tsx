'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LandingBackground } from '@/components/landing-background'
import { TicketHeader } from '@/components/ticketing/header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HoldTimer } from '@/components/curtain/hold-timer'

export default function WaitlistPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const load = async () => {
    const r = await fetch('/api/waitlist', { credentials: 'include' })
    const j = await r.json()
    if (r.ok) setList(j.waitlist || [])
    else setMsg(j.error || 'Failed to load')
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const cancel = async (id: string) => {
    const r = await fetch(`/api/waitlist?id=${id}`, { method: 'DELETE', credentials: 'include' })
    const j = await r.json()
    if (!r.ok) setMsg(j.error || 'Failed')
    else { setMsg('Removed from waitlist'); load() }
  }

  const claim = async (token: string) => {
    const r = await fetch('/api/waitlist/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ token }) })
    const j = await r.json()
    if (!r.ok) setMsg(j.error || 'Claim failed')
    else { setMsg(`Claimed ✓ ${j.booking.reference}`); load() }
  }

  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <TicketHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Don&apos;t miss the drop</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Waitlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">When a seat frees, next in queue gets a 10-minute hold via email. Claim from here too.</p>
        </div>

        {msg && <p className="mt-6 rounded-xl bg-muted px-4 py-2 text-sm">{msg}</p>}

        {loading ? (
          <div className="mt-8 h-48 rounded-2xl bg-muted animate-pulse" />
        ) : list.length === 0 ? (
          <Card className="mt-8 p-8 text-center gap-3">
            <p className="font-semibold">Not waitlisted yet</p>
            <p className="text-sm text-muted-foreground">Sold-out categories show a waitlist button on the seat map. You&apos;ll appear here.</p>
            <Link href="/events"><Button className="mt-2 rounded-lg bg-primary text-primary-foreground">Browse events</Button></Link>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4">
            {list.map((w) => (
              <Card key={w.id} className="p-5 gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{w.event?.title || w.eventId} · {w.category}</div>
                    <div className="text-sm text-muted-foreground">{w.venue?.name} · {w.show?.date} {w.show?.time} · Seat {w.seatIdOffered || '- pending'}</div>
                    <div className="text-xs text-muted-foreground mt-1">Joined {new Date(w.createdAt).toLocaleString()} · Position {w.position}</div>
                  </div>
                  <Badge variant={w.status === 'waiting' ? 'secondary' : w.status === 'offered' ? 'premium' : w.status === 'converted' ? 'violet' : 'destructive'} className="capitalize">{w.status}</Badge>
                </div>

                {w.status === 'offered' && w.expiresAt && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-amber-50 border-amber-200 p-3">
                    <HoldTimer expiresAt={w.expiresAt} />
                    <span className="text-sm font-medium text-amber-900">Reserved {w.seatIdOffered} for you</span>
                    <div className="ml-auto flex gap-2">
                      <Link href={`/waitlist/claim?token=${w.offerToken}`}><Button size="sm" className="bg-primary text-primary-foreground">Claim page</Button></Link>
                      <Button size="sm" onClick={() => claim(w.offerToken)} className="bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] text-white">Claim now</Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {(w.status === 'waiting' || w.status === 'offered') && <Button variant="outline" size="sm" onClick={() => cancel(w.id)}>Leave waitlist</Button>}
                  {w.show?.id && <Link href={`/shows/${w.showId}`}><Button variant="ghost" size="sm">Open seat map →</Button></Link>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
