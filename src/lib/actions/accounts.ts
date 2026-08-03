'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

type Role = 'student' | 'admin' | 'maintenance'

interface ActionResult {
  success: boolean
  error?: string
}

// ─────────────────────────────────────────────────────────────────
// ADMIN: create a student/admin/maintenance account via the Auth Admin
// API. Runs entirely server-side under the service role, so it never
// touches (or swaps) the calling admin's own session, and it bypasses
// the RLS trigger that stops a brand-new account from self-promoting.
// ─────────────────────────────────────────────────────────────────
export async function createAccountAsAdmin(input: {
  fullName: string
  email: string
  password: string
  role: Role
  studentNumber?: string
}): Promise<ActionResult> {
  const { fullName, email, password, role, studentNumber } = input

  if (!fullName.trim() || !email.trim() || !password.trim()) {
    return { success: false, error: 'Full name, email, and password are required' }
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' }
  }

  // Caller must be an authenticated admin — checked against the caller's own
  // session/RLS, not the privileged client, so this can't be forged.
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (caller?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  const admin = createAdminClient()

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createErr || !created.user) {
    return { success: false, error: createErr?.message ?? 'Failed to create account' }
  }

  const { error: updateErr } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      role,
      student_number: role === 'student' ? (studentNumber || null) : null,
      onboarding_complete: role !== 'student',
    })
    .eq('id', created.user.id)

  if (updateErr) {
    // Roll back the orphaned auth user rather than leaving a half-created account
    await admin.auth.admin.deleteUser(created.user.id)
    return { success: false, error: updateErr.message }
  }

  revalidatePath('/dashboard/admin/create-account')
  return { success: true }
}
