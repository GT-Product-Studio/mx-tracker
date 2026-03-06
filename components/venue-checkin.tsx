'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const CONDITIONS = ['dry', 'muddy', 'wet', 'sandy', 'groomed', 'rough'] as const

export function VenueCheckin({ venueId }: { venueId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [conditions, setConditions] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleCheckin = async () => {
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('checkins').insert({
      user_id: user.id,
      venue_id: venueId,
      conditions: conditions || null,
      notes: notes || null,
    })

    setDone(true)
    setSubmitting(false)
    setTimeout(() => router.refresh(), 500)
  }

  if (done) {
    return (
      <span className="rounded-lg bg-accent/20 px-4 py-2 text-sm font-bold text-accent">
        ✓ Checked in!
      </span>
    )
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black hover:bg-accent-hover transition-colors"
      >
        I&apos;m Here!
      </button>
    )
  }

  return (
    <div className="w-full sm:w-auto">
      <div className="flex flex-wrap gap-2 mb-2">
        {CONDITIONS.map((c) => (
          <button
            key={c}
            onClick={() => setConditions(conditions === c ? '' : c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              conditions === c ? 'bg-accent text-black' : 'bg-card-hover text-text-muted border border-border'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Track notes (optional)"
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted/50 mb-2"
      />
      <div className="flex gap-2">
        <button
          onClick={handleCheckin}
          disabled={submitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {submitting ? 'Checking in...' : 'Check In'}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
