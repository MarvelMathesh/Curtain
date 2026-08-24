'use client'

import { FramerCarousel, type MediaItem } from '@/components/ui/framer-carousel'

const media: MediaItem[] = [
  {
    src: 'https://file.garden/aFeyJUziAimN2Txi/aios/hiw1.png',
    alt: 'How it works: portrait one',
    objectFit: 'contain',
    className: 'mx-auto max-w-sm',
  },
  {
    src: 'https://file.garden/aFeyJUziAimN2Txi/aios/hiw2.png',
    alt: 'How it works: landscape one',
    objectFit: 'contain',
  },
  {
    src: 'https://file.garden/aFeyJUziAimN2Txi/aios/hiw3.png',
    alt: 'How it works: landscape two',
    objectFit: 'contain',
  },
  {
    src: 'https://file.garden/aFeyJUziAimN2Txi/aios/hiw4.png',
    alt: 'How it works: portrait two',
    objectFit: 'contain',
    className: 'mx-auto max-w-sm',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          How it works
        </p>
        <h2 className="mt-3 max-w-2xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-semibold tracking-tight text-balance text-transparent sm:text-4xl md:text-5xl">
          Your day with Curtain.
        </h2>

        <div className="mt-10">
          <FramerCarousel media={media} />
        </div>
      </div>
    </section>
  )
}