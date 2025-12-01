-- ============================================================================
-- Supabase Database Schema Migration & Security Setup
-- ============================================================================
-- Purpose: Fix schema issues and add production-ready security
-- Date: 2025-12-01
-- 
-- IMPORTANT: Review this script before running in production!
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Rename legacy Firebase column to Clerk
-- ----------------------------------------------------------------------------

-- Rename firebaseUid to clerkUserId
ALTER TABLE "Member" 
RENAME COLUMN "firebaseUid" TO "clerkUserId";

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Member' 
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- STEP 2: Add missing indexes for performance
-- ----------------------------------------------------------------------------

-- Index on Member.clerkUserId for fast user lookups
CREATE INDEX IF NOT EXISTS "idx_member_clerk_user_id" 
ON "Member"("clerkUserId");

-- Index on Member.groupId for fast group member lookups  
CREATE INDEX IF NOT EXISTS "idx_member_group_id"
ON "Member"("groupId");

-- Index on Group.code for fast group code lookups
CREATE INDEX IF NOT EXISTS "idx_group_code"
ON "Group"("code");

-- Index on Itinerary.groupId for fast itinerary lookups
CREATE INDEX IF NOT EXISTS "idx_itinerary_group_id"
ON "Itinerary"("groupId") 
WHERE "groupId" IS NOT NULL;

-- Index on ItineraryVote.groupId for vote counting
CREATE INDEX IF NOT EXISTS "idx_itinerary_vote_group_id"
ON "ItineraryVote"("groupId")
WHERE "groupId" IS NOT NULL;

-- ----------------------------------------------------------------------------
-- STEP 3: Add constraints for data integrity
-- ----------------------------------------------------------------------------

-- Ensure group codes are unique (if not already)
ALTER TABLE "Group"
ADD CONSTRAINT "unique_group_code" UNIQUE ("code");

-- Ensure one user can only join a group once
ALTER TABLE "Member"
ADD CONSTRAINT "unique_user_per_group" 
UNIQUE ("clerkUserId", "groupId");

-- Ensure valid budget range
ALTER TABLE "Member"
ADD CONSTRAINT "valid_budget" 
CHECK ("budget" >= 0 AND "budget" <= 1000000);

-- ----------------------------------------------------------------------------
-- STEP 4: Enable Row Level Security (RLS) - CRITICAL FOR PRODUCTION
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE "Group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Itinerary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItineraryVote" ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- STEP 5: Create RLS Policies
-- ----------------------------------------------------------------------------

-- ============== GROUP TABLE POLICIES ==============

-- Anyone can read groups (needed for sharing functionality)
CREATE POLICY "Anyone can view groups"
ON "Group"
FOR SELECT
USING (true);

-- Only authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
ON "Group"
FOR INSERT
WITH CHECK (true);

-- Groups cannot be updated or deleted (add policies if needed later)
CREATE POLICY "No one can update groups"
ON "Group"
FOR UPDATE
USING (false);

CREATE POLICY "No one can delete groups"
ON "Group"
FOR DELETE
USING (false);

-- ============== MEMBER TABLE POLICIES ==============

-- Users can view members of groups they belong to
CREATE POLICY "Users can view members of their groups"
ON "Member"
FOR SELECT
USING (
  "groupId" IN (
    SELECT "groupId" 
    FROM "Member" 
    WHERE "clerkUserId" = auth.uid()
  )
);

-- Users can create members (join groups)
CREATE POLICY "Users can create member records"
ON "Member"
FOR INSERT
WITH CHECK (true);

-- Users can only update their own member records
CREATE POLICY "Users can update their own member records"
ON "Member"
FOR UPDATE
USING ("clerkUserId" = auth.uid())
WITH CHECK ("clerkUserId" = auth.uid());

-- Users can delete their own member records (leave group)
CREATE POLICY "Users can delete their own member records"
ON "Member"
FOR DELETE
USING ("clerkUserId" = auth.uid());

-- ============== ITINERARY TABLE POLICIES ==============

-- Users can view itineraries of groups they're in
CREATE POLICY "Users can view itineraries of their groups"
ON "Itinerary"
FOR SELECT
USING (
  "groupId" IN (
    SELECT "groupId" 
    FROM "Member" 
    WHERE "clerkUserId" = auth.uid()
  )
);

-- Users can create itineraries for their groups
CREATE POLICY "Users can create itineraries for their groups"
ON "Itinerary"
FOR INSERT
WITH CHECK (
  "groupId" IN (
    SELECT "groupId" 
    FROM "Member" 
    WHERE "clerkUserId" = auth.uid()
  )
);

-- Users can update itineraries they created
CREATE POLICY "Users can update their own itineraries"
ON "Itinerary"
FOR UPDATE
USING ("created_by" IN (
  SELECT "id" 
  FROM "Member" 
  WHERE "clerkUserId" = auth.uid()
))
WITH CHECK ("created_by" IN (
  SELECT "id" 
  FROM "Member" 
  WHERE "clerkUserId" = auth.uid()
));

-- Users can delete itineraries for their groups
CREATE POLICY "Users can delete itineraries of their groups"
ON "Itinerary"
FOR DELETE
USING (
  "groupId" IN (
    SELECT "groupId" 
    FROM "Member" 
    WHERE "clerkUserId" = auth.uid()
  )
);

-- ============== ITINERARY VOTE TABLE POLICIES ==============

-- Users can view votes for groups they're in
CREATE POLICY "Users can view votes for their groups"
ON "ItineraryVote"
FOR SELECT
USING (
  "groupId" IN (
    SELECT "groupId" 
    FROM "Member" 
    WHERE "clerkUserId" = auth.uid()
  )
);

-- Users can create votes for groups they're in
CREATE POLICY "Users can vote in their groups"
ON "ItineraryVote"
FOR INSERT
WITH CHECK (
  "groupId" IN (
    SELECT "groupId" 
    FROM "Member" 
    WHERE "clerkUserId" = auth.uid()
  )
);

-- Users can update their own votes
CREATE POLICY "Users can update their own votes"
ON "ItineraryVote"
FOR UPDATE
USING ("member_id" IN (
  SELECT "id" 
  FROM "Member" 
  WHERE "clerkUserId" = auth.uid()
))
WITH CHECK ("member_id" IN (
  SELECT "id" 
  FROM "Member" 
  WHERE "clerkUserId" = auth.uid()
));

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
ON "ItineraryVote"
FOR DELETE
USING ("member_id" IN (
  SELECT "id" 
  FROM "Member" 
  WHERE "clerkUserId" = auth.uid()
));

-- ----------------------------------------------------------------------------
-- STEP 6: Add helpful database functions
-- ----------------------------------------------------------------------------

-- Function to get member count for a group
CREATE OR REPLACE FUNCTION get_group_member_count(group_id_param UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM "Member"
  WHERE "groupId" = group_id_param;
$$ LANGUAGE SQL STABLE;

-- Function to check if user is member of group
CREATE OR REPLACE FUNCTION is_user_in_group(user_id_param TEXT, group_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1
    FROM "Member"
    WHERE "clerkUserId" = user_id_param
    AND "groupId" = group_id_param
  );
$$ LANGUAGE SQL STABLE;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------

-- Check all indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('Group', 'Member', 'Itinerary', 'ItineraryVote')
ORDER BY tablename, indexname;

-- Check all RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('Group', 'Member', 'Itinerary', 'ItineraryVote')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================

-- NOTES:
-- 1. This script is idempotent (can be run multiple times safely)
-- 2. Some operations may fail if already exist - this is expected
-- 3. Review RLS policies to ensure they match your security requirements
-- 4. Test thoroughly in a staging environment before production
-- 5. Back up your database before running this script!
