import { createClient } from '@/lib/supabase-server'
import {
  Hero,
  DangerBoySection,
  ActiveChallenges,
  ActionBanner,
  RecentActivity,
  FeaturedTracks,
  BottomCTA,
} from '@/components/home-sections'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: tracks }, { data: recentLaps }, { data: activeChallenges }, { data: { user } }] = await Promise.all([
    supabase.from('tracks').select('*').eq('approved', true).limit(6),
    supabase.from('laps').select('*, profiles(display_name), tracks(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('challenges').select('*, tracks(name)').eq('is_active', true).limit(3),
    supabase.auth.getUser(),
  ])

  return (
    <div>
      <Hero isLoggedIn={!!user} />
      <DangerBoySection />
      <ActiveChallenges challenges={activeChallenges || []} />
      <ActionBanner />
      <RecentActivity laps={recentLaps || []} />
      <FeaturedTracks tracks={tracks || []} />
      {!user && <BottomCTA />}
    </div>
  )
}
