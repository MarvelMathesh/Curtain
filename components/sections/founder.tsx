const credentials = [
  'AI & automation since Oct 2023',
  'Built for Swiss-market compliance',
  'A system, not a demo',
]

export function Founder() {
  return (
    <section id="founder" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center sm:px-8">
        <div className="mx-auto size-32 overflow-hidden rounded-full sm:size-40">
          <img
            src="/pfp.jpg"
            alt="Kash, Founder of Curtain"
            className="size-full object-cover"
          />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Founder, Curtain
        </p>
        <h2 className="mt-3 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-semibold tracking-tight text-balance text-transparent sm:text-4xl md:text-5xl">
          Built by someone who has already done this.
        </h2>
        <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
          I am Kash - an AI automation specialist creating revenue systems for
          small businesses in the Swiss market. When a business works with me,
          they get a system designed from the start for their industry, their
          compliance needs, and their budget.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {credentials.map((credential) => (
            <span
              key={credential}
              className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-foreground"
            >
              {credential}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}