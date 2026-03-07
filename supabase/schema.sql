-- =====================================================
-- VenueKit — Base Database Schema
-- Run this in a new Supabase project to set up a venue
-- =====================================================

-- Players (registered users)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT DEFAULT '19:00',
  registration_deadline TEXT DEFAULT '17:00',
  entry_fee INTEGER DEFAULT 350,
  rake_split TEXT DEFAULT '225+125',
  starting_stack INTEGER DEFAULT 75000,
  max_players INTEGER DEFAULT 60,
  max_reentries INTEGER DEFAULT 3,
  reentry_until_level INTEGER DEFAULT 12,
  blinds_structure JSONB DEFAULT '[]',
  description TEXT,
  status TEXT DEFAULT 'upcoming',
  registered_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Registrations
CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  player_name TEXT,
  status TEXT DEFAULT 'registered',
  reentry_count INTEGER DEFAULT 0,
  finish_position INTEGER,
  prize_amount INTEGER DEFAULT 0,
  attended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- League
CREATE TABLE IF NOT EXISTS leagues (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  season TEXT,
  start_date DATE,
  end_date DATE,
  top_n INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS league_standings (
  id SERIAL PRIMARY KEY,
  league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  player_name TEXT,
  points INTEGER DEFAULT 0,
  tournaments_played INTEGER DEFAULT 0,
  best_finish INTEGER,
  total_prizes INTEGER DEFAULT 0,
  rank INTEGER,
  UNIQUE(league_id, player_id)
);

-- Winners
CREATE TABLE IF NOT EXISTS winners (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  player_name TEXT,
  finish_position INTEGER NOT NULL,
  prize_amount INTEGER DEFAULT 0,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES players(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, endpoint)
);

-- Error tracking
CREATE TABLE IF NOT EXISTS js_errors (
  id SERIAL PRIMARY KEY,
  message TEXT,
  source TEXT,
  line INTEGER,
  col INTEGER,
  stack TEXT,
  page TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE js_errors ENABLE ROW LEVEL SECURITY;

-- Public read for most tables
CREATE POLICY "tournaments_public_read" ON tournaments FOR SELECT USING (true);
CREATE POLICY "league_standings_public_read" ON league_standings FOR SELECT USING (true);
CREATE POLICY "winners_public_read" ON winners FOR SELECT USING (true);
CREATE POLICY "gallery_public_read" ON gallery FOR SELECT USING (true);
CREATE POLICY "leagues_public_read" ON leagues FOR SELECT USING (true);

-- Players: own profile read/update
CREATE POLICY "players_own_read" ON players FOR SELECT USING (true);
CREATE POLICY "players_own_update" ON players FOR UPDATE USING (id = auth.uid());
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (id = auth.uid());

-- Registrations: authenticated can register, public can see counts
CREATE POLICY "registrations_public_read" ON registrations FOR SELECT USING (true);
CREATE POLICY "registrations_auth_insert" ON registrations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "registrations_own_update" ON registrations FOR UPDATE USING (player_id = auth.uid());

-- Push subscriptions: own only
CREATE POLICY "push_own" ON push_subscriptions FOR ALL USING (player_id = auth.uid());

-- JS errors: anyone can insert, admins can read
CREATE POLICY "js_errors_insert" ON js_errors FOR INSERT WITH CHECK (true);
CREATE POLICY "js_errors_admin_read" ON js_errors FOR SELECT USING (
  EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
);

-- Admin policies (admin can do everything)
CREATE POLICY "admin_tournaments" ON tournaments FOR ALL USING (
  EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "admin_registrations" ON registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "admin_leagues" ON leagues FOR ALL USING (
  EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "admin_standings" ON league_standings FOR ALL USING (
  EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "admin_winners" ON winners FOR ALL USING (
  EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "admin_gallery" ON gallery FOR ALL USING (
  EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
);

-- =====================================================
-- Storage Buckets (create manually in Supabase dashboard)
-- 1. winner-photos (public)
-- 2. gallery (public)
-- =====================================================
