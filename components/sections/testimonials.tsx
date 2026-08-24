'use client'

import { motion } from 'motion/react'

import { FramerCarousel, type MediaItem } from '@/components/ui/framer-carousel'

const media: MediaItem[] = [
  {
    src: 'https://file.garden/aFeyJUziAimN2Txi/aios/testimonial1.mp4',
    poster: 'https://file.garden/aFeyJUziAimN2Txi/aios/testimonial1.png',
    alt: 'Landscape video of a client talking about Curtain',
    isVideo: true,
  },
  {
    src: 'https://file.garden/aFeyJUziAimN2Txi/aios/testimonial2.mp4',
    alt: 'Portrait video of a client talking about Curtain',
    isVideo: true,
    className: 'mx-auto max-w-sm',
  },
  {
    src: 'https://file.garden/aFeyJUziAimN2Txi/aios/testimonial1.png',
    alt: 'Still frame from a client testimonial',
    objectFit: 'contain',
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <motion.div {...fadeUp} className="text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Testimonials
          </p>
          <h2 className="mt-3 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-semibold tracking-tight text-balance text-transparent sm:text-4xl md:text-5xl">
            Real clients, recorded.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            No scripts, no stock footage. Watch what it is actually like to run
            Curtain, straight from the businesses using it.
          </p>
        </motion.div>

        <div className="mt-10">
          <FramerCarousel media={media} />
        </div>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="-mt-6 text-center"
        >
          <a
            href="#book-a-call"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Book a call <span aria-hidden="true">&rarr;</span>
          </a>
        </motion.p>
      </div>
    </section>
  )
}