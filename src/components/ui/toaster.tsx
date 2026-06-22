'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Toast { id: string; title: string; description?: string; variant?: 'default' | 'destructive' }
interface ToastCtx { toast: (opts: Omit<Toast, 'id'>) => void }
const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function Toaster({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(p => [...p, { ...opts, id }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.variant === 'destructive' ? '#18181b' : '#18181b',
            border: `1px solid ${t.variant === 'destructive' ? 'rgba(244,63,94,0.4)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 12, padding: '12px 16px', minWidth: 260, maxWidth: 340,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.variant === 'destructive' ? '#f43f5e' : '#fafafa', marginBottom: t.description ? 4 : 0 }}>{t.title}</div>
            {t.description && <div style={{ fontSize: 12, color: '#a1a1aa' }}>{t.description}</div>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
export function useToast() { return useContext(Ctx) }
