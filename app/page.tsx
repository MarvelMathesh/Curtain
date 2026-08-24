'use client'
import { HeroLanding } from '@/components/ui/hero-1'
import { LandingBackground } from '@/components/landing-background'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShineBorder } from '@/components/ui/shine-border'
import { NumberTicker } from '@/components/ui/number-ticker'
import { Ticket, Zap, Users, ShieldCheck, Clock3, Star, ArrowRight, MapPin } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

// Ticketing homepage - built *with* Curtain design, not *as* Curtain
// Reuses Curtain tokens, typography, spacing, card hover, gradients, and components

const logo = {
  src: '/logo.svg',
  alt: 'Curtain',
  companyName: 'Curtain',
}

function TicketValue() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <p className="mx-auto max-w-3xl text-center text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
          Every sold-out show leaves someone waiting.{" "}
          <span className="bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] bg-clip-text text-transparent">
            Every cancellation wastes a seat.
          </span>
        </p>
        <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Ticket className="size-4.5 text-primary" />
              <p className="text-sm font-semibold">Pick on a real map.</p>
            </div>
            <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">
              Visual grid per show with Premium / Standard / Economy, live price on hover, and honest availability - held vs booked.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Zap className="size-4.5 text-primary" />
              <p className="text-sm font-semibold">Hold that actually holds.</p>
            </div>
            <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">
              Select up to 6 seats → atomic 10-minute hold. Others see held as unavailable. Abandon → auto-release, map polls live.
            </p>
          </div>
        </div>
        <p className="mt-12 text-center text-base font-medium text-muted-foreground sm:text-lg">
          No double-booking. <span className="text-foreground">No wasted seats.</span>
        </p>
      </div>
    </section>
  )
}

function TicketStats() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-primary uppercase">The numbers that matter</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            { icon: Ticket, value: 1248, label: 'Tickets issued', desc: 'Across 3 venues, 6 shows this week.', suffix: null },
            { icon: ShieldCheck, value: 0, label: 'Double-booked', desc: 'Concurrency-safe holds & bookings.', suffix: <span className="text-primary">%</span> },
            { icon: Clock3, value: 10, label: 'Minutes to decide', desc: 'Hold TTL & waitlist offer window.', suffix: <span className="text-primary text-2xl">m</span> },
          ].map((s) => (
            <div key={s.label} className="group relative rounded-2xl border bg-card p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-8">
              <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <s.icon className="size-5" />
              </div>
              <p className="mt-4 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                <NumberTicker value={s.value} />
                {s.suffix}
              </p>
              <p className="mt-2 text-base font-semibold">{s.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowTicketingWorks() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">How it works</p>
        <h2 className="mt-3 max-w-2xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-semibold tracking-tight text-balance text-transparent sm:text-4xl md:text-5xl">
          Your night, uninterrupted.
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { title: 'Visual seat map', desc: 'Per-show grid with live status. Premium up front, Economy up top. Hover for price.', icon: Ticket, color: 'from-amber-500 to-orange-600' },
            { title: 'Hold with TTL', desc: 'Selecting seats creates a 10-minute atomic hold. Abandon → auto-release via scheduler + DB expiry.', icon: Zap, color: 'from-violet-600 to-indigo-600' },
            { title: 'Waitlist that works', desc: 'Sold out? Join per-category queue. On cancellation, next gets 10-min email with claim link.', icon: Users, color: 'from-emerald-600 to-teal-600' },
          ].map((f) => (
            <Card key={f.title} className="p-6 gap-3 hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className={`size-10 rounded-xl bg-gradient-to-br ${f.color} grid place-items-center text-white shadow-sm`}>
                <f.icon className="size-5" />
              </div>
              <div className="font-semibold">{f.title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function Roles() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Roles</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">Built for everyone in the venue</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">Separate auth and dashboards, one shared source of truth for seats. Admin, organiser, customer - same design, different capabilities.</p>
            </div>
            <Link href="/events"><Button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">Browse events <ArrowRight className="size-4 ml-1" /></Button></Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { role: 'Admin', title: 'Manages venues', desc: 'Creates venues with rows/cols and seat categories (Premium 2 rows, Standard 3, Economy rest).', href: '/admin' },
              { role: 'Organiser', title: 'Lists shows', desc: 'Creates movie / concert listings with venue, date, time and per-category pricing. Views revenue.', href: '/organiser' },
              { role: 'Customer', title: 'Books seats', desc: 'Browses, filters, picks on the grid, holds, books, gets QR email, manages bookings & waitlist.', href: '/events' },
            ].map((r) => (
              <div key={r.role} className="rounded-2xl border bg-card p-6">
                <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">{r.role}</p>
                <p className="mt-2 text-base font-semibold">{r.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                <Link href={r.href} className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-primary/80">Open <ArrowRight className="size-3 ml-1" /></Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TicketPreview() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <Badge className="rounded-full" variant="secondary">Featured</Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock3 className="size-3" />Hold 07:42 left</span>
            </div>
            <h3 className="mt-4 text-xl font-semibold">Dune: Part Two - IMAX Premiere</h3>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="size-3" />Grand Rex Hall · Mumbai · Today 19:30</p>
            <div className="mt-6 grid grid-cols-12 gap-1.5">
              {Array.from({ length: 36 }).map((_, i) => {
                const s = i % 9 === 0 ? 'bg-foreground' : i % 7 === 0 ? 'bg-zinc-300' : i % 5 === 0 ? 'bg-amber-100 border-amber-300 border' : 'bg-white border'
                return <div key={i} className={`aspect-square rounded-[6px] border ${s}`} />
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">A3 · Premium · ₹899</span>
              <span className="rounded-full border px-3 py-1 text-xs font-medium">B7 · Standard · ₹549</span>
            </div>
          </div>
          <Card className="p-6 gap-3 relative overflow-hidden">
            <ShineBorder shineColor={['oklch(0.646 0.222 41.116)', 'oklch(0.488 0.243 264.376)', 'oklch(0.72 0.14 75)']} borderWidth={1} duration={12} />
            <div className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Concurrency guarantee</div>
            <p className="text-sm text-muted-foreground leading-relaxed">Two customers can’t hold or book the same seat. Atomic holds with TTL and real-time release. Polling every 4s keeps the map honest.</p>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1">No oversell</span>
              <span className="rounded-full bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1">Auto-release 10m</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3 text-amber-500 fill-amber-500" /> 3 venues · 6 shows · Mumbai / Bangalore / Delhi</div>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { user } = useAuth()
  const navigation = user
    ? [
        { name: 'Events', href: '/events' },
        { name: 'My Tickets', href: '/bookings' },
        { name: 'Waitlist', href: '/waitlist' },
        { name: 'Organiser', href: '/organiser' },
      ]
    : []
  return (
    <main className="relative">
      <LandingBackground />
      <HeroLanding
        logo={logo}
        navigation={navigation}
        loginText={user ? "" : "Sign in"}
        loginHref={user ? "" : "/auth/login"}
        badge="Curtain - Ticketing demo"
        title="Every seat, every show, instantly."
        description="Visual seat map, 10-minute holds with auto-release, sold-out waitlist that auto-assigns on cancellation, and QR tickets via email. No double-booking. No wasted seats. Built with the Curtain design system."
        callToActions={[
          { text: 'Browse events', href: '/events', variant: 'primary' as const },
          { text: 'How it works', href: '#how-it-works', variant: 'secondary' as const },
        ]}
      />
      <TicketValue />
      <TicketStats />
      <div id="how-it-works"><HowTicketingWorks /></div>
      <TicketPreview />
      <Roles />
      {/* Reuse Curtain closing to keep excellence */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Ready to take a seat?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">Try the flow: hold seats, watch the timer, book, get a QR, cancel and watch the waitlist fire. All in 2 minutes.</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/events"><Button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">Browse events</Button></Link>
            <Link href="/auth/register" className="text-sm font-semibold hover:text-muted-foreground">Create account →</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
