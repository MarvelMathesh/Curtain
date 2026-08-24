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
    const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email,password }), credentials:'include' })
    const j = await r.json()
    if(!r.ok) throw new Error(j.error || 'Login failed')
    setUser(j.user)
  }
  const register = async (name:string,email:string,password:string,role:string)=>{
    const r = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name,email,password,role }), credentials:'include' })
    const j = await r.json()
    if(!r.ok) throw new Error(j.error || 'Register failed')
    setUser(j.user)
  }
  const logout = async ()=>{
    await fetch('/api/auth/logout', { method:'POST', credentials:'include' })
    setUser(null)
  }
  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>
}
export function useAuth(){ return useContext(Ctx) }
