-- Run in Supabase SQL Editor

-- Add columns to user_profiles for employee management
ALTER TABLE production.user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE production.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE production.user_profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Grant access
GRANT ALL ON production.user_profiles TO authenticated;
GRANT SELECT ON production.user_profiles TO anon;
