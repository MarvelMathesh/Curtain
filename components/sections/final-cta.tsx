import { ArrowRight } from 'lucide-react'

import { ShimmerButton } from '@/components/ui/shimmer-button'
import { ShineBorder } from '@/components/ui/shine-border'

export function FinalCta() {
  return (
    <section id="book-a-call" className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-6 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border bg-card px-6 py-16 text-center sm:px-12 sm:py-20">
          <ShineBorder
            className="rounded-[2rem]"
            borderWidth={1}
            duration={12}
            shineColor={[
              'oklch(0.646 0.222 41.116)',
              'oklch(0.488 0.243 264.376)',
              'oklch(0.723 0.219 149.579)',
            ]}
          />
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Your next client is calling right now.
          </p>
          <h2 className="mx-auto mt-4 max-w-xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-semibold tracking-tight text-balance text-transparent sm:text-5xl">
            Who&apos;s picking up?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Book a 20-minute call and see the system live before you commit to
            anything. No setup fee, no pressure.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="https://workartificial.com" target="_blank" rel="noreferrer">
              <ShimmerButton
                shimmerColor="#ff6b6b"
                shimmerDuration="2.5s"
                background="linear-gradient(135deg, #e5462a 0%, #c81d30 50%, #6d28d9 100%)"
                className="h-12 px-8 text-base font-semibold"
              >
                Book a call
                <ArrowRight className="size-4.5" />
              </ShimmerButton>
            </a>
            <p className="text-sm text-muted-foreground">
              No setup fee · See it live first
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}