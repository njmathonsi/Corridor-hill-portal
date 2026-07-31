import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function OverviewPage() {
  const supabase = createClient()
  const [
    { count: totalStudents },
    { count: checkedIn },
    { count: pendingApps },
    { count: bioPending },
    { count: outsideNow },
    { data: recentApps },
    { data: recentOffences },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('leases').select('*', { count: 'exact', head: true }).eq('lease_status', 'Checked-In').eq('is_active', true),
    supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
    supabase.from('biometric_registrations').select('*', { count: 'exact', head: true }).eq('biometric_registered', false),
    supabase.from('active_passes').select('*', { count: 'exact', head: true }).eq('direction', 'exit'),
    supabase.from('applications').select('id, status, submitted_at, profiles!applications_student_id_fkey(full_name, student_number, faculty)').in('status', ['submitted','under_review']).order('submitted_at', { ascending: false }).limit(5),
    supabase.from('offences_log').select('id, incident_date, fine_amount_applied, offence_definitions(offence_name), profiles!offences_log_student_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
  ])

  const tiles = [
    { label: 'Total Students',       value: totalStudents ?? 0, color: '#fafafa',  href: '/dashboard/admin/students' },
    { label: 'Checked In',           value: checkedIn ?? 0,     color: '#10b981',  href: '/dashboard/admin/room-management' },
    { label: 'Pending Applications', value: pendingApps ?? 0,   color: '#3b82f6',  href: '/dashboard/admin/applications' },
    { label: 'Biometrics Pending',   value: bioPending ?? 0,    color: '#f59e0b',  href: '/dashboard/admin/biometrics-hub' },
    { label: 'Currently Outside',    value: outsideNow ?? 0,    color: outsideNow ?? 0 > 0 ? '#f43f5e' : '#fafafa', href: '/dashboard/admin/pass-tracker' },
  ]

  const modules = [
    { icon: '🪪', label: 'Biometrics Hub',  href: '/dashboard/admin/biometrics-hub',  desc: 'Register and verify student biometrics' },
    { icon: '🚪', label: 'Pass Tracker',    href: '/dashboard/admin/pass-tracker',    desc: 'Track building entries and exits' },
    { icon: '📋', label: 'Move-Out Audit',  href: '/dashboard/admin/move-out-audit',  desc: 'Room inspections and damage reports' },
    { icon: '📥', label: 'Applications',    href: '/dashboard/admin/applications',    desc: 'Review and approve applications' },
    { icon: '🏠', label: 'Room Management', href: '/dashboard/admin/room-management', desc: 'Assign rooms and manage occupancy' },
    { icon: '⚖️', label: 'Disciplinary',   href: '/dashboard/admin/disciplinary',    desc: 'Log offences and manage conduct' },
    { icon: '👥', label: 'Students',        href: '/dashboard/admin/students',        desc: 'Manage all student accounts' },
  ]

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Operations Overview</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Corridor Hill Residence · eMalahleni · Live Dashboard</p>

      {/* KPI tiles */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {tiles.map(t => (
          <Link key={t.label} href={t.href} style={{ flex: 1, minWidth: 140, textDecoration: 'none' }}>
            <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: t.color, letterSpacing: '-0.03em' }}>{t.value}</div>
              <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Recent applications */}
        <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Recent Applications</div>
            <Link href="/dashboard/admin/applications" style={{ fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>View all →</Link>
          </div>
          {(recentApps ?? []).length === 0 ? (
            <div style={{ color: '#52525b', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No pending applications.</div>
          ) : (recentApps ?? []).map((app: any) => (
            <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fafafa' }}>{app.profiles?.full_name ?? '—'}</div>
                <div style={{ fontSize: 10, color: '#71717a' }}>{app.profiles?.faculty ?? '—'} · {app.profiles?.student_number ?? '—'}</div>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: app.status === 'submitted' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: app.status === 'submitted' ? '#3b82f6' : '#f59e0b', border: `1px solid ${app.status === 'submitted' ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                {app.status.replace('_',' ')}
              </span>
            </div>
          ))}
        </div>

        {/* Recent offences */}
        <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Recent Offences</div>
            <Link href="/dashboard/admin/disciplinary" style={{ fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>View all →</Link>
          </div>
          {(recentOffences ?? []).length === 0 ? (
            <div style={{ color: '#52525b', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No offences recorded.</div>
          ) : (recentOffences ?? []).map((o: any) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fafafa' }}>{o.profiles?.full_name ?? '—'}</div>
                <div style={{ fontSize: 10, color: '#71717a' }}>{o.offence_definitions?.offence_name ?? '—'} · {new Date(o.incident_date).toLocaleDateString('en-ZA')}</div>
              </div>
              {Number(o.fine_amount_applied) > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>R {Number(o.fine_amount_applied).toFixed(2)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Module grid */}
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', marginBottom: 12 }}>Quick Access</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {modules.map(m => (
          <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', height: '100%' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa', marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.4 }}>{m.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
