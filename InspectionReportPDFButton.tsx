'use client'
// components/move-out-audit/InspectionReportPDFButton.tsx
import { useState } from 'react'

interface Props {
  reportId: string
  reportRef: string
}

export default function InspectionReportPDFButton({ reportId, reportRef }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      // Dynamically import react-pdf to avoid SSR issues
      const { pdf } = await import('@react-pdf/renderer')
      const { InspectionPDFDocument } = await import('./InspectionPDFDocument')

      // Fetch full report data
      const res = await fetch(`/api/inspection-report/${reportId}`)
      const data = await res.json()

      const blob = await pdf(<InspectionPDFDocument report={data} />).toBlob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `${reportRef}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('PDF generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        padding: '7px 14px', borderRadius: 'var(--r-md)',
        background: 'var(--emerald-dim)', border: '1px solid var(--emerald-ring)',
        color: 'var(--emerald)', fontSize: 12, fontWeight: 600,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1,
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      {loading ? '⏳ Generating…' : '⬇ Download PDF'}
    </button>
  )
}
