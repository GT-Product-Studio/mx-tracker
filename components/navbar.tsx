'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const navLinks = [
  { href: '/tracks', label: 'Tracks' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/challenges', label: 'Challenges' },
]

const authLinks = [
  { href: '/laps', label: 'My Laps' },
  { href: '/laps/new', label: 'Log Lap' },
  { href: '/upload', label: 'Upload' },
  { href: '/record', label: 'Record' },
]

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-accent">
          MX TRACKER
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-accent' : 'text-text-muted hover:text-text'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && authLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-accent' : 'text-text-muted hover:text-text'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href={`/profile/edit`}
                className="text-sm font-medium text-text-muted hover:text-text transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-lg bg-card px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-6 bg-text transition-transform ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 bg-text transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-text transition-transform ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="border-t border-border bg-bg px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm font-medium ${pathname === link.href ? 'text-accent' : 'text-text-muted'}`}
              >
                {link.label}
              </Link>
            ))}
            {user && authLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm font-medium ${pathname === link.href ? 'text-accent' : 'text-text-muted'}`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/profile/edit" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-text-muted">Profile</Link>
                <button onClick={handleSignOut} className="text-left text-sm font-medium text-text-muted">Sign Out</button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm font-bold text-accent">Sign In</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
