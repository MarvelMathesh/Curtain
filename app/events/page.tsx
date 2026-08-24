'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { LandingBackground } from '@/components/landing-background'
import { TicketHeader } from '@/components/ticketing/header'
import { EventCard } from '@/components/curtain/event-card'
import { FilterBar } from '@/components/curtain/filter-bar'

type Filters = { search: string; type: string; city: string }

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [filters, setFilters] = useState<Filters>({ search: '', type: 'all', city: 'all' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchEvents = useCallback(async (current: Filters) => {
    if (abortRef.current) abortRef.current.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (current.search) qs.set('search', current.search)
      if (current.type) qs.set('type', current.type)
      if (current.city) qs.set('city', current.city)
      const r = await fetch(`/api/events?${qs.toString()}`, { cache: 'no-store', signal: ac.signal })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to load events')
      if (ac.signal.aborted) return
      setEvents(j.events || [])
      setCities(j.cities || [])
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Failed to load events')
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.city])

  // debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchEvents(filters), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search])

  // abort on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const onChange = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }))

  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <TicketHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Curated for you</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Movies & concerts, one honest map.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Mumbai · Bangalore · Delhi · Visual seat grid, live holds, waitlist that actually works.
          </p>
        </div>

        <div className="mt-8">
          <FilterBar filters={filters} onChange={onChange} cities={cities} />
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            <p className="font-semibold">Failed to load events</p>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-xl border bg-muted animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="mt-16 text-center py-16 rounded-2xl border border-dashed bg-card">
            <p className="font-semibold">No events found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting search or filters.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
