'use client'
// components/ui/toaster.tsx  +  components/ui/use-toast.ts
// Minimal self-contained toast system (no external deps)

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'

// ── Types ──────────────────────────────────────────────────────────
interface Toast {
  id:          string
  title:       string
  description?: string
  variant?:    'default' | 'destructive'
}

interface ToastContextType {
  toast: (opts: Omit<Toast, 'id'>) => void
}

// ── Context ────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType>({ toast: () => {} })

// ── Provider + Renderer ────────────────────────────────────────────
export function Toaster({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...opts, id }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {typeof window !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
        }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              background: t.variant === 'destructive' ? 'var(--rose-dim)' : 'var(--bg-raised)',
              border: `1px solid ${t.variant === 'destructive' ? 'var(--rose-ring)' : 'var(--border-hi)'}`,
              borderRadius: 'var(--r-lg)',
              padding: '12px 16px',
              minWidth: 240, maxWidth: 320,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              animation: 'toastIn 0.2s ease both',
              pointerEvents: 'auto',
            }}>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: t.variant === 'destructive' ? 'var(--rose)' : 'var(--text-primary)',
                marginBottom: t.description ? 4 : 0,
              }}>
                {t.title}
              </div>
              {t.description && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {t.description}
                </div>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────
export function useToast() {
  return useContext(ToastContext)
}
