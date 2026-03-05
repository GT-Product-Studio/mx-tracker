import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { formatLapTime } from '@/lib/utils'
import Link from 'next/link'
import type { Lap } from '@/lib/types'

export default async function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: track } = await supabase.from('tracks').select('*').eq('id', id).single()
  if (!track) notFound()

  const { data: laps } = await supabase
    .from('laps')
    .select('*, profiles(display_name)')
    .eq('track_id', id)
    .order('time_ms', { ascending: true })
    .limit(20)

  const { data: { user } } = await supabase.auth.getUser()

  const typeColors: Record<string, string> = {
    motocross: 'text-accent border-accent/30',
    supercross: 'text-gold border-gold/30',
    practice: 'text-text-muted border-border',
  }

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading text-3xl font-bold">{track.name}</h1>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${typeColors[track.type] || ''}`}>
                {track.type}
              </span>
            </div>
            <p className="text-text-muted">{track.location_city}, {track.location_state}</p>
            {track.difficulty && (
              <span className="mt-3 inline-block rounded-full border border-border px-2 py-0.5 text-xs font-medium text-text-muted capitalize">
                {track.difficulty}
              </span>
            )}
          </div>
          {user && (
            <Link
              href={`/laps/new?track=${track.id}`}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
            >
              Log Lap
            </Link>
          )}
        </div>
        {track.description && (
          <p className="mt-4 text-sm text-text-muted leading-relaxed">{track.description}</p>
        )}
      </div>

      {/* Track Leaderboard */}
      <div className="mt-8">
        <h2 className="font-heading text-xl font-bold mb-4">Leaderboard</h2>
        {(laps && laps.length > 0) ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-text-muted uppercase">
                  <th className="px-4 py-3 text-left w-12">#</th>
                  <th className="px-4 py-3 text-left">Rider</th>
                  <th className="px-4 py-3 text-right">Time</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Class</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {laps.map((lap: Lap & { profiles: { display_name: string } }, i: number) => (
                  <tr key={lap.id} className="border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className="text-sm font-bold"
                        style={{ color: i < 3 ? rankColors[i] : '#888' }}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/profile/${encodeURIComponent(lap.profiles?.display_name || '')}`} className="text-sm font-medium hover:text-accent transition-colors">
                        {lap.profiles?.display_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm font-bold text-accent">{formatLapTime(lap.time_ms)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-text-muted hidden sm:table-cell uppercase">{lap.bike_class}</td>
                    <td className="px-4 py-3 text-right text-xs text-text-muted hidden sm:table-cell">{lap.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-text-muted">No laps recorded at this track yet.</p>
            {user && (
              <Link href={`/laps/new?track=${track.id}`} className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
                Be the first to log a lap
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
