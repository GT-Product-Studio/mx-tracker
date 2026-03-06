'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatLapTime, getRankColor } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Lap } from '@/lib/types'

type ProTimeRow = {
  id: string
  rider_name: string
  lap_time_ms: number
  bike_class: string
  event_name: string | null
  event_date: string | null
  venue_id: string | null
}

type VenueOption = { id: string; name: string; location_state: string }

export default function LeaderboardPage() {
  const [laps, setLaps] = useState<Lap[]>([])
  const [proTimes, setProTimes] = useState<ProTimeRow[]>([])
  const [venues, setVenues] = useState<VenueOption[]>([])
  const [tab, setTab] = useState<'global' | 'track' | 'state'>('global')
  const [venueFilter, setVenueFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [bikeFilter, setBikeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: lapsData }, { data: proTimesData }, { data: venuesData }] = await Promise.all([
        supabase
          .from('laps')
          .select('*, profiles(display_name), tracks(name, location_state, venue_id)')
          .order('time_ms', { ascending: true })
          .limit(500),
        supabase
          .from('pro_times')
          .select('*')
          .order('lap_time_ms', { ascending: true }),
        supabase
          .from('venues')
          .select('id, name, location_state')
          .eq('approved', true)
          .order('name'),
      ])
      if (lapsData) setLaps(lapsData)
      if (proTimesData) setProTimes(proTimesData)
      if (venuesData) setVenues(venuesData)
      setLoading(false)
    }
    load()
  }, [])

  // Unique states
  const states = [...new Set(venues.map((v) => v.location_state))].sort()

  // Filter laps
  const filteredLaps = laps.filter((lap) => {
    if (bikeFilter && lap.bike_class !== bikeFilter) return false
    if (tab === 'track' && venueFilter) {
      const trackVenueId = (lap.tracks as any)?.venue_id
      if (trackVenueId !== venueFilter) return false
    }
    if (tab === 'state' && stateFilter) {
      if (lap.tracks?.location_state !== stateFilter) return false
    }
    return true
  })

  // Dedupe by user
  const seen = new Set<string>()
  const uniqueLaps = filteredLaps.filter((lap) => {
    if (seen.has(lap.user_id)) return false
    seen.add(lap.user_id)
    return true
  }).slice(0, 50)

  // Pro times for selected venue
  const filteredProTimes = tab === 'track' && venueFilter
    ? proTimes.filter((pt) => pt.venue_id === venueFilter && (!bikeFilter || pt.bike_class === bikeFilter))
    : []

  // Fastest pro time for gap calculation
  const fastestPro = filteredProTimes.length > 0 ? filteredProTimes[0] : null

  const bikeOptions = [
    { value: '', label: 'All Classes' },
    { value: '250f', label: '250F' },
    { value: '450f', label: '450F' },
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
            <p className="text-text-muted text-sm mt-1">See where you stand against riders and pros</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 rounded-lg bg-card border border-border p-1 w-fit">
          {(['global', 'track', 'state'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === t ? 'bg-accent text-black' : 'text-text-muted hover:text-text'
              }`}
            >
              {t === 'global' ? 'Global' : t === 'track' ? 'By Track' : 'By State'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {tab === 'track' && (
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="sm:w-64 rounded-lg border border-border bg-card px-4 py-2 text-sm text-text"
            >
              <option value="">Select a venue...</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name} — {v.location_state}</option>
              ))}
            </select>
          )}
          {tab === 'state' && (
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="sm:w-48 rounded-lg border border-border bg-card px-4 py-2 text-sm text-text"
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
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

        {/* Pro Times Section (only for By Track with venue selected) */}
        {filteredProTimes.length > 0 && (
          <div className="rounded-xl border border-gold/20 bg-card overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gold/10">
              <h2 className="font-heading text-lg font-bold text-gold">Pro Times</h2>
            </div>
            {filteredProTimes.map((pt, i) => (
              <div
                key={pt.id}
                className={`flex items-center justify-between px-4 py-3 ${i < filteredProTimes.length - 1 ? 'border-b border-border/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center text-sm">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gold">{pt.rider_name}</p>
                    <p className="text-[10px] text-text-muted">{pt.event_name}{pt.event_date ? `, ${new Date(pt.event_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-text-muted uppercase">{pt.bike_class}</span>
                  <span className="font-mono text-sm font-bold text-gold">{formatLapTime(pt.lap_time_ms)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rider Rankings */}
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-12">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-heading text-lg font-bold">
              {tab === 'global' ? 'Global' : tab === 'track' && venueFilter ? venues.find(v => v.id === venueFilter)?.name || 'Track' : tab === 'state' && stateFilter ? stateFilter : 'All'} Rankings
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted uppercase">
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">Rider</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Track</th>
                <th className="px-4 py-3 text-right">Best Time</th>
                {fastestPro && <th className="px-4 py-3 text-right hidden sm:table-cell">Gap to Pro</th>}
                <th className="px-4 py-3 text-right hidden sm:table-cell">Class</th>
              </tr>
            </thead>
            <tbody>
              {uniqueLaps.map((lap, i) => {
                const gap = fastestPro ? lap.time_ms - fastestPro.lap_time_ms : null
                return (
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
                      <span className="text-sm text-text-muted">{lap.tracks?.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm font-bold text-accent">{formatLapTime(lap.time_ms)}</span>
                    </td>
                    {fastestPro && (
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className="font-mono text-xs text-text-muted">
                          +{(gap! / 1000).toFixed(1)}s off {fastestPro.rider_name.split(' ').pop()}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right text-xs text-text-muted uppercase hidden sm:table-cell">{lap.bike_class}</td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
          {uniqueLaps.length === 0 && (
            <p className="p-8 text-center text-text-muted">
              {tab === 'track' && !venueFilter ? 'Select a venue to see rankings' : 'No laps recorded yet. Be the first!'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
