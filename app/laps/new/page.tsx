'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Track } from '@/lib/types'

export default function NewLapPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>}>
      <NewLapForm />
    </Suspense>
  )
}

function TrackSearch({
  tracks,
  selectedTrack,
  onSelect,
}: {
  tracks: Track[]
  selectedTrack: Track | null
  onSelect: (track: Track) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = query.length > 0
    ? tracks.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.location_city.toLowerCase().includes(query.toLowerCase()) ||
          t.location_state.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  return (
    <div ref={ref} className="relative">
      {selectedTrack ? (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{selectedTrack.name}</p>
            <p className="text-xs text-text-muted">{selectedTrack.location_city}, {selectedTrack.location_state}</p>
          </div>
          <button
            type="button"
            onClick={() => { onSelect(null as unknown as Track); setQuery('') }}
            className="text-xs text-text-muted hover:text-danger transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="Search 648 tracks..."
              className="w-full pl-10"
              autoComplete="off"
            />
          </div>
          <AnimatePresence>
            {open && filtered.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-[#1a1a1a] shadow-2xl overflow-hidden"
              >
                {filtered.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => { onSelect(track); setOpen(false); setQuery('') }}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-card-hover transition-colors border-b border-border/50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{track.name}</p>
                      <p className="text-xs text-text-muted">{track.location_city}, {track.location_state}</p>
                    </div>
                    <span className="text-[10px] font-medium uppercase text-text-muted px-2 py-0.5 rounded-full border border-border">
                      {track.type}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {open && query.length > 0 && filtered.length === 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-[#1a1a1a] p-4 text-center text-sm text-text-muted">
              No tracks found for &ldquo;{query}&rdquo;
            </div>
          )}
        </>
      )}
    </div>
  )
}

function NewLapForm() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [milliseconds, setMilliseconds] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [conditions, setConditions] = useState('dry')
  const [bikeClass, setBikeClass] = useState('250f')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('tracks').select('*').eq('approved', true).order('name').then(({ data }) => {
      if (data) {
        setTracks(data)
        const preselectedTrack = searchParams.get('track')
        if (preselectedTrack) {
          const found = data.find((t) => t.id === preselectedTrack)
          if (found) setSelectedTrack(found)
        }
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrack) { setError('Please select a track'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const timeMs = parseInt(minutes || '0') * 60000 + parseInt(seconds || '0') * 1000 + parseInt(milliseconds || '0')
    if (timeMs <= 0) { setError('Please enter a valid lap time'); setLoading(false); return }

    const { data: existingBest } = await supabase
      .from('laps')
      .select('time_ms')
      .eq('user_id', user.id)
      .eq('track_id', selectedTrack.id)
      .eq('bike_class', bikeClass)
      .order('time_ms', { ascending: true })
      .limit(1)
      .single()

    const isPB = !existingBest || timeMs < existingBest.time_ms

    if (isPB && existingBest) {
      await supabase
        .from('laps')
        .update({ is_personal_best: false })
        .eq('user_id', user.id)
        .eq('track_id', selectedTrack.id)
        .eq('bike_class', bikeClass)
        .eq('is_personal_best', true)
    }

    const { error: insertError } = await supabase.from('laps').insert({
      user_id: user.id,
      track_id: selectedTrack.id,
      time_ms: timeMs,
      date,
      conditions,
      bike_class: bikeClass,
      notes: notes || null,
      is_personal_best: isPB,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/laps'), 800)
    }
  }

  const conditionOptions = [
    { value: 'dry', label: 'Dry', icon: '☀️' },
    { value: 'muddy', label: 'Muddy', icon: '🟤' },
    { value: 'wet', label: 'Wet', icon: '🌧️' },
    { value: 'sandy', label: 'Sandy', icon: '🏖️' },
  ]

  const bikeOptions = [
    { value: '250f', label: '250F' },
    { value: '450f', label: '450F' },
    { value: '250-2stroke', label: '250 2-Stroke' },
    { value: '450-2stroke', label: '450 2-Stroke' },
    { value: '125', label: '125' },
    { value: '85', label: '85' },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Log Lap Time</h1>
          <p className="text-text-muted text-sm mt-1">Record your time and track your progress</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-lg bg-accent/10 border border-accent/20 p-4 text-center"
            >
              <p className="text-accent font-bold">Lap saved!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Track Selection */}
          <div className="rounded-xl border border-border bg-card p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Track</label>
            <TrackSearch tracks={tracks} selectedTrack={selectedTrack} onSelect={setSelectedTrack} />
          </div>

          {/* Lap Time */}
          <div className="rounded-xl border border-border bg-card p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Lap Time</label>
            <div className="flex items-center justify-center gap-1">
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                min="0"
                max="59"
                required
                className="w-20 text-center font-mono text-2xl font-bold py-3"
              />
              <span className="text-2xl font-bold text-text-muted mx-1">:</span>
              <input
                type="number"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                placeholder="00"
                min="0"
                max="59"
                required
                className="w-20 text-center font-mono text-2xl font-bold py-3"
              />
              <span className="text-2xl font-bold text-text-muted mx-1">.</span>
              <input
                type="number"
                value={milliseconds}
                onChange={(e) => setMilliseconds(e.target.value)}
                placeholder="000"
                min="0"
                max="999"
                required
                className="w-24 text-center font-mono text-2xl font-bold py-3"
              />
            </div>
            <p className="text-center text-xs text-text-muted mt-2">MM : SS . ms</p>
          </div>

          {/* Conditions & Bike */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Conditions</label>
              <div className="grid grid-cols-4 gap-2">
                {conditionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConditions(opt.value)}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                      conditions === opt.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-[#1a1a1a] text-text-muted hover:border-text-muted/50'
                    }`}
                  >
                    <span className="block text-lg mb-1">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Bike Class</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {bikeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBikeClass(opt.value)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition-all ${
                      bikeClass === opt.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-[#1a1a1a] text-text-muted hover:border-text-muted/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full sm:w-48"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-border bg-card p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Track conditions, setup changes, how the session went..."
              rows={3}
              className="w-full"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading || success}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl bg-accent px-6 py-4 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Saving...' : success ? 'Saved!' : 'Log Lap Time'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
