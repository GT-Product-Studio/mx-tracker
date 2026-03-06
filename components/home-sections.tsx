'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FadeInView, SlideInLeft, ScaleIn } from '@/components/motion'
import { formatLapTime, getRankColor } from '@/lib/utils'

const HERO_REELS = [
  { src: '/images/deegan/deegan-hero.mp4', poster: '/images/deegan/deegan-hero-poster.jpg' },
  { src: '/images/deegan/deegan-section.mp4', poster: '/images/deegan/deegan-section-poster.jpg' },
  { src: '/images/deegan/deegan-reel3.mp4', poster: '/images/deegan/deegan-reel3-poster.jpg' },
]

/* ---------- Hero Reel Carousel ---------- */
function HeroReelCarousel({ className, tall }: { className?: string; tall: boolean }) {
  const [idx, setIdx] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Swap src and play when idx changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.src = HERO_REELS[idx].src
    video.poster = HERO_REELS[idx].poster
    video.load()
    video.play().catch(() => {})
  }, [idx])

  // Listen for ended to advance
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const next = () => setIdx((prev) => (prev + 1) % HERO_REELS.length)
    video.addEventListener('ended', next)
    return () => video.removeEventListener('ended', next)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <div
        className={`relative ${tall ? 'h-[85vh] max-h-[800px]' : 'w-full max-w-[280px] mx-auto'} aspect-[9/16] rounded-2xl overflow-hidden ring-1 ring-white/10`}
        style={{ boxShadow: '0 0 80px rgba(0, 210, 106, 0.15), 0 25px 50px rgba(0, 0, 0, 0.5)' }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          poster={HERO_REELS[0].poster}
          src={HERO_REELS[0].src}
          className="h-full w-full object-cover"
        />
        {/* Subtle gradient at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg/60 to-transparent z-10" />
        {/* Reel indicator dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {HERO_REELS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-accent w-6' : 'bg-white/30'}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ---------- Hero ---------- */
export function Hero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative -mt-16 overflow-hidden bg-bg">
      {/* Animated background layers */}

      {/* Diagonal speed lines — looping CSS animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent"
            style={{
              top: `${12 + i * 12}%`,
              left: '-100%',
              width: `${30 + Math.random() * 40}%`,
              transform: 'rotate(-15deg)',
            }}
            animate={{ x: ['0%', '350%'] }}
            transition={{
              duration: 4 + i * 0.8,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.6,
            }}
          />
        ))}
      </div>

      {/* Floating dirt particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`dust-${i}`}
            className="absolute rounded-full"
            style={{
              width: 1.5 + Math.random() * 3,
              height: 1.5 + Math.random() * 3,
              background: i % 3 === 0 ? 'rgba(0, 210, 106, 0.4)' : 'rgba(255, 255, 255, 0.15)',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30 - Math.random() * 60, 0],
              x: [0, 10 + Math.random() * 30, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Radial green glow behind video area */}
      <div
        className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none hidden lg:block"
        style={{
          background: 'radial-gradient(circle, rgba(0, 210, 106, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Subtle bottom-left glow */}
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0, 210, 106, 0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col lg:grid lg:h-screen lg:max-h-[900px] lg:min-h-[650px] lg:grid-cols-2 lg:items-center gap-0 px-6 pt-20 pb-12 lg:pb-0 lg:px-8">
        {/* Mobile header — Haiden Deegan name */}
        <div className="lg:hidden mb-4">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs font-bold uppercase tracking-[0.3em] text-accent"
          >
            Haiden Deegan
          </motion.p>
        </div>

        {/* Mobile — rotating reels above text */}
        <div className="lg:hidden flex justify-center mb-8">
          <HeroReelCarousel className="flex justify-center" tall={false} />
        </div>

        {/* Left — Text + Logo */}
        <div className="flex flex-col justify-center">
          {/* Logo with scale-in */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/braap-logo-v2.svg" alt="Braap" className="h-16 w-auto mb-6" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-tight text-white"
          >
            The Scoreboard<br />
            <motion.span
              className="text-accent inline-block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
            >
              for Motocross.
            </motion.span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            className="mt-4 max-w-md text-base text-white/50 sm:text-lg"
          >
            Built with 2x AMA Champion Haiden Deegan. Challenge riders, climb leaderboards, and chase pro times at every track.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
            className="mt-8 flex gap-4"
          >
            {isLoggedIn ? (
              <Link
                href="/battles"
                className="group relative rounded-lg bg-accent px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5"
              >
                Start a Battle
              </Link>
            ) : (
              <Link
                href="/signup"
                className="group relative rounded-lg bg-accent px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5"
              >
                Join the Competition
              </Link>
            )}
            <Link
              href="/leaderboard"
              className="rounded-lg border border-white/20 px-8 py-3.5 text-sm font-medium text-white transition-all hover:border-accent/50 hover:text-accent hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-0.5"
            >
              Chase the Pros
            </Link>
          </motion.div>

          {/* Social proof / stats strip — staggered count-up feel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 flex gap-8 text-white/40 text-sm"
          >
            {[
              { val: '648', label: 'Tracks', color: 'text-white' },
              { val: '250+', label: 'Riders', color: 'text-white' },
              { val: 'Free', label: 'to Start', color: 'text-accent' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
              >
                <span className={`${stat.color} font-bold text-lg`}>{stat.val}</span> {stat.label}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right — Rotating reels */}
        <HeroReelCarousel className="hidden lg:flex justify-end items-center" tall />
      </div>
    </section>
  )
}

/* ---------- How It Works ---------- */
export function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Find a Track',
      desc: 'Browse 648+ tracks across the US. Check conditions, see who\'s riding.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Log Your Time',
      desc: 'Record your lap time, add photo proof, track your progress over time.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Challenge Anyone',
      desc: 'Pick a rider, pick a track, battle 1v1. Winner takes bragging rights.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>
      ),
    },
  ]

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <FadeInView>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">How it works</p>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">Three steps to the leaderboard</h2>
        </FadeInView>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <ScaleIn key={step.num} delay={i * 0.1}>
              <div className="rounded-xl border border-border bg-card p-8 hover:border-accent/20 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    {step.icon}
                  </div>
                  <span className="font-mono text-sm text-text-muted">{step.num}</span>
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
              </div>
            </ScaleIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Live Battles ---------- */
type BattlePreview = {
  id: string
  challenger?: { display_name: string } | null
  defender?: { display_name: string } | null
  venues?: { name: string } | null
  bike_class: string
  battle_type: string
  status: string
}

export function LiveBattles({ battles }: { battles: BattlePreview[] }) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <FadeInView>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">
                Live Battles
              </p>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">
                Riders competing right now
              </h2>
            </div>
            <Link href="/battles" className="text-sm text-text-muted hover:text-accent transition-colors hidden sm:block">
              All battles →
            </Link>
          </div>
        </FadeInView>

        {battles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {battles.map((battle, i) => (
              <ScaleIn key={battle.id} delay={i * 0.08}>
                <Link
                  href={`/battles/${battle.id}`}
                  className="group block rounded-xl border border-accent/20 bg-card p-6 hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                      {battle.status === 'active' ? 'Live' : 'Open Challenge'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-heading text-lg font-bold">{battle.challenger?.display_name || 'Unknown'}</span>
                    <span className="text-xs font-bold text-accent">VS</span>
                    <span className="font-heading text-lg font-bold">
                      {battle.defender?.display_name || '???'}
                    </span>
                  </div>
                  <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                    <span className="text-xs text-text-muted">{battle.venues?.name}</span>
                    <span className="text-xs font-medium text-text-muted uppercase">{battle.bike_class}</span>
                  </div>
                </Link>
              </ScaleIn>
            ))}
          </div>
        ) : (
          <FadeInView>
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="font-heading text-2xl font-bold mb-2">No active battles yet</p>
              <p className="text-text-muted mb-6">Be the first to throw down a challenge.</p>
              <Link
                href="/battles"
                className="inline-block rounded-lg bg-accent px-8 py-3 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
              >
                Start a Battle
              </Link>
            </div>
          </FadeInView>
        )}

        <Link href="/battles" className="mt-6 block text-sm text-text-muted hover:text-accent transition-colors sm:hidden">
          All battles →
        </Link>
      </div>
    </section>
  )
}

/* ---------- Chase the Pros ---------- */
type ProTimePreview = {
  id: string
  rider_name: string
  lap_time_ms: number
  bike_class: string
  event_name: string | null
  venues?: { name: string } | null
}

export function ChaseThePros({ proTimes }: { proTimes: ProTimePreview[] }) {
  if (!proTimes || proTimes.length === 0) return null

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <FadeInView>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold mb-2">
                Deegan&apos;s Fastest
              </p>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">
                Can you beat these times?
              </h2>
            </div>
            <Link href="/leaderboard" className="text-sm text-text-muted hover:text-accent transition-colors hidden sm:block">
              All Deegan times →
            </Link>
          </div>
        </FadeInView>

        <div className="rounded-xl border border-gold/20 bg-card overflow-hidden">
          {proTimes.slice(0, 5).map((pt, i) => (
            <div
              key={pt.id}
              className={`flex items-center justify-between p-4 ${i < proTimes.length - 1 && i < 4 ? 'border-b border-border/50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-text-muted w-6 text-center">{i + 1}</span>
                <div>
                  <p className="text-sm font-bold text-text">{pt.venues?.name}</p>
                  <p className="text-xs text-text-muted">{pt.event_name} · {pt.bike_class.toUpperCase()}</p>
                </div>
              </div>
              <span className="font-mono text-lg font-bold text-gold">{formatLapTime(pt.lap_time_ms)}</span>
            </div>
          ))}
        </div>

        <FadeInView delay={0.2}>
          <div className="mt-6 rounded-xl border border-accent/20 bg-card p-6 text-center">
            <p className="text-text-muted mb-1">You are</p>
            <p className="font-mono text-3xl font-bold text-accent">??:??.???</p>
            <p className="text-text-muted mt-1">off Deegan&apos;s pace</p>
            <Link href="/signup" className="mt-4 inline-block text-sm font-bold text-accent hover:underline">
              Log a lap to find out →
            </Link>
          </div>
        </FadeInView>
      </div>
    </section>
  )
}

/* ---------- Track Finder Preview ---------- */
type VenuePreview = {
  id: string
  name: string
  location_city: string | null
  location_state: string
  type: string
}

// Use real Deegan race photos as venue card backgrounds
const VENUE_PHOTOS = [
  '/images/deegan/deegan-sx-3.jpg',
  '/images/deegan/deegan-sx-12.jpg',
  '/images/deegan/deegan-sx-18.jpg',
  '/images/deegan/deegan-sx-25.jpg',
  '/images/deegan/deegan-sx-33.jpg',
  '/images/deegan/deegan-sx-40.jpg',
]

export function TrackFinderPreview({ venues }: { venues: VenuePreview[] }) {
  if (!venues || venues.length === 0) return null

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <FadeInView>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">Find Your Track</p>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">438+ venues nationwide</h2>
            </div>
            <Link href="/tracks" className="text-sm text-text-muted hover:text-accent transition-colors hidden sm:block">
              Browse all →
            </Link>
          </div>
        </FadeInView>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.slice(0, 6).map((venue, i) => (
            <ScaleIn key={venue.id} delay={i * 0.06}>
              <Link
                href={`/venues/${venue.id}`}
                className="group relative block h-48 rounded-xl overflow-hidden"
              >
                <Image
                  src={VENUE_PHOTOS[i % VENUE_PHOTOS.length]}
                  alt={venue.name}
                  fill
                  quality={100}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="inline-block rounded-full bg-accent/20 border border-accent/30 px-2 py-0.5 text-[10px] font-bold text-accent uppercase mb-2">
                    {venue.type}
                  </span>
                  <h3 className="font-heading font-bold text-lg leading-tight">{venue.name}</h3>
                  <p className="text-xs text-white/60 mt-0.5">{venue.location_city}, {venue.location_state}</p>
                </div>
              </Link>
            </ScaleIn>
          ))}
        </div>

        <Link href="/tracks" className="mt-6 block text-sm text-text-muted hover:text-accent transition-colors sm:hidden">
          Browse all venues →
        </Link>
      </div>
    </section>
  )
}

/* ---------- Ranking / XP System ---------- */
const RANKS = [
  { tier: 'Bronze', emoji: '🟤', range: '0–5 wins', xp: '0–500 XP', color: '#CD7F32', desc: 'Just getting started' },
  { tier: 'Silver', emoji: '⚪', range: '6–15 wins', xp: '500–1,500 XP', color: '#C0C0C0', desc: 'Proven competitor' },
  { tier: 'Gold', emoji: '🟡', range: '16–30 wins', xp: '1,500–3,000 XP', color: '#FFD700', desc: 'Track regular' },
  { tier: 'Diamond', emoji: '💎', range: '31–50 wins', xp: '3,000–5,000 XP', color: '#B9F2FF', desc: 'Elite rider' },
  { tier: 'Pro', emoji: '🏆', range: '50+ wins', xp: '5,000+ XP', color: '#00D26A', desc: 'Legend status' },
]

const XP_ACTIONS = [
  { action: 'Win a battle', xp: '+100 XP' },
  { action: 'Log a lap time', xp: '+25 XP' },
  { action: 'Check in at a venue', xp: '+15 XP' },
  { action: 'Complete a challenge', xp: '+50 XP' },
  { action: 'Visit a new track', xp: '+30 XP' },
]

export function RankingSystem() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <FadeInView>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">Braap Score</p>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">Earn XP. Rank up. Get recognized.</h2>
          <p className="mt-3 text-text-muted max-w-lg">
            Every ride, every battle, every check-in earns XP toward your Braap Score. Climb through five ranks from Bronze to Pro.
          </p>
        </FadeInView>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Rank tiers */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-text-muted">Rank Tiers</h3>
            </div>
            {RANKS.map((rank, i) => (
              <motion.div
                key={rank.tier}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center justify-between px-4 py-4 ${i < RANKS.length - 1 ? 'border-b border-border/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center">{rank.emoji}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: rank.color }}>{rank.tier}</p>
                    <p className="text-[10px] text-text-muted">{rank.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-text">{rank.xp}</p>
                  <p className="text-[10px] text-text-muted">{rank.range}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* How to earn XP */}
          <div>
            <div className="rounded-xl border border-accent/20 bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-accent/10">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-accent">How to Earn XP</h3>
              </div>
              {XP_ACTIONS.map((item, i) => (
                <motion.div
                  key={item.action}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-center justify-between px-4 py-4 ${i < XP_ACTIONS.length - 1 ? 'border-b border-border/30' : ''}`}
                >
                  <span className="text-sm text-text">{item.action}</span>
                  <span className="font-mono text-sm font-bold text-accent">{item.xp}</span>
                </motion.div>
              ))}
            </div>

            {/* Progress preview */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold">Your Braap Score</span>
                <span className="text-sm text-text-muted">🟤 Bronze</span>
              </div>
              <div className="h-3 rounded-full bg-border overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent/50 to-accent w-[15%]" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-text-muted">0 XP</span>
                <span className="text-[10px] text-text-muted">500 XP to Silver ⚪</span>
              </div>
              <Link
                href="/signup"
                className="mt-4 block text-center rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
              >
                Start Earning XP
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Powered by Haiden Deegan ---------- */
export function DangerBoySection() {
  const stats = [
    { value: '2x', label: 'AMA Pro MX 250 Champion' },
    { value: '2x', label: 'SMX 250 Champion' },
    { value: '1x', label: '250SX West Champion' },
  ]

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Mobile background — Haiden portrait faded behind text */}
      <div className="absolute inset-0 lg:hidden pointer-events-none">
        <Image
          src="/images/deegan/deegan-portrait.jpg"
          alt=""
          fill
          quality={100}
          className="object-cover object-top opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      </div>

      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0, 210, 106, 0.04) 0%, transparent 70%)', filter: 'blur(80px)' }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 lg:gap-16">
          {/* Left — text content */}
          <div className="flex-1 min-w-0">
            <FadeInView>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-3">
                Powered by
              </p>
              <h2 className="font-heading text-6xl font-bold leading-[0.85] sm:text-7xl lg:text-8xl tracking-tight">
                Haiden<br />
                <span className="text-accent">Deegan</span>
              </h2>
              <p className="mt-4 text-white/30 text-sm font-medium tracking-wide">
                <a href="https://instagram.com/dangerboydeegan" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                  @dangerboydeegan
                </a>
                {' · '}2M followers{' · '}Monster Energy Yamaha Star Racing
              </p>
            </FadeInView>

            {/* Stats row */}
            <div className="mt-14 flex flex-wrap gap-x-12 gap-y-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <span className="font-heading text-5xl sm:text-6xl font-bold text-gold">{stat.value}</span>
                  <span className="text-sm text-white/50 leading-tight max-w-[140px]">{stat.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Description + CTAs */}
            <SlideInLeft>
              <p className="mt-12 max-w-lg text-lg text-white/50 leading-relaxed">
                Haiden isn&apos;t just an ambassador — he sets the times you compete against.
                Beat his pace, climb the leaderboard, earn bragging rights. The fastest 250 rider on the planet is waiting.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/challenges"
                  className="rounded-lg bg-accent px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5"
                >
                  Chase Deegan
                </Link>
                <Link
                  href="/leaderboard"
                  className="rounded-lg border border-white/15 px-8 py-3.5 text-sm font-medium text-white/70 transition-all hover:border-accent/40 hover:text-accent"
                >
                  View Leaderboard
                </Link>
              </div>
            </SlideInLeft>
          </div>

          {/* Right — Haiden portrait (skinny, like hero reels) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="hidden lg:block flex-shrink-0 lg:w-[320px]"
          >
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden ring-1 ring-white/10"
              style={{ boxShadow: '0 0 60px rgba(0, 210, 106, 0.1), 0 20px 40px rgba(0,0,0,0.4)' }}
            >
              <Image
                src="/images/deegan/deegan-portrait.jpg"
                alt="Haiden Deegan"
                fill
                quality={100}
                className="object-cover object-top"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Bottom CTA ---------- */
export function BottomCTA() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0">
        <Image
          src="/images/deegan/deegan-sx-40.jpg"
          alt="Supercross action"
          fill
          quality={100}
          className="object-cover opacity-20"
        />
      </div>
      <FadeInView>
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center">
          <h2 className="font-heading text-4xl font-bold sm:text-5xl">Join the competition</h2>
          <p className="mx-auto mt-4 max-w-md text-text-muted">
            Create your free account, log your times, challenge riders, and see where you stand against the pros.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-accent px-10 py-4 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </FadeInView>
    </section>
  )
}
