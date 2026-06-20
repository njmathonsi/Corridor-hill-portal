'use server'
// lib/actions/profile.ts
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(input: {
  fullName: string
  studentNumber?: string
  idNumber?: string
  phone?: string
  faculty?: string
  course?: string
  yearOfStudy?: number
  studentYearType?: 'first_year' | 'senior'
  fundingType?: string
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name:        input.fullName,
      student_number:   input.studentNumber || null,
      id_number:        input.idNumber || null,
      phone:            input.phone || null,
      faculty:          input.faculty || null,
      course:           input.course || null,
      year_of_study:    input.yearOfStudy || null,
      student_year_type: input.studentYearType || null,
      funding_type:     input.fundingType || null,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', session.user.id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/student/onboarding/step-1-profile')
  revalidatePath('/dashboard/student/home')
  return { success: true }
}
