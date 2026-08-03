'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X, Wrench } from 'lucide-react'

const CATEGORIES = ['Plumbing', 'Electrical', 'Furniture', 'Appliance', 'Structural', 'Pest Control', 'Other']

interface Student { id: string; full_name: string; student_number: string }
interface Room    { id: number; room_number: string; units: any }
interface Worker  { id: string; full_name: string }

export default function NewTicketModal({ students, rooms, workers }: { students: Student[]; rooms: Room[]; workers: Worker[] }) {
  const [open, setOpen] = useState(false)
  const [roomId, setRoomId] = useState<number | ''>('')
  const [studentId, setStudentId] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [workerId, setWorkerId] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  function reset() {
    setOpen(false); setRoomId(''); setStudentId(''); setCategory(''); setDescription(''); setWorkerId(''); setError('')
  }

  async function handleCreate() {
    if (!roomId || !category || !description.trim()) {
      setError('Room, category, and description are required'); return
    }
    setPending(true); setError('')

    const { error: insertErr } = await supabase.from('maintenance_requests').insert({
      room_id: roomId,
      student_id: studentId || null,
      category,
      description,
      ...(workerId ? { assigned_to: workerId, status: 'assigned', assigned_at: new Date().toISOString() } : {}),
    })

    if (insertErr) { setError(insertErr.message); setPending(false); return }

    setPending(false)
    reset()
    router.refresh()
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '9px 12px', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }

  return (
    <>
      <button onClick={() => setOpen(true)} className="glass-btn group" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontSize: 13, fontWeight: 600 }}>
        <Plus className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> New Ticket
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={e => e.target === e.currentTarget && reset()}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', animation: 'none' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>New Maintenance Ticket</div>
              <button onClick={reset} className="group" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {error && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }}>{error}</div>}

              <div>
                <label style={lbl}>ROOM *</label>
                <select value={roomId} onChange={e => setRoomId(Number(e.target.value))} style={inp}>
                  <option value="">Select room…</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>Block {r.units?.blocks?.code} · Unit {r.units?.unit_code} · {r.room_number}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>REPORTED BY (optional)</label>
                <select value={studentId} onChange={e => setStudentId(e.target.value)} style={inp}>
                  <option value="">No specific student (staff-observed)</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.student_number ? `· ${s.student_number}` : ''}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>CATEGORY *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)} style={{ padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: category === c ? 'rgba(59,130,246,0.2)' : '#27272a', color: category === c ? '#3b82f6' : '#a1a1aa', border: `1px solid ${category === c ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>DESCRIPTION *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What's wrong, and where?" style={{ ...inp, resize: 'vertical' }} />
              </div>

              <div>
                <label style={lbl}>ASSIGN TO (optional)</label>
                <select value={workerId} onChange={e => setWorkerId(e.target.value)} style={inp} disabled={workers.length === 0}>
                  <option value="">{workers.length === 0 ? 'No maintenance workers yet' : 'Leave unassigned (open ticket)'}</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                </select>
              </div>

              <button onClick={handleCreate} disabled={pending} className="glass-btn group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: pending ? 0.5 : 1, marginTop: 4 }}>
                <Wrench className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> {pending ? 'Creating…' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
