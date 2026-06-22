import { createClient } from '@/lib/supabase/server'

export default async function OverviewPage() {
  const supabase = createClient()
  const [{ count: students }, { count: checkedIn }, { count: apps }, { count: bioPending }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('leases').select('*', { count: 'exact', head: true }).eq('lease_status', 'Checked-In').eq('is_active', true),
    supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
    supabase.from('biometric_registrations').select('*', { count: 'exact', head: true }).eq('biometric_registered', false),
  ])

  const tiles = [
    { label: 'Total Students', value: students ?? 0, color: '#fafafa' },
    { label: 'Checked In', value: checkedIn ?? 0, color: '#10b981' },
    { label: 'Pending Applications', value: apps ?? 0, color: '#f59e0b' },
    { label: 'Biometrics Pending', value: bioPending ?? 0, color: '#f43f5e' },
  ]

  const modules = [
    { icon: '🪪', label: 'Biometrics Hub',  href: '/dashboard/admin/biometrics-hub',  desc: 'Register and verify student biometrics' },
    { icon: '🚪', label: 'Pass Tracker',    href: '/dashboard/admin/pass-tracker',    desc: 'Track building entries and exits' },
    { icon: '📋', label: 'Move-Out Audit',  href: '/dashboard/admin/move-out-audit',  desc: 'Room inspections and PDF reports' },
    { icon: '📥', label: 'Applications',    href: '/dashboard/admin/applications',    desc: 'Review and approve applications' },
    { icon: '🏠', label: 'Room Management', href: '/dashboard/admin/room-management', desc: 'Assign rooms and manage occupancy' },
    { icon: '⚖️', label: 'Disciplinary',   href: '/dashboard/admin/disciplinary',    desc: 'Log offences and manage conduct' },
  ]

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Operations Overview</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Corridor Hill Residence · eMalahleni</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {tiles.map(t => (
          <div key={t.label} style={{ flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: t.color, letterSpacing: '-0.03em' }}>{t.value}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {modules.map(m => (
          <a key={m.href} href={m.href}>
            <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#71717a' }}>{m.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
