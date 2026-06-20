// app/dashboard/admin/pass-tracker/page.tsx
import { createClient } from '@/lib/supabase/server'
import TransitLogForm from '@/components/pass-tracker/TransitLogForm'
import LiveManifestTable from '@/components/pass-tracker/LiveManifestTable'

export const revalidate = 0

export default async function PassTrackerPage() {
  const supabase = createClient()

  // Active passes view + full transit history
  const { data: activePasses } = await supabase
    .from('active_passes')
    .select('*')

  // Count stats
  const total = activePasses?.length ?? 0
  const out   = activePasses?.filter(p => p.pass_status === 'out').length ?? 0
  const overdue = activePasses?.filter(p => p.pass_status === 'overdue').length ?? 0
  const inBuilding = activePasses?.filter(p => p.pass_status === 'in').length ?? 0

  // All students for the log form dropdown
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, student_number')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('full_name')

  return (
    <div className="animate-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Pass Tracker
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            Log student departures · manage the live building manifest
          </p>
        </div>
        <span style={{
          display: 'inline-flex', padding: '4px 12px', borderRadius: 99,
          fontSize: 11, fontWeight: 600,
          background: 'var(--violet-dim)', color: 'var(--violet)',
          border: '1px solid var(--violet-ring)',
        }}>
          ● Admin — Secure
        </span>
      </div>

      {/* Stats strip */}
      {overdue > 0 && (
        <div style={{
          marginBottom: 16, padding: '10px 16px', borderRadius: 'var(--r-md)',
          background: 'var(--rose-dim)', border: '1px solid var(--rose-ring)',
          display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--rose)', fontSize: 13, fontWeight: 600,
        }}>
          ⚠️ {overdue} student{overdue > 1 ? 's' : ''} overdue for return — verify their whereabouts
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { val: inBuilding, label: 'In Building',     color: 'var(--emerald)' },
          { val: out,        label: 'Out of Building', color: 'var(--amber)'   },
          { val: overdue,    label: 'Overdue Return',  color: 'var(--rose)'    },
          { val: total,      label: 'Active Passes',   color: 'var(--text-primary)' },
        ].map(t => (
          <div key={t.label} style={{
            flex: 1, background: 'var(--bg-raised)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--r-md)', padding: '10px 14px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: t.color }}>{t.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* 2-column: form | manifest */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        <TransitLogForm students={students ?? []} />
        <LiveManifestTable passes={activePasses ?? []} />
      </div>
    </div>
  )
}
