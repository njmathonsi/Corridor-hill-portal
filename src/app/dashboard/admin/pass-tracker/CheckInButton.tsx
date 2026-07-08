'use client'
import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CheckInButton({ studentId, studentName, keyNumber }: { studentId: string; studentName: string; keyNumber: string | null }) {
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function handleCheckIn() {
    startTransition(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: lease } = await supabase.from('leases').select('id').eq('student_id', studentId).eq('is_active', true).limit(1).maybeSingle()
      await supabase.from('boundary_transits').insert({
        student_id: studentId,
        lease_id: lease?.id ?? null,
        direction: 'entry',
        key_number: keyNumber,
        key_returned: !!keyNumber,
        logged_by: session?.user.id,
      })
      router.refresh()
    })
  }

  return (
    <button onClick={handleCheckIn} disabled={pending} style={{ padding: '5px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#a1a1aa', fontSize: 11, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.5 : 1 }}>
      {pending ? '…' : 'Check In'}
    </button>
  )
}
