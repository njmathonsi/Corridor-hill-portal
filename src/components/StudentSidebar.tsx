'use client'
// components/layout/StudentSidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STUDENT_NAV = [
  { icon: '◈', label: 'Dashboard',    href: '/dashboard/student/home' },
  { icon: '🏠', label: 'My Room',     href: '/dashboard/student/my-room' },
  { icon: '🚪', label: 'My Passes',   href: '/dashboard/student/my-passes' },
  { icon: '🪪', label: 'Biometrics',  href: '/dashboard/student/my-biometrics' },
  { icon: '⚖️', label: 'Conduct',    href: '/dashboard/student/my-conduct' },
]

interface Props {
  studentName: string
  studentNumber: string
}

export default function StudentSidebar({ studentName, studentNumber }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const initials = studentName
    .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)', minWidth: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-dim)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, zIndex: 50, overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--r-md)',
          background: 'linear-gradient(135deg, var(--emerald) 0%, var(--blue) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>CH</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Corridor Hill</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Student Portal
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '12px 8px', flex: 1 }}>
        {STUDENT_NAV.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 'var(--r-md)',
                cursor: 'pointer', marginBottom: 1,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500,
                border: `1px solid ${isActive ? 'var(--border-mid)' : 'transparent'}`,
                background: isActive ? 'var(--bg-active)' : 'transparent',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          )
        })}

        {/* Onboarding link */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-dim)' }}>
          <Link href="/dashboard/student/onboarding/step-1-profile" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
              border: '1px solid var(--border-dim)', background: 'var(--bg-raised)',
            }}>
              <span>📋</span> Onboarding Steps
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--r-md)', background: 'var(--bg-raised)', marginBottom: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ lineHeight: 1.3, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{studentName}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace' }}>{studentNumber}</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '7px 10px', borderRadius: 'var(--r-md)',
          background: 'transparent', border: '1px solid var(--border-dim)',
          color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer',
        }}>Sign Out</button>
      </div>
    </aside>
  )
}
