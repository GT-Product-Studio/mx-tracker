'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Track } from '@/lib/types'

export default function UploadPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedTrack, setSelectedTrack] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState('')

  useEffect(() => {
    supabase.from('tracks').select('*').order('name').then(({ data }) => {
      if (data) setTracks(data)
    })
  }, [])

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'mp4' && ext !== 'gpx') {
      setError('Please upload a .mp4 (GoPro) or .gpx file')
      return
    }

    setFileName(file.name)
    setError('')
    setUploading(true)

    const endpoint = ext === 'mp4' ? '/api/upload/gopro' : '/api/upload/gpx'
    setProgress(ext === 'mp4' ? 'Extracting GPS telemetry from video...' : 'Parsing GPX trackpoints...')

    const formData = new FormData()
    formData.append('file', file)
    if (selectedTrack) formData.append('track_id', selectedTrack)

    try {
      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        setUploading(false)
        return
      }

      router.push(`/sessions/${data.session.id}`)
    } catch {
      setError('Upload failed. Please try again.')
      setUploading(false)
    }
  }, [selectedTrack, router])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-heading text-4xl font-bold tracking-tight mb-2">Upload Session</h1>
      <p className="text-text-muted mb-8">Upload a GoPro .mp4 video or .gpx file to extract GPS data</p>

      {/* Track selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-muted mb-2">Link to Track (optional)</label>
        <select
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
          className="w-full"
        >
          <option value="">No track selected</option>
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.name} — {track.location_city}, {track.location_state}
            </option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 transition-colors cursor-pointer ${
          isDragging
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-text-muted'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        onClick={() => !uploading && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".mp4,.gpx"
          onChange={onFileSelect}
          className="hidden"
        />

        {uploading ? (
          <>
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-accent" />
            <p className="text-lg font-medium">{fileName}</p>
            <p className="text-sm text-text-muted mt-2">{progress}</p>
          </>
        ) : (
          <>
            <svg className="mb-4 h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-lg font-medium">Drop your file here</p>
            <p className="text-sm text-text-muted mt-2">or click to browse — .mp4 (GoPro) or .gpx</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Info cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading text-lg font-bold mb-1">GoPro Video</h3>
          <p className="text-sm text-text-muted">Upload .mp4 files from GoPro cameras with GPS enabled. Telemetry is extracted automatically.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading text-lg font-bold mb-1">GPX File</h3>
          <p className="text-sm text-text-muted">Upload .gpx files from any GPS device or app. Trackpoints are parsed and visualized.</p>
        </div>
      </div>
    </div>
  )
}
