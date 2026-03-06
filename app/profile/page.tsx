'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatLapTime, timeAgo } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Profile, Lap } from '@/lib/types'

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [laps, setLaps] = useState<Lap[]>([])
  const [stats, setStats] = useState({ totalLaps: 0, tracksRidden: 0, personalBests: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: profileData }, { data: lapsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('laps')
          .select('*, tracks(name, location_city, location_state)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (profileData) setProfile(profileData)
      if (lapsData) {
        setLaps(lapsData)
        const trackIds = new Set(lapsData.map((l) => l.track_id))
        const pbs = lapsData.filter((l) => l.is_personal_best)
        setStats({
          totalLaps: lapsData.length,
          tracksRidden: trackIds.size,
          personalBests: pbs.length,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>
  if (!profile) return null

  const personalBests = laps.filter((l) => l.is_personal_best)
  const recentLaps = laps.slice(0, 5)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Profile Header */}
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-3xl font-bold text-accent font-heading">
                {profile.display_name[0].toUpperCase()}
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold">{profile.display_name}</h1>
                {profile.location && <p className="text-text-muted text-sm mt-1">{profile.location}</p>}
              </div>
            </div>
            <Link href="/profile/edit" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">
              Edit Profile
            </Link>
          </div>

          {/* Bike info */}
          {(profile.bike_make || profile.riding_level) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {profile.riding_level && (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted capitalize">
                  {profile.riding_level}
                </span>
              )}
              {profile.bike_make && (
                <span className="rounded-full border border-accent/30 px-3 py-1 text-xs font-medium text-accent">
                  {[profile.bike_year, profile.bike_make, profile.bike_model].filter(Boolean).join(' ')}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mt-6"
      >
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="font-mono text-3xl font-bold text-accent">{stats.totalLaps}</p>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Total Laps</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="font-mono text-3xl font-bold text-accent">{stats.tracksRidden}</p>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Tracks Ridden</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="font-mono text-3xl font-bold text-gold">{stats.personalBests}</p>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Personal Bests</p>
        </div>
      </motion.div>

      {/* Personal Bests */}
      {personalBests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="font-heading text-xl font-bold mb-4">Personal Bests</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {personalBests.map((lap) => (
              <Link
                key={lap.id}
                href={`/tracks/${lap.track_id}`}
                className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:bg-card-hover transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{lap.tracks?.name}</p>
                  <p className="text-xs text-text-muted">{lap.bike_class?.toUpperCase()} &middot; {lap.conditions}</p>
                </div>
                <span className="font-mono text-lg font-bold text-accent">{formatLapTime(lap.time_ms)}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold">Recent Activity</h2>
          {laps.length > 5 && (
            <Link href="/laps" className="text-sm text-accent hover:underline">View all</Link>
          )}
        </div>
        {recentLaps.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentLaps.map((lap) => (
              <div key={lap.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{lap.tracks?.name}</p>
                  <p className="text-xs text-text-muted">
                    {timeAgo(lap.date)} &middot; {lap.bike_class?.toUpperCase()} &middot; {lap.conditions}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {lap.is_personal_best && (
                    <span className="text-xs font-bold text-gold">PB</span>
                  )}
                  <span className="font-mono text-lg font-bold text-text">{formatLapTime(lap.time_ms)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-text-muted mb-3">No laps recorded yet.</p>
            <Link href="/laps/new" className="text-sm text-accent hover:underline">Log your first lap</Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}
