import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DisciplinaryPage() {
  const supabase = createClient()
  const { data: summary } = await supabase.from('student_discipline_summary').select('*').order('total_offences', { ascending: false })
  const { data: recent } = await supabase
    .from('offences_log')
    .select('id, incident_date, applied_outcome, fine_amount_applied, three_concurrent_flag, offence_definitions(offence_name), profiles!offences_log_student_id_fkey(full_name, student_number)')
    .order('created_at', { ascending: false }).limit(10)

  const totalFines = (summary ?? []).reduce((s, r) => s + Number(r.total_fines_applied ?? 0), 0)
  const flagged = (summary ?? []).filter(s => s.has_concurrent_flag || s.has_police_referral).length

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Disciplinary Matrix</h1>
          <p style={{ fontSize: 13, color: '#71717a' }}>Code of Conduct enforcement · Offence tracking · Escalation management</p>
        </div>
        <Link href="/dashboard/admin/disciplinary/log">
          <button style={{ padding: '8px 18px', borderRadius: 8, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Log Offence</button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Offences', value: (summary ?? []).reduce((s, r) => s + Number(r.total_offences ?? 0), 0), color: '#fafafa' },
          { label: 'Total Fines', value: `R ${totalFines.toFixed(2)}`, color: '#f59e0b' },
          { label: 'Escalation Flags', value: flagged, color: '#f43f5e' },
        ].map(t => (
          <div key={t.label} style={{ flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}>{t.value}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Student', 'Offences', 'Fines', 'Last Incident', 'Flags'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(summary ?? []).map((s: any) => (
                <tr key={s.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#fafafa' }}>{s.full_name}</div>
                    <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>{s.student_number}</div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 16, fontWeight: 800, color: Number(s.total_offences) > 3 ? '#f43f5e' : Number(s.total_offences) > 0 ? '#f59e0b' : '#10b981' }}>{s.total_offences ?? 0}</td>
                  <td style={{ padding: '12px 16px', color: '#f59e0b', fontFamily: 'monospace', fontSize: 11 }}>R {Number(s.total_fines_applied ?? 0).toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', color: '#71717a', fontFamily: 'monospace', fontSize: 11 }}>{s.last_incident_date ? new Date(s.last_incident_date).toLocaleDateString('en-ZA') : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {s.has_concurrent_flag && <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', marginRight: 4 }}>3-Rule</span>}
                    {s.has_police_referral && <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}>Police</span>}
                    {!s.has_concurrent_flag && !s.has_police_referral && <span style={{ color: '#52525b', fontSize: 11 }}>—</span>}
                  </td>
                </tr>
              ))}
              {(summary ?? []).length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>No offences recorded.</td></tr>}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent Offences</div>
          {(recent ?? []).length === 0 ? (
            <div style={{ color: '#52525b', fontSize: 12, textAlign: 'center', padding: 20 }}>No recent offences.</div>
          ) : (recent ?? []).map((o: any) => (
            <div key={o.id} style={{ padding: '10px 12px', borderRadius: 8, background: o.three_concurrent_flag ? 'rgba(244,63,94,0.08)' : '#1f1f23', border: `1px solid ${o.three_concurrent_flag ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.06)'}`, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{o.offence_definitions?.offence_name ?? '—'}</span>
                <span style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>{new Date(o.incident_date).toLocaleDateString('en-ZA')}</span>
              </div>
              <div style={{ fontSize: 11, color: '#a1a1aa' }}>{o.profiles?.full_name}</div>
              {Number(o.fine_amount_applied) > 0 && <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginTop: 4 }}>Fine: R {Number(o.fine_amount_applied).toFixed(2)}</div>}
              {o.three_concurrent_flag && <div style={{ fontSize: 10, color: '#f43f5e', fontWeight: 700, marginTop: 4 }}>⚠ 3-Concurrent Rule — External DC</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
