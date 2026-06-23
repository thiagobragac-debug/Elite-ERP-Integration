# Task 23.5 Quick Start: Test Sentry Error Tracking

**Task ID:** 23.5  
**Requirements:** 10.2, 10.3, 10.5, 10.6  
**Estimated Time:** 15 minutes

## Quick Setup (5 minutes)

### 1. Get Sentry DSN
```bash
# If you don't have a Sentry account:
1. Go to https://sentry.io/signup/
2. Create account and new React project
3. Copy the DSN (looks like: https://xxx@xxx.ingest.sentry.io/xxx)
```

### 2. Configure Environment
```bash
# Add to .env or .env.local
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
```

### 3. Build Production
```bash
npm run build
npm run preview
```

## Quick Test (10 minutes)

### 1. Access Test Page
- Open: `http://localhost:4173`
- Log in with valid credentials
- Navigate to: **Admin → Sentry Test** (or go to `/admin/sentry-test`)

### 2. Run Tests
Click **"Run All Tests"** button

### 3. Verify in Sentry Dashboard

Open your Sentry project dashboard and check:

**✅ Requirement 10.2: Error with Stack Trace**
- Go to Issues tab
- See errors appearing in real-time
- Click any error → verify full stack trace visible

**✅ Requirement 10.3: Context Enrichment**
- Click error → Tags section
- Verify `tenant_id` tag present
- Click User section → verify id, email, role
- Click Additional Data → verify tenant context

**✅ Requirement 10.6: Sensitive Data Filtering**
- Find "Sensitive Data Filtering" error
- Click → Additional Data
- Verify all sensitive fields show `[FILTERED]`:
  - password → `[FILTERED]`
  - api_key → `[FILTERED]`
  - token → `[FILTERED]`
  - card_number → `[FILTERED]`
  - cvv → `[FILTERED]`

**✅ Requirement 10.5: Session Replay**
- Click any error
- Look for "Replay" tab or button
- Click to view session replay
- Verify it shows user actions before error

## Success Criteria

All checkboxes should be ✅:
- [ ] Errors appear in Sentry dashboard
- [ ] Stack traces are complete
- [ ] Tenant context attached (tenant_id, name)
- [ ] User context attached (id, email, role)
- [ ] Sensitive data filtered as [FILTERED]
- [ ] Session replay available and working

## Common Issues

**🔴 "Development Mode" banner showing**
→ Run `npm run build && npm run preview` (not `npm run dev`)

**🔴 No errors in Sentry dashboard**
→ Check DSN is correctly set and browser console for Sentry errors

**🔴 Context not showing**
→ Ensure you're logged in and tenant is selected

**🔴 Sensitive data not filtered**
→ Check `src/lib/sentry.ts` beforeSend hook is present

## What's Next?

1. Check all boxes on the test page's requirements checklist
2. Take screenshots of Sentry dashboard for documentation
3. Mark task 23.5 as complete in tasks.md
4. Proceed to task 24.1 (Analytics integration)

## Full Documentation

For detailed testing procedures and troubleshooting, see:
- `docs/SENTRY_ERROR_TRACKING_GUIDE.md` - Comprehensive testing guide
- `docs/TASK_23.2_SENTRY_ENRICHMENT_COMPLETION.md` - Context enrichment details
- `docs/TASK_23.3_COMPLETION_SUMMARY.md` - Performance monitoring setup
- `docs/TASK_23.4_COMPLETION_SUMMARY.md` - Error boundary setup
