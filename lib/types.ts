export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  location: string | null
  bike_make: string | null
  bike_model: string | null
  bike_year: number | null
  riding_level: 'beginner' | 'intermediate' | 'advanced' | 'pro' | null
  is_premium: boolean
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface Track {
  id: string
  name: string
  location_city: string
  location_state: string
  type: 'supercross' | 'motocross' | 'practice'
  difficulty: 'easy' | 'intermediate' | 'advanced' | 'pro' | null
  description: string | null
  image_url: string | null
  approved: boolean
  created_at: string
}

export interface Lap {
  id: string
  user_id: string
  track_id: string
  time_ms: number
  date: string
  conditions: 'dry' | 'muddy' | 'wet' | 'mixed' | null
  bike_class: '125' | '250f' | '250' | '450f' | '450' | 'open' | 'other' | null
  video_url: string | null
  is_personal_best: boolean
  notes: string | null
  created_at: string
  // Joined
  profiles?: Profile
  tracks?: Track
}

export interface Challenge {
  id: string
  title: string
  description: string | null
  track_id: string
  deegan_time_ms: number
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  // Joined
  tracks?: Track
}

export interface ChallengeEntry {
  id: string
  challenge_id: string
  user_id: string
  lap_id: string
  created_at: string
  // Joined
  profiles?: Profile
  laps?: Lap
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}
