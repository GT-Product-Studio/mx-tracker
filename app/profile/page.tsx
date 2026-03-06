'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatLapTime, timeAgo } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Profile, Lap, RiderStats } from '@/lib/types'

const RANK_DISPLAY: Record<string, { emoji: string; label: string; color: string }> = {
  bronze: { emoji: '🟤', label: 'Bronze', color: '#CD7F32' },
  silver: { emoji: '⚪', label: 'Silver', color: '#C0C0C0' },
  gold: { emoji: '🟡', label: 'Gold', color: '#FFD700' },
  diamond: { emoji: '💎', label: 'Diamond', color: '#B9F2FF' },
  pro: { emoji: '🏆', label: 'Pro', color: '#29F000' },
}

type BattleRow = {
  id: string
  status: string
  winner_id: string | null
  bike_class: string
  challenger: { display_name: string } | null
  defender: { display_name: string } | null
  venues: { name: string } | null
  created_at: string
}

type CheckinRow = {
  id: string
  venue_id: string
  venues: { name: string } | null
  created_at: string
}

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile & { bike_class?: string; home_venue_id?: string } | null>(null)
  const [laps, setLaps] = useState<Lap[]>([])
  const [riderStats, setRiderStats] = useState<RiderStats | null>(null)
  const [battles, setBattles] = useState<BattleRow[]>([])
  const [checkins, setCheckins] = useState<CheckinRow[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [
        { data: profileData },
        { data: lapsData },
        { data: statsData },
        { data: battlesData },
        { data: checkinsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('laps').select('*, tracks(name, location_city, location_state)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('rider_stats').select('*').eq('user_id', user.id).single(),
        supabase
          .from('battles')
          .select('*, challenger:profiles!battles_challenger_id_fkey(display_name), defender:profiles!battles_defender_id_fkey(display_name), venues(name)')
          .or(`challenger_id.eq.${user.id},defender_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('checkins')
          .select('*, venues(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      if (profileData) setProfile(profileData)
      if (lapsData) setLaps(lapsData)
      if (statsData) setRiderStats(statsData)
      if (battlesData) setBattles(battlesData as BattleRow[])
      if (checkinsData) setCheckins(checkinsData as CheckinRow[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>
  if (!profile) return null

  const stats = riderStats || { battles_won: 0, battles_lost: 0, battles_drawn: 0, win_streak: 0, best_win_streak: 0, braap_score: 0, rank_tier: 'bronze' as const, venues_visited: 0, updated_at: '', user_id: '' }
  const rank = RANK_DISPLAY[stats.rank_tier] || RANK_DISPLAY.bronze
  const totalBattles = stats.battles_won + stats.battles_lost + stats.battles_drawn
  const winRate = totalBattles > 0 ? Math.round((stats.battles_won / totalBattles) * 100) : 0

  const personalBests = laps.filter((l) => l.is_personal_best)
  const recentLaps = laps.slice(0, 5)

  // Unique venues from checkins
  const uniqueVenues = [...new Map(checkins.map((c) => [c.venue_id, c.venues?.name])).entries()]

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
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm" style={{ color: rank.color }}>{rank.emoji} {rank.label}</span>
                  {(profile as any).bike_class && (
                    <span className="rounded-full border border-accent/30 px-2 py-0.5 text-xs font-medium text-accent uppercase">
                      {(profile as any).bike_class}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link href="/profile/edit" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">
              Edit Profile
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Braap Score + Battle Record */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6"
      >
        <div className="rounded-xl border border-accent/20 bg-card p-5 text-center">
          <p className="font-mono text-3xl font-bold text-accent">{Math.round(stats.braap_score)}</p>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Braap Score</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="font-mono text-2xl font-bold text-text">
            {stats.battles_won}-{stats.battles_lost}-{stats.battles_drawn}
          </p>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">W-L-D</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="font-mono text-3xl font-bold text-accent">{winRate}%</p>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Win Rate</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="font-mono text-3xl font-bold text-gold">{stats.win_streak}</p>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Win Streak</p>
        </div>
      </motion.div>

      {/* Recent Battles */}
      {battles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="font-heading text-xl font-bold mb-4">Recent Battles</h2>
          <div className="flex flex-col gap-3">
            {battles.map((battle) => (
              <Link
                key={battle.id}
                href={`/battles/${battle.id}`}
                className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:bg-card-hover transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">
                    {battle.challenger?.display_name} vs {battle.defender?.display_name || 'Open'}
                  </p>
                  <p className="text-xs text-text-muted">{battle.venues?.name} · {battle.bike_class.toUpperCase()}</p>
                </div>
                <span className={`text-xs font-bold uppercase ${
                  battle.status === 'completed' && battle.winner_id ? 'text-accent' :
                  battle.status === 'active' ? 'text-accent' : 'text-text-muted'
                }`}>
                  {battle.status}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Venues Visited */}
      {uniqueVenues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-8"
        >
          <h2 className="font-heading text-xl font-bold mb-4">Venues Visited ({uniqueVenues.length})</h2>
          <div className="flex flex-wrap gap-2">
            {uniqueVenues.map(([venueId, name]) => (
              <Link
                key={venueId}
                href={`/venues/${venueId}`}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
              >
                {name}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Personal Bests */}
      {personalBests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
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

      {/* Lap History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold">Lap History</h2>
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
