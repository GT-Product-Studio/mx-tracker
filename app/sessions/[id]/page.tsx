'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { formatDuration } from '@/lib/gps-utils'
import { formatLapTime } from '@/lib/utils'
import type { Session } from '@/lib/types'

const SessionMap = dynamic(() => import('@/components/session-map'), { ssr: false })

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('sessions')
      .select('*, profiles(display_name), tracks(name, location_city, location_state)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setSession(data as Session | null)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-text-muted">Session not found</p>
        <Link href="/upload" className="text-accent hover:underline">Upload a session</Link>
      </div>
    )
  }

  const points = session.gps_data || []
  const laps = session.laps_data || []
  const sourceLabel = session.source === 'gopro' ? 'GoPro' : session.source === 'gpx' ? 'GPX' : 'Phone GPS'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              {session.tracks?.name || 'Untitled Session'}
            </h1>
            <span className="rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
              {sourceLabel}
            </span>
          </div>
          {session.tracks && (
            <p className="text-text-muted">
              {session.tracks.location_city}, {session.tracks.location_state}
            </p>
          )}
          <p className="text-sm text-text-muted mt-1">
            {new Date(session.recorded_at).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
            {session.profiles && <> &middot; {session.profiles.display_name}</>}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="mb-8">
        <SessionMap points={points} height="450px" />
        <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-6 rounded" style={{ background: 'linear-gradient(to right, #FF4444, #FFD700, #00D26A)' }} />
            Speed: Slow → Fast
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-accent" />
            Start
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-danger" />
            End
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Top Speed" value={`${session.top_speed_mph?.toFixed(1) ?? '—'}`} unit="mph" />
        <StatCard label="Avg Speed" value={`${session.avg_speed_mph?.toFixed(1) ?? '—'}`} unit="mph" />
        <StatCard label="Distance" value={`${session.total_distance_miles?.toFixed(2) ?? '—'}`} unit="mi" />
        <StatCard label="Duration" value={session.total_duration_ms ? formatDuration(session.total_duration_ms) : '—'} />
      </div>

      {/* Lap splits */}
      {laps.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold mb-4">Lap Splits</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card text-left text-sm text-text-muted">
                  <th className="px-4 py-3 font-medium">Lap</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Top Speed</th>
                  <th className="px-4 py-3 font-medium">Avg Speed</th>
                </tr>
              </thead>
              <tbody>
                {laps.map((lap, i) => {
                  const bestTime = Math.min(...laps.map(l => l.time_ms))
                  const isBest = lap.time_ms === bestTime
                  return (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{lap.lapNumber}</span>
                        {isBest && <span className="ml-2 text-xs text-accent font-medium">FASTEST</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {formatLapTime(lap.time_ms)}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {lap.topSpeed.toFixed(1)} mph
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {lap.avgSpeed.toFixed(1)} mph
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GPS data point count */}
      <div className="text-sm text-text-muted">
        {points.length.toLocaleString()} GPS points recorded
      </div>
    </div>
  )
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="font-mono text-2xl font-bold">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-text-muted">{unit}</span>}
      </p>
    </div>
  )
}
