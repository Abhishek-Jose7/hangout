-- Database Migration: Refactor Voting to use Immutable Snapshots
-- Goal: Replace array-index based voting with stable UUID-based voting

-- 1. Create ItinerarySnapshots table
CREATE TABLE IF NOT EXISTS "ItinerarySnapshot" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" TEXT NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
  "source" TEXT DEFAULT 'ai', -- 'ai', 'fallback', 'manual'
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "metadata" JSONB DEFAULT '{}'
);

-- 2. Create ItineraryItems table
-- This stores the actual places for a given snapshot
CREATE TABLE IF NOT EXISTS "ItineraryItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "snapshotId" UUID NOT NULL REFERENCES "ItinerarySnapshot"("id") ON DELETE CASCADE,
  "placeId" TEXT, -- External ID (Geoapify/Google) or Internal Place ID
  "name" TEXT NOT NULL,
  "description" TEXT,
  "address" TEXT,
  "latitude" DECIMAL(10, 8),
  "longitude" DECIMAL(11, 8),
  "rating" DECIMAL(2, 1),
  "priceLevel" INTEGER,
  "position" INTEGER NOT NULL, -- Original ranking from AI
  "metadata" JSONB DEFAULT '{}', -- Store photos, reviews summary, etc.
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update/Recreate RankedVote table
-- We need to drop the old constraint/column logic if it exists, or create new if not.
-- For safety, we'll create a new table "RankedVoteV2" or modify existing. 
-- Since this is a breaking change, we will modify the existing table structure.

-- Option A: Add new columns and deprecate old ones (safer for data retention)
ALTER TABLE "RankedVote" 
ADD COLUMN IF NOT EXISTS "snapshotId" UUID REFERENCES "ItinerarySnapshot"("id") ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS "itemId" UUID REFERENCES "ItineraryItem"("id") ON DELETE CASCADE;

-- Option B: Clean slate for refactor (Recommended for this stage of dev)
-- DROP TABLE IF EXISTS "RankedVote";
-- CREATE TABLE "RankedVote" (...); 
-- We will stick to ALTER for now to be non-destructive, but the code will use the new columns.

-- 4. Enable RLS
ALTER TABLE "ItinerarySnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItineraryItem" ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access for snapshots" ON "ItinerarySnapshot";
CREATE POLICY "Public read access for snapshots" ON "ItinerarySnapshot" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for items" ON "ItineraryItem";
CREATE POLICY "Public read access for items" ON "ItineraryItem" FOR SELECT USING (true);

-- Insert policies (restricted to authenticated users or broad for now like others)
CREATE POLICY "Enable insert for authenticated users only" ON "ItinerarySnapshot" 
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users only" ON "ItineraryItem" 
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_itinerary_snapshot_group" ON "ItinerarySnapshot"("groupId");
CREATE INDEX IF NOT EXISTS "idx_itinerary_item_snapshot" ON "ItineraryItem"("snapshotId");
CREATE INDEX IF NOT EXISTS "idx_ranked_vote_item" ON "RankedVote"("itemId");
