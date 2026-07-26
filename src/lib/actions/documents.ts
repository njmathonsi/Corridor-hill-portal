'use server'
// lib/actions/documents.ts
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateFileBuffer, extensionForMime, MAX_FILE_SIZE_BYTES } from '@/lib/validation/fileValidation'

const RATE_LIMIT_MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_HOURS = 1

type DocType = 'id_document' | 'proof_of_registration'

interface UploadResult {
  success: boolean
  error?: string
}

// ─────────────────────────────────────────────────────────────────
// UPLOAD DOCUMENT — full server-side pipeline:
// auth check → rate limit → pending-lock check → magic byte validation
// → storage upload → DB upsert → attempt log
// ─────────────────────────────────────────────────────────────────
export async function uploadDocument(formData: FormData): Promise<UploadResult> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const userId = session.user.id
  const documentType = formData.get('documentType') as DocType | null
  const file = formData.get('file') as File | null

  if (!documentType || !['id_document', 'proof_of_registration'].includes(documentType)) {
    return { success: false, error: 'Invalid document type' }
  }
  if (!file) return { success: false, error: 'No file provided' }

  // ── 1. RATE LIMIT: max 5 attempts per hour per user ──
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
  const { count: recentAttempts } = await supabase
    .from('upload_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('attempted_at', windowStart)

  if ((recentAttempts ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS) {
    await logAttempt(supabase, userId, false, 'rate_limited')
    return { success: false, error: `Too many upload attempts. Please wait before trying again (max ${RATE_LIMIT_MAX_ATTEMPTS} per hour).` }
  }

  // ── 2. PENDING LOCK: block new upload if one is already awaiting review ──
  const { data: existing } = await supabase
    .from('student_documents')
    .select('id, status, file_path')
    .eq('user_id', userId)
    .eq('document_type', documentType)
    .maybeSingle()

  if (existing?.status === 'pending') {
    await logAttempt(supabase, userId, false, 'pending_exists')
    return { success: false, error: 'You already have a submission pending review for this document. Please wait for it to be processed.' }
  }

  // ── 3. SIZE CHECK (fast fail before reading full buffer if huge) ──
  if (file.size > MAX_FILE_SIZE_BYTES) {
    await logAttempt(supabase, userId, false, 'too_large')
    return { success: false, error: 'File exceeds the 5MB size limit' }
  }

  // ── 4. MAGIC BYTE VALIDATION (the real security gate) ──
  const buffer = await file.arrayBuffer()
  const validation = validateFileBuffer(buffer, file.type)
  if (!validation.valid) {
    await logAttempt(supabase, userId, false, 'invalid_type')
    return { success: false, error: validation.error }
  }

  const ext = extensionForMime(validation.detectedMime!)
  const timestamp = Date.now()
  const storagePath = `${userId}/${documentType}/${timestamp}.${ext}`

  // ── 5. Remove old file from storage if replacing a rejected submission ──
  if (existing?.file_path) {
    await supabase.storage.from('student-documents').remove([existing.file_path])
  }

  // ── 6. Upload to private storage bucket ──
  const { error: uploadErr } = await supabase.storage
    .from('student-documents')
    .upload(storagePath, buffer, {
      contentType: validation.detectedMime,
      upsert: false,
    })

  if (uploadErr) {
    await logAttempt(supabase, userId, false, 'storage_error')
    return { success: false, error: `Upload failed: ${uploadErr.message}` }
  }

  // ── 7. Upsert the DB record (resets status to pending, clears rejection) ──
  const { error: dbErr } = await supabase
    .from('student_documents')
    .upsert({
      user_id: userId,
      document_type: documentType,
      file_path: storagePath,
      original_filename: file.name,
      file_size_bytes: file.size,
      mime_type: validation.detectedMime,
      status: 'pending',
      rejection_reason: null,
      uploaded_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
    }, { onConflict: 'user_id,document_type' })

  if (dbErr) {
    // Roll back the storage upload if the DB write failed
    await supabase.storage.from('student-documents').remove([storagePath])
    return { success: false, error: dbErr.message }
  }

  await logAttempt(supabase, userId, true, 'ok')
  revalidatePath('/dashboard/student/documents')
  revalidatePath('/dashboard/admin/documents')
  return { success: true }
}

async function logAttempt(supabase: any, userId: string, succeeded: boolean, reason: string) {
  await supabase.from('upload_attempts').insert({ user_id: userId, succeeded, reason })
}

// ─────────────────────────────────────────────────────────────────
// ADMIN: APPROVE a document
// ─────────────────────────────────────────────────────────────────
export async function approveDocument(documentId: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  const { error } = await supabase
    .from('student_documents')
    .update({
      status: 'approved',
      rejection_reason: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    })
    .eq('id', documentId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/admin/documents')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// ADMIN: REJECT a document (with mandatory reason)
// ─────────────────────────────────────────────────────────────────
export async function rejectDocument(documentId: string, reason: string) {
  if (!reason.trim()) return { success: false, error: 'A rejection reason is required' }

  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  const { error } = await supabase
    .from('student_documents')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    })
    .eq('id', documentId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/admin/documents')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Generate a short-lived (60s) signed URL for admin document preview
// ─────────────────────────────────────────────────────────────────
export async function getSignedDocumentUrl(filePath: string): Promise<{ url: string | null; error?: string }> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { url: null, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  const isOwner = filePath.startsWith(`${session.user.id}/`)
  if (profile?.role !== 'admin' && !isOwner) {
    return { url: null, error: 'Insufficient permissions' }
  }

  const { data, error } = await supabase.storage
    .from('student-documents')
    .createSignedUrl(filePath, 60) // expires in 60 seconds

  if (error) return { url: null, error: error.message }
  return { url: data.signedUrl }
}
