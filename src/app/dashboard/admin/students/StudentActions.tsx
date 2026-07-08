'use client'
import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  currentRole: string
  isActive: boolean
  fullName: string
}

export default function StudentActions({ userId, currentRole, isActive, fullName }: Props) {
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function toggleRole() {
    const newRole = currentRole === 'admin' ? 'student' : 'admin'
    if (!confirm(`Make ${fullName} ${newRole === 'admin' ? 'an Admin' : 'a Student'}?`)) return
    startTransition(async () => {
      await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      router.refresh()
    })
  }

  async function toggleActive() {
    if (!confirm(`${isActive ? 'Deactivate' : 'Activate'} ${fullName}?`)) return
    startTransition(async () => {
      await supabase.from('profiles').update({ is_active: !isActive }).eq('id', userId)
      router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        onClick={toggleRole}
        disabled={pending}
        style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: currentRole === 'admin' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)', color: currentRole === 'admin' ? '#8b5cf6' : '#3b82f6', borderColor: currentRole === 'admin' ? 'rgba(139,92,246,0.3)' : 'rgba(59,130,246,0.3)', opacity: pending ? 0.5 : 1 }}
      >
        {currentRole === 'admin' ? 'Make Student' : 'Make Admin'}
      </button>
      <button
        onClick={toggleActive}
        disabled={pending}
        style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: isActive ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)', color: isActive ? '#f43f5e' : '#10b981', borderColor: isActive ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)', opacity: pending ? 0.5 : 1 }}
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )
}
