import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import type { Track } from '@/lib/types'
import { TracksFilter } from '@/components/tracks-filter'

export default async function TracksPage() {
  const supabase = await createClient()
  const { data: tracks } = await supabase
    .from('tracks')
    .select('*')
    .eq('approved', true)
    .order('name')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold">Tracks</h1>
          <p className="text-text-muted text-sm mt-1">{tracks?.length || 0} tracks across the US</p>
        </div>
      </div>

      <TracksFilter tracks={tracks || []} />
    </div>
  )
}
