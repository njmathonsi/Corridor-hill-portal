import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/ui/SignOutButton'
import { SidebarLineNav } from '@/components/effects/SidebarLineNav'

const NAV = [
  { icon: '◈',  label: 'Overview',        href: '/dashboard/admin/overview' },
  { icon: '🪪', label: 'Biometrics Hub',  href: '/dashboard/admin/biometrics-hub' },
  { icon: '🚪', label: 'Pass Tracker',    href: '/dashboard/admin/pass-tracker' },
  { icon: '📋', label: 'Move-Out Audit',  href: '/dashboard/admin/move-out-audit' },
  { icon: '📥', label: 'Applications',    href: '/dashboard/admin/applications' },
  { icon: '🗂️', label: 'Documents',      href: '/dashboard/admin/documents' },
  { icon: '🏠', label: 'Room Mgmt',       href: '/dashboard/admin/room-management' },
  { icon: '👥', label: 'Students',        href: '/dashboard/admin/students' },
  { icon: '⚖️', label: 'Disciplinary',   href: '/dashboard/admin/disciplinary' },
  { icon: '➕', label: 'Create Account',  href: '/dashboard/admin/create-account' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('full_name, role, email').eq('id', session.user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/student/home')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside className="glass-sidebar" style={{ width: 220, minWidth: 220, height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 50 }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(160deg,#2E4FCC,#6C2BD9,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>CH</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa' }}>Corridor Hill</div>
            <div style={{ fontSize: 9, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Portal</div>
          </div>
        </div>

        {/* Sidebar nav logic/animation UNCHANGED — only the container wrapper became glass */}
        <nav style={{ padding: '10px 16px', flex: 1, overflowY: 'auto' }}>
          <SidebarLineNav items={NAV} />
        </nav>

        <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="glass-card" style={{ padding: '8px 10px', marginBottom: 8, animation: 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name ?? 'Admin'}</div>
            <div style={{ fontSize: 10, color: '#a1a1aa' }}>Administrator</div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <div style={{ marginLeft: 220, flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
