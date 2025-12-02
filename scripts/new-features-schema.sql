-- ============================================================================
-- New Features Database Schema
-- ============================================================================
-- Purpose: Add tables for expense splitting, ranked voting, reviews, 
--          time slots, friends, and history tracking
-- Date: 2025-12-02
-- Note: Uses TEXT for Group.id to match existing schema
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXPENSE SPLITTING TABLES
-- ----------------------------------------------------------------------------

-- Expense table - tracks individual expenses during a hangout
CREATE TABLE IF NOT EXISTS "Expense" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" TEXT NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
  "paidById" TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL CHECK ("amount" > 0),
  "category" TEXT DEFAULT 'other' CHECK ("category" IN ('food', 'transport', 'entertainment', 'accommodation', 'shopping', 'other')),
  "splitType" TEXT DEFAULT 'equal' CHECK ("splitType" IN ('equal', 'custom', 'percentage')),
  "receipt_url" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ExpenseSplit table - tracks how each expense is split among members
CREATE TABLE IF NOT EXISTS "ExpenseSplit" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "expenseId" UUID NOT NULL REFERENCES "Expense"("id") ON DELETE CASCADE,
  "memberId" TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
  "amount" DECIMAL(10, 2) NOT NULL CHECK ("amount" >= 0),
  "percentage" DECIMAL(5, 2) DEFAULT 0 CHECK ("percentage" >= 0 AND "percentage" <= 100),
  "isPaid" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("expenseId", "memberId")
);

-- Settlement table - tracks payments between members
CREATE TABLE IF NOT EXISTS "Settlement" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" TEXT NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
  "fromMemberId" TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
  "toMemberId" TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
  "amount" DECIMAL(10, 2) NOT NULL CHECK ("amount" > 0),
  "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'completed', 'cancelled')),
  "notes" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "settled_at" TIMESTAMP WITH TIME ZONE
);

-- ----------------------------------------------------------------------------
-- 2. RANKED CHOICE VOTING TABLES
-- ----------------------------------------------------------------------------

-- Itineraries table - stores generated itineraries for a group
CREATE TABLE IF NOT EXISTS "Itineraries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" TEXT NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
  "itineraryIdx" INTEGER NOT NULL,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("groupId", "itineraryIdx")
);

-- RankedVote table - stores ranked votes for itineraries
CREATE TABLE IF NOT EXISTS "RankedVote" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" TEXT NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
  "memberId" TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
  "itineraryIdx" INTEGER NOT NULL,
  "rank" INTEGER NOT NULL CHECK ("rank" >= 1 AND "rank" <= 5),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("groupId", "memberId", "itineraryIdx")
);

-- ----------------------------------------------------------------------------
-- 3. TIME SLOT VOTING (DOODLE-STYLE)
-- ----------------------------------------------------------------------------

-- TimeSlot table - proposed time slots for a group
CREATE TABLE IF NOT EXISTS "TimeSlot" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" TEXT NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
  "proposedById" TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
  "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
  "title" TEXT,
  "isRecurring" BOOLEAN DEFAULT FALSE,
  "recurringPattern" TEXT CHECK ("recurringPattern" IN ('weekly', 'biweekly', 'monthly')),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TimeSlotVote table - member availability for time slots
CREATE TABLE IF NOT EXISTS "TimeSlotVote" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "timeSlotId" UUID NOT NULL REFERENCES "TimeSlot"("id") ON DELETE CASCADE,
  "memberId" TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
  "availability" TEXT NOT NULL CHECK ("availability" IN ('yes', 'maybe', 'no')),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("timeSlotId", "memberId")
);

-- ----------------------------------------------------------------------------
-- 4. REVIEW & HISTORY SYSTEM
-- ----------------------------------------------------------------------------

-- Hangout table - completed hangouts
CREATE TABLE IF NOT EXISTS "Hangout" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" TEXT NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "selectedItineraryIdx" INTEGER,
  "itineraryData" JSONB,
  "totalSpent" DECIMAL(10, 2) DEFAULT 0,
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "status" TEXT DEFAULT 'completed' CHECK ("status" IN ('planned', 'ongoing', 'completed', 'cancelled')),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HangoutReview table - member reviews for completed hangouts
CREATE TABLE IF NOT EXISTS "HangoutReview" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "hangoutId" UUID NOT NULL REFERENCES "Hangout"("id") ON DELETE CASCADE,
  "memberId" TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "feedback" TEXT,
  "wouldRepeat" BOOLEAN DEFAULT TRUE,
  "highlights" TEXT[],
  "improvements" TEXT[],
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("hangoutId", "memberId")
);

-- PlaceReview table - reviews for specific places visited
CREATE TABLE IF NOT EXISTS "PlaceReview" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "hangoutId" UUID NOT NULL REFERENCES "Hangout"("id") ON DELETE CASCADE,
  "memberId" TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
  "placeId" TEXT NOT NULL,
  "placeName" TEXT NOT NULL,
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "review" TEXT,
  "photos" TEXT[],
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("hangoutId", "memberId", "placeId")
);

-- ----------------------------------------------------------------------------
-- 5. SOCIAL FEATURES
-- ----------------------------------------------------------------------------

-- Friend table - friend connections between users
CREATE TABLE IF NOT EXISTS "Friend" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "friendUserId" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'accepted', 'blocked')),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "accepted_at" TIMESTAMP WITH TIME ZONE,
  UNIQUE("userId", "friendUserId")
);

-- Invitation table - group invitations
CREATE TABLE IF NOT EXISTS "Invitation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" TEXT NOT NULL REFERENCES "Group"("id") ON DELETE CASCADE,
  "invitedById" TEXT NOT NULL REFERENCES "Member"("id") ON DELETE CASCADE,
  "invitedEmail" TEXT,
  "invitedPhone" TEXT,
  "invitedUserId" TEXT,
  "method" TEXT NOT NULL CHECK ("method" IN ('email', 'whatsapp', 'link', 'in-app')),
  "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'accepted', 'declined', 'expired')),
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. EXTEND GROUP TABLE
-- ----------------------------------------------------------------------------

-- Add new columns to Group table
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "maxMembers" INTEGER DEFAULT 20;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active' CHECK ("status" IN ('active', 'planning', 'completed', 'archived'));
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "selectedTimeSlotId" UUID REFERENCES "TimeSlot"("id");
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "finalItineraryIdx" INTEGER;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "totalBudget" DECIMAL(10, 2);
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "actualSpent" DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ----------------------------------------------------------------------------
-- 6B. EXTEND MEMBER TABLE
-- ----------------------------------------------------------------------------

-- Add preferred_date column if it doesn't exist
-- Note: moodTags column already exists in the original schema
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "preferred_date" DATE;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- ----------------------------------------------------------------------------
-- 7. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "idx_expense_group_id" ON "Expense"("groupId");
CREATE INDEX IF NOT EXISTS "idx_expense_paid_by" ON "Expense"("paidById");
CREATE INDEX IF NOT EXISTS "idx_expense_split_expense" ON "ExpenseSplit"("expenseId");
CREATE INDEX IF NOT EXISTS "idx_expense_split_member" ON "ExpenseSplit"("memberId");
CREATE INDEX IF NOT EXISTS "idx_settlement_group" ON "Settlement"("groupId");
CREATE INDEX IF NOT EXISTS "idx_itineraries_group" ON "Itineraries"("groupId");
CREATE INDEX IF NOT EXISTS "idx_ranked_vote_group" ON "RankedVote"("groupId");
CREATE INDEX IF NOT EXISTS "idx_time_slot_group" ON "TimeSlot"("groupId");
CREATE INDEX IF NOT EXISTS "idx_time_slot_vote_slot" ON "TimeSlotVote"("timeSlotId");
CREATE INDEX IF NOT EXISTS "idx_hangout_group" ON "Hangout"("groupId");
CREATE INDEX IF NOT EXISTS "idx_hangout_review_hangout" ON "HangoutReview"("hangoutId");
CREATE INDEX IF NOT EXISTS "idx_place_review_hangout" ON "PlaceReview"("hangoutId");
CREATE INDEX IF NOT EXISTS "idx_friend_user" ON "Friend"("userId");
CREATE INDEX IF NOT EXISTS "idx_friend_friend_user" ON "Friend"("friendUserId");
CREATE INDEX IF NOT EXISTS "idx_invitation_group" ON "Invitation"("groupId");

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExpenseSplit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settlement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Itineraries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RankedVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeSlotVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Hangout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HangoutReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlaceReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Friend" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users on their data
CREATE POLICY "Users can manage expenses" ON "Expense" FOR ALL USING (true);
CREATE POLICY "Users can manage expense splits" ON "ExpenseSplit" FOR ALL USING (true);
CREATE POLICY "Users can manage settlements" ON "Settlement" FOR ALL USING (true);
CREATE POLICY "Users can manage itineraries" ON "Itineraries" FOR ALL USING (true);
CREATE POLICY "Users can manage ranked votes" ON "RankedVote" FOR ALL USING (true);
CREATE POLICY "Users can manage time slots" ON "TimeSlot" FOR ALL USING (true);
CREATE POLICY "Users can manage time slot votes" ON "TimeSlotVote" FOR ALL USING (true);
CREATE POLICY "Users can manage hangouts" ON "Hangout" FOR ALL USING (true);
CREATE POLICY "Users can manage hangout reviews" ON "HangoutReview" FOR ALL USING (true);
CREATE POLICY "Users can manage place reviews" ON "PlaceReview" FOR ALL USING (true);
CREATE POLICY "Users can manage friends" ON "Friend" FOR ALL USING (true);
CREATE POLICY "Users can manage invitations" ON "Invitation" FOR ALL USING (true);

-- ============================================================================
-- END OF NEW FEATURES SCHEMA
-- ============================================================================
