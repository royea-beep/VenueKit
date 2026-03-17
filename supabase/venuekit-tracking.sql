-- =====================================================
-- VenueKit — Lead tracking & event bookings
-- Run this in Supabase SQL Editor for project: uiyqswnhrbfctafeihdh
-- =====================================================

-- Leads from landing page contact form + order buttons
CREATE TABLE IF NOT EXISTS vk_leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  venue_name TEXT,
  notes TEXT,
  plan TEXT,
  price TEXT,
  source TEXT DEFAULT 'landing',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'closed', 'lost')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event bookings (for generated venue sites — public booking form)
CREATE TABLE IF NOT EXISTS vk_bookings (
  id SERIAL PRIMARY KEY,
  venue_slug TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_date DATE,
  event_time TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  guests INTEGER DEFAULT 1,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE vk_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vk_bookings ENABLE ROW LEVEL SECURITY;

-- Public insert (contact forms)
CREATE POLICY "vk_leads_public_insert" ON vk_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "vk_bookings_public_insert" ON vk_bookings FOR INSERT WITH CHECK (true);

-- Read/update allowed (dashboard is password-protected client-side)
CREATE POLICY "vk_leads_read" ON vk_leads FOR SELECT USING (true);
CREATE POLICY "vk_leads_update" ON vk_leads FOR UPDATE USING (true);
CREATE POLICY "vk_bookings_read" ON vk_bookings FOR SELECT USING (true);
CREATE POLICY "vk_bookings_update" ON vk_bookings FOR UPDATE USING (true);
