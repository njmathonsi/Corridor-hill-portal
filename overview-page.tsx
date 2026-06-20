// app/dashboard/admin/overview/page.tsx
import { createClient } from '@/lib/supabase/server'
import KPIGrid from '@/components/dashboard/KPIGrid'
import RecentApplications from '@/components/dashboard/RecentApplications'
import ActivePassesSummary from '@/components/dashboard/ActivePassesSummary'
import PendingBiometrics from '@/components/dashboard/PendingBiometrics'

export const revalidate = 30 // ISR: refresh every 30s

export default async function AdminOverviewPage() {
  const supabase = createClient()

  // Parallel data fetches
  const [
    { count: totalStudents },
    { count: checkedIn },
    { count: pendingApps },
    { count: bioPending },
    { data: recentApps },
    { data: activePasses },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('leases').select('*', { count: 'exact', head: true }).eq('lease_status', 'Checked-In').eq('is_active', true),
    supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
    supabase.from('biometric_registrations').select('*', { count: 'exact', head: true }).eq('biometric_registered', false),
    supabase
      .from('applications')
      .select('id, status, submitted_at, academic_year, profiles(full_name, student_number)')
      .in('status', ['submitted', 'under_review'])
      .order('submitted_at', { ascending: false })
      .limit(5),
    supabase
      .from('active_passes')
      .select('*')
      .eq('direction', 'exit')
      .limit(10),
  ])

  return (
    <div className="animate-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Operations Overview
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
          Live residence management dashboard · Corridor Hill, eMalahleni
        </p>
      </div>

      {/* KPI Strip */}
      <KPIGrid
        totalStudents={totalStudents ?? 0}
        checkedIn={checkedIn ?? 0}
        pendingApps={pendingApps ?? 0}
        bioPending={bioPending ?? 0}
      />

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
        <div style={{ gridColumn: '1 / 3' }}>
          <RecentApplications applications={recentApps ?? []} />
        </div>
        <div>
          <ActivePassesSummary passes={activePasses ?? []} />
          <div style={{ marginTop: 16 }}>
            <PendingBiometrics count={bioPending ?? 0} />
          </div>
        </div>
      </div>
    </div>
  )
}
