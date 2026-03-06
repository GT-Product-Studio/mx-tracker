import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  // Get 3 random approved tracks for the challenges
  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, name')
    .eq('approved', true)
    .limit(3)

  if (!tracks || tracks.length < 3) {
    return NextResponse.json({ error: 'Not enough tracks in DB' }, { status: 400 })
  }

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const challenges = [
    {
      title: 'Danger Boy Sprint',
      description: 'Beat Deegan\'s blistering sprint time. One lap, full send. Show what you\'ve got.',
      track_id: tracks[0].id,
      deegan_time_ms: 68420,
      start_date: now.toISOString(),
      end_date: thirtyDaysFromNow.toISOString(),
      is_active: true,
    },
    {
      title: 'The Deegan Challenge',
      description: 'Haiden set this time on a 450F in perfect conditions. Think you can hang? Prove it.',
      track_id: tracks[1].id,
      deegan_time_ms: 72150,
      start_date: now.toISOString(),
      end_date: sixtyDaysFromNow.toISOString(),
      is_active: true,
    },
    {
      title: 'Send It Sunday',
      description: 'Sunday funday turned competition. Deegan dropped this lap casually. Your turn.',
      track_id: tracks[2].id,
      deegan_time_ms: 85300,
      start_date: now.toISOString(),
      end_date: thirtyDaysFromNow.toISOString(),
      is_active: true,
    },
  ]

  const { data, error } = await supabase.from('challenges').insert(challenges).select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, challenges: data })
}
