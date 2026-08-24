import { NextResponse } from 'next/server'
export async function POST() {
  const res = NextResponse.json({ ok: true })
  const isProd = process.env.NODE_ENV === 'production'
  res.cookies.set('curtain_token', '', { httpOnly: true, path: '/', maxAge: 0, sameSite: 'lax', secure: isProd })
  return res
}
