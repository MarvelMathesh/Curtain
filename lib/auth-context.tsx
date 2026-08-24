'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

type User = { id:string; name:string; email:string; role:'admin'|'organiser'|'customer' }
type AuthState = { user:User|null; loading:boolean; login:(email:string,password:string)=>Promise<void>; register:(name:string,email:string,password:string,role:string)=>Promise<void>; logout:()=>Promise<void>; refresh:()=>Promise<void> }

const Ctx = createContext<AuthState>(null as any)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User|null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async ()=>{
    try{
      const r = await fetch('/api/auth/me', { credentials:'include' })
      const j = await r.json()
      setUser(j.user)
    } finally { setLoading(false) }
  }
  useEffect(()=>{ refresh() }, [])

  const login = async (email:string,password:string)=>{
    // Try Firebase first if available, then fallback to mock
    try {
      const { auth } = await import('@/lib/firebase')
      if (auth) {
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        const cred = await signInWithEmailAndPassword(auth, email, password)
        const idToken = await cred.user.getIdToken()
        const r2 = await fetch('/api/auth/firebase', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ idToken }), credentials:'include' })
        const j2 = await r2.json()
        if (r2.ok) { setUser(j2.user); return }
        // fallback to mock if Firebase user not in our DB or error
      }
    } catch {}
    const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email,password }), credentials:'include' })
    const j = await r.json()
    if(!r.ok) throw new Error(j.error || 'Login failed')
    setUser(j.user)
  }
  const register = async (name:string,email:string,password:string,role:string)=>{
    // Try Firebase create first
    try {
      const { auth } = await import('@/lib/firebase')
      if (auth) {
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name) try { await updateProfile(cred.user, { displayName: name }) } catch {}
        const idToken = await cred.user.getIdToken()
        const r2 = await fetch('/api/auth/firebase', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ idToken, role }), credentials:'include' })
        const j2 = await r2.json()
        if (r2.ok) { setUser(j2.user); return }
      }
    } catch {}
    const r = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name,email,password,role }), credentials:'include' })
    const j = await r.json()
    if(!r.ok) throw new Error(j.error || 'Register failed')
    setUser(j.user)
  }
  const logout = async ()=>{
    try {
      const { auth } = await import('@/lib/firebase')
      if (auth) {
        const { signOut } = await import('firebase/auth')
        await signOut(auth)
      }
    } catch {}
    await fetch('/api/auth/logout', { method:'POST', credentials:'include' })
    setUser(null)
  }
  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>
}
export function useAuth(){ return useContext(Ctx) }
