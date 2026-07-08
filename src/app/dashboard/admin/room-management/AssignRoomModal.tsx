'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Student { id: string; full_name: string; student_number: string; course: string | null }

export default function AssignRoomModal({ roomId, roomNumber, blockCode, students }: { roomId: number; roomNumber: string; blockCode: string; students: Student[] }) {
  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [keyNumber, setKeyNumber] = useState('')
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function handleAssign() {
    if (!studentId) return
    startTransition(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      // Deactivate old lease
      await supabase.from('leases').update({ is_active: false }).eq('student_id', studentId).eq('is_active', true)
      // Create new lease
      await supabase.from('leases').insert({
        student_id: studentId,
        room_id: roomId,
        lease_status: 'Checked-In',
        academic_year: new Date().getFullYear().toString(),
        lease_start_date: leaseStart || new Date().toISOString().split('T')[0],
        lease_end_date: leaseEnd || null,
        check_in_date: new Date().toISOString(),
        assigned_key_number: keyNumber || null,
        key_issued_at: keyNumber ? new Date().toISOString() : null,
        assigned_by: session?.user.id,
        is_active: true,
      })
      // Mark room occupied
      await supabase.from('rooms').update({ is_available: false }).eq('id', roomId)
      setOpen(false); setStudentId(''); setKeyNumber(''); setLeaseStart(''); setLeaseEnd('')
      router.refresh()
    })
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '8px 10px', borderRadius: 6, fontSize: 11, outline: 'none', boxSizing: 'border-box' }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
        + Assign
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Assign Room</div>
                <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Block {blockCode} · {roomNumber}</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>STUDENT</label>
              <select value={studentId} onChange={e => setStudentId(e.target.value)} style={inp}>
                <option value="">Select student…</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.student_number ? `· ${s.student_number}` : ''}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>KEY NUMBER</label>
              <input value={keyNumber} onChange={e => setKeyNumber(e.target.value)} placeholder={`e.g. ${blockCode}01-K1`} style={{ ...inp, fontFamily: 'monospace' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>LEASE START</label>
                <input type="date" value={leaseStart} onChange={e => setLeaseStart(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>LEASE END</label>
                <input type="date" value={leaseEnd} onChange={e => setLeaseEnd(e.target.value)} style={inp} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setOpen(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAssign} disabled={!studentId || pending} style={{ flex: 2, padding: '9px', borderRadius: 8, background: studentId ? '#10b981' : '#27272a', color: studentId ? '#fff' : '#52525b', border: 'none', fontSize: 13, fontWeight: 700, cursor: studentId ? 'pointer' : 'not-allowed', opacity: pending ? 0.5 : 1 }}>
                {pending ? 'Assigning…' : '✓ Assign & Check In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
