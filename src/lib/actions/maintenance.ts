'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateFileBuffer, extensionForMime } from '@/lib/validation/fileValidation'

type Status = 'pending' | 'assigned' | 'in_progress' | 'completed'

interface ActionResult {
  success: boolean
  error?: string
}

function revalidateAll() {
  revalidatePath('/dashboard/student/report-issue')
  revalidatePath('/dashboard/admin/maintenance')
  revalidatePath('/dashboard/maintenance')
}

// ─────────────────────────────────────────────────────────────────
// STUDENT: report a maintenance issue for their currently assigned room
// ─────────────────────────────────────────────────────────────────
export async function reportMaintenanceIssue(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const category = formData.get('category') as string | null
  const description = (formData.get('description') as string | null)?.trim()
  const files = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)

  if (!category) return { success: false, error: 'Category is required' }
  if (!description) return { success: false, error: 'Please describe the issue' }

  const { data: lease } = await supabase
    .from('leases')
    .select('room_id')
    .eq('student_id', session.user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!lease) return { success: false, error: 'No active room assignment found on your account' }

  const { data: request, error: insertErr } = await supabase
    .from('maintenance_requests')
    .insert({ student_id: session.user.id, room_id: lease.room_id, category, description })
    .select('id')
    .single()

  if (insertErr || !request) return { success: false, error: insertErr?.message ?? 'Failed to submit request' }

  const paths: string[] = []
  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const validation = validateFileBuffer(buffer, file.type)
    if (!validation.valid) continue // skip files that fail the magic-byte check rather than failing the whole report
    const ext = extensionForMime(validation.detectedMime!)
    const path = `${session.user.id}/${request.id}/${Date.now()}-${paths.length}.${ext}`
    const { error: upErr } = await supabase.storage.from('maintenance-photos').upload(path, buffer, { contentType: validation.detectedMime })
    if (!upErr) paths.push(path)
  }

  if (paths.length > 0) {
    await supabase.from('maintenance_requests').update({ photo_urls: paths }).eq('id', request.id)
  }

  revalidateAll()
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// ADMIN: assign (or reassign) a ticket to a specific maintenance worker
// ─────────────────────────────────────────────────────────────────
export async function assignMaintenanceTicket(requestId: string, workerId: string): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  const { error } = await supabase
    .from('maintenance_requests')
    .update({ assigned_to: workerId, status: 'assigned', assigned_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) return { success: false, error: error.message }
  revalidateAll()
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// ADMIN: manual status override (e.g. re-opening a ticket)
// ─────────────────────────────────────────────────────────────────
export async function adminSetMaintenanceStatus(requestId: string, status: Status): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  const patch: Record<string, any> = { status }
  if (status === 'completed') {
    patch.resolved_at = new Date().toISOString()
    patch.resolved_by = session.user.id
  }

  const { error } = await supabase.from('maintenance_requests').update(patch).eq('id', requestId)
  if (error) return { success: false, error: error.message }

  revalidateAll()
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// MAINTENANCE WORKER: claim an open (pending, unassigned) ticket
// ─────────────────────────────────────────────────────────────────
export async function claimMaintenanceTicket(requestId: string): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('maintenance_requests')
    .update({ assigned_to: session.user.id, status: 'assigned', assigned_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'pending') // guards against a race where someone else claimed it first

  if (error) return { success: false, error: error.message }
  revalidateAll()
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// MAINTENANCE WORKER: start work on a ticket assigned to them
// ─────────────────────────────────────────────────────────────────
export async function startMaintenanceTicket(requestId: string): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('maintenance_requests')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('assigned_to', session.user.id)

  if (error) return { success: false, error: error.message }
  revalidateAll()
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// MAINTENANCE WORKER: mark a ticket assigned to them as completed
// ─────────────────────────────────────────────────────────────────
export async function completeMaintenanceTicket(requestId: string): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('maintenance_requests')
    .update({ status: 'completed', resolved_at: new Date().toISOString(), resolved_by: session.user.id })
    .eq('id', requestId)
    .eq('assigned_to', session.user.id)

  if (error) return { success: false, error: error.message }
  revalidateAll()
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Short-lived signed URL for a maintenance photo
// (owner student, an admin, or the maintenance worker assigned to that ticket)
// ─────────────────────────────────────────────────────────────────
export async function getSignedMaintenancePhotoUrl(filePath: string): Promise<{ url: string | null; error?: string }> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { url: null, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  const isOwner = filePath.startsWith(`${session.user.id}/`)

  let isAssignedWorker = false
  if (profile?.role === 'maintenance' && !isOwner) {
    const requestId = filePath.split('/')[1]
    const { data: request } = await supabase
      .from('maintenance_requests')
      .select('id')
      .eq('id', requestId)
      .eq('assigned_to', session.user.id)
      .maybeSingle()
    isAssignedWorker = !!request
  }

  if (profile?.role !== 'admin' && !isOwner && !isAssignedWorker) {
    return { url: null, error: 'Insufficient permissions' }
  }

  const { data, error } = await supabase.storage.from('maintenance-photos').createSignedUrl(filePath, 300)
  if (error) return { url: null, error: error.message }
  return { url: data.signedUrl }
}
