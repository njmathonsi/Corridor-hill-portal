import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('full_name, role, email').eq('id', session.user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/student/home')
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#09090b' }}>
      <AdminSidebar name={profile.full_name ?? 'Admin'} email={profile.email ?? ''} />
      <div style={{ marginLeft: 220, flex: 1, overflowY: 'auto', background: '#09090b' }}>
        {children}
      </div>
    </div>
  )
}
