const PAGE_GRADIENT_FROM = 'oklch(0.646 0.222 41.116)'
const PAGE_GRADIENT_TO = 'oklch(0.488 0.243 264.376)'

const BLOB_CLIP =
  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'

function Blob({
  linearGradient,
  className,
}: {
  linearGradient: string
  className: string
}) {
  return (
    <div
      style={{
        clipPath: BLOB_CLIP,
        background: linearGradient,
      }}
      className={`transform-gpu ${className}`}
    />
  )
}

/**
 * Page-wide gradient atmosphere. Recreates the Hero's visual treatment
 * (tinted, blurred polygon gradients) and extends it across the whole page
 * so every section sits on the same surface.
 */
export function LandingBackground() {
  const topRight = `linear-gradient(to top right, ${PAGE_GRADIENT_FROM}, ${PAGE_GRADIENT_TO})`
  const bottomLeft = `linear-gradient(to top right, ${PAGE_GRADIENT_TO}, ${PAGE_GRADIENT_FROM})`

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Subtle base wash so mid-page sections stay on the same surface */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(1200px 800px at 80% -5%, color-mix(in oklab, ${PAGE_GRADIENT_FROM} 16%, transparent), transparent 62%), radial-gradient(1100px 750px at 15% 35%, color-mix(in oklab, ${PAGE_GRADIENT_TO} 9%, transparent), transparent 60%), radial-gradient(1200px 800px at 85% 75%, color-mix(in oklab, ${PAGE_GRADIENT_FROM} 9%, transparent), transparent 62%), radial-gradient(1000px 700px at 10% 105%, color-mix(in oklab, ${PAGE_GRADIENT_TO} 12%, transparent), transparent 60%)`,
        }}
      />

      {/* Top gradient - identical to the original hero treatment */}
      <div className="absolute inset-x-0 -top-40 blur-3xl sm:-top-80">
        <Blob
          linearGradient={topRight}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>

      {/* Bottom-of-hero gradient - keeps the first viewport identical */}
      <div className="absolute inset-x-0 top-[calc(100svh-13rem)] blur-3xl sm:top-[calc(100svh-30rem)]">
        <Blob
          linearGradient={topRight}
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        />
      </div>

      {/* Mid-page gradient - carries the atmosphere past the hero */}
      <div className="absolute inset-x-0 top-[175svh] blur-3xl">
        <Blob
          linearGradient={bottomLeft}
          className="relative left-[calc(50%-22rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[145deg] opacity-25 sm:w-[64rem]"
        />
      </div>

      {/* Lower-third gradient - keeps the CTA and footer on the same surface */}
      <div className="absolute inset-x-0 top-[330svh] blur-3xl">
        <Blob
          linearGradient={topRight}
          className="relative left-[calc(50%+2rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] opacity-25 sm:left-[calc(50%+26rem)] sm:w-[68rem]"
        />
      </div>

      {/* Bottom gradient - mirrors the hero's bottom blob on the final viewport */}
      <div className="absolute inset-x-0 bottom-[-14rem] blur-3xl">
        <Blob
          linearGradient={bottomLeft}
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        />
      </div>
    </div>
  )
}