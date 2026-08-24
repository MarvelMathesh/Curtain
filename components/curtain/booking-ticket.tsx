'use client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function BookingTicket({ booking, event, venue }: { booking:any; event:any; venue:any }){
  return (
    <Card className="overflow-hidden p-0 gap-0 border shadow-lg">
      <div className="bg-[linear-gradient(135deg,oklch(0.646_0.222_41.116),oklch(0.488_0.243_264.376))] p-5 text-white">
        <div className="text-xs tracking-[0.2em] opacity-80">WORK ARTIFICIAL • ADMIT ONE</div>
        <div className="font-bold text-xl mt-1 leading-tight">{event?.title}</div>
        <div className="text-sm opacity-90 mt-1">{venue?.name} · {venue?.city} · {booking.showId}</div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground tracking-widest">BOOKING REF</div>
            <div className="font-mono font-bold text-lg">{booking.reference}</div>
            <div className="text-xs text-muted-foreground">{new Date(booking.createdAt).toLocaleString()}</div>
          </div>
          <Badge variant={booking.status==='confirmed'?'premium':'destructive'} className="capitalize">{booking.status}</Badge>
        </div>
        <Separator className="my-4"/>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-xs text-muted-foreground">Seats</div><div className="font-semibold">{booking.seatLabels?.join(', ')}</div><div className="text-xs text-muted-foreground">{booking.category} · {booking.seatIds?.length} tickets</div></div>
          <div><div className="text-xs text-muted-foreground">Total paid</div><div className="font-bold text-lg">₹{booking.totalAmount?.toLocaleString('en-IN')}</div></div>
        </div>
        {booking.qrDataUrl && (
          <>
            <Separator className="my-4"/>
            <div className="flex flex-col items-center gap-3">
              <img src={booking.qrDataUrl} alt="QR" className="size-44 rounded-xl border bg-white p-2 shadow-sm"/>
              <div className="text-xs text-muted-foreground text-center max-w-[280px]">QR encodes your booking reference. Show at entry - staff will scan. Screenshot is valid.</div>
              <div className="font-mono text-xs tracking-widest bg-muted px-3 py-1 rounded-full">WA:{booking.reference}</div>
            </div>
          </>
        )}
        <div className="mt-4 border-t border-dashed pt-4 flex justify-between text-[11px] text-muted-foreground">
          <span>Need help? support@workartificial.com</span>
          <span>No resale · ID required</span>
        </div>
      </div>
    </Card>
  )
}
