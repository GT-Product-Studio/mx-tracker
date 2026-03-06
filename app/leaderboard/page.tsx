'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatLapTime } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

type DeeganTime = {
  id: string
  rider_name: string
  lap_time_ms: number
  bike_class: string
  event_name: string | null
  event_date: string | null
  venue_id: string | null
  source: string | null
  venues?: { name: string; location_state: string } | null
}

export default function LeaderboardPage() {
  const [deeganTimes, setDeeganTimes] = useState<DeeganTime[]>([])
  const [classFilter, setClassFilter] = useState<'all' | '250f' | '450f'>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('pro_times')
        .select('*, venues(name, location_state)')
        .eq('rider_name', 'Haiden Deegan')
        .order('lap_time_ms', { ascending: true })

      if (data) setDeeganTimes(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = classFilter === 'all'
    ? deeganTimes
    : deeganTimes.filter((t) => t.bike_class === classFilter)

  // Best time for the "gap" CTA
  const fastest = filtered.length > 0 ? filtered[0] : null

  // Season stats
  const totalRounds = new Set(deeganTimes.map((t) => t.event_name)).size
  const fastestOverall = deeganTimes.length > 0 ? deeganTimes[0] : null

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>

  return (
    <div>
      {/* Hero banner with Deegan */}
      <div className="relative h-64 sm:h-72 overflow-hidden">
        <Image
          src="/images/deegan/deegan-sx-9.jpg"
          alt="Haiden Deegan racing"
          fill
          priority
          quality={100}
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/30" />
        <div className="relative z-10 flex h-full items-end pb-8 px-4">
          <div className="mx-auto w-full max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-2">Chase the Pros</p>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold">
              Haiden Deegan<span className="text-accent">&apos;s</span> Times
            </h1>
            <p className="text-text-muted text-sm mt-2 max-w-lg">
              Real qualifying lap times from the 2025 AMA Pro Motocross Championship. Every time sourced from official race results.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Season summary strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { value: '7', label: 'Wins (of 11)', sub: '2025 250MX' },
            { value: fastestOverall ? formatLapTime(fastestOverall.lap_time_ms) : '--', label: 'Fastest Lap', sub: fastestOverall?.venues?.name || '' },
            { value: `${totalRounds}`, label: 'Tracks with Times', sub: 'AMA Pro Motocross' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-4 sm:p-6 text-center"
            >
              <p className="font-mono text-2xl sm:text-3xl font-bold text-accent">{stat.value}</p>
              <p className="text-xs font-bold text-text mt-1">{stat.label}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Class filter */}
        <div className="flex gap-2 mb-6">
          {([['all', 'All Classes'], ['250f', '250F'], ['450f', '450F']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setClassFilter(val)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                classFilter === val
                  ? 'bg-accent text-black'
                  : 'bg-card text-text-muted hover:text-text border border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Deegan's times list */}
        <div className="rounded-xl border border-gold/20 bg-card overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-gold/10 flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-gold/30">
              <Image
                src="/images/deegan/deegan-portrait.jpg"
                alt="Haiden Deegan"
                fill
                quality={100}
                className="object-cover object-top"
              />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-gold">Haiden Deegan</h2>
              <p className="text-[10px] text-text-muted">2x AMA Pro Motocross 250 Champion · Monster Energy Yamaha Star Racing</p>
            </div>
          </div>

          {filtered.length > 0 ? (
            filtered.map((pt, i) => (
              <motion.div
                key={pt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center justify-between px-4 py-4 ${i < filtered.length - 1 ? 'border-b border-border/30' : ''} hover:bg-card-hover transition-colors`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 text-center font-mono text-sm text-text-muted">
                    {i + 1}
                  </span>
                  <div>
                    <Link
                      href={pt.venue_id ? `/venues/${pt.venue_id}` : '#'}
                      className="text-sm font-bold text-text hover:text-accent transition-colors"
                    >
                      {pt.venues?.name || 'Unknown Venue'}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-text-muted">
                        {pt.event_name}
                      </span>
                      {pt.event_date && (
                        <span className="text-[10px] text-text-muted">
                          · {new Date(pt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted uppercase">
                    {pt.bike_class}
                  </span>
                  <span className="font-mono text-lg font-bold text-gold min-w-[100px] text-right">
                    {formatLapTime(pt.lap_time_ms)}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-text-muted">
              No times recorded for this class yet.
            </div>
          )}
        </div>

        {/* "How close are you?" CTA */}
        {fastest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-accent/20 bg-card p-8 text-center"
          >
            <p className="text-text-muted mb-1 text-sm">Can you beat Deegan&apos;s</p>
            <p className="font-mono text-4xl sm:text-5xl font-bold text-gold">
              {formatLapTime(fastest.lap_time_ms)}
            </p>
            <p className="text-text-muted mt-1 text-sm">
              at {fastest.venues?.name || 'the track'}?
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-lg bg-accent px-8 py-3 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
            >
              Log Your Time & Find Out
            </Link>
          </motion.div>
        )}

        {/* Source attribution */}
        <p className="mt-8 text-center text-[10px] text-text-muted/50">
          All times from official 2025 AMA Pro Motocross qualifying results · Source: NBC Sports
        </p>
      </div>
    </div>
  )
}
