import { createClient } from '@/lib/supabase/server'

export default async function LogOffencePage() {
  const supabase = createClient()
  const { data: students } = await supabase.from('profiles').select('id, full_name, student_number').eq('role','student').order('full_name')
  const { data: defs } = await supabase.from('offence_definitions').select('id, category, offence_name, fine_1st, outcome_1st').eq('is_active', true).order('category').order('offence_name')

  return (
    <div style={{ padding: 28, maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Log Offence</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Record a disciplinary incident against a student</p>
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 16 }}>
          Use the Supabase dashboard to log offences directly until the full form is integrated.<br/><br/>
          <strong style={{ color: '#fafafa' }}>Students available:</strong> {students?.length ?? 0}<br/>
          <strong style={{ color: '#fafafa' }}>Offence definitions:</strong> {defs?.length ?? 0} loaded
        </p>
        <div style={{ fontSize: 11, color: '#71717a', padding: '10px 14px', background: '#1f1f23', borderRadius: 8, fontFamily: 'monospace' }}>
          Table: offences_log<br/>
          Go to Supabase → Table Editor → offences_log → Insert Row
        </div>
      </div>
    </div>
  )
}
