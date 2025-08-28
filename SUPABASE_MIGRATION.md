# Adding Firebase Auth Fields in Supabase

Since the Prisma migration isn't working, you can add the required fields directly in Supabase. Here's how:

## Step 1: Open Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to the **Table Editor** in the left sidebar

## Step 2: Modify the Member Table

1. Find the `Member` table in the table list
2. Click on the table to view its structure
3. Click the **"Edit table"** button (pencil icon)

## Step 3: Add New Columns

Add these two new columns to the `Member` table:

### Column 1: firebaseUid
- **Name**: `firebaseUid`
- **Type**: `text`
- **Default Value**: Leave empty
- **Is Nullable**: ✅ Check this (allow null values)
- **Is Unique**: Leave unchecked

### Column 2: email
- **Name**: `email`
- **Type**: `text`
- **Default Value**: Leave empty
- **Is Nullable**: ✅ Check this (allow null values)
- **Is Unique**: Leave unchecked

## Step 4: Add Indexes (Optional but Recommended)

After adding the columns, you can add indexes for better performance:

1. Go to the **SQL Editor** in Supabase
2. Run these SQL commands:

```sql
-- Add index on firebaseUid for faster lookups
CREATE INDEX "Member_firebaseUid_idx" ON "public"."Member"("firebaseUid");

-- Add unique constraint to prevent duplicate memberships
-- This ensures one user can only be in a group once
ALTER TABLE "public"."Member" 
ADD CONSTRAINT "Member_firebaseUid_groupId_unique" 
UNIQUE ("firebaseUid", "groupId");
```

## Step 5: Verify the Changes

1. Go back to the **Table Editor**
2. Check that the `Member` table now has:
   - `firebaseUid` column (text, nullable)
   - `email` column (text, nullable)
   - The indexes are created

## Step 6: Update Prisma Schema (Optional)

If you want to keep your Prisma schema in sync, you can update it to match:

```prisma
model Member {
  id        String  @id @default(cuid())
  name      String
  location  String
  budget    Float
  moodTags  String   // Comma-separated tags as stored by API
  firebaseUid String? // Firebase user ID for authentication
  email     String?  // User's email from Firebase

  groupId   String
  group     Group   @relation(fields: [groupId], references: [id], onDelete: Cascade)

  votes     ItineraryVotes[]

  @@index([groupId])
  @@index([firebaseUid])
  @@unique([firebaseUid, groupId]) // One user can only be in a group once
}
```

Then run:
```bash
npx prisma generate
```

## Step 7: Test the Application

1. Make sure your Firebase configuration is set up in `.env.local`
2. Start your development server: `npm run dev`
3. Test the authentication flow

## Troubleshooting

If you encounter any issues:

1. **Check the table structure** in Supabase to ensure columns were added correctly
2. **Verify the column names** match exactly: `firebaseUid` and `email`
3. **Check the data types** are `text` and nullable
4. **Restart your development server** after making database changes

This approach bypasses Prisma migrations entirely and directly modifies your Supabase database structure.
