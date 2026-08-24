import type { Metadata } from 'next'
import React from 'react'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'Curtain - Ticket Booking for Movies & Concerts',
  description:
    'High-demand ticketing with visual seat map, 10-minute holds, waitlist auto-assign and QR tickets. For movies and concerts.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="scroll-smooth font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
