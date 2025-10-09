-- Fix database schema for Clerk integration
-- Run this in your Supabase SQL editor

-- Add missing clerk_user_id column to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Add missing email column to members table
ALTER TABLE members
ADD COLUMN IF NOT EXISTS email TEXT;

-- Remove preferred_date column (no longer needed)
ALTER TABLE members
DROP COLUMN IF EXISTS preferred_date;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_members_clerk_user_id ON members(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_members_group_id ON members(group_id);

-- Create itineraries table to store generated location suggestions
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  locations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES members(id) ON DELETE SET NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_itineraries_group_id ON itineraries(group_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON itineraries(created_at);

-- Update existing members to have placeholder values (optional)
-- UPDATE members SET clerk_user_id = 'migrated_' || id WHERE clerk_user_id IS NULL;

-- Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'members' 
ORDER BY ordinal_position;
