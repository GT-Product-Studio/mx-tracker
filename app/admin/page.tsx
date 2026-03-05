'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatLapTime } from '@/lib/utils'
import { FadeIn } from '@/components/motion'
import type { Track, Challenge } from '@/lib/types'

export default function AdminPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'tracks' | 'challenges'>('challenges')
  const router = useRouter()
  const supabase = createClient()

  // New track form
  const [newTrack, setNewTrack] = useState({ name: '', location_city: '', location_state: '', type: 'motocross', difficulty: 'intermediate', description: '' })

  // New challenge form
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', track_id: '', deegan_time_min: '', deegan_time_sec: '', deegan_time_ms: '', start_date: '', end_date: '' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: t }, { data: c }] = await Promise.all([
        supabase.from('tracks').select('*').order('name'),
        supabase.from('challenges').select('*, tracks(name)').order('created_at', { ascending: false }),
      ])
      if (t) setTracks(t)
      if (c) setChallenges(c)
      setLoading(false)
    }
    load()
  }, [])

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('tracks').insert(newTrack).select().single()
    if (data) {
      setTracks([...tracks, data])
      setNewTrack({ name: '', location_city: '', location_state: '', type: 'motocross', difficulty: 'intermediate', description: '' })
    }
    if (error) alert(error.message)
  }

  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    const timeMs = parseInt(newChallenge.deegan_time_min || '0') * 60000 + parseInt(newChallenge.deegan_time_sec || '0') * 1000 + parseInt(newChallenge.deegan_time_ms || '0')
    const { data, error } = await supabase.from('challenges').insert({
      title: newChallenge.title,
      description: newChallenge.description || null,
      track_id: newChallenge.track_id,
      deegan_time_ms: timeMs,
      start_date: newChallenge.start_date,
      end_date: newChallenge.end_date,
      is_active: true,
    }).select('*, tracks(name)').single()
    if (data) {
      setChallenges([data, ...challenges])
      setNewChallenge({ title: '', description: '', track_id: '', deegan_time_min: '', deegan_time_sec: '', deegan_time_ms: '', start_date: '', end_date: '' })
    }
    if (error) alert(error.message)
  }

  const toggleChallenge = async (id: string, isActive: boolean) => {
    await supabase.from('challenges').update({ is_active: !isActive }).eq('id', id)
    setChallenges(challenges.map((c) => c.id === id ? { ...c, is_active: !isActive } : c))
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <FadeIn>
        <h1 className="font-heading text-3xl font-bold mb-8">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['challenges', 'tracks'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-accent text-black' : 'bg-card text-text-muted hover:text-text border border-border'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Challenges Tab */}
        {tab === 'challenges' && (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-xl font-bold mb-4">Create Challenge</h2>
              <form onSubmit={handleAddChallenge} className="flex flex-col gap-4">
                <input type="text" value={newChallenge.title} onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })} placeholder="Challenge Title" required className="w-full" />
                <textarea value={newChallenge.description} onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })} placeholder="Description (optional)" rows={2} className="w-full" />
                <select value={newChallenge.track_id} onChange={(e) => setNewChallenge({ ...newChallenge, track_id: e.target.value })} required className="w-full">
                  <option value="">Select Track</option>
                  {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Danger Boy Target Time</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={newChallenge.deegan_time_min} onChange={(e) => setNewChallenge({ ...newChallenge, deegan_time_min: e.target.value })} placeholder="min" className="w-20 text-center font-mono" required />
                    <span className="text-text-muted font-bold">:</span>
                    <input type="number" value={newChallenge.deegan_time_sec} onChange={(e) => setNewChallenge({ ...newChallenge, deegan_time_sec: e.target.value })} placeholder="sec" className="w-20 text-center font-mono" required />
                    <span className="text-text-muted font-bold">.</span>
                    <input type="number" value={newChallenge.deegan_time_ms} onChange={(e) => setNewChallenge({ ...newChallenge, deegan_time_ms: e.target.value })} placeholder="ms" className="w-24 text-center font-mono" required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Start Date</label>
                    <input type="date" value={newChallenge.start_date} onChange={(e) => setNewChallenge({ ...newChallenge, start_date: e.target.value })} required className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">End Date</label>
                    <input type="date" value={newChallenge.end_date} onChange={(e) => setNewChallenge({ ...newChallenge, end_date: e.target.value })} required className="w-full" />
                  </div>
                </div>
                <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black hover:bg-accent-hover transition-colors self-start">Create Challenge</button>
              </form>
            </div>

            {/* Existing Challenges */}
            <div className="flex flex-col gap-3">
              {challenges.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.title}</p>
                    <p className="text-xs text-text-muted">{c.tracks?.name} &middot; {formatLapTime(c.deegan_time_ms)}</p>
                  </div>
                  <button
                    onClick={() => toggleChallenge(c.id, c.is_active)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium ${c.is_active ? 'bg-accent/10 text-accent' : 'bg-card text-text-muted border border-border'}`}
                  >
                    {c.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracks Tab */}
        {tab === 'tracks' && (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-xl font-bold mb-4">Add Track</h2>
              <form onSubmit={handleAddTrack} className="flex flex-col gap-4">
                <input type="text" value={newTrack.name} onChange={(e) => setNewTrack({ ...newTrack, name: e.target.value })} placeholder="Track Name" required className="w-full" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input type="text" value={newTrack.location_city} onChange={(e) => setNewTrack({ ...newTrack, location_city: e.target.value })} placeholder="City" required className="w-full" />
                  <input type="text" value={newTrack.location_state} onChange={(e) => setNewTrack({ ...newTrack, location_state: e.target.value })} placeholder="State" required className="w-full" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <select value={newTrack.type} onChange={(e) => setNewTrack({ ...newTrack, type: e.target.value })} className="w-full">
                    <option value="motocross">Motocross</option>
                    <option value="supercross">Supercross</option>
                    <option value="practice">Practice</option>
                  </select>
                  <select value={newTrack.difficulty} onChange={(e) => setNewTrack({ ...newTrack, difficulty: e.target.value })} className="w-full">
                    <option value="easy">Easy</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <textarea value={newTrack.description} onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })} placeholder="Description" rows={2} className="w-full" />
                <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black hover:bg-accent-hover transition-colors self-start">Add Track</button>
              </form>
            </div>

            <div className="flex flex-col gap-2">
              {tracks.map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between text-sm">
                  <span>{t.name} — {t.location_city}, {t.location_state}</span>
                  <span className="text-xs text-text-muted capitalize">{t.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </FadeIn>
    </div>
  )
}
