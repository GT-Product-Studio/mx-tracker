'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Track } from '@/lib/types'
import { FadeInStagger, FadeInItem } from '@/components/motion'

export function TracksFilter({ tracks }: { tracks: Track[] }) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = tracks.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.location_state.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const typeColors: Record<string, string> = {
    motocross: 'text-accent border-accent/30',
    supercross: 'text-gold border-gold/30',
    practice: 'text-text-muted border-border',
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tracks..."
          className="w-full sm:w-64"
        />
        <div className="flex gap-2">
          {['all', 'motocross', 'supercross', 'practice'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
                typeFilter === type ? 'bg-accent text-black' : 'bg-card text-text-muted hover:text-text border border-border'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <FadeInStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((track) => (
          <FadeInItem key={track.id}>
            <Link
              href={`/tracks/${track.id}`}
              className="block rounded-xl border border-border bg-card p-6 transition-colors hover:bg-card-hover hover:border-accent/20"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-heading text-lg font-bold leading-tight">{track.name}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${typeColors[track.type] || ''}`}>
                  {track.type}
                </span>
              </div>
              <p className="text-sm text-text-muted">{track.location_city}, {track.location_state}</p>
              {track.difficulty && (
                <span className="mt-3 inline-block rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted capitalize">
                  {track.difficulty}
                </span>
              )}
            </Link>
          </FadeInItem>
        ))}
      </FadeInStagger>

      {filtered.length === 0 && (
        <p className="text-center text-text-muted py-12">No tracks found.</p>
      )}
    </div>
  )
}
