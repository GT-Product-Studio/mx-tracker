-- Braap Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  location text,
  bike_make text,
  bike_model text,
  bike_year integer,
  riding_level text check (riding_level in ('beginner', 'intermediate', 'advanced', 'pro')),
  is_premium boolean default false,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tracks table
create table public.tracks (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location_city text not null,
  location_state text not null,
  type text not null check (type in ('supercross', 'motocross', 'practice')),
  difficulty text check (difficulty in ('easy', 'intermediate', 'advanced', 'pro')),
  description text,
  image_url text,
  approved boolean default true,
  created_at timestamptz default now()
);

-- Laps table
create table public.laps (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  track_id uuid references public.tracks(id) on delete cascade not null,
  time_ms integer not null,
  date date not null default current_date,
  conditions text check (conditions in ('dry', 'muddy', 'wet', 'mixed')),
  bike_class text check (bike_class in ('125', '250f', '250', '450f', '450', 'open', 'other')),
  video_url text,
  is_personal_best boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Challenges table
create table public.challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  track_id uuid references public.tracks(id) on delete cascade not null,
  deegan_time_ms integer not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Challenge entries table
create table public.challenge_entries (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  lap_id uuid references public.laps(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(challenge_id, user_id)
);

-- Follows table
create table public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- Indexes for performance
create index idx_laps_user_id on public.laps(user_id);
create index idx_laps_track_id on public.laps(track_id);
create index idx_laps_time_ms on public.laps(time_ms);
create index idx_laps_date on public.laps(date);
create index idx_challenge_entries_challenge_id on public.challenge_entries(challenge_id);
create index idx_follows_follower_id on public.follows(follower_id);
create index idx_follows_following_id on public.follows(following_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.laps enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_entries enable row level security;
alter table public.follows enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Tracks policies
create policy "Tracks are viewable by everyone" on public.tracks
  for select using (true);

create policy "Authenticated users can insert tracks" on public.tracks
  for insert with check (auth.role() = 'authenticated');

-- Laps policies
create policy "Laps are viewable by everyone" on public.laps
  for select using (true);

create policy "Users can insert own laps" on public.laps
  for insert with check (auth.uid() = user_id);

create policy "Users can update own laps" on public.laps
  for update using (auth.uid() = user_id);

create policy "Users can delete own laps" on public.laps
  for delete using (auth.uid() = user_id);

-- Challenges policies
create policy "Challenges are viewable by everyone" on public.challenges
  for select using (true);

create policy "Authenticated users can insert challenges" on public.challenges
  for insert with check (auth.role() = 'authenticated');

-- Challenge entries policies
create policy "Challenge entries are viewable by everyone" on public.challenge_entries
  for select using (true);

create policy "Users can insert own challenge entries" on public.challenge_entries
  for insert with check (auth.uid() = user_id);

-- Follows policies
create policy "Follows are viewable by everyone" on public.follows
  for select using (true);

create policy "Users can follow others" on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow others" on public.follows
  for delete using (auth.uid() = follower_id);

-- Function: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed 20 major US motocross tracks
insert into public.tracks (name, location_city, location_state, type, difficulty, description) values
  ('Glen Helen Raceway', 'San Bernardino', 'CA', 'motocross', 'advanced', 'Iconic Southern California motocross track known for massive elevation changes and natural terrain.'),
  ('Fox Raceway at Pala', 'Pala', 'CA', 'motocross', 'intermediate', 'Premier outdoor motocross facility in the rolling hills of North San Diego County.'),
  ('Hangtown MX (Prairie City)', 'Rancho Cordova', 'CA', 'motocross', 'advanced', 'One of the oldest motocross tracks in America, known for hardpack and elevation.'),
  ('Thunder Valley MX', 'Lakewood', 'CO', 'motocross', 'advanced', 'High-altitude national track with fast, flowing layout and Colorado red soil.'),
  ('High Point Raceway', 'Mt. Morris', 'PA', 'motocross', 'intermediate', 'Classic Pennsylvania national with steep hills and a natural amphitheater layout.'),
  ('RedBud MX', 'Buchanan', 'MI', 'motocross', 'pro', 'America''s motocross track. Home of the Motocross of Nations. LaRocco''s Leap is legendary.'),
  ('Southwick MX (The Wick 338)', 'Southwick', 'MA', 'motocross', 'pro', 'Deep sand track that punishes riders. One of the most physically demanding nationals.'),
  ('Spring Creek MX', 'Millville', 'MN', 'motocross', 'advanced', 'Fast, wide track known for huge jumps and flowing layout through Minnesota woods.'),
  ('Washougal MX', 'Washougal', 'WA', 'motocross', 'advanced', 'Pacific Northwest track carved through tall trees with roots, shadows, and loamy soil.'),
  ('Unadilla MX', 'New Berlin', 'NY', 'motocross', 'pro', 'Historic track with unique European-style features. Gravity Cavity is iconic.'),
  ('Budds Creek MX', 'Mechanicsville', 'MD', 'motocross', 'intermediate', 'Fast national track with a mix of sand and clay in southern Maryland.'),
  ('Ironman Raceway', 'Crawfordsville', 'IN', 'motocross', 'advanced', 'Season finale track with Indiana red clay and a challenging layout.'),
  ('WW Ranch MX', 'Jacksonville', 'FL', 'motocross', 'intermediate', 'Florida sand track with deep ruts and a punishing layout.'),
  ('Angel Stadium', 'Anaheim', 'CA', 'supercross', 'pro', 'The birthplace of supercross. A1 is the most anticipated race of the year.'),
  ('Daytona International Speedway', 'Daytona Beach', 'FL', 'supercross', 'pro', 'Unique supercross-motocross hybrid track built inside the famous speedway.'),
  ('AT&T Stadium', 'Arlington', 'TX', 'supercross', 'pro', 'Massive indoor stadium hosting one of the biggest supercross events in Texas.'),
  ('Metlife Stadium', 'East Rutherford', 'NJ', 'supercross', 'advanced', 'East coast supercross under the lights in the shadow of New York City.'),
  ('State Farm Stadium', 'Glendale', 'AZ', 'supercross', 'pro', 'Arizona supercross with a history of dramatic championship battles.'),
  ('Milestone MX Park', 'Riverside', 'CA', 'practice', 'intermediate', 'Premier practice facility in Southern California with multiple track configurations.'),
  ('Club MX', 'Chesterfield', 'SC', 'practice', 'advanced', 'Elite training facility where top pros prepare for the nationals.');
