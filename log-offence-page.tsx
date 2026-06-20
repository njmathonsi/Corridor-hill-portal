// app/dashboard/admin/disciplinary/log/page.tsx
import { createClient } from '@/lib/supabase/server'
import OffenceLogClient from './OffenceLogClient'

export const revalidate = 0

export default async function LogOffencePage() {
  const supabase = createClient()

  const [
    { data: students },
    { data: offenceDefinitions },
    { data: prevCountsRaw },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, student_number')
      .eq('role', 'student')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('offence_definitions')
      .select('id, category, offence_name, fine_1st, fine_2nd, fine_3rd, outcome_1st, outcome_2nd, outcome_3rd, involves_cost_recovery, requires_confiscation')
      .eq('is_active', true)
      .order('category')
      .order('offence_name'),
    // Pre-compute per-student per-offence counts for the tier calculator
    supabase.rpc('get_offence_counts_per_student'),
  ])

  // Fallback if RPC doesn't exist yet: empty array
  const prevCounts = (prevCountsRaw ?? []) as { student_id: string; offence_definition_id: number; count: number }[]

  return (
    <div className="animate-page">
      <OffenceLogClient
        students={students ?? []}
        offenceDefinitions={offenceDefinitions ?? []}
        prevCounts={prevCounts}
      />
    </div>
  )
}
