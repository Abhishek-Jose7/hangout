# 🚀 Deployment Checklist

## ✅ Pre-Deployment (Development)

### 1. Database Migration
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] Run SQL migration in Supabase SQL Editor
- [ ] Verify column `clerkUserId` exists in `Member` table
- [ ] Test member join flow
- [ ] Verify data appears correctly

**SQL Command:**
```sql
ALTER TABLE "Member" RENAME COLUMN "firebaseUid" TO "clerkUserId";
```

### 2. Environment Variables
```bash
# Status: [ ] Pending  [ ] Done  
```
- [ ] All keys in `.env.local`
- [ ] `.env.local` in `.gitignore` 
- [ ] No secrets in source code (verified ✅)
- [ ] `env.template` created for reference

### 3. Code Quality
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] No TypeScript errors: `npm run build`
- [ ] No ESLint errors: `npm run lint`
- [ ] Remove debug code (debug-schema endpoint removed ✅)
- [ ] Remove console.logs in production (optional)

### 4. Security Audit
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] All API routes require authentication ✅
- [ ] Input validation in place ✅
- [ ] No SQL injection vulnerabilities ✅
- [ ] XSS prevention (needs testing ⚠️)
- [ ] Rate limiting (not implemented ⚠️)

### 5. Testing
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] Follow `TESTING_GUIDE.md`
- [ ] Test Flow 1: Authentication
- [ ] Test Flow 2: Create Group
- [ ] Test Flow 3: Join Group (Same User)
- [ ] Test Flow 4: Join Group (Different User)
- [ ] Test Flow 5: Generate Locations
- [ ] Test Flow 6: Vote
- [ ] Test Flow 7: Clear Cache
- [ ] Test Flow 8: Share Group
- [ ] Test Flow 9: Dashboard

---

## 🔧 Production Setup

### 1. Supabase Production
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] Create production project in Supabase
- [ ] Run migration script: `scripts/fix-database-schema.sql`
- [ ] Enable Row Level Security (RLS)
- [ ] Set up database backups
- [ ] Configure indexes
- [ ] Note production URL and keys

### 2. Clerk Production
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] Create production instance in Clerk
- [ ] Configure production domain
- [ ] Set up redirect URLs
- [ ] Update OAuth settings
- [ ] Note production keys

### 3. External APIs
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] Groq API: Verify production key & quota
- [ ] Geoapify: Verify API key & usage limits
- [ ] Monitor API usage

### 4. Hosting Platform (Vercel Recommended)
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] Connect GitHub repository
- [ ] Set environment variables in dashboard
- [ ] Configure build settings:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`
- [ ] Set Node.js version: 18.x or higher

### 5. Environment Variables in Production
```bash
# In Vercel/Netlify Dashboard, add:
```
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `GROQ_API_KEY`
- [ ] `NEXT_PUBLIC_GEOAPIFY_API_KEY` (optional)
- [ ] `NODE_ENV=production`

### 6. Domain & SSL
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] Configure custom domain
- [ ] SSL certificate (auto with Vercel)
- [ ] Update Clerk allowed domains
- [ ] Update CORS settings if needed

---

## 📊 Post-Deployment

### 1. Production Testing
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] Test authentication flow
- [ ] Create test group
- [ ] Join group with 2+ users
- [ ] Generate locations
- [ ] Vote on locations
- [ ] Share link works
- [ ] Dashboard shows groups

### 2. Monitoring Setup
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up analytics (GA/Plausible)
- [ ] Create alerts for critical errors
- [ ] Monitor API usage

### 3. Performance
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] Run Lighthouse audit (target: 90+)
- [ ] Check Core Web Vitals
- [ ] Test on mobile devices
- [ ] Verify loading times
- [ ] Check bundle size

### 4. Security
```bash
# Status: [ ] Pending  [ ] Done
```
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly set
- [ ] API rate limits (if implemented)
- [ ] Review RLS policies in Supabase

---

## 🛡️ Ongoing Maintenance

### Weekly
- [ ] Check error logs
- [ ] Monitor API usage/quotas
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Review security advisories
- [ ] Check database performance
- [ ] Backup database

### As Needed
- [ ] Scale database resources
- [ ] Optimize slow queries
- [ ] Update API keys before expiry

---

## 🔥 Emergency Rollback

If critical issues in production:

### Option 1: Revert Deployment
```bash
# In Vercel dashboard:
# 1. Go to Deployments
# 2. Find last stable deployment
# 3. Click "..." → "Promote to Production"
```

### Option 2: Rollback Database
```sql
-- If migration caused issues:
ALTER TABLE "Member" RENAME COLUMN "clerkUserId" TO "firebaseUid";
```

### Option 3: Kill Switch
```bash
# In hosting dashboard, set:
MAINTENANCE_MODE=true
# Then show maintenance page
```

---

## 📝 Documentation URLs

After deployment, document:
- [ ] Production URL: `https://your-domain.com`
- [ ] Supabase Dashboard: `https://app.supabase.com/project/[id]`
- [ ] Clerk Dashboard: `https://dashboard.clerk.com/apps/[id]`
- [ ] Hosting Dashboard: `https://vercel.com/[team]/[project]`

---

## ✅ Sign-Off

**Deployment completed by:** _________________
**Date:** _________________
**Production URL:** _________________

**Verified by:** _________________
**Date:** _________________

---

## 🆘 Troubleshooting

### Common Production Issues

**Issue:** "Authentication required" on all API calls
**Fix:** Verify Clerk production keys are set correctly

**Issue:** Database queries failing
**Fix:** Check RLS policies, may need to adjust for production

**Issue:** Slow page loads
**Fix:** Enable caching, check API response times

**Issue:** "Too many requests"
**Fix:** Implement rate limiting or increase API quotas

---

**Version:** 1.0
**Last Updated:** 2025-12-01
