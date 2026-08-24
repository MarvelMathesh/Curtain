'use client'
import { useEffect, useState } from 'react'
import { LandingBackground } from '@/components/landing-background'
import { TicketHeader } from '@/components/ticketing/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function OrganiserPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { add } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'movie', description: '', venueId: '', date: '', time: '', durationMinutes: '120', Premium: '899', Standard: '549', Economy: '299', image: '' })
  const [venues, setVenues] = useState<any[]>([])

  const load = async () => {
    try {
      const r = await fetch('/api/organiser/stats', { credentials: 'include' })
      const j = await r.json()
      if (r.ok) setStats(j)
      else add({ title: 'Failed to load stats', description: j.error || 'Failed to load stats', variant: 'error' })
    } catch (e: any) {
      add({ title: 'Failed to load stats', description: e?.message || 'Error', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }
  const loadVenues = async () => {
    const r = await fetch('/api/venues')
    const j = await r.json()
    setVenues(j.venues || [])
    if (j.venues?.[0]) setForm((f) => ({ ...f, venueId: j.venues[0].id }))
  }
  useEffect(() => { load(); loadVenues() }, [])

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCreating) return
    setIsCreating(true)
    try {
      const body = {
        title: form.title,
        type: form.type,
        description: form.description,
        venueId: form.venueId,
        date: form.date,
        time: form.time,
        durationMinutes: Number(form.durationMinutes),
        pricing: { Premium: Number(form.Premium), Standard: Number(form.Standard), Economy: Number(form.Economy) },
        image: form.image || undefined,
      }
      const r = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
      const j = await r.json()
      if (!r.ok) add({ title: 'Create failed', description: j.error || 'Create failed', variant: 'error' })
      else { add({ title: 'Created', description: `Created ${j.event.title} - ${j.show.id}`, variant: 'success' }); load() }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <TicketHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Organiser</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Revenue & listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create movie / concert listings, set per-category pricing, track occupancy.</p>
        </div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">Organiser stats loaded</div>

        {loading ? <div className="mt-8 h-48 rounded-2xl bg-muted animate-pulse" /> : stats && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-5 gap-1">
                <div className="text-xs text-muted-foreground">Total revenue</div>
                <div className="text-2xl font-bold">₹{stats.stats.totalRevenue.toLocaleString('en-IN')}</div>
                <div className="text-xs text-muted-foreground">{stats.stats.totalBookings} confirmed bookings</div>
              </Card>
              <Card className="p-5 gap-1">
                <div className="text-xs text-muted-foreground">Occupancy</div>
                <div className="text-2xl font-bold">{stats.stats.occupancy}%</div>
                <div className="text-xs text-muted-foreground">{stats.stats.bookedSeats}/{stats.stats.totalSeats} seats booked</div>
              </Card>
              <Card className="p-5 gap-1">
                <div className="text-xs text-muted-foreground">Events</div>
                <div className="text-2xl font-bold">{stats.stats.eventsCount}</div>
                <div className="text-xs text-muted-foreground">Across {venues.length} venues</div>
              </Card>
              <Card className="p-5 gap-2">
                <div className="text-xs text-muted-foreground">Quick actions</div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="rounded-full"><Link href="/events">Browse</Link></Button>
                  <Button asChild size="sm" variant="outline" className="rounded-full"><Link href="/admin">Admin</Link></Button>
                </div>
              </Card>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="font-semibold">Your events</h2>
                <div className="mt-4 grid gap-4">
                  {stats.byEvent.length === 0 ? <Card className="p-6 text-sm text-muted-foreground">No events yet - create one on the right.</Card> : stats.byEvent.map((row: any) => (
                    <Card key={row.event.id} className="p-4 gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold">{row.event.title}</div>
                          <div className="text-xs text-muted-foreground">{row.venue?.name} · {row.event.date} {row.event.time} · {row.event.type}</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">{row.occupancy}%</Badge>
                      </div>
                      <div className="text-sm">₹{row.revenue.toLocaleString('en-IN')} revenue · {row.bookings} bookings · {row.seatsBooked}/{row.seatsTotal} seats</div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                        <div className="h-full bg-primary" style={{ width: `${row.occupancy}%` }} />
                      </div>
                      <Button asChild variant="link" size="sm" className="px-0 h-auto text-primary"><Link href={`/events/${encodeURIComponent(row.event.id)}`}>View →</Link></Button>
                    </Card>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold text-sm">Recent bookings</h3>
                  <div className="mt-3 space-y-2" aria-live="polite">
                    {stats.recentBookings.length === 0 ? <p className="text-sm text-muted-foreground">No bookings yet.</p> : stats.recentBookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between rounded-xl border bg-card px-3 py-2 text-sm">
                        <span className="font-mono text-xs">{b.reference}</span>
                        <span className="text-muted-foreground text-xs">{b.event?.title?.slice(0, 22)}</span>
                        <span className="text-xs">₹{b.totalAmount}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">{b.user?.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Card className="p-6 gap-4 self-start">
                <div className="font-semibold">Create event</div>
                <p className="text-sm text-muted-foreground">Venue rows/cols define seat grid (Premium 2 rows, Standard 3, Economy rest). Show is auto-created same date/time.</p>
                <form onSubmit={createEvent} className="space-y-3">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Dune - new show" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="organiser-type">Type</Label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                        <SelectTrigger id="organiser-type" aria-label="Event type"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="movie">Movie</SelectItem><SelectItem value="concert">Concert</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="organiser-venue">Venue</Label>
                      <Select value={form.venueId} onValueChange={(v) => setForm({ ...form, venueId: v })}>
                        <SelectTrigger id="organiser-venue" aria-label="Venue"><SelectValue placeholder="Select venue" /></SelectTrigger>
                        <SelectContent>{venues.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · {v.city}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="organiser-desc">Description</Label>
                    <Input id="organiser-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short pitch…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label htmlFor="organiser-date">Date</Label><Input id="organiser-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                    <div><Label htmlFor="organiser-time">Time</Label><Input id="organiser-time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label htmlFor="organiser-duration">Duration (min)</Label><Input id="organiser-duration" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></div>
                    <div><Label htmlFor="organiser-image">Image URL</Label><Input id="organiser-image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" /></div>
                    <div className="hidden sm:block" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label htmlFor="organiser-premium">Premium ₹</Label><Input id="organiser-premium" value={form.Premium} onChange={(e) => setForm({ ...form, Premium: e.target.value })} /></div>
                    <div><Label htmlFor="organiser-standard">Standard ₹</Label><Input id="organiser-standard" value={form.Standard} onChange={(e) => setForm({ ...form, Standard: e.target.value })} /></div>
                    <div><Label htmlFor="organiser-economy">Economy ₹</Label><Input id="organiser-economy" value={form.Economy} onChange={(e) => setForm({ ...form, Economy: e.target.value })} /></div>
                  </div>
                  <Button type="submit" disabled={isCreating} aria-busy={isCreating} className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">{isCreating ? 'Creating…' : 'Create event + show'}</Button>
                </form>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
