import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/ui/SignOutButton'
import { SidebarLineNav } from '@/components/effects/SidebarLineNav'
import Logo from '@/components/ui/Logo'
import PageTransition from '@/components/ui/PageTransition'
import MobileShell from '@/components/ui/MobileShell'
import { Wrench } from 'lucide-react'

const ICON_CLASS = 'w-5 h-5 text-white/70 group-hover:text-white transition-colors'

const NAV = [
  { icon: <Wrench className={ICON_CLASS} />, label: 'Ticket Board', href: '/dashboard/maintenance' },
]

export default async function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', session.user.id).single()
  if (profile?.role !== 'maintenance') redirect(profile?.role === 'admin' ? '/dashboard/admin/overview' : '/dashboard/student/home')

  return (
    <MobileShell
      sidebar={
        <aside className="glass-sidebar" style={{ width: 220, minWidth: 220, height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 50 }}>
          <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Logo size={24} /></div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa' }}>TENTSARI</div>
              <div style={{ fontSize: 9, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Maintenance</div>
            </div>
          </div>

          <nav style={{ padding: '10px 16px', flex: 1, overflowY: 'auto' }}>
            <SidebarLineNav items={NAV} />
          </nav>

          <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="glass-card" style={{ padding: '8px 10px', marginBottom: 8, animation: 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name ?? 'Maintenance'}</div>
              <div style={{ fontSize: 10, color: '#a1a1aa' }}>Maintenance Staff</div>
            </div>
            <SignOutButton />
          </div>
        </aside>
      }
    >
      <PageTransition>{children}</PageTransition>
    </MobileShell>
  )
}
