'use client'
import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, Camera, Send } from 'lucide-react'
import { reportMaintenanceIssue } from '@/lib/actions/maintenance'
import { quickClientCheck } from '@/lib/validation/fileValidation'

const CATEGORIES = ['Plumbing', 'Electrical', 'Furniture', 'Appliance', 'Structural', 'Pest Control', 'Other']

export default function ReportIssueForm() {
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFiles(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files)
    for (const f of arr) {
      const check = quickClientCheck(f)
      if (!check.valid) { setError(check.error!); return }
    }
    setError('')
    setPhotos(p => [...p, ...arr])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!category) { setError('Please select a category'); return }
    if (!description.trim()) { setError('Please describe the issue'); return }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('category', category)
      formData.append('description', description)
      photos.forEach(f => formData.append('photos', f))

      const result = await reportMaintenanceIssue(formData)
      if (!result.success) {
        setError(result.error ?? 'Failed to submit request')
        return
      }
      setSuccess(true)
      setCategory(''); setDescription(''); setPhotos([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      router.refresh()
      setTimeout(() => setSuccess(false), 4000)
    })
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 22, maxWidth: 560 }}>
      {success && (
        <div style={{ padding: '12px 16px', borderRadius: 8, fontSize: 13, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', marginBottom: 16 }}>
          Issue reported — maintenance has been notified.
        </div>
      )}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>CATEGORY</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => setCategory(c)} style={{ padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: category === c ? 'rgba(59,130,246,0.2)' : '#27272a', color: category === c ? '#3b82f6' : '#a1a1aa', border: `1px solid ${category === c ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>DESCRIBE THE ISSUE</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="What's wrong, and where in the room?" style={{ ...inp, resize: 'vertical' }} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>PHOTOS (optional)</label>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 8, cursor: 'pointer', border: '1px dashed rgba(255,255,255,0.15)', background: '#1f1f23', fontSize: 13, fontWeight: 600, color: '#3b82f6' }}>
          <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={e => { handleFiles(e.target.files); e.target.value = '' }} style={{ display: 'none' }} />
          <Camera className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Attach Photos
        </label>
        {photos.length > 0 && (
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 8 }}>{photos.length} file(s) attached</div>
        )}
      </div>

      <button type="submit" disabled={pending} className="glass-btn group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '11px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: pending ? 0.6 : 1 }}>
        {pending ? 'Submitting…' : <><Send className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Submit Report</>}
      </button>
    </form>
  )
}
