'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  studentId: string
  studentName: string
  isRegistered: boolean
  registrationId: string | null
}

export default function BiometricsActions({ studentId, studentName, isRegistered, registrationId }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleToggle() {
    setError('')
    startTransition(async () => {
      const newStatus = !isRegistered
      const now = new Date().toISOString()

      if (registrationId) {
        // Record already exists — UPDATE it directly by its own id (most reliable)
        const { error: err } = await supabase
          .from('biometric_registrations')
          .update({
            biometric_registered: newStatus,
            sync_status: newStatus ? 'synced' : 'revoked',
            registered_at: newStatus ? now : null,
            deregistered_at: !newStatus ? now : null,
            device_label: newStatus ? 'Admin Panel' : null,
            updated_at: now,
          })
          .eq('id', registrationId)

        if (err) { setError(err.message); return }
      } else {
        // No record yet — INSERT a fresh one (only happens on first Register click)
        const { error: err } = await supabase
          .from('biometric_registrations')
          .insert({
            student_id: studentId,
            biometric_registered: newStatus,
            sync_status: newStatus ? 'synced' : 'pending',
            registered_at: newStatus ? now : null,
            device_label: newStatus ? 'Admin Panel' : null,
            device_id: 'ADMIN-PANEL-' + studentId.slice(0, 8),
          })

        if (err) { setError(err.message); return }
      }

      router.refresh()
    })
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={pending}
        style={{
          padding: '5px 14px', borderRadius: 8,
          fontSize: 11, fontWeight: 600,
          cursor: pending ? 'not-allowed' : 'pointer',
          border: '1px solid',
          background: isRegistered ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
          color: isRegistered ? '#f43f5e' : '#10b981',
          borderColor: isRegistered ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)',
          opacity: pending ? 0.5 : 1,
        }}
      >
        {pending ? '…' : isRegistered ? 'Deregister' : 'Register'}
      </button>
      {error && <div style={{ fontSize: 10, color: '#f43f5e', marginTop: 4 }}>{error}</div>}
    </div>
  )
}
