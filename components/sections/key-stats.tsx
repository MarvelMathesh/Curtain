import { HeartHandshake, MoonStar, PhoneCall, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { NumberTicker } from '@/components/ui/number-ticker'

const stats: {
  icon: LucideIcon
  value: number
  suffix?: ReactNode
  label: string
  description: string
}[] = [
  {
    icon: PhoneCall,
    value: 100,
    suffix: (
      <>
        <span className="text-primary">%</span>
      </>
    ),
    label: 'Calls answered',
    description: 'Every call, every time, even on a Sunday.',
  },
  {
    icon: HeartHandshake,
    value: 0,
    label: 'Leads lost',
    description: 'No slow, forgotten follow-ups.',
  },
  {
    icon: MoonStar,
    value: 24,
    suffix: (
      <>
        <span className="text-primary">/7</span>
      </>
    ),
    label: 'Coverage',
    description: 'No sick days. No holidays.',
  },
]

export function KeyStats() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          The numbers that matter
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative rounded-2xl border bg-card p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-8"
            >
              <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <stat.icon className="size-5" />
              </div>
              <p className="mt-4 text-4xl font-bold tracking-tight text-foreground tabular-nums sm:text-5xl">
                <NumberTicker value={stat.value} />
                {stat.suffix}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}