// app/dashboard/admin/move-out-audit/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 0

export default async function MoveOutAuditPage() {
  const supabase = createClient()

  const { data: reports } = await supabase
    .from('inspection_reports')
    .select(`
      id, report_ref, inspection_date, inspection_type,
      is_finalised, total_damage_cost, pdf_report_url,
      inspector_name,
      rooms (
        room_number,
        units ( unit_code, blocks ( code ) )
      ),
      profiles!inspection_reports_student_id_fkey ( full_name, student_number )
    `)
    .order('inspection_date', { ascending: false })
    .limit(30)

  const pending   = (reports ?? []).filter(r => !r.is_finalised)
  const finalised = (reports ?? []).filter(r => r.is_finalised)

  return (
    <div className="animate-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Move-Out Audit</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            Room inspections · Digital checklist · PDF compliance reports
          </p>
        </div>
        <Link href="/dashboard/admin/move-out-audit/new">
          <button style={{
            padding: '8px 16px', borderRadius: 'var(--r-md)',
            background: 'var(--blue)', color: '#fff',
            border: '1px solid var(--blue)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}>
            + New Inspection
          </button>
        </Link>
      </div>

      {/* In-progress */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
            In Progress — {pending.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map(r => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </div>
      )}

      {/* Finalised */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
          Finalised Reports — {finalised.length}
        </div>
        {finalised.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-disabled)', fontSize: 13 }}>
            No finalised reports yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {finalised.map(r => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReportCard({ report }: { report: any }) {
  const block = report.rooms?.units?.blocks?.code ?? '—'
  const unit  = report.rooms?.units?.unit_code ?? ''
  const room  = report.rooms?.room_number ?? '—'

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
      borderRadius: 'var(--r-lg)', padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* Ref */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
        color: 'var(--blue)', background: 'var(--blue-dim)',
        border: '1px solid var(--blue-ring)', padding: '3px 8px', borderRadius: 4,
        flexShrink: 0, letterSpacing: '0.06em',
      }}>
        {report.report_ref}
      </div>

      {/* Location + student */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          Block {block} · Unit {block}{unit} · {room}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {report.profiles?.full_name ?? 'No student'} · Inspector: {report.inspector_name}
        </div>
      </div>

      {/* Date */}
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
        {new Date(report.inspection_date).toLocaleDateString('en-ZA')}
      </div>

      {/* Damage cost */}
      {report.total_damage_cost > 0 && (
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>
            R {Number(report.total_damage_cost).toFixed(2)}
          </span>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>damage</div>
        </div>
      )}

      {/* Status + action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{
          padding: '3px 8px', borderRadius: 99,
          fontSize: 11, fontWeight: 600,
          background: report.is_finalised ? 'var(--emerald-dim)' : 'var(--amber-dim)',
          color: report.is_finalised ? 'var(--emerald)' : 'var(--amber)',
          border: `1px solid ${report.is_finalised ? 'var(--emerald-ring)' : 'var(--amber-ring)'}`,
        }}>
          {report.is_finalised ? 'Finalised' : 'In Progress'}
        </span>
        <Link href={`/dashboard/admin/move-out-audit/${report.id}`}>
          <button style={{
            padding: '5px 11px', borderRadius: 'var(--r-md)',
            background: 'transparent', border: '1px solid var(--border-mid)',
            color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
          }}>
            {report.is_finalised ? 'View' : 'Continue →'}
          </button>
        </Link>
      </div>
    </div>
  )
}
