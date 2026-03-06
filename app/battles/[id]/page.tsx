'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase'
import { formatLapTime, timeAgo } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { PhotoUpload } from '@/components/photo-upload'

type BattleDetail = {
  id: string
  challenger_id: string
  defender_id: string | null
  venue_id: string
  bike_class: string
  battle_type: string
  status: string
  winner_id: string | null
  expires_at: string
  created_at: string
  challenger: { display_name: string } | null
  defender: { display_name: string } | null
  winner: { display_name: string } | null
  venues: { name: string } | null
}

type EntryRow = {
  id: string
  battle_id: string
  user_id: string
  lap_time_ms: number
  photo_proof_url: string | null
  verified: boolean
  notes: string | null
  created_at: string
  profiles: { display_name: string } | null
}

export default function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [battle, setBattle] = useState<BattleDetail | null>(null)
  const [entries, setEntries] = useState<EntryRow[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Submit form
  const [showSubmit, setShowSubmit] = useState(false)
  const [lapMinutes, setLapMinutes] = useState('')
  const [lapSeconds, setLapSeconds] = useState('')
  const [lapMs, setLapMs] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const [{ data: battleData }, { data: entriesData }] = await Promise.all([
        supabase
          .from('battles')
          .select('*, challenger:profiles!battles_challenger_id_fkey(display_name), defender:profiles!battles_defender_id_fkey(display_name), winner:profiles!battles_winner_id_fkey(display_name), venues(name)')
          .eq('id', id)
          .single(),
        supabase
          .from('battle_entries')
          .select('*, profiles(display_name)')
          .eq('battle_id', id)
          .order('lap_time_ms', { ascending: true }),
      ])

      if (battleData) setBattle(battleData as BattleDetail)
      if (entriesData) setEntries(entriesData as EntryRow[])
      setLoading(false)
    }
    load()
  }, [id])

  const handleSubmitEntry = async () => {
    if (!user || !battle) return
    const timeMs = (parseInt(lapMinutes || '0') * 60000) + (parseInt(lapSeconds || '0') * 1000) + parseInt(lapMs || '0')
    if (timeMs <= 0) return
    setSubmitting(true)

    const { data, error } = await supabase
      .from('battle_entries')
      .insert({
        battle_id: battle.id,
        user_id: user.id,
        lap_time_ms: timeMs,
        photo_proof_url: photoUrl,
        notes: notes || null,
      })
      .select('*, profiles(display_name)')
      .single()

    if (data) {
      setEntries((prev) => [...prev, data as EntryRow].sort((a, b) => a.lap_time_ms - b.lap_time_ms))
      setShowSubmit(false)
      setLapMinutes('')
      setLapSeconds('')
      setLapMs('')
      setPhotoUrl(null)
      setNotes('')

      // Check if both riders have submitted — determine winner
      const allEntries = [...entries, data as EntryRow]
      const challengerEntry = allEntries.find((e) => e.user_id === battle.challenger_id)
      const defenderEntry = allEntries.find((e) => e.user_id === battle.defender_id)

      if (challengerEntry && defenderEntry) {
        const diff = Math.abs(challengerEntry.lap_time_ms - defenderEntry.lap_time_ms)
        let winnerId: string | null = null
        let newStatus = 'completed'

        if (diff > 3000) {
          winnerId = challengerEntry.lap_time_ms < defenderEntry.lap_time_ms
            ? battle.challenger_id
            : battle.defender_id!
        }
        // If diff <= 3000, it's a draw (winner_id stays null)

        await supabase
          .from('battles')
          .update({ status: newStatus, winner_id: winnerId })
          .eq('id', battle.id)

        setBattle((prev) => prev ? { ...prev, status: newStatus, winner_id: winnerId } : prev)
      }
    }
    setSubmitting(false)
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>
  if (!battle) return <div className="flex min-h-screen items-center justify-center text-text-muted">Battle not found</div>

  const isParticipant = user && (user.id === battle.challenger_id || user.id === battle.defender_id)
  const hasSubmitted = entries.some((e) => e.user_id === user?.id)
  const challengerEntry = entries.find((e) => e.user_id === battle.challenger_id)
  const defenderEntry = entries.find((e) => e.user_id === battle.defender_id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/battles" className="text-sm text-text-muted hover:text-accent transition-colors mb-6 inline-block">
        ← All Battles
      </Link>

      {/* Battle Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-8 mb-6"
      >
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {battle.status === 'active' && <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />}
            <span className={`text-xs font-bold uppercase tracking-wider ${
              battle.status === 'active' ? 'text-accent' :
              battle.status === 'completed' ? 'text-gold' :
              'text-text-muted'
            }`}>
              {battle.status === 'completed' && battle.winner_id ? 'Winner Decided' :
               battle.status === 'completed' ? 'Too Close to Call — Draw!' :
               battle.status}
            </span>
          </div>
          <span className="text-xs text-text-muted">{battle.venues?.name}</span>
        </div>

        {/* VS Display */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center font-heading font-bold text-2xl ${
              battle.winner_id === battle.challenger_id ? 'bg-accent/20 text-accent ring-2 ring-accent' : 'bg-card-hover text-text'
            }`}>
              {battle.challenger?.display_name?.[0]?.toUpperCase() || '?'}
            </div>
            <p className="font-heading font-bold text-lg mt-2">{battle.challenger?.display_name}</p>
            {challengerEntry && (
              <p className="font-mono text-xl font-bold text-accent mt-1">{formatLapTime(challengerEntry.lap_time_ms)}</p>
            )}
            {battle.winner_id === battle.challenger_id && (
              <span className="inline-block mt-2 rounded-full bg-accent/20 px-3 py-0.5 text-xs font-bold text-accent">WINNER</span>
            )}
          </div>

          <div className="px-6">
            <span className="font-heading text-2xl font-bold text-accent">VS</span>
          </div>

          <div className="text-center flex-1">
            <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center font-heading font-bold text-2xl ${
              battle.winner_id === battle.defender_id ? 'bg-accent/20 text-accent ring-2 ring-accent' : 'bg-card-hover text-text-muted'
            }`}>
              {battle.defender?.display_name?.[0]?.toUpperCase() || '?'}
            </div>
            <p className="font-heading font-bold text-lg mt-2">{battle.defender?.display_name || 'Waiting...'}</p>
            {defenderEntry && (
              <p className="font-mono text-xl font-bold text-accent mt-1">{formatLapTime(defenderEntry.lap_time_ms)}</p>
            )}
            {battle.winner_id === battle.defender_id && (
              <span className="inline-block mt-2 rounded-full bg-accent/20 px-3 py-0.5 text-xs font-bold text-accent">WINNER</span>
            )}
          </div>
        </div>

        {/* Battle info */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
          <div className="text-center">
            <p className="text-xs text-text-muted uppercase">Class</p>
            <p className="font-heading font-bold text-sm uppercase">{battle.bike_class}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-muted uppercase">Type</p>
            <p className="font-heading font-bold text-sm">{battle.battle_type.replace('_', ' ')}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-muted uppercase">Expires</p>
            <p className="text-xs font-medium">{new Date(battle.expires_at).toLocaleDateString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Submit Entry */}
      {isParticipant && !hasSubmitted && battle.status !== 'completed' && battle.status !== 'expired' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {!showSubmit ? (
            <button
              onClick={() => setShowSubmit(true)}
              className="w-full rounded-xl border border-accent/30 bg-card p-6 text-center hover:bg-card-hover transition-colors"
            >
              <span className="font-heading text-xl font-bold text-accent">Submit Your Time</span>
              <p className="text-sm text-text-muted mt-1">Enter your lap time and upload photo proof</p>
            </button>
          ) : (
            <div className="rounded-xl border border-accent/30 bg-card p-6">
              <h3 className="font-heading text-lg font-bold mb-4">Submit Your Time</h3>
              <div className="flex gap-2 items-center mb-4">
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={lapMinutes}
                  onChange={(e) => setLapMinutes(e.target.value)}
                  placeholder="M"
                  className="w-16 rounded-lg border border-border bg-bg px-3 py-3 text-center font-mono text-lg text-text"
                />
                <span className="text-text-muted font-mono text-lg">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={lapSeconds}
                  onChange={(e) => setLapSeconds(e.target.value)}
                  placeholder="SS"
                  className="w-16 rounded-lg border border-border bg-bg px-3 py-3 text-center font-mono text-lg text-text"
                />
                <span className="text-text-muted font-mono text-lg">.</span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={lapMs}
                  onChange={(e) => setLapMs(e.target.value)}
                  placeholder="ms"
                  className="w-20 rounded-lg border border-border bg-bg px-3 py-3 text-center font-mono text-lg text-text"
                />
              </div>

              <PhotoUpload onUpload={(url) => setPhotoUrl(url)} />

              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full mt-4 rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-text-muted/50"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSubmitEntry}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold text-black hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Time'}
                </button>
                <button
                  onClick={() => setShowSubmit(false)}
                  className="rounded-lg border border-border px-4 py-3 text-sm text-text-muted hover:text-text transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* All Entries */}
      {entries.length > 0 && (
        <div className="mt-6">
          <h3 className="font-heading text-lg font-bold mb-4">Submissions</h3>
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                      {entry.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{entry.profiles?.display_name}</p>
                      <p className="text-xs text-text-muted">{timeAgo(entry.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg font-bold text-accent">{formatLapTime(entry.lap_time_ms)}</span>
                    {entry.verified && <span className="ml-2 text-xs text-accent">✓ verified</span>}
                  </div>
                </div>
                {entry.photo_proof_url && (
                  <div className="mt-3 relative h-40 rounded-lg overflow-hidden">
                    <Image
                      src={entry.photo_proof_url}
                      alt="Proof photo"
                      fill
                      quality={100}
                      className="object-cover"
                    />
                  </div>
                )}
                {entry.notes && <p className="mt-2 text-sm text-text-muted">{entry.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
