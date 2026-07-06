'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true); setError('')

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }

    // Use service role bypass — check profile via direct query
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profile?.role === 'admin') {
      router.push('/dashboard/admin/overview')
    } else {
      router.push('/dashboard/student/home')
    }
    router.refresh()
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#27272a',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fafafa', padding: '10px 12px',
    borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box'
  }

  return (
    <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }}>EMAIL</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inp} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }}>PASSWORD</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" style={inp} />
      </div>
      {error && (
        <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', marginBottom: 12 }}>{error}</div>
      )}
      <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <p style={{ fontSize: 11, color: '#52525b', textAlign: 'center', marginTop: 14 }}>Login credentials are set up by management during intake.</p>
    </div>
  )
}
