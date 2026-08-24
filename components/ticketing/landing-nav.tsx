'use client'
import { HeroLanding } from '@/components/ui/hero-1'
import { useAuth } from '@/lib/auth-context'

const logo = {
  src: '/logo.svg',
  alt: 'Curtain',
  companyName: 'Curtain',
}

export function LandingNav() {
  const { user } = useAuth()
  const navigation = user
    ? [
        { name: 'Events', href: '/events' },
        { name: 'My Tickets', href: '/bookings' },
        { name: 'Waitlist', href: '/waitlist' },
        { name: 'Organiser', href: '/organiser' },
      ]
    : []
  return (
    <HeroLanding
      logo={logo}
      navigation={navigation}
      loginText={user ? '' : 'Sign in'}
      loginHref={user ? '' : '/auth/login'}
      badge="Curtain - Ticketing demo"
      title="Every seat, every show, instantly."
      description="Visual seat map, 10-minute holds with auto-release, sold-out waitlist that auto-assigns on cancellation, and QR tickets via email. No double-booking. No wasted seats. Built with the Curtain design system."
      callToActions={[
        { text: 'Browse events', href: '/events', variant: 'primary' as const },
        { text: 'How it works', href: '#how-it-works', variant: 'secondary' as const },
      ]}
    />
  )
}
