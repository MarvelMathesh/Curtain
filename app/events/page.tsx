'use client'
import { useEffect, useState } from 'react'
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

  const fetchEvents = async () => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (filters.search) qs.set('search', filters.search)
    if (filters.type) qs.set('type', filters.type)
    if (filters.city) qs.set('city', filters.city)
    const r = await fetch(`/api/events?${qs.toString()}`, { cache: 'no-store' })
    const j = await r.json()
    setEvents(j.events || [])
    setCities(j.cities || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.city])

  // debounce search
  useEffect(() => {
    const id = setTimeout(() => fetchEvents(), 250)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search])

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
