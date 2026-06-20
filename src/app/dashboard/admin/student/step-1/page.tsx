// ═══════════════════════════════════════════════
// app/dashboard/student/onboarding/step-1-profile/page.tsx
// ═══════════════════════════════════════════════
// FILE: step-1-profile-page.tsx
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Step1ProfileForm from '@/components/student/Step1ProfileForm'

export default async function Step1ProfilePage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="animate-page" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--blue)', marginBottom: 6 }}>
          Step 1 of 4
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Personal Details</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          This information will be used for your residency record and communications.
        </p>
      </div>
      <Step1ProfileForm profile={profile} />
    </div>
  )
}
