'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { icon: '◈',  label: 'Overview',       href: '/dashboard/admin/overview' },
  { icon: '🪪', label: 'Biometrics Hub', href: '/dashboard/admin/biometrics-hub' },
  { icon: '🚪', label: 'Pass Tracker',   href: '/dashboard/admin/pass-tracker' },
  { icon: '📋', label: 'Move-Out Audit', href: '/dashboard/admin/move-out-audit' },
  { icon: '📥', label: 'Applications',   href: '/dashboard/admin/applications' },
  { icon: '🏠', label: 'Room Mgmt',      href: '/dashboard/admin/room-management' },
  { icon: '👥', label: 'Students',       href: '/dashboard/admin/students' },
  { icon: '⚖️', label: 'Disciplinary',  href: '/dashboard/admin/disciplinary' },
]

export default function AdminSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside style={{ width: 220, minWidth: 220, height: '100vh', background: '#111113', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 50 }}>
      <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>CH</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa' }}>Corridor Hill</div>
          <div style={{ fontSize: 9, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Portal</div>
        </div>
      </div>
      <nav style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, marginBottom: 2, background: active ? '#1f1f23' : 'transparent', color: active ? '#fafafa' : '#a1a1aa', fontSize: 12, fontWeight: 500, border: `1px solid ${active ? 'rgba(255,255,255,0.1)' : 'transparent'}` }}>
                <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ padding: '8px 10px', borderRadius: 8, background: '#1f1f23', marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: 10, color: '#71717a' }}>Administrator</div>
        </div>
        <button onClick={signOut} style={{ width: '100%', padding: '7px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a', fontSize: 11, cursor: 'pointer' }}>Sign Out</button>
      </div>
    </aside>
  )
}
