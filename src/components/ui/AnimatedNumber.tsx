'use client'
import { useEffect, useRef, useState } from 'react'

export default function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, duration = 700 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number
}) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const from = fromRef.current
    const to = Number.isFinite(value) ? value : 0
    const start = performance.now()
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <>{prefix}{display.toFixed(decimals)}{suffix}</>
}
