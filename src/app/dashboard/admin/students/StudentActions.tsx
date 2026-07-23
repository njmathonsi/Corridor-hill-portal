'use client'
import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function StudentActions({ userId, isActive, fullName }: { userId: string; isActive: boolean; fullName: string }) {
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function toggleActive() {
    if (!confirm(`${isActive ? 'Deactivate' : 'Activate'} ${fullName}?`)) return
    startTransition(async () => {
      await supabase.from('profiles').update({ is_active: !isActive }).eq('id', userId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={toggleActive}
      disabled={pending}
      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: isActive ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)', color: isActive ? '#f43f5e' : '#10b981', borderColor: isActive ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)', opacity: pending ? 0.5 : 1 }}
    >
      {isActive ? 'Deactivate' : 'Activate'}
    </button>
  )
}
