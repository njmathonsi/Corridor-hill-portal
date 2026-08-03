'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export default function MobileShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="mobile-menu-btn glass-btn"
        aria-label="Toggle menu"
        style={{ display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 60, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
      >
        {open ? <X className="w-5 h-5 text-white/70" /> : <Menu className="w-5 h-5 text-white/70" />}
      </button>

      {open && <div className="mobile-backdrop" onClick={() => setOpen(false)} />}

      <div className={`app-sidebar-wrap${open ? ' sidebar-open' : ''}`}>
        {sidebar}
      </div>

      <div className="app-main-content" style={{ marginLeft: 220, flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
