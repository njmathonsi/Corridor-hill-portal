import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { icon: '◈',  label: 'Dashboard',   href: '/dashboard/student/home' },
  { icon: '🏠', label: 'My Room',     href: '/dashboard/student/my-room' },
  { icon: '🚪', label: 'My Passes',   href: '/dashboard/student/my-passes' },
  { icon: '🪪', label: 'Biometrics',  href: '/dashboard/student/my-biometrics' },
  { icon: '⚖️', label: 'Conduct',    href: '/dashboard/student/my-conduct' },
]

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('full_name, student_number, role').eq('id', session.user.id).single()
  if (profile?.role === 'admin') redirect('/dashboard/admin/overview')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#09090b' }}>
      <aside style={{ width: 220, minWidth: 220, height: '100vh', background: '#111113', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 50 }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>CH</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa' }}>Corridor Hill</div>
            <div style={{ fontSize: 9, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student Portal</div>
          </div>
        </div>
        <nav style={{ padding: '10px 8px', flex: 1 }}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, marginBottom: 2, color: '#a1a1aa', fontSize: 12, fontWeight: 500 }}>
                <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ padding: '8px 10px', borderRadius: 8, background: '#1f1f23' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name}</div>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>{profile?.student_number ?? '—'}</div>
          </div>
        </div>
      </aside>
      <div style={{ marginLeft: 220, flex: 1, overflowY: 'auto', background: '#09090b' }}>
        {children}
      </div>
    </div>
  )
}
