import { NextRequest, NextResponse } from 'next/server'
import { updateDBAsync } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { v4 as uuid } from 'uuid'

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) }

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { name, email, password, role } = body
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) return NextResponse.json({ error: 'Name must be 2-80 chars' }, { status: 400 })
  if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) return NextResponse.json({ error: 'Password 8-128 chars' }, { status: 400 })
  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim().slice(0,80)
  // Only customer/organiser self-register; admin must be created by existing admin
  const allowedSelfRoles: string[] = ['customer', 'organiser']
  const requestedRole = typeof role === 'string' ? role : 'customer'
  if (requestedRole === 'admin') return NextResponse.json({ error: 'Admin creation requires an existing admin' }, { status: 403 })
  const userRole = allowedSelfRoles.includes(requestedRole) ? requestedRole : 'customer'

  let createdUser: any = null
  let error: string | null = null
  await updateDBAsync(async (db) => {
    if (db.users.find(u => u.email.toLowerCase() === cleanEmail)) { error = 'Email already exists'; return }
    const user = {
      id: uuid(),
      name: cleanName,
      email: cleanEmail,
      passwordHash: await hashPassword(password),
      role: userRole as any,
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    createdUser = user
  })
  if (error) return NextResponse.json({ error }, { status: 400 })
  const token = signToken(createdUser)
  const res = NextResponse.json({ user: { id: createdUser.id, name: createdUser.name, email: createdUser.email, role: createdUser.role } })
  const isProd = process.env.NODE_ENV === 'production'
  res.cookies.set('curtain_token', token, { httpOnly: true, path: '/', maxAge: 60*60*24*7, sameSite: 'lax', secure: isProd })
  return res
}
