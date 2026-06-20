// app/dashboard/admin/disciplinary/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 0

export default async function DisciplinaryPage() {
  const supabase = createClient()

  const [
    { data: summary },
    { data: offenceDefinitions },
    { data: recentOffences },
  ] = await Promise.all([
    supabase
      .from('student_discipline_summary')
      .select('*')
      .order('total_offences', { ascending: false })
      .limit(50),
    supabase
      .from('offence_definitions')
      .select('id, category, offence_name, fine_1st, fine_2nd, outcome_1st')
      .eq('is_active', true)
      .order('category')
      .order('offence_name'),
    supabase
      .from('offences_log')
      .select(`
        id, incident_date, applied_outcome, fine_amount_applied,
        three_concurrent_flag, escalated_to_police, resolved,
        offence_definitions ( offence_name, category ),
        profiles!offences_log_student_id_fkey ( full_name, student_number )
      `)
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  const flaggedStudents = (summary ?? []).filter(s => s.has_concurrent_flag || s.has_police_referral)
  const totalFines = (summary ?? []).reduce((sum, s) => sum + Number(s.total_fines_applied ?? 0), 0)

  return (
    <div className="animate-page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Disciplinary Matrix</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            Code of Conduct enforcement · Offence tracking · Escalation management
          </p>
        </div>
        <Link href="/dashboard/admin/disciplinary/log">
          <button style={{
            padding: '8px 16px', borderRadius: 'var(--r-md)',
            background: 'var(--rose-dim)', color: 'var(--rose)',
            border: '1px solid var(--rose-ring)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            + Log Offence
          </button>
        </Link>
      </div>

      {/* Escalation banner */}
      {flaggedStudents.length > 0 && (
        <div style={{
          marginBottom: 20, padding: '12px 16px', borderRadius: 'var(--r-md)',
          background: 'var(--rose-dim)', border: '1px solid var(--rose-ring)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rose)' }}>
              {flaggedStudents.length} student{flaggedStudents.length > 1 ? 's' : ''} flagged for escalation
            </div>
            <div style={{ fontSize: 12, color: 'var(--rose)', opacity: 0.7, marginTop: 2 }}>
              {flaggedStudents.map(s => s.full_name).join(', ')} — requires immediate management review
            </div>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { val: (summary ?? []).reduce((sum, s) => sum + Number(s.total_offences ?? 0), 0), label: 'Total Offences', color: 'var(--text-primary)' },
          { val: `R ${totalFines.toFixed(2)}`, label: 'Total Fines Applied', color: 'var(--amber)' },
          { val: flaggedStudents.length, label: 'Escalation Flags', color: 'var(--rose)' },
          { val: (summary ?? []).filter(s => !s.has_concurrent_flag && Number(s.total_offences ?? 0) === 0).length, label: 'Clean Records', color: 'var(--emerald)' },
        ].map(t => (
          <div key={t.label} style={{
            flex: 1, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)',
            borderRadius: 'var(--r-md)', padding: '10px 14px',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: t.color }}>{t.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        {/* Student discipline table */}
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Student Discipline Summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Student', 'Offences', 'Fines', 'Last Incident', 'Flags', ''].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '8px 12px',
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: 'var(--text-tertiary)',
                      borderBottom: '1px solid var(--border-dim)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(summary ?? []).map(s => (
                  <tr key={s.student_id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.full_name}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-tertiary)' }}>
                        {s.student_number}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: Number(s.total_offences) > 3 ? 'var(--rose)' : Number(s.total_offences) > 0 ? 'var(--amber)' : 'var(--emerald)',
                      }}>
                        {s.total_offences ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--amber)' }}>
                      R {Number(s.total_fines_applied ?? 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {s.last_incident_date
                        ? new Date(s.last_incident_date).toLocaleDateString('en-ZA')
                        : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {s.has_concurrent_flag && (
                          <span style={{ padding: '2px 6px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'var(--rose-dim)', color: 'var(--rose)', border: '1px solid var(--rose-ring)' }}>
                            3-Rule
                          </span>
                        )}
                        {s.has_external_dc && (
                          <span style={{ padding: '2px 6px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid var(--amber-ring)' }}>
                            Ext DC
                          </span>
                        )}
                        {s.has_police_referral && (
                          <span style={{ padding: '2px 6px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'var(--violet-dim)', color: 'var(--violet)', border: '1px solid var(--violet-ring)' }}>
                            Police
                          </span>
                        )}
                        {!s.has_concurrent_flag && !s.has_external_dc && !s.has_police_referral && (
                          <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Link href={`/dashboard/admin/disciplinary/${s.student_id}`}>
                        <button style={{
                          padding: '4px 10px', borderRadius: 'var(--r-md)',
                          background: 'transparent', border: '1px solid var(--border-mid)',
                          color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
                        }}>
                          View
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent offences feed */}
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Recent Offences</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(recentOffences ?? []).length === 0 ? (
                <div style={{ color: 'var(--text-disabled)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                  No offences recorded.
                </div>
              ) : (recentOffences ?? []).map(o => (
                <div key={o.id} style={{
                  padding: '10px 12px', borderRadius: 'var(--r-md)',
                  background: o.three_concurrent_flag ? 'var(--rose-dim)' : 'var(--bg-raised)',
                  border: `1px solid ${o.three_concurrent_flag ? 'var(--rose-ring)' : 'var(--border-dim)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {(o as any).offence_definitions?.offence_name ?? '—'}
                    </span>
                    <span style={{
                      fontSize: 10, color: 'var(--text-tertiary)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {new Date(o.incident_date).toLocaleDateString('en-ZA')}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {(o as any).profiles?.full_name} · {(o as any).profiles?.student_number}
                  </div>
                  {Number(o.fine_amount_applied) > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 4, fontWeight: 600 }}>
                      Fine: R {Number(o.fine_amount_applied).toFixed(2)}
                    </div>
                  )}
                  {o.three_concurrent_flag && (
                    <div style={{ fontSize: 10, color: 'var(--rose)', fontWeight: 700, marginTop: 4 }}>
                      ⚠ 3-Concurrent Rule Triggered — Escalated to External DC
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
