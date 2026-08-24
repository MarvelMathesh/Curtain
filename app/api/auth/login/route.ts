import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  const user = findUserByEmail(email)
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }
  const token = signToken(user)
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token })
  res.cookies.set('curtain_token', token, { httpOnly: true, path: '/', maxAge: 60*60*24*7, sameSite: 'lax' })
  return res
}
