// app/dashboard/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/layout/AdminSidebar'
import Topbar from '@/components/layout/Topbar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, email')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard/student/home')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <AdminSidebar adminName={profile.full_name} adminEmail={profile.email} />
      <div style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}>
        <Topbar role="admin" />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
