# Deployment & Key Revocation Guide - Task 2.4

**Date:** June 16, 2026  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 2-3 days (including 24-48h grace period)  

---

## Overview

This guide covers Phase 2 (Deployment with dual-key support) and Phase 3 (Key revocation) of the credential rotation process. By this point, you should have already:

✅ Generated new Supabase keys (Task 2.2)  
✅ Generated new Stripe keys (Task 2.3)  
✅ Updated local development environment  
✅ Tested locally with new keys  

**This guide covers:**
1. Deploying to production with new keys
2. Monitoring during the 24-48 hour grace period
3. Verifying all clients use new keys
4. Revoking old keys safely
5. Post-revocation validation

---

## Prerequisites

Before starting deployment, verify you have:

- [ ] ✅ New Supabase anon key ready
- [ ] ✅ New Supabase service role key ready (if used)
- [ ] ✅ New Stripe publishable key ready
- [ ] ✅ New Stripe secret key ready (if used)
- [ ] ✅ Documented old key IDs in `CREDENTIAL_ROTATION_CHECKLIST.md`
- [ ] ✅ Local testing passed with new keys
- [ ] ✅ Team notified of deployment schedule
- [ ] ✅ Rollback plan documented

---

## Phase 2: Deploy to Production with New Keys

### Step 1: Update Production Environment Variables


#### Option A: Vercel Deployment

1. **Log in to Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Environment Variables:**
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in sidebar

3. **Update Supabase Keys:**
   ```
   Variable: VITE_SUPABASE_URL
   Value: https://nmirpozhgcoabcjwgvqk.supabase.co
   Environment: ☑ Production ☑ Preview ☐ Development
   
   Variable: VITE_SUPABASE_ANON_KEY
   Value: [paste_new_anon_key_here]
   Environment: ☑ Production ☑ Preview ☐ Development
   ```

4. **Update Stripe Keys (if applicable):**
   ```
   Variable: VITE_STRIPE_PUBLISHABLE_KEY
   Value: [paste_new_publishable_key_here]
   Environment: ☑ Production ☑ Preview ☐ Development
   
   Variable: VITE_STRIPE_SECRET_KEY
   Value: [paste_new_secret_key_here]
   Environment: ☑ Production ☑ Preview ☐ Development
   ```

5. **Trigger Redeployment:**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** on the latest production deployment
   - Select **"Use existing Build Cache"**: ❌ Unchecked (force rebuild)
   - Click **"Redeploy"**

6. **Monitor Deployment:**
   - Wait for deployment to complete
   - Check build logs for errors
   - Verify deployment status: ✅ "Ready"


#### Option B: Netlify Deployment

1. **Log in to Netlify Dashboard:**
   - Go to: https://app.netlify.com
   - Select your site

2. **Navigate to Environment Variables:**
   - Click **"Site settings"**
   - Click **"Environment variables"** in sidebar

3. **Update Environment Variables:**
   - Click **"Add a variable"** or edit existing ones
   - Update same keys as Vercel option above

4. **Trigger Redeployment:**
   - Go to **"Deploys"** tab
   - Click **"Trigger deploy"** → **"Clear cache and deploy site"**

5. **Monitor Deployment:**
   - Wait for deployment to complete
   - Check deploy logs
   - Verify site status: ✅ "Published"

#### Option C: Self-Hosted / VPS

1. **SSH into your server:**
   ```bash
   ssh user@your-server.com
   ```

2. **Navigate to application directory:**
   ```bash
   cd /var/www/tauze-erp
   ```

3. **Update environment file:**
   ```bash
   # Edit production .env file
   sudo nano .env.production
   
   # Update keys:
   VITE_SUPABASE_URL=https://nmirpozhgcoabcjwgvqk.supabase.co
   VITE_SUPABASE_ANON_KEY=[new_key_here]
   VITE_STRIPE_PUBLISHABLE_KEY=[new_key_here]
   ```

4. **Rebuild and restart:**
   ```bash
   npm run build
   sudo systemctl restart tauze-erp
   # or pm2 restart tauze-erp
   ```


### Step 2: Update CI/CD Secrets (GitHub Actions)

1. **Go to GitHub Repository:**
   - Navigate to: `Settings` → `Secrets and variables` → `Actions`

2. **Update Repository Secrets:**
   
   **Supabase Secrets:**
   ```
   Secret Name: SUPABASE_URL
   Value: https://nmirpozhgcoabcjwgvqk.supabase.co
   
   Secret Name: SUPABASE_ANON_KEY
   Value: [new_anon_key_here]
   
   Secret Name: SUPABASE_SERVICE_ROLE_KEY (if used)
   Value: [new_service_role_key_here]
   ```
   
   **Stripe Secrets (if applicable):**
   ```
   Secret Name: STRIPE_PUBLISHABLE_KEY
   Value: [new_publishable_key_here]
   
   Secret Name: STRIPE_SECRET_KEY
   Value: [new_secret_key_here]
   ```

3. **Verify Secrets Updated:**
   - Click on each secret name
   - Verify "Updated X seconds ago"

4. **Trigger a Workflow Run:**
   - Go to **"Actions"** tab
   - Select your workflow
   - Click **"Run workflow"** → **"Run workflow"**
   - Monitor for successful completion

**Status:** ⬜ Not Started | ⬜ In Progress | ✅ Completed  
**Completion Time:** ___________


### Step 3: Verify Production Deployment

**Immediate Checks (5 minutes after deployment):**

1. **Test Application Access:**
   ```bash
   # Open production URL
   https://your-production-domain.com
   ```
   - [ ] ✅ App loads successfully
   - [ ] ✅ No blank pages or crashes
   - [ ] ✅ No console errors visible

2. **Test Authentication:**
   - [ ] ✅ Login page displays
   - [ ] ✅ Can log in with test credentials
   - [ ] ✅ User session persists
   - [ ] ✅ Protected routes work

3. **Test Data Loading:**
   - [ ] ✅ Dashboard displays
   - [ ] ✅ Data loads from Supabase
   - [ ] ✅ Tables populate correctly
   - [ ] ✅ No "Failed to load" errors

4. **Test Stripe Integration (if applicable):**
   - [ ] ✅ Billing/subscription page loads
   - [ ] ✅ Stripe checkout can be initiated
   - [ ] ✅ No Stripe configuration errors

5. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for errors related to:
     - Supabase authentication
     - API calls
     - Stripe initialization
   - [ ] ✅ No critical errors

**Document Results:**
```
Deployment Time: ___________
Verification Completed: ___________
Issues Found: ☐ None  ☐ See notes below

Notes:
___________________________________________
```


---

## Grace Period: 24-48 Hour Monitoring

**START TIME:** ___________  
**END TIME (24h):** ___________  
**END TIME (48h):** ___________  

### Why the Grace Period?

The grace period ensures:
- All client applications transition to new keys
- Any missed integrations are identified
- Production issues can be caught before old keys are revoked
- Zero-downtime rotation is achieved

### Monitoring Checklist

#### Hour 1 (Immediate Post-Deployment)

- [ ] **Production Access Test**
  - Try from different devices/networks
  - Test mobile responsiveness
  - Verify no geographic access issues

- [ ] **Authentication Flow Test**
  - Test login from multiple user accounts
  - Test signup flow
  - Test password reset
  - Test session persistence

- [ ] **Critical Operations Test**
  - Create a new record (animal, payment, etc.)
  - Update an existing record
  - Delete a test record
  - Run a report

**Issues Found:** ___________


#### Hours 2-6 (Active Monitoring)

- [ ] **Supabase Dashboard Monitoring**
  - Go to: https://app.supabase.com
  - Navigate to: Settings → API → Usage
  - Check:
    - Total API requests (should be normal)
    - Error rate (should be <1%)
    - No suspicious authentication failures
  
- [ ] **Stripe Dashboard Monitoring (if applicable)**
  - Go to: https://dashboard.stripe.com
  - Navigate to: Developers → Events
  - Check:
    - Recent API calls are successful
    - No 401/403 authentication errors
    - Payment events processing normally

- [ ] **Application Error Logs**
  - Check hosting platform logs (Vercel/Netlify)
  - Look for:
    - Supabase connection errors
    - Stripe API errors
    - Unexpected 401/403 responses
  - Filter by: Last 6 hours

- [ ] **User Reports**
  - Monitor support channels
  - Check for:
    - Login failures
    - Data not loading
    - Payment processing issues
  - Response time: <30 minutes

**Issues Found:** ___________


#### Day 1 (24 Hours Post-Deployment)

- [ ] **Comprehensive Service Check**
  - Review all monitoring data from first 24h
  - Identify any patterns or anomalies
  - Check peak usage times for issues

- [ ] **Supabase Analytics Review**
  - Go to: Supabase Dashboard → Reports
  - Check:
    - Database query performance
    - Auth success rate (should be >99%)
    - API response times
    - No degradation compared to pre-rotation

- [ ] **CI/CD Pipeline Check**
  - Verify recent workflow runs succeeded
  - Check that all environments use new keys
  - No authentication failures in build logs

- [ ] **Third-Party Integrations**
  - Test any external systems that call your API
  - Verify webhooks are working
  - Check scheduled jobs/cron tasks

- [ ] **Performance Metrics**
  - Page load times unchanged
  - API response times normal
  - No increase in error rates

**24-Hour Summary:**
```
Total Issues: ___________
Critical Issues: ___________
User Impact: ☐ None  ☐ Minimal  ☐ Moderate  ☐ Severe
Ready for Key Revocation: ☐ Yes  ☐ No (need more monitoring)
```


#### Day 2 (48 Hours Post-Deployment - Optional Extended Monitoring)

**When to extend to 48 hours:**
- Minor issues detected in first 24h
- High-traffic system with multiple integrations
- Extra caution needed for critical business operations
- Deployment happened on Friday (wait until Monday)

- [ ] **Extended Monitoring Checks**
  - Review all metrics from hours 24-48
  - Verify previous issues resolved
  - Confirm stable error rates
  - No new authentication failures

- [ ] **Load Testing (Optional)**
  - Test system under typical load
  - Verify performance unchanged
  - Check database connection pool

- [ ] **Final Decision Point**
  ```
  All Checks Passed: ☐ Yes  ☐ No
  User Feedback: ☐ Positive  ☐ Neutral  ☐ Negative
  System Stability: ☐ Stable  ☐ Minor Issues  ☐ Unstable
  
  Decision: ☐ Proceed with Revocation  ☐ Extend Monitoring  ☐ Rollback
  ```

**48-Hour Summary:**
```
Extended Monitoring Reason: ___________
Issues Resolved: ___________
Confidence Level: ☐ High  ☐ Medium  ☐ Low
Approved By: ___________
```


---

## Phase 3: Verify All Clients Using New Keys

Before revoking old keys, confirm that ALL systems have migrated:

### Verification Checklist

#### 1. Supabase API Usage Analysis

**Check Key Usage Statistics:**

1. **Go to Supabase Dashboard:**
   - Navigate to: Settings → API → Usage

2. **Analyze API Calls by Key:**
   - Look for usage breakdown by key
   - Verify: NEW key shows recent activity
   - Verify: OLD key shows zero activity (or declining)

3. **Check Authentication Logs:**
   - Navigate to: Authentication → Logs
   - Filter by: Last 24-48 hours
   - Verify: All auth requests use new key

**Documentation:**
```
Old Key Last Used: ___________
New Key Active Since: ___________
Old Key Zero Activity Confirmed: ☐ Yes  ☐ No
```

#### 2. Stripe API Usage Analysis (if applicable)

1. **Go to Stripe Dashboard:**
   - Navigate to: Developers → Events

2. **Filter Recent Events:**
   - Filter by: Last 48 hours
   - Check: All events show new key metadata

3. **Check for Old Key Usage:**
   - Search for any 401/403 errors
   - Verify no old key authentication attempts


#### 3. Environment Verification

**Verify all environments updated:**

- [ ] **Production:**
  - Hosting platform (Vercel/Netlify): ✅ Updated
  - Environment variables verified: ✅
  - Latest deployment uses new keys: ✅

- [ ] **Staging/Preview:**
  - Environment variables updated: ✅
  - Test deployment successful: ✅

- [ ] **CI/CD Pipelines:**
  - GitHub Actions secrets: ✅ Updated
  - Latest workflow runs succeeded: ✅
  - No old key references in logs: ✅

- [ ] **Development:**
  - Local `.env` files updated: ✅ (handled in Task 2.2/2.3)
  - Team members notified: ✅
  - Documentation updated: ✅

#### 4. Third-Party Integration Check

**Check any systems that integrate with your app:**

- [ ] **Mobile Apps** (if applicable)
  - iOS app: ☐ N/A  ☐ Updated  ☐ Pending
  - Android app: ☐ N/A  ☐ Updated  ☐ Pending

- [ ] **External APIs/Webhooks**
  - Webhook endpoints: ☐ N/A  ☐ Verified  ☐ Issues
  - Scheduled jobs: ☐ N/A  ☐ Verified  ☐ Issues

- [ ] **Partner Integrations**
  - List partners: ___________
  - Status: ☐ N/A  ☐ Notified  ☐ Confirmed Updated


#### 5. Final Pre-Revocation Checklist

**Before proceeding to revocation, confirm:**

- [ ] ✅ Grace period completed (24-48h)
- [ ] ✅ All monitoring checks passed
- [ ] ✅ No active issues or errors
- [ ] ✅ All environments using new keys
- [ ] ✅ No old key usage detected
- [ ] ✅ User feedback positive or neutral
- [ ] ✅ Team approved to proceed
- [ ] ✅ Rollback plan ready (just in case)

**Final Approval:**
```
Approved By: ___________
Date: ___________
Time: ___________
```

**If ANY checkbox is unchecked, DO NOT proceed with revocation!**

---

## Phase 4: Revoke Old Keys

**⚠️ CRITICAL: This action is IRREVERSIBLE!**

Only proceed after ALL verification steps pass.

### Revoke Supabase Keys

1. **Log in to Supabase Dashboard:**
   - Go to: https://app.supabase.com
   - Select project: **nmirpozhgcoabcjwgvqk**

2. **Navigate to API Settings:**
   - Go to: Settings → API

3. **Revoke Old Anon Key:**
   - Find the OLD anon key in the list
   - Click **"Revoke"** or **"Delete"** button
   - Confirm the action when prompted
   - Verify: Key status shows "Revoked" or removed from list

4. **Revoke Old Service Role Key (if applicable):**
   - Locate OLD service role key
   - Click **"Revoke"**
   - Confirm the action

5. **Document Revocation:**
   ```
   Old Anon Key Revoked: ___________
   Old Service Role Key Revoked: ___________
   Revocation Date: ___________
   Revoked By: ___________
   ```

### Revoke Stripe Keys (if applicable)

1. **Log in to Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com

2. **Navigate to API Keys:**
   - Go to: Developers → API keys

3. **Delete Old Secret Key:**
   - Find the OLD secret key in the list
   - Click the **"⋮"** (three dots) menu
   - Select **"Delete"**
   - Confirm deletion

4. **Note on Publishable Key:**
   - Old publishable key is automatically invalidated
   - No separate action needed

5. **Document Revocation:**
   ```
   Old Secret Key Deleted: ___________
   Deletion Date: ___________
   Deleted By: ___________
   ```

### Remove Old Keys from Documentation

1. **Update `.env.example`:**
   - Verify it has placeholder values only
   - No actual keys should be present
   - Already correct ✅

2. **Clear Temporary Storage:**
   - Remove old keys from password managers
   - Delete any temporary notes with old keys
   - Clear clipboard history


---

## Post-Revocation Validation (Critical!)

**IMMEDIATELY after revoking keys, perform these checks:**

### Immediate Checks (Within 5 Minutes)

1. **Test Production Application:**
   ```bash
   # Open production URL
   https://your-production-domain.com
   ```
   - [ ] ✅ App loads successfully
   - [ ] ✅ Login works
   - [ ] ✅ Data loads from Supabase
   - [ ] ✅ No authentication errors

2. **Test Critical User Flows:**
   - [ ] ✅ User can view dashboard
   - [ ] ✅ User can create new record
   - [ ] ✅ User can update existing record
   - [ ] ✅ User can delete record
   - [ ] ✅ User can logout and login again

3. **Check Browser Console:**
   - [ ] ✅ No 401/403 errors
   - [ ] ✅ No Supabase authentication errors
   - [ ] ✅ No Stripe errors (if applicable)

4. **Monitor Error Logs:**
   - Check hosting platform logs
   - Look for sudden spike in errors
   - Verify no authentication failures

**If ANY issue detected, proceed to Emergency Rollback!**


### Extended Monitoring (Next 24 Hours)

#### Hour 1 Post-Revocation

- [ ] **User Activity Monitoring**
  - Monitor active user sessions
  - Check for login issues
  - Verify no user-reported problems

- [ ] **System Health Check**
  - API response times normal
  - Database performance unchanged
  - No increase in error rates

#### Hours 2-6 Post-Revocation

- [ ] **Supabase Dashboard Check**
  - Go to: Settings → API → Usage
  - Verify: Only NEW key showing activity
  - Check: Error rate remains <1%

- [ ] **Application Logs Review**
  - Check for any authentication errors
  - Monitor API call success rates
  - Verify no degradation

#### Hour 24 Post-Revocation

- [ ] **Comprehensive Review**
  - Review all metrics from last 24h
  - Confirm no issues reported
  - Verify system stability

**24-Hour Post-Revocation Summary:**
```
Issues Found: ☐ None  ☐ Minor  ☐ Critical
User Impact: ☐ None  ☐ Minimal  ☐ Significant
System Stability: ☐ Stable  ☐ Minor Issues  ☐ Unstable

Status: ☐ Success  ☐ Monitoring Continue  ☐ Issues Detected
```


---

## Update Audit Log

After successful revocation, document the complete rotation:

### Create Audit Log Entry

1. **Open `CREDENTIAL_ROTATION_CHECKLIST.md`**

2. **Update Supabase Section:**
   ```markdown
   ## 1. Supabase API Keys 🔑
   
   **Status:** ✅ Completed
   
   **Key Rotation Details:**
   - Old Key Last 8 chars: ...60ocdak
   - New Key Generated: [Date/Time]
   - Deployed to Production: [Date/Time]
   - Grace Period: [Start Date] to [End Date]
   - Old Key Revoked: [Date/Time]
   - Post-Revocation Validation: ✅ Passed
   
   **Completed By:** [Name]
   **Verified By:** [Name]
   ```

3. **Update Stripe Section (if applicable):**
   ```markdown
   ## 2. Stripe API Keys 💳
   
   **Status:** ✅ Completed
   
   **Key Rotation Details:**
   - Old Secret Key (last 4): sk_test_****
   - New Key Generated: [Date/Time]
   - Deployed to Production: [Date/Time]
   - Grace Period: [Start Date] to [End Date]
   - Old Key Deleted: [Date/Time]
   - Post-Revocation Validation: ✅ Passed
   
   **Completed By:** [Name]
   **Verified By:** [Name]
   ```


4. **Update Completion Checklist:**
   ```markdown
   ## Completion Checklist
   
   - [x] All Supabase keys rotated
   - [x] All Stripe keys rotated (if applicable)
   - [x] All environments updated (dev, staging, prod)
   - [x] All CI/CD secrets updated
   - [x] Grace period observed (24-48h)
   - [x] All clients verified using new keys
   - [x] Old keys revoked
   - [x] Post-revocation monitoring completed (24h)
   - [x] No errors or suspicious activity detected
   - [x] Documentation updated
   - [x] Team notified of completion
   
   **Rotation Completed:** ✅
   **Completion Date:** [Date]
   **Total Duration:** [X days]
   ```

### Create Permanent Audit Record

**Option 1: Create Audit Log File**

Create a file: `CREDENTIAL_ROTATION_AUDIT_[DATE].md`

```markdown
# Credential Rotation Audit Log

**Rotation Date:** June 16-18, 2026
**Reason:** Git history cleanup after .env exposure
**Completed By:** [Name]

## Summary

All credentials exposed in git history were successfully rotated
following zero-downtime procedure.

## Services Rotated

### Supabase
- Project: nmirpozhgcoabcjwgvqk
- Keys Rotated: Anon key, Service role key
- Revocation Date: [Date]
- Status: ✅ Success

### Stripe
- Keys Rotated: Secret key, Publishable key
- Revocation Date: [Date]
- Status: ✅ Success

## Timeline

- [Date Time]: New keys generated
- [Date Time]: Deployed to production
- [Date Time]: Grace period started (48h)
- [Date Time]: Verified all clients using new keys
- [Date Time]: Old keys revoked
- [Date Time]: Post-revocation validation completed
- [Date Time]: Rotation marked complete

## Issues Encountered

[List any issues and how they were resolved]

## Lessons Learned

[Document any insights for future rotations]
```


**Option 2: Add to Git (Recommended)**

```bash
# Create audit log
git add CREDENTIAL_ROTATION_AUDIT_[DATE].md

# Commit with clear message
git commit -m "docs: Add credential rotation audit log"

# Push to repository
git push origin main
```

---

## Emergency Rollback Plan

**⚠️ Use ONLY if production breaks after revocation**

### Scenario: Old Keys Already Revoked and App Broken

**Immediate Actions:**

1. **Generate Emergency Temporary Keys:**
   
   **Supabase:**
   - Go to: Supabase Dashboard → Settings → API
   - Generate NEW temporary keys immediately
   - Update production environment variables
   - Redeploy

   **Stripe:**
   - Go to: Stripe Dashboard → Developers → API keys
   - Create NEW temporary keys
   - Update production environment variables
   - Redeploy

2. **Emergency Deployment:**
   ```bash
   # If self-hosted, SSH and update immediately
   ssh user@server
   nano .env.production
   # Update keys
   npm run build && pm2 restart app
   ```

3. **Verify Recovery:**
   - Test login works
   - Test data loads
   - Verify no errors

4. **Post-Recovery Investigation:**
   - Identify root cause
   - Document what went wrong
   - Plan corrective actions
   - Schedule re-rotation when ready


### Scenario: Need to Restore Old Keys (If Still Active)

**Only possible DURING grace period BEFORE revocation:**

1. **Revert Environment Variables:**
   - Go to hosting platform settings
   - Restore OLD key values
   - Redeploy

2. **Investigate Issue:**
   - Identify why new keys failed
   - Check for configuration errors
   - Verify keys were copied correctly

3. **Fix and Retry:**
   - Correct the issue
   - Re-deploy with NEW keys
   - Restart grace period monitoring

---

## Common Issues and Solutions

### Issue 1: "401 Unauthorized" after deployment

**Symptoms:**
- Users can't log in
- API calls failing
- Console shows Supabase auth errors

**Causes:**
- New key not updated in all environments
- Key copied incorrectly (with spaces/truncation)
- Key not activated in Supabase

**Solutions:**
1. Verify key in environment variables (check for extra spaces)
2. Confirm key is active in Supabase Dashboard
3. Redeploy with correct key
4. Clear browser cache and retry


### Issue 2: Stripe checkout not working

**Symptoms:**
- Checkout button does nothing
- Stripe errors in console
- Payment flow broken

**Causes:**
- Publishable key not updated
- Webhook secret not rotated
- Test/live mode mismatch

**Solutions:**
1. Verify `VITE_STRIPE_PUBLISHABLE_KEY` updated
2. Check Stripe Dashboard for webhook events
3. Ensure using matching test/live keys
4. Verify webhook secret updated if using webhooks

### Issue 3: CI/CD pipeline failing

**Symptoms:**
- Automated deployments failing
- GitHub Actions showing auth errors
- Build process breaking

**Causes:**
- GitHub Secrets not updated
- Old keys in workflow YAML files
- Environment mismatch

**Solutions:**
1. Update ALL GitHub Secrets (not just one)
2. Verify secrets in: Settings → Secrets and variables → Actions
3. Trigger manual workflow run
4. Check workflow logs for specific errors

### Issue 4: Some users still experiencing issues

**Symptoms:**
- Most users fine, some having problems
- Intermittent authentication failures
- Geographic-specific issues

**Causes:**
- CDN cache serving old build
- Browser cache with old keys
- Sticky sessions with old tokens

**Solutions:**
1. Clear CDN cache in hosting platform
2. Instruct affected users to hard refresh (Ctrl+Shift+R)
3. Clear browser localStorage and cookies
4. Wait for session tokens to expire naturally


---

## Team Communication Template

### Deployment Announcement (Send BEFORE deployment)

```
Subject: Scheduled Credential Rotation - [Date/Time]

Team,

We will be rotating API credentials on [Date] at [Time] due to the 
recent Git history cleanup. 

Expected Impact: NONE (zero-downtime rotation)
Duration: 5 minutes deployment + 24-48h monitoring

Timeline:
- [Time]: Deploy new keys to production
- [Time]: Verify deployment
- [Date +24h]: Begin key revocation process
- [Date +48h]: Complete rotation

What you need to do:
- Nothing! This should be transparent
- Report any issues immediately to [Contact]

We'll send updates throughout the process.

Thanks,
[Name]
```

### Grace Period Update (Send after successful deployment)

```
Subject: Credential Rotation - Monitoring in Progress

Team,

✅ New keys deployed successfully at [Time]
✅ All systems operational
✅ No issues detected

We're now in the 24-48h grace period monitoring phase.

Please report any issues:
- Authentication problems
- Data loading errors
- Payment processing issues

Next Update: [Tomorrow at same time]

Thanks,
[Name]
```


### Completion Announcement (Send after successful revocation)

```
Subject: Credential Rotation Complete ✅

Team,

The credential rotation process is now complete!

Summary:
✅ New keys deployed: [Date/Time]
✅ Grace period: 48 hours
✅ Old keys revoked: [Date/Time]
✅ Post-revocation validation: Passed
✅ Zero downtime achieved

Statistics:
- Total duration: [X days]
- Issues encountered: [None/Minor/Resolved]
- User impact: None
- System uptime: 100%

All systems are operating normally with new credentials.

Audit log: CREDENTIAL_ROTATION_AUDIT_[DATE].md

Thanks for your support during this process!

[Name]
```

---

## Checklist Summary

Use this high-level checklist to track overall progress:

### Phase 2: Deployment
- [ ] Update production environment variables
- [ ] Update CI/CD secrets
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Test critical functionality
- [ ] Begin grace period monitoring

### Grace Period: Monitoring
- [ ] Hour 1: Immediate post-deployment checks
- [ ] Hours 2-6: Active monitoring
- [ ] Day 1 (24h): Comprehensive review
- [ ] Day 2 (48h): Extended monitoring (if needed)
- [ ] Document all monitoring results


### Phase 3: Verification
- [ ] Analyze Supabase API usage
- [ ] Analyze Stripe API usage (if applicable)
- [ ] Verify all environments updated
- [ ] Check third-party integrations
- [ ] Complete pre-revocation checklist
- [ ] Get final approval

### Phase 4: Revocation
- [ ] Revoke Supabase old keys
- [ ] Delete Stripe old keys (if applicable)
- [ ] Remove old keys from documentation
- [ ] Test production immediately after revocation
- [ ] Monitor for 24 hours post-revocation

### Phase 5: Documentation
- [ ] Update CREDENTIAL_ROTATION_CHECKLIST.md
- [ ] Create audit log file
- [ ] Commit audit log to repository
- [ ] Notify team of completion
- [ ] Document lessons learned

**Overall Status:** ⬜ Not Started | ⬜ In Progress | ✅ Completed  
**Completion Date:** ___________  
**Completed By:** ___________  

---

## Additional Resources

- **Supabase Key Management:** https://supabase.com/docs/guides/api/api-keys
- **Stripe Key Rotation:** https://docs.stripe.com/keys#key-rollover
- **Task 2.2 Guide:** `QUICK_START_TASK_2.2.md`
- **Task 2.3 Guide:** `STRIPE_KEY_ROTATION_GUIDE.md`
- **Full Checklist:** `CREDENTIAL_ROTATION_CHECKLIST.md`

---

## Notes and Observations

Use this section to document anything specific to your rotation:

```
Date: ___________
Notes:


Issues Encountered:


Lessons Learned:


Recommendations for Future:


```

---

**End of Guide**

