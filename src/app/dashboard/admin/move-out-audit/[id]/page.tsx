import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PrintButton from '../PrintButton'

function condLabel(c: string | null | undefined) {
  if (!c) return '—'
  return c === 'Not_OK' ? 'Not OK' : 'OK'
}
function condColor(c: string | null | undefined) {
  if (!c) return '#71717a'
  return c === 'Not_OK' ? '#f43f5e' : '#10b981'
}

export default async function InspectionReportPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: report } = await supabase
    .from('inspection_reports')
    .select('*, rooms(room_number, units(unit_code, blocks(code))), profiles!inspection_reports_student_id_fkey(full_name, student_number), inspection_line_items(*)')
    .eq('id', params.id)
    .single()

  if (!report) notFound()

  const lineItems = ((report.inspection_line_items ?? []) as any[]).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const isMoveOut = report.inspection_type === 'move_out'

  // Batch-resolve signed URLs for every photo referenced by any line item
  const allPaths = lineItems.flatMap(li => li.photo_urls ?? [])
  const signedUrlMap = new Map<string, string>()
  if (allPaths.length > 0) {
    const { data: signed } = await supabase.storage.from('inspection-photos').createSignedUrls(allPaths, 300)
    for (const s of signed ?? []) {
      if (s.signedUrl) signedUrlMap.set(s.path ?? '', s.signedUrl)
    }
  }

  const damagedItems = lineItems.filter(li => li.condition_out === 'Not_OK' || li.condition_in === 'Not_OK')

  return (
    <div className="print-report" style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      <div className="no-print" style={{ marginBottom: 16 }}>
        <Link href="/dashboard/admin/move-out-audit" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#71717a', textDecoration: 'none' }}>
          <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Back to Move-Out Audit
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{report.report_ref}</h1>
            <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: isMoveOut ? 'rgb(var(--brand-rgb) / 0.15)' : 'rgba(59,130,246,0.15)', color: isMoveOut ? 'var(--brand)' : '#3b82f6', border: `1px solid ${isMoveOut ? 'rgb(var(--brand-rgb) / 0.3)' : 'rgba(59,130,246,0.3)'}` }}>
              {isMoveOut ? 'Move-Out' : 'Move-In'}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: report.is_finalised ? 'rgba(16,185,129,0.15)' : 'rgb(var(--brand-rgb) / 0.15)', color: report.is_finalised ? '#10b981' : 'var(--brand)' }}>
              {report.is_finalised ? 'Finalised' : 'In Progress'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#71717a', marginTop: 6 }}>
            Block {report.rooms?.units?.blocks?.code} · Unit {report.rooms?.units?.unit_code} · Room {report.rooms?.room_number}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="glass-card" style={{ padding: 18, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Student</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{report.profiles?.full_name ?? '—'}</div>
          <div style={{ fontSize: 11, color: '#71717a' }}>{report.profiles?.student_number ?? ''}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Inspector</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{report.inspector_name}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Inspection Date</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{new Date(report.inspection_date).toLocaleDateString('en-ZA')}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{isMoveOut ? 'Total Damage' : 'Condition Score'}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: isMoveOut ? 'var(--brand)' : '#10b981', fontFamily: isMoveOut ? 'monospace' : undefined }}>
            {isMoveOut ? `R ${Number(report.total_damage_cost).toFixed(2)}` : `${lineItems.filter(li => li.condition_in !== 'Not_OK').length}/${lineItems.length} OK`}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Item</th>
              {isMoveOut ? (
                <>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>At Move-In</th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>At Move-Out</th>
                </>
              ) : (
                <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Condition</th>
              )}
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes</th>
              {isMoveOut && <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cost</th>}
              <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Photos</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map(li => {
              const preExisting = isMoveOut && li.condition_in === 'Not_OK' && li.condition_out === 'Not_OK'
              return (
                <tr key={li.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '9px 14px' }}>
                    <div style={{ fontWeight: 500 }}>{li.item_name}</div>
                    <div style={{ fontSize: 10, color: '#71717a' }}>{li.category}</div>
                  </td>
                  {isMoveOut ? (
                    <>
                      <td style={{ textAlign: 'center', padding: '9px 14px', color: condColor(li.condition_in), fontWeight: 600 }}>{condLabel(li.condition_in)}</td>
                      <td style={{ textAlign: 'center', padding: '9px 14px', color: condColor(li.condition_out), fontWeight: 600 }}>{condLabel(li.condition_out)}</td>
                    </>
                  ) : (
                    <td style={{ textAlign: 'center', padding: '9px 14px', color: condColor(li.condition_in), fontWeight: 600 }}>{condLabel(li.condition_in)}</td>
                  )}
                  <td style={{ padding: '9px 14px', color: '#a1a1aa' }}>
                    {li.problem_description ?? '—'}
                    {preExisting && <div style={{ fontSize: 10, color: 'var(--brand)', marginTop: 2 }}>⚠ Pre-existing at move-in — not charged to this student</div>}
                  </td>
                  {isMoveOut && <td style={{ textAlign: 'right', padding: '9px 14px', fontFamily: 'monospace', color: Number(li.repair_cost_estimate) > 0 ? 'var(--brand)' : '#71717a' }}>R {Number(li.repair_cost_estimate ?? 0).toFixed(2)}</td>}
                  <td style={{ padding: '9px 14px' }}>
                    {(li.photo_urls ?? []).length === 0 ? (
                      <span style={{ color: '#52525b' }}>—</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(li.photo_urls as string[]).map((p, i) => signedUrlMap.get(p) && (
                          <a key={p} href={signedUrlMap.get(p)} target="_blank" rel="noopener noreferrer" className="no-print" style={{ fontSize: 10, color: '#3b82f6', textDecoration: 'underline' }}>
                            Photo {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {report.notes && (
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Inspector Notes</div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>{report.notes}</div>
        </div>
      )}

      {isMoveOut && (
        <div className="glass-card" style={{ padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Recommended Deduction</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand)', fontFamily: 'monospace' }}>R {Number(report.recommended_deduction ?? 0).toFixed(2)}</div>
          </div>
          {damagedItems.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Damaged Items</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{damagedItems.length}</div>
            </div>
          )}
        </div>
      )}

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Sign-Off</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 4 }}>Inspector Signature</div>
            <div style={{ fontSize: 15, fontStyle: 'italic', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 6 }}>{report.inspector_signature || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 4 }}>Student Signature</div>
            <div style={{ fontSize: 15, fontStyle: 'italic', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 6 }}>{report.student_signature || '—'}</div>
          </div>
        </div>
        {report.signed_at && (
          <div style={{ fontSize: 10, color: '#71717a', marginTop: 8 }}>Signed {new Date(report.signed_at).toLocaleString('en-ZA')}</div>
        )}
      </div>
    </div>
  )
}
