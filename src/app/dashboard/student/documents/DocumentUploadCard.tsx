'use client'
import { useState, useRef, useTransition } from 'react'
import { uploadDocument } from '@/lib/actions/documents'
import { useRouter } from 'next/navigation'
import { quickClientCheck } from '@/lib/validation/fileValidation'

type Status = 'pending' | 'approved' | 'rejected'
type DocType = 'id_document' | 'proof_of_registration'

interface ExistingDoc {
  id: string
  document_type: DocType
  status: Status
  rejection_reason: string | null
  uploaded_at: string
  original_filename: string | null
  file_size_bytes: number | null
}

const STATUS_STYLE: Record<Status, { bg: string; color: string; border: string; label: string }> = {
  pending:  { bg: 'rgb(var(--brand-rgb) / 0.15)', color: 'var(--brand)', border: 'rgb(var(--brand-rgb) / 0.3)', label: '⏳ Pending Approval' },
  approved: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)', label: '✓ Approved' },
  rejected: { bg: 'rgba(244,63,94,0.12)',  color: '#f43f5e', border: 'rgba(244,63,94,0.3)',  label: '✕ Rejected' },
}

export default function DocumentUploadCard({
  documentType, label, description, existing,
}: {
  documentType: DocType
  label: string
  description: string
  existing: ExistingDoc | null
}) {
  const [error, setError]     = useState('')
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const isLocked = existing?.status === 'pending' // block re-upload while awaiting review

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    const quickCheck = quickClientCheck(file)
    if (!quickCheck.valid) {
      setError(quickCheck.error!)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)
      const result = await uploadDocument(formData)
      if (!result.success) {
        setError(result.error ?? 'Upload failed')
      } else {
        router.refresh()
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    })
  }

  const status = existing?.status
  const statusStyle = status ? STATUS_STYLE[status] : null

  return (
    <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{description}</div>
        </div>
        {statusStyle ? (
          <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, whiteSpace: 'nowrap' }}>
            {statusStyle.label}
          </span>
        ) : (
          <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#71717a', border: '1px solid rgba(255,255,255,0.1)' }}>
            Not Uploaded
          </span>
        )}
      </div>

      {existing && (
        <div style={{ fontSize: 11, color: '#71717a', marginBottom: 10 }}>
          {existing.original_filename} · {existing.file_size_bytes ? (existing.file_size_bytes / 1024 / 1024).toFixed(2) : '—'}MB · Uploaded {new Date(existing.uploaded_at).toLocaleDateString('en-ZA')}
        </div>
      )}

      {status === 'rejected' && existing?.rejection_reason && (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', fontSize: 12, color: '#f43f5e', marginBottom: 12, lineHeight: 1.5 }}>
          <strong>Reason for rejection:</strong> {existing.rejection_reason}
        </div>
      )}

      {error && (
        <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {isLocked ? (
        <div style={{ fontSize: 12, color: '#71717a', padding: '10px 0', textAlign: 'center' }}>
          Your document is awaiting admin review. You'll be notified once it's processed.
        </div>
      ) : (
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px', borderRadius: 8, cursor: pending ? 'not-allowed' : 'pointer',
          border: '1px dashed rgba(255,255,255,0.15)', background: '#1f1f23',
          fontSize: 13, fontWeight: 600, color: pending ? '#52525b' : '#3b82f6',
        }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            disabled={pending}
            style={{ display: 'none' }}
          />
          {pending ? 'Uploading & validating…' : status === 'rejected' ? '↻ Re-upload Document' : '📎 Choose File to Upload'}
        </label>
      )}
    </div>
  )
}
