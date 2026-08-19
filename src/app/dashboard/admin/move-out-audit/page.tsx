import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import NewInspectionModal from './NewInspectionModal'

export default async function MoveOutAuditPage() {
  const supabase = createClient()
  const [{ data: reports }, { data: students }, { data: rooms }] = await Promise.all([
    supabase
      .from('inspection_reports')
      .select('id, report_ref, inspection_type, inspection_date, inspector_name, is_finalised, total_damage_cost, rooms(room_number, units(unit_code, blocks(code))), profiles!inspection_reports_student_id_fkey(full_name, student_number)')
      .order('inspection_date', { ascending: false }),
    supabase.from('profiles').select('id, full_name, student_number').eq('role','student').order('full_name'),
    supabase.from('rooms').select('id, room_number, units(unit_code, blocks(code))').order('room_number'),
  ])

  const pending  = (reports ?? []).filter(r => !r.is_finalised)
  const finalised= (reports ?? []).filter(r => r.is_finalised)

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Move-Out Audit</h1>
          <p style={{ fontSize: 13, color: '#71717a' }}>Room inspections · Digital checklist · Damage cost tracking</p>
        </div>
        <NewInspectionModal students={students ?? []} rooms={rooms ?? []} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'In Progress', value: pending.length,   color: '#f59e0b' },
          { label: 'Finalised',   value: finalised.length, color: '#10b981' },
          { label: 'Total',       value: reports?.length ?? 0, color: '#fafafa' },
        ].map((t, i) => (
          <div key={t.label} className="glass-card" style={{ flex: 1, padding: '14px 18px', ['--stagger' as any]: i }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}><AnimatedNumber value={t.value} /></div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      {[{ title: 'In Progress', list: pending }, { title: 'Finalised Reports', list: finalised }].map((section, si) => (
        <div key={section.title} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', marginBottom: 10 }}>
            {section.title} — {section.list.length}
          </div>
          {section.list.length === 0 ? (
            <div style={{ color: '#52525b', fontSize: 12, padding: '12px 0' }}>None.</div>
          ) : section.list.map((r: any, ri: number) => (
            <Link key={r.id} href={`/dashboard/admin/move-out-audit/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 8, cursor: 'pointer', ['--stagger' as any]: 3 + si * 10 + ri }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#3b82f6', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', padding: '3px 8px', borderRadius: 4 }}>{r.report_ref}</span>
                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: r.inspection_type === 'move_in' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: r.inspection_type === 'move_in' ? '#3b82f6' : '#f59e0b', border: `1px solid ${r.inspection_type === 'move_in' ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                    {r.inspection_type === 'move_in' ? 'Move-In' : 'Move-Out'}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: r.is_finalised ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: r.is_finalised ? '#10b981' : '#f59e0b', border: `1px solid ${r.is_finalised ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, marginLeft: 'auto' }}>
                    {r.is_finalised ? 'Finalised' : 'In Progress'}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Block {r.rooms?.units?.blocks?.code} · {r.rooms?.units?.unit_code} · {r.rooms?.room_number}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: '#71717a', flex: 1 }}>
                    {r.profiles?.full_name ?? '—'} · Inspector: {r.inspector_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>
                      {new Date(r.inspection_date).toLocaleDateString('en-ZA')}
                    </span>
                    {Number(r.total_damage_cost) > 0 && (
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
                        R {Number(r.total_damage_cost).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  )
}
