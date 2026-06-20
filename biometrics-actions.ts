'use server'
// lib/actions/biometrics.ts
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleBiometricRegistration(
  studentId: string,
  register: boolean,
  deviceId?: string,
  deviceLabel?: string,
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  // Verify caller is admin
  const { data: admin } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', session.user.id)
    .single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  // Upsert the registration record
  const payload = {
    student_id: studentId,
    biometric_registered: register,
    registered_at: register ? new Date().toISOString() : null,
    deregistered_at: !register ? new Date().toISOString() : null,
    sync_status: register ? 'pending' : 'revoked',
    device_id: deviceId ?? 'MANUAL',
    device_label: deviceLabel ?? 'Admin Panel',
    registered_by: session.user.id,
  }

  const { error } = await supabase
    .from('biometric_registrations')
    .upsert(payload, { onConflict: 'student_id,device_id' })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/admin/biometrics-hub')
  return { success: true }
}

// ─────────────────────────────────────────────
// Update sync status (called by edge function / webhook)
// ─────────────────────────────────────────────
export async function updateBiometricSyncStatus(
  registrationId: string,
  status: 'synced' | 'failed',
  errorMessage?: string,
) {
  const supabase = createClient()

  const { error } = await supabase
    .from('biometric_registrations')
    .update({
      sync_status: status,
      last_synced_at: new Date().toISOString(),
      sync_error_message: errorMessage ?? null,
    })
    .eq('id', registrationId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/admin/biometrics-hub')
  return { success: true }
}
