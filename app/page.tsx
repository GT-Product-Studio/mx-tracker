import { createClient } from '@/lib/supabase-server'
import { formatLapTime, getRankColor } from '@/lib/utils'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: tracks }, { data: recentLaps }, { data: activeChallenges }, { data: { user } }] = await Promise.all([
    supabase.from('tracks').select('*').eq('approved', true).limit(6),
    supabase.from('laps').select('*, profiles(display_name), tracks(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('challenges').select('*, tracks(name)').eq('is_active', true).limit(3),
    supabase.auth.getUser(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <section className="py-16 text-center">
        <h1 className="font-heading text-6xl font-bold tracking-tight sm:text-7xl">
          TRACK YOUR <span className="text-accent">LAPS</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-text-muted">
          Log lap times, climb leaderboards, compete in weekly challenges, and connect with riders across the country.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          {user ? (
            <Link href="/laps/new" className="rounded-lg bg-accent px-8 py-3 text-sm font-bold text-black hover:bg-accent-hover transition-colors">
              Log a Lap
            </Link>
          ) : (
            <Link href="/signup" className="rounded-lg bg-accent px-8 py-3 text-sm font-bold text-black hover:bg-accent-hover transition-colors">
              Get Started
            </Link>
          )}
          <Link href="/leaderboard" className="rounded-lg border border-border px-8 py-3 text-sm font-medium text-text-muted hover:text-text hover:border-text-muted transition-colors">
            View Leaderboard
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-16">
        {[
          { label: 'Tracks', value: tracks?.length || 0 },
          { label: 'Laps Logged', value: recentLaps?.length || 0, suffix: '+' },
          { label: 'Active Challenges', value: activeChallenges?.length || 0 },
          { label: 'Bike Classes', value: 7 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="font-heading text-3xl font-bold text-accent">{stat.value}{stat.suffix}</p>
            <p className="text-xs text-text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Active Challenges */}
      {activeChallenges && activeChallenges.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Active Challenges
            </h2>
            <Link href="/challenges" className="text-sm text-text-muted hover:text-accent transition-colors">View all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeChallenges.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className="rounded-xl border border-accent/20 bg-card p-6 hover:bg-card-hover transition-colors"
              >
                <h3 className="font-heading text-lg font-bold">{challenge.title}</h3>
                <p className="text-sm text-text-muted mt-1">{challenge.tracks?.name}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Target</span>
                  <span className="font-mono font-bold text-gold">{formatLapTime(challenge.deegan_time_ms)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {recentLaps && recentLaps.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">Recent Activity</h2>
            <Link href="/leaderboard" className="text-sm text-text-muted hover:text-accent transition-colors">Leaderboard →</Link>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {recentLaps.map((lap, i) => (
              <div key={lap.id} className={`flex items-center justify-between p-4 ${i < recentLaps.length - 1 ? 'border-b border-border/50' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold" style={{ color: getRankColor(i + 1) }}>{i + 1}</span>
                  <div>
                    <Link href={`/profile/${encodeURIComponent(lap.profiles?.display_name || '')}`} className="text-sm font-medium hover:text-accent transition-colors">
                      {lap.profiles?.display_name}
                    </Link>
                    <p className="text-xs text-text-muted">{lap.tracks?.name}</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-accent">{formatLapTime(lap.time_ms)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Tracks */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">Featured Tracks</h2>
          <Link href="/tracks" className="text-sm text-text-muted hover:text-accent transition-colors">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(tracks || []).map((track) => (
            <Link
              key={track.id}
              href={`/tracks/${track.id}`}
              className="rounded-xl border border-border bg-card p-6 hover:bg-card-hover hover:border-accent/20 transition-colors"
            >
              <h3 className="font-heading text-lg font-bold">{track.name}</h3>
              <p className="text-sm text-text-muted mt-1">{track.location_city}, {track.location_state}</p>
              <div className="mt-3 flex gap-2">
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted capitalize">{track.type}</span>
                {track.difficulty && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted capitalize">{track.difficulty}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="rounded-xl border border-accent/20 bg-card p-12 text-center mb-16">
          <h2 className="font-heading text-3xl font-bold">Ready to ride?</h2>
          <p className="text-text-muted mt-2 max-w-md mx-auto">
            Join MX Tracker to log your laps, compete with riders, and track your progress.
          </p>
          <Link href="/signup" className="mt-6 inline-block rounded-lg bg-accent px-8 py-3 text-sm font-bold text-black hover:bg-accent-hover transition-colors">
            Create Free Account
          </Link>
        </section>
      )}
    </div>
  )
}
