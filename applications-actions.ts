'use server'
// lib/actions/applications.ts
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ReviewInput {
  applicationId: string
  status: 'submitted' | 'under_review' | 'approved' | 'rejected'
  rejectionReason?: string
  adminNotes?: string
  financialStatus?: string
  financialCleared?: boolean
}

export async function reviewApplication(input: ReviewInput) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  const { error } = await supabase
    .from('applications')
    .update({
      status:           input.status,
      reviewed_by:      session.user.id,
      reviewed_at:      new Date().toISOString(),
      rejection_reason: input.rejectionReason ?? null,
      admin_notes:      input.adminNotes ?? null,
      financial_status: input.financialStatus ?? undefined,
      financial_cleared: input.financialCleared ?? undefined,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', input.applicationId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/admin/applications')
  return { success: true }
}

export async function submitApplication(input: {
  studentId: string
  academicYear: string
  proofOfRegistrationUrl?: string
  idCopyUrl?: string
  sportAchievements?: string
  culturalAchievements?: string
  leadershipRoles?: string
  medicalConditions?: string
  disabilityInfo?: string
  currentAcademicAverage?: number
  preferredBlock?: string
  preferredRoomType?: string
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || session.user.id !== input.studentId) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check for existing application this year
  const { data: existing } = await supabase
    .from('applications')
    .select('id, status')
    .eq('student_id', input.studentId)
    .eq('academic_year', input.academicYear)
    .limit(1)
    .single()

  const payload = {
    student_id:             input.studentId,
    academic_year:          input.academicYear,
    status:                 'submitted' as const,
    submitted_at:           new Date().toISOString(),
    proof_of_registration_url: input.proofOfRegistrationUrl ?? null,
    id_copy_url:            input.idCopyUrl ?? null,
    sport_achievements:     input.sportAchievements ?? null,
    cultural_achievements:  input.culturalAchievements ?? null,
    leadership_roles:       input.leadershipRoles ?? null,
    medical_conditions:     input.medicalConditions ?? null,
    disability_info:        input.disabilityInfo ?? null,
    current_academic_average: input.currentAcademicAverage ?? null,
    preferred_block:        input.preferredBlock ?? null,
    preferred_room_type:    input.preferredRoomType ?? null,
    updated_at:             new Date().toISOString(),
  }

  if (existing && (existing.status === 'draft' || existing.status === 'rejected')) {
    const { error } = await supabase
      .from('applications')
      .update(payload)
      .eq('id', existing.id)
    if (error) return { success: false, error: error.message }
  } else if (!existing) {
    const { error } = await supabase.from('applications').insert(payload)
    if (error) return { success: false, error: error.message }
  } else {
    return { success: false, error: 'An application for this year already exists' }
  }

  revalidatePath('/dashboard/student/onboarding/step-2-application')
  revalidatePath('/dashboard/student/home')
  return { success: true }
}

export async function updateFinancialStatus(applicationId: string, financialStatus: string, cleared: boolean) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  const { error } = await supabase
    .from('applications')
    .update({ financial_status: financialStatus, financial_cleared: cleared, updated_at: new Date().toISOString() })
    .eq('id', applicationId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/admin/applications')
  return { success: true }
}
