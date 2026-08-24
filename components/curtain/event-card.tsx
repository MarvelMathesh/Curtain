import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MapPin, Clock, Ticket, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EventCard({ event }: { event: any }) {
  const pct = event.totalSeats ? Math.round((event.bookedCount / event.totalSeats) * 100) : 0
  const avail = event.availableCount
  const isSoldOut = event.isSoldOut
  return (
    <Link href={`/events/${encodeURIComponent(event.id)}`} className="group block">
      <Card className="overflow-hidden p-0 gap-0 border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" decoding="async" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }} />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="outline" className="capitalize bg-white text-zinc-900 border-zinc-200 shadow-sm hover:bg-white">{event.type}</Badge>
            {event.featured && <Badge variant="outline" className="bg-white text-zinc-900 border-zinc-200 shadow-sm">Featured</Badge>}
          </div>
          <div className="absolute top-3 right-3">
            {isSoldOut ? <Badge variant="destructive" className="shadow-sm">Sold out · Waitlist</Badge> : <Badge className="bg-emerald-600 text-white border-0 shadow-sm">{avail} seats left</Badge>}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
            <span className="flex items-center gap-1.5 bg-black/35 backdrop-blur px-2.5 py-1 rounded-full border border-white/15"><MapPin className="size-3"/>{event.venue?.name} · {event.venue?.city}</span>
            <span className="hidden sm:flex items-center gap-1 bg-white text-zinc-900 border border-zinc-200 px-2.5 py-1 rounded-full font-semibold shadow-sm"><Clock className="size-3 text-zinc-700"/> {event.date} · {event.time}</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">{event.description}</p>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium"><Ticket className="size-3"/> From ₹{Math.min(...Object.values(event.pricing as Record<string,number>))}</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="size-3"/> {event.totalSeats} seats</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden flex">
            <div className={cn("h-full transition-all", isSoldOut?'bg-destructive':'bg-primary')} style={{ width: `${pct}%` }}/>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{pct}% booked</span><span>{event.bookedCount}/{event.totalSeats}</span></div>
        </div>
      </Card>
    </Link>
  )
}
