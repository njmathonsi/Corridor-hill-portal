'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ApplyPage() {
  const [preferredBlock, setBlock]   = useState('A')
  const [preferredRoom, setRoom]     = useState('Single')
  const [academicAvg, setAvg]        = useState('')
  const [sport, setSport]            = useState('')
  const [cultural, setCultural]      = useState('')
  const [leadership, setLeadership]  = useState('')
  const [medical, setMedical]        = useState('')
  const [disability, setDisability]  = useState('')
  const [yearType, setYearType]      = useState('senior')
  const [loading, setLoading]        = useState(false)
  const [error, setError]            = useState('')
  const [success, setSuccess]        = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  async function handleSubmit() {
    setLoading(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { data: existing } = await supabase
      .from('applications')
      .select('id, status')
      .eq('student_id', session.user.id)
      .eq('academic_year', '2026')
      .maybeSingle()

    if (existing && existing.status !== 'rejected') {
      setError('You already have an active application for 2026.')
      setLoading(false); return
    }

    const payload = {
      student_id: session.user.id,
      academic_year: '2026',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      preferred_block: preferredBlock,
      preferred_room_type: preferredRoom,
      current_academic_average: yearType === 'senior' && academicAvg ? parseFloat(academicAvg) : null,
      sport_achievements: sport || null,
      cultural_achievements: cultural || null,
      leadership_roles: leadership || null,
      medical_conditions: medical || null,
      disability_info: disability || null,
    }

    const { error: err } = existing
      ? await supabase.from('applications').update(payload).eq('id', existing.id)
      : await supabase.from('applications').insert(payload)

    if (err) { setError(err.message); setLoading(false); return }
    await supabase.from('profiles').update({ student_year_type: yearType as any }).eq('id', session.user.id)
    setSuccess(true); setLoading(false)
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }

  if (success) return (
    <div style={{ padding: 28, maxWidth: 540 }}>
      <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 14 }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>Application Submitted!</div>
        <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 24, lineHeight: 1.7 }}>Your application for 2026 has been submitted.<br />Management will review and assign your room shortly.</div>
        <button onClick={() => router.push('/dashboard/student/home')} style={{ padding: '10px 28px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Back to Dashboard</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 28, maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Apply for Accommodation</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Academic Year 2026 · Corridor Hill Residence · eMalahleni</p>

      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div>
          <label style={lbl}>I AM A</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{val:'first_year',label:'First Year'},{val:'senior',label:'Senior Student'}].map(opt => (
              <button key={opt.val} onClick={() => setYearType(opt.val)} style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: yearType === opt.val ? 'rgba(59,130,246,0.15)' : 'transparent', color: yearType === opt.val ? '#3b82f6' : '#71717a', borderColor: yearType === opt.val ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {yearType === 'senior' && (
          <div>
            <label style={lbl}>CURRENT ACADEMIC AVERAGE (%)</label>
            <input type="number" min="0" max="100" value={academicAvg} onChange={e => setAvg(e.target.value)} placeholder="e.g. 72.5" style={{ ...inp, color: '#10b981' }} />
          </div>
        )}

        {yearType === 'first_year' && (
          <>
            <div><label style={lbl}>SPORT ACHIEVEMENTS (optional)</label><input value={sport} onChange={e => setSport(e.target.value)} placeholder="e.g. Provincial soccer player" style={inp} /></div>
            <div><label style={lbl}>CULTURAL ACHIEVEMENTS (optional)</label><input value={cultural} onChange={e => setCultural(e.target.value)} placeholder="e.g. School choir, drama" style={inp} /></div>
            <div><label style={lbl}>LEADERSHIP ROLES (optional)</label><input value={leadership} onChange={e => setLeadership(e.target.value)} placeholder="e.g. SRC President, class rep" style={inp} /></div>
            <div><label style={lbl}>MEDICAL CONDITIONS (optional)</label><input value={medical} onChange={e => setMedical(e.target.value)} placeholder="Any relevant medical conditions" style={inp} /></div>
            <div><label style={lbl}>DISABILITY INFORMATION (optional)</label><input value={disability} onChange={e => setDisability(e.target.value)} placeholder="Any disability accommodations needed" style={inp} /></div>
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={lbl}>PREFERRED BLOCK</label>
            <select value={preferredBlock} onChange={e => setBlock(e.target.value)} style={inp}>
              {['A','B','C','D','E','F'].map(b => <option key={b} value={b}>Block {b}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>PREFERRED ROOM TYPE</label>
            <select value={preferredRoom} onChange={e => setRoom(e.target.value)} style={inp}>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
            </select>
          </div>
        </div>

        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', fontSize: 12, color: '#71717a', lineHeight: 1.6 }}>
          ℹ️ Room preferences are noted but management makes the final assignment. All applications are reviewed before approval.
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{ padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Submitting…' : '📥 Submit Application'}
        </button>
      </div>
    </div>
  )
}
