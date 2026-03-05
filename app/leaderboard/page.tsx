import { createClient } from '@/lib/supabase-server'
import { formatLapTime, getRankColor } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: laps } = await supabase
    .from('laps')
    .select('*, profiles(display_name), tracks(name, location_state)')
    .order('time_ms', { ascending: true })
    .limit(100)

  const seen = new Set<string>()
  const uniqueLaps = (laps || []).filter((lap) => {
    if (seen.has(lap.user_id)) return false
    seen.add(lap.user_id)
    return true
  })

  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, name, location_state')
    .eq('approved', true)
    .order('name')

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
        {/* Global Leaderboard */}
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-12">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-heading text-lg font-bold">Global Rankings</h2>
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
              {uniqueLaps.slice(0, 50).map((lap, i) => (
                <tr key={lap.id} className="border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold" style={{ color: getRankColor(i + 1) }}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/profile/${encodeURIComponent(lap.profiles?.display_name || '')}`} className="text-sm font-medium hover:text-accent transition-colors">
                      {lap.profiles?.display_name}
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
                </tr>
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
          {(tracks || []).map((track) => (
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
