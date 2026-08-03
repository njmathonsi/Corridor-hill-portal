'use client'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="glass-btn group no-print" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
      <Printer className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Print / Export
    </button>
  )
}
