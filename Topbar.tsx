'use client'
// components/layout/Topbar.tsx
import { usePathname } from 'next/navigation'

const CRUMB_MAP: Record<string, string> = {
  '/dashboard/admin/overview':          'Overview',
  '/dashboard/admin/biometrics-hub':    'Biometrics Hub',
  '/dashboard/admin/pass-tracker':      'Pass Tracker',
  '/dashboard/admin/move-out-audit':    'Move-Out Audit',
  '/dashboard/admin/applications':      'Applications Queue',
  '/dashboard/admin/room-management':   'Room Management',
  '/dashboard/admin/disciplinary':      'Disciplinary Matrix',
  '/dashboard/admin/students':          'Students',
  '/dashboard/student/home':            'My Dashboard',
  '/dashboard/student/my-room':         'My Room',
  '/dashboard/student/my-passes':       'My Passes',
  '/dashboard/student/my-biometrics':   'My Biometrics',
  '/dashboard/student/my-conduct':      'Conduct Record',
}

export default function Topbar({ role }: { role: 'admin' | 'student' }) {
  const pathname  = usePathname()

  // Match by prefix for nested routes
  const crumb = Object.entries(CRUMB_MAP).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'Dashboard'

  return (
    <div style={{
      height: 52, minHeight: 52,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-dim)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 12,
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-tertiary)' }}>
        <span>Corridor Hill</span>
        <span style={{ color: 'var(--text-disabled)' }}>›</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {role === 'admin' ? 'Admin' : 'Student Portal'}
        </span>
        <span style={{ color: 'var(--text-disabled)' }}>›</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{crumb}</span>
      </div>

      {/* Right side — live status */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 'var(--r-md)',
          background: 'var(--bg-raised)', border: '1px solid var(--border-dim)',
          fontSize: 11, color: 'var(--text-secondary)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--emerald)',
            boxShadow: '0 0 6px var(--emerald)',
          }} className="pulse-dot" />
          System Live
        </div>
      </div>
    </div>
  )
}
