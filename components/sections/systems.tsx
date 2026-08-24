import {
  PhoneCall,
  Star,
  LayoutDashboard,
  MessagesSquare,
  Send,
  CalendarClock,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'

const systems: {
  icon: LucideIcon
  title: string
  description: string
}[] = [
  {
    icon: PhoneCall,
    title: 'AI Receptionist',
    description:
      'A professional voice answer that never takes a break, handles appointments, and transfers complex calls to your team.',
  },
  {
    icon: Star,
    title: 'Review & Reputation',
    description:
      'Capture every happy client as a 5-star review. Imagine winning back every star you have ever lost.',
  },
  {
    icon: LayoutDashboard,
    title: 'Reporting Dashboard',
    description:
      'See calls, bookings, coverage, and follow-ups in one live view.',
  },
  {
    icon: MessagesSquare,
    title: 'AI Customer Service',
    description:
      'A tireless assistant that answers questions and solves common issues instantly, at any hour.',
  },
  {
    icon: Send,
    title: 'Lead Follow-Up',
    description:
      'No lead left behind - next steps are scheduled and followed up automatically, every time.',
  },
  {
    icon: CalendarClock,
    title: 'Appointment Reminder',
    description:
      'Near-term reminders and reschedules succeed, cutting wasted hours.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp + Instagram',
    description:
      'Meet clients where they already are. Every held conversation is answered and actionable.',
  },
]

export function Systems() {
  return (
    <section id="aios-systems" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Curtain Systems
        </p>
        <h2 className="mt-3 max-w-2xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-semibold tracking-tight text-balance text-transparent sm:text-4xl md:text-5xl">
          Seven systems. Zero missed clients.
        </h2>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Everything your front desk needs, running quietly in the background.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((system, index) => {
            const isLast = index === systems.length - 1
            return (
              <div
                key={system.title}
                className={`group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${
                  isLast
                    ? 'sm:col-span-2 sm:justify-self-center sm:max-w-md lg:col-span-1 lg:col-start-2 lg:max-w-none'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <system.icon className="size-5" />
                  </div>
                  <span className="text-lg font-bold text-foreground/10 transition-colors group-hover:text-primary/30">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {system.title}
                </h3>
                <p className="mt-2 text-sm text-balance text-muted-foreground">
                  {system.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}