import { createClient } from '@/lib/supabase/server'

export default async function PassTrackerPage() {
  const supabase = createClient()
  const { data: passes } = await supabase.from('active_passes').select('*')
  const out = (passes ?? []).filter((p: any) => p.pass_status === 'out').length
  const overdue = (passes ?? []).filter((p: any) => p.pass_status === 'overdue').length

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Pass Tracker</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Live building manifest · Log student departures and returns</p>

      {overdue > 0 && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', fontSize: 13, fontWeight: 600 }}>
          ⚠️ {overdue} student{overdue > 1 ? 's' : ''} overdue for return
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Currently Outside', value: out, color: '#f59e0b' },
          { label: 'Overdue', value: overdue, color: '#f43f5e' },
          { label: 'Total Active Passes', value: passes?.length ?? 0, color: '#fafafa' },
        ].map(t => (
          <div key={t.label} style={{ flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: t.color }}>{t.value}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Student', 'Departed', 'Expected Return', 'Destination', 'Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(passes ?? []).length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>No students currently outside the building.</td></tr>
            ) : (passes ?? []).map((p: any) => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: p.pass_status === 'overdue' ? 'rgba(244,63,94,0.04)' : 'transparent' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.full_name}</td>
                <td style={{ padding: '12px 16px', color: '#71717a', fontFamily: 'monospace', fontSize: 11 }}>{new Date(p.transit_at).toLocaleString('en-ZA')}</td>
                <td style={{ padding: '12px 16px', color: p.pass_status === 'overdue' ? '#f43f5e' : '#71717a', fontFamily: 'monospace', fontSize: 11 }}>{p.expected_return ? new Date(p.expected_return).toLocaleString('en-ZA') : '—'}</td>
                <td style={{ padding: '12px 16px', color: '#a1a1aa' }}>{p.destination ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: p.pass_status === 'overdue' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)', color: p.pass_status === 'overdue' ? '#f43f5e' : '#f59e0b', border: `1px solid ${p.pass_status === 'overdue' ? 'rgba(244,63,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                    {p.pass_status === 'overdue' ? '⚠ Overdue' : '→ Out'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
