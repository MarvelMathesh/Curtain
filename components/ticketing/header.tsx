'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { LogOut, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Menu, X } from 'lucide-react'

export function TicketHeader(){
  const { user, logout } = useAuth()
  const [open,setOpen]=useState(false)
  // Exact same structure, classes, spacing and behavior as HeroLanding header
  return (
    <header className="absolute inset-x-0 top-0 z-10">
      <nav aria-label="Global" className="flex items-center justify-between p-4 sm:p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <span className="sr-only">Curtain</span>
            <img src="/logo.svg" alt="Curtain" className="h-14 sm:h-16 w-auto invert dark:invert-0 drop-shadow-sm" />
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button type="button" onClick={()=>setOpen(true)} className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-muted-foreground hover:text-foreground transition-colors">
            <span className="sr-only">Open main menu</span>
            <Menu aria-hidden="true" className="size-6" />
          </button>
        </div>
        {user && (
          <div className="hidden lg:flex lg:flex-1 lg:justify-center">
            <div className="flex gap-x-8 xl:gap-x-12">
              <Link href="/events" className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors">Events</Link>
              <Link href="/bookings" className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors">My Tickets</Link>
              <Link href="/waitlist" className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors">Waitlist</Link>
              {user?.role==='organiser' && <Link href="/organiser" className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors flex items-center gap-1"><LayoutDashboard className="size-4"/>Organiser</Link>}
              {user?.role==='admin' && <Link href="/admin" className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors">Admin</Link>}
            </div>
          </div>
        )}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
          {user ? (
            <>
              <span className="text-sm/6 text-muted-foreground hidden xl:inline">{user.name} · <span className="capitalize">{user.role}</span></span>
              <button onClick={logout} className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors flex items-center gap-1">
                Sign out <span aria-hidden="true">&rarr;</span>
              </button>
            </>
          ):(
            <>
              <Link href="/auth/login" className="text-sm/6 font-semibold text-foreground hover:text-muted-foreground transition-colors">Sign in <span aria-hidden="true">&rarr;</span></Link>
              <Link href="/auth/register" className="rounded-lg bg-primary px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors">Get started</Link>
            </>
          )}
        </div>
      </nav>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-card px-4 py-4 sm:px-6 sm:py-6 sm:max-w-sm sm:ring-1 sm:ring-border lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Curtain</span>
              <img src="/logo.svg" alt="Curtain" className="h-14 sm:h-16 w-auto invert dark:invert-0" />
            </Link>
            <button type="button" onClick={()=>setOpen(false)} className="-m-2.5 rounded-md p-2.5 text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">Close menu</span>
              <X aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-2 flow-root">
            <div className="-my-6 divide-y divide-border">
              {user ? (
                <div className="space-y-2 py-6">
                  <Link href="/events" onClick={()=>setOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Events</Link>
                  <Link href="/bookings" onClick={()=>setOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors">My Tickets</Link>
                  <Link href="/waitlist" onClick={()=>setOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Waitlist</Link>
                  {user?.role==='organiser' && <Link href="/organiser" onClick={()=>setOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Organiser</Link>}
                  {user?.role==='admin' && <Link href="/admin" onClick={()=>setOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Admin</Link>}
                </div>
              ) : (
                <div className="py-6">
                  <p className="text-sm text-muted-foreground px-3">Sign in to access Events, tickets and waitlist.</p>
                </div>
              )}
              <div className="py-6">
                {user ? (
                  <button onClick={()=>{logout(); setOpen(false)}} className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left">
                    Sign out - {user.email}
                  </button>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={()=>setOpen(false)} className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Sign in</Link>
                    <Link href="/auth/register" onClick={()=>setOpen(false)} className="-mx-3 mt-2 block rounded-lg bg-primary px-3 py-2.5 text-base/7 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors text-center">Get started</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
