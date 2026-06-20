// app/dashboard/student/my-conduct/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyConductPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const [{ data: offences }, { data: ackRecord }] = await Promise.all([
    supabase
      .from('offences_log')
      .select(`
        id, incident_date, incident_description, location,
        applied_outcome, fine_amount_applied,
        offence_count_at_time, three_concurrent_flag,
        escalated_to_external_dc, resolved, resolved_at,
        offence_definitions ( offence_name, category )
      `)
      .eq('student_id', session.user.id)
      .order('incident_date', { ascending: false }),
    supabase
      .from('conduct_acknowledgements')
      .select('id, is_verified, acknowledged_at, document_version')
      .eq('student_id', session.user.id)
      .order('acknowledged_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const totalFines = (offences ?? []).reduce((sum, o) => sum + Number(o.fine_amount_applied ?? 0), 0)
  const openFines  = (offences ?? []).filter(o => !o.resolved).reduce((sum, o) => sum + Number(o.fine_amount_applied ?? 0), 0)

  const OUTCOME_LABELS: Record<string, string> = {
    warning: 'Formal Warning', fine: 'Fine Applied',
    confiscation: 'Confiscation', church_fee_flag: 'Church Fee Flag',
    refuse_bag: 'Refuse Bag Issued', external_dc_referral: 'Referred to External DC',
    tut_judiciary: 'Referred to TUT Judiciary', police_referral: 'Police Referral',
    management_escalation: 'Management Escalation', pending: 'Pending Review',
  }

  const CAT_COLORS: Record<string, string> = {
    cat1_internal: 'var(--amber)',
    cat2_property_damage: 'var(--blue)',
    cat4_serious: 'var(--rose)',
  }

  return (
    <div className="animate-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Conduct Record</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
          Your disciplinary history and fine balance
        </p>
      </div>

      {/* CoC acknowledgement status */}
      <div style={{
        padding: '10px 16px', borderRadius: 'var(--r-md)', marginBottom: 20,
        background: ackRecord?.is_verified ? 'var(--emerald-dim)' : 'var(--amber-dim)',
        border: `1px solid ${ackRecord?.is_verified ? 'var(--emerald-ring)' : 'var(--amber-ring)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: ackRecord?.is_verified ? 'var(--emerald)' : 'var(--amber)' }}>
          {ackRecord
            ? ackRecord.is_verified
              ? `✓ Code of Conduct Acknowledged & Verified — ${ackRecord.document_version}`
              : `⏳ Code of Conduct Signed — Awaiting admin verification (${ackRecord.document_version})`
            : '⚠ Code of Conduct not yet signed — complete onboarding step 4'}
        </div>
        {ackRecord?.acknowledged_at && (
          <div style={{ fontSize: 11, color: ackRecord.is_verified ? 'var(--emerald)' : 'var(--amber)', fontFamily: 'JetBrains Mono, monospace' }}>
            {new Date(ackRecord.acknowledged_at).toLocaleDateString('en-ZA')}
          </div>
        )}
      </div>

      {/* Fine summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { val: offences?.length ?? 0,         label: 'Total Offences',    color: 'var(--text-primary)' },
          { val: `R ${totalFines.toFixed(2)}`,   label: 'Total Fines',       color: 'var(--amber)'       },
          { val: `R ${openFines.toFixed(2)}`,    label: 'Outstanding',       color: openFines > 0 ? 'var(--rose)' : 'var(--emerald)' },
          { val: (offences ?? []).filter(o => !o.resolved).length, label: 'Open Cases', color: 'var(--rose)' },
        ].map(t => (
          <div key={t.label} style={{
            flex: 1, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)',
            borderRadius: 'var(--r-md)', padding: '10px 14px',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: t.color }}>{String(t.val)}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Offence list */}
      {(!offences || offences.length === 0) ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--bg-card)', border: '1px solid var(--emerald-ring)',
          borderRadius: 'var(--r-lg)', color: 'var(--emerald)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Clean Record</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>No disciplinary incidents on record.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {offences.map(o => (
            <div key={o.id} style={{
              background: 'var(--bg-card)',
              border: `1px solid ${o.three_concurrent_flag ? 'var(--rose-ring)' : 'var(--border-dim)'}`,
              borderRadius: 'var(--r-lg)', padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {(o as any).offence_definitions?.offence_name ?? '—'}
                  </div>
                  <div style={{ fontSize: 10, color: CAT_COLORS[(o as any).offence_definitions?.category ?? ''] ?? 'var(--text-tertiary)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {(o as any).offence_definitions?.category?.replace('_', ' ') ?? ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {Number(o.fine_amount_applied) > 0 && (
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--amber)', fontFamily: 'JetBrains Mono, monospace' }}>
                      R {Number(o.fine_amount_applied).toFixed(2)}
                    </span>
                  )}
                  <span style={{
                    padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                    background: o.resolved ? 'var(--emerald-dim)' : 'var(--rose-dim)',
                    color: o.resolved ? 'var(--emerald)' : 'var(--rose)',
                    border: `1px solid ${o.resolved ? 'var(--emerald-ring)' : 'var(--rose-ring)'}`,
                  }}>
                    {o.resolved ? 'Resolved' : 'Open'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
                {o.incident_description}
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-tertiary)' }}>
                <span>{new Date(o.incident_date).toLocaleDateString('en-ZA')}</span>
                {o.location && <span>· {o.location}</span>}
                <span>· {OUTCOME_LABELS[o.applied_outcome] ?? o.applied_outcome}</span>
                <span>· Offence #{o.offence_count_at_time}</span>
              </div>
              {o.three_concurrent_flag && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--rose)', fontWeight: 700 }}>
                  ⚠ 3-Concurrent Rule Applied — External DC Referral
                </div>
              )}
              {o.escalated_to_external_dc && !o.three_concurrent_flag && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>
                  Referred to External Disciplinary Committee
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
