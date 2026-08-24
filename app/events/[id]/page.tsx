'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LandingBackground } from '@/components/landing-background'
import { TicketHeader } from '@/components/ticketing/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, Timer, Ticket, Users, ArrowRight } from 'lucide-react'

export default function EventDetailPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`/api/events/${params.id}`)
        const j = await r.json()
        if (!r.ok) throw new Error(j.error || 'Not found')
        setData(j)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) {
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
  if (error || !data) {
    return (
      <div className="relative min-h-screen">
        <LandingBackground />
        <TicketHeader />
        <main className="mx-auto max-w-3xl px-4 pt-24 sm:pt-28 pb-8 text-center">
          <p className="font-semibold">Event not found</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Link href="/events" className="mt-6 inline-block">
            <Button variant="outline">Back to events</Button>
          </Link>
        </main>
      </div>
    )
  }

  const { event, venue, show } = data
  const pct = event.totalSeats ? Math.round((event.bookedCount / event.totalSeats) * 100) : 0

  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <TicketHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <Link href="/events" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Back to events
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border bg-muted">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="capitalize bg-white text-foreground border-0 shadow-sm">{event.type}</Badge>
                {event.featured && <Badge variant="violet" className="shadow-sm">Featured</Badge>}
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{event.title}</h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">{event.description}</p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-4 gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="size-4 text-primary" /> {venue?.name} · {venue?.city}
                  </div>
                  <p className="text-sm text-muted-foreground">{venue?.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {venue?.rows} rows × {venue?.cols} cols · {event.totalSeats} seats
                  </p>
                </Card>
                <Card className="p-4 gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="size-4 text-primary" /> {event.date} · {event.time}
                  </div>
                  <p className="text-sm text-muted-foreground">{event.durationMinutes} minutes · Doors 30m before</p>
                  <div className="flex gap-2 mt-1">
                    <span className="rounded-full bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 text-xs font-medium">
                      Premium ₹{event.pricing.Premium}
                    </span>
                    <span className="rounded-full bg-violet-50 text-violet-900 border border-violet-200 px-2.5 py-1 text-xs font-medium">
                      Standard ₹{event.pricing.Standard}
                    </span>
                    <span className="rounded-full bg-sky-50 text-sky-900 border border-sky-200 px-2.5 py-1 text-xs font-medium">
                      Economy ₹{event.pricing.Economy}
                    </span>
                  </div>
                </Card>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{pct}% booked</span>
                  <span>
                    {event.availableCount} left · {event.heldCount} held
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 self-start space-y-6">
            <Card className="p-6 gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Ticket className="size-4 text-primary" /> Choose your seats
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visual grid per show. Premium front, Economy up top. Hover price, live held vs booked. Hold 10 minutes - auto-release if you abandon.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="size-3" /> {event.totalSeats} seats · {event.availableCount} available
                <span className="mx-1 opacity-30">·</span>
                <Timer className="size-3" /> Hold 10m
              </div>
              {show ? (
                <Link href={`/shows/${show.id}`} className="block">
                  <Button className="w-full rounded-lg bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] text-white shadow-sm hover:opacity-90">
                    Open seat map <ArrowRight className="size-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  No show scheduled
                </Button>
              )}
              {event.isSoldOut && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="font-semibold text-amber-900">Sold out - join waitlist</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Pick a category. On cancellation, next in queue gets 10-min email.
                  </p>
                  <Link href={`/waitlist`} className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">
                    Go to waitlist →
                  </Link>
                </div>
              )}
            </Card>

            <Card className="p-6 gap-3">
              <div className="text-sm font-semibold">What you get</div>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>Atomic holds - no double booking.</li>
                <li>Polling every 4s keeps map honest.</li>
                <li>QR via email - screenshot valid at entry.</li>
                <li>Cancel anytime; frees seat for waitlist.</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
