'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'register'

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function switchMode(m: Mode) {
    setMode(m); setError(''); setSuccess('')
    setEmail(''); setPassword(''); setConfirmPassword(''); setFullName('')
  }

  async function handleLogin() {
    if (!email || !password) { setError('Please enter your email and password'); return }
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    router.push(profile?.role === 'admin' ? '/dashboard/admin/overview' : '/dashboard/student/home')
    router.refresh()
  }

  async function handleRegister() {
    if (!fullName.trim()) { setError('Please enter your full name'); return }
    if (!email) { setError('Please enter your email'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSuccess('Account created! You can now sign in.')
    setLoading(false)
    setTimeout(() => switchMode('login'), 2000)
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }

  return (
    <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#27272a', padding: 3, borderRadius: 8 }}>
        {(['login', 'register'] as Mode[]).map(m => (
          <button key={m} onClick={() => switchMode(m)} style={{ flex: 1, padding: '7px', borderRadius: 6, background: mode === m ? '#18181b' : 'transparent', border: 'none', color: mode === m ? '#fafafa' : '#71717a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {m === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      {mode === 'register' && (
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>FULL NAME</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="First name & surname" style={inp} />
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>EMAIL</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inp} />
      </div>

      <div style={{ marginBottom: mode === 'register' ? 12 : 16 }}>
        <label style={lbl}>PASSWORD</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => mode === 'login' && e.key === 'Enter' && handleLogin()} placeholder="••••••••" style={inp} />
      </div>

      {mode === 'register' && (
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>CONFIRM PASSWORD</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} placeholder="••••••••" style={inp} />
        </div>
      )}

      {error && <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', marginBottom: 12 }}>{success}</div>}

      <button onClick={mode === 'login' ? handleLogin : handleRegister} disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
        {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
      </button>

      <p style={{ fontSize: 11, color: '#52525b', textAlign: 'center', marginTop: 14 }}>
        {mode === 'login' ? 'New student? Click "Create Account" above.' : 'Already have an account? Click "Sign In" above.'}
      </p>
    </div>
  )
}
