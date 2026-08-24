'use client'

import { useEffect, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { animate, motion, useMotionValue } from 'motion/react'

import { cn } from '@/lib/utils'

export interface MediaItem {
  src: string
  alt: string
  poster?: string
  isVideo?: boolean
  objectFit?: 'cover' | 'contain'
  className?: string
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mediaQuery.matches)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function MediaSlide({
  item,
  index,
  active,
  total,
}: {
  item: MediaItem
  index: number
  active: boolean
  total: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (active && !reducedMotion) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [active, index, reducedMotion])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  return (
    <div
      key={item.src}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      className="h-[440px] w-full shrink-0 sm:h-[520px]"
    >
      <div
        className={cn(
          'group relative h-full w-full',
          item.objectFit === 'contain' && 'bg-card',
          item.className
        )}
      >
        {item.isVideo ? (
          <video
            ref={videoRef}
            src={item.src}
            poster={item.poster}
            muted
            loop
            playsInline
            preload="metadata"
            onClick={toggle}
            className="size-full cursor-pointer rounded-lg object-cover select-none"
          />
        ) : (
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            draggable={false}
            className={cn(
              'pointer-events-none size-full rounded-lg select-none',
              item.objectFit === 'contain' ? 'object-contain' : 'object-cover'
            )}
          />
        )}
        {item.isVideo && !isPlaying && (
          <button
            type="button"
            aria-label="Play video"
            onClick={toggle}
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-300 motion-safe:group-hover:scale-110">
              <Play className="size-5 fill-current" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export function FramerCarousel({ media }: { media: MediaItem[] }) {
  const [index, setIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth || 1
      const targetX = -index * containerWidth

      animate(x, targetX, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })
    }
  }, [index, x])

  return (
    <div className="mx-auto max-w-4xl p-2 sm:p-4 lg:p-10">
      <div ref={containerRef} className="relative overflow-hidden rounded-lg">
        <motion.div className="flex" style={{ x }}>
          {media.map((item, i) => (
            <MediaSlide
              key={item.src}
              item={item}
              index={i}
              active={i === index}
              total={media.length}
            />
          ))}
        </motion.div>

        <motion.button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
          aria-label="Previous testimonial"
          className={`absolute top-1/2 left-4 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-lg ring-1 ring-border backdrop-blur-sm transition-transform ${
            index === 0
              ? 'cursor-not-allowed bg-background/50 text-foreground/40 opacity-60'
              : 'bg-background/80 text-foreground hover:scale-110 hover:bg-background'
          }`}
        >
          <ChevronLeft className="size-6" aria-hidden="true" />
        </motion.button>

        <motion.button
          type="button"
          disabled={index === media.length - 1}
          onClick={() =>
            setIndex((current) => Math.min(media.length - 1, current + 1))
          }
          aria-label="Next testimonial"
          className={`absolute top-1/2 right-4 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-lg ring-1 ring-border backdrop-blur-sm transition-transform ${
            index === media.length - 1
              ? 'cursor-not-allowed bg-background/50 text-foreground/40 opacity-60'
              : 'bg-background/80 text-foreground hover:scale-110 hover:bg-background'
          }`}
        >
          <ChevronRight className="size-6" aria-hidden="true" />
        </motion.button>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-xl bg-background/80 p-2 ring-1 ring-border backdrop-blur-sm">
          {media.map((item, i) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-foreground' : 'w-2 bg-foreground/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}