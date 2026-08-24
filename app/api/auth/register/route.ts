import { NextRequest, NextResponse } from 'next/server'
import { getDB, saveDB } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { v4 as uuid } from 'uuid'

export async function POST(req: NextRequest) {
  const { name, email, password, role } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const db = getDB()
  if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
  }
  const validRoles = ['customer', 'organiser', 'admin']
  const userRole = validRoles.includes(role) ? role : 'customer'
  const user = {
    id: uuid(),
    name,
    email,
    passwordHash: hashPassword(password),
    role: userRole as any,
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  await saveDB(db)
  const token = signToken(user)
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token })
  res.cookies.set('curtain_token', token, { httpOnly: true, path: '/', maxAge: 60*60*24*7, sameSite: 'lax' })
  return res
}
