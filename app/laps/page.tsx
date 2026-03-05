'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatLapTime } from '@/lib/utils'
import Link from 'next/link'
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/motion'
import type { Lap } from '@/lib/types'

export default function MyLapsPage() {
  const [laps, setLaps] = useState<Lap[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('laps')
        .select('*, tracks(name, location_state)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setLaps(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lap?')) return
    await supabase.from('laps').delete().eq('id', id)
    setLaps(laps.filter((l) => l.id !== id))
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <FadeIn>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">My Laps</h1>
            <p className="text-text-muted text-sm mt-1">{laps.length} laps recorded</p>
          </div>
          <Link
            href="/laps/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
          >
            Log Lap
          </Link>
        </div>
      </FadeIn>

      {laps.length > 0 ? (
        <FadeInStagger className="flex flex-col gap-3">
          {laps.map((lap) => (
            <FadeInItem key={lap.id}>
              <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/tracks/${lap.track_id}`} className="font-medium text-sm hover:text-accent transition-colors">
                      {lap.tracks?.name}
                    </Link>
                    {lap.is_personal_best && (
                      <span className="rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-[10px] font-bold text-gold">PB</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {lap.date} &middot; {lap.bike_class?.toUpperCase()} &middot; {lap.conditions}
                    {lap.video_url && (
                      <> &middot; <a href={lap.video_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Video</a></>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-lg font-bold text-accent">{formatLapTime(lap.time_ms)}</span>
                  <button onClick={() => handleDelete(lap.id)} className="text-xs text-text-muted hover:text-danger transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>
      ) : (
        <FadeIn>
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-text-muted mb-4">No laps recorded yet.</p>
            <Link href="/laps/new" className="text-sm font-medium text-accent hover:underline">Log your first lap</Link>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
