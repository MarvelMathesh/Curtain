import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const db = getDB()
  let emails = db.emails
  // customers see only their emails, organiser sees relevant, admin sees all
  if (user.role === 'customer') {
    emails = emails.filter((e) => e.to.toLowerCase() === user.email.toLowerCase())
  } else if (user.role === 'organiser') {
    const myEventTitles = db.events.filter((ev) => ev.organiserId === user.id).map((ev) => ev.title)
    emails = emails.filter((e) => e.to.toLowerCase() === user.email.toLowerCase() || myEventTitles.some((t) => e.subject.includes(t)))
  }
  emails = emails.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50)
  return NextResponse.json({ emails })
}
