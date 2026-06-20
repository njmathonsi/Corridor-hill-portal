'use client'
// components/biometrics-hub/BiometricsTable.tsx
import { useState, useTransition } from 'react'
import { toggleBiometricRegistration } from '@/lib/actions/biometrics'
import { useToast } from '@/components/ui/use-toast'

type SyncStatus = 'pending' | 'synced' | 'failed' | 'revoked'

interface BioRecord {
  id: string
  biometric_registered: boolean
  registered_at: string | null
  sync_status: SyncStatus
  last_synced_at: string | null
  device_label: string | null
  profiles: { id: string; full_name: string; student_number: string; email: string } | null
}

interface UnregisteredStudent {
  id: string
  full_name: string
  student_number: string
  email: string
}

interface Props {
  registrations: BioRecord[]
  unregisteredStudents: UnregisteredStudent[]
}

function SyncBadge({ status }: { status: SyncStatus | 'unregistered' }) {
  const map = {
    synced:       { bg: 'var(--emerald-dim)', color: 'var(--emerald)', ring: 'var(--emerald-ring)', label: 'Synced' },
    pending:      { bg: 'var(--amber-dim)',   color: 'var(--amber)',   ring: 'var(--amber-ring)',   label: 'Pending' },
    failed:       { bg: 'var(--rose-dim)',    color: 'var(--rose)',    ring: 'var(--rose-ring)',    label: 'Sync Failed' },
    revoked:      { bg: 'var(--bg-raised)',   color: 'var(--text-tertiary)', ring: 'var(--border-dim)', label: 'Revoked' },
    unregistered: { bg: 'var(--bg-raised)',   color: 'var(--text-disabled)', ring: 'var(--border-dim)', label: 'Not Registered' },
  }
  const s = map[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.ring}`,
    }}>{s.label}</span>
  )
}

export default function BiometricsTable({ registrations, unregisteredStudents }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'registered' | 'pending' | 'failed' | 'unregistered'>('all')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Combine into unified rows
  const allRows = [
    ...registrations.map(r => ({
      studentId: r.profiles?.id ?? '',
      full_name: r.profiles?.full_name ?? '',
      student_number: r.profiles?.student_number ?? '',
      biometric_registered: r.biometric_registered,
      sync_status: r.sync_status as SyncStatus,
      device_label: r.device_label,
      registered_at: r.registered_at,
      registrationId: r.id,
      isNew: false,
    })),
    ...unregisteredStudents.map(s => ({
      studentId: s.id,
      full_name: s.full_name,
      student_number: s.student_number,
      biometric_registered: false,
      sync_status: 'pending' as SyncStatus,
      device_label: null,
      registered_at: null,
      registrationId: null,
      isNew: true,
    })),
  ]

  const filtered = allRows.filter(row => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || row.full_name.toLowerCase().includes(q)
      || row.student_number.toLowerCase().includes(q)

    const matchFilter =
      filter === 'all' ? true
      : filter === 'registered'   ? row.biometric_registered
      : filter === 'pending'      ? (!row.biometric_registered && !row.isNew)
      : filter === 'failed'       ? row.sync_status === 'failed'
      : filter === 'unregistered' ? row.isNew
      : true

    return matchSearch && matchFilter
  })

  function handleToggle(studentId: string, currentlyRegistered: boolean, studentName: string) {
    startTransition(async () => {
      const result = await toggleBiometricRegistration(studentId, !currentlyRegistered)
      if (result.success) {
        toast({
          title: currentlyRegistered ? 'Biometric Deregistered' : 'Biometric Registered',
          description: `${studentName} — status updated`,
        })
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    })
  }

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'all',          label: 'All' },
    { key: 'registered',   label: 'Registered' },
    { key: 'pending',      label: 'Pending Sync' },
    { key: 'failed',       label: 'Failed' },
    { key: 'unregistered', label: 'Never Registered' },
  ]

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 16 }}>
      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-disabled)', pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or student number…"
            style={{
              width: '100%',
              background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
              color: 'var(--text-primary)', padding: '8px 12px 8px 32px',
              borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '4px 12px', borderRadius: 99,
              border: `1px solid ${filter === f.key ? 'var(--blue-ring)' : 'var(--border-dim)'}`,
              fontSize: 11, fontWeight: 500, cursor: 'pointer',
              color: filter === f.key ? 'var(--blue)' : 'var(--text-secondary)',
              background: filter === f.key ? 'var(--blue-dim)' : 'var(--bg-raised)',
              transition: 'all 0.12s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Student', 'Student No.', 'Status', 'Device', 'Registered At', 'Action'].map(h => (
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
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-disabled)', fontSize: 13 }}>
                  No records match this filter.
                </td>
              </tr>
            ) : filtered.map(row => (
              <tr key={row.studentId} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                    {row.full_name}
                  </div>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {row.student_number || '—'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <SyncBadge status={row.isNew ? 'unregistered' : row.sync_status} />
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>
                  {row.device_label ?? '—'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {row.registered_at
                      ? new Date(row.registered_at).toLocaleDateString('en-ZA')
                      : '—'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    onClick={() => handleToggle(row.studentId, row.biometric_registered, row.full_name)}
                    disabled={isPending}
                    style={{
                      padding: '5px 14px', borderRadius: 'var(--r-md)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      border: '1px solid',
                      background: row.biometric_registered ? 'var(--rose-dim)' : 'var(--emerald-dim)',
                      color: row.biometric_registered ? 'var(--rose)' : 'var(--emerald)',
                      borderColor: row.biometric_registered ? 'var(--rose-ring)' : 'var(--emerald-ring)',
                      opacity: isPending ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {row.biometric_registered ? 'Deregister' : 'Register'}
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
