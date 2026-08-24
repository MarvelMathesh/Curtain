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
      <h2 className="sr-only">Seat map</h2>
      <div className="flex flex-wrap gap-3 justify-center mb-6 text-xs" role="list" aria-label="Seat legend">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-white border shadow-sm"/> Available</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-amber-100 border border-amber-300"/> Selected</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-zinc-200 border border-zinc-300"/> Held</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-zinc-900 border border-zinc-900"/> Booked</span>
        <span className="h-4 w-px bg-border mx-1" aria-hidden="true"/>
        {Object.keys(CAT_DOT).map(cat=> <span key={cat} className="inline-flex items-center gap-1"><span className={cn("size-2.5 rounded-full", CAT_DOT[cat])} aria-hidden="true"/>{cat}</span>)}
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="mx-auto mb-8 w-[70%] sm:w-[55%] h-2 rounded-full bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] via-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] shadow-[0_6px_20px_rgba(124,58,237,0.25)]" aria-hidden="true" />
        <div className="text-center text-[11px] tracking-[0.2em] text-muted-foreground -mt-6 mb-6" aria-hidden="true">S C R E E N / S T A G E</div>

        <div className="space-y-2.5 bg-card rounded-2xl border p-3 sm:p-6 shadow-sm" role="grid" aria-label={`Seat map, ${selected.length} of ${maxSelect} selected`}>
          {rows.map(([row, rowSeats])=> {
            const sorted = [...rowSeats].sort((a,b)=>a.number-b.number)
            return (
            <div key={row} className="flex items-center gap-2 sm:gap-3" role="row" aria-label={`Row ${row}`}>
              <div className="w-6 text-xs font-semibold text-muted-foreground text-center" aria-hidden="true">{row}</div>
              <div className="flex-1 grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns:`repeat(${sorted.length}, minmax(0,1fr))`}}>
                {sorted.map(seat=>{
                  const isSelected = selected.includes(seat.seatId)
                  const isAvailable = seat.status==='available'
                  const isHeld = seat.status==='held'
                  const isBooked = seat.status==='booked'
                  const disabled = !isAvailable && !isSelected
                  return (
                    <div key={seat.seatId} role="gridcell">
                      <button
                        disabled={disabled}
                        aria-pressed={isSelected}
                        aria-label={`${seat.label} ${seat.category} ₹${seat.price} ${isSelected ? 'selected' : seat.status}`}
                        aria-disabled={disabled}
                        onClick={()=> onToggle(seat.seatId)}
                        title={`${seat.label} · ${seat.category} · ₹${seat.price} · ${seat.status}`}
                        className={cn(
                          "relative aspect-square w-full rounded-[7px] border text-[10px] sm:text-xs font-semibold transition-all flex flex-col items-center justify-center leading-none",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isAvailable && "bg-white hover:bg-amber-50 hover:border-amber-400 hover:shadow-sm hover:-translate-y-0.5",
                          isSelected && "bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40 shadow-sm -translate-y-0.5 ring-1 ring-amber-400",
                          isHeld && "bg-zinc-200 border-zinc-300 text-zinc-500 cursor-not-allowed",
                          isBooked && "bg-zinc-900 border-zinc-900 text-white cursor-not-allowed",
                          "active:scale-95 disabled:opacity-60"
                        )}
                      >
                        <span className="hidden sm:block text-[11px]" aria-hidden="true">{seat.number}</span>
                        <span className="sm:hidden text-[9px]" aria-hidden="true">{seat.label.slice(1)}</span>
                        <span className={cn("absolute -top-1 -right-1 size-2 rounded-full border border-white hidden sm:block", CAT_DOT[seat.category])} aria-hidden="true"/>
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="w-6 text-xs font-semibold text-muted-foreground text-center" aria-hidden="true">{row}</div>
            </div>
            )
          })}
        </div>
        <div className="mt-4 flex justify-center gap-2 text-[11px] text-muted-foreground" aria-live="polite">
          <span>Select up to {maxSelect} seats</span>
          <span className="opacity-30">·</span>
          <span>{selected.length} selected</span>
        </div>
      </div>
    </div>
  )
}
