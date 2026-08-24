import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmailAsync } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { email, password } = body
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  const cleanEmail = email.trim().toLowerCase()
  const user = await findUserByEmailAsync(cleanEmail)
  // constant-time-like: always verify even if user not found (dummy hash) to avoid timing oracle
  const dummyHash = '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid'
  const hashToCheck = user ? user.passwordHash : dummyHash
  const ok = await verifyPassword(password, hashToCheck)
  if (!user || !ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }
  const token = signToken(user)
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  const isProd = process.env.NODE_ENV === 'production'
  res.cookies.set('curtain_token', token, { httpOnly: true, path: '/', maxAge: 60*60*24*7, sameSite: 'lax', secure: isProd })
  return res
}
