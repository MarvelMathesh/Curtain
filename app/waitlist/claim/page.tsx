import { Suspense } from 'react'
import { LandingBackground } from '@/components/landing-background'
import { TicketHeader } from '@/components/ticketing/header'
import ClaimClient from './claim-client'

export default function ClaimPage() {
  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <TicketHeader />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Waitlist offer</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Claim your seat</h1>
          <p className="mt-1 text-sm text-muted-foreground">10-minute window from the email. After expiry, next in queue is offered.</p>
        </div>
        <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-2xl" />}>
          <ClaimClient />
        </Suspense>
      </main>
    </div>
  )
}
