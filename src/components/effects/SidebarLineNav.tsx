'use client'
import { useMemo, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import LineSidebar from './LineSidebar'

export interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

export function SidebarLineNav({
  items,
  accentColor = 'var(--brand)',
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

  // These nav items are plain <li onClick> (a custom hover-effect nav, not <Link>),
  // so Next.js never gets a chance to auto-prefetch them. Without this, every click
  // is a cold navigation — request the RSC payload, run the page's Supabase queries,
  // then render. Prefetching all of them up front on mount means the payload is
  // usually already cached client-side by the time the user actually clicks.
  useEffect(() => {
    for (const item of items) router.prefetch(item.href)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
