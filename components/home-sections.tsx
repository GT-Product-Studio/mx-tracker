'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      setIdx((prev) => (prev + 1) % HERO_REELS.length)
    }

    video.addEventListener('ended', handleEnded)
    return () => video.removeEventListener('ended', handleEnded)
  }, [idx])

  // When idx changes, load and play the new video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.load()
    video.play().catch(() => {})
  }, [idx])

  const reel = HERO_REELS[idx]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <div
        className={`relative ${tall ? 'h-[85vh] max-h-[800px]' : 'max-w-xs'} aspect-[9/16] rounded-2xl overflow-hidden ring-1 ring-white/10`}
        style={{ boxShadow: '0 0 80px rgba(0, 210, 106, 0.15), 0 25px 50px rgba(0, 0, 0, 0.5)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              poster={reel.poster}
              className="h-full w-full object-cover"
            >
              <source src={reel.src} type="video/mp4" />
            </video>
          </motion.div>
        </AnimatePresence>
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

      <div className="relative z-10 mx-auto grid h-screen max-h-[900px] min-h-[650px] w-full max-w-7xl grid-cols-1 lg:grid-cols-2 items-center gap-0 px-6 pt-20 lg:px-8">
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
            Track your rides.<br />
            <motion.span
              className="text-accent inline-block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
            >
              Chase the leaderboard.
            </motion.span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            className="mt-4 max-w-md text-base text-white/50 sm:text-lg"
          >
            Built with 2x AMA Champion Haiden Deegan. Log laps, compete on leaderboards, and take on Danger Boy Challenges.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
            className="mt-8 flex gap-4"
          >
            {isLoggedIn ? (
              <Link
                href="/laps/new"
                className="group relative rounded-lg bg-accent px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5"
              >
                Log a Lap
              </Link>
            ) : (
              <Link
                href="/signup"
                className="group relative rounded-lg bg-accent px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5"
              >
                Get Started — It&apos;s Free
              </Link>
            )}
            <Link
              href="/challenges"
              className="rounded-lg border border-white/20 px-8 py-3.5 text-sm font-medium text-white transition-all hover:border-accent/50 hover:text-accent hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-0.5"
            >
              Danger Boy Challenges
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

      {/* Mobile — rotating reels below text */}
      <div className="lg:hidden px-4 pb-12">
        <HeroReelCarousel className="flex justify-center" tall={false} />
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
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0, 210, 106, 0.04) 0%, transparent 70%)', filter: 'blur(80px)' }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-12 lg:gap-16 items-center">
          {/* Left — text content */}
          <div>
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
                Haiden isn&apos;t just an ambassador — he sets every challenge you compete against.
                Beat his target times, climb the leaderboard, earn bragging rights. The fastest 250 rider on the planet is waiting.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/challenges"
                  className="rounded-lg bg-accent px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5"
                >
                  Take on a Challenge
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

          {/* Right — Haiden portrait */}
          <FadeInView delay={0.2} className="hidden lg:block">
            <div className="relative h-[70vh] max-h-[700px] w-full rounded-2xl overflow-hidden ring-1 ring-white/10"
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

/* ---------- Action divider ---------- */
export function ActionBanner() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Animated diagonal lines background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`ab-line-${i}`}
            className="absolute h-[2px] bg-gradient-to-r from-transparent via-accent/15 to-transparent"
            style={{
              top: `${15 + i * 18}%`,
              left: '-50%',
              width: '60%',
              transform: 'rotate(-12deg)',
            }}
            animate={{ x: ['0%', '300%'] }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.8,
            }}
          />
        ))}
      </div>
      {/* Subtle green glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0, 210, 106, 0.06) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center sm:items-end gap-8 sm:gap-16">
        <FadeInView>
          <p className="font-heading text-6xl font-bold sm:text-7xl lg:text-8xl text-white leading-[0.85] tracking-tight">
            RIDE.<br />
            <span className="text-accent">COMPETE.</span><br />
            REPEAT.
          </p>
        </FadeInView>
        <SlideInLeft>
          <div className="flex gap-6 pb-2">
            {[
              { num: '648', label: 'Tracks across the US' },
              { num: '30', label: 'Pro circuit venues' },
              { num: '∞', label: 'Laps to log' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-heading text-3xl sm:text-4xl font-bold text-accent">{s.num}</p>
                <p className="text-xs text-white/40 mt-1 max-w-[80px]">{s.label}</p>
              </div>
            ))}
          </div>
        </SlideInLeft>
      </div>
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
