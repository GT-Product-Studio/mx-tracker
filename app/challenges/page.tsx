import { createClient } from '@/lib/supabase-server'
import { formatLapTime } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import type { Challenge } from '@/lib/types'

export default async function ChallengesPage() {
  const supabase = await createClient()

  const { data: activeChallenges } = await supabase
    .from('challenges')
    .select('*, tracks(name, location_state)')
    .eq('is_active', true)
    .order('end_date', { ascending: true })

  const { data: pastChallenges } = await supabase
    .from('challenges')
    .select('*, tracks(name, location_state)')
    .eq('is_active', false)
    .order('end_date', { ascending: false })
    .limit(10)

  return (
    <div>
      {/* Hero banner */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src="/images/deegan/deegan-sx-27.jpg"
          alt="Haiden Deegan"
          fill
          priority
          quality={100}
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />
        <div className="relative z-10 flex h-full items-end pb-8 px-4">
          <div className="mx-auto w-full max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">Set by Haiden Deegan</p>
            <h1 className="font-heading text-4xl font-bold sm:text-5xl">Danger Boy Challenges</h1>
            <p className="text-text-muted text-sm mt-2">Beat the target time Deegan sets. Prove yourself.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Active Challenges */}
        <div className="mb-12">
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Active Challenges
          </h2>
          {(activeChallenges && activeChallenges.length > 0) ? (
            <div className="flex flex-col gap-4">
              {activeChallenges.map((challenge: Challenge, i: number) => (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="group rounded-xl border border-accent/20 bg-card overflow-hidden hover:bg-card-hover transition-colors block"
                >
                  <div className="flex">
                    {/* Thumbnail */}
                    <div className="relative hidden sm:block w-32 flex-shrink-0">
                      <Image
                        src={`/images/deegan/deegan-sx-${(i * 5 + 8) % 49 + 1}.jpg`}
                        alt="Challenge"
                        fill
                        quality={100}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading text-xl font-bold group-hover:text-accent transition-colors">{challenge.title}</h3>
                          <p className="text-sm text-text-muted mt-1">{challenge.tracks?.name} — {challenge.tracks?.location_state}</p>
                          {challenge.description && (
                            <p className="text-sm text-text-muted mt-2">{challenge.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-text-muted uppercase mb-1">Danger Boy Time</p>
                          <span className="font-mono text-xl font-bold text-gold">{formatLapTime(challenge.deegan_time_ms)}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
                        <span>Ends {new Date(challenge.end_date).toLocaleDateString()}</span>
                        <span className="text-accent font-medium">Enter Challenge →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-text-muted">No active challenges right now. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Past Challenges */}
        {pastChallenges && pastChallenges.length > 0 && (
          <div>
            <h2 className="font-heading text-xl font-bold mb-4">Past Challenges</h2>
            <div className="flex flex-col gap-3">
              {pastChallenges.map((challenge: Challenge) => (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="rounded-xl border border-border bg-card p-4 hover:bg-card-hover transition-colors flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-heading font-bold text-sm">{challenge.title}</h3>
                    <p className="text-xs text-text-muted">{challenge.tracks?.name}</p>
                  </div>
                  <span className="font-mono text-sm text-text-muted">{formatLapTime(challenge.deegan_time_ms)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
