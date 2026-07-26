import { createClient } from '@/lib/supabase/server'
import DocumentReviewTable from './DocumentReviewTable'

export default async function AdminDocumentsPage() {
  const supabase = createClient()

  const { data: documents } = await supabase
    .from('student_documents')
    .select(`
      id, document_type, file_path, status, rejection_reason,
      uploaded_at, reviewed_at, original_filename, file_size_bytes,
      profiles!student_documents_user_id_fkey ( full_name, student_number, email )
    `)
    .order('uploaded_at', { ascending: false })

  const pending  = (documents ?? []).filter(d => d.status === 'pending').length
  const approved = (documents ?? []).filter(d => d.status === 'approved').length
  const rejected = (documents ?? []).filter(d => d.status === 'rejected').length

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Document Verification</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Review student ID documents and proof of registration submissions</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Pending Review', value: pending,  color: '#f59e0b' },
          { label: 'Approved',       value: approved, color: '#10b981' },
          { label: 'Rejected',       value: rejected, color: '#f43f5e' },
        ].map(t => (
          <div key={t.label} style={{ flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}>{t.value}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <DocumentReviewTable documents={(documents ?? []) as any} />
    </div>
  )
}
