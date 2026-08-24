'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LandingBackground } from '@/components/landing-background'
import { TicketHeader } from '@/components/ticketing/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('customer@curtain.in')
  const [password, setPassword] = useState('customer123')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      await login(email, password)
      router.push('/events')
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <TicketHeader />
      <main className="mx-auto max-w-md px-4 sm:px-6 pt-24 sm:pt-28 pb-8">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Welcome back</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use the seeded accounts or your registered email.</p>
        </div>

        <Card className="mt-8 p-6 gap-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {err && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{err}</p>}
            <Button type="submit" disabled={loading} className="w-full rounded-lg bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] text-white shadow-sm hover:opacity-90">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="rounded-xl border border-dashed p-4 bg-muted/50">
            <div className="text-xs font-semibold tracking-[0.1em] text-muted-foreground">TRY THESE</div>
            <div className="mt-2 grid gap-1.5 text-xs">
              <button onClick={() => { setEmail('admin@curtain.in'); setPassword('admin123') }} className="text-left font-mono hover:text-primary">admin@curtain.in / admin123 <span className="text-muted-foreground">- Admin</span></button>
              <button onClick={() => { setEmail('organiser@curtain.in'); setPassword('organiser123') }} className="text-left font-mono hover:text-primary">organiser@curtain.in / organiser123 <span className="text-muted-foreground">- Organiser</span></button>
              <button onClick={() => { setEmail('customer@curtain.in'); setPassword('customer123') }} className="text-left font-mono hover:text-primary">customer@curtain.in / customer123 <span className="text-muted-foreground">- Customer</span></button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link href="/auth/register" className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </p>
        </Card>
      </main>
    </div>
  )
}
