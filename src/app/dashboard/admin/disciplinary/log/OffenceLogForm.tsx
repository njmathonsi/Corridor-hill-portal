'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Student { id: string; full_name: string; student_number: string }
interface OffenceDef { id: number; category: string; offence_name: string; fine_1st: number|null; fine_2nd: number|null; fine_3rd: number|null; outcome_1st: string; outcome_2nd: string; outcome_3rd: string; involves_cost_recovery: boolean; requires_confiscation: boolean }

const OUTCOME_LABELS: Record<string,string> = {
  warning:'⚠ Formal Warning', fine:'💰 Fine', confiscation:'📦 Confiscation',
  church_fee_flag:'⛪ Church Fee Flag', refuse_bag:'🗑 Refuse Bag',
  external_dc_referral:'🏛 External DC', tut_judiciary:'⚖ TUT Judiciary',
  police_referral:'🚔 Police Referral', management_escalation:'🔴 Management', pending:'⏳ Pending',
}
const CAT_LABELS: Record<string,string> = {
  cat1_internal:'Category 1 — Internal DC',
  cat2_property_damage:'Category 2 — Property Damage',
  cat4_serious:'Category 4 — Serious Offences',
}

export default function OffenceLogForm({ students, offenceDefinitions }: { students: Student[]; offenceDefinitions: OffenceDef[] }) {
  const [studentId, setStudentId] = useState('')
  const [offenceId, setOffenceId] = useState<number|''>('')
  const [incidentDate, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [description, setDesc]    = useState('')
  const [location, setLocation]   = useState('')
  const [itemDamaged, setItemDmg] = useState('')
  const [itemConf, setItemConf]   = useState('')
  const [costRecovery, setCost]   = useState('')
  const [prevCount, setPrevCount] = useState(0)
  const [success, setSuccess]     = useState('')
  const [error, setError]         = useState('')
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router   = useRouter()

  const def = offenceDefinitions.find(d => d.id === offenceId)
  const tier = prevCount === 0 ? '1st' : prevCount === 1 ? '2nd' : '3rd'
  const autoOutcome = def ? (tier === '1st' ? def.outcome_1st : tier === '2nd' ? def.outcome_2nd : def.outcome_3rd) : ''
  const autoFine    = def ? ((tier === '1st' ? def.fine_1st : tier === '2nd' ? def.fine_2nd : def.fine_3rd) ?? 0) : 0

  async function loadPrevCount(sId: string, oId: number) {
    if (!sId || !oId) return
    const { count } = await supabase.from('offences_log').select('*', { count: 'exact', head: true }).eq('student_id', sId).eq('offence_definition_id', oId)
    setPrevCount(count ?? 0)
  }

  async function handleSubmit() {
    if (!studentId || !offenceId || !description.trim()) { setError('Student, offence and description are required'); return }
    setError('')
    startTransition(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const { error: err } = await supabase.from('offences_log').insert({
        student_id: studentId,
        offence_definition_id: offenceId,
        incident_date: incidentDate,
        incident_description: description,
        location: location || null,
        offence_count_at_time: prevCount + 1,
        applied_outcome: autoOutcome,
        fine_amount_applied: autoFine,
        damage_cost_recovery: def?.involves_cost_recovery ? parseFloat(costRecovery || '0') : 0,
        item_damaged: itemDamaged || null,
        item_confiscated: itemConf || null,
        logged_by: session?.user.id,
      })
      if (err) { setError(err.message); return }
      setSuccess(`Offence logged successfully · Outcome: ${OUTCOME_LABELS[autoOutcome] ?? autoOutcome}${autoFine > 0 ? ` · Fine: R${autoFine}` : ''}`)
      setStudentId(''); setOffenceId(''); setDesc(''); setLocation(''); setItemDmg(''); setItemConf(''); setCost(''); setPrevCount(0)
      router.refresh()
    })
  }

  const grouped = offenceDefinitions.reduce((acc, d) => { if (!acc[d.category]) acc[d.category] = []; acc[d.category].push(d); return acc }, {} as Record<string,OffenceDef[]>)
  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '9px 12px', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start', maxWidth: 800 }}>
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
        {success && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', marginBottom: 16 }}>{success}</div>}
        {error   && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', marginBottom: 16 }}>{error}</div>}

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>STUDENT</label>
          <select value={studentId} onChange={e => { setStudentId(e.target.value); loadPrevCount(e.target.value, offenceId as number) }} style={inp}>
            <option value="">Select student…</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.student_number ? `· ${s.student_number}` : ''}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>OFFENCE</label>
          <select value={offenceId} onChange={e => { setOffenceId(Number(e.target.value)); loadPrevCount(studentId, Number(e.target.value)) }} style={inp}>
            <option value="">Select offence…</option>
            {Object.entries(grouped).map(([cat, defs]) => (
              <optgroup key={cat} label={CAT_LABELS[cat] ?? cat}>
                {defs.map(d => <option key={d.id} value={d.id}>{d.offence_name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div><label style={lbl}>INCIDENT DATE</label><input type="date" value={incidentDate} onChange={e => setDate(e.target.value)} style={inp} /></div>
          <div><label style={lbl}>LOCATION (optional)</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Block A corridor" style={inp} /></div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>INCIDENT DESCRIPTION</label>
          <textarea value={description} onChange={e => setDesc(e.target.value)} placeholder="Describe what happened in detail…" rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
        </div>

        {def?.requires_confiscation && (
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>ITEM CONFISCATED</label>
            <input value={itemConf} onChange={e => setItemConf(e.target.value)} placeholder="Describe confiscated item(s)" style={inp} />
          </div>
        )}

        {def?.involves_cost_recovery && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div><label style={lbl}>ITEM DAMAGED</label><input value={itemDamaged} onChange={e => setItemDmg(e.target.value)} placeholder="e.g. Toilet flush handle" style={inp} /></div>
            <div><label style={lbl}>COST RECOVERY (R)</label><input type="number" value={costRecovery} onChange={e => setCost(e.target.value)} placeholder="0.00" style={{ ...inp, color: '#f59e0b', fontFamily: 'monospace' }} /></div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={pending || !studentId || !offenceId || !description.trim()} style={{ width: '100%', padding: '11px', borderRadius: 8, background: (!studentId || !offenceId || !description.trim()) ? '#27272a' : 'rgba(244,63,94,0.15)', color: (!studentId || !offenceId || !description.trim()) ? '#52525b' : '#f43f5e', border: `1px solid ${(!studentId || !offenceId || !description.trim()) ? 'rgba(255,255,255,0.08)' : 'rgba(244,63,94,0.3)'}`, fontSize: 13, fontWeight: 700, cursor: (!studentId || !offenceId || !description.trim()) ? 'not-allowed' : 'pointer', opacity: pending ? 0.5 : 1 }}>
          {pending ? 'Logging…' : '⚖ Log Offence & Apply Outcome'}
        </button>
      </div>

      {/* Auto outcome panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {def && studentId ? (
          <>
            <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a', marginBottom: 8 }}>Escalation Tier</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: tier === '1st' ? '#10b981' : tier === '2nd' ? '#f59e0b' : '#f43f5e' }}>{tier}</div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>{prevCount} previous offence{prevCount !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a', marginBottom: 8 }}>Auto Outcome</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', marginBottom: 6 }}>{OUTCOME_LABELS[autoOutcome] ?? autoOutcome}</div>
              {autoFine > 0 && <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>R {autoFine.toFixed(2)}</div>}
            </div>
            {def.category === 'cat4_serious' && (
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6', marginBottom: 4 }}>🚨 Serious Offence</div>
                <div style={{ fontSize: 11, color: '#8b5cf6', lineHeight: 1.5, opacity: 0.85 }}>Flags immediate referral to Management, TUT Judiciary, and Police.</div>
              </div>
            )}
            <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a', marginBottom: 8 }}>Full Schedule</div>
              {[{tier:'1st',outcome:def.outcome_1st,fine:def.fine_1st},{tier:'2nd',outcome:def.outcome_2nd,fine:def.fine_2nd},{tier:'3rd',outcome:def.outcome_3rd,fine:def.fine_3rd}].map(row => (
                <div key={row.tier} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11 }}>
                  <span style={{ color: '#71717a' }}>{row.tier}</span>
                  <span style={{ color: '#a1a1aa', textAlign: 'right', fontSize: 10 }}>{OUTCOME_LABELS[row.outcome] ?? row.outcome}{row.fine ? ` · R${row.fine}` : ''}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, textAlign: 'center', color: '#52525b', fontSize: 12 }}>
            Select a student and offence to see the auto-calculated outcome
          </div>
        )}
      </div>
    </div>
  )
}
