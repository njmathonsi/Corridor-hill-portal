'use server'
// lib/actions/room-management.ts
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignRoom(input: {
  roomId: number
  studentId: string
  keyNumber?: string
  leaseStartDate?: string
  leaseEndDate?: string
  academicYear?: string
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  // Deactivate any existing active lease for this student
  await supabase
    .from('leases')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('student_id', input.studentId)
    .eq('is_active', true)

  // Create new lease
  const { error: leaseError } = await supabase.from('leases').insert({
    student_id:          input.studentId,
    room_id:             input.roomId,
    lease_status:        'Checked-In',
    academic_year:       input.academicYear ?? new Date().getFullYear().toString(),
    lease_start_date:    input.leaseStartDate ?? new Date().toISOString().split('T')[0],
    lease_end_date:      input.leaseEndDate ?? null,
    check_in_date:       new Date().toISOString(),
    assigned_key_number: input.keyNumber ?? null,
    key_issued_at:       input.keyNumber ? new Date().toISOString() : null,
    assigned_by:         session.user.id,
    is_active:           true,
  })

  if (leaseError) return { success: false, error: leaseError.message }

  // rooms.is_available is handled by DB trigger (sync_room_availability)
  revalidatePath('/dashboard/admin/room-management')
  revalidatePath('/dashboard/admin/overview')
  return { success: true }
}

export async function checkOutStudent(leaseId: string, roomId: number) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  const { error } = await supabase
    .from('leases')
    .update({
      lease_status:   'Checked-Out',
      check_out_date: new Date().toISOString(),
      is_active:      false,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', leaseId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/admin/room-management')
  revalidatePath('/dashboard/admin/pass-tracker')
  return { success: true }
}

export async function updateLeaseStatus(
  leaseId: string,
  status: 'Checked-In' | 'Checked-Out' | 'Room Transfer Pending'
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  const update: Record<string, unknown> = {
    lease_status: status,
    updated_at:   new Date().toISOString(),
  }
  if (status === 'Checked-Out') {
    update.check_out_date = new Date().toISOString()
    update.is_active = false
  }

  const { error } = await supabase.from('leases').update(update).eq('id', leaseId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/admin/room-management')
  return { success: true }
}
