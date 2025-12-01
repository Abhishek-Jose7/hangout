# Testing Guide - Complete Flow Verification

## Pre-Testing Setup

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor, run:
ALTER TABLE "Member" RENAME COLUMN "firebaseUid" TO "clerkUserId";
```

### 2. Verify Environment Variables
Check that `.env.local` contains all required keys:
- ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- ✅ CLERK_SECRET_KEY
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ GROQ_API_KEY

### 3. Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Test Flow 1: User Authentication

### Steps:
1. Navigate to `http://localhost:3000`
2. Click "Sign In" or "Sign Up"
3. Complete Clerk authentication

### Expected Results:
- ✅ User is redirected back to app
- ✅ User profile appears in navbar
- ✅ No console errors

### Debug If Fails:
- Check Clerk keys in `.env.local`
- Verify Clerk dashboard domain settings
- Check browser console for errors

---

## Test Flow 2: Create Group

### Steps:
1. Sign in as User A
2. Navigate to "Create Group" or `/create`
3. Fill in group details (if prompted)
4. Click "Create Group"

### Expected Results:
- ✅ Group created successfully
- ✅ Redirected to group page with code (e.g., `/group/ABC123`)
- ✅ Group code displayed prominently
- ✅ "Share" button works
- ✅ No errors in browser console
- ✅ No errors in server terminal

### Debug If Fails:
- Check server logs for SQL errors
- Verify `Group` table exists in Supabase
- Check if UUID is being generated for group ID
- Verify Supabase connection

### API Endpoints Used:
- `POST /api/groups`

---

## Test Flow 3: Join Group (Same User)

### Steps:
1. Still signed in as User A
2. On the group page, fill in the "Join Group" form:
   - Name: "Alice"
   - Location: "Mumbai"
   - Budget: "1000"
   - Select mood tags (e.g., "Food", "Adventure")
3. Click "Join Group"

### Expected Results:
- ✅ Success message: "You're in!"
- ✅ User appears in "Group Members" list
- ✅ Member count updates from 0 to 1
- ✅ Join form replaced with success message
- ✅ No errors in console

### Debug If Fails:
Common issues:
- **"column Member.clerkUserId does not exist"** → Run database migration
- **"null value in column id"** → Check if randomUUID is imported and used
- **"Authentication required"** → Verify Clerk auth is working
- Check server logs for detailed error

### API Endpoints Used:
- `POST /api/members`
- `GET /api/groups/[code]` (refresh after join)

---

## Test Flow 4: Join Group (Different User)

### Steps:
1. Open incognito/private browser window
2. Navigate to `http://localhost:3000/group/ABC123` (use your group code)
3. Sign in as User B (different account)
4. Fill in join form:
   - Name: "Bob"
   - Location: "Delhi"
   - Budget: "800"
   - Select different mood tags
5. Click "Join Group"

### Expected Results:
- ✅ Both users see each other in members list (real-time update)
- ✅ Member count shows 2
- ✅ Both User A and User B can see the group

### Debug If Fails:
- Check if socket.io connection works (check for socket 404 error)
- If real-time doesn't work, refresh page to see updated members
- Verify both users are authenticated

### API Endpoints Used:
- `POST /api/members`
- Socket.IO events: `member-joined`, `group-updated`

---

## Test Flow 5: Generate Location Suggestions

### Prerequisites:
- At least 2 members in the group

### Steps:
1. As any group member, click "Find Optimal Locations"
2. Wait for AI to generate suggestions (may take 10-30 seconds)

### Expected Results:
- ✅ Button shows "Finding Locations..." with loading state
- ✅ 2-3 location cards appear
- ✅ Each location has:
  - Name with city
  - Description
  - List of activities (3-4 items)
  - Estimated cost
  - Map links
- ✅ Locations are cached (clicking again returns instantly)

### Debug If Fails:
- **"GROQ_API_KEY not configured"** → Add key to `.env.local`
- **"Failed to find optimal locations"** → Check GROQ API quota/status
- **"Invalid API response"** → Check server logs for API errors
- Empty itinerary items → Check Geoapify API key

### API Endpoints Used:
- `GET /api/locations?groupId=...`
- External: Groq AI API
- External: Geoapify API (for place details)

---

## Test Flow 6: Vote on Locations

### Steps:
1. Click "Vote" button on one of the location cards
2. Have other user vote on same or different location

### Expected Results:
- ✅ Vote count increments
- ✅ "Your vote" indicator appears
- ✅ Other users see vote counts update in real-time
- ✅ When all members vote, winning location is highlighted

### Debug If Fails:
- Check if `ItineraryVote` table exists
- Verify member ID is being stored correctly
- Check socket connection for real-time updates

### API Endpoints Used:
- `POST /api/votes`
- Socket.IO event: `vote-updated`

---

## Test Flow 7: Clear Cached Locations

### Steps:
1. Click "Clear Cached Locations" button
2. Click "Find Optimal Locations" again

### Expected Results:
- ✅ Locations are cleared from view
- ✅ New locations generate (may be different from previous)
- ✅ No errors

### API Endpoints Used:
- `DELETE /api/locations/clear?groupId=...`

---

## Test Flow 8: Group Sharing

### Steps:
1. Click "Share" button on group page
2. If on mobile: Use native share dialog
3. If on desktop: Link is copied to clipboard

### Expected Results:
- ✅ Share URL format: `http://localhost:3000/share/ABC123`
- ✅ Visiting share link shows group info
- ✅ Non-members can see group details
- ✅ Non-members can join via share page

### API Endpoints Used:
- `GET /api/share/[code]`

---

## Test Flow 9: Dashboard

### Steps:
1. Navigate to `/dashboard`
2. View all groups user is a member of

### Expected Results:
- ✅ All user's groups displayed
- ✅ Group status shown (Planning/Voting/Decided)
- ✅ Member count accurate
- ✅ Can click to enter group

### API Endpoints Used:
- `GET /api/groups/user/[userId]`

---

## Security Testing

### Test 1: Unauthorized Access
```bash
# Try to create member without authentication
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacker","location":"Test","budget":100,"groupId":"test"}'
```

**Expected:** 401 Unauthorized

### Test 2: SQL Injection Attempt
Try entering in name field:
```
'; DROP TABLE "Member"; --
```

**Expected:** Input should be safely escaped

### Test 3: XSS Attempt
Try entering in name field:
```html
<script>alert('XSS')</script>
```

**Expected:** Script tags should be escaped/sanitized

---

## Performance Testing

### Test Load Time
1. Open DevTools → Network tab
2. Hard refresh group page (Ctrl+Shift+R)

**Expected:**
- Initial page load: < 2 seconds
- API calls: < 500ms each

### Test Real-time Updates
1. Have 3+ users in same group
2. One user votes
3. Measure time for others to see update

**Expected:** Real-time update within 1-2 seconds

---

## Edge Cases to Test

### Empty States
- ✅ Group with 0 members
- ✅ No locations generated yet
- ✅ No votes cast

### Validation
- ✅ Try joining with empty name
- ✅ Try negative budget
- ✅ Try budget > 1 million
- ✅ Try location with special characters
- ✅ Try joining same group twice (should show existing membership)

### Network Issues
- ✅ Disconnect WiFi during location generation
- ✅ Slow 3G simulation in DevTools

---

## Success Criteria

✅ All 9 test flows complete without errors
✅ No unhandled errors in browser console
✅ No 500 errors in server logs
✅ Real-time updates work (or graceful fallback)
✅ Data persists after page refresh
✅ Multiple users can interact simultaneously

---

## Rollback Plan

If critical issues found:

1. **Database Issue:**
   ```sql
   -- Rollback column rename
   ALTER TABLE "Member" RENAME COLUMN "clerkUserId" TO "firebaseUid";
   ```

2. **Code Issue:**
   ```bash
   git checkout main  # or your stable branch
   ```

3. **Environment Issue:**
   - Restore previous `.env.local` from backup
   - Verify all API keys are valid

---

## Common Issues & Solutions

### "Cannot read properties of undefined (reading 'length')"
- **Cause:** `group.members` is undefined
- **Fix:** Ensure `normalizeGroup()` helper is being used
- **Location:** `src/app/group/[code]/page.tsx`

### "column Member.firebaseUid does not exist"
- **Cause:** Database migration not run
- **Fix:** Run the ALTER TABLE command in Supabase

### "null value in column id violates not-null constraint"
- **Cause:** UUID not being generated
- **Fix:** Verify `randomUUID()` is imported and used

### Socket 404 errors
- **Impact:** Real-time updates won't work
- **Workaround:** Page refresh still shows updated data
- **Fix:** Check socket.io server configuration

---

**Last Updated:** 2025-12-01
