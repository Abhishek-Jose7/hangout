# Supabase Database Migration - Rename firebaseUid to clerkUserId

## Overview
This migration renames the legacy `firebaseUid` column to `clerkUserId` in the Member table to accurately reflect that we use Clerk for authentication, not Firebase.

## SQL Migration Script

Run this in your Supabase SQL Editor:

```sql
-- Rename the firebaseUid column to clerkUserId in the Member table
ALTER TABLE "Member" 
RENAME COLUMN "firebaseUid" TO "clerkUserId";

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Member' 
ORDER BY ordinal_position;
```

## Expected Result

After running this migration, your Member table columns should be:
- id
- name
- location
- budget
- moodTags
- groupId
- **clerkUserId** (renamed from firebaseUid)
- email
- is_admin
- created_at
- updated_at

## Next Steps

After running this SQL:
1. The column will be renamed in your Supabase database
2. All existing data will remain intact (just the column name changes)
3. Your application code is already updated to use `clerkUserId` instead of `firebaseUid`

## Rollback (if needed)

If you need to rollback this change:

```sql
-- Rollback: Rename clerkUserId back to firebaseUid
ALTER TABLE "Member" 
RENAME COLUMN "clerkUserId" TO "firebaseUid";
```
