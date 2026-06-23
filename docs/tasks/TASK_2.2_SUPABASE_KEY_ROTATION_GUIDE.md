# Task 2.2: Supabase API Key Rotation Guide

## ⚠️ CRITICAL SECURITY TASK

This task must be completed within 24 hours. The Supabase API keys were exposed in the git history and have been removed, but the keys themselves must now be rotated to prevent unauthorized access.

---

## Overview

**What:** Rotate Supabase API keys that were exposed in git history  
**Why:** The old keys are still active and could be used by anyone who accessed the git history  
**When:** Within 24 hours  
**Who:** Project administrator with Supabase dashboard access  

---

## Prerequisites

- [ ] Access to Supabase Dashboard (https://app.supabase.com)
- [ ] Admin/Owner permissions for the project
- [ ] Access to production hosting environment (Vercel/Netlify/etc.)
- [ ] Access to GitHub repository settings (for updating secrets)

---

## Current Key Information

**Project Details:**
- **Supabase URL:** `https://nmirpozhgcoabcjwgvqk.supabase.co`
- **Project Reference:** `nmirpozhgcoabcjwgvqk`
- **Old Anon Key (last 8 chars):** `...60ocdak`
- **Date Removed from Git:** 2026-06-16

**What needs to be rotated:**
1. ✅ **Anon Key** (Public, used in frontend) - `VITE_SUPABASE_ANON_KEY`
2. ⚠️ **Service Role Key** (Only if you use it in backend scripts/edge functions)

---

## Step-by-Step Instructions

### Step 1: Generate New Keys in Supabase Dashboard

1. **Log in to Supabase:**
   - Go to: https://app.supabase.com
   - Log in with your credentials

2. **Select Your Project:**
   - Look for project: `nmirpozhgcoabcjwgvqk`
   - Click to open the project

3. **Navigate to API Settings:**
   - Click on **Settings** (gear icon in sidebar)
   - Click on **API** in the submenu

4. **Locate Current Keys:**
   - You'll see "Project API keys" section
   - You should see:
     - `anon` `public` key (this is what needs rotation)
     - `service_role` `secret` key (rotate if you use it)

5. **Generate New Anon Key:**
   - Look for an option to "Rotate" or "Generate new" anon key
   - **Note:** Supabase may call this "Regenerate API key" or have a rotate button
   - Click the rotate/regenerate option
   - **IMPORTANT:** Copy the new key immediately - it may not be shown again!
   - Save it temporarily in a secure location (password manager recommended)

6. **Generate New Service Role Key (if applicable):**
   - If you use the service role key in backend scripts, rotate it too
   - Click rotate/regenerate for service role key
   - Copy and save securely

**Expected Result:**
- ✅ New `anon` key generated (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.`)
- ✅ Old key still active (for now - grace period)
- ✅ Keys saved securely for next steps

---

### Step 2: Update Local Development Environment

1. **Open your `.env` file:**
   ```bash
   # In your project root directory
   code .env
   # or
   nano .env
   ```

2. **Update the keys:**
   ```env
   VITE_SUPABASE_URL=https://nmirpozhgcoabcjwgvqk.supabase.co
   VITE_SUPABASE_ANON_KEY=<paste_your_new_anon_key_here>
   ```

3. **Save the file**

---

### Step 3: Test Locally

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test critical functionality:**
   - [ ] Open the app in your browser
   - [ ] Try to log in
   - [ ] Verify data loads correctly (animals, financial data, etc.)
   - [ ] Check browser console for any authentication errors
   - [ ] Try creating/updating a record

3. **If everything works:**
   - ✅ The new key is working correctly
   - Proceed to Step 4

4. **If you see errors:**
   - ⚠️ Check that you copied the full key (JWT tokens are long!)
   - ⚠️ Verify no extra spaces before/after the key
   - ⚠️ Check console for specific error messages

---

### Step 4: Update GitHub Secrets (CI/CD)

1. **Navigate to GitHub repository:**
   - Go to your repository on GitHub
   - Click **Settings** tab

2. **Access Secrets:**
   - In left sidebar, click **Secrets and variables** → **Actions**

3. **Update the secret:**
   - Look for: `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY`
   - Click the pencil icon (edit)
   - Paste the new key
   - Click **Update secret**

4. **If there's no secret yet:**
   - Click **New repository secret**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Paste your new key
   - Click **Add secret**

**Expected Result:**
- ✅ GitHub Actions will use the new key in future builds

---

### Step 5: Update Production Environment

**For Vercel:**
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Find `VITE_SUPABASE_ANON_KEY`
5. Click the three dots → **Edit**
6. Paste the new key
7. Select environments: Production, Preview, Development
8. Click **Save**
9. **Redeploy:** Go to Deployments → Click "..." on latest → **Redeploy**

**For Netlify:**
1. Go to: https://app.netlify.com
2. Select your site
3. Click **Site settings** → **Environment variables**
4. Find `VITE_SUPABASE_ANON_KEY`
5. Click **Edit**
6. Paste the new key
7. Click **Save**
8. **Trigger new deploy:** Deploys → Trigger deploy → Deploy site

**For Other Platforms:**
- Find the environment variables section
- Update `VITE_SUPABASE_ANON_KEY` with the new key
- Redeploy the application

**Expected Result:**
- ✅ New deployment uses the new Supabase key
- ✅ Production app works correctly
- ✅ No authentication errors in production

---

### Step 6: Monitor (Grace Period: 24-48 hours)

During this period, **both old and new keys are active**. This ensures zero downtime.

**What to monitor:**

1. **Supabase Dashboard:**
   - Go to: Settings → API → Usage/Analytics
   - Look for: Unusual traffic patterns or errors
   - Check: API request logs for failures

2. **Production Application:**
   - Check: Error monitoring (if you have Sentry or similar)
   - Verify: No authentication errors from users
   - Test: Critical user flows still work

3. **CI/CD Pipelines:**
   - Check: Recent GitHub Actions runs
   - Verify: Builds and tests pass successfully

**Duration:** Keep both keys active for 24-48 hours

---

### Step 7: Revoke Old Keys

⚠️ **ONLY DO THIS AFTER 24-48 HOURS OF MONITORING**

1. **Return to Supabase Dashboard:**
   - Settings → API

2. **Revoke the old anon key:**
   - Look for an option to revoke/delete the old key
   - **Note:** Supabase may automatically deactivate the old key when you rotated
   - Confirm that only the new key is active

3. **Test production one more time:**
   - Open your production app
   - Verify login works
   - Verify data loads correctly

4. **Document completion:**
   - Old key revoked on: `__________` (fill in date)
   - New key confirmed working: ✅

---

### Step 8: Update Documentation

1. **Mark completion in main checklist:**
   - Open `CREDENTIAL_ROTATION_CHECKLIST.md`
   - Update Supabase section status to: ✅ Completed
   - Fill in completion date

2. **Update .env.example (if needed):**
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Clean up this guide:**
   - You can delete `TASK_2.2_SUPABASE_KEY_ROTATION_GUIDE.md` after completion
   - Or keep it for reference in future rotations

---

## Troubleshooting

### Problem: "Invalid API key" error after rotation

**Solution:**
1. Verify you copied the complete key (JWT tokens are 200+ characters)
2. Check for extra spaces or line breaks
3. Verify the key is set in the correct environment variable name
4. Restart your dev server: `Ctrl+C` then `npm run dev`

### Problem: Production still showing errors after deployment

**Solution:**
1. Verify the deployment actually used the new environment variables
2. Check if your hosting platform requires a manual redeploy
3. Clear browser cache and test in incognito mode
4. Check production logs for specific error messages

### Problem: Can't find "rotate key" option in Supabase

**Solution:**
1. The UI may vary - look for "Reset", "Regenerate", or "Create new key"
2. Some projects may need to contact Supabase support
3. Alternative: Create a new project and migrate data (last resort)

### Problem: CI/CD builds failing after rotation

**Solution:**
1. Double-check the secret name matches what your CI/CD expects
2. Some platforms use `SUPABASE_ANON_KEY`, others use `VITE_SUPABASE_ANON_KEY`
3. Check your `.github/workflows/ci.yml` for the exact variable name
4. Update all workflow files that reference the key

---

## Security Best Practices

After completing the rotation:

✅ **DO:**
- Keep the `.env` file in `.gitignore` (already done in task 2.1)
- Use a password manager for storing keys
- Set calendar reminder for regular key rotation (every 6-12 months)
- Enable 2FA on your Supabase account

❌ **DON'T:**
- Share keys in Slack, email, or any unencrypted channel
- Commit keys to git (even in private repositories)
- Use production keys in development
- Skip the grace period before revoking old keys

---

## Completion Checklist

Mark each item as you complete it:

- [ ] Step 1: New Supabase anon key generated
- [ ] Step 2: Local `.env` file updated
- [ ] Step 3: Local testing passed
- [ ] Step 4: GitHub Secrets updated
- [ ] Step 5: Production environment updated
- [ ] Step 5: Production redeployed successfully
- [ ] Step 5: Production tested and working
- [ ] Step 6: 24-48 hour grace period completed
- [ ] Step 6: No errors detected during monitoring
- [ ] Step 7: Old keys revoked
- [ ] Step 7: Post-revocation testing passed
- [ ] Step 8: Documentation updated

**Completed by:** ___________________  
**Date completed:** ___________________  

---

## Next Steps

After completing this task:

1. **Proceed to Task 2.3:** Rotate Stripe API Keys (if applicable)
2. **Continue with Phase 1:** Complete remaining security tasks
3. **Document lessons learned:** Note any issues for future rotations

---

## Need Help?

If you encounter issues:

1. **Check Supabase Documentation:** https://supabase.com/docs/guides/api
2. **Contact Supabase Support:** https://supabase.com/support
3. **Ask the team:** Share specific error messages (not the keys!)
4. **Consult the main checklist:** `CREDENTIAL_ROTATION_CHECKLIST.md` has additional context

---

**Remember:** This is a critical security task. Take your time, follow each step carefully, and verify everything works before revoking the old keys.
