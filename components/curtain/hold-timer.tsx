'use client'
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HoldTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire?:()=>void }){
  const calcSecs = () => Math.max(0, Math.floor((new Date(expiresAt).getTime()-Date.now())/1000))
  const [secs, setSecs] = useState(()=> calcSecs())

  // resync when expiresAt changes
  useEffect(()=>{ setSecs(calcSecs()) }, [expiresAt])

  useEffect(()=>{
    const id = setInterval(()=>{
      const s = calcSecs()
      setSecs(s)
      if(s===0) { clearInterval(id); onExpire?.() }
    }, 1000)
    return ()=> clearInterval(id)
  }, [expiresAt, onExpire])
  const m = Math.floor(secs/60)
  const s = secs%60
  const low = secs < 60 && secs>0
  const expired = secs===0
  return (
    <span role="timer" aria-live="polite" aria-atomic="true" aria-label={expired? 'Hold expired' : `Hold time remaining ${m} minutes ${s} seconds`} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold border", expired? "bg-destructive text-destructive-foreground border-destructive" : low ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30 motion-safe:animate-pulse" : "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/30")}>
      <Clock className="size-3.5" aria-hidden="true"/> {expired ? 'Expired' : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`} {!expired && 'left'}
    </span>
  )
}
