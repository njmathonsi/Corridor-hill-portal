'use client'
// app/auth/login/LoginForm.tsx
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [mode, setMode]         = useState<'password' | 'magic'>('password')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage]   = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  async function handlePassword() {
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please enter your email and password' })
      return
    }
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ type: 'error', text: error.message })
        return
      }
      router.push(redirectTo ?? '/dashboard/student/home')
      router.refresh()
    })
  }

  async function handleMagicLink() {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setMessage({ type: 'error', text: error.message })
        return
      }
      setMessage({ type: 'success', text: `Magic link sent to ${email} — check your inbox` })
    })
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
    color: 'var(--text-primary)', padding: '10px 12px',
    borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', borderRadius: 'var(--r-lg)', padding: 24 }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--bg-raised)', padding: 3, borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)' }}>
        {(['password', 'magic'] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setMessage(null) }}
            style={{
              flex: 1, padding: '7px', borderRadius: 6,
              background: mode === m ? 'var(--bg-card)' : 'transparent',
              border: 'none', color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {m === 'password' ? 'Password' : '✉ Magic Link'}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (mode === 'password' ? handlePassword() : handleMagicLink())}
          placeholder="your@email.com"
          autoComplete="email"
          style={inputStyle}
        />
      </div>

      {mode === 'password' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePassword()}
            placeholder="••••••••"
            autoComplete="current-password"
            style={inputStyle}
          />
        </div>
      )}

      {message && (
        <div style={{
          padding: '8px 12px', borderRadius: 'var(--r-md)', fontSize: 12, marginBottom: 12,
          background: message.type === 'error' ? 'var(--rose-dim)' : 'var(--emerald-dim)',
          color: message.type === 'error' ? 'var(--rose)' : 'var(--emerald)',
          border: `1px solid ${message.type === 'error' ? 'var(--rose-ring)' : 'var(--emerald-ring)'}`,
        }}>
          {message.text}
        </div>
      )}

      <button
        onClick={mode === 'password' ? handlePassword : handleMagicLink}
        disabled={isPending}
        style={{
          width: '100%', padding: '10px',
          borderRadius: 'var(--r-md)',
          background: 'linear-gradient(135deg, var(--blue) 0%, var(--violet) 100%)',
          color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 700,
          cursor: 'pointer', opacity: isPending ? 0.5 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {isPending
          ? 'Please wait…'
          : mode === 'password'
            ? 'Sign In'
            : 'Send Magic Link'}
      </button>
    </div>
  )
}
