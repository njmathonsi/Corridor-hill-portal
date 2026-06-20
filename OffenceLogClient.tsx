'use client'
// app/dashboard/admin/disciplinary/log/OffenceLogClient.tsx
import { useState, useTransition, useEffect } from 'react'
import { logOffence } from '@/lib/actions/inspection'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface Student {
  id: string; full_name: string; student_number: string
}
interface OffenceDef {
  id: number; category: string; offence_name: string
  fine_1st: number | null; fine_2nd: number | null; fine_3rd: number | null
  outcome_1st: string; outcome_2nd: string; outcome_3rd: string
  involves_cost_recovery: boolean; requires_confiscation: boolean
}
interface PrevCount {
  student_id: string; offence_definition_id: number; count: number
}

interface Props {
  students: Student[]
  offenceDefinitions: OffenceDef[]
  prevCounts: PrevCount[]
}

const OUTCOME_LABELS: Record<string, string> = {
  warning:              '⚠ Formal Warning',
  fine:                 '💰 Monetary Fine',
  confiscation:         '📦 Confiscation',
  church_fee_flag:      '⛪ Church Fee Flag (R500)',
  refuse_bag:           '🗑 Issue Refuse Bag',
  external_dc_referral: '🏛 External DC Referral',
  tut_judiciary:        '⚖ TUT Judiciary',
  police_referral:      '🚔 Police Referral',
  management_escalation:'🔴 Management Escalation',
  pending:              '⏳ Pending Review',
}

const CAT_LABELS: Record<string, string> = {
  cat1_internal:       'Category 1 — Internal DC',
  cat2_property_damage:'Category 2 — Property Damage',
  cat4_serious:        'Category 4 — Serious Offences',
}

export default function OffenceLogClient({ students, offenceDefinitions, prevCounts }: Props) {
  const [studentId,  setStudentId]  = useState('')
  const [offenceId,  setOffenceId]  = useState<number | ''>('')
  const [incidentDate, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [description,  setDesc]     = useState('')
  const [location,     setLocation] = useState('')
  const [itemDamaged,  setItemDmg]  = useState('')
  const [itemConfiscated, setItem]  = useState('')
  const [costRecovery, setCost]     = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  // Derived: selected offence definition
  const def = offenceDefinitions.find(d => d.id === offenceId)

  // How many times has this student committed this offence before?
  const prevCount = studentId && offenceId
    ? (prevCounts.find(p => p.student_id === studentId && p.offence_definition_id === offenceId)?.count ?? 0)
    : 0

  // Which tier are we on?
  const tier = prevCount === 0 ? '1st' : prevCount === 1 ? '2nd' : '3rd'
  const autoOutcome = def
    ? (tier === '1st' ? def.outcome_1st : tier === '2nd' ? def.outcome_2nd : def.outcome_3rd)
    : ''
  const autoFine = def
    ? (tier === '1st' ? def.fine_1st : tier === '2nd' ? def.fine_2nd : def.fine_3rd) ?? 0
    : 0

  const isCat4 = def?.category === 'cat4_serious'
  const isDamage = def?.involves_cost_recovery

  // Group defs by category
  const grouped = offenceDefinitions.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = []
    acc[d.category].push(d)
    return acc
  }, {} as Record<string, OffenceDef[]>)

  function handleSubmit() {
    if (!studentId || !offenceId || !description.trim()) {
      toast({ title: 'Missing fields', description: 'Student, offence, and description are required', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const result = await logOffence({
        studentId,
        offenceDefinitionId: offenceId as number,
        incidentDate,
        description,
        location,
        appliedOutcome: autoOutcome,
        fineAmount: autoFine,
        damageCostRecovery: isDamage ? parseFloat(costRecovery || '0') : 0,
        itemDamaged: isDamage ? itemDamaged : undefined,
        itemConfiscated: def?.requires_confiscation ? itemConfiscated : undefined,
      })

      if (result.success) {
        const student = students.find(s => s.id === studentId)
        const offName = def?.offence_name ?? ''
        toast({
          title: `Offence Logged — ${offName}`,
          description: `${student?.full_name} · Tier ${tier} · ${OUTCOME_LABELS[autoOutcome] ?? autoOutcome}`,
        })
        router.push('/dashboard/admin/disciplinary')
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    })
  }

  const inputStyle = {
    background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
    color: 'var(--text-primary)', padding: '9px 12px',
    borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'inherit',
    width: '100%', outline: 'none',
  }
  const labelStyle = {
    fontSize: 11, fontWeight: 600 as const, color: 'var(--text-secondary)',
    letterSpacing: '0.04em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 5,
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Log Offence</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
          Record a disciplinary incident · Outcomes are auto-calculated per the escalation schedule
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 20 }}>
          {/* Student */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Student</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)} style={inputStyle}>
              <option value="">Select student…</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} · {s.student_number}</option>
              ))}
            </select>
          </div>

          {/* Offence */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Offence</label>
            <select value={offenceId} onChange={e => setOffenceId(Number(e.target.value))} style={inputStyle}>
              <option value="">Select offence…</option>
              {Object.entries(grouped).map(([cat, defs]) => (
                <optgroup key={cat} label={CAT_LABELS[cat] ?? cat}>
                  {defs.map(d => (
                    <option key={d.id} value={d.id}>{d.offence_name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Date + location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Incident Date</label>
              <input type="date" value={incidentDate} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Location (optional)</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Block A corridor" style={inputStyle} />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Incident Description</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe what happened in detail…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Confiscation field */}
          {def?.requires_confiscation && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Item Confiscated</label>
              <input value={itemConfiscated} onChange={e => setItem(e.target.value)} placeholder="Describe item(s) confiscated" style={inputStyle} />
            </div>
          )}

          {/* Cost recovery (cat2) */}
          {isDamage && (
            <div style={{ marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Item Damaged</label>
                <input value={itemDamaged} onChange={e => setItemDmg(e.target.value)} placeholder="e.g. Toilet flush handle" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Cost Recovery (R)</label>
                <input
                  type="number" value={costRecovery}
                  onChange={e => setCost(e.target.value)}
                  placeholder="0.00"
                  style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', color: 'var(--amber)' }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isPending || !studentId || !offenceId || !description.trim()}
            style={{
              width: '100%', padding: '10px',
              borderRadius: 'var(--r-md)',
              background: (!studentId || !offenceId || !description.trim()) ? 'var(--bg-raised)' : 'var(--rose-dim)',
              color: (!studentId || !offenceId || !description.trim()) ? 'var(--text-disabled)' : 'var(--rose)',
              border: `1px solid ${(!studentId || !offenceId || !description.trim()) ? 'var(--border-dim)' : 'var(--rose-ring)'}`,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              opacity: isPending ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
          >
            {isPending ? 'Logging…' : '⚖ Log Offence & Apply Outcome'}
          </button>
        </div>

        {/* Auto-outcome panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {def && studentId ? (
            <>
              {/* Escalation tier */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Escalation Tier
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: tier === '1st' ? 'var(--emerald)' : tier === '2nd' ? 'var(--amber)' : 'var(--rose)' }}>
                  {tier}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {prevCount} previous offence{prevCount !== 1 ? 's' : ''} of this type
                </div>
              </div>

              {/* Auto outcome */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Auto Outcome
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {OUTCOME_LABELS[autoOutcome] ?? autoOutcome}
                </div>
                {autoFine > 0 && (
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--amber)', letterSpacing: '-0.02em' }}>
                    R {autoFine.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Cat4 escalation warning */}
              {isCat4 && (
                <div style={{ background: 'var(--violet-dim)', border: '1px solid var(--violet-ring)', borderRadius: 'var(--r-lg)', padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--violet)', marginBottom: 4 }}>🚨 Serious Offence</div>
                  <div style={{ fontSize: 11, color: 'var(--violet)', lineHeight: 1.5, opacity: 0.85 }}>
                    This offence flags immediate referral to Management, TUT Judiciary, and Police.
                    All three bodies will be notified upon submission.
                  </div>
                </div>
              )}

              {/* Full escalation schedule */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Full Schedule
                </div>
                {[
                  { tier: '1st', outcome: def.outcome_1st, fine: def.fine_1st },
                  { tier: '2nd', outcome: def.outcome_2nd, fine: def.fine_2nd },
                  { tier: '3rd', outcome: def.outcome_3rd, fine: def.fine_3rd },
                ].map(row => (
                  <div key={row.tier} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 0', borderBottom: '1px solid var(--border-dim)', fontSize: 11,
                  }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{row.tier}</span>
                    <span style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>
                      {OUTCOME_LABELS[row.outcome] ?? row.outcome}
                      {row.fine ? ` · R${row.fine}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 20, textAlign: 'center', color: 'var(--text-disabled)', fontSize: 12 }}>
              Select a student and offence to see the auto-calculated outcome and escalation schedule
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
