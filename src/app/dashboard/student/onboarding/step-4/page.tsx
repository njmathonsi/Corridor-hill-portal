'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Step4Page() {
  const [checked1, setChecked1]   = useState(false)
  const [checked2, setChecked2]   = useState(false)
  const [checked3, setChecked3]   = useState(false)
  const [signature, setSignature] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  const allDone = checked1 && checked2 && checked3 && signature.trim().length > 3

  async function handleSubmit() {
    if (!allDone) return
    setLoading(true); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { data: existing } = await supabase
      .from('conduct_acknowledgements')
      .select('id')
      .eq('student_id', session.user.id)
      .maybeSingle()

    if (existing) {
      setError('You have already signed the Code of Conduct.')
      setLoading(false); return
    }

    const { error: err } = await supabase.from('conduct_acknowledgements').insert({
      student_id:       session.user.id,
      document_version: '2025-v1',
      ack_method:       'digital_checkbox',
      signature_data:   signature,
      is_verified:      false,
      acknowledged_at:  new Date().toISOString(),
    })
    if (err) { setError(err.message); setLoading(false); return }
    await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', session.user.id)
    setSuccess(true); setLoading(false)
    setTimeout(() => router.push('/dashboard/student/home'), 2000)
  }

  if (success) return (
    <div style={{ padding: 28, maxWidth: 540 }}>
      <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 14 }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>Code of Conduct Signed!</div>
        <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.7 }}>Your agreement has been recorded.<br />Management will verify it shortly.</div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 28, maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Code of Conduct</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Read and acknowledge the Corridor Hill Residence Rules. This is a binding agreement.</p>

      {/* Scrollable rules */}
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 16, maxHeight: 300, overflowY: 'auto', fontSize: 12, color: '#a1a1aa', lineHeight: 1.8 }}>
        <div style={{ fontWeight: 700, color: '#fafafa', marginBottom: 12, fontSize: 14 }}>Corridor Hill Residence — Key Rules</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>Category 1 — Internal DC Offences</div>
          <div>• No smoking indoors at any time — R50 fine, escalates to External DC on 3rd offence</div>
          <div>• No loud music — Speaker confiscation, church fee flag on 2nd offence</div>
          <div>• No smuggling or consuming alcohol on premises</div>
          <div>• No hard spirits — Confiscation + R100 fine</div>
          <div>• Observe speed limits on property — R200 first offence</div>
          <div>• Follow visitor policy at all times — R50 first offence</div>
          <div>• Dirty dishes must be washed within 2 hours of use</div>
          <div>• No littering anywhere on property — R50 fine</div>
          <div>• No unauthorised electrical equipment — Confiscation + R50</div>
          <div>• Rudeness to staff — R50 first offence, R100 second offence</div>
          <div style={{ marginTop: 8, color: '#f43f5e', fontWeight: 600 }}>⚠ Three or more Category 1 offences at the same time = automatic External DC referral</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>Category 2 — Property Damage</div>
          <div>• All damage to residence property is logged and billed to the responsible student</div>
          <div>• Items include: tables, chairs, doors, handles, towel rails, soap holders, toilet flush handles, blinds, windows, facia boards, furniture, and appliances</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: '#f43f5e', marginBottom: 6 }}>Category 4 — Serious Offences</div>
          <div>• Drug possession, selling, or use: immediate referral to Management, TUT Judiciary, and Police</div>
          <div>• Assault: immediate referral to Management, TUT Judiciary, and Police</div>
          <div>• Verbal or physical abuse: immediate referral to Management, TUT Judiciary, and Police</div>
        </div>

        <div>
          <div style={{ fontWeight: 700, color: '#10b981', marginBottom: 6 }}>General Rules</div>
          <div>• Biometric registration required within 5 days of check-in</div>
          <div>• All exits from residence must be logged at reception</div>
          <div>• You must carry your student card at all times on property</div>
          <div>• Subletting your room to any person is strictly prohibited</div>
          <div>• You are responsible for your room and all items within it</div>
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {[
          { state: checked1, set: setChecked1, text: 'I have read and understood all Category 1, 2, and 4 offences and their consequences, including fines and escalation procedures.' },
          { state: checked2, set: setChecked2, text: 'I understand that three simultaneous Category 1 offences result in automatic escalation to an External Disciplinary Committee.' },
          { state: checked3, set: setChecked3, text: 'I agree to abide by the Corridor Hill Residence Code of Conduct for the full duration of my stay.' },
        ].map((item, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, background: item.state ? 'rgba(16,185,129,0.08)' : '#18181b', border: `1px solid ${item.state ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
            <input type="checkbox" checked={item.state} onChange={e => item.set(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: '#10b981', width: 16, height: 16 }} />
            <span style={{ fontSize: 13, color: item.state ? '#fafafa' : '#a1a1aa', lineHeight: 1.5 }}>{item.text}</span>
          </label>
        ))}
      </div>

      {/* Signature */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Electronic Signature — Type your full legal name</div>
        <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Your full legal name" style={{ width: '100%', background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '12px 14px', borderRadius: 8, fontSize: 18, fontFamily: 'Georgia, serif', fontStyle: 'italic', outline: 'none', boxSizing: 'border-box' }} />
        {signature.length > 3 && <div style={{ fontSize: 11, color: '#10b981', marginTop: 5 }}>✓ Signature captured</div>}
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', marginBottom: 12 }}>{error}</div>}

      <button onClick={handleSubmit} disabled={!allDone || loading} style={{ width: '100%', padding: '13px', borderRadius: 8, background: allDone ? '#10b981' : '#27272a', color: allDone ? '#fff' : '#52525b', border: 'none', fontSize: 14, fontWeight: 700, cursor: allDone ? 'pointer' : 'not-allowed', opacity: loading ? 0.5 : 1, transition: 'all 0.2s' }}>
        {loading ? 'Recording…' : '✓ I Agree — Submit Acknowledgement'}
      </button>
      <p style={{ fontSize: 11, color: '#52525b', textAlign: 'center', marginTop: 10 }}>This is a legally binding agreement. Your timestamp is recorded.</p>
    </div>
  )
}
