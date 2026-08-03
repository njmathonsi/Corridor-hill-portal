'use client'
import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import LineSidebar from './LineSidebar'

export interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

export function SidebarLineNav({
  items,
  accentColor = '#F59E0B',
  textColor = '#a1a1aa',
  markerColor = '#3a3a44',
}: {
  items: NavItem[]
  accentColor?: string
  textColor?: string
  markerColor?: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  const activeIndex = useMemo(() => {
    const idx = items.findIndex(i => pathname === i.href || pathname.startsWith(i.href + '/'))
    return idx === -1 ? undefined : idx
  }, [pathname, items])

  return (
    <LineSidebar
      items={items.map(i => i.label)}
      icons={items.map(i => i.icon)}
      activeIndex={activeIndex}
      accentColor={accentColor}
      textColor={textColor}
      markerColor={markerColor}
      showIndex={false}
      showMarker
      proximityRadius={90}
      maxShift={14}
      falloff="smooth"
      markerLength={28}
      markerGap={4}
      tickScale={0.5}
      itemGap={6}
      fontSize={0.85}
      smoothing={90}
      onItemClick={(i) => router.push(items[i].href)}
    />
  )
}
