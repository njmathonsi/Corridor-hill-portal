import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/ui/SignOutButton'
import { SidebarLineNav } from '@/components/effects/SidebarLineNav'
import Logo from '@/components/ui/Logo'
import PageTransition from '@/components/ui/PageTransition'
import MobileShell from '@/components/ui/MobileShell'
import { LayoutDashboard, Inbox, User, FileText, ScrollText, Home, DoorOpen, Contact, Scale } from 'lucide-react'

const ICON_CLASS = 'w-5 h-5 text-white/70 group-hover:text-white transition-colors'

const NAV = [
  { icon: <LayoutDashboard className={ICON_CLASS} />, label: 'Dashboard',       href: '/dashboard/student/home' },
  { icon: <Inbox className={ICON_CLASS} />,           label: 'Apply',           href: '/dashboard/student/apply' },
  { icon: <User className={ICON_CLASS} />,            label: 'My Profile',      href: '/dashboard/student/onboarding/step-1' },
  { icon: <FileText className={ICON_CLASS} />,        label: 'My Documents',    href: '/dashboard/student/documents' },
  { icon: <ScrollText className={ICON_CLASS} />,      label: 'Code of Conduct', href: '/dashboard/student/onboarding/step-4' },
  { icon: <Home className={ICON_CLASS} />,            label: 'My Room',         href: '/dashboard/student/my-room' },
  { icon: <DoorOpen className={ICON_CLASS} />,        label: 'My Passes',       href: '/dashboard/student/my-passes' },
  { icon: <Contact className={ICON_CLASS} />,         label: 'Biometrics',      href: '/dashboard/student/my-biometrics' },
  { icon: <Scale className={ICON_CLASS} />,           label: 'Conduct',         href: '/dashboard/student/my-conduct' },
]

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, student_number, role')
    .eq('id', session.user.id)
    .single()
  if (profile?.role === 'admin') redirect('/dashboard/admin/overview')

  return (
    <MobileShell
      sidebar={
        <aside className="glass-sidebar" style={{ width: 220, minWidth: 220, height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 50 }}>
          <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Logo size={24} /></div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa' }}>Corridor Hill</div>
              <div style={{ fontSize: 9, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student Portal</div>
            </div>
          </div>

          {/* Sidebar nav logic/animation UNCHANGED — only the container wrapper became glass */}
          <nav style={{ padding: '10px 16px', flex: 1, overflowY: 'auto' }}>
            <SidebarLineNav items={NAV} />
          </nav>

          <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="glass-card" style={{ padding: '8px 10px', marginBottom: 8, animation: 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || 'Student'}</div>
              <div style={{ fontSize: 10, color: '#a1a1aa', fontFamily: 'monospace' }}>{profile?.student_number ?? '—'}</div>
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
