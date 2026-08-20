'use client'
import { useState, useMemo, useEffect, useTransition } from 'react'
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
}

interface StudentGroup {
  userId: string
  fullName: string
  studentNumber: string
  email: string
  docs: DocRow[]
}

const DOC_LABEL: Record<DocType, string> = {
  id_document: 'ID Document',
  proof_of_registration: 'Proof of Registration',
}

const STATUS_STYLE: Record<Status, { bg: string; color: string; border: string }> = {
  pending:  { bg: 'rgb(var(--brand-rgb) / 0.15)', color: 'var(--brand)', border: 'rgb(var(--brand-rgb) / 0.3)' },
  approved: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  rejected: { bg: 'rgba(244,63,94,0.12)',  color: '#f43f5e', border: 'rgba(244,63,94,0.3)'  },
}

function overallStatus(docs: DocRow[]): Status {
  if (docs.some(d => d.status === 'rejected')) return 'rejected'
  if (docs.every(d => d.status === 'approved')) return 'approved'
  return 'pending'
}

export default function StudentDocumentsTable({ students, autoOpenUserId }: { students: StudentGroup[]; autoOpenUserId?: string }) {
  const [filter, setFilter] = useState<'all' | Status>('all')
  const [openStudent, setOpenStudent] = useState<StudentGroup | null>(null)
  const [previewDoc, setPreviewDoc] = useState<DocRow | null>(null)
  const [rejectingDoc, setRejectingDoc] = useState<DocRow | null>(null)

  // Auto-open the drawer if we arrived from the guided Applications workflow
  useEffect(() => {
    if (autoOpenUserId) {
      const match = students.find(s => s.userId === autoOpenUserId)
      if (match) setOpenStudent(match)
    }
  }, [autoOpenUserId, students])

  const filtered = useMemo(() => {
    if (filter === 'all') return students
    return students.filter(s => overallStatus(s.docs) === filter)
  }, [students, filter])

  return (
    <div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: '#1f1f23', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === f ? '#18181b' : 'transparent', color: filter === f ? '#fafafa' : '#71717a', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Student', 'Uploads', 'Latest Upload', 'Overall Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>No students in this category.</td></tr>
            )}
            {filtered.map(student => {
              const status = overallStatus(student.docs)
              const s = STATUS_STYLE[status]
              const approvedCount = student.docs.filter(d => d.status === 'approved').length
              const missingTypes = (['id_document', 'proof_of_registration'] as DocType[]).filter(t => !student.docs.some(d => d.document_type === t))
              const latestUpload = student.docs.reduce((latest, d) => new Date(d.uploaded_at) > new Date(latest) ? d.uploaded_at : latest, student.docs[0]?.uploaded_at)

              return (
                <tr key={student.userId} onClick={() => setOpenStudent(student)} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#fafafa' }}>{student.fullName}</div>
                    <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'monospace' }}>{student.studentNumber}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: '#a1a1aa' }}>{student.docs.length}/2 uploaded</span>
                    {approvedCount > 0 && <span style={{ color: '#10b981', marginLeft: 8 }}>{approvedCount} approved</span>}
                    {missingTypes.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {missingTypes.map(t => (
                          <span key={t} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: '#52525b', border: '1px solid rgba(255,255,255,0.08)', marginRight: 4 }}>
                            Missing: {DOC_LABEL[t]}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#71717a', fontFamily: 'monospace', fontSize: 11 }}>
                    {latestUpload ? new Date(latestUpload).toLocaleDateString('en-ZA') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'capitalize' }}>{status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={(e) => { e.stopPropagation(); setOpenStudent(student) }} style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Review →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {openStudent && (
        <StudentDrawer
          student={openStudent}
          onClose={() => setOpenStudent(null)}
          onPreview={setPreviewDoc}
          onReject={setRejectingDoc}
        />
      )}
      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
      {rejectingDoc && <RejectModal doc={rejectingDoc} onClose={() => setRejectingDoc(null)} onDone={() => { setRejectingDoc(null); setOpenStudent(prev => prev) }} />}
    </div>
  )
}

// ══════════════════════ STUDENT DRAWER ══════════════════════
function StudentDrawer({ student, onClose, onPreview, onReject }: {
  student: StudentGroup
  onClose: () => void
  onPreview: (doc: DocRow) => void
  onReject: (doc: DocRow) => void
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const idDoc  = student.docs.find(d => d.document_type === 'id_document') ?? null
  const porDoc = student.docs.find(d => d.document_type === 'proof_of_registration') ?? null

  const pendingDocs = student.docs.filter(d => d.status === 'pending')

  function handleApproveAll() {
    if (pendingDocs.length === 0) return
    startTransition(async () => {
      for (const doc of pendingDocs) {
        await approveDocument(doc.id)
      }
      router.refresh()
    })
  }

  function handleApproveOne(docId: string) {
    startTransition(async () => {
      await approveDocument(docId)
      router.refresh()
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', borderLeft: '1px solid rgba(255,255,255,0.12)', width: '100%', maxWidth: 480, height: '100%', overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fafafa' }}>{student.fullName}</div>
            <div style={{ fontSize: 12, color: '#71717a', fontFamily: 'monospace', marginTop: 2 }}>{student.studentNumber} · {student.email}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {pendingDocs.length > 1 && (
          <button
            onClick={handleApproveAll}
            disabled={pending}
            style={{ width: '100%', padding: '11px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 16, opacity: pending ? 0.5 : 1 }}
          >
            {pending ? 'Approving…' : `✓ Approve All (${pendingDocs.length} pending)`}
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(['id_document', 'proof_of_registration'] as DocType[]).map(type => {
            const doc = type === 'id_document' ? idDoc : porDoc
            return (
              <div key={type} style={{ background: '#1f1f23', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>{DOC_LABEL[type]}</div>
                  {doc ? (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: STATUS_STYLE[doc.status].bg, color: STATUS_STYLE[doc.status].color, border: `1px solid ${STATUS_STYLE[doc.status].border}`, textTransform: 'capitalize' }}>
                      {doc.status}
                    </span>
                  ) : (
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#71717a', border: '1px solid rgba(255,255,255,0.1)' }}>Not Uploaded</span>
                  )}
                </div>

                {!doc ? (
                  <div style={{ fontSize: 12, color: '#52525b', padding: '10px 0' }}>Student has not uploaded this document yet.</div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: '#71717a', marginBottom: 12 }}>
                      {doc.original_filename} · {doc.file_size_bytes ? (doc.file_size_bytes / 1024 / 1024).toFixed(2) : '—'}MB · {new Date(doc.uploaded_at).toLocaleDateString('en-ZA')}
                    </div>

                    {doc.status === 'rejected' && doc.rejection_reason && (
                      <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', fontSize: 11, color: '#f43f5e', marginBottom: 10 }}>
                        <strong>Reason:</strong> {doc.rejection_reason}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => onPreview(doc)} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>👁 View</button>
                      {doc.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveOne(doc.id)} disabled={pending} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: pending ? 0.5 : 1 }}>✓ Approve</button>
                          <button onClick={() => onReject(doc)} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>✕ Reject</button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════ REJECT MODAL ══════════════════════
function RejectModal({ doc, onClose, onDone }: { doc: DocRow; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleReject() {
    if (!reason.trim()) return
    startTransition(async () => {
      const result = await rejectDocument(doc.id, reason)
      if (result.success) { router.refresh(); onDone() }
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Reject {DOC_LABEL[doc.document_type]}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>REASON FOR REJECTION *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Document is blurry, expired, or details don't match…" rows={4} style={{ width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }} />
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

// ══════════════════════ PREVIEW MODAL (60s signed URL + watermark) ══════════════════════
function PreviewModal({ doc, onClose }: { doc: DocRow; onClose: () => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      const result = await getSignedDocumentUrl(doc.file_path)
      if (result.url) setSignedUrl(result.url)
      else setError(result.error ?? 'Failed to load document')
      setLoading(false)
    })()
  }, [doc.file_path])

  const isPdf = doc.file_path.endsWith('.pdf')
  const watermarkText = `CONFIDENTIAL — Reviewed ${new Date().toLocaleDateString('en-ZA')}`

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 20, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{DOC_LABEL[doc.document_type]}</div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Link expires in 60 seconds · {doc.original_filename}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ position: 'relative', flex: 1, overflow: 'auto', background: '#000', borderRadius: 8, minHeight: 300 }}>
          {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#71717a', fontSize: 13 }}>Loading secure preview…</div>}
          {error && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#f43f5e', fontSize: 13 }}>{error}</div>}
          {signedUrl && !error && (
            <div style={{ position: 'relative' }}>
              {isPdf ? <iframe src={signedUrl} style={{ width: '100%', height: 500, border: 'none' }} /> : <img src={signedUrl} alt="Document preview" style={{ width: '100%', display: 'block' }} />}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', overflow: 'hidden' }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-30deg)', opacity: 0.35, fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '0.05em', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
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
