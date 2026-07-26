import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DocumentUploadCard from './DocumentUploadCard'

export default async function StudentDocumentsPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: documents } = await supabase
    .from('student_documents')
    .select('id, document_type, status, rejection_reason, uploaded_at, original_filename, file_size_bytes')
    .eq('user_id', session.user.id)

  const idDoc = documents?.find(d => d.document_type === 'id_document') ?? null
  const porDoc = documents?.find(d => d.document_type === 'proof_of_registration') ?? null

  return (
    <div style={{ padding: 28, maxWidth: 620 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>My Documents</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>
        Upload your ID Document and Proof of Registration for verification. Accepted formats: PDF, PNG, JPEG (max 5MB).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DocumentUploadCard
          documentType="id_document"
          label="ID Document"
          description="A clear copy of your South African ID or passport"
          existing={idDoc}
        />
        <DocumentUploadCard
          documentType="proof_of_registration"
          label="Proof of Registration"
          description="Your official registration confirmation from the institution"
          existing={porDoc}
        />
      </div>

      <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 11, color: '#71717a', lineHeight: 1.6 }}>
        🔒 Your documents are stored securely and are only visible to you and residence administrators for verification purposes, in line with POPIA.
      </div>
    </div>
  )
}
