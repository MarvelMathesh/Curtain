'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HoldTimer } from '@/components/curtain/hold-timer'
import { useToast } from '@/components/ui/toast'

export default function ClaimClient() {
  const sp = useSearchParams()
  const token = sp.get('token') || ''
  const [data, setData] = useState<any>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const { add } = useToast()

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`/api/waitlist/claim?token=${encodeURIComponent(token)}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) {
          setMsg(j.error || 'Invalid link')
          add({ title: 'Invalid link', description: j.error || 'Invalid link', variant: 'error' })
        }
        else setData(j)
        setLoading(false)
      })
      .catch(() => { setMsg('Failed to load'); add({ title: 'Failed to load', variant: 'error' }); setLoading(false) })
  }, [token, add])

  const claim = async () => {
    if (isClaiming) return
    setIsClaiming(true)
    setMsg(null)
    try {
      const r = await fetch('/api/waitlist/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      })
      const j = await r.json()
      if (!r.ok) {
        setMsg(j.error || 'Claim failed')
        add({ title: 'Claim failed', description: j.error || 'Claim failed', variant: 'error' })
      }
      else { setBooking(j.booking); const m=`Confirmed ✓ ${j.booking.reference}`; setMsg(m); add({ title: 'Confirmed', description: m, variant: 'success' }) }
    } finally {
      setIsClaiming(false)
    }
  }

  if (!token) {
    return (
      <Card className="p-8 text-center gap-3">
        <p className="font-semibold">Missing claim token</p>
        <p className="text-sm text-muted-foreground">Open the link from your email - it contains a token like <span className="font-mono text-xs">?token=…</span></p>
        <Button asChild variant="outline" className="mt-2"><Link href="/waitlist">Go to waitlist</Link></Button>
      </Card>
    )
  }

  if (loading) return <Card className="p-8"><div className="h-32 animate-pulse bg-muted rounded-xl" /></Card>

  if (msg && !data) {
    return (
      <Card className="p-8 text-center gap-3">
        <p className="font-semibold">Claim link issue</p>
        <p role="alert" aria-live="assertive" className="text-sm text-muted-foreground">{msg}</p>
        <Button asChild variant="outline" className="mt-2"><Link href="/waitlist">Go to waitlist</Link></Button>
      </Card>
    )
  }

  if (booking) {
    return (
      <Card className="p-6 gap-4 text-center">
        <div className="mx-auto size-12 rounded-full bg-emerald-100 grid place-items-center text-emerald-700 text-xl">✓</div>
        <div className="font-semibold text-lg">Waitlist seat confirmed</div>
        <div className="text-sm text-muted-foreground">Reference {booking.reference} · Seats {booking.seatLabels?.join(', ')} · ₹{booking.totalAmount}</div>
        {booking.qrDataUrl && <img src={booking.qrDataUrl} alt={`QR code for booking ${booking.reference}`} className="mx-auto size-40 bg-white p-2 rounded-xl border" loading="lazy" decoding="async" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }} />}
        <div className="flex justify-center gap-2">
          <Button asChild className="bg-primary text-primary-foreground"><Link href="/bookings">View bookings</Link></Button>
          <Button asChild variant="outline"><Link href="/events">Browse events</Link></Button>
        </div>
        {msg && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{msg}</p>}
      </Card>
    )
  }

  const { entry, event, seat } = data || {}
  const expired = entry?.expired || (entry?.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now())

  return (
    <div className="space-y-4">
      <Card className="p-6 gap-3">
        <div className="text-sm font-semibold">{event?.title}</div>
        <div className="text-sm text-muted-foreground">{event?.description?.slice(0, 120)}</div>
        <div className="rounded-xl border p-3 bg-card">
          <div className="text-sm font-medium">Reserved for you - {seat?.label || entry?.seatIdOffered} · {entry?.category} · ₹{seat?.price}</div>
          <div className="text-xs text-muted-foreground mt-1">Status {entry?.status} · {entry?.expiresAt ? `expires ${new Date(entry.expiresAt).toLocaleString()}` : ''}</div>
          <div className="mt-3 flex items-center gap-2">
            {entry?.expiresAt && !expired && <HoldTimer expiresAt={entry.expiresAt} />}
            {expired && <span className="rounded-full bg-destructive text-destructive-foreground px-3 py-1 text-xs font-semibold">Expired</span>}
          </div>
        </div>
        <Button disabled={expired || entry?.status !== 'offered' || isClaiming} aria-busy={isClaiming} onClick={claim} className="w-full rounded-lg bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] text-white">
          {isClaiming ? 'Claiming…' : expired ? 'Offer expired' : 'Claim seat - confirm booking'}
        </Button>
        <p className="text-xs text-muted-foreground text-center">Requires sign-in as the waitlisted account.</p>
        {msg && <p role="status" aria-live="polite" className="text-sm rounded-lg bg-muted px-3 py-2">{msg}</p>}
      </Card>
    </div>
  )
}
