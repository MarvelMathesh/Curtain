'use client'
import * as React from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type Toast = { id: string; title?: string; description?: string; variant?: 'default' | 'success' | 'error' }

const ToastContext = React.createContext<{ toasts: Toast[]; add: (t: Omit<Toast,'id'>)=>void; remove:(id:string)=>void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, set] = React.useState<Toast[]>([])
  const add = React.useCallback((t: Omit<Toast,'id'>) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => [...s, { ...t, id }])
    setTimeout(() => set((s) => s.filter((x) => x.id !== id)), 3500)
  }, [])
  const remove = React.useCallback((id:string)=> set(s=> s.filter(x=>x.id!==id)), [])
  return <ToastContext.Provider value={{ toasts, add, remove }}>{children}
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[360px] max-w-[90vw]">
      {toasts.map(t=> (
        <div key={t.id} className={cn('rounded-xl border bg-card p-4 shadow-lg flex gap-3 items-start', t.variant==='success'&&'border-green-500/30 bg-green-50 dark:bg-green-950/30', t.variant==='error'&&'border-destructive/30 bg-destructive/10')}>
          {t.variant==='success'? <CheckCircle className="size-5 text-green-600 mt-0.5"/> : t.variant==='error'? <AlertCircle className="size-5 text-destructive mt-0.5"/> : <Info className="size-5 text-primary mt-0.5"/>}
          <div className="flex-1">
            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
            {t.description && <div className="text-sm text-muted-foreground">{t.description}</div>}
          </div>
          <button onClick={()=>remove(t.id)} className="text-muted-foreground hover:text-foreground"><X className="size-4"/></button>
        </div>
      ))}
    </div>
  </ToastContext.Provider>
}
export function useToast(){
  const ctx = React.useContext(ToastContext)
  if(!ctx) throw new Error('useToast outside provider')
  return ctx
}
