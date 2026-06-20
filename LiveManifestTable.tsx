'use client'
// components/pass-tracker/LiveManifestTable.tsx
import { useState, useTransition } from 'react'
import { logTransit } from '@/lib/actions/pass-tracker'
import { useToast } from '@/components/ui/use-toast'

interface Pass {
  id: string
  student_id: string
  full_name: string
  student_number: string
  direction: 'exit' | 'entry'
  transit_at: string
  expected_return: string | null
  destination: string | null
  key_number: string | null
  pass_status: 'in' | 'out' | 'overdue'
}

function PassStatusBadge({ status }: { status: Pass['pass_status'] }) {
  const map = {
    in:      { bg: 'var(--emerald-dim)', color: 'var(--emerald)', ring: 'var(--emerald-ring)', label: '● In' },
    out:     { bg: 'var(--amber-dim)',   color: 'var(--amber)',   ring: 'var(--amber-ring)',   label: '→ Out' },
    overdue: { bg: 'var(--rose-dim)',    color: 'var(--rose)',    ring: 'var(--rose-ring)',    label: '⚠ Overdue' },
  }
  const s = map[status]
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 8px', borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.ring}`,
    }}>{s.label}</span>
  )
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function LiveManifestTable({ passes }: { passes: Pass[] }) {
  const [search, setSearch]       = useState('')
  const [blockFilter, setBlock]   = useState('ALL')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const outPasses = passes.filter(p => p.pass_status === 'out' || p.pass_status === 'overdue')

  const filtered = outPasses.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q
      || p.full_name.toLowerCase().includes(q)
      || (p.student_number ?? '').toLowerCase().includes(q)
    return matchQ
  })

  function handleCheckIn(pass: Pass) {
    startTransition(async () => {
      const result = await logTransit({
        studentId:  pass.student_id,
        direction:  'entry',
        keyHandedOver: !!pass.key_number,
        keyNumber:  pass.key_number ?? undefined,
      })
      if (result.success) {
        toast({ title: '✅ Checked In', description: `${pass.full_name} marked as returned` })
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    })
  }

  function exportCSV() {
    const rows = [
      ['Name', 'Student No.', 'Departure', 'Expected Return', 'Destination', 'Status'],
      ...filtered.map(p => [
        p.full_name, p.student_number ?? '',
        fmtDate(p.transit_at), fmtDate(p.expected_return),
        p.destination ?? '', p.pass_status,
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `manifest-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Live Building Manifest</span>
        <button
          onClick={exportCSV}
          style={{
            padding: '5px 11px', borderRadius: 'var(--r-md)',
            background: 'transparent', border: '1px solid var(--border-mid)',
            color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
          }}
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-disabled)', pointerEvents: 'none' }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or student number…"
          style={{
            width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
            color: 'var(--text-primary)', padding: '8px 12px 8px 32px',
            borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Student', 'Departure', 'Expected Return', 'Destination', 'Key', 'Status', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '8px 12px',
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text-tertiary)',
                  borderBottom: '1px solid var(--border-dim)', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-disabled)', fontSize: 13 }}>
                  No students currently outside the building.
                </td>
              </tr>
            ) : filtered.map(pass => (
              <tr
                key={pass.id}
                style={{
                  borderBottom: '1px solid var(--border-dim)',
                  background: pass.pass_status === 'overdue' ? 'rgba(244,63,94,0.04)' : 'transparent',
                }}
              >
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{pass.full_name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {pass.student_number}
                  </div>
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                  {fmtDate(pass.transit_at)}
                </td>
                <td style={{
                  padding: '10px 12px',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  color: pass.pass_status === 'overdue' ? 'var(--rose)' : 'var(--text-secondary)',
                  fontWeight: pass.pass_status === 'overdue' ? 700 : 400,
                }}>
                  {fmtDate(pass.expected_return)}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pass.destination ?? '—'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {pass.key_number ? (
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                      background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
                      padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)',
                    }}>{pass.key_number}</span>
                  ) : '—'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <PassStatusBadge status={pass.pass_status} />
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    onClick={() => handleCheckIn(pass)}
                    disabled={isPending}
                    style={{
                      padding: '5px 11px', borderRadius: 'var(--r-md)',
                      background: 'transparent', border: '1px solid var(--border-mid)',
                      color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
                      opacity: isPending ? 0.5 : 1,
                    }}
                  >
                    Check In
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
