import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { formatLapTime } from '@/lib/utils'
import Link from 'next/link'
import { FollowButton } from '@/components/follow-button'
import type { Lap } from '@/lib/types'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('display_name', decodeURIComponent(username))
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: laps }, { data: followers }, { data: following }] = await Promise.all([
    supabase
      .from('laps')
      .select('*, tracks(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
  ])

  const isOwnProfile = user?.id === profile.id

  // Check if current user follows this profile
  let isFollowing = false
  if (user && !isOwnProfile) {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single()
    isFollowing = !!data
  }

  const personalBests = (laps || []).filter((l: Lap) => l.is_personal_best)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-3xl font-bold text-accent font-heading">
              {profile.display_name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold">{profile.display_name}</h1>
              {profile.location && <p className="text-text-muted text-sm mt-1">{profile.location}</p>}
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-text-muted"><span className="text-text font-medium">{followers?.length ?? 0}</span> followers</span>
                <span className="text-text-muted"><span className="text-text font-medium">{following?.length ?? 0}</span> following</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {isOwnProfile ? (
              <Link href="/profile/edit" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">
                Edit Profile
              </Link>
            ) : user ? (
              <FollowButton targetUserId={profile.id} initialFollowing={isFollowing} />
            ) : null}
          </div>
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
            {profile.is_premium && (
              <span className="rounded-full bg-gold/10 border border-gold/30 px-3 py-1 text-xs font-medium text-gold">
                Premium
              </span>
            )}
          </div>
        )}
      </div>

      {/* Personal Bests */}
      {personalBests.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading text-xl font-bold mb-4">Personal Bests</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {personalBests.map((lap: Lap) => (
              <div key={lap.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{lap.tracks?.name}</p>
                  <p className="text-xs text-text-muted">{lap.bike_class} &middot; {lap.conditions}</p>
                </div>
                <span className="font-mono text-lg font-bold text-accent">{formatLapTime(lap.time_ms)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Laps */}
      <div className="mt-8">
        <h2 className="font-heading text-xl font-bold mb-4">Recent Laps</h2>
        {(laps && laps.length > 0) ? (
          <div className="flex flex-col gap-3">
            {laps.map((lap: Lap) => (
              <div key={lap.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{lap.tracks?.name}</p>
                  <p className="text-xs text-text-muted">{lap.date} &middot; {lap.bike_class} &middot; {lap.conditions}</p>
                </div>
                <div className="flex items-center gap-3">
                  {lap.is_personal_best && (
                    <span className="text-xs font-medium text-gold">PB</span>
                  )}
                  <span className="font-mono text-lg font-bold text-text">{formatLapTime(lap.time_ms)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">No laps recorded yet.</p>
        )}
      </div>
    </div>
  )
}
