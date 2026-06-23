# Stripe API Key Rotation Guide - Task 2.3

**Date:** June 16, 2026  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 2-3 hours (including testing)  

---

## Overview

This guide walks you through rotating Stripe API keys that may have been exposed in the Git history. Even though Stripe keys are **optional** in this project (the app works without them), it's critical to rotate them if they were ever committed to version control.

---

## Current Status

**Stripe Integration Status:** ✅ Configured but Optional
- Stripe is integrated for subscription/payment features
- Keys are marked as optional in `validateEnv.ts`
- App will display a toast error if Stripe features are used without keys configured

**Current Configuration:**
- ❌ No Stripe keys found in current `.env` file
- ✅ Placeholder keys exist in `.env.example`
- ✅ Stripe integration code exists in `src/lib/stripe.ts`

---

## Step-by-Step Rotation Process

### Phase 1: Access Stripe Dashboard

1. **Open the Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com
   - Log in with your Stripe account credentials

2. **Navigate to API Keys:**
   - Click on **"Developers"** in the left sidebar
   - Click on **"API keys"**

---

### Phase 2: Document OLD Keys (Before Creating New Ones)

**IMPORTANT:** Document your current keys before generating new ones!

1. **Identify Your Current Keys:**
   - Look at the "Standard keys" section
   - You'll see:
     - **Publishable key:** Starts with `pk_test_` (test mode) or `pk_live_` (live mode)
     - **Secret key:** Starts with `sk_test_` or `sk_live_` (hidden until revealed)

2. **Document the Key IDs:**
   ```
   Old Publishable Key: pk_test_****_____________[last 4 chars]
   Old Secret Key ID: sk_test_****_____________[last 4 chars]
   Date Documented: [Today's Date]
   ```

3. **Update the Rotation Checklist:**
   - Open `CREDENTIAL_ROTATION_CHECKLIST.md`
   - Find "Section 2: Stripe API Keys"
   - Fill in the "Old Key IDs to Document" section

---

### Phase 3: Generate NEW Stripe Keys

#### 3.1 Generate New Secret Key

1. In the Stripe Dashboard → Developers → API keys
2. Under "Standard keys" section, find "Secret key"
3. Click **"Create secret key"**
4. In the modal:
   - **Name:** `Tauze ERP - Rotated June 2026`
   - **Description:** `Key rotation after Git history cleanup`
5. Click **"Create"**
6. **IMPORTANT:** Copy the key immediately - it won't be shown again!
   ```
   sk_test_[your_new_secret_key_here]
   ```
7. Save this key temporarily in a secure location (password manager)

#### 3.2 Copy New Publishable Key

1. The publishable key is automatically updated when you create a secret key
2. Copy the **"Publishable key"** shown on the page:
   ```
   pk_test_[your_new_publishable_key_here]
   ```

#### 3.3 Generate New Webhook Secret (If Webhooks Are Used)

**Check if you're using webhooks:**
1. Go to: Developers → Webhooks
2. If you see any webhook endpoints listed, proceed with rotation:
   - Click on your webhook endpoint
   - Click **"Roll secret"**
   - Copy the new webhook secret:
     ```
     whsec_[your_new_webhook_secret_here]
     ```

---

### Phase 4: Update Local Development Environment

1. **Open your local `.env` file:**
   ```bash
   # On Windows PowerShell:
   notepad .env
   
   # Or use VS Code:
   code .env
   ```

2. **Add the new Stripe keys:**
   ```dotenv
   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_new_key_here
   VITE_STRIPE_SECRET_KEY=sk_test_your_new_key_here
   VITE_STRIPE_WEBHOOK_SECRET=whsec_your_new_webhook_secret_here
   ```

3. **Save the file**

4. **Verify .env is gitignored:**
   ```bash
   # Check that .env is in .gitignore
   cat .gitignore | grep "^\.env$"
   
   # Should return: .env
   ```

---

### Phase 5: Test Locally

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test Stripe Integration:**
   
   **If you have a subscription/payment flow in the app:**
   - Navigate to the billing or subscription page
   - Try to create a checkout session
   - Verify no errors appear in the browser console
   - Use Stripe's test card: `4242 4242 4242 4242`
   
   **If you don't have an active payment flow:**
   - Check the browser console for any Stripe-related errors
   - Verify the app starts without Stripe configuration errors

3. **Expected Results:**
   - ✅ App starts successfully
   - ✅ No "Stripe não configurado" toast errors
   - ✅ Checkout flow works (if tested)
   - ✅ No console errors related to Stripe

---

### Phase 6: Update Production Environment

#### Option A: Hosting Platform (Vercel/Netlify/etc.)

1. **Log in to your hosting platform**

2. **Navigate to Environment Variables:**
   - **Vercel:** Project Settings → Environment Variables
   - **Netlify:** Site Settings → Environment variables
   - **Render:** Environment → Environment Variables

3. **Update/Add the following variables:**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY = pk_test_your_new_key_here
   VITE_STRIPE_SECRET_KEY = sk_test_your_new_key_here
   VITE_STRIPE_WEBHOOK_SECRET = whsec_your_new_webhook_secret_here
   ```

4. **Set for which environments:**
   - ✅ Production
   - ✅ Preview (if applicable)
   - ⬜ Development (use local .env)

5. **Trigger a new deployment** (if not automatic)

#### Option B: CI/CD Secrets (GitHub Actions)

1. **Go to your GitHub repository**

2. **Navigate to:** Settings → Secrets and variables → Actions

3. **Update Repository Secrets:**
   - Click "New repository secret" or edit existing ones
   - Add:
     ```
     Name: STRIPE_PUBLISHABLE_KEY
     Value: pk_test_your_new_key_here
     
     Name: STRIPE_SECRET_KEY
     Value: sk_test_your_new_key_here
     
     Name: STRIPE_WEBHOOK_SECRET
     Value: whsec_your_new_webhook_secret_here
     ```

---

### Phase 7: Grace Period & Monitoring (24-48 Hours)

**Purpose:** Allow time to identify any missed integrations still using old keys.

1. **Keep OLD keys active in Stripe for 24-48 hours**
   - Don't revoke/delete them yet!

2. **Monitor the following:**

   **Stripe Dashboard:**
   - Go to: Developers → Events
   - Look for: Any failed API calls
   - Filter by: Date range (last 24 hours)
   
   **Application Logs:**
   - Check: Browser console for Stripe errors
   - Check: Server logs (if backend uses Stripe)
   - Check: Error monitoring (Sentry, if configured)
   
   **CI/CD Pipelines:**
   - Verify: Recent deployments succeeded
   - Check: No authentication failures in workflow logs

3. **Document monitoring results:**
   ```
   Monitoring Start: ___________
   Monitoring End: ___________
   Issues Found: ☐ None  ☐ See notes below
   
   Notes:
   ___________________________________________
   ```

---

### Phase 8: Revoke OLD Keys (After 24-48h Grace Period)

**⚠️ ONLY proceed after grace period and successful monitoring!**

1. **Return to Stripe Dashboard → Developers → API keys**

2. **Revoke the OLD Secret Key:**
   - Find the old secret key in the list
   - Click the **"⋮"** (three dots) menu
   - Click **"Delete"**
   - Confirm deletion

3. **Note:** The old publishable key will automatically be invalidated when the secret key is deleted

4. **If you rotated Webhook Secrets:**
   - The old webhook secret is automatically invalidated when rolled
   - No additional action needed

5. **Verify Production Still Works:**
   - Test the checkout flow in production
   - Check for any errors in monitoring
   - Verify no user-reported issues

6. **Document Revocation:**
   ```
   Revocation Date: ___________
   Revoked By: ___________
   Production Status After Revocation: ☐ Working  ☐ Issues (see notes)
   ```

---

### Phase 9: Update Documentation

1. **Update `.env.example` (if needed):**
   - Verify it has placeholder Stripe keys
   - Already exists and is correct ✅

2. **Update CREDENTIAL_ROTATION_CHECKLIST.md:**
   - Mark "Section 2: Stripe API Keys" as ✅ Completed
   - Fill in all documentation fields
   - Add completion date

3. **Update Team Documentation:**
   - Notify team members of new keys (if applicable)
   - Update any internal wikis or runbooks
   - Document the rotation date for future reference

---

## Troubleshooting

### Issue: "Stripe não configurado" error appears

**Solution:**
1. Verify `.env` file has the keys
2. Restart the development server (`npm run dev`)
3. Check that keys start with `pk_test_` and `sk_test_`

### Issue: Checkout flow fails with 401 Unauthorized

**Solution:**
1. Verify you copied the complete key (no truncation)
2. Check for extra spaces or line breaks in `.env`
3. Ensure keys are from the same Stripe account
4. Verify secret key hasn't been revoked

### Issue: Webhooks failing after rotation

**Solution:**
1. Verify you rotated the webhook secret
2. Update the webhook secret in all environments
3. Check webhook signature validation code
4. Test webhook delivery in Stripe Dashboard

---

## Emergency Rollback

If rotation causes production issues:

1. **Immediately restore OLD keys:**
   - Go to your hosting platform environment variables
   - Replace with old keys (if you documented them)
   
2. **In Stripe Dashboard:**
   - Old keys should still be active during grace period
   - If already revoked, create new temporary keys

3. **Trigger redeployment**

4. **Investigate the root cause:**
   - Check error logs
   - Identify which integration failed
   - Fix the issue before retrying rotation

---

## Completion Checklist

- [ ] Accessed Stripe Dashboard
- [ ] Documented OLD key IDs
- [ ] Generated NEW secret key
- [ ] Copied NEW publishable key
- [ ] Rotated webhook secret (if applicable)
- [ ] Updated local `.env` file
- [ ] Tested locally - checkout flow works
- [ ] Updated production environment variables
- [ ] Updated CI/CD secrets (if applicable)
- [ ] Monitored for 24-48 hours
- [ ] No errors detected during grace period
- [ ] Revoked OLD keys in Stripe Dashboard
- [ ] Verified production works after revocation
- [ ] Updated CREDENTIAL_ROTATION_CHECKLIST.md
- [ ] Notified team of completion

**Completed By:** ___________________  
**Date:** ___________________  
**Verification Notes:**
```
___________________________________________
```

---

## Additional Resources

- **Stripe API Keys Documentation:** https://docs.stripe.com/keys
- **Stripe Webhook Secrets:** https://docs.stripe.com/webhooks/signatures
- **Stripe Test Cards:** https://docs.stripe.com/testing

---

## Notes

Use this section for any additional observations or decisions:

```
[Your notes here]
```

