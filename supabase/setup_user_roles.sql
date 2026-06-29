-- Run this entire script in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Create user_profiles table in the production schema
CREATE TABLE IF NOT EXISTS production.user_profiles (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'kitchen'
              CHECK (role IN ('kitchen', 'factory', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS — users can only read their own profile
ALTER TABLE production.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON production.user_profiles;
CREATE POLICY "Users can read own profile" ON production.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Set icestasyprojects@gmail.com as super_admin
INSERT INTO production.user_profiles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'icestasyprojects@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- ============================================================
-- HOW TO CREATE THE OTHER 2 USERS:
-- Go to Supabase Dashboard → Authentication → Users → Invite user
-- Create:
--   kitchen@icestasy.com  (or any email)
--   factory@icestasy.com
--
-- Then run the inserts below (replace UUIDs with the actual IDs
-- shown in the Auth → Users table after creating them):
-- ============================================================

-- INSERT INTO production.user_profiles (user_id, role) VALUES
--   ('KITCHEN-USER-UUID-HERE', 'kitchen'),
--   ('FACTORY-USER-UUID-HERE', 'factory');
