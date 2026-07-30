// ── Add to app/dashboard/admin/overview/page.tsx (or any page) ──
// Decorative "Quick Access" LineSidebar block matching the TUT logo palette.
// Uses router.push in onItemClick to map labels -> real routes (functional, not just visual).

'use client'
import LineSidebar from '@/components/effects/LineSidebar'
import { useRouter } from 'next/navigation'

const QUICK_ACCESS_ROUTES = [
  '/dashboard/admin/biometrics-hub',
  '/dashboard/admin/pass-tracker',
  '/dashboard/admin/move-out-audit',
  '/dashboard/admin/applications',
  '/dashboard/admin/room-management',
  '/dashboard/admin/disciplinary',
]

export function QuickAccessLineNav() {
  const router = useRouter()
  return (
    <div style={{ padding: '20px 8px', background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
      <LineSidebar
        items={['Biometrics Hub', 'Pass Tracker', 'Move-Out Audit', 'Applications', 'Room Mgmt', 'Disciplinary']}
        accentColor="#A78BFA"
        textColor="#8a8a94"
        markerColor="#3a3a44"
        showIndex
        showMarker
        proximityRadius={90}
        maxShift={18}
        falloff="smooth"
        markerLength={40}
        tickScale={0.5}
        itemGap={16}
        fontSize={0.95}
        smoothing={90}
        onItemClick={(i) => router.push(QUICK_ACCESS_ROUTES[i])}
      />
    </div>
  )
}
