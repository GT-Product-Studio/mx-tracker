'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatLapTime, getRankColor } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Lap } from '@/lib/types'

export default function LeaderboardPage() {
  const [laps, setLaps] = useState<Lap[]>([])
  const [tracks, setTracks] = useState<{ id: string; name: string; location_state: string }[]>([])
  const [trackFilter, setTrackFilter] = useState('')
  const [bikeFilter, setBikeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: lapsData }, { data: tracksData }] = await Promise.all([
        supabase
          .from('laps')
          .select('*, profiles(display_name), tracks(name, location_state)')
          .order('time_ms', { ascending: true })
          .limit(200),
        supabase
          .from('tracks')
          .select('id, name, location_state')
          .eq('approved', true)
          .order('name'),
      ])
      if (lapsData) setLaps(lapsData)
      if (tracksData) setTracks(tracksData)
      setLoading(false)
    }
    load()
  }, [])

  const filteredLaps = laps.filter((lap) => {
    if (trackFilter && lap.track_id !== trackFilter) return false
    if (bikeFilter && lap.bike_class !== bikeFilter) return false
    return true
  })

  const seen = new Set<string>()
  const uniqueLaps = filteredLaps.filter((lap) => {
    if (seen.has(lap.user_id)) return false
    seen.add(lap.user_id)
    return true
  }).slice(0, 50)

  const bikeOptions = [
    { value: '', label: 'All Classes' },
    { value: '250f', label: '250F' },
    { value: '450f', label: '450F' },
    { value: '250-2stroke', label: '250 2-Stroke' },
    { value: '450-2stroke', label: '450 2-Stroke' },
    { value: '125', label: '125' },
    { value: '85', label: '85' },
  ]

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>

  return (
    <div>
      {/* Hero banner */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src="/images/deegan/deegan-sx-9.jpg"
          alt="Supercross racing"
          fill
          priority
          quality={100}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />
        <div className="relative z-10 flex h-full items-end pb-8 px-4">
          <div className="mx-auto w-full max-w-5xl">
            <h1 className="font-heading text-4xl font-bold">Leaderboard</h1>
            <p className="text-text-muted text-sm mt-1">Fastest riders across all tracks</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="sm:w-64"
          >
            <option value="">All Tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.name} — {t.location_state}</option>
            ))}
          </select>
          <div className="flex gap-2 flex-wrap">
            {bikeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBikeFilter(opt.value)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  bikeFilter === opt.value ? 'bg-accent text-black' : 'bg-card text-text-muted hover:text-text border border-border'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rankings */}
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-12">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-heading text-lg font-bold">
              {trackFilter ? tracks.find(t => t.id === trackFilter)?.name || 'Track' : 'Global'} Rankings
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted uppercase">
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">Rider</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Track</th>
                <th className="px-4 py-3 text-right">Best Time</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Class</th>
              </tr>
            </thead>
            <tbody>
              {uniqueLaps.map((lap, i) => (
                <motion.tr
                  key={lap.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold" style={{ color: getRankColor(i + 1) }}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/profile/${encodeURIComponent(lap.profiles?.display_name || '')}`} className="text-sm font-medium hover:text-accent transition-colors">
                      {lap.profiles?.display_name || 'Unknown'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Link href={`/tracks/${lap.track_id}`} className="text-sm text-text-muted hover:text-text transition-colors">
                      {lap.tracks?.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-bold text-accent">{formatLapTime(lap.time_ms)}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-text-muted uppercase hidden sm:table-cell">{lap.bike_class}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {uniqueLaps.length === 0 && (
            <p className="p-8 text-center text-text-muted">No laps recorded yet. Be the first!</p>
          )}
        </div>

        {/* Browse by Track */}
        <h2 className="font-heading text-xl font-bold mb-4">Browse by Track</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.slice(0, 12).map((track) => (
            <Link
              key={track.id}
              href={`/tracks/${track.id}`}
              className="rounded-xl border border-border bg-card p-4 hover:bg-card-hover hover:border-accent/20 transition-colors"
            >
              <p className="font-heading font-bold text-sm">{track.name}</p>
              <p className="text-xs text-text-muted">{track.location_state}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
