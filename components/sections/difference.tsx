import { CircleCheck, CircleX } from 'lucide-react'

import { ShineBorder } from '@/components/ui/shine-border'

const without = [
  'Calls ring into voicemail after work hours',
  'Leads wait days for a reply',
  'Appointments get double-booked or forgotten',
  'Follow-ups slip through the cracks',
  'Your evenings are spent on the phone, not with your family',
]

const withAios = [
  'Every call is answered, day or night',
  'Clients get booked in seconds, not days',
  'Reminders and no-shows handled automatically',
  'Every lead is followed up within minutes',
  'Your nights are yours again',
]

export function Difference() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          The same business. Two very different weeks.
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-center text-3xl font-semibold tracking-tight text-balance text-transparent sm:text-4xl md:text-5xl">
          Life before and after the system.
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-muted/30 p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Without Curtain
            </p>
            <ul className="mt-5 space-y-3.5">
              {without.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CircleX className="mt-0.5 size-4.5 shrink-0 text-destructive/70" />
                  <span className="text-sm text-muted-foreground sm:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-2xl border border-primary/30 bg-primary/[0.04] p-6 sm:p-8">
            <ShineBorder
              className="rounded-2xl"
              borderWidth={1}
              duration={12}
              shineColor={[
                'oklch(0.646 0.222 41.116)',
                'oklch(0.488 0.243 264.376)',
                'oklch(0.723 0.219 149.579)',
              ]}
            />
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              With Curtain
            </p>
            <ul className="mt-5 space-y-3.5">
              {withAios.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CircleCheck className="mt-0.5 size-4.5 shrink-0 text-primary" />
                  <span className="text-sm text-foreground sm:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}