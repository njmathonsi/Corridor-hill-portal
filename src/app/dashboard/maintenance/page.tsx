import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import TicketBoard from './TicketBoard'

export default async function MaintenanceDashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  // RLS already scopes this to: open (pending) tickets + anything assigned to me
  const { data: tickets } = await supabase
    .from('maintenance_requests')
    .select('id, category, description, status, reported_at, assigned_to, photo_urls, profiles!maintenance_requests_student_id_fkey(full_name, student_number), rooms(room_number, units(unit_code, blocks(code)))')
    .order('reported_at', { ascending: false })

  const list = (tickets ?? []) as any[]
  const open = list.filter(t => t.status === 'pending')
  const mine = list.filter(t => t.assigned_to === session.user.id && t.status !== 'completed')
  const completed = list.filter(t => t.assigned_to === session.user.id && t.status === 'completed')

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Ticket Board</h1>
        <p style={{ fontSize: 13, color: '#71717a' }}>Claim open repair tickets and track your active work</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Open (Unclaimed)', value: open.length, color: '#f59e0b' },
          { label: 'My Active', value: mine.length, color: '#a855f7' },
          { label: 'Completed by Me', value: completed.length, color: '#10b981' },
        ].map((t, i) => (
          <div key={t.label} className="glass-card" style={{ flex: 1, padding: '14px 18px', ['--stagger' as any]: i }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}><AnimatedNumber value={t.value} /></div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <TicketBoard open={open} mine={mine} completed={completed} myId={session.user.id} />
    </div>
  )
}
