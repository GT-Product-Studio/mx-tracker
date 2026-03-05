'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/motion'
import type { Profile } from '@/lib/types'

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name,
        location: profile.location,
        bike_make: profile.bike_make,
        bike_model: profile.bike_model,
        bike_year: profile.bike_year,
        riding_level: profile.riding_level,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      setMessage('Error saving profile')
    } else {
      setMessage('Profile saved!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>
  if (!profile) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <FadeIn>
        <h1 className="font-heading text-3xl font-bold mb-8">Edit Profile</h1>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Display Name</label>
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Location</label>
              <input
                type="text"
                value={profile.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value || null })}
                placeholder="San Diego, CA"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Riding Level</label>
              <select
                value={profile.riding_level || ''}
                onChange={(e) => setProfile({ ...profile, riding_level: (e.target.value || null) as Profile['riding_level'] })}
                className="w-full"
              >
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
            <h2 className="font-heading text-xl font-bold">Bike Info</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Make</label>
                <input
                  type="text"
                  value={profile.bike_make || ''}
                  onChange={(e) => setProfile({ ...profile, bike_make: e.target.value || null })}
                  placeholder="Honda"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Model</label>
                <input
                  type="text"
                  value={profile.bike_model || ''}
                  onChange={(e) => setProfile({ ...profile, bike_model: e.target.value || null })}
                  placeholder="CRF450R"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Year</label>
                <input
                  type="number"
                  value={profile.bike_year || ''}
                  onChange={(e) => setProfile({ ...profile, bike_year: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="2024"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            {message && <span className="text-sm text-accent">{message}</span>}
          </div>
        </form>
      </FadeIn>
    </div>
  )
}
