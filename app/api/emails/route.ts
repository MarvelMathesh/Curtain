import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = getUserFromToken(token || undefined)
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
  const db = getDB()
  // Strict: each user sees only their own emails; organiser/admin see only theirs
  // Customer PII (to, qr) must not leak via subject-match
  let emails = db.emails.filter((e) => e.to.toLowerCase() === user.email.toLowerCase())
  // strip heavy QR for list (fetch single email for QR)
  emails = emails
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
    .map(({ qrDataUrl, ...rest }) => ({ ...rest, hasQr: !!qrDataUrl }))
  return NextResponse.json({ emails })
}
