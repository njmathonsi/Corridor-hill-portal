'use server'
// lib/actions/conduct.ts
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

interface AckInput {
  studentId: string
  signatureData: string
  ackMethod: 'digital_checkbox' | 'e_signature' | 'wet_signature_scan'
}

export async function acknowledgeConduct(input: AckInput) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || session.user.id !== input.studentId) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get IP and user agent for compliance logging
  const headersList = headers()
  const userAgent = headersList.get('user-agent') ?? 'unknown'
  const forwarded = headersList.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] ?? '127.0.0.1'

  // Get active lease to link
  const { data: lease } = await supabase
    .from('leases')
    .select('id')
    .eq('student_id', input.studentId)
    .eq('is_active', true)
    .limit(1)
    .single()

  const { error } = await supabase.from('conduct_acknowledgements').insert({
    student_id:       input.studentId,
    lease_id:         lease?.id ?? null,
    document_version: '2025-v1',
    ack_method:       input.ackMethod,
    signature_data:   input.signatureData,
    is_verified:      false,  // Admin must verify
    ip_address:       ip,
    user_agent:       userAgent,
    acknowledged_at:  new Date().toISOString(),
  })

  if (error) return { success: false, error: error.message }

  // Mark onboarding step complete
  await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', input.studentId)

  revalidatePath('/dashboard/student/onboarding/step-4-conduct')
  revalidatePath('/dashboard/student/home')
  return { success: true }
}
