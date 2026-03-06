'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Track } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

export function TracksFilter({ tracks }: { tracks: Track[] }) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = tracks.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.location_city?.toLowerCase().includes(search.toLowerCase()) && !t.location_state.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const typeColors: Record<string, string> = {
    motocross: 'text-accent border-accent/30',
    supercross: 'text-gold border-gold/30',
    practice: 'text-text-muted border-border',
  }

  const difficultyColors: Record<string, string> = {
    easy: 'text-green-400',
    intermediate: 'text-yellow-400',
    advanced: 'text-orange-400',
    pro: 'text-red-400',
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or state..."
            className="w-full pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
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

      <div className="flex gap-2 mb-6 flex-wrap">
        <span className="text-xs text-text-muted py-2">Difficulty:</span>
        {['all', 'easy', 'intermediate', 'advanced', 'pro'].map((d) => (
          <button
            key={d}
            onClick={() => setDifficultyFilter(d)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              difficultyFilter === d ? 'bg-accent text-black' : 'bg-card text-text-muted hover:text-text border border-border'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-muted mb-4">{filtered.length} tracks</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((track) => (
            <motion.div
              key={track.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={`/tracks/${track.id}`}
                className="block rounded-xl border border-border bg-card p-6 transition-all hover:bg-card-hover hover:border-accent/20 h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-heading text-lg font-bold leading-tight">{track.name}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase flex-shrink-0 ml-2 ${typeColors[track.type] || ''}`}>
                    {track.type}
                  </span>
                </div>
                <p className="text-sm text-text-muted">{track.location_city}, {track.location_state}</p>
                {track.difficulty && (
                  <span className={`mt-3 inline-block rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold uppercase ${difficultyColors[track.difficulty] || 'text-text-muted'}`}>
                    {track.difficulty}
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-text-muted py-12">No tracks found.</p>
      )}
    </div>
  )
}
