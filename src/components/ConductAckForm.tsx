'use client'
// components/student/ConductAckForm.tsx
import { useState, useTransition } from 'react'
import { acknowledgeConduct } from '@/lib/actions/conduct'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface Props {
  studentId: string
  alreadyAcknowledged: boolean
}

export default function ConductAckForm({ studentId, alreadyAcknowledged }: Props) {
  const [checkbox1, setCheckbox1] = useState(false)
  const [checkbox2, setCheckbox2] = useState(false)
  const [checkbox3, setCheckbox3] = useState(false)
  const [signature, setSignature]   = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const allChecked = checkbox1 && checkbox2 && checkbox3 && signature.trim().length > 3

  function handleSubmit() {
    if (!allChecked) return

    startTransition(async () => {
      const result = await acknowledgeConduct({
        studentId,
        signatureData: signature,
        ackMethod: 'digital_checkbox',
      })

      if (result.success) {
        toast({
          title: '✅ Code of Conduct Acknowledged',
          description: 'Your agreement has been recorded. Welcome to Corridor Hill!',
        })
        router.push('/dashboard/student/home')
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    })
  }

  if (alreadyAcknowledged) {
    return (
      <div style={{
        background: 'var(--emerald-dim)', border: '1px solid var(--emerald-ring)',
        borderRadius: 'var(--r-lg)', padding: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 700, color: 'var(--emerald)' }}>Code of Conduct Acknowledged</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          Your agreement is on record. Awaiting admin verification.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Acknowledgement checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {[
          { key: 1, state: checkbox1, set: setCheckbox1, label: 'I have read and understood all Category 1, 2, and 4 offences and their consequences' },
          { key: 2, state: checkbox2, set: setCheckbox2, label: 'I understand that three simultaneous Category 1 offences result in automatic escalation to an External Disciplinary Committee' },
          { key: 3, state: checkbox3, set: setCheckbox3, label: 'I agree to abide by the Corridor Hill Residence Code of Conduct for the full duration of my stay' },
        ].map(item => (
          <label
            key={item.key}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', borderRadius: 'var(--r-md)',
              background: item.state ? 'var(--emerald-dim)' : 'var(--bg-raised)',
              border: `1px solid ${item.state ? 'var(--emerald-ring)' : 'var(--border-mid)'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={item.state}
              onChange={e => item.set(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--emerald)' }}
            />
            <span style={{ fontSize: 13, color: item.state ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.5 }}>
              {item.label}
            </span>
          </label>
        ))}
      </div>

      {/* E-signature */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
          letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8,
        }}>
          Electronic Signature — type your full name
        </div>
        <input
          value={signature}
          onChange={e => setSignature(e.target.value)}
          placeholder="Your full legal name"
          style={{
            width: '100%',
            background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
            color: 'var(--text-primary)', padding: '12px 14px',
            borderRadius: 'var(--r-md)',
            fontSize: 18,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            outline: 'none', transition: 'border-color 0.15s',
            letterSpacing: '0.02em',
          }}
        />
        {signature.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>
            ✓ Signature captured · Will be verified by management
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!allChecked || isPending}
        style={{
          width: '100%', padding: '12px',
          borderRadius: 'var(--r-md)',
          background: allChecked ? 'var(--emerald)' : 'var(--bg-raised)',
          color: allChecked ? '#fff' : 'var(--text-disabled)',
          border: `1px solid ${allChecked ? 'var(--emerald)' : 'var(--border-dim)'}`,
          fontSize: 14, fontWeight: 700,
          cursor: allChecked ? 'pointer' : 'not-allowed',
          opacity: isPending ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        {isPending ? 'Recording agreement…' : '✓ I Agree — Submit Acknowledgement'}
      </button>

      <div style={{ fontSize: 11, color: 'var(--text-disabled)', textAlign: 'center', marginTop: 10 }}>
        This acknowledgement is legally binding. Your IP address and timestamp are recorded.
      </div>
    </div>
  )
}
