'use client'
// components/move-out-audit/InspectionWizard.tsx
import { useState, useTransition } from 'react'
import { createInspectionReport, finaliseInspection } from '@/lib/actions/inspection'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

// ── Item catalogue (mirrors DB seed in migration 0008) ──────────
const INSPECTION_ITEMS = [
  { key: 'main_door_handle', name: 'Main Door Handle',    category: 'Entry' },
  { key: 'door_frame',       name: 'Door Frame',          category: 'Entry' },
  { key: 'door_lock',        name: 'Door Lock / Key',     category: 'Entry' },
  { key: 'bed_base',         name: 'Bed Base',            category: 'Bedroom' },
  { key: 'mattress',         name: 'Mattress',            category: 'Bedroom' },
  { key: 'pillow',           name: 'Pillow',              category: 'Bedroom' },
  { key: 'study_desk',       name: 'Study Desk',          category: 'Bedroom' },
  { key: 'study_chair',      name: 'Study Chair',         category: 'Bedroom' },
  { key: 'wardrobe',         name: 'Wardrobe',            category: 'Bedroom' },
  { key: 'wardrobe_key',     name: 'Wardrobe Key',        category: 'Bedroom' },
  { key: 'blinds',           name: 'Blinds / Curtains',   category: 'Bedroom' },
  { key: 'walls',            name: 'Walls',               category: 'Bedroom' },
  { key: 'ceiling',          name: 'Ceiling',             category: 'Bedroom' },
  { key: 'flooring',         name: 'Flooring',            category: 'Bedroom' },
  { key: 'basin',            name: 'Bathroom Basin',      category: 'Bathroom' },
  { key: 'basin_taps',       name: 'Taps (Basin)',        category: 'Bathroom' },
  { key: 'shower_head',      name: 'Shower Head',         category: 'Bathroom' },
  { key: 'shower_tray',      name: 'Shower Tray',         category: 'Bathroom' },
  { key: 'shower_taps',      name: 'Taps (Shower)',       category: 'Bathroom' },
  { key: 'toilet_bowl',      name: 'Toilet Bowl',         category: 'Bathroom' },
  { key: 'toilet_seat',      name: 'Toilet Seat',         category: 'Bathroom' },
  { key: 'toilet_flush',     name: 'Toilet Flush Handle', category: 'Bathroom' },
  { key: 'towel_rail',       name: 'Towel Rail',          category: 'Bathroom' },
  { key: 'soap_holder',      name: 'Soap Holder',         category: 'Bathroom' },
  { key: 'mirror',           name: 'Mirror',              category: 'Bathroom' },
  { key: 'tiles',            name: 'Tiles',               category: 'Bathroom' },
  { key: 'window_frame',     name: 'Window Frame',        category: 'Windows' },
  { key: 'window_glass',     name: 'Window Glass',        category: 'Windows' },
  { key: 'facia_board',      name: 'Facia Board',         category: 'Windows' },
  { key: 'light_fittings',   name: 'Light Fittings',      category: 'Fixtures' },
  { key: 'electrical_outlets', name: 'Electrical Outlets', category: 'Fixtures' },
]

type Condition = 'OK_In' | 'OK_Out' | 'Not_OK'
type ConditionMap = Record<string, { condition: Condition; problem?: string; cost?: number }>

const CATEGORIES = [...new Set(INSPECTION_ITEMS.map(i => i.category))]

interface Props {
  blocks: { id: number; code: string }[]
  students: { id: string; full_name: string; student_number: string }[]
}

export default function InspectionWizard({ blocks, students }: Props) {
  const [step, setStep]         = useState(1)
  const [blockId, setBlockId]   = useState('')
  const [unit, setUnit]         = useState('')
  const [room, setRoom]         = useState('')
  const [inspectorName, setInspectorName] = useState('')
  const [inspDate, setInspDate] = useState(new Date().toISOString().split('T')[0])
  const [studentId, setStudentId] = useState('')
  const [conditions, setConditions] = useState<ConditionMap>({})
  const [notes, setNotes]       = useState('')
  const [deduction, setDeduction] = useState('')
  const [studentSig, setStudentSig] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  // ── Step validation ──────────────────────────────────────────
  function canAdvance() {
    if (step === 1) return blockId && unit && room && inspectorName
    if (step === 2) return INSPECTION_ITEMS.every(i => conditions[i.key]?.condition)
    if (step === 3) return true // notes optional
    return true
  }

  function setCondition(key: string, cond: Condition) {
    setConditions(prev => ({
      ...prev,
      [key]: { ...prev[key], condition: cond },
    }))
  }

  function setProblem(key: string, problem: string) {
    setConditions(prev => ({
      ...prev,
      [key]: { ...prev[key], problem },
    }))
  }

  function setCost(key: string, cost: number) {
    setConditions(prev => ({
      ...prev,
      [key]: { ...prev[key], cost },
    }))
  }

  // ── Total damage cost ────────────────────────────────────────
  const totalDamage = Object.values(conditions)
    .filter(v => v.condition === 'Not_OK')
    .reduce((sum, v) => sum + (v.cost ?? 0), 0)

  const okCount  = Object.values(conditions).filter(v => v.condition !== 'Not_OK').length
  const allCount = INSPECTION_ITEMS.length
  const score    = allCount > 0 ? Math.round((okCount / allCount) * 100) : 0

  // ── Submit ───────────────────────────────────────────────────
  function handleFinish() {
    startTransition(async () => {
      const result = await finaliseInspection({
        blockId:      parseInt(blockId),
        unitCode:     unit,
        roomNumber:   room,
        inspectorName,
        inspectionDate: inspDate,
        studentId:    studentId || undefined,
        conditions,
        notes,
        deduction:    parseFloat(deduction || '0'),
        studentSignature: studentSig,
      })

      if (result.success) {
        toast({ title: '📄 Report Generated', description: `${result.ref} · Saved to records` })
        router.push(`/dashboard/admin/move-out-audit/${result.reportId}`)
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    })
  }

  // ── Shared styles ─────────────────────────────────────────────
  const inputStyle = {
    background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
    color: 'var(--text-primary)', padding: '9px 12px',
    borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'inherit', width: '100%', outline: 'none',
  }
  const labelStyle = {
    fontSize: 11, fontWeight: 600 as const, color: 'var(--text-secondary)',
    letterSpacing: '0.04em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5,
  }
  const scoreColor = score > 80 ? 'var(--emerald)' : score > 50 ? 'var(--amber)' : 'var(--rose)'

  return (
    <div style={{ maxWidth: 700 }}>
      {/* ── Wizard header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-dim)',
      }}>
        {[
          { n: 1, label: 'Target Room' },
          { n: 2, label: 'Audit Items' },
          { n: 3, label: 'Notes & Cost' },
          { n: 4, label: 'Generate Report' },
        ].map((s, i, arr) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: s.n < arr.length ? 'none' : 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: `1.5px solid ${step > s.n ? 'var(--emerald)' : step === s.n ? 'var(--blue)' : 'var(--border-mid)'}`,
              background: step > s.n ? 'var(--emerald)' : step === s.n ? 'var(--blue-dim)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              color: step > s.n ? '#fff' : step === s.n ? 'var(--blue)' : 'var(--text-disabled)',
              flexShrink: 0, transition: 'all 0.2s',
            }}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span style={{ fontSize: 11, color: step === s.n ? 'var(--text-primary)' : 'var(--text-tertiary)', flexShrink: 0 }}>
              {s.label}
            </span>
            {i < arr.length - 1 && (
              <div style={{
                flex: 1, height: 1, minWidth: 20,
                background: step > s.n ? 'var(--emerald)' : 'var(--border-dim)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 20 }}>

        {/* ── STEP 1: Target Room ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              Target Room Selection
              <div style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Block</label>
                <select value={blockId} onChange={e => setBlockId(e.target.value)} style={inputStyle}>
                  <option value="">Select…</option>
                  {blocks.map(b => (
                    <option key={b.id} value={b.id}>Block {b.code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Unit</label>
                <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. 101" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Room</label>
                <input value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. Room A" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Inspector Name</label>
              <input value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Staff member name" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Inspection Date</label>
                <input type="date" value={inspDate} onChange={e => setInspDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Student Being Checked Out</label>
                <select value={studentId} onChange={e => setStudentId(e.target.value)} style={inputStyle}>
                  <option value="">Select (optional)…</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} {s.student_number ? `· ${s.student_number}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Audit Items ── */}
        {step === 2 && (
          <div>
            {CATEGORIES.map(cat => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--text-secondary)',
                  marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {cat}
                  <div style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
                </div>
                {INSPECTION_ITEMS.filter(i => i.category === cat).map(item => {
                  const cond = conditions[item.key]?.condition
                  return (
                    <div key={item.key} style={{
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 'var(--r-md)',
                      border: `1px solid ${cond === 'Not_OK' ? 'var(--rose-ring)' : cond ? 'var(--border-mid)' : 'var(--border-dim)'}`,
                      background: cond === 'Not_OK' ? 'var(--rose-dim)' : 'var(--bg-raised)',
                      marginBottom: 6, transition: 'all 0.15s', flexDirection: 'column', gap: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(['OK_In', 'OK_Out', 'Not_OK'] as Condition[]).map(c => {
                            const labels = { OK_In: 'OK In', OK_Out: 'OK Out', Not_OK: '✕ Not OK' }
                            const colors = {
                              OK_In:  { active: 'var(--emerald)', activeBg: 'var(--emerald-dim)', activeRing: 'var(--emerald-ring)' },
                              OK_Out: { active: 'var(--blue)',    activeBg: 'var(--blue-dim)',    activeRing: 'var(--blue-ring)' },
                              Not_OK: { active: 'var(--rose)',    activeBg: 'var(--rose-dim)',    activeRing: 'var(--rose-ring)' },
                            }
                            const col = colors[c]
                            const isSelected = cond === c
                            return (
                              <button
                                key={c}
                                onClick={() => setCondition(item.key, c)}
                                style={{
                                  padding: '4px 10px', borderRadius: 'var(--r-sm)',
                                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                  border: `1px solid ${isSelected ? col.activeRing : 'var(--border-dim)'}`,
                                  background: isSelected ? col.activeBg : 'var(--bg-active)',
                                  color: isSelected ? col.active : 'var(--text-disabled)',
                                  transition: 'all 0.12s',
                                }}
                              >
                                {labels[c]}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      {cond === 'Not_OK' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, width: '100%' }}>
                          <input
                            placeholder="Describe the problem…"
                            value={conditions[item.key]?.problem ?? ''}
                            onChange={e => setProblem(item.key, e.target.value)}
                            style={{
                              background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
                              color: 'var(--text-primary)', padding: '7px 10px',
                              borderRadius: 'var(--r-sm)', fontSize: 12, fontFamily: 'inherit', outline: 'none',
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>R</span>
                            <input
                              type="number"
                              placeholder="Cost"
                              value={conditions[item.key]?.cost ?? ''}
                              onChange={e => setCost(item.key, parseFloat(e.target.value) || 0)}
                              style={{
                                width: 90, background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
                                color: 'var(--amber)', padding: '7px 10px',
                                borderRadius: 'var(--r-sm)', fontSize: 12,
                                fontFamily: 'JetBrains Mono, monospace', outline: 'none',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 3: Notes & Cost ── */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Inspector Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Additional observations, maintenance recommendations…"
                rows={4}
                style={{
                  ...inputStyle, resize: 'vertical', lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Damage summary */}
            <div style={{
              background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
              borderRadius: 'var(--r-md)', padding: 14, marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Damage Summary</div>
              {INSPECTION_ITEMS.filter(i => conditions[i.key]?.condition === 'Not_OK').map(item => (
                <div key={item.key} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0', borderBottom: '1px solid var(--border-dim)', fontSize: 12,
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {conditions[item.key]?.problem && (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{conditions[item.key].problem}</span>
                    )}
                    <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                      R {(conditions[item.key]?.cost ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              {INSPECTION_ITEMS.filter(i => conditions[i.key]?.condition === 'Not_OK').length === 0 && (
                <div style={{ color: 'var(--text-disabled)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                  No items marked as Not OK
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontWeight: 700 }}>
                <span>Total Damage Cost</span>
                <span style={{ color: 'var(--amber)', fontFamily: 'JetBrains Mono, monospace' }}>
                  R {totalDamage.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Recommended Deduction from Deposit (R)</label>
              <input
                type="number"
                value={deduction}
                onChange={e => setDeduction(e.target.value)}
                placeholder={totalDamage.toFixed(2)}
                style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', color: 'var(--amber)' }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 4: Review & Generate ── */}
        {step === 4 && (
          <div>
            {/* Condition score */}
            <div style={{
              textAlign: 'center', padding: 16,
              background: 'var(--bg-raised)', borderRadius: 'var(--r-md)',
              border: '1px solid var(--border-mid)', marginBottom: 16,
            }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor, letterSpacing: '-0.03em' }}>
                {score}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Room Condition Score · {okCount}/{allCount} Items OK
              </div>
            </div>

            {/* Summary */}
            {[
              ['Block / Unit / Room', `Block ${blocks.find(b => b.id === parseInt(blockId))?.code ?? '—'} · ${unit} · ${room}`],
              ['Inspector', inspectorName],
              ['Date', new Date(inspDate).toLocaleDateString('en-ZA')],
              ['Student', students.find(s => s.id === studentId)?.full_name ?? '—'],
              ['Total Damage Cost', `R ${totalDamage.toFixed(2)}`],
              ['Recommended Deduction', `R ${parseFloat(deduction || '0').toFixed(2)}`],
            ].map(([k, v]) => (
              <div key={k as string} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid var(--border-dim)', fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{v}</span>
              </div>
            ))}

            {/* Student signature */}
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Student Signature (name confirmation)</label>
              <input
                value={studentSig}
                onChange={e => setStudentSig(e.target.value)}
                placeholder="Student full name as signature"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                padding: '8px 16px', borderRadius: 'var(--r-md)',
                background: 'transparent', border: '1px solid var(--border-mid)',
                color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={() => canAdvance() ? setStep(s => s + 1) : undefined}
              disabled={!canAdvance()}
              style={{
                padding: '8px 20px', borderRadius: 'var(--r-md)',
                background: canAdvance() ? 'var(--blue)' : 'var(--bg-raised)',
                color: canAdvance() ? '#fff' : 'var(--text-disabled)',
                border: `1px solid ${canAdvance() ? 'var(--blue)' : 'var(--border-dim)'}`,
                fontSize: 13, fontWeight: 600, cursor: canAdvance() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              {step === 3 ? 'Review Report →' : 'Next →'}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isPending}
              style={{
                padding: '8px 20px', borderRadius: 'var(--r-md)',
                background: 'var(--emerald)', color: '#fff',
                border: '1px solid var(--emerald)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                opacity: isPending ? 0.5 : 1,
              }}
            >
              {isPending ? 'Generating…' : '📄 Finalise & Generate Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
