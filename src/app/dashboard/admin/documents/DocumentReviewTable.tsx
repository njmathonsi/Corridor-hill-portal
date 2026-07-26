'use client'
import { useState, useMemo, useTransition } from 'react'
import { approveDocument, rejectDocument, getSignedDocumentUrl } from '@/lib/actions/documents'
import { useRouter } from 'next/navigation'

type Status = 'pending' | 'approved' | 'rejected'
type DocType = 'id_document' | 'proof_of_registration'

interface DocRow {
  id: string
  document_type: DocType
  file_path: string
  status: Status
  rejection_reason: string | null
  uploaded_at: string
  reviewed_at: string | null
  original_filename: string | null
  file_size_bytes: number | null
  profiles: { full_name: string; student_number: string; email: string } | null
}

const STATUS_STYLE: Record<Status, { bg: string; color: string; border: string }> = {
  pending:  { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  approved: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  rejected: { bg: 'rgba(244,63,94,0.12)',  color: '#f43f5e', border: 'rgba(244,63,94,0.3)'  },
}

const DOC_LABEL: Record<DocType, string> = {
  id_document: 'ID Document',
  proof_of_registration: 'Proof of Registration',
}

export default function DocumentReviewTable({ documents }: { documents: DocRow[] }) {
  const [filter, setFilter] = useState<'all' | Status>('pending')
  const [previewDoc, setPreviewDoc] = useState<DocRow | null>(null)
  const [rejectingDoc, setRejectingDoc] = useState<DocRow | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'all') return documents
    return documents.filter(d => d.status === filter)
  }, [documents, filter])

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: '#1f1f23', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: 'none', background: filter === f ? '#18181b' : 'transparent',
              color: filter === f ? '#fafafa' : '#71717a', textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Student', 'Document', 'File', 'Uploaded', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>No documents in this category.</td></tr>
            )}
            {filtered.map(doc => {
              const s = STATUS_STYLE[doc.status]
              return (
                <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#fafafa' }}>{doc.profiles?.full_name ?? '—'}</div>
                    <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>{doc.profiles?.student_number ?? '—'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#a1a1aa' }}>{DOC_LABEL[doc.document_type]}</td>
                  <td style={{ padding: '12px 16px', color: '#71717a', fontSize: 11 }}>
                    {doc.original_filename} · {doc.file_size_bytes ? (doc.file_size_bytes / 1024 / 1024).toFixed(2) : '—'}MB
                  </td>
                  <td style={{ padding: '12px 16px', color: '#71717a', fontFamily: 'monospace', fontSize: 11 }}>
                    {new Date(doc.uploaded_at).toLocaleDateString('en-ZA')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'capitalize' }}>
                      {doc.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        👁 View
                      </button>
                      {doc.status === 'pending' && (
                        <>
                          <ApproveButton documentId={doc.id} />
                          <button
                            onClick={() => setRejectingDoc(doc)}
                            style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
      {rejectingDoc && <RejectModal doc={rejectingDoc} onClose={() => setRejectingDoc(null)} />}
    </div>
  )
}

// ══════════════════════ APPROVE BUTTON ══════════════════════
function ApproveButton({ documentId }: { documentId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleApprove() {
    startTransition(async () => {
      await approveDocument(documentId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleApprove}
      disabled={pending}
      style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: 11, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.5 : 1 }}
    >
      {pending ? '…' : '✓ Approve'}
    </button>
  )
}

// ══════════════════════ REJECT MODAL ══════════════════════
function RejectModal({ doc, onClose }: { doc: DocRow; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleReject() {
    if (!reason.trim()) return
    startTransition(async () => {
      const result = await rejectDocument(doc.id, reason)
      if (result.success) {
        onClose()
        router.refresh()
      }
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Reject Document</div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{doc.profiles?.full_name} · {DOC_LABEL[doc.document_type]}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>REASON FOR REJECTION *</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Document is blurry / expired / does not match student details…"
          rows={4}
          style={{ width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleReject} disabled={!reason.trim() || pending} style={{ flex: 2, padding: '9px', borderRadius: 8, background: reason.trim() ? '#f43f5e' : '#27272a', color: reason.trim() ? '#fff' : '#52525b', border: 'none', fontSize: 13, fontWeight: 700, cursor: reason.trim() ? 'pointer' : 'not-allowed', opacity: pending ? 0.5 : 1 }}>
            {pending ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════ SECURE PREVIEW MODAL (60s signed URL + watermark) ══════════════════════
function PreviewModal({ doc, onClose }: { doc: DocRow; onClose: () => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useState(() => {
    (async () => {
      const result = await getSignedDocumentUrl(doc.file_path)
      if (result.url) setSignedUrl(result.url)
      else setError(result.error ?? 'Failed to load document')
      setLoading(false)
    })()
  })

  const isPdf = doc.file_path.endsWith('.pdf')
  const watermarkText = `CONFIDENTIAL — Reviewed ${new Date().toLocaleDateString('en-ZA')}`

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 20, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{doc.profiles?.full_name} — {DOC_LABEL[doc.document_type]}</div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Link expires in 60 seconds · {doc.original_filename}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ position: 'relative', flex: 1, overflow: 'auto', background: '#000', borderRadius: 8, minHeight: 300 }}>
          {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#71717a', fontSize: 13 }}>Loading secure preview…</div>}
          {error && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#f43f5e', fontSize: 13 }}>{error}</div>}
          {signedUrl && !error && (
            <div style={{ position: 'relative' }}>
              {isPdf ? (
                <iframe src={signedUrl} style={{ width: '100%', height: 500, border: 'none' }} />
              ) : (
                <img src={signedUrl} alt="Document preview" style={{ width: '100%', display: 'block' }} />
              )}

              {/* Watermark overlay — diagonal repeated text over the preview */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(4, 1fr)',
                overflow: 'hidden',
              }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: 'rotate(-30deg)', opacity: 0.35,
                    fontSize: 12, fontWeight: 700, color: '#fff',
                    whiteSpace: 'nowrap', letterSpacing: '0.05em',
                    textShadow: '0 0 4px rgba(0,0,0,0.8)',
                  }}>
                    {watermarkText}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
