'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { FadeIn } from '@/components/motion'
import type { Track } from '@/lib/types'

export default function NewLapPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>}>
      <NewLapForm />
    </Suspense>
  )
}

function NewLapForm() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [trackId, setTrackId] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [milliseconds, setMilliseconds] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [conditions, setConditions] = useState('dry')
  const [bikeClass, setBikeClass] = useState('450f')
  const [videoUrl, setVideoUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const preselectedTrack = searchParams.get('track')
    if (preselectedTrack) setTrackId(preselectedTrack)

    supabase.from('tracks').select('*').eq('approved', true).order('name').then(({ data }) => {
      if (data) setTracks(data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const timeMs = parseInt(minutes || '0') * 60000 + parseInt(seconds || '0') * 1000 + parseInt(milliseconds || '0')
    if (timeMs <= 0) { setError('Please enter a valid lap time'); setLoading(false); return }

    // Check if this is a personal best
    const { data: existingBest } = await supabase
      .from('laps')
      .select('time_ms')
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .eq('bike_class', bikeClass)
      .order('time_ms', { ascending: true })
      .limit(1)
      .single()

    const isPB = !existingBest || timeMs < existingBest.time_ms

    // If this is a new PB, unmark the old one
    if (isPB && existingBest) {
      await supabase
        .from('laps')
        .update({ is_personal_best: false })
        .eq('user_id', user.id)
        .eq('track_id', trackId)
        .eq('bike_class', bikeClass)
        .eq('is_personal_best', true)
    }

    const { error: insertError } = await supabase.from('laps').insert({
      user_id: user.id,
      track_id: trackId,
      time_ms: timeMs,
      date,
      conditions,
      bike_class: bikeClass,
      video_url: videoUrl || null,
      notes: notes || null,
      is_personal_best: isPB,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/laps')
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <FadeIn>
        <h1 className="font-heading text-3xl font-bold mb-8">Log Lap Time</h1>

        {error && (
          <div className="mb-6 rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Track</label>
              <select value={trackId} onChange={(e) => setTrackId(e.target.value)} required className="w-full">
                <option value="">Select a track</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {t.location_state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Lap Time</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="59"
                  required
                  className="w-20 text-center font-mono"
                />
                <span className="text-text-muted font-bold">:</span>
                <input
                  type="number"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  placeholder="00"
                  min="0"
                  max="59"
                  required
                  className="w-20 text-center font-mono"
                />
                <span className="text-text-muted font-bold">.</span>
                <input
                  type="number"
                  value={milliseconds}
                  onChange={(e) => setMilliseconds(e.target.value)}
                  placeholder="000"
                  min="0"
                  max="999"
                  required
                  className="w-24 text-center font-mono"
                />
              </div>
              <p className="text-xs text-text-muted mt-1">Format: minutes : seconds . milliseconds</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Conditions</label>
                <select value={conditions} onChange={(e) => setConditions(e.target.value)} className="w-full">
                  <option value="dry">Dry</option>
                  <option value="muddy">Muddy</option>
                  <option value="wet">Wet</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Bike Class</label>
                <select value={bikeClass} onChange={(e) => setBikeClass(e.target.value)} className="w-full">
                  <option value="125">125</option>
                  <option value="250f">250F</option>
                  <option value="250">250</option>
                  <option value="450f">450F</option>
                  <option value="450">450</option>
                  <option value="open">Open</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Video URL (optional)</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Track conditions, setup changes, etc."
                rows={3}
                className="w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Log Lap Time'}
          </button>
        </form>
      </FadeIn>
    </div>
  )
}
