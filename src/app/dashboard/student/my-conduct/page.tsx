import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyConductPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const [{ data: offences }, { data: ack }] = await Promise.all([
    supabase
      .from('offences_log')
      .select(`
        id, incident_date, incident_description, applied_outcome,
        fine_amount_applied, three_concurrent_flag, resolved, offence_count_at_time,
        offence_definitions ( offence_name, category )
      `)
      .eq('student_id', session.user.id)
      .order('incident_date', { ascending: false }),
    supabase
      .from('conduct_acknowledgements')
      .select('is_verified, acknowledged_at, document_version')
      .eq('student_id', session.user.id)
      .order('acknowledged_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const totalFines = (offences ?? []).reduce((s, o) => s + Number(o.fine_amount_applied ?? 0), 0)
  const openFines  = (offences ?? []).filter(o => !o.resolved).reduce((s, o) => s + Number(o.fine_amount_applied ?? 0), 0)

  const OUTCOMES: Record<string, string> = {
    warning: 'Formal Warning',
    fine: 'Fine Applied',
    confiscation: 'Confiscation',
    church_fee_flag: 'Church Fee Flag',
    refuse_bag: 'Refuse Bag Issued',
    external_dc_referral: 'External DC Referral',
    tut_judiciary: 'TUT Judiciary',
    police_referral: 'Police Referral',
    management_escalation: 'Management Escalation',
    pending: 'Pending Review',
  }

  const CAT_COLOR: Record<string, string> = {
    cat1_internal: '#f59e0b',
    cat2_property_damage: '#3b82f6',
    cat4_serious: '#f43f5e',
  }

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Conduct Record</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Your disciplinary history and fine balance</p>

      {/* CoC acknowledgement status */}
      <div style={{
        marginBottom: 20, padding: '12px 18px', borderRadius: 12,
        background: ack?.is_verified ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
        border: `1px solid ${ack?.is_verified ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: ack?.is_verified ? '#10b981' : '#f59e0b' }}>
          {ack
            ? ack.is_verified
              ? `✓ Code of Conduct Acknowledged & Verified — ${ack.document_version}`
              : `⏳ Code of Conduct Signed — Awaiting admin verification (${ack.document_version})`
            : '⚠ Code of Conduct not yet signed — go to Code of Conduct in the sidebar'}
        </div>
        {ack?.acknowledged_at && (
          <div style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>
            {new Date(ack.acknowledged_at).toLocaleDateString('en-ZA')}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Offences', value: offences?.length ?? 0,        color: (offences?.length ?? 0) > 0 ? '#f43f5e' : '#10b981' },
          { label: 'Total Fines',    value: `R ${totalFines.toFixed(2)}`,  color: totalFines > 0 ? '#f59e0b' : '#10b981' },
          { label: 'Outstanding',    value: `R ${openFines.toFixed(2)}`,   color: openFines > 0 ? '#f43f5e' : '#10b981' },
          { label: 'Open Cases',     value: (offences ?? []).filter(o => !o.resolved).length, color: (offences ?? []).filter(o => !o.resolved).length > 0 ? '#f43f5e' : '#10b981' },
        ].map(t => (
          <div key={t.label} style={{ flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.color }}>{String(t.value)}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Offence list */}
      {(!offences || offences.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>Clean Record</div>
          <div style={{ fontSize: 13, color: '#71717a' }}>No disciplinary incidents on record. Keep it up!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {offences.map(o => (
            <div key={o.id} style={{
              background: '#18181b',
              border: `1px solid ${o.three_concurrent_flag ? 'rgba(244,63,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', marginBottom: 4 }}>
                    {(o as any).offence_definitions?.offence_name ?? '—'}
                  </div>
                  <div style={{ fontSize: 10, color: CAT_COLOR[(o as any).offence_definitions?.category ?? ''] ?? '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    {(o as any).offence_definitions?.category?.replace(/_/g, ' ') ?? ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {Number(o.fine_amount_applied) > 0 && (
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
                      R {Number(o.fine_amount_applied).toFixed(2)}
                    </span>
                  )}
                  <span style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                    background: o.resolved ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.12)',
                    color: o.resolved ? '#10b981' : '#f43f5e',
                    border: `1px solid ${o.resolved ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
                  }}>
                    {o.resolved ? 'Resolved' : 'Open'}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 8, lineHeight: 1.6 }}>
                {o.incident_description}
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#71717a' }}>
                <span>📅 {new Date(o.incident_date).toLocaleDateString('en-ZA')}</span>
                <span>· {OUTCOMES[o.applied_outcome] ?? o.applied_outcome}</span>
                <span>· Offence #{o.offence_count_at_time}</span>
              </div>

              {o.three_concurrent_flag && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', fontSize: 11, color: '#f43f5e', fontWeight: 700 }}>
                  ⚠ 3-Concurrent Rule Applied — Referred to External Disciplinary Committee
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
