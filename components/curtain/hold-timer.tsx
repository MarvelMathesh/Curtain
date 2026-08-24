'use client'
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HoldTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire?:()=>void }){
  const [secs, setSecs] = useState(()=> Math.max(0, Math.floor((new Date(expiresAt).getTime()-Date.now())/1000)))
  useEffect(()=>{
    const id = setInterval(()=>{
      const s = Math.max(0, Math.floor((new Date(expiresAt).getTime()-Date.now())/1000))
      setSecs(s)
      if(s===0) { clearInterval(id); onExpire?.() }
    }, 250)
    return ()=> clearInterval(id)
  }, [expiresAt, onExpire])
  const m = Math.floor(secs/60)
  const s = secs%60
  const low = secs < 60
  const expired = secs===0
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold border", expired? "bg-destructive text-destructive-foreground border-destructive" : low ? "bg-amber-100 text-amber-900 border-amber-300 animate-pulse" : "bg-emerald-50 text-emerald-900 border-emerald-200")}>
      <Clock className="size-3.5"/> {expired ? 'Expired' : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`} {!expired && 'left'}
    </span>
  )
}
