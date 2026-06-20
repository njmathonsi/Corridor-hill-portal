// app/dashboard/student/onboarding/step-4-conduct/page.tsx
// (conduct acknowledgement — most complex step; others follow same pattern)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConductAckForm from '@/components/student/ConductAckForm'

export default async function Step4ConductPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  // Check if already acknowledged
  const { data: existing } = await supabase
    .from('conduct_acknowledgements')
    .select('id, is_verified, acknowledged_at')
    .eq('student_id', session.user.id)
    .order('acknowledged_at', { ascending: false })
    .limit(1)
    .single()

  if (existing?.is_verified) {
    redirect('/dashboard/student/home')
  }

  return (
    <div className="animate-page" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📜</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Code of Conduct
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.6 }}>
          Please read and acknowledge the Corridor Hill Residence Rules.<br />
          This is a binding agreement required before your room is activated.
        </p>
      </div>

      {/* Scrollable CoC summary */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
        borderRadius: 'var(--r-lg)', padding: 20, marginBottom: 20,
        maxHeight: 320, overflowY: 'auto',
        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7,
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, fontSize: 13 }}>
          Corridor Hill Residence Code of Conduct — Key Rules
        </div>

        {[
          { cat: 'Category 1 — Internal DC Offences', items: [
            'No smoking indoors at any time (R50 fine; escalates to External DC on 3rd offence)',
            'No loud music or disturbance (Speaker confiscation; church fee flag on 2nd)',
            'No smuggling or consuming alcohol on premises',
            'No hard spirits (confiscation + R100 fine)',
            'Speed limit must be observed on property (R200 first offence)',
            'Visitor policy must be followed (R50 first offence)',
            'Dirty dishes policy — dishes washed within 2 hours of use',
            'Littering on any part of property (R50 fine)',
            'No unauthorised electrical equipment (confiscation + R50)',
            '⚠ Three or more Category 1 offences committed simultaneously → automatic External DC referral',
          ]},
          { cat: 'Category 2 — Property Damage', items: [
            'Any damage to residence property is logged and billed to the responsible student',
            'Items include: tables, chairs, doors, handles, towel rails, soap holders, toilet flush handles, blinds, windows, facia boards, furniture, and appliances',
          ]},
          { cat: 'Category 4 — Serious Offences', items: [
            'Drug possession, selling, or use: immediate management, TUT Judiciary, and Police notification',
            'Assault: immediate management, TUT Judiciary, and Police notification',
            'Verbal or physical abuse: immediate management, TUT Judiciary, and Police notification',
          ]},
          { cat: 'General Rules', items: [
            'You are responsible for your assigned room and any items within it',
            'Biometric registration is mandatory within 5 days of check-in',
            'All exits from the residence must be logged at reception',
            'You must carry your student card at all times on property',
            'Subletting your room to any person is strictly prohibited',
          ]},
        ].map(section => (
          <div key={section.cat} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontSize: 12 }}>
              {section.cat}
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {section.items.map((item, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ConductAckForm studentId={session.user.id} alreadyAcknowledged={!!existing} />
    </div>
  )
}
