'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export function FollowButton({ targetUserId, initialFollowing }: { targetUserId: string; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleToggle = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
      setFollowing(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
        following
          ? 'border border-border text-text-muted hover:text-text hover:border-text-muted'
          : 'bg-accent text-black hover:bg-accent-hover'
      }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
