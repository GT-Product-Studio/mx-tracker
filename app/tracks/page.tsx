import { createClient } from '@/lib/supabase-server'
import Image from 'next/image'
import { TracksFilter } from '@/components/tracks-filter'

export default async function TracksPage() {
  const supabase = await createClient()
  const { data: tracks } = await supabase
    .from('tracks')
    .select('*')
    .eq('approved', true)
    .order('name')

  return (
    <div>
      {/* Hero banner */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src="/images/deegan/deegan-sx-13.jpg"
          alt="Supercross action"
          fill
          priority
          quality={100}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />
        <div className="relative z-10 flex h-full items-end pb-8 px-4">
          <div className="mx-auto w-full max-w-7xl">
            <h1 className="font-heading text-4xl font-bold">Tracks</h1>
            <p className="text-text-muted text-sm mt-1">{tracks?.length || 0} tracks across the US</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <TracksFilter tracks={tracks || []} />
      </div>
    </div>
  )
}
