'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatLapTime } from '@/lib/utils'
import { FadeIn } from '@/components/motion'
import type { Profile, Lap } from '@/lib/types'

export default function ComparePage() {
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')
  const [rider1, setRider1] = useState<Profile | null>(null)
  const [rider2, setRider2] = useState<Profile | null>(null)
  const [laps1, setLaps1] = useState<Lap[]>([])
  const [laps2, setLaps2] = useState<Lap[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const findRider = async (name: string, setRider: (p: Profile | null) => void, setLaps: (l: Lap[]) => void) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .ilike('display_name', `%${name}%`)
      .limit(1)
      .single()

    if (profile) {
      setRider(profile)
      const { data: laps } = await supabase
        .from('laps')
        .select('*, tracks(name)')
        .eq('user_id', profile.id)
        .eq('is_personal_best', true)
        .order('time_ms', { ascending: true })
      setLaps(laps || [])
    } else {
      setRider(null)
      setLaps([])
    }
  }

  const handleCompare = async () => {
    setLoading(true)
    await Promise.all([
      findRider(search1, setRider1, setLaps1),
      findRider(search2, setRider2, setLaps2),
    ])
    setLoading(false)
  }

  // Find common tracks
  const commonTracks = laps1.filter((l1) => laps2.some((l2) => l2.track_id === l1.track_id))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <FadeIn>
        <h1 className="font-heading text-4xl font-bold mb-2">Head-to-Head</h1>
        <p className="text-text-muted text-sm mb-8">Compare personal bests between two riders</p>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Rider 1</label>
              <input
                type="text"
                value={search1}
                onChange={(e) => setSearch1(e.target.value)}
                placeholder="Display name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Rider 2</label>
              <input
                type="text"
                value={search2}
                onChange={(e) => setSearch2(e.target.value)}
                placeholder="Display name"
                className="w-full"
              />
            </div>
          </div>
          <button
            onClick={handleCompare}
            disabled={!search1 || !search2 || loading}
            className="mt-4 rounded-lg bg-accent px-6 py-2 text-sm font-bold text-black hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </div>

        {rider1 && rider2 && (
          <div className="mt-8">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              {[
                { rider: rider1, laps: laps1 },
                { rider: rider2, laps: laps2 },
              ].map(({ rider, laps }) => (
                <div key={rider.id} className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-heading text-xl font-bold mb-3">{rider.display_name}</h3>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Riding Level</span>
                      <span className="capitalize">{rider.riding_level || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Bike</span>
                      <span>{[rider.bike_year, rider.bike_make, rider.bike_model].filter(Boolean).join(' ') || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Personal Bests</span>
                      <span>{laps.length}</span>
                    </div>
                    {laps.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Fastest</span>
                        <span className="font-mono font-bold text-accent">{formatLapTime(laps[0].time_ms)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Common tracks comparison */}
            {commonTracks.length > 0 && (
              <div>
                <h3 className="font-heading text-lg font-bold mb-4">Common Tracks</h3>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-xs text-text-muted uppercase">
                        <th className="px-4 py-3 text-left">Track</th>
                        <th className="px-4 py-3 text-right">{rider1.display_name}</th>
                        <th className="px-4 py-3 text-right">{rider2.display_name}</th>
                        <th className="px-4 py-3 text-right">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commonTracks.map((l1) => {
                        const l2 = laps2.find((l) => l.track_id === l1.track_id)!
                        const diff = l1.time_ms - l2.time_ms
                        return (
                          <tr key={l1.id} className="border-b border-border/50 last:border-0">
                            <td className="px-4 py-3 text-sm">{l1.tracks?.name}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-mono text-sm font-bold ${diff <= 0 ? 'text-accent' : 'text-text'}`}>
                                {formatLapTime(l1.time_ms)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-mono text-sm font-bold ${diff >= 0 ? 'text-accent' : 'text-text'}`}>
                                {formatLapTime(l2.time_ms)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-mono text-xs ${diff < 0 ? 'text-accent' : diff > 0 ? 'text-danger' : 'text-text-muted'}`}>
                                {diff < 0 ? '' : '+'}{(diff / 1000).toFixed(3)}s
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {commonTracks.length === 0 && (
              <p className="text-center text-text-muted py-8">No common tracks between these riders.</p>
            )}
          </div>
        )}

        {(search1 || search2) && !loading && (!rider1 || !rider2) && rider1 !== null && rider2 !== null && (
          <p className="mt-6 text-center text-text-muted">One or both riders not found.</p>
        )}
      </FadeIn>
    </div>
  )
}
