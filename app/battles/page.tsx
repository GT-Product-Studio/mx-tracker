'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { formatLapTime, timeAgo } from '@/lib/utils'
import { FadeInView, ScaleIn } from '@/components/motion'
import type { User } from '@supabase/supabase-js'

type BattleRow = {
  id: string
  challenger_id: string
  defender_id: string | null
  venue_id: string
  bike_class: string
  battle_type: string
  status: string
  expires_at: string
  created_at: string
  challenger: { display_name: string } | null
  defender: { display_name: string } | null
  venues: { name: string } | null
}

const BIKE_CLASSES = ['85', '125', '250f', '450f', 'vet', 'open'] as const
const BATTLE_TYPES = [
  { value: 'best_of_3', label: 'Best of 3' },
  { value: 'full_moto', label: 'Full Moto' },
  { value: 'holeshot', label: 'Holeshot' },
  { value: 'consistency', label: 'Consistency' },
] as const

export default function BattlesPage() {
  const [battles, setBattles] = useState<BattleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [venues, setVenues] = useState<{ id: string; name: string; location_state: string }[]>([])
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([])

  // Create form state
  const [venueId, setVenueId] = useState('')
  const [bikeClass, setBikeClass] = useState<string>('450f')
  const [battleType, setBattleType] = useState<string>('best_of_3')
  const [opponentSearch, setOpponentSearch] = useState('')
  const [opponentId, setOpponentId] = useState<string | null>(null)
  const [expiry, setExpiry] = useState('24h')
  const [creating, setCreating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const [{ data: battlesData }, { data: venuesData }] = await Promise.all([
        supabase
          .from('battles')
          .select('*, challenger:profiles!battles_challenger_id_fkey(display_name), defender:profiles!battles_defender_id_fkey(display_name), venues(name)')
          .in('status', ['pending', 'active', 'completed'])
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('venues')
          .select('id, name, location_state')
          .eq('approved', true)
          .order('name'),
      ])

      if (battlesData) setBattles(battlesData as BattleRow[])
      if (venuesData) setVenues(venuesData)
      setLoading(false)
    }
    load()
  }, [])

  // Search for opponents
  useEffect(() => {
    if (opponentSearch.length < 2) { setProfiles([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name')
        .ilike('display_name', `%${opponentSearch}%`)
        .neq('id', user?.id || '')
        .limit(5)
      if (data) setProfiles(data)
    }, 300)
    return () => clearTimeout(timer)
  }, [opponentSearch])

  const handleCreate = async () => {
    if (!user || !venueId) return
    setCreating(true)

    const expiryHours = expiry === '24h' ? 24 : expiry === '48h' ? 48 : 168
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('battles')
      .insert({
        challenger_id: user.id,
        defender_id: opponentId,
        venue_id: venueId,
        bike_class: bikeClass,
        battle_type: battleType,
        status: opponentId ? 'pending' : 'pending',
        expires_at: expiresAt,
      })
      .select('*, challenger:profiles!battles_challenger_id_fkey(display_name), defender:profiles!battles_defender_id_fkey(display_name), venues(name)')
      .single()

    if (data) {
      setBattles((prev) => [data as BattleRow, ...prev])
      setShowCreate(false)
      setVenueId('')
      setOpponentId(null)
      setOpponentSearch('')
    }
    setCreating(false)
  }

  const handleAccept = async (battleId: string) => {
    if (!user) return
    await supabase
      .from('battles')
      .update({ defender_id: user.id, status: 'active' })
      .eq('id', battleId)

    setBattles((prev) =>
      prev.map((b) =>
        b.id === battleId ? { ...b, defender_id: user.id, status: 'active', defender: { display_name: 'You' } } : b
      )
    )
  }

  const activeBattles = battles.filter((b) => b.status === 'active')
  const pendingBattles = battles.filter((b) => b.status === 'pending')
  const completedBattles = battles.filter((b) => b.status === 'completed')

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>

  return (
    <div>
      {/* Hero banner */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src="/images/deegan/deegan-sx-15.jpg"
          alt="Motocross battle"
          fill
          priority
          quality={100}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />
        <div className="relative z-10 flex h-full items-end pb-8 px-4">
          <div className="mx-auto w-full max-w-5xl flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-1">1v1 Competition</p>
              <h1 className="font-heading text-4xl font-bold">Track Battles</h1>
              <p className="text-text-muted text-sm mt-1">Challenge anyone. Prove you&apos;re faster.</p>
            </div>
            {user && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
              >
                {showCreate ? 'Cancel' : 'Challenge Someone'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Create Battle Form */}
        {showCreate && user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-accent/30 bg-card p-6 mb-8"
          >
            <h2 className="font-heading text-xl font-bold mb-6">Create a Battle</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Venue */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Venue</label>
                <select
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text"
                >
                  <option value="">Select a venue...</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} — {v.location_state}</option>
                  ))}
                </select>
              </div>

              {/* Bike Class */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Bike Class</label>
                <div className="flex gap-2 flex-wrap">
                  {BIKE_CLASSES.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setBikeClass(cls)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        bikeClass === cls ? 'bg-accent text-black' : 'bg-bg text-text-muted border border-border hover:text-text'
                      }`}
                    >
                      {cls.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Battle Type */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Battle Type</label>
                <div className="flex gap-2 flex-wrap">
                  {BATTLE_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      onClick={() => setBattleType(bt.value)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        battleType === bt.value ? 'bg-accent text-black' : 'bg-bg text-text-muted border border-border hover:text-text'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Expires In</label>
                <div className="flex gap-2">
                  {['24h', '48h', '1 week'].map((e) => (
                    <button
                      key={e}
                      onClick={() => setExpiry(e)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        expiry === e ? 'bg-accent text-black' : 'bg-bg text-text-muted border border-border hover:text-text'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opponent Search */}
              <div className="sm:col-span-2">
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                  Opponent (leave empty for open challenge)
                </label>
                <input
                  type="text"
                  value={opponentSearch}
                  onChange={(e) => { setOpponentSearch(e.target.value); setOpponentId(null) }}
                  placeholder="Search by username..."
                  className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-text-muted/50"
                />
                {profiles.length > 0 && !opponentId && (
                  <div className="mt-2 rounded-lg border border-border bg-bg overflow-hidden">
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setOpponentId(p.id); setOpponentSearch(p.display_name); setProfiles([]) }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-card-hover transition-colors"
                      >
                        {p.display_name}
                      </button>
                    ))}
                  </div>
                )}
                {opponentId && (
                  <p className="mt-1 text-xs text-accent">Challenging: {opponentSearch}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating || !venueId}
              className="mt-6 w-full rounded-lg bg-accent py-3 text-sm font-bold text-black hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : opponentId ? 'Send Challenge' : 'Create Open Challenge'}
            </button>
          </motion.div>
        )}

        {!user && (
          <div className="rounded-xl border border-accent/20 bg-card p-8 text-center mb-8">
            <p className="font-heading text-xl font-bold mb-2">Sign in to battle</p>
            <p className="text-text-muted text-sm mb-4">Create an account to challenge riders and compete.</p>
            <Link href="/signup" className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-bold text-black hover:bg-accent-hover transition-colors">
              Get Started
            </Link>
          </div>
        )}

        {/* Active Battles */}
        {activeBattles.length > 0 && (
          <div className="mb-10">
            <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Active Battles
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {activeBattles.map((battle) => (
                <BattleCard key={battle.id} battle={battle} />
              ))}
            </div>
          </div>
        )}

        {/* Open Challenges */}
        {pendingBattles.length > 0 && (
          <div className="mb-10">
            <h2 className="font-heading text-xl font-bold mb-4">Open Challenges</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pendingBattles.map((battle) => (
                <div key={battle.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-heading font-bold">{battle.challenger?.display_name}</p>
                      <p className="text-xs text-text-muted">{battle.venues?.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-accent uppercase">{battle.bike_class}</span>
                      <p className="text-[10px] text-text-muted">{battle.battle_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-xs text-text-muted">
                      {battle.defender ? `vs ${battle.defender.display_name}` : 'Open to anyone'}
                    </span>
                    {user && !battle.defender_id && battle.challenger_id !== user.id ? (
                      <button
                        onClick={() => handleAccept(battle.id)}
                        className="rounded-lg bg-accent px-4 py-1.5 text-xs font-bold text-black hover:bg-accent-hover transition-colors"
                      >
                        Accept
                      </button>
                    ) : (
                      <Link
                        href={`/battles/${battle.id}`}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Battles */}
        {completedBattles.length > 0 && (
          <div>
            <h2 className="font-heading text-xl font-bold mb-4">Recent Results</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {completedBattles.map((battle) => (
                <BattleCard key={battle.id} battle={battle} />
              ))}
            </div>
          </div>
        )}

        {battles.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="font-heading text-2xl font-bold mb-2">No battles yet</p>
            <p className="text-text-muted">Be the first to throw down a challenge!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function BattleCard({ battle }: { battle: BattleRow }) {
  return (
    <Link
      href={`/battles/${battle.id}`}
      className="group rounded-xl border border-border bg-card p-5 hover:bg-card-hover hover:border-accent/20 transition-colors block"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center font-heading font-bold text-accent text-sm">
            {battle.challenger?.display_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-heading font-bold text-sm group-hover:text-accent transition-colors">
              {battle.challenger?.display_name}
            </p>
          </div>
        </div>
        <span className="font-heading text-xs font-bold text-accent">VS</span>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-heading font-bold text-sm">
              {battle.defender?.display_name || 'Open'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-card-hover flex items-center justify-center font-heading font-bold text-text-muted text-sm">
            {battle.defender?.display_name?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 pt-3 flex items-center justify-between text-xs text-text-muted">
        <span>{battle.venues?.name}</span>
        <div className="flex items-center gap-3">
          <span className="uppercase font-medium">{battle.bike_class}</span>
          <span className={`font-bold ${battle.status === 'active' ? 'text-accent' : battle.status === 'completed' ? 'text-gold' : 'text-text-muted'}`}>
            {battle.status}
          </span>
        </div>
      </div>
    </Link>
  )
}
