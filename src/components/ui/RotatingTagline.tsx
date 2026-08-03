'use client'
import { useEffect, useState } from 'react'

export default function RotatingTagline({ lines, interval = 2600 }: { lines: string[]; interval?: number }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % lines.length)
        setVisible(true)
      }, 250)
    }, interval)
    return () => clearInterval(id)
  }, [lines.length, interval])

  return (
    <p style={{
      fontSize: 13, color: '#a1a1aa', marginTop: 4,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(4px)',
      transition: 'opacity 250ms ease, transform 250ms ease',
    }}>
      {lines[index]}
    </p>
  )
}
