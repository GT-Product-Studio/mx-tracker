import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TrackLeaderboard } from '@/components/track-leaderboard'

export default async function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: track } = await supabase
    .from('tracks')
    .select('*, venues(id, name, location_city, location_state, type)')
    .eq('id', id)
    .single()

  if (!track) notFound()

  const { data: laps } = await supabase
    .from('laps')
    .select('*, profiles(display_name)')
    .eq('track_id', id)
    .order('time_ms', { ascending: true })
    .limit(50)

  const { data: { user } } = await supabase.auth.getUser()

  const typeColors: Record<string, string> = {
    motocross: 'text-accent border-accent/30',
    supercross: 'text-gold border-gold/30',
    practice: 'text-text-muted border-border',
  }

  const venue = track.venues as any

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back links */}
      <div className="flex gap-3 mb-6 text-sm">
        <Link href="/tracks" className="text-text-muted hover:text-accent transition-colors">
          ← All Venues
        </Link>
        {venue && (
          <>
            <span className="text-border">/</span>
            <Link href={`/venues/${venue.id}`} className="text-text-muted hover:text-accent transition-colors">
              {venue.name}
            </Link>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-heading text-3xl font-bold">{track.layout_name || track.name}</h1>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${typeColors[track.type] || ''}`}>
                {track.type}
              </span>
            </div>
            {venue && (
              <Link href={`/venues/${venue.id}`} className="text-text-muted hover:text-accent transition-colors text-sm">
                {venue.name} — {venue.location_city}, {venue.location_state}
              </Link>
            )}
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

      {/* Leaderboard with class filter */}
      <div className="mt-8">
        <TrackLeaderboard laps={laps || []} user={user} trackId={track.id} />
      </div>
    </div>
  )
}
