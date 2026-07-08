'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Student { id: string; full_name: string; student_number: string }

export default function TransitForm({ students }: { students: Student[] }) {
  const [direction, setDirection] = useState<'exit'|'entry'>('exit')
  const [studentId, setStudentId] = useState('')
  const [destination, setDestination] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [keyNumber, setKeyNumber] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit() {
    if (!studentId) { setError('Please select a student'); return }
    if (direction === 'exit' && !destination) { setError('Please enter destination'); return }
    setError('')
    startTransition(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: lease } = await supabase.from('leases').select('id').eq('student_id', studentId).eq('is_active', true).limit(1).maybeSingle()
      await supabase.from('boundary_transits').insert({
        student_id: studentId,
        lease_id: lease?.id ?? null,
        direction,
        destination: destination || null,
        expected_return: expectedReturn ? new Date(expectedReturn).toISOString() : null,
        key_number: keyNumber || null,
        key_handed_over: direction === 'exit' && !!keyNumber,
        key_returned: direction === 'entry' && !!keyNumber,
        logged_by: session?.user.id,
      })
      setStudentId(''); setDestination(''); setExpectedReturn(''); setKeyNumber('')
      router.refresh()
    })
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '9px 12px', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }

  return (
    <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Log New Transit</div>

      {/* Direction toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {(['exit','entry'] as const).map(d => (
          <button key={d} onClick={() => setDirection(d)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: direction === d ? (d === 'exit' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)') : 'transparent', color: direction === d ? (d === 'exit' ? '#f59e0b' : '#10b981') : '#71717a', borderColor: direction === d ? (d === 'exit' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)') : 'rgba(255,255,255,0.08)' }}>
            {d === 'exit' ? '→ Exit' : '← Entry'}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>STUDENT</label>
        <select value={studentId} onChange={e => setStudentId(e.target.value)} style={inp}>
          <option value="">Select student…</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.student_number ? `· ${s.student_number}` : ''}</option>)}
        </select>
      </div>

      {direction === 'exit' && (
        <>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>DESTINATION</label>
            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Family visit — Pretoria" style={inp} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>EXPECTED RETURN</label>
            <input type="datetime-local" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} style={inp} />
          </div>
        </>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>KEY NUMBER (optional)</label>
        <input value={keyNumber} onChange={e => setKeyNumber(e.target.value)} placeholder="e.g. A01-K1" style={{ ...inp, fontFamily: 'monospace' }} />
      </div>

      {error && <div style={{ fontSize: 11, color: '#f43f5e', marginBottom: 10 }}>{error}</div>}

      <button onClick={handleSubmit} disabled={pending} style={{ width: '100%', padding: '10px', borderRadius: 8, background: direction === 'exit' ? '#f59e0b' : '#10b981', color: direction === 'exit' ? '#000' : '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.5 : 1 }}>
        {pending ? 'Logging…' : `Log ${direction === 'exit' ? 'Departure' : 'Return'}`}
      </button>
    </div>
  )
}
