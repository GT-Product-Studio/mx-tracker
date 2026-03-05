'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/motion'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/profile/edit')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <FadeIn>
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
          <h1 className="font-heading text-3xl font-bold text-text mb-2">Create Account</h1>
          <p className="text-text-muted text-sm mb-8">Join the Braap community</p>

          {error && (
            <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="FastRider42"
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@example.com"
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-accent py-3 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </FadeIn>
    </div>
  )
}
