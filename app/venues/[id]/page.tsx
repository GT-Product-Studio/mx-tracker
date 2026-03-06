import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { VenueDetail } from '@/components/venue-detail'
import { VenueCheckin } from '@/components/venue-checkin'
import { formatLapTime } from '@/lib/utils'

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single()

  if (!venue) notFound()

  const { data: tracks } = await supabase
    .from('tracks')
    .select('*')
    .eq('venue_id', id)
    .order('layout_name')

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

  const { data: proTimes } = await supabase
    .from('pro_times')
    .select('*')
    .eq('venue_id', id)
    .order('lap_time_ms', { ascending: true })

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*, profiles(display_name)')
    .eq('venue_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: battles } = await supabase
    .from('battles')
    .select('*, challenger:profiles!battles_challenger_id_fkey(display_name), defender:profiles!battles_defender_id_fkey(display_name)')
    .eq('venue_id', id)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: { user } } = await supabase.auth.getUser()

  const latestCondition = checkins?.[0] as any
  const today = new Date().toISOString().split('T')[0]
  const ridersToday = checkins?.filter((c: any) => c.created_at.startsWith(today)).length || 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/tracks" className="text-sm text-text-muted hover:text-accent transition-colors mb-6 inline-block">
        ← All Venues
      </Link>

      {/* Venue header */}
      <div className="rounded-xl border border-border bg-card p-8 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
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
          {user && <VenueCheckin venueId={id} />}
        </div>
        {venue.description && (
          <p className="mt-4 text-sm text-text-muted leading-relaxed">{venue.description}</p>
        )}

        <div className="mt-4 flex items-center gap-4">
          {ridersToday > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-accent">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              {ridersToday} rider{ridersToday !== 1 ? 's' : ''} here today
            </span>
          )}
          {latestCondition?.conditions && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted capitalize">
              Conditions: {latestCondition.conditions}
            </span>
          )}
        </div>
      </div>

      {/* Recent Check-ins */}
      {checkins && checkins.length > 0 && (
        <div className="mb-6">
          <h2 className="font-heading text-lg font-bold mb-3">Recent Check-ins</h2>
          <div className="flex flex-wrap gap-2">
            {checkins.slice(0, 5).map((c: any) => (
              <div key={c.id} className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
                <span className="font-medium">{c.profiles?.display_name}</span>
                {c.conditions && <span className="text-text-muted"> · {c.conditions}</span>}
                {c.notes && <span className="text-text-muted"> · &ldquo;{c.notes}&rdquo;</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Battles */}
      {battles && battles.length > 0 && (
        <div className="mb-6">
          <h2 className="font-heading text-lg font-bold mb-3">Active Battles</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {battles.map((battle: any) => (
              <Link
                key={battle.id}
                href={`/battles/${battle.id}`}
                className="rounded-xl border border-accent/20 bg-card p-4 hover:bg-card-hover transition-colors block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm">{battle.challenger?.display_name}</span>
                  <span className="text-xs font-bold text-accent">VS</span>
                  <span className="font-heading font-bold text-sm">{battle.defender?.display_name || 'Open'}</span>
                </div>
                <div className="mt-2 text-xs text-text-muted">
                  {battle.bike_class.toUpperCase()} · {battle.battle_type.replace('_', ' ')}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pro Times */}
      {proTimes && proTimes.length > 0 && (
        <div className="mb-6">
          <h2 className="font-heading text-lg font-bold mb-3 text-gold">Pro Times</h2>
          <div className="rounded-xl border border-gold/20 bg-card overflow-hidden">
            {proTimes.map((pt: any, i: number) => (
              <div
                key={pt.id}
                className={`flex items-center justify-between px-4 py-3 ${i < proTimes.length - 1 ? 'border-b border-border/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gold">{pt.rider_name}</p>
                    <p className="text-[10px] text-text-muted">{pt.event_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted uppercase">{pt.bike_class}</span>
                  <span className="font-mono text-sm font-bold text-gold">{formatLapTime(pt.lap_time_ms)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracks */}
      <div className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-4">Tracks ({tracks?.length || 0})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tracks?.map((track) => (
            <Link
              key={track.id}
              href={`/tracks/${track.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:bg-card-hover hover:border-accent/20"
            >
              <div>
                <h3 className="font-medium text-sm">{track.layout_name}</h3>
                {track.description && <p className="text-xs text-text-muted mt-0.5">{track.description}</p>}
                {track.difficulty && <DifficultyBadge difficulty={track.difficulty} />}
              </div>
              {user && <span className="text-accent text-xs font-medium">Log Lap →</span>}
            </Link>
          ))}
        </div>
      </div>

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
