import { createClient } from '@/lib/supabase-server'
import {
  Hero,
  HowItWorks,
  LiveBattles,
  ChaseThePros,
  TrackFinderPreview,
  RankingSystem,
  DangerBoySection,
  BottomCTA,
} from '@/components/home-sections'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: activeBattles },
    { data: proTimes },
    { data: venues },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('battles')
      .select('*, challenger:profiles!battles_challenger_id_fkey(display_name), defender:profiles!battles_defender_id_fkey(display_name), venues(name)')
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('pro_times')
      .select('*, venues(name)')
      .eq('rider_name', 'Haiden Deegan')
      .order('lap_time_ms', { ascending: true })
      .limit(5),
    supabase
      .from('venues')
      .select('id, name, location_city, location_state, type')
      .eq('approved', true)
      .limit(6),
    supabase.auth.getUser(),
  ])

  return (
    <div>
      <Hero isLoggedIn={!!user} />
      <ChaseThePros proTimes={proTimes || []} />
      <TrackFinderPreview venues={venues || []} />
      <RankingSystem />
      <HowItWorks />
      <LiveBattles battles={activeBattles || []} />
      <DangerBoySection />
      {!user && <BottomCTA />}
    </div>
  )
}
