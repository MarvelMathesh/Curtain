'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LandingBackground } from '@/components/landing-background'
import { TicketHeader } from '@/components/ticketing/header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HoldTimer } from '@/components/curtain/hold-timer'
import { useToast } from '@/components/ui/toast'

export default function WaitlistPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { add } = useToast()
  const [isCancelling, setIsCancelling] = useState<string | null>(null)
  const [isClaiming, setIsClaiming] = useState<string | null>(null)

  const load = async () => {
    try {
      const r = await fetch('/api/waitlist', { credentials: 'include' })
      const j = await r.json()
      if (r.ok) setList(j.waitlist || [])
      else add({ title: 'Failed to load', description: j.error || 'Failed to load', variant: 'error' })
    } catch (e: any) {
      add({ title: 'Failed to load', description: e?.message || 'Failed', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const cancel = async (id: string) => {
    if (isCancelling) return
    setIsCancelling(id)
    try {
      const r = await fetch(`/api/waitlist?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
      const j = await r.json()
      if (!r.ok) add({ title: 'Failed', description: j.error || 'Failed', variant: 'error' })
      else { add({ title: 'Removed', description: 'Removed from waitlist', variant: 'success' }); load() }
    } finally {
      setIsCancelling(null)
    }
  }

  const claim = async (token: string) => {
    if (isClaiming) return
    setIsClaiming(token)
    try {
      const r = await fetch('/api/waitlist/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ token }) })
      const j = await r.json()
      if (!r.ok) add({ title: 'Claim failed', description: j.error || 'Claim failed', variant: 'error' })
      else { add({ title: 'Claimed', description: `Claimed ✓ ${j.booking.reference}`, variant: 'success' }); load() }
    } finally {
      setIsClaiming(null)
    }
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

        <div aria-live="polite" aria-atomic="true" className="sr-only">Waitlist entries: {list.length}</div>

        {loading ? (
          <div className="mt-8 h-48 rounded-2xl bg-muted animate-pulse" />
        ) : list.length === 0 ? (
          <Card className="mt-8 p-8 text-center gap-3">
            <p className="font-semibold">Not waitlisted yet</p>
            <p className="text-sm text-muted-foreground">Sold-out categories show a waitlist button on the seat map. You&apos;ll appear here.</p>
            <Button asChild className="mt-2 rounded-lg bg-primary text-primary-foreground"><Link href="/events">Browse events</Link></Button>
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
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-amber-500/15 border-amber-500/30 p-3">
                    <HoldTimer expiresAt={w.expiresAt} />
                    <span className="text-sm font-medium text-amber-900 dark:text-amber-200">Reserved {w.seatIdOffered} for you</span>
                    <div className="ml-auto flex gap-2">
                      <Button asChild size="sm" className="bg-primary text-primary-foreground"><Link href={`/waitlist/claim?token=${encodeURIComponent(w.offerToken)}`}>Claim page</Link></Button>
                      <Button size="sm" disabled={isClaiming===w.offerToken} aria-busy={isClaiming===w.offerToken} onClick={() => claim(w.offerToken)} className="bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] text-white">{isClaiming===w.offerToken ? 'Claiming…' : 'Claim now'}</Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {(w.status === 'waiting' || w.status === 'offered') && <Button variant="outline" size="sm" disabled={isCancelling===w.id} aria-busy={isCancelling===w.id} onClick={() => cancel(w.id)}>{isCancelling===w.id ? 'Leaving…' : 'Leave waitlist'}</Button>}
                  {w.show?.id && <Button asChild variant="ghost" size="sm"><Link href={`/shows/${encodeURIComponent(w.showId)}`}>Open seat map →</Link></Button>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
