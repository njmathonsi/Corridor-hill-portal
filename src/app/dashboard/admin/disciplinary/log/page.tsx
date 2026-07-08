import { createClient } from '@/lib/supabase/server'
import OffenceLogForm from './OffenceLogForm'

export default async function LogOffencePage() {
  const supabase = createClient()
  const [{ data: students }, { data: defs }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, student_number').eq('role','student').order('full_name'),
    supabase.from('offence_definitions').select('id, category, offence_name, fine_1st, fine_2nd, fine_3rd, outcome_1st, outcome_2nd, outcome_3rd, involves_cost_recovery, requires_confiscation').eq('is_active', true).order('category').order('offence_name'),
  ])
  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Log Offence</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Record a disciplinary incident · Outcomes are auto-calculated per escalation schedule</p>
      <OffenceLogForm students={students ?? []} offenceDefinitions={defs ?? []} />
    </div>
  )
}
