'use server'
// lib/actions/pass-tracker.ts
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface LogTransitInput {
  studentId: string
  direction: 'exit' | 'entry'
  destination?: string
  purpose?: string
  expectedReturn?: string
  keyHandedOver?: boolean
  keyNumber?: string
  notes?: string
}

export async function logTransit(input: LogTransitInput) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  // Fetch active lease to link
  const { data: lease } = await supabase
    .from('leases')
    .select('id')
    .eq('student_id', input.studentId)
    .eq('is_active', true)
    .limit(1)
    .single()

  const { error } = await supabase.from('boundary_transits').insert({
    student_id:     input.studentId,
    lease_id:       lease?.id ?? null,
    direction:      input.direction,
    destination:    input.destination ?? null,
    purpose:        input.purpose ?? null,
    expected_return: input.expectedReturn ?? null,
    key_number:     input.keyNumber ?? null,
    key_handed_over: input.keyHandedOver ?? false,
    key_returned:   input.direction === 'entry' && input.keyHandedOver,
    logged_by:      session.user.id,
    notes:          input.notes ?? null,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/admin/pass-tracker')
  return { success: true }
}

export async function exportManifest(format: 'csv') {
  // Returns the raw data for client-side CSV export
  const supabase = createClient()
  const { data } = await supabase.from('active_passes').select('*')
  return { data: data ?? [] }
}
