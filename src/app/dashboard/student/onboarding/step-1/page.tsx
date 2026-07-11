'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Step1Page() {
  const [fullName,  setFullName]  = useState('')
  const [studentNo, setStudentNo] = useState('')
  const [idNumber,  setIdNumber]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [faculty,   setFaculty]   = useState('')
  const [course,    setCourse]    = useState('')
  const [yearStudy, setYearStudy] = useState('')
  const [yearType,  setYearType]  = useState('first_year')
  const [funding,   setFunding]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) {
        setFullName(data.full_name ?? '')
        setStudentNo(data.student_number ?? '')
        setIdNumber(data.id_number ?? '')
        setPhone(data.phone ?? '')
        setFaculty(data.faculty ?? '')
        setCourse(data.course ?? '')
        setYearStudy(data.year_of_study?.toString() ?? '')
        setYearType(data.student_year_type ?? 'first_year')
        setFunding(data.funding_type ?? '')
      }
    }
    load()
  }, [])

  async function handleSave() {
    if (!fullName.trim()) { setError('Full name is required'); return }
    setLoading(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    const { error: err } = await supabase.from('profiles').update({
      full_name:        fullName,
      student_number:   studentNo || null,
      id_number:        idNumber || null,
      phone:            phone || null,
      faculty:          faculty || null,
      course:           course || null,
      year_of_study:    yearStudy ? parseInt(yearStudy) : null,
      student_year_type: yearType as any,
      funding_type:     funding || null,
      updated_at:       new Date().toISOString(),
    }).eq('id', session.user.id)
    if (err) { setError(err.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard/student/home'), 1500)
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }

  return (
    <div style={{ padding: 28, maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>My Profile</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Update your personal details for your residency record.</p>

      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lbl}>FULL NAME *</label><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="First name & surname" style={inp} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>STUDENT NUMBER</label><input value={studentNo} onChange={e => setStudentNo(e.target.value)} placeholder="e.g. 219045123" style={{ ...inp, fontFamily: 'monospace' }} /></div>
          <div><label style={lbl}>SA ID / PASSPORT</label><input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="ID number" style={{ ...inp, fontFamily: 'monospace' }} /></div>
        </div>
        <div><label style={lbl}>PHONE NUMBER</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 00 000 0000" style={inp} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>FACULTY</label><input value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="e.g. Engineering" style={inp} /></div>
          <div><label style={lbl}>COURSE</label><input value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. BSc Computer Science" style={inp} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>YEAR OF STUDY</label>
            <select value={yearStudy} onChange={e => setYearStudy(e.target.value)} style={inp}>
              <option value="">Select…</option>
              {[1,2,3,4,5,6,7].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>STUDENT TYPE</label>
            <select value={yearType} onChange={e => setYearType(e.target.value)} style={inp}>
              <option value="first_year">First Year</option>
              <option value="senior">Senior</option>
            </select>
          </div>
          <div>
            <label style={lbl}>FUNDING</label>
            <select value={funding} onChange={e => setFunding(e.target.value)} style={inp}>
              <option value="">Select…</option>
              <option value="NSFAS">NSFAS</option>
              <option value="Bursary">Bursary</option>
              <option value="Private">Private</option>
              <option value="TUT_Funded">TUT Funded</option>
            </select>
          </div>
        </div>

        {error   && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }}>{error}</div>}
        {success && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Profile saved! Redirecting…</div>}

        <button onClick={handleSave} disabled={loading} style={{ padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
