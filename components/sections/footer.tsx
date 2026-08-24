import Link from 'next/link'

const companyLinks = [
  { label: 'Events', href: '/events' },
  { label: 'My Tickets', href: '/bookings' },
  { label: 'Waitlist', href: '/waitlist' },
]

const systemLinks = [
  { label: 'Venues', href: '/admin' },
  { label: 'Organiser', href: '/organiser' },
  { label: 'Support', href: 'mailto:hello@curtain.in' },
]

const contactLinks = [
  { label: 'hello@curtain.in', href: 'mailto:hello@curtain.in' },
  { label: 'Browse events', href: '/events' },
]

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Curtain"
              className="h-16 w-auto invert dark:invert-0 drop-shadow-sm"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm text-balance text-muted-foreground">
            Ticket booking for movies & concerts - visual seat map, holds and waitlist that just works.
          </p>
        </div>
        <FooterColumn title="Company" links={companyLinks} />
        <FooterColumn title="Systems" links={systemLinks} />
        <FooterColumn title="Get in touch" links={contactLinks} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted-foreground sm:px-8">
          <p>© 2026 Curtain</p>
        </div>
      </div>
    </footer>
  )
}