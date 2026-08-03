'use client'
import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X, Check, AlertTriangle, ArrowLeft, ArrowRight, ClipboardList, LogIn, LogOut, Camera, PenTool } from 'lucide-react'
import { quickClientCheck } from '@/lib/validation/fileValidation'

const ITEMS = [
  { key: 'main_door_handle', name: 'Main Door Handle',    cat: 'Entry' },
  { key: 'door_frame',       name: 'Door Frame',          cat: 'Entry' },
  { key: 'bed_base',         name: 'Bed Base',            cat: 'Bedroom' },
  { key: 'mattress',         name: 'Mattress',            cat: 'Bedroom' },
  { key: 'study_desk',       name: 'Study Desk',          cat: 'Bedroom' },
  { key: 'study_chair',      name: 'Study Chair',         cat: 'Bedroom' },
  { key: 'wardrobe',         name: 'Wardrobe',            cat: 'Bedroom' },
  { key: 'blinds',           name: 'Blinds / Curtains',   cat: 'Bedroom' },
  { key: 'walls',            name: 'Walls',               cat: 'Bedroom' },
  { key: 'flooring',         name: 'Flooring',            cat: 'Bedroom' },
  { key: 'basin',            name: 'Bathroom Basin',      cat: 'Bathroom' },
  { key: 'basin_taps',       name: 'Taps (Basin)',        cat: 'Bathroom' },
  { key: 'shower_head',      name: 'Shower Head',         cat: 'Bathroom' },
  { key: 'toilet_bowl',      name: 'Toilet Bowl',         cat: 'Bathroom' },
  { key: 'toilet_flush',     name: 'Toilet Flush Handle', cat: 'Bathroom' },
  { key: 'towel_rail',       name: 'Towel Rail',          cat: 'Bathroom' },
  { key: 'soap_holder',      name: 'Soap Holder',         cat: 'Bathroom' },
  { key: 'mirror',           name: 'Mirror',              cat: 'Bathroom' },
  { key: 'window_frame',     name: 'Window Frame',        cat: 'Windows' },
  { key: 'window_glass',     name: 'Window Glass',        cat: 'Windows' },
  { key: 'facia_board',      name: 'Facia Board',         cat: 'Windows' },
  { key: 'light_fittings',   name: 'Light Fittings',      cat: 'Fixtures' },
]

type InspType = 'move_in' | 'move_out'
type Cond = 'OK_In' | 'OK_Out' | 'Not_OK'
type CondMap = Record<string, { cond?: Cond; problem?: string; cost?: number; photos?: File[] }>
type PrevItem = { condition_in: string | null; problem_description: string | null }

interface Student { id: string; full_name: string; student_number: string }
interface Room    { id: number; room_number: string; units: any }

export default function NewInspectionModal({ students, rooms }: { students: Student[]; rooms: Room[] }) {
  const [open, setOpen]           = useState(false)
  const [step, setStep]           = useState(1)
  const [inspType, setInspType]   = useState<InspType>('move_out')
  const [roomId, setRoomId]       = useState<number|''>('')
  const [studentId, setStudentId] = useState('')
  const [inspector, setInspector] = useState('')
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0])
  const [conditions, setConditions] = useState<CondMap>({})
  const [notes, setNotes]         = useState('')
  const [deduction, setDeduction] = useState('')
  const [inspectorSig, setInspectorSig] = useState('')
  const [studentSig, setStudentSig]     = useState('')
  const [prevMoveIn, setPrevMoveIn]     = useState<{ date: string; items: Record<string, PrevItem> } | null>(null)
  const [prevLoading, setPrevLoading]   = useState(false)
  const [pending, startTransition]= useTransition()
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [success, setSuccess]     = useState('')
  const supabase = createClient()
  const router   = useRouter()

  const okValue: Cond = inspType === 'move_in' ? 'OK_In' : 'OK_Out'
  const categories = [...new Set(ITEMS.map(i => i.cat))]
  const totalDamage = Object.values(conditions).filter(v => v.cond === 'Not_OK').reduce((sum, v) => sum + (v.cost ?? 0), 0)
  const okCount = ITEMS.filter(i => conditions[i.key]?.cond !== 'Not_OK').length

  function setCond(key: string, cond: Cond) { setConditions(p => ({ ...p, [key]: { ...p[key], cond } })) }
  function setProblem(key: string, problem: string) { setConditions(p => ({ ...p, [key]: { ...p[key], problem } })) }
  function setCost(key: string, cost: number) { setConditions(p => ({ ...p, [key]: { ...p[key], cost } })) }
  function addPhotos(key: string, files: FileList | null) {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    for (const f of arr) {
      const check = quickClientCheck(f)
      if (!check.valid) { alert(check.error); return }
    }
    setConditions(p => ({ ...p, [key]: { ...p[key], photos: [...(p[key]?.photos ?? []), ...arr] } }))
  }
  function flagPreExisting(key: string) {
    setConditions(p => ({ ...p, [key]: { ...p[key], cond: 'Not_OK', cost: 0, problem: p[key]?.problem || 'Pre-existing damage from move-in (not charged)' } }))
  }

  // When logging a move-out, pull the room's most recent move-in report so we can
  // diff conditions and flag damage that already existed before this tenant moved in.
  useEffect(() => {
    if (inspType !== 'move_out' || !roomId) { setPrevMoveIn(null); return }
    let cancelled = false
    setPrevLoading(true)
    ;(async () => {
      let q = supabase
        .from('inspection_reports')
        .select('inspection_date, inspection_line_items(item_name, condition_in, problem_description)')
        .eq('room_id', roomId)
        .eq('inspection_type', 'move_in')
        .order('inspection_date', { ascending: false })
        .limit(1)
      if (studentId) q = q.eq('student_id', studentId)
      const { data } = await q.maybeSingle()
      if (cancelled) return
      if (data) {
        const items: Record<string, PrevItem> = {}
        for (const li of (data.inspection_line_items ?? []) as any[]) {
          items[li.item_name] = { condition_in: li.condition_in, problem_description: li.problem_description }
        }
        setPrevMoveIn({ date: data.inspection_date, items })
      } else {
        setPrevMoveIn(null)
      }
      setPrevLoading(false)
    })()
    return () => { cancelled = true }
  }, [inspType, roomId, studentId])

  function closeAndReset() {
    setOpen(false); setStep(1); setInspType('move_out'); setRoomId(''); setStudentId(''); setInspector('')
    setDate(new Date().toISOString().split('T')[0]); setConditions({}); setNotes(''); setDeduction('')
    setInspectorSig(''); setStudentSig(''); setPrevMoveIn(null); setSuccess('')
  }

  async function handleSubmit() {
    if (!roomId || !inspector) return
    startTransition(async () => {
      const { data: { session } } = await supabase.auth.getSession()

      const { data: report, error } = await supabase
        .from('inspection_reports')
        .insert({
          room_id: roomId,
          student_id: studentId || null,
          template_id: 1,
          inspection_type: inspType,
          inspection_date: date,
          inspector_name: inspector,
          inspector_user_id: session?.user.id,
          total_damage_cost: inspType === 'move_out' ? totalDamage : 0,
          recommended_deduction: inspType === 'move_out' ? parseFloat(deduction || '0') : 0,
          inspector_signature: inspectorSig || null,
          student_signature: studentSig || null,
          is_finalised: true,
          finalised_at: new Date().toISOString(),
          signed_at: (inspectorSig || studentSig) ? new Date().toISOString() : null,
          notes,
        })
        .select('id, report_ref')
        .single()

      if (error || !report) return

      const lineItems = ITEMS.map((item, idx) => {
        const c = conditions[item.key]
        const base: any = {
          report_id: report.id,
          item_name: item.name,
          category: item.cat,
          problem_description: c?.problem ?? null,
          repair_cost_estimate: c?.cost ?? 0,
          sort_order: idx,
        }
        if (inspType === 'move_in') {
          base.condition_in = c?.cond ?? 'OK_In'
        } else {
          base.condition_out = c?.cond ?? 'OK_Out'
          base.condition_in = prevMoveIn?.items[item.name]?.condition_in ?? null
        }
        return base
      })
      const { data: insertedItems } = await supabase.from('inspection_line_items').insert(lineItems).select('id, item_name')

      // Photos are uploaded last, keyed back to the just-inserted line item by item_name
      const withPhotos = ITEMS.filter(item => (conditions[item.key]?.photos?.length ?? 0) > 0)
      if (withPhotos.length > 0 && insertedItems) {
        setUploadingPhotos(true)
        for (const item of withPhotos) {
          const row = (insertedItems as any[]).find(r => r.item_name === item.name)
          if (!row) continue
          const files = conditions[item.key].photos!
          const paths: string[] = []
          for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const ext = file.name.split('.').pop() || 'jpg'
            const path = `${report.id}/${item.key}/${Date.now()}-${i}.${ext}`
            const { error: upErr } = await supabase.storage.from('inspection-photos').upload(path, file)
            if (!upErr) paths.push(path)
          }
          if (paths.length > 0) {
            await supabase.from('inspection_line_items').update({ photo_urls: paths }).eq('id', row.id)
          }
        }
        setUploadingPhotos(false)
      }

      setSuccess(`Report ${report.report_ref} created successfully!`)
      setTimeout(() => { closeAndReset(); router.refresh() }, 2000)
    })
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '9px 12px', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }

  return (
    <>
      <button onClick={() => setOpen(true)} className="glass-btn group" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontSize: 13, fontWeight: 600 }}>
        <Plus className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> New Inspection
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={e => e.target === e.currentTarget && closeAndReset()}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'none' }}>
            {/* Header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>New Inspection</div>
                <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Step {step} of 3</div>
              </div>
              <button onClick={closeAndReset} className="group" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Step indicators */}
            <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}>
              {[{n:1,l:'Room & Inspector'},{n:2,l:'Item Checklist'},{n:3,l:'Review & Submit'}].map(s => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: step > s.n ? '#10b981' : step === s.n ? 'rgba(59,130,246,0.2)' : '#27272a', color: step > s.n ? '#fff' : step === s.n ? '#3b82f6' : '#71717a', border: `1.5px solid ${step > s.n ? '#10b981' : step === s.n ? '#3b82f6' : 'rgba(255,255,255,0.1)'}` }}>
                    {step > s.n ? <Check className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> : s.n}
                  </div>
                  <span style={{ fontSize: 11, color: step === s.n ? '#fafafa' : '#71717a' }}>{s.l}</span>
                  {s.n < 3 && <div style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />}
                </div>
              ))}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
              {success && <div style={{ padding: '12px 16px', borderRadius: 8, fontSize: 13, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', marginBottom: 16 }}>{success}</div>}

              {/* Step 1 */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={lbl}>INSPECTION TYPE</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['move_out', 'move_in'] as InspType[]).map(t => (
                        <button key={t} onClick={() => setInspType(t)} className="glass-btn group" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: inspType === t ? (t === 'move_out' ? 'rgba(245,158,11,0.18)' : 'rgba(59,130,246,0.18)') : 'transparent', color: inspType === t ? (t === 'move_out' ? '#f59e0b' : '#3b82f6') : '#71717a', border: `1px solid ${inspType === t ? (t === 'move_out' ? 'rgba(245,158,11,0.4)' : 'rgba(59,130,246,0.4)') : 'rgba(255,255,255,0.08)'}` }}>
                          {t === 'move_out' ? <LogOut className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> : <LogIn className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />}
                          {t === 'move_out' ? 'Move-Out' : 'Move-In'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>ROOM</label>
                    <select value={roomId} onChange={e => setRoomId(Number(e.target.value))} style={inp}>
                      <option value="">Select room…</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>Block {r.units?.blocks?.code} · Unit {r.units?.unit_code} · {r.room_number}</option>)}
                    </select>
                  </div>
                  {inspType === 'move_out' && roomId && (
                    prevLoading ? (
                      <div style={{ fontSize: 11, color: '#71717a' }}>Checking for a move-in report…</div>
                    ) : prevMoveIn ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <Check className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Comparing against move-in report from {new Date(prevMoveIn.date).toLocaleDateString('en-ZA')}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f59e0b', padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                        <AlertTriangle className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> No move-in report found for this room — pre-existing damage can't be verified
                      </div>
                    )
                  )}
                  <div>
                    <label style={lbl}>STUDENT (optional)</label>
                    <select value={studentId} onChange={e => setStudentId(e.target.value)} style={inp}>
                      <option value="">Select student…</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.student_number ? `· ${s.student_number}` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>INSPECTOR NAME</label>
                    <input value={inspector} onChange={e => setInspector(e.target.value)} placeholder="Staff member name" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>INSPECTION DATE</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div>
                  {categories.map(cat => (
                    <div key={cat} style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{cat}</div>
                      {ITEMS.filter(i => i.cat === cat).map(item => {
                        const cond = conditions[item.key]?.cond
                        const photos = conditions[item.key]?.photos ?? []
                        const wasPreExisting = inspType === 'move_out' && prevMoveIn?.items[item.name]?.condition_in === 'Not_OK'
                        return (
                          <div key={item.key} style={{ marginBottom: 6 }}>
                            {wasPreExisting && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#f59e0b', marginBottom: 2, padding: '0 4px' }}>
                                <AlertTriangle size={12} color="#f59e0b" /> Already Not OK at move-in
                                {cond !== 'Not_OK' && (
                                  <button onClick={() => flagPreExisting(item.key)} style={{ marginLeft: 4, fontSize: 10, color: '#f59e0b', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
                                    flag as pre-existing
                                  </button>
                                )}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: cond === 'Not_OK' ? 'rgba(244,63,94,0.08)' : '#27272a', border: `1px solid ${cond === 'Not_OK' ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                              <span style={{ fontSize: 12, color: '#fafafa' }}>{item.name}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: 10, color: photos.length ? '#3b82f6' : '#71717a' }}>
                                  <input type="file" accept=".png,.jpg,.jpeg,.pdf" multiple style={{ display: 'none' }} onChange={e => { addPhotos(item.key, e.target.files); e.target.value = '' }} />
                                  <Camera size={14} /> {photos.length > 0 ? photos.length : ''}
                                </label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {([okValue, 'Not_OK'] as Cond[]).map(c => (
                                    <button key={c} onClick={() => setCond(item.key, c)} className="glass-btn group" style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: cond === c ? (c !== 'Not_OK' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)') : 'transparent', color: cond === c ? (c !== 'Not_OK' ? '#10b981' : '#f43f5e') : '#71717a', border: `1px solid ${cond === c ? (c !== 'Not_OK' ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)') : 'rgba(255,255,255,0.08)'}` }}>
                                      {c !== 'Not_OK' ? <><Check className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> OK</> : <><X className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Not OK</>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {cond === 'Not_OK' && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, marginTop: 4, padding: '0 4px' }}>
                                <input placeholder="Describe the problem…" value={conditions[item.key]?.problem ?? ''} onChange={e => setProblem(item.key, e.target.value)} style={{ ...inp, fontSize: 11, padding: '6px 10px' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 11, color: '#71717a' }}>R</span>
                                  <input type="number" placeholder="Cost" value={conditions[item.key]?.cost ?? ''} onChange={e => setCost(item.key, parseFloat(e.target.value) || 0)} style={{ ...inp, width: 80, fontSize: 11, padding: '6px 8px', color: '#f59e0b', fontFamily: 'monospace' }} />
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

              {/* Step 3 */}
              {step === 3 && (
                <div>
                  {/* Score */}
                  <div style={{ textAlign: 'center', padding: 16, background: '#27272a', borderRadius: 10, marginBottom: 16 }}>
                    <div style={{ fontSize: 40, fontWeight: 800, color: okCount / ITEMS.length > 0.8 ? '#10b981' : okCount / ITEMS.length > 0.5 ? '#f59e0b' : '#f43f5e' }}>
                      {Math.round((okCount / ITEMS.length) * 100)}%
                    </div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>Room Condition Score · {okCount}/{ITEMS.length} Items OK</div>
                  </div>

                  {/* Damage summary — move-out only */}
                  {inspType === 'move_out' && ITEMS.filter(i => conditions[i.key]?.cond === 'Not_OK').length > 0 && (
                    <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#f43f5e', marginBottom: 8 }}>
                        <AlertTriangle className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Damaged Items
                      </div>
                      {ITEMS.filter(i => conditions[i.key]?.cond === 'Not_OK').map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid rgba(244,63,94,0.15)' }}>
                          <span style={{ color: '#fafafa' }}>{item.name}</span>
                          <div style={{ display: 'flex', gap: 10 }}>
                            {conditions[item.key]?.problem && <span style={{ color: '#71717a' }}>{conditions[item.key].problem}</span>}
                            <span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: 'monospace' }}>R {(conditions[item.key]?.cost ?? 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700, fontSize: 13 }}>
                        <span>Total Damage</span>
                        <span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>R {totalDamage.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 12 }}>
                    <label style={lbl}>INSPECTOR NOTES</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional observations…" rows={3} style={{ ...inp, resize: 'vertical' }} />
                  </div>
                  {inspType === 'move_out' && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={lbl}>RECOMMENDED DEDUCTION (R)</label>
                      <input type="number" value={deduction} onChange={e => setDeduction(e.target.value)} placeholder={totalDamage.toFixed(2)} style={{ ...inp, color: '#f59e0b', fontFamily: 'monospace' }} />
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: '#71717a', marginBottom: 8, letterSpacing: '0.06em' }}>
                      <PenTool size={13} /> SIGN-OFF (type full name to sign)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={lbl}>INSPECTOR SIGNATURE</label>
                        <input value={inspectorSig} onChange={e => setInspectorSig(e.target.value)} placeholder={inspector || 'Full name'} style={{ ...inp, fontStyle: 'italic' }} />
                      </div>
                      <div>
                        <label style={lbl}>STUDENT SIGNATURE</label>
                        <input value={studentSig} onChange={e => setStudentSig(e.target.value)} placeholder="Full name (optional)" style={{ ...inp, fontStyle: 'italic' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              {step > 1 ? (
                <button onClick={() => setStep(s => s - 1)} className="glass-btn group" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, fontSize: 12 }}>
                  <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && (!roomId || !inspector)} className="glass-btn group" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 20px', borderRadius: 8, background: (step === 1 && (!roomId || !inspector)) ? '#27272a' : '#3b82f6', color: (step === 1 && (!roomId || !inspector)) ? '#52525b' : '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: (step === 1 && (!roomId || !inspector)) ? 'not-allowed' : 'pointer' }}>
                  Next <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={pending} className="glass-btn group" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: pending ? 0.5 : 1 }}>
                  {pending ? (uploadingPhotos ? 'Uploading photos…' : 'Saving…') : <><ClipboardList className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Finalise Report</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
