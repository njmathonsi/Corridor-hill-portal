// app/dashboard/student/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentSidebar from '@/components/layout/StudentSidebar'
import Topbar from '@/components/layout/Topbar'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, student_number, role')
    .eq('id', session.user.id)
    .single()

  if (!profile) redirect('/auth/login')
  if (profile.role === 'admin') redirect('/dashboard/admin/overview')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <StudentSidebar
        studentName={profile.full_name}
        studentNumber={profile.student_number ?? '—'}
      />
      <div style={{
        marginLeft: 'var(--sidebar-w)', flex: 1,
        display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      }}>
        <Topbar role="student" />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
