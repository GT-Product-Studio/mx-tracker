'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatLapTime } from '@/lib/utils'
import type { Lap } from '@/lib/types'

export function ChallengeEntryForm({
  challengeId,
  trackId,
  userId,
}: {
  challengeId: string
  trackId: string
  userId: string
}) {
  const [laps, setLaps] = useState<Lap[]>([])
  const [selectedLap, setSelectedLap] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('laps')
      .select('*')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .order('time_ms', { ascending: true })
      .then(({ data }) => {
        if (data) setLaps(data)
      })
  }, [])

  const handleSubmit = async () => {
    if (!selectedLap) return
    setLoading(true)
    await supabase.from('challenge_entries').insert({
      challenge_id: challengeId,
      user_id: userId,
      lap_id: selectedLap,
    })
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-card p-6">
      <h3 className="font-heading text-lg font-bold mb-4">Enter This Challenge</h3>
      {laps.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Select your best lap at this track</label>
            <select value={selectedLap} onChange={(e) => setSelectedLap(e.target.value)} className="w-full">
              <option value="">Choose a lap</option>
              {laps.map((lap) => (
                <option key={lap.id} value={lap.id}>
                  {formatLapTime(lap.time_ms)} — {lap.date} ({lap.bike_class})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!selectedLap || loading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black hover:bg-accent-hover transition-colors disabled:opacity-50 self-start"
          >
            {loading ? 'Submitting...' : 'Submit Entry'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          You need to log a lap at this track first.{' '}
          <a href={`/laps/new?track=${trackId}`} className="text-accent hover:underline">Log a lap</a>
        </p>
      )}
    </div>
  )
}
