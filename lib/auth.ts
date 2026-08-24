import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { User, Role } from './types'
import { getDB } from './db'

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s) {
    // During `next build` (collect page data) we don't want to throw and break build
    // At runtime in production, this will be caught and return 500 with clear log
    if (process.env.NODE_ENV === 'production') {
      console.error('[auth] JWT_SECRET missing in production — using fallback for build, set JWT_SECRET env at runtime')
      return 'curtain_build_fallback_not_for_runtime_' + '0'.repeat(16)
    }
    return 'curtain_dev_secret_2026_dev_only_not_for_prod'
  }
  if (s.length < 32) console.warn('[auth] JWT_SECRET should be 32+ chars')
  return s
}
const JWT_EXPIRES = '7d'

export async function hashPassword(pw: string) { return bcrypt.hash(pw, 10) }
export async function verifyPassword(pw: string, hash: string) { return bcrypt.compare(pw, hash) }
// sync variants kept for seed (blocking avoided in request path)
export function hashPasswordSync(pw: string) { return bcrypt.hashSync(pw, 10) }
export function verifyPasswordSync(pw: string, hash: string) { return bcrypt.compareSync(pw, hash) }

export function signToken(user: User) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, getJwtSecret(), { expiresIn: JWT_EXPIRES, algorithm: 'HS256' })
}

export function verifyToken(token: string): { id:string; email:string; role:Role; name:string } | null {
  try { return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as any } catch { return null }
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
  if (m) {
    try { return decodeURIComponent(m[1]) } catch { return null }
  }
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}
