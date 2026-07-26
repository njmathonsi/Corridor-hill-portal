import { createClient } from '@/lib/supabase/server'
import StudentDocumentsTable from './StudentDocumentsTable'

export default async function AdminDocumentsPage({ searchParams }: { searchParams: { student?: string } }) {
  const supabase = createClient()

  const { data: documents } = await supabase
    .from('student_documents')
    .select(`
      id, document_type, file_path, status, rejection_reason,
      uploaded_at, reviewed_at, original_filename, file_size_bytes, user_id,
      profiles!student_documents_user_id_fkey ( full_name, student_number, email )
    `)
    .order('uploaded_at', { ascending: false })

  // Group documents by student
  const byStudent = new Map<string, {
    userId: string
    fullName: string
    studentNumber: string
    email: string
    docs: typeof documents
  }>()

  for (const doc of documents ?? []) {
    const p = (doc as any).profiles
    if (!byStudent.has(doc.user_id)) {
      byStudent.set(doc.user_id, {
        userId: doc.user_id,
        fullName: p?.full_name ?? '—',
        studentNumber: p?.student_number ?? '—',
        email: p?.email ?? '—',
        docs: [],
      })
    }
    byStudent.get(doc.user_id)!.docs!.push(doc)
  }

  const students = Array.from(byStudent.values())

  const totalPending  = (documents ?? []).filter(d => d.status === 'pending').length
  const totalApproved = (documents ?? []).filter(d => d.status === 'approved').length
  const totalRejected = (documents ?? []).filter(d => d.status === 'rejected').length

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Document Verification</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Review student ID documents and proof of registration submissions</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Pending Files',  value: totalPending,  color: '#f59e0b' },
          { label: 'Approved Files', value: totalApproved, color: '#10b981' },
          { label: 'Rejected Files', value: totalRejected, color: '#f43f5e' },
        ].map(t => (
          <div key={t.label} style={{ flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}>{t.value}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <StudentDocumentsTable students={students as any} autoOpenUserId={searchParams.student} />
    </div>
  )
}
