'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Menu, X } from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
}

interface AnnouncementBanner {
  text: string
  linkText: string
  linkHref: string
}

interface CallToAction {
  text: string
  href: string
  variant: 'primary' | 'secondary'
}

interface HeroLandingProps {
  logo?: {
    src: string
    alt: string
    companyName: string
  }

  navigation?: NavigationItem[]
  loginText?: string
  loginHref?: string

  title: string
  description: string
  badge?: string
  announcementBanner?: AnnouncementBanner
  callToActions?: CallToAction[]

  titleSize?: 'small' | 'medium' | 'large'
  gradientColors?: {
    from: string
    to: string
  }

  className?: string
}

const defaultProps: Partial<HeroLandingProps> = {
  logo: {
    src: 'https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600',
    alt: 'Company Logo',
    companyName: 'Your Company',
  },
  navigation: [
    { name: 'Product', href: '#' },
    { name: 'Features', href: '#' },
    { name: 'Marketplace', href: '#' },
    { name: 'Company', href: '#' },
  ],
  loginText: 'Log in',
  loginHref: '#',
  titleSize: 'large',
  gradientColors: {
    from: 'oklch(0.646 0.222 41.116)',
    to: 'oklch(0.488 0.243 264.376)',
  },
  callToActions: [
    { text: 'Get started', href: '#', variant: 'primary' },
    { text: 'Learn more', href: '#', variant: 'secondary' },
  ],
}

function isInternal(href: string) {
  return href.startsWith('/') && !href.startsWith('//')
}

export function HeroLanding(props: HeroLandingProps) {
  const {
    logo,
    navigation,
    loginText,
    loginHref,
    title,
    description,
    badge,
    announcementBanner,
    callToActions,
    titleSize,
    gradientColors,
    className,
  } = { ...defaultProps, ...props }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getTitleSizeClasses = () => {
    switch (titleSize) {
      case 'small':
        return 'text-2xl sm:text-3xl md:text-5xl'
      case 'medium':
        return 'text-2xl sm:text-4xl md:text-6xl'
      case 'large':
      default:
        return 'text-3xl sm:text-5xl md:text-7xl'
    }
  }

  const renderCallToAction = (cta: CallToAction, index: number) => {
    if (cta.variant === 'primary') {
      const cls = "rounded-lg bg-primary px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors"
      if (isInternal(cta.href)) {
        return (
          <Link key={index} href={cta.href} className={cls}>
            {cta.text}
          </Link>
        )
      }
      return (
        <a
          key={index}
          href={cta.href}
          className={cls}
        >
          {cta.text}
        </a>
      )
    } else {
      const cls = "text-xs sm:text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors"
      if (isInternal(cta.href)) {
        return (
          <Link key={index} href={cta.href} className={cls}>
            {cta.text} <span aria-hidden="true">→</span>
          </Link>
        )
      }
      return (
        <a
          key={index}
          href={cta.href}
          className={cls}
        >
          {cta.text} <span aria-hidden="true">→</span>
        </a>
      )
    }
  }

  return (
    <div className={`relative flex min-h-screen flex-col ${className || ''}`}>
      <header className="absolute inset-x-0 top-0 z-10">
        <nav
          aria-label="Global"
          className="flex items-center justify-between p-4 sm:p-6 lg:px-8"
        >
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">{logo?.companyName}</span>
              <img
                alt={logo?.alt}
                src={logo?.src}
                className="h-14 sm:h-16 w-auto invert dark:invert-0 drop-shadow-sm"
                loading="lazy"
                decoding="async"
                onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }}
              />
            </Link>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              <Menu aria-hidden="true" className="size-6" />
            </button>
          </div>
          {navigation && navigation.length > 0 && (
            <div className="hidden lg:flex lg:flex-1 lg:justify-center">
              <div className="flex gap-x-8 xl:gap-x-12">
                {navigation.map((item) => (
                  isInternal(item.href) ? (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors"
                    >
                      {item.name}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            {loginText && loginHref && (
              isInternal(loginHref) ? (
                <Link
                  href={loginHref}
                  className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors"
                >
                  {loginText} <span aria-hidden="true">&rarr;</span>
                </Link>
              ) : (
                <a
                  href={loginHref}
                  className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors"
                >
                  {loginText} <span aria-hidden="true">&rarr;</span>
                </a>
              )
            )}
          </div>
        </nav>
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogContent showCloseButton={false} className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-card px-4 py-4 sm:px-6 sm:py-6 sm:max-w-sm sm:ring-1 sm:ring-border lg:hidden">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5">
                <span className="sr-only">{logo?.companyName}</span>
                <img
                  alt={logo?.alt}
                  src={logo?.src}
                  className="h-14 sm:h-16 w-auto invert dark:invert-0 drop-shadow-sm"
                  loading="lazy"
                  decoding="async"
                  onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }}
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="sr-only">Close menu</span>
                <X aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="mt-2 flow-root">
              <div className="-my-6 divide-y divide-border">
                {navigation && navigation.length > 0 && (
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      isInternal(item.href) ? (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <a
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          {item.name}
                        </a>
                      )
                    ))}
                  </div>
                )}
                {loginText && loginHref && (
                  <div className="py-6">
                    {isInternal(loginHref) ? (
                      <Link
                        href={loginHref}
                        onClick={() => setMobileMenuOpen(false)}
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {loginText}
                      </Link>
                    ) : (
                      <a
                        href={loginHref}
                        onClick={() => setMobileMenuOpen(false)}
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {loginText}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative isolate px-6 pt-4 min-h-screen flex flex-col justify-center overflow-x-clip">
        <div className="mx-auto max-w-4xl pt-20 sm:pt-25">
          {/* Announcement banner */}
          {announcementBanner && (
            <div className="hidden sm:mb-2 sm:flex sm:justify-center">
              <div className="relative rounded-full px-2 py-1 text-xs sm:px-3 sm:text-sm/6 text-muted-foreground ring-1 ring-border hover:ring-ring transition-all">
                {announcementBanner.text}{' '}
                {isInternal(announcementBanner.linkHref) ? (
                  <Link
                    href={announcementBanner.linkHref}
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <span aria-hidden="true" className="absolute inset-0" />
                    {announcementBanner.linkText}{' '}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                ) : (
                  <a
                    href={announcementBanner.linkHref}
                    className="font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <span aria-hidden="true" className="absolute inset-0" />
                    {announcementBanner.linkText}{' '}
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                )}
              </div>
            </div>
          )}

           <div className="text-center">
             {badge && (
               <p className="mb-4 sm:mb-6 text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                 {badge}
               </p>
             )}
              <h1
                className={`${getTitleSizeClasses()} bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text font-semibold tracking-tight text-balance text-transparent`}
              >
               {title}
             </h1>
            <p className="mt-6 sm:mt-8 text-base sm:text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
              {description}
            </p>

            {/* Call to action buttons */}
            {callToActions && callToActions.length > 0 && (
              <div className="mt-8 sm:mt-10 flex items-center justify-center gap-x-4 sm:gap-x-6">
                {callToActions.map((cta, index) =>
                  renderCallToAction(cta, index)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export type { HeroLandingProps, NavigationItem, AnnouncementBanner, CallToAction }

export default HeroLanding
