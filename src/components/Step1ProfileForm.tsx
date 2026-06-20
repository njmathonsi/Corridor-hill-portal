'use client'
// components/student/Step1ProfileForm.tsx
import { useState, useTransition } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  full_name: string
  student_number: string | null
  id_number: string | null
  phone: string | null
  faculty: string | null
  course: string | null
  year_of_study: number | null
  student_year_type: 'first_year' | 'senior' | null
  funding_type: string | null
}

export default function Step1ProfileForm({ profile }: { profile: Profile | null }) {
  const [fullName,   setFullName]   = useState(profile?.full_name ?? '')
  const [studentNo,  setStudentNo]  = useState(profile?.student_number ?? '')
  const [idNumber,   setIdNumber]   = useState(profile?.id_number ?? '')
  const [phone,      setPhone]      = useState(profile?.phone ?? '')
  const [faculty,    setFaculty]    = useState(profile?.faculty ?? '')
  const [course,     setCourse]     = useState(profile?.course ?? '')
  const [yearStudy,  setYearStudy]  = useState(profile?.year_of_study?.toString() ?? '')
  const [yearType,   setYearType]   = useState<'first_year' | 'senior'>(profile?.student_year_type ?? 'first_year')
  const [funding,    setFunding]    = useState(profile?.funding_type ?? '')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const inputStyle = {
    background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
    color: 'var(--text-primary)', padding: '10px 12px',
    borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'inherit',
    width: '100%', outline: 'none', transition: 'border-color 0.15s',
  }
  const labelStyle = {
    fontSize: 11, fontWeight: 600 as const, color: 'var(--text-secondary)',
    letterSpacing: '0.04em', textTransform: 'uppercase' as const,
    display: 'block' as const, marginBottom: 5,
  }

  function handleSave() {
    if (!fullName.trim()) {
      toast({ title: 'Name required', description: 'Please enter your full name', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const result = await updateProfile({
        fullName, studentNumber: studentNo, idNumber,
        phone, faculty, course,
        yearOfStudy: yearStudy ? parseInt(yearStudy) : undefined,
        studentYearType: yearType,
        fundingType: funding,
      })
      if (result.success) {
        toast({ title: '✓ Profile Saved', description: 'Moving to step 2…' })
        router.push('/dashboard/student/onboarding/step-2-application')
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    })
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Full Name *</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="First name & surname" style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Student Number</label>
          <input value={studentNo} onChange={e => setStudentNo(e.target.value)} placeholder="e.g. 123456789" style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
        <div>
          <label style={labelStyle}>SA ID / Passport No.</label>
          <input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="ID number" style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Phone Number</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 00 000 0000" style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Faculty</label>
          <input value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="e.g. Engineering" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Course / Programme</label>
          <input value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. BSc Computer Science" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Year of Study</label>
          <select value={yearStudy} onChange={e => setYearStudy(e.target.value)} style={inputStyle}>
            <option value="">Select…</option>
            {[1,2,3,4,5,6,7].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Student Type</label>
          <select value={yearType} onChange={e => setYearType(e.target.value as 'first_year' | 'senior')} style={inputStyle}>
            <option value="first_year">First Year</option>
            <option value="senior">Senior</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Funding</label>
          <select value={funding} onChange={e => setFunding(e.target.value)} style={inputStyle}>
            <option value="">Select…</option>
            <option value="NSFAS">NSFAS</option>
            <option value="Bursary">Bursary</option>
            <option value="Private">Private (Self-funded)</option>
            <option value="TUT_Funded">TUT Funded</option>
          </select>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={isPending}
        style={{
          padding: '10px', borderRadius: 'var(--r-md)',
          background: 'linear-gradient(135deg, var(--blue), var(--violet))',
          color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', opacity: isPending ? 0.5 : 1, marginTop: 4,
        }}
      >
        {isPending ? 'Saving…' : 'Save & Continue →'}
      </button>
    </div>
  )
}
