import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseIdToken } from '@/lib/auth'
import { signToken } from '@/lib/auth'
import { getDBAsync, updateDBAsync } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { idToken, role } = body
  if (!idToken || typeof idToken !== 'string') return NextResponse.json({ error: 'idToken required' }, { status: 400 })
  const fbUser = await verifyFirebaseIdToken(idToken)
  if (!fbUser || !fbUser.email) return NextResponse.json({ error: 'Invalid Firebase token' }, { status: 401 })

  const email = fbUser.email.toLowerCase()
  const name = fbUser.name || email.split('@')[0]
  const requestedRole = typeof role === 'string' ? role : 'customer'
  const allowedSelfRoles = ['customer','organiser']
  if (requestedRole === 'admin') return NextResponse.json({ error: 'Admin requires existing admin' }, { status: 403 })
  const userRole = allowedSelfRoles.includes(requestedRole) ? requestedRole : 'customer'

  let user: any = null
  const db = await getDBAsync()
  user = db.users.find(u=> u.email.toLowerCase()===email)
  if (!user) {
    // create user in our DB linked to Firebase uid
    await updateDBAsync(async (db2) => {
      const existing = db2.users.find(u=> u.email.toLowerCase()===email)
      if (existing) { user = existing; return }
      const newUser = {
        id: uuid(),
        email,
        name,
        passwordHash: '', // Firebase managed
        role: userRole as any,
        createdAt: new Date().toISOString(),
        firebaseUid: fbUser.uid,
      } as any
      db2.users.push(newUser)
      user = newUser
    })
  }
  const token = signToken(user)
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  const isProd = process.env.NODE_ENV === 'production'
  res.cookies.set('curtain_token', token, { httpOnly: true, path: '/', maxAge: 60*60*24*7, sameSite: 'lax', secure: isProd })
  return res
}
