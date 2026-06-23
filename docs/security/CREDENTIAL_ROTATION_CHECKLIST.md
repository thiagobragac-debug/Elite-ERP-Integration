# Credential Rotation Checklist

**Priority:** 🔴 CRITICAL - Complete within 24 hours  
**Reason:** .env file was exposed in git history and has been removed  
**Date Created:** June 16, 2026

---

## Overview

This checklist guides you through rotating all credentials that were exposed in the git history. Follow each section carefully to ensure zero-downtime rotation.

**Related Guides:**
- **Task 2.2:** `QUICK_START_TASK_2.2.md` - Supabase key rotation (Quick Start)
- **Task 2.3:** `STRIPE_KEY_ROTATION_GUIDE.md` - Stripe key rotation (Detailed)
- **Task 2.4:** `DEPLOYMENT_AND_KEY_REVOCATION_GUIDE.md` - Deployment, monitoring, and revocation (This phase)

---

## 1. Supabase API Keys 🔑

### OLD KEY INFORMATION (For Documentation)
**Project Reference:** nmirpozhgcoabcjwgvqk  
**Project URL:** https://nmirpozhgcoabcjwgvqk.supabase.co  
**Old Anon Key (Last 8 chars):** ...60ocdak  
**Date Exposed:** Removed from git history on 2026-06-16  
**Status:** 🔴 REQUIRES IMMEDIATE ROTATION

### Step 1: Generate New Keys
1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **nmirpozhgcoabcjwgvqk**
3. Navigate to: **Settings** → **API**
4. Under "Project API keys" section:
   - Click **"Generate new anon key"** (or similar option to rotate the key)
   - Save the new key: `VITE_SUPABASE_ANON_KEY`
   - Click **"Generate new service role key"** (if used in backend scripts)
   - Save the new key: `SUPABASE_SERVICE_ROLE_KEY`

**IMPORTANT:** After generating new keys, you'll need to update them in:
- Local `.env` file
- GitHub Secrets (for CI/CD)
- Production hosting environment (Vercel/Netlify/etc.)

### Step 2: Update Development Environment
```bash
# Edit your local .env file
nano .env

# Update these variables:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=new_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=new_service_role_key_here  # if applicable
```

### Step 3: Test Locally
```bash
# Start the development server
npm run dev

# Verify:
# - Login works
# - Data loads correctly
# - No authentication errors in console
```

### Step 4: Update Production Environment
- [ ] **Hosting Platform** (Vercel/Netlify/etc.)
  - Go to your project settings
  - Navigate to Environment Variables
  - Update `VITE_SUPABASE_ANON_KEY`
  - Update `SUPABASE_SERVICE_ROLE_KEY` (if used)

- [ ] **CI/CD Secrets** (GitHub Actions)
  - Go to: Repository → Settings → Secrets and variables → Actions
  - Update `SUPABASE_ANON_KEY`
  - Update `SUPABASE_SERVICE_ROLE_KEY` (if used)

### Step 5: Grace Period (24-48 hours)
- Keep both old and new keys active
- Monitor logs for any systems still using old keys
- Identify and update any missed integrations

### Step 6: Revoke Old Keys
After 24-48 hours:
1. Return to Supabase Dashboard → Settings → API
2. Click **"Revoke"** next to the old keys
3. Verify production still works
4. Document revocation date: `__________`

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Completed

---

## 2. Stripe API Keys 💳

### Step 1: Generate New Keys
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to: **Developers** → **API keys**
3. Under "Standard keys":
   - Click **"Create secret key"**
   - Name it: `Tauze ERP - Rotated June 2026`
   - Save the new key: `STRIPE_SECRET_KEY`
4. Copy the **Publishable key**: `VITE_STRIPE_PUBLISHABLE_KEY`

### Step 2: Update Development Environment
```bash
# Edit your local .env file
nano .env

# Update these variables:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_new_key_here
STRIPE_SECRET_KEY=sk_test_new_key_here  # if used in backend
```

### Step 3: Test Locally
```bash
# Test payment flows
npm run dev

# Verify:
# - Stripe checkout works
# - Payments can be processed
# - Webhook events are received (if applicable)
```

### Step 4: Update Production Environment
- [ ] **Hosting Platform**
  - Update `VITE_STRIPE_PUBLISHABLE_KEY`
  - Update `STRIPE_SECRET_KEY` (if backend integration exists)

- [ ] **CI/CD Secrets**
  - Update `STRIPE_PUBLISHABLE_KEY`
  - Update `STRIPE_SECRET_KEY`

### Step 5: Update Webhook Secrets (if applicable)
If you have Stripe webhooks:
1. Go to: Developers → Webhooks
2. Click on your webhook endpoint
3. Click **"Roll secret"**
4. Update `STRIPE_WEBHOOK_SECRET` in all environments

### Step 6: Grace Period & Revocation
After 24-48 hours:
1. Return to Stripe Dashboard → Developers → API keys
2. Click **"Delete"** on the old keys
3. Verify production still works
4. Document revocation date: `__________`

**Old Key IDs to Document (for revocation):**
```
# Document the old keys before revoking (last 4 characters or key ID)
Old Publishable Key (pk_test_****): __________
Old Secret Key (sk_test_****): __________
Old Webhook Secret (whsec_****): __________
Date Documented: __________
```

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Completed

---

## 3. Other Third-Party Credentials 🔐

### Identify All Services
Review your `.env.example` file and list all third-party integrations:

- [ ] **Service:** ___________________
  - Dashboard URL: ___________________
  - Keys rotated: ⬜ Yes | ⬜ No
  - Date rotated: ___________________

- [ ] **Service:** ___________________
  - Dashboard URL: ___________________
  - Keys rotated: ⬜ Yes | ⬜ No
  - Date rotated: ___________________

- [ ] **Service:** ___________________
  - Dashboard URL: ___________________
  - Keys rotated: ⬜ Yes | ⬜ No
  - Date rotated: ___________________

### Common Services to Check
- [ ] Cepea Market Data API
- [ ] Email service (SendGrid, Mailgun, etc.)
- [ ] SMS service (Twilio, etc.)
- [ ] Analytics (PostHog, Mixpanel, etc.)
- [ ] Error tracking (Sentry)
- [ ] CDN/Storage (Cloudflare, AWS S3, etc.)

---

## 4. Secrets Management System 🏗️

### Option A: GitHub Secrets (Current - Basic)
- [x] Currently using GitHub Secrets for CI/CD
- [ ] All secrets updated in GitHub Actions

### Option B: HashiCorp Vault (Recommended - Advanced)
If implementing Vault for enhanced security:

1. [ ] Set up Vault server
2. [ ] Configure access policies
3. [ ] Migrate secrets from GitHub to Vault
4. [ ] Update CI/CD to fetch from Vault
5. [ ] Update application to fetch from Vault at runtime

### Option C: Cloud Provider Secrets Manager
- [ ] AWS Secrets Manager
- [ ] Google Cloud Secret Manager
- [ ] Azure Key Vault

**Selected Option:** ___________________

---

## 5. Dual-Key Support Testing ✅

### Purpose
Ensure zero-downtime rotation by supporting both old and new keys during grace period.

### Implementation (if needed)
```typescript
// Example: Support both keys during transition
const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY_NEW || 
  import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Test Cases
- [ ] Application works with new keys
- [ ] Application works with old keys (during grace period)
- [ ] Old keys can be revoked without breaking production
- [ ] No errors in monitoring/logging systems

---

## 6. Monitoring & Verification 📊

### During Grace Period
Monitor the following for 24-48 hours:

- [ ] **Supabase Dashboard**
  - Check: Settings → API → Usage
  - Look for: Unexpected API calls or errors
  - Action if suspicious: Revoke immediately

- [ ] **Stripe Dashboard**
  - Check: Developers → Events
  - Look for: Failed payment attempts
  - Action if suspicious: Contact Stripe support

- [ ] **Application Logs**
  - Check: Error monitoring (Sentry, etc.)
  - Look for: Authentication failures
  - Action if suspicious: Investigate source

- [ ] **CI/CD Pipelines**
  - Check: Recent workflow runs
  - Look for: Failed deployments due to auth
  - Action if failing: Update remaining secrets

### Post-Revocation Monitoring
After revoking old keys, monitor for 24 hours:

- [ ] No authentication errors
- [ ] No payment processing failures
- [ ] No CI/CD failures
- [ ] No user-reported issues

---

## 7. Documentation Updates 📝

After rotation is complete:

- [ ] Update `.env.example` with placeholder values
- [ ] Update team documentation with new key generation date
- [ ] Update disaster recovery runbook
- [ ] Document which systems use which keys
- [ ] Update onboarding guide for new developers

---

## 8. Team Communication 📢

### Before Starting
- [ ] Notify team of rotation schedule
- [ ] Announce expected downtime (if any)
- [ ] Assign roles/responsibilities

### During Rotation
- [ ] Update status in team chat
- [ ] Report any issues immediately
- [ ] Keep stakeholders informed

### After Completion
- [ ] Announce completion
- [ ] Share monitoring results
- [ ] Conduct post-mortem (if issues occurred)

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Generate new keys | 30 min | ⬜ |
| Update dev environment | 15 min | ⬜ |
| Test locally | 30 min | ⬜ |
| Update production | 1 hour | ⬜ |
| Grace period | 24-48h | ⬜ |
| Revoke old keys | 30 min | ⬜ |
| Post-revocation monitoring | 24h | ⬜ |

**Total Estimated Time:** 2-3 days (including grace period)

---

## Emergency Rollback Plan 🚨

If rotation causes production issues:

1. **Immediate Actions:**
   - Restore old keys in production environment
   - Restart affected services
   - Monitor for recovery

2. **Investigation:**
   - Identify which integration failed
   - Check logs for error details
   - Determine if old keys are still active

3. **Resolution:**
   - Fix the underlying issue
   - Test fix in staging
   - Retry rotation with fix applied

---

## Completion Checklist

- [ ] All Supabase keys rotated
- [ ] All Stripe keys rotated
- [ ] All other third-party keys rotated
- [ ] All environments updated (dev, staging, prod)
- [ ] All CI/CD secrets updated
- [ ] Grace period observed (24-48h)
- [ ] Old keys revoked
- [ ] Post-revocation monitoring completed
- [ ] No errors or suspicious activity detected
- [ ] Documentation updated
- [ ] Team notified of completion

**Completed By:** ___________________  
**Date:** ___________________  
**Verified By:** ___________________  

---

## Notes

Use this section to document any issues, decisions, or important information:

```
[Add your notes here]
```
