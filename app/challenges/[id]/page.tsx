import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { formatLapTime, getRankColor } from '@/lib/utils'
import Link from 'next/link'
import { ChallengeEntryForm } from '@/components/challenge-entry-form'

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*, tracks(name, location_city, location_state)')
    .eq('id', id)
    .single()

  if (!challenge) notFound()

  const { data: entries } = await supabase
    .from('challenge_entries')
    .select('*, profiles(display_name), laps(time_ms, bike_class, date)')
    .eq('challenge_id', id)
    .order('created_at', { ascending: true })

  // Sort entries by lap time
  const sortedEntries = (entries || []).sort((a, b) => (a.laps?.time_ms || 0) - (b.laps?.time_ms || 0))

  const { data: { user } } = await supabase.auth.getUser()
  const hasEntered = user && entries?.some((e) => e.user_id === user.id)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading text-3xl font-bold">{challenge.title}</h1>
              {challenge.is_active && (
                <span className="rounded-full bg-accent/10 border border-accent/30 px-2 py-0.5 text-xs font-medium text-accent">Active</span>
              )}
            </div>
            <p className="text-text-muted">
              <Link href={`/tracks/${challenge.track_id}`} className="hover:text-accent transition-colors">
                {challenge.tracks?.name}
              </Link>
              {' — '}{challenge.tracks?.location_city}, {challenge.tracks?.location_state}
            </p>
            {challenge.description && (
              <p className="text-sm text-text-muted mt-3">{challenge.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted uppercase mb-1">Danger Boy Time</p>
            <span className="font-mono text-2xl font-bold text-gold">{formatLapTime(challenge.deegan_time_ms)}</span>
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-text-muted">
          <span>Start: {new Date(challenge.start_date).toLocaleDateString()}</span>
          <span>End: {new Date(challenge.end_date).toLocaleDateString()}</span>
          <span>{sortedEntries.length} entries</span>
        </div>
      </div>

      {/* Entry form */}
      {user && challenge.is_active && !hasEntered && (
        <div className="mt-8">
          <ChallengeEntryForm challengeId={challenge.id} trackId={challenge.track_id} userId={user.id} />
        </div>
      )}

      {/* Leaderboard */}
      <div className="mt-8">
        <h2 className="font-heading text-xl font-bold mb-4">Challenge Leaderboard</h2>
        {sortedEntries.length > 0 ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-text-muted uppercase">
                  <th className="px-4 py-3 text-left w-12">#</th>
                  <th className="px-4 py-3 text-left">Rider</th>
                  <th className="px-4 py-3 text-right">Time</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">vs Target</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry, i) => {
                  const diff = (entry.laps?.time_ms || 0) - challenge.deegan_time_ms
                  const beatTarget = diff < 0
                  return (
                    <tr key={entry.id} className="border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold" style={{ color: getRankColor(i + 1) }}>{i + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/profile/${encodeURIComponent(entry.profiles?.display_name || '')}`} className="text-sm font-medium hover:text-accent transition-colors">
                          {entry.profiles?.display_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm font-bold text-accent">{formatLapTime(entry.laps?.time_ms || 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={`font-mono text-xs font-medium ${beatTarget ? 'text-accent' : 'text-danger'}`}>
                          {beatTarget ? '' : '+'}{(diff / 1000).toFixed(3)}s
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-text-muted">No entries yet. Be the first to take on the challenge!</p>
          </div>
        )}
      </div>
    </div>
  )
}
