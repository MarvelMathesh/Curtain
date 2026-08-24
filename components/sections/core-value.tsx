import { PhoneCall, CalendarCheck2 } from 'lucide-react'

export function CoreValue() {
  return (
    <section
      id="what-is-aios"
      className="relative py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <p className="mx-auto max-w-3xl text-center text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
          Every unanswered call is a client{" "}
          <span className="bg-gradient-to-r from-[oklch(0.646_0.222_41.116)] to-[oklch(0.488_0.243_264.376)] bg-clip-text text-transparent">
            someone else just booked
          </span>
          .
        </p>

        <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <PhoneCall className="size-4.5 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Called, not screened.
              </p>
            </div>
            <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">
              Curtain installs the AI Operations System that answers,
              books, and follows up - day or night.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <CalendarCheck2 className="size-4.5 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                One system. One calendar. Full pipeline.
              </p>
            </div>
            <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">
              Your calls answered, your calendar filled, your leads chased -
              while your team focuses on the client in front of them.
            </p>
          </div>
        </div>

        <p className="mt-12 text-center text-base font-medium text-muted-foreground sm:text-lg">
          Your receptionist can&apos;t work nights.{" "}
          <span className="text-foreground">Ours never sleeps.</span>
        </p>
      </div>
    </section>
  )
}