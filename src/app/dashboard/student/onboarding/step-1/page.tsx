'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Step1Page() {
  const [fullName, setFullName]     = useState('')
  const [studentNo, setStudentNo]   = useState('')
  const [idNumber, setIdNumber]     = useState('')
  const [phone, setPhone]           = useState('')
  const [faculty, setFaculty]       = useState('')
  const [course, setCourse]         = useState('')
  const [yearStudy, setYearStudy]   = useState('')
  const [yearType, setYearType]     = useState('first_year')
  const [funding, setFunding]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    if (!fullName.trim()) { setError('Full name is required'); return }
    setLoading(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    const { error: err } = await supabase.from('profiles').update({ full_name: fullName, student_number: studentNo || null, id_number: idNumber || null, phone: phone || null, faculty: faculty || null, course: course || null, year_of_study: yearStudy ? parseInt(yearStudy) : null, student_year_type: yearType as any, funding_type: funding || null, updated_at: new Date().toISOString() }).eq('id', session.user.id)
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard/student/onboarding/step-4')
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }

  return (
    <div style={{ padding: 28, maxWidth: 540 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3b82f6', marginBottom: 6 }}>Step 1 of 4</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Personal Details</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>This information will be used for your residency record.</p>

      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lbl}>Full Name *</label><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="First name & surname" style={inp} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>Student Number</label><input value={studentNo} onChange={e => setStudentNo(e.target.value)} placeholder="e.g. 123456789" style={{ ...inp, fontFamily: 'monospace' }} /></div>
          <div><label style={lbl}>SA ID / Passport</label><input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="ID number" style={{ ...inp, fontFamily: 'monospace' }} /></div>
        </div>
        <div><label style={lbl}>Phone Number</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 00 000 0000" style={inp} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>Faculty</label><input value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="e.g. Engineering" style={inp} /></div>
          <div><label style={lbl}>Course</label><input value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. BSc Computer Science" style={inp} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>Year of Study</label><select value={yearStudy} onChange={e => setYearStudy(e.target.value)} style={inp}><option value="">Select…</option>{[1,2,3,4,5,6,7].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          <div><label style={lbl}>Student Type</label><select value={yearType} onChange={e => setYearType(e.target.value)} style={inp}><option value="first_year">First Year</option><option value="senior">Senior</option></select></div>
          <div><label style={lbl}>Funding</label><select value={funding} onChange={e => setFunding(e.target.value)} style={inp}><option value="">Select…</option><option value="NSFAS">NSFAS</option><option value="Bursary">Bursary</option><option value="Private">Private</option><option value="TUT_Funded">TUT Funded</option></select></div>
        </div>

        {error && <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }}>{error}</div>}

        <button onClick={handleSave} disabled={loading} style={{ padding: '11px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Saving…' : 'Save & Continue →'}
        </button>
      </div>
    </div>
  )
}
