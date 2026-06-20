// app/dashboard/admin/move-out-audit/[reportId]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import InspectionReportPDFButton from '@/components/move-out-audit/InspectionReportPDFButton'

export const revalidate = 0

export default async function InspectionReportPage({
  params,
}: {
  params: { reportId: string }
}) {
  const supabase = createClient()

  const { data: report } = await supabase
    .from('inspection_reports')
    .select(`
      *,
      rooms (
        room_number,
        monthly_rate,
        units ( unit_code, blocks ( code ) )
      ),
      profiles!inspection_reports_student_id_fkey (
        full_name, student_number, email, course, faculty
      ),
      inspection_line_items (
        id, item_name, category, condition_out, problem_description,
        repair_cost_estimate, photo_urls, sort_order
      )
    `)
    .eq('id', params.reportId)
    .single()

  if (!report) notFound()

  const block = report.rooms?.units?.blocks?.code ?? '—'
  const unit  = report.rooms?.units?.unit_code ?? ''
  const room  = report.rooms?.room_number ?? '—'

  // Sort line items by category then sort_order
  const items = [...(report.inspection_line_items ?? [])].sort((a, b) =>
    a.category.localeCompare(b.category) || a.sort_order - b.sort_order
  )

  const damagedItems = items.filter(i => i.condition_out === 'Not_OK')
  const okItems      = items.filter(i => i.condition_out !== 'Not_OK')
  const score        = items.length > 0
    ? Math.round((okItems.length / items.length) * 100)
    : 100
  const scoreColor   = score > 80 ? '#10b981' : score > 50 ? '#f59e0b' : '#f43f5e'

  const categories = [...new Set(items.map(i => i.category))]

  return (
    <div className="animate-page" style={{ maxWidth: 700 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Link href="/dashboard/admin/move-out-audit" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: 12 }}>
              ← Inspection Reports
            </Link>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Inspection Report
          </h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: 'var(--blue)', background: 'var(--blue-dim)',
              border: '1px solid var(--blue-ring)', padding: '2px 8px', borderRadius: 4,
            }}>
              {report.report_ref}
            </span>
            <span style={{
              padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: report.is_finalised ? 'var(--emerald-dim)' : 'var(--amber-dim)',
              color: report.is_finalised ? 'var(--emerald)' : 'var(--amber)',
              border: `1px solid ${report.is_finalised ? 'var(--emerald-ring)' : 'var(--amber-ring)'}`,
            }}>
              {report.is_finalised ? 'Finalised' : 'In Progress'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!report.is_finalised && (
            <Link href={`/dashboard/admin/move-out-audit/${params.reportId}/edit`}>
              <button style={{ padding: '7px 14px', borderRadius: 'var(--r-md)', background: 'var(--blue-dim)', border: '1px solid var(--blue-ring)', color: 'var(--blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Edit Report
              </button>
            </Link>
          )}
          <InspectionReportPDFButton reportId={params.reportId} reportRef={report.report_ref} />
        </div>
      </div>

      {/* Report body card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        {/* Report header */}
        <div style={{ textAlign: 'center', padding: '20px 20px 16px', borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-raised)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 6 }}>
            ◆ CORRIDOR HILL RESIDENCE · eMalahleni
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Move-Out Inspection Report</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
            REF: {report.report_ref} · {new Date(report.inspection_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {/* Score + summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {/* Condition score */}
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-mid)' }}>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', color: scoreColor }}>{score}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                Room Condition · {okItems.length}/{items.length} OK
              </div>
              {report.total_damage_cost > 0 && (
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--amber)', marginTop: 8, letterSpacing: '-0.02em' }}>
                  R {Number(report.total_damage_cost).toFixed(2)} damage
                </div>
              )}
            </div>

            {/* Room + student info */}
            <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-mid)', padding: 14 }}>
              {[
                ['Location', `Block ${block} · ${block}${unit} · ${room}`],
                ['Student', report.profiles?.full_name ?? '—'],
                ['Student No.', report.profiles?.student_number ?? '—'],
                ['Inspector', report.inspector_name],
                ['Date', new Date(report.inspection_date).toLocaleDateString('en-ZA')],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-dim)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Damage summary (if any) */}
          {damagedItems.length > 0 && (
            <div style={{ marginBottom: 20, padding: 14, background: 'var(--rose-dim)', border: '1px solid var(--rose-ring)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rose)', marginBottom: 10 }}>
                ⚠ Damage Found — {damagedItems.length} Item{damagedItems.length > 1 ? 's' : ''}
              </div>
              {damagedItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(244,63,94,0.2)', fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.item_name}</div>
                    {item.problem_description && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.problem_description}</div>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--amber)', fontFamily: 'JetBrains Mono, monospace' }}>
                    R {Number(item.repair_cost_estimate ?? 0).toFixed(2)}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700, fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Damage</span>
                <span style={{ color: 'var(--amber)', fontFamily: 'JetBrains Mono, monospace' }}>
                  R {Number(report.total_damage_cost).toFixed(2)}
                </span>
              </div>
              {Number(report.recommended_deduction) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Recommended Deduction</span>
                  <span style={{ color: 'var(--rose)', fontFamily: 'JetBrains Mono, monospace' }}>
                    R {Number(report.recommended_deduction).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Full item checklist by category */}
          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--text-secondary)',
                marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {cat}
                <div style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
              </div>
              {items.filter(i => i.category === cat).map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 'var(--r-md)',
                  background: item.condition_out === 'Not_OK' ? 'var(--rose-dim)' : 'var(--bg-raised)',
                  border: `1px solid ${item.condition_out === 'Not_OK' ? 'var(--rose-ring)' : 'var(--border-dim)'}`,
                  marginBottom: 4, fontSize: 12,
                }}>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.item_name}</div>
                    {item.problem_description && (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{item.problem_description}</div>
                    )}
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: item.condition_out === 'OK_Out' ? 'var(--emerald-dim)' : item.condition_out === 'OK_In' ? 'var(--blue-dim)' : 'var(--rose-dim)',
                    color: item.condition_out === 'OK_Out' ? 'var(--emerald)' : item.condition_out === 'OK_In' ? 'var(--blue)' : 'var(--rose)',
                    border: `1px solid ${item.condition_out === 'OK_Out' ? 'var(--emerald-ring)' : item.condition_out === 'OK_In' ? 'var(--blue-ring)' : 'var(--rose-ring)'}`,
                  }}>
                    {item.condition_out.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {/* Notes + signatures */}
          {report.notes && (
            <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 6 }}>Inspector Notes</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{report.notes}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
            {[
              { label: 'Inspector Signature', value: report.inspector_name },
              { label: 'Student Signature', value: report.student_signature ?? '—' },
            ].map(sig => (
              <div key={sig.label} style={{ padding: 12, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6 }}>{sig.label}</div>
                <div style={{ fontSize: 15, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-mid)', paddingBottom: 8 }}>
                  {sig.value}
                </div>
                {report.signed_at && (
                  <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 5, fontFamily: 'JetBrains Mono, monospace' }}>
                    {new Date(report.signed_at).toLocaleString('en-ZA')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
