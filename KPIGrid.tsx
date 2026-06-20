// components/dashboard/KPIGrid.tsx

interface KPIGridProps {
  totalStudents: number
  checkedIn: number
  pendingApps: number
  bioPending: number
}

interface TileProps {
  value: number | string
  label: string
  color?: string
  href?: string
}

function StatTile({ value, label, color = 'var(--text-primary)', href }: TileProps) {
  const inner = (
    <div style={{
      flex: 1,
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-dim)',
      borderRadius: 'var(--r-md)',
      padding: '12px 16px',
      transition: href ? 'border-color 0.15s' : undefined,
      cursor: href ? 'pointer' : undefined,
    }}>
      <div style={{
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        color,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10,
        color: 'var(--text-tertiary)',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {label}
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} style={{ flex: 1, textDecoration: 'none', display: 'flex' }}>
        {inner}
      </a>
    )
  }
  return inner
}

export default function KPIGrid({ totalStudents, checkedIn, pendingApps, bioPending }: KPIGridProps) {
  const occupancyPct = totalStudents > 0
    ? Math.round((checkedIn / totalStudents) * 100)
    : 0

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <StatTile
        value={totalStudents}
        label="Total Students"
        color="var(--text-primary)"
        href="/dashboard/admin/students"
      />
      <StatTile
        value={checkedIn}
        label="Checked In"
        color="var(--emerald)"
        href="/dashboard/admin/room-management"
      />
      <StatTile
        value={`${occupancyPct}%`}
        label="Occupancy Rate"
        color={occupancyPct > 85 ? 'var(--emerald)' : occupancyPct > 60 ? 'var(--amber)' : 'var(--rose)'}
      />
      <StatTile
        value={pendingApps}
        label="Pending Applications"
        color={pendingApps > 0 ? 'var(--amber)' : 'var(--text-secondary)'}
        href="/dashboard/admin/applications"
      />
      <StatTile
        value={bioPending}
        label="Biometrics Pending"
        color={bioPending > 0 ? 'var(--rose)' : 'var(--text-secondary)'}
        href="/dashboard/admin/biometrics-hub"
      />
    </div>
  )
}
