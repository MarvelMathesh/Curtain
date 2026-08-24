import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, getUserFromTokenAsync } from '@/lib/auth'
export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const user = await getUserFromTokenAsync(token || undefined)
  if (!user) return NextResponse.json({ user: null }, { status: 200 })
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}
