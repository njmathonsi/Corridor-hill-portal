// app/auth/login/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; error?: string }
}) {
  // Already logged in? Redirect to appropriate dashboard
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_complete')
      .eq('id', session.user.id)
      .single()

    if (profile?.role === 'admin') redirect('/dashboard/admin/overview')
    if (profile?.onboarding_complete) redirect('/dashboard/student/home')
    redirect('/dashboard/student/onboarding/step-1-profile')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
      background: 'var(--bg-base)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--r-lg)', margin: '0 auto 12px',
            background: 'linear-gradient(135deg, var(--blue) 0%, var(--violet) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
          }}>CH</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Corridor Hill
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Residence Management Portal · eMalahleni
          </p>
        </div>

        {searchParams.error && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--r-md)',
            background: 'var(--rose-dim)', border: '1px solid var(--rose-ring)',
            color: 'var(--rose)', fontSize: 12, fontWeight: 500,
            marginBottom: 16, textAlign: 'center',
          }}>
            {searchParams.error === 'unauthorized'
              ? 'Access denied. Please log in.'
              : decodeURIComponent(searchParams.error)}
          </div>
        )}

        <LoginForm redirectTo={searchParams.redirectTo} />

        <p style={{ fontSize: 11, color: 'var(--text-disabled)', textAlign: 'center', marginTop: 20 }}>
          New student? Your login will be set up by residence management during intake.
        </p>
      </div>
    </div>
  )
}
