import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import { Contact, DoorOpen, ClipboardList, Inbox, Home, Scale, Users } from 'lucide-react'

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
    { label: 'Biometrics Pending',   value: bioPending ?? 0,    color: 'var(--brand)',  href: '/dashboard/admin/biometrics-hub' },
    { label: 'Currently Outside',    value: outsideNow ?? 0,    color: (outsideNow ?? 0) > 0 ? '#f43f5e' : '#fafafa', href: '/dashboard/admin/pass-tracker' },
  ]

  const ICON_CLASS = 'w-5 h-5 text-white/70 group-hover:text-white transition-colors'
  const modules = [
    { icon: <Contact className={ICON_CLASS} />,      label: 'Biometrics Hub',  href: '/dashboard/admin/biometrics-hub',  desc: 'Register and verify student biometrics' },
    { icon: <DoorOpen className={ICON_CLASS} />,     label: 'Pass Tracker',    href: '/dashboard/admin/pass-tracker',    desc: 'Track building entries and exits' },
    { icon: <ClipboardList className={ICON_CLASS} />, label: 'Move-Out Audit',  href: '/dashboard/admin/move-out-audit',  desc: 'Room inspections and damage reports' },
    { icon: <Inbox className={ICON_CLASS} />,        label: 'Applications',    href: '/dashboard/admin/applications',    desc: 'Review and approve applications' },
    { icon: <Home className={ICON_CLASS} />,         label: 'Room Management', href: '/dashboard/admin/room-management', desc: 'Assign rooms and manage occupancy' },
    { icon: <Scale className={ICON_CLASS} />,        label: 'Disciplinary',   href: '/dashboard/admin/disciplinary',    desc: 'Log offences and manage conduct' },
    { icon: <Users className={ICON_CLASS} />,        label: 'Students',        href: '/dashboard/admin/students',        desc: 'Manage all student accounts' },
  ]

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#fafafa' }}>Operations Overview</h1>
      <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 24 }}>TENTSARI Residence · eMalahleni · Live Dashboard</p>

      {/* KPI tiles — glass, staggered pop-in */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {tiles.map((t, i) => (
          <Link key={t.label} href={t.href} style={{ flex: 1, minWidth: 140, textDecoration: 'none' }}>
            <div className="glass-card" style={{ padding: '14px 18px', ['--stagger' as any]: i }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: t.color, letterSpacing: '-0.03em' }}><AnimatedNumber value={t.value} /></div>
              <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Recent applications */}
        <div className="glass-card" style={{ padding: 18, ['--stagger' as any]: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>Recent Applications</div>
            <Link href="/dashboard/admin/applications" style={{ fontSize: 11, color: '#93c5fd', textDecoration: 'none' }}>View all →</Link>
          </div>
          {(recentApps ?? []).length === 0 ? (
            <div style={{ color: '#71717a', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No pending applications.</div>
          ) : (recentApps ?? []).map((app: any) => (
            <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fafafa' }}>{app.profiles?.full_name ?? '—'}</div>
                <div style={{ fontSize: 10, color: '#a1a1aa' }}>{app.profiles?.faculty ?? '—'} · {app.profiles?.student_number ?? '—'}</div>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: app.status === 'submitted' ? 'rgba(59,130,246,0.2)' : 'rgb(var(--brand-rgb) / 0.2)', color: app.status === 'submitted' ? '#93c5fd' : 'var(--brand-hi)', border: `1px solid ${app.status === 'submitted' ? 'rgba(59,130,246,0.4)' : 'rgb(var(--brand-rgb) / 0.4)'}` }}>
                {app.status.replace('_',' ')}
              </span>
            </div>
          ))}
        </div>

        {/* Recent offences */}
        <div className="glass-card" style={{ padding: 18, ['--stagger' as any]: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>Recent Offences</div>
            <Link href="/dashboard/admin/disciplinary" style={{ fontSize: 11, color: '#93c5fd', textDecoration: 'none' }}>View all →</Link>
          </div>
          {(recentOffences ?? []).length === 0 ? (
            <div style={{ color: '#71717a', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No offences recorded.</div>
          ) : (recentOffences ?? []).map((o: any) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fafafa' }}>{o.profiles?.full_name ?? '—'}</div>
                <div style={{ fontSize: 10, color: '#a1a1aa' }}>{o.offence_definitions?.offence_name ?? '—'} · {new Date(o.incident_date).toLocaleDateString('en-ZA')}</div>
              </div>
              {Number(o.fine_amount_applied) > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-hi)', fontFamily: 'monospace' }}>R {Number(o.fine_amount_applied).toFixed(2)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Module grid — glass buttons */}
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a1a1aa', marginBottom: 12 }}>Quick Access</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {modules.map((m, i) => (
          <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
            <div className="glass-btn glass-card group" style={{ padding: '14px 16px', height: '100%', ['--stagger' as any]: i + 7, borderRadius: 12 }}>
              <div style={{ marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa', marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#a1a1aa', lineHeight: 1.4 }}>{m.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
