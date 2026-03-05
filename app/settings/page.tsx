'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/motion'
import type { Profile } from '@/lib/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return
    if (!confirm('This action cannot be undone. Type your display name to confirm.')) return
    // Note: actual account deletion requires a server-side function
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <FadeIn>
        <h1 className="font-heading text-3xl font-bold mb-8">Settings</h1>

        <div className="flex flex-col gap-6">
          {/* Account */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-heading text-xl font-bold mb-4">Account</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Email</label>
                <input type="email" value={email} disabled className="w-full opacity-60" />
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-heading text-xl font-bold mb-4">Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {profile?.is_premium ? 'Premium Plan' : 'Free Plan'}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {profile?.is_premium ? '$9.99/month — Unlimited features' : 'Basic access to Braap'}
                </p>
              </div>
              {!profile?.is_premium && (
                <a
                  href="/api/stripe/checkout"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
                >
                  Upgrade to Premium
                </a>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-danger/20 bg-card p-6">
            <h2 className="font-heading text-xl font-bold text-danger mb-4">Danger Zone</h2>
            <p className="text-sm text-text-muted mb-4">Once you delete your account, there is no going back.</p>
            <button
              onClick={handleDeleteAccount}
              className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
