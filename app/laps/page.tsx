'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatLapTime, timeAgo } from '@/lib/utils'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lap } from '@/lib/types'

export default function MyLapsPage() {
  const [laps, setLaps] = useState<Lap[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('laps')
        .select('*, tracks(name, location_city, location_state, type)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setLaps(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lap?')) return
    await supabase.from('laps').delete().eq('id', id)
    setLaps(laps.filter((l) => l.id !== id))
  }

  const conditionColors: Record<string, string> = {
    dry: 'text-yellow-400 bg-yellow-400/10',
    muddy: 'text-amber-600 bg-amber-600/10',
    wet: 'text-blue-400 bg-blue-400/10',
    sandy: 'text-orange-300 bg-orange-300/10',
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">My Laps</h1>
            <p className="text-text-muted text-sm mt-1">{laps.length} laps recorded</p>
          </div>
          <Link
            href="/laps/new"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
          >
            + Log Lap
          </Link>
        </div>
      </motion.div>

      {laps.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {laps.map((lap, i) => (
              <motion.div
                key={lap.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-5 hover:border-border/80 transition-colors group relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/tracks/${lap.track_id}`} className="font-heading text-lg font-bold hover:text-accent transition-colors block truncate">
                      {lap.tracks?.name}
                    </Link>
                    <p className="text-xs text-text-muted mt-0.5">
                      {lap.tracks?.location_city}, {lap.tracks?.location_state}
                    </p>
                  </div>
                  {lap.is_personal_best && (
                    <span className="rounded-full bg-gold/10 border border-gold/30 px-2.5 py-1 text-[10px] font-bold text-gold ml-2 flex-shrink-0">
                      PB
                    </span>
                  )}
                </div>

                <div className="font-mono text-3xl font-bold text-accent mb-3">
                  {formatLapTime(lap.time_ms)}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {lap.conditions && (
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${conditionColors[lap.conditions] || 'text-text-muted bg-card-hover'}`}>
                      {lap.conditions}
                    </span>
                  )}
                  {lap.bike_class && (
                    <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-text-muted uppercase">
                      {lap.bike_class}
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted ml-auto">
                    {timeAgo(lap.date)}
                  </span>
                </div>

                {lap.notes && (
                  <p className="text-xs text-text-muted mt-3 border-t border-border/50 pt-3">{lap.notes}</p>
                )}

                <button
                  onClick={() => handleDelete(lap.id)}
                  className="absolute top-3 right-3 text-xs text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-all"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="text-4xl mb-4">🏁</div>
            <p className="text-text-muted mb-4">No laps recorded yet.</p>
            <Link href="/laps/new" className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-black hover:bg-accent-hover transition-colors inline-block">
              Log your first lap
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
