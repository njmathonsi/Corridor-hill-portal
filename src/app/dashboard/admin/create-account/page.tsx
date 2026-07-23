'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateAccountPage() {
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [role, setRole]           = useState<'student'|'admin'>('student')
  const [studentNumber, setSN]    = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const supabase = createClient()
  const router   = useRouter()

  async function handleCreate() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Full name, email, and password are required'); return
    }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true); setError(''); setSuccess('')

    // Create the auth user
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })

    if (signUpErr) { setError(signUpErr.message); setLoading(false); return }
    if (!data.user) { setError('Account creation failed — no user returned'); setLoading(false); return }

    // Update the profile with role + extra details (the trigger creates the base row)
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        role,
        student_number: role === 'student' ? (studentNumber || null) : null,
        onboarding_complete: role === 'admin' ? true : false,
      })
      .eq('id', data.user.id)

    if (updateErr) { setError(updateErr.message); setLoading(false); return }

    setSuccess(`✓ ${role === 'admin' ? 'Admin' : 'Student'} account created for ${fullName}`)
    setFullName(''); setEmail(''); setPassword(''); setSN(''); setLoading(false)
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }

  return (
    <div style={{ padding: 28, maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Create Account</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Directly create a student or admin account without the public signup flow</p>

      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div>
          <label style={lbl}>ACCOUNT TYPE</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['student','admin'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: role === r ? (r === 'admin' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)') : 'transparent', color: role === r ? (r === 'admin' ? '#8b5cf6' : '#3b82f6') : '#71717a', borderColor: role === r ? (r === 'admin' ? 'rgba(139,92,246,0.3)' : 'rgba(59,130,246,0.3)') : 'rgba(255,255,255,0.08)' }}>
                {r === 'admin' ? '👨‍💼 Admin' : '🎓 Student'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={lbl}>FULL NAME *</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="First name & surname" style={inp} />
        </div>

        <div>
          <label style={lbl}>EMAIL *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com" style={inp} />
        </div>

        <div>
          <label style={lbl}>PASSWORD *</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" style={inp} />
        </div>

        {role === 'student' && (
          <div>
            <label style={lbl}>STUDENT NUMBER (optional)</label>
            <input value={studentNumber} onChange={e => setSN(e.target.value)} placeholder="e.g. 219087432" style={{ ...inp, fontFamily: 'monospace' }} />
          </div>
        )}

        {error && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }}>{error}</div>}
        {success && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>{success}</div>}

        <button onClick={handleCreate} disabled={loading} style={{ padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Creating…' : `+ Create ${role === 'admin' ? 'Admin' : 'Student'} Account`}
        </button>
      </div>
    </div>
  )
}
