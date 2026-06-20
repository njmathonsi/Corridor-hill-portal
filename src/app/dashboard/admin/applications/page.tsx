// app/dashboard/admin/applications/page.tsx
import { createClient } from '@/lib/supabase/server'
import ApplicationsQueue from '@/components/applications/ApplicationsQueue'

export const revalidate = 0

export default async function ApplicationsPage() {
  const supabase = createClient()

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      academic_year,
      submitted_at,
      financial_cleared,
      financial_status,
      rejection_reason,
      proof_of_registration_url,
      id_copy_url,
      sport_achievements,
      cultural_achievements,
      leadership_roles,
      medical_conditions,
      disability_info,
      current_academic_average,
      preferred_block,
      preferred_room_type,
      admin_notes,
      reviewed_at,
      profiles!applications_student_id_fkey (
        id,
        full_name,
        student_number,
        id_number,
        email,
        phone,
        faculty,
        course,
        year_of_study,
        student_year_type,
        funding_type,
        onboarding_complete
      ),
      profiles!applications_reviewed_by_fkey (
        full_name
      )
    `)
    .order('submitted_at', { ascending: false })

  // Group by status
  const groups = {
    submitted:    (applications ?? []).filter(a => a.status === 'submitted'),
    under_review: (applications ?? []).filter(a => a.status === 'under_review'),
    approved:     (applications ?? []).filter(a => a.status === 'approved'),
    rejected:     (applications ?? []).filter(a => a.status === 'rejected'),
    draft:        (applications ?? []).filter(a => a.status === 'draft'),
  }

  return (
    <div className="animate-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Applications Queue</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            Review, approve, and manage student accommodation applications
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'New', count: groups.submitted.length,    color: 'var(--blue)' },
            { label: 'Reviewing', count: groups.under_review.length, color: 'var(--amber)' },
            { label: 'Approved',  count: groups.approved.length,    color: 'var(--emerald)' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '5px 12px', borderRadius: 'var(--r-md)',
              background: 'var(--bg-raised)', border: '1px solid var(--border-dim)',
              fontSize: 12,
            }}>
              <span style={{ fontWeight: 700, color: s.color }}>{s.count}</span>
              {' '}
              <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ApplicationsQueue groups={groups} />
    </div>
  )
}
