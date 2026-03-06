import { createClient } from '@/lib/supabase-server'
import Image from 'next/image'
import { VenuesFilter } from '@/components/venues-filter'

export default async function TracksPage() {
  const supabase = await createClient()
  
  // Fetch venues with track count
  const { data: venues } = await supabase
    .from('venues')
    .select('*, tracks(id, layout_name, difficulty)')
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
            <h1 className="font-heading text-4xl font-bold">Venues</h1>
            <p className="text-text-muted text-sm mt-1">{venues?.length || 0} facilities across the US</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <VenuesFilter venues={venues || []} />
      </div>
    </div>
  )
}
