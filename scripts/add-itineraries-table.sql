-- Quick fix: Add Itineraries table
-- Run this in Supabase SQL Editor

-- Create the Itineraries table
CREATE TABLE IF NOT EXISTS "Itineraries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" TEXT NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
  "itineraryIdx" INTEGER NOT NULL,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("groupId", "itineraryIdx")
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS "idx_itineraries_group" ON "Itineraries"("groupId");

-- Enable RLS
ALTER TABLE "Itineraries" ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all authenticated users
CREATE POLICY "Users can manage itineraries" ON "Itineraries" FOR ALL USING (true);
