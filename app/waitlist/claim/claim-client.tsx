'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HoldTimer } from '@/components/curtain/hold-timer'

export default function ClaimClient() {
  const sp = useSearchParams()
  const token = sp.get('token') || ''
  const [data, setData] = useState<any>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`/api/waitlist/claim?token=${token}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) setMsg(j.error || 'Invalid link')
        else setData(j)
        setLoading(false)
      })
      .catch(() => { setMsg('Failed to load'); setLoading(false) })
  }, [token])

  const claim = async () => {
    setMsg(null)
    const r = await fetch('/api/waitlist/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    })
    const j = await r.json()
    if (!r.ok) setMsg(j.error || 'Claim failed')
    else { setBooking(j.booking); setMsg(`Confirmed ✓ ${j.booking.reference}`) }
  }

  if (!token) {
    return (
      <Card className="p-8 text-center gap-3">
        <p className="font-semibold">Missing claim token</p>
        <p className="text-sm text-muted-foreground">Open the link from your email - it contains a token like <span className="font-mono text-xs">?token=…</span></p>
        <Link href="/waitlist"><Button variant="outline" className="mt-2">Go to waitlist</Button></Link>
      </Card>
    )
  }

  if (loading) return <Card className="p-8"><div className="h-32 animate-pulse bg-muted rounded-xl" /></Card>

  if (msg && !data) {
    return (
      <Card className="p-8 text-center gap-3">
        <p className="font-semibold">Claim link issue</p>
        <p className="text-sm text-muted-foreground">{msg}</p>
        <Link href="/waitlist"><Button variant="outline" className="mt-2">Go to waitlist</Button></Link>
      </Card>
    )
  }

  if (booking) {
    return (
      <Card className="p-6 gap-4 text-center">
        <div className="mx-auto size-12 rounded-full bg-emerald-100 grid place-items-center text-emerald-700 text-xl">✓</div>
        <div className="font-semibold text-lg">Waitlist seat confirmed</div>
        <div className="text-sm text-muted-foreground">Reference {booking.reference} · Seats {booking.seatLabels?.join(', ')} · ₹{booking.totalAmount}</div>
        {booking.qrDataUrl && <img src={booking.qrDataUrl} alt="QR" className="mx-auto size-40 bg-white p-2 rounded-xl border" />}
        <div className="flex justify-center gap-2">
          <Link href="/bookings"><Button className="bg-primary text-primary-foreground">View bookings</Button></Link>
          <Link href="/events"><Button variant="outline">Browse events</Button></Link>
        </div>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
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
        <Button disabled={expired || entry?.status !== 'offered'} onClick={claim} className="w-full rounded-lg bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] text-white">
          {expired ? 'Offer expired' : 'Claim seat - confirm booking'}
        </Button>
        <p className="text-xs text-muted-foreground text-center">Requires sign-in as the waitlisted account.</p>
        {msg && <p className="text-sm rounded-lg bg-muted px-3 py-2">{msg}</p>}
      </Card>
    </div>
  )
}
