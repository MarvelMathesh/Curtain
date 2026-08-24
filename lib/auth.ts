import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { User, Role } from './types'
import { getDB } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'curtain_dev_secret_2026'
const JWT_EXPIRES = '7d'

export function hashPassword(pw: string) { return bcrypt.hashSync(pw, 10) }
export function verifyPassword(pw: string, hash: string) { return bcrypt.compareSync(pw, hash) }

export function signToken(user: User) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token: string): { id:string; email:string; role:Role; name:string } | null {
  try { return jwt.verify(token, JWT_SECRET) as any } catch { return null }
}

export function getUserFromToken(token?: string): User | null {
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  return getDB().users.find(u=> u.id===payload.id) || null
}

export function getTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get('cookie') || ''
  const m = cookie.match(/(?:^|;\s*)curtain_token=([^;]+)/)
  if (m) return decodeURIComponent(m[1])
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}
