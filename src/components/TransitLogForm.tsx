'use client'
// components/pass-tracker/TransitLogForm.tsx
import { useState, useTransition } from 'react'
import { logTransit } from '@/lib/actions/pass-tracker'
import { useToast } from '@/components/ui/use-toast'

interface Student {
  id: string
  full_name: string
  student_number: string
}

export default function TransitLogForm({ students }: { students: Student[] }) {
  const [direction, setDirection] = useState<'exit' | 'entry'>('exit')
  const [studentId, setStudentId] = useState('')
  const [destination, setDestination] = useState('')
  const [purpose, setPurpose] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [keyHandover, setKeyHandover] = useState(false)
  const [keyNumber, setKeyNumber] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleSubmit() {
    if (!studentId) {
      toast({ title: 'Missing student', description: 'Please select a student', variant: 'destructive' })
      return
    }
    if (direction === 'exit' && !destination) {
      toast({ title: 'Missing destination', description: 'Destination is required for exits', variant: 'destructive' })
      return
    }

    startTransition(async () => {
      const result = await logTransit({
        studentId,
        direction,
        destination,
        purpose,
        expectedReturn: expectedReturn ? new Date(expectedReturn).toISOString() : undefined,
        keyHandedOver: keyHandover,
        keyNumber,
      })

      if (result.success) {
        const student = students.find(s => s.id === studentId)
        toast({
          title: direction === 'exit' ? 'Exit Logged' : 'Entry Logged',
          description: `${student?.full_name} — transit recorded`,
        })
        // Reset form
        setStudentId(''); setDestination(''); setPurpose('')
        setExpectedReturn(''); setKeyHandover(false); setKeyNumber('')
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    })
  }

  const inputStyle = {
    background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
    color: 'var(--text-primary)', padding: '9px 12px',
    borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'inherit',
    width: '100%', outline: 'none', transition: 'border-color 0.15s',
  }
  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
    letterSpacing: '0.04em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 5,
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
      borderRadius: 'var(--r-lg)', padding: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Log New Transit</div>

      {/* Direction toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['exit', 'entry'] as const).map(d => (
          <button
            key={d}
            onClick={() => setDirection(d)}
            style={{
              flex: 1, padding: '8px', borderRadius: 'var(--r-md)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: '1px solid',
              background: direction === d
                ? d === 'exit' ? 'var(--amber-dim)' : 'var(--emerald-dim)'
                : 'var(--bg-raised)',
              color: direction === d
                ? d === 'exit' ? 'var(--amber)' : 'var(--emerald)'
                : 'var(--text-secondary)',
              borderColor: direction === d
                ? d === 'exit' ? 'var(--amber-ring)' : 'var(--emerald-ring)'
                : 'var(--border-dim)',
              transition: 'all 0.15s',
            }}
          >
            {d === 'exit' ? '→ Exit (Leave)' : '← Entry (Return)'}
          </button>
        ))}
      </div>

      {/* Student selector */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Student</label>
        <select
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select student…</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>
              {s.full_name} {s.student_number ? `· ${s.student_number}` : ''}
            </option>
          ))}
        </select>
      </div>

      {direction === 'exit' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Destination</label>
            <input
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="e.g. Family visit — Pretoria"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Purpose</label>
            <input
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. Weekend pass"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Expected Return</label>
            <input
              type="datetime-local"
              value={expectedReturn}
              onChange={e => setExpectedReturn(e.target.value)}
              style={inputStyle}
            />
          </div>
        </>
      )}

      {/* Key card */}
      <div style={{
        padding: '10px 12px', borderRadius: 'var(--r-md)',
        background: 'var(--bg-raised)', border: '1px solid var(--border-dim)',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>
            🔑 Key Card {direction === 'exit' ? 'Hand-over' : 'Return'}
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={keyHandover}
              onChange={e => setKeyHandover(e.target.checked)}
            />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {direction === 'exit' ? 'Key handed to reception' : 'Key returned to student'}
            </span>
          </label>
        </div>
        {keyHandover && (
          <input
            value={keyNumber}
            onChange={e => setKeyNumber(e.target.value)}
            placeholder="Key number (e.g. A-204-K1)"
            style={{ ...inputStyle, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
          />
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending}
        style={{
          width: '100%', padding: '9px',
          borderRadius: 'var(--r-md)',
          background: direction === 'exit' ? 'var(--amber)' : 'var(--emerald)',
          color: direction === 'exit' ? '#000' : '#fff',
          border: 'none', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', opacity: isPending ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
      >
        {isPending ? 'Logging…' : `+ Log ${direction === 'exit' ? 'Departure' : 'Return'}`}
      </button>
    </div>
  )
}
