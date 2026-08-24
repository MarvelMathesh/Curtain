'use client'
import { useEffect, useState } from 'react'
import { LandingBackground } from '@/components/landing-background'
import { TicketHeader } from '@/components/ticketing/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'

export default function AdminPage() {
  const [venues, setVenues] = useState<any[]>([])
  const { add } = useToast()
  const [form, setForm] = useState({ name: '', city: '', address: '', rows: '8', cols: '12', image: '' })
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const load = async () => {
    try {
      const r = await fetch('/api/venues')
      const j = await r.json()
      setVenues(j.venues || [])
    } catch (e: any) {
      add({ title: 'Failed to load venues', description: e?.message || 'Error', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const createVenue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCreating) return
    setIsCreating(true)
    try {
      const r = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const j = await r.json()
      if (!r.ok) add({ title: 'Create failed', description: j.error || 'Create failed', variant: 'error' })
      else { add({ title: 'Created', description: `Created ${j.venue.name} - ${j.venue.rows}×${j.venue.cols} (${j.venue.seats.length} seats)`, variant: 'success' }); load() }
    } finally {
      setIsCreating(false)
    }
  }

  const reset = async () => {
    if (isResetting) return
    if (!confirm('Reset entire DB to seeded state? All bookings lost.')) return
    setIsResetting(true)
    try {
      const r = await fetch('/api/admin/reset', { method: 'POST', credentials: 'include' })
      const j = await r.json()
      if (!r.ok) add({ title: 'Reset failed', description: j.error || 'Reset failed', variant: 'error' })
      else { add({ title: 'Reset', description: `Reset - ${j.venues} venues, ${j.events} events`, variant: 'success' }); load() }
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <TicketHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Venues</h1>
            <p className="mt-1 text-sm text-muted-foreground">Rows/cols → seat categories (Premium 2 rows, Standard 3, Economy rest).</p>
          </div>
          <Button variant="destructive" size="sm" disabled={isResetting} aria-busy={isResetting} onClick={reset} className="rounded-full">{isResetting ? 'Resetting…' : 'Reset DB to seed'}</Button>
        </div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">Venues count: {venues.length}</div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-6 gap-4 self-start">
            <div className="font-semibold">Create venue</div>
            <form onSubmit={createVenue} className="space-y-3">
              <div><Label htmlFor="admin-name">Name</Label><Input id="admin-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Curtain Black Box" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="admin-city">City</Label><Input id="admin-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required placeholder="Mumbai" /></div>
                <div><Label htmlFor="admin-address">Address</Label><Input id="admin-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Bandra, Mumbai" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="admin-rows">Rows (1-20)</Label><Input id="admin-rows" type="number" min={1} max={20} value={form.rows} onChange={(e) => setForm({ ...form, rows: e.target.value })} required /></div>
                <div><Label htmlFor="admin-cols">Cols (1-20)</Label><Input id="admin-cols" type="number" min={1} max={20} value={form.cols} onChange={(e) => setForm({ ...form, cols: e.target.value })} required /></div>
              </div>
              <div><Label htmlFor="admin-image">Image URL (optional)</Label><Input id="admin-image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://images.unsplash.com/…" /></div>
              <Button type="submit" disabled={isCreating} aria-busy={isCreating} className="w-full rounded-lg bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] text-white">{isCreating ? 'Creating…' : 'Create venue'}</Button>
              <p className="text-xs text-muted-foreground">Seed: Grand Rex (Mumbai 8×12), Symphony Arena (Bangalore 10×14), Curtain Studio (Delhi 6×10).</p>
            </form>
          </Card>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">All venues</h2>
              <Badge variant="secondary">{venues.length} total</Badge>
            </div>
            {loading ? <div className="mt-4 h-48 rounded-2xl bg-muted animate-pulse" /> : (
              <div className="mt-4 grid gap-4">
                {venues.map((v) => (
                  <Card key={v.id} className="overflow-hidden p-0 gap-0">
                    <div className="relative h-36 bg-muted">
                      <img src={v.image} alt={v.name} className="w-full h-full object-cover" loading="lazy" decoding="async" sizes="(max-width: 768px) 100vw, 50vw" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                        <div>
                          <div className="font-semibold">{v.name}</div>
                          <div className="text-xs opacity-90">{v.city} · {v.address}</div>
                        </div>
                        <Badge className="bg-white text-foreground border-0 shadow-sm">{v.rows}×{v.cols} · {v.seats.length} seats</Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">CATEGORIES</div>
                      <div className="mt-2 flex gap-2 text-xs">
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 px-2.5 py-1">Premium - first 2 rows</span>
                        <span className="rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-900 dark:text-violet-200 px-2.5 py-1">Standard - next 3 rows</span>
                        <span className="rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-900 dark:text-sky-200 px-2.5 py-1">Economy - rest</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <Card className="mt-10 p-6 gap-3 border-dashed">
          <div className="text-sm font-semibold">Seed credentials</div>
          <div className="grid sm:grid-cols-3 gap-2 text-xs font-mono bg-muted p-3 rounded-xl">
            <span>admin@curtain.in / admin123</span>
            <span>organiser@curtain.in / organiser123</span>
            <span>customer@curtain.in / customer123</span>
          </div>
          <p className="text-xs text-muted-foreground">All roles can sign in. Use Register to create more accounts.</p>
        </Card>
      </main>
    </div>
  )
}
