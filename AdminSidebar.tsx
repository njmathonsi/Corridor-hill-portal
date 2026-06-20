'use client'
// components/layout/AdminSidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  icon: string
  label: string
  href: string
  badge?: string
}

const ADMIN_NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Operations',
    items: [
      { icon: '◈', label: 'Overview',         href: '/dashboard/admin/overview' },
      { icon: '🪪', label: 'Biometrics Hub',   href: '/dashboard/admin/biometrics-hub' },
      { icon: '🚪', label: 'Pass Tracker',     href: '/dashboard/admin/pass-tracker' },
      { icon: '📋', label: 'Move-Out Audit',   href: '/dashboard/admin/move-out-audit' },
    ],
  },
  {
    section: 'Management',
    items: [
      { icon: '📥', label: 'Applications',     href: '/dashboard/admin/applications' },
      { icon: '🏠', label: 'Room Management',  href: '/dashboard/admin/room-management' },
      { icon: '👥', label: 'Students',         href: '/dashboard/admin/students' },
    ],
  },
  {
    section: 'Compliance',
    items: [
      { icon: '⚖️', label: 'Disciplinary',    href: '/dashboard/admin/disciplinary' },
    ],
  },
]

interface AdminSidebarProps {
  adminName: string
  adminEmail: string
}

export default function AdminSidebar({ adminName, adminEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const initials = adminName
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-dim)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0,
      zIndex: 50,
      overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--r-md)',
          background: 'linear-gradient(135deg, var(--blue) 0%, var(--violet) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>CH</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Corridor Hill</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Admin Portal
          </div>
        </div>
      </div>

      {/* Nav sections */}
      {ADMIN_NAV.map(section => (
        <div key={section.section} style={{ padding: '12px 8px 4px' }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-disabled)',
            padding: '0 8px', marginBottom: 4,
          }}>
            {section.section}
          </div>
          {section.items.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 500,
                  marginBottom: 1,
                  border: `1px solid ${isActive ? 'var(--border-mid)' : 'transparent'}`,
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.badge && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                      background: 'var(--blue-dim)', color: 'var(--blue)',
                      padding: '2px 6px', borderRadius: 99,
                      border: '1px solid var(--blue-ring)',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ))}

      {/* Footer: admin chip + sign out */}
      <div style={{
        marginTop: 'auto', padding: '12px 8px',
        borderTop: '1px solid var(--border-dim)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 'var(--r-md)',
          background: 'var(--bg-raised)', marginBottom: 6,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ lineHeight: 1.3, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Administrator</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '7px 10px',
            borderRadius: 'var(--r-md)',
            background: 'transparent',
            border: '1px solid var(--border-dim)',
            color: 'var(--text-tertiary)',
            fontSize: 12, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
