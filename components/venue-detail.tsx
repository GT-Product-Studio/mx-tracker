'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatLapTime } from '@/lib/utils'
import type { Lap, Track } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

const BIKE_CLASSES = ['all', '250f', '450f', '125', '85', '250-2stroke', '450-2stroke'] as const

const classLabels: Record<string, string> = {
  'all': 'All Classes',
  '250f': '250F',
  '450f': '450F',
  '125': '125cc',
  '85': '85cc',
  '250-2stroke': '250 2T',
  '450-2stroke': '450 2T',
}

type LapWithJoins = Lap & { profiles: { display_name: string }; tracks: { layout_name: string } }

export function VenueDetail({ laps, tracks, user, venueId }: { laps: LapWithJoins[]; tracks: Track[]; user: User | null; venueId: string }) {
  const [classFilter, setClassFilter] = useState<string>('all')
  const [trackFilter, setTrackFilter] = useState<string>('all')

  const filtered = laps.filter((lap) => {
    if (classFilter !== 'all' && lap.bike_class !== classFilter) return false
    if (trackFilter !== 'all' && lap.track_id !== trackFilter) return false
    return true
  })

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4">Leaderboard</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Class filter */}
        <div className="flex gap-2 flex-wrap">
          {BIKE_CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => setClassFilter(cls)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                classFilter === cls
                  ? 'bg-accent text-black'
                  : 'bg-card text-text-muted hover:text-text border border-border'
              }`}
            >
              {classLabels[cls]}
            </button>
          ))}
        </div>

        {/* Track filter (only show if venue has multiple tracks) */}
        {tracks.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-text-muted py-2">Track:</span>
            <button
              onClick={() => setTrackFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                trackFilter === 'all'
                  ? 'bg-accent text-black'
                  : 'bg-card text-text-muted hover:text-text border border-border'
              }`}
            >
              All
            </button>
            {tracks.map((t) => (
              <button
                key={t.id}
                onClick={() => setTrackFilter(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  trackFilter === t.id
                    ? 'bg-accent text-black'
                    : 'bg-card text-text-muted hover:text-text border border-border'
                }`}
              >
                {t.layout_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted uppercase">
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">Rider</th>
                {tracks.length > 1 && <th className="px-4 py-3 text-left hidden md:table-cell">Track</th>}
                <th className="px-4 py-3 text-right">Time</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Class</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lap, i) => (
                <tr key={lap.id} className="border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold" style={{ color: i < 3 ? rankColors[i] : '#888' }}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/profile/${encodeURIComponent(lap.profiles?.display_name || '')}`} className="text-sm font-medium hover:text-accent transition-colors">
                      {lap.profiles?.display_name || 'Unknown'}
                    </Link>
                  </td>
                  {tracks.length > 1 && (
                    <td className="px-4 py-3 text-xs text-text-muted hidden md:table-cell">
                      {lap.tracks?.layout_name || 'Main Track'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-bold text-accent">{formatLapTime(lap.time_ms)}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-text-muted hidden sm:table-cell uppercase">
                    {classLabels[lap.bike_class || ''] || lap.bike_class || '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-text-muted hidden sm:table-cell">{lap.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-text-muted">No laps recorded at this venue yet.</p>
          {user && tracks.length > 0 && (
            <Link href={`/laps/new?track=${tracks[0].id}`} className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
              Be the first to log a lap
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
