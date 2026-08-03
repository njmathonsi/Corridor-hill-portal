import { createClient } from '@/lib/supabase/server'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import MaintenanceQueue from './MaintenanceQueue'
import NewTicketModal from './NewTicketModal'

export default async function MaintenancePage() {
  const supabase = createClient()
  const [{ data: requests }, { data: workers }, { data: students }, { data: rooms }] = await Promise.all([
    supabase
      .from('maintenance_requests')
      .select('id, category, description, status, reported_at, photo_urls, assigned_to, profiles!maintenance_requests_student_id_fkey(full_name, student_number), rooms(room_number, units(unit_code, blocks(code)))')
      .order('reported_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('role', 'maintenance').order('full_name'),
    supabase.from('profiles').select('id, full_name, student_number').eq('role', 'student').order('full_name'),
    supabase.from('rooms').select('id, room_number, units(unit_code, blocks(code))').order('room_number'),
  ])

  const list = (requests ?? []) as any[]
  const open = list.filter(r => r.status !== 'completed').length
  const completed = list.filter(r => r.status === 'completed').length

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Maintenance</h1>
          <p style={{ fontSize: 13, color: '#71717a' }}>Repair requests reported by students · Triage &amp; assign</p>
        </div>
        <NewTicketModal students={students ?? []} rooms={rooms ?? []} workers={workers ?? []} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Open', value: open, color: '#f59e0b' },
          { label: 'Completed', value: completed, color: '#10b981' },
          { label: 'Total', value: list.length, color: '#fafafa' },
        ].map((t, i) => (
          <div key={t.label} className="glass-card" style={{ flex: 1, padding: '14px 18px', ['--stagger' as any]: i }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}><AnimatedNumber value={t.value} /></div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <MaintenanceQueue requests={list} workers={workers ?? []} />
    </div>
  )
}
