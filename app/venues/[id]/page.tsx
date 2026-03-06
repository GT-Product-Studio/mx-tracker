import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { VenueDetail } from '@/components/venue-detail'

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single()

  if (!venue) notFound()

  // Get all tracks for this venue
  const { data: tracks } = await supabase
    .from('tracks')
    .select('*')
    .eq('venue_id', id)
    .order('layout_name')

  // Get laps for all tracks at this venue, with profiles
  const trackIds = tracks?.map(t => t.id) || []
  
  let laps: any[] = []
  if (trackIds.length > 0) {
    const { data } = await supabase
      .from('laps')
      .select('*, profiles(display_name), tracks(layout_name)')
      .in('track_id', trackIds)
      .order('time_ms', { ascending: true })
      .limit(50)
    laps = data || []
  }

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Back link */}
      <Link href="/tracks" className="text-sm text-text-muted hover:text-accent transition-colors mb-6 inline-block">
        ← All Venues
      </Link>

      {/* Venue header */}
      <div className="rounded-xl border border-border bg-card p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading text-3xl font-bold">{venue.name}</h1>
              <TypeBadge type={venue.type} />
            </div>
            <p className="text-text-muted">{venue.location_city}, {venue.location_state}</p>
            {venue.website && (
              <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline mt-1 inline-block">
                {venue.website}
              </a>
            )}
          </div>
        </div>
        {venue.description && (
          <p className="mt-4 text-sm text-text-muted leading-relaxed">{venue.description}</p>
        )}
      </div>

      {/* Tracks at this venue */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold">
            Tracks ({tracks?.length || 0})
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {tracks?.map((track) => (
            <Link
              key={track.id}
              href={`/tracks/${track.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:bg-card-hover hover:border-accent/20"
            >
              <div>
                <h3 className="font-medium text-sm">{track.layout_name}</h3>
                {track.difficulty && (
                  <DifficultyBadge difficulty={track.difficulty} />
                )}
              </div>
              {user && (
                <span className="text-accent text-xs font-medium">Log Lap →</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Leaderboard with class filter */}
      <VenueDetail laps={laps} tracks={tracks || []} user={user} venueId={id} />
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    motocross: 'text-accent border-accent/30',
    supercross: 'text-gold border-gold/30',
    practice: 'text-text-muted border-border',
  }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${colors[type] || ''}`}>
      {type}
    </span>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy: 'text-green-400',
    intermediate: 'text-yellow-400',
    advanced: 'text-orange-400',
    pro: 'text-red-400',
  }
  return (
    <span className={`mt-1 inline-block text-[10px] font-bold uppercase ${colors[difficulty] || 'text-text-muted'}`}>
      {difficulty}
    </span>
  )
}
