'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FadeInView, SlideInLeft, ScaleIn } from '@/components/motion'
import { formatLapTime, getRankColor } from '@/lib/utils'

/* ---------- Hero ---------- */
export function Hero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative -mt-16 h-screen min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Video background — Haiden Deegan whip + backflip reel */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/images/deegan/deegan-hero-poster.jpg"
        className="absolute inset-0 h-full w-full object-cover object-center"
      >
        <source src="/images/deegan/deegan-hero.mp4" type="video/mp4" />
      </video>
      {/* Fallback image for browsers that block autoplay */}
      <Image
        src="/images/deegan/deegan-hero-poster.jpg"
        alt="Haiden Deegan — Supercross action"
        fill
        priority
        quality={100}
        className="object-cover object-center -z-10"
      />
      {/* Dark gradient overlay — heavier at bottom for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />

      <div className="relative z-10 flex h-full flex-col justify-end pb-20 px-4">
        <div className="mx-auto w-full max-w-7xl">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="font-heading text-[clamp(4rem,12vw,10rem)] font-bold leading-[0.85] tracking-tighter text-white"
          >
            BRAAP
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="mt-4 max-w-lg text-lg text-white/70 sm:text-xl"
          >
            Track your rides. Chase the leaderboard.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
            className="mt-8 flex gap-4"
          >
            {isLoggedIn ? (
              <Link
                href="/laps/new"
                className="rounded-lg bg-accent px-8 py-3.5 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
              >
                Log a Lap
              </Link>
            ) : (
              <Link
                href="/signup"
                className="rounded-lg bg-accent px-8 py-3.5 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
              >
                Get Started
              </Link>
            )}
            <Link
              href="/challenges"
              className="rounded-lg border border-white/20 px-8 py-3.5 text-sm font-medium text-white hover:border-white/40 transition-colors"
            >
              Danger Boy Challenges
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Powered by Danger Boy ---------- */
export function DangerBoySection() {
  const stats = [
    { value: '2x', label: 'AMA Pro MX 250 Champion' },
    { value: '2x', label: 'SMX 250 Champion' },
    { value: '1x', label: '250SX West Champion' },
  ]

  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Text content */}
          <SlideInLeft>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-4">
                Powered by Danger Boy
              </p>
              <h2 className="font-heading text-4xl font-bold leading-tight sm:text-5xl">
                Built with the fastest 250 rider on the planet.
              </h2>
              <p className="mt-6 text-text-muted leading-relaxed max-w-lg">
                Haiden Deegan isn&apos;t just an ambassador — he sets the challenges you compete against.
                Every target time comes straight from Danger Boy. Beat his time, earn bragging rights.
              </p>

              <div className="mt-10 flex flex-col gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-baseline gap-3">
                    <span className="font-heading text-3xl font-bold text-gold">{stat.value}</span>
                    <span className="text-sm text-text-muted">{stat.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-4">
                <Link
                  href="/challenges"
                  className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
                >
                  Take on a Challenge
                </Link>
                <a
                  href="https://instagram.com/dangerboydeegan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted hover:text-accent transition-colors"
                >
                  @dangerboydeegan
                </a>
              </div>
            </div>
          </SlideInLeft>

          {/* Right: Image collage */}
          <FadeInView delay={0.15}>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                <Image
                  src="/images/deegan/deegan-sx-27.jpg"
                  alt="Haiden Deegan whip"
                  fill
                  quality={100}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-3">
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src="/images/deegan/deegan-sx-13.jpg"
                    alt="Haiden Deegan holeshot"
                    fill
                    quality={100}
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src="/images/deegan/deegan-1.jpg"
                    alt="Haiden Deegan"
                    fill
                    quality={100}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  )
}

/* ---------- Active Challenges ---------- */
type ChallengeData = {
  id: string
  title: string
  deegan_time_ms: number
  tracks?: { name: string } | null
}

export function ActiveChallenges({ challenges }: { challenges: ChallengeData[] }) {
  if (!challenges || challenges.length === 0) return null

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <FadeInView>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">
                Danger Boy Challenges
              </p>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">
                Can you beat Deegan&apos;s time?
              </h2>
            </div>
            <Link href="/challenges" className="text-sm text-text-muted hover:text-accent transition-colors hidden sm:block">
              All challenges →
            </Link>
          </div>
        </FadeInView>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge, i) => (
            <ScaleIn key={challenge.id} delay={i * 0.08}>
              <Link
                href={`/challenges/${challenge.id}`}
                className="group block rounded-xl border border-accent/20 bg-card p-6 hover:bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Active</span>
                </div>
                <h3 className="font-heading text-xl font-bold group-hover:text-accent transition-colors">
                  {challenge.title}
                </h3>
                <p className="text-sm text-text-muted mt-1">{challenge.tracks?.name}</p>
                <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                  <span className="text-xs text-text-muted uppercase">Danger Boy Time</span>
                  <span className="font-mono text-lg font-bold text-gold">{formatLapTime(challenge.deegan_time_ms)}</span>
                </div>
              </Link>
            </ScaleIn>
          ))}
        </div>

        <Link href="/challenges" className="mt-6 block text-sm text-text-muted hover:text-accent transition-colors sm:hidden">
          All challenges →
        </Link>
      </div>
    </section>
  )
}

/* ---------- Full-bleed action shot divider ---------- */
export function ActionBanner() {
  return (
    <section className="relative h-[50vh] min-h-[300px] max-h-[500px] overflow-hidden">
      <Image
        src="/images/deegan/deegan-sx-16.jpg"
        alt="Haiden Deegan panoramic Supercross action"
        fill
        quality={100}
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-bg/40 to-transparent" />
      <FadeInView className="relative z-10 flex h-full items-center px-4">
        <div className="mx-auto w-full max-w-7xl">
          <p className="font-heading text-5xl font-bold sm:text-6xl lg:text-7xl text-white leading-[0.9]">
            RIDE.<br />
            <span className="text-accent">COMPETE.</span><br />
            REPEAT.
          </p>
        </div>
      </FadeInView>
    </section>
  )
}

/* ---------- Recent Activity ---------- */
type LapData = {
  id: string
  time_ms: number
  profiles?: { display_name: string } | null
  tracks?: { name: string } | null
}

export function RecentActivity({ laps }: { laps: LapData[] }) {
  if (!laps || laps.length === 0) return null

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <FadeInView>
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold">Recent Activity</h2>
            <Link href="/leaderboard" className="text-sm text-text-muted hover:text-accent transition-colors">
              Full leaderboard →
            </Link>
          </div>
        </FadeInView>

        <FadeInView delay={0.1}>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {laps.map((lap, i) => (
              <div
                key={lap.id}
                className={`flex items-center justify-between p-4 ${i < laps.length - 1 ? 'border-b border-border/50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-center text-sm font-bold" style={{ color: getRankColor(i + 1) }}>
                    {i + 1}
                  </span>
                  <div>
                    <Link
                      href={`/profile/${encodeURIComponent(lap.profiles?.display_name || '')}`}
                      className="text-sm font-medium hover:text-accent transition-colors"
                    >
                      {lap.profiles?.display_name}
                    </Link>
                    <p className="text-xs text-text-muted">{lap.tracks?.name}</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-accent">{formatLapTime(lap.time_ms)}</span>
              </div>
            ))}
          </div>
        </FadeInView>
      </div>
    </section>
  )
}

/* ---------- Featured Tracks with Deegan images ---------- */
type TrackData = {
  id: string
  name: string
  location_city: string
  location_state: string
  type: string
  difficulty?: string | null
}

const trackImages = [
  '/images/deegan/deegan-sx-3.jpg',
  '/images/deegan/deegan-sx-7.jpg',
  '/images/deegan/deegan-sx-11.jpg',
  '/images/deegan/deegan-sx-22.jpg',
  '/images/deegan/deegan-sx-30.jpg',
  '/images/deegan/deegan-sx-35.jpg',
]

export function FeaturedTracks({ tracks }: { tracks: TrackData[] }) {
  if (!tracks || tracks.length === 0) return null

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <FadeInView>
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold">Featured Tracks</h2>
            <Link href="/tracks" className="text-sm text-text-muted hover:text-accent transition-colors">
              All tracks →
            </Link>
          </div>
        </FadeInView>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track, i) => (
            <ScaleIn key={track.id} delay={i * 0.06}>
              <Link
                href={`/tracks/${track.id}`}
                className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-accent/20 transition-colors"
              >
                <div className="relative h-36 overflow-hidden">
                  <Image
                    src={trackImages[i % trackImages.length]}
                    alt={track.name}
                    fill
                    quality={100}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-bold">{track.name}</h3>
                  <p className="text-sm text-text-muted mt-1">
                    {track.location_city}, {track.location_state}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted capitalize">
                      {track.type}
                    </span>
                    {track.difficulty && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted capitalize">
                        {track.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </ScaleIn>
          ))}
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
          <h2 className="font-heading text-4xl font-bold sm:text-5xl">Ready to ride?</h2>
          <p className="mx-auto mt-4 max-w-md text-text-muted">
            Join Braap to log your laps, take on Danger Boy Challenges, and climb the leaderboard.
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
