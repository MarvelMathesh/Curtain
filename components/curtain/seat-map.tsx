'use client'
import { cn } from '@/lib/utils'
import { ShowSeat } from '@/lib/types'
import { useMemo } from 'react'

const CAT_DOT: Record<string,string> = {
  Premium: 'bg-amber-500', Standard: 'bg-violet-600', Economy: 'bg-sky-600'
}

export function SeatMap({
  seats,
  selected,
  onToggle,
  maxSelect = 6
}: { seats: ShowSeat[]; selected: string[]; onToggle:(id:string)=>void; maxSelect?:number }){
  const rows = useMemo(()=>{
    const map = new Map<string, ShowSeat[]>()
    for(const s of seats){
      if(!map.has(s.row)) map.set(s.row, [])
      map.get(s.row)!.push(s)
    }
    return Array.from(map.entries()).sort((a,b)=> a[0].localeCompare(b[0]))
  }, [seats])

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 justify-center mb-6 text-xs">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-white border shadow-sm"/> Available</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-amber-100 border border-amber-300"/> Selected</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-zinc-200 border border-zinc-300"/> Held</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-zinc-900 border border-zinc-900"/> Booked</span>
        <span className="h-4 w-px bg-border mx-1"/>
        {Object.keys(CAT_DOT).map(cat=> <span key={cat} className="inline-flex items-center gap-1"><span className={cn("size-2.5 rounded-full", CAT_DOT[cat])}/>{cat}</span>)}
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="mx-auto mb-8 w-[70%] sm:w-[55%] h-2 rounded-full bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] via-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] shadow-[0_6px_20px_rgba(124,58,237,0.25)]" />
        <div className="text-center text-[11px] tracking-[0.2em] text-muted-foreground -mt-6 mb-6">S C R E E N / S T A G E</div>

        <div className="space-y-2.5 bg-card rounded-2xl border p-3 sm:p-6 shadow-sm">
          {rows.map(([row, rowSeats])=> (
            <div key={row} className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 text-xs font-semibold text-muted-foreground text-center">{row}</div>
              <div className="flex-1 grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns:`repeat(${rowSeats.length}, minmax(0,1fr))`}}>
                {rowSeats.sort((a,b)=>a.number-b.number).map(seat=>{
                  const isSelected = selected.includes(seat.seatId)
                  const isAvailable = seat.status==='available'
                  const isHeld = seat.status==='held'
                  const isBooked = seat.status==='booked'
                  return (
                    <button
                      key={seat.seatId}
                      disabled={!isAvailable && !isSelected}
                      onClick={()=> onToggle(seat.seatId)}
                      title={`${seat.label} · ${seat.category} · ₹${seat.price} · ${seat.status}`}
                      className={cn(
                        "relative aspect-square rounded-[7px] border text-[10px] sm:text-xs font-semibold transition-all flex flex-col items-center justify-center leading-none",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isAvailable && "bg-white hover:bg-amber-50 hover:border-amber-400 hover:shadow-sm hover:-translate-y-0.5",
                        isSelected && "bg-amber-100 border-amber-400 text-amber-900 shadow-sm -translate-y-0.5 ring-1 ring-amber-400",
                        isHeld && "bg-zinc-200 border-zinc-300 text-zinc-500 cursor-not-allowed",
                        isBooked && "bg-zinc-900 border-zinc-900 text-white cursor-not-allowed",
                        "active:scale-95"
                      )}
                    >
                      <span className="hidden sm:block text-[11px]">{seat.number}</span>
                      <span className="sm:hidden text-[9px]">{seat.label.slice(1)}</span>
                      <span className={cn("absolute -top-1 -right-1 size-2 rounded-full border border-white hidden sm:block", CAT_DOT[seat.category])}/>
                    </button>
                  )
                })}
              </div>
              <div className="w-6 text-xs font-semibold text-muted-foreground text-center">{row}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-2 text-[11px] text-muted-foreground">
          <span>Select up to {maxSelect} seats</span>
          <span className="opacity-30">·</span>
          <span>{selected.length} selected</span>
        </div>
      </div>
    </div>
  )
}
