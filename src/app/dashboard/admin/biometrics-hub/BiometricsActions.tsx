'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  studentId: string
  studentName: string
  isRegistered: boolean
}

export default function BiometricsActions({ studentId, studentName, isRegistered }: Props) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleToggle() {
    startTransition(async () => {
      const newStatus = !isRegistered
      const now = new Date().toISOString()

      // Check if record exists
      const { data: existing } = await supabase
        .from('biometric_registrations')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('biometric_registrations')
          .update({
            biometric_registered: newStatus,
            sync_status: newStatus ? 'synced' : 'revoked',
            registered_at: newStatus ? now : null,
            device_label: newStatus ? 'Admin Panel' : null,
          })
          .eq('student_id', studentId)
      } else {
        await supabase
          .from('biometric_registrations')
          .insert({
            student_id: studentId,
            biometric_registered: newStatus,
            sync_status: newStatus ? 'synced' : 'pending',
            registered_at: newStatus ? now : null,
            device_label: newStatus ? 'Admin Panel' : null,
            device_id: 'ADMIN-PANEL',
          })
      }

      setDone(true)
      router.refresh()
    })
  }

  return (
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
        transition: 'all 0.15s',
      }}
    >
      {pending ? '…' : isRegistered ? 'Deregister' : 'Register'}
    </button>
  )
}
