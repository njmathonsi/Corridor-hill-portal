'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Step4Page() {
  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(false)
  const [checked3, setChecked3] = useState(false)
  const [signature, setSignature] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const allDone = checked1 && checked2 && checked3 && signature.trim().length > 3

  async function handleSubmit() {
    if (!allDone) return
    setLoading(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    const { error: err } = await supabase.from('conduct_acknowledgements').insert({ student_id: session.user.id, document_version: '2025-v1', ack_method: 'digital_checkbox', signature_data: signature, is_verified: false, acknowledged_at: new Date().toISOString() })
    if (err) { setError(err.message); setLoading(false); return }
    await supabase.from('profiles').update({ onboarding_complete: true, updated_at: new Date().toISOString() }).eq('id', session.user.id)
    router.push('/dashboard/student/home')
  }

  const rules = [
    { key: 1, state: checked1, set: setChecked1, text: 'I have read and understood all Category 1, 2, and 4 offences and their consequences, including fines and escalation procedures.' },
    { key: 2, state: checked2, set: setChecked2, text: 'I understand that three simultaneous Category 1 offences result in automatic escalation to an External Disciplinary Committee.' },
    { key: 3, state: checked3, set: setChecked3, text: 'I agree to abide by the Corridor Hill Residence Code of Conduct for the full duration of my stay.' },
  ]

  return (
    <div style={{ padding: 28, maxWidth: 560 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3b82f6', marginBottom: 6 }}>Step 4 of 4</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Code of Conduct</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Read and acknowledge the Corridor Hill Residence Rules. This is a binding agreement.</p>

      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 16, maxHeight: 280, overflowY: 'auto', fontSize: 12, color: '#a1a1aa', lineHeight: 1.7 }}>
        <div style={{ fontWeight: 700, color: '#fafafa', marginBottom: 10, fontSize: 13 }}>Key Rules — Corridor Hill Residence</div>
        <p><strong style={{ color: '#fafafa' }}>Category 1 (Internal DC):</strong> No smoking indoors (R50+), no loud music, no alcohol smuggling, no hard spirits, observe speed limits, follow visitor policy, clean dishes, no littering (R50), no unauthorised electrical equipment. Three simultaneous Cat 1 offences = automatic External DC referral.</p>
        <p style={{ marginTop: 8 }}><strong style={{ color: '#fafafa' }}>Category 2 (Property Damage):</strong> All damage to residence property is logged and billed to the responsible student.</p>
        <p style={{ marginTop: 8 }}><strong style={{ color: '#fafafa' }}>Category 4 (Serious):</strong> Drug possession/use, assault, and abuse result in immediate referral to Management, TUT Judiciary, and Police.</p>
        <p style={{ marginTop: 8 }}><strong style={{ color: '#fafafa' }}>General:</strong> Biometric registration required within 5 days of check-in. All exits must be logged at reception. No subletting.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {rules.map(r => (
          <label key={r.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: r.state ? 'rgba(16,185,129,0.08)' : '#18181b', border: `1px solid ${r.state ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer' }}>
            <input type="checkbox" checked={r.state} onChange={e => r.set(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: '#10b981' }} />
            <span style={{ fontSize: 13, color: r.state ? '#fafafa' : '#a1a1aa', lineHeight: 1.5 }}>{r.text}</span>
          </label>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Electronic Signature — type your full name</div>
        <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Your full legal name" style={{ width: '100%', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '12px 14px', borderRadius: 8, fontSize: 18, fontFamily: 'Georgia, serif', fontStyle: 'italic', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {error && <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', marginBottom: 12 }}>{error}</div>}

      <button onClick={handleSubmit} disabled={!allDone || loading} style={{ width: '100%', padding: '12px', borderRadius: 8, background: allDone ? '#10b981' : '#27272a', color: allDone ? '#fff' : '#52525b', border: 'none', fontSize: 14, fontWeight: 700, cursor: allDone ? 'pointer' : 'not-allowed', opacity: loading ? 0.5 : 1 }}>
        {loading ? 'Recording…' : '✓ I Agree — Submit Acknowledgement'}
      </button>
      <p style={{ fontSize: 11, color: '#52525b', textAlign: 'center', marginTop: 10 }}>This is a legally binding agreement. Your timestamp and IP are recorded.</p>
    </div>
  )
}
