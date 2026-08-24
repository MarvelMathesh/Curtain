import {
  Puzzle,
  Mic,
  ShieldCheck,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react'

const principles: {
  icon: LucideIcon
  title: string
  description: string
}[] = [
  {
    icon: Puzzle,
    title: 'Built into your day. Not added to it.',
    description:
      'Curtain plugs into your existing workflow and does the work you already do - without clutter or another dashboard to maintain.',
  },
  {
    icon: Mic,
    title: 'The AI works. The results speak.',
    description:
      'No hype, no jargon. If it does not show up on your calendar, we have not done our job.',
  },
  {
    icon: ShieldCheck,
    title: 'Your data stays yours.',
    description:
      'Your system is built in Swiss infrastructure with data protection built in. What you tell us stays with you.',
  },
  {
    icon: HeartHandshake,
    title: 'One team, one goal.',
    description:
      'We do not disappear after installation. We measure results and help you grow with it.',
  },
]

export function Principles() {
  return (
    <section id="why-us" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          The way we work
        </p>
        <h2 className="mt-3 max-w-2xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-semibold tracking-tight text-balance text-transparent sm:text-4xl md:text-5xl">
          Four principles behind every build.
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {principles.map((principle, index) => (
            <div
              key={principle.title}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg sm:p-8"
            >
              <span className="absolute top-6 right-6 text-5xl font-bold text-foreground/10 select-none sm:text-6xl">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <principle.icon className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground sm:text-xl">
                {principle.title}
              </h3>
              <p className="mt-2.5 text-sm text-balance text-muted-foreground sm:text-base">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}