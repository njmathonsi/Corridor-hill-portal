'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ApplicationActions({ applicationId, studentName }: { applicationId: string; studentName: string }) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function handleApprove() {
    startTransition(async () => {
      await supabase.from('applications').update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      }).eq('id', applicationId)
      router.refresh()
    })
  }

  async function handleReview() {
    startTransition(async () => {
      await supabase.from('applications').update({
        status: 'under_review',
        reviewed_at: new Date().toISOString(),
      }).eq('id', applicationId)
      router.refresh()
    })
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return
    startTransition(async () => {
      await supabase.from('applications').update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString(),
      }).eq('id', applicationId)
      setShowReject(false)
      router.refresh()
    })
  }

  const btn = (label: string, onClick: () => void, bg: string, color: string, border: string) => (
    <button onClick={onClick} disabled={pending} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer', background: bg, color, border: `1px solid ${border}`, opacity: pending ? 0.5 : 1, transition: 'all 0.15s' }}>
      {label}
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {btn('✓ Approve', handleApprove, 'rgba(16,185,129,0.15)', '#10b981', 'rgba(16,185,129,0.3)')}
        {btn('🔍 Flag for Review', handleReview, 'rgba(245,158,11,0.15)', '#f59e0b', 'rgba(245,158,11,0.3)')}
        {btn('✕ Reject', () => setShowReject(!showReject), 'rgba(244,63,94,0.12)', '#f43f5e', 'rgba(244,63,94,0.3)')}
      </div>
      {showReject && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <input
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection…"
            style={{ flex: 1, background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '8px 12px', borderRadius: 8, fontSize: 12, outline: 'none' }}
          />
          <button onClick={handleReject} disabled={!rejectionReason.trim() || pending} style={{ padding: '8px 14px', borderRadius: 8, background: '#f43f5e', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: !rejectionReason.trim() ? 0.4 : 1 }}>
            Confirm
          </button>
        </div>
      )}
    </div>
  )
}
