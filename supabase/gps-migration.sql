-- GPS Features Migration
-- Add start/finish coordinates to tracks for geofenced lap detection
alter table public.tracks add column if not exists start_lat double precision;
alter table public.tracks add column if not exists start_lng double precision;
alter table public.tracks add column if not exists finish_lat double precision;
alter table public.tracks add column if not exists finish_lng double precision;

-- Sessions table for GPS-tracked riding sessions
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  track_id uuid references public.tracks(id) on delete set null,
  source text not null check (source in ('gopro', 'phone', 'gpx')),
  gps_data jsonb not null,
  laps_data jsonb,
  top_speed_mph double precision,
  avg_speed_mph double precision,
  total_distance_miles double precision,
  total_duration_ms integer,
  recorded_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Indexes
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_track_id on public.sessions(track_id);
create index idx_sessions_recorded_at on public.sessions(recorded_at desc);

-- Row Level Security
alter table public.sessions enable row level security;

create policy "Sessions are viewable by everyone" on public.sessions
  for select using (true);

create policy "Users can insert own sessions" on public.sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own sessions" on public.sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete own sessions" on public.sessions
  for delete using (auth.uid() = user_id);
