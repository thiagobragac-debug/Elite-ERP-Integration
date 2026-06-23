# Staging Deployment Configuration Checklist

## ✅ Quick Setup Guide

Use this checklist to configure staging deployment on the `develop` branch.

---

## Prerequisites

- [ ] Vercel account with project created
- [ ] Staging Supabase project configured
- [ ] Staging Stripe test account
- [ ] Staging Sentry project
- [ ] Staging PostHog project
- [ ] Slack workspace with admin access

---

## Step 1: Vercel Configuration

### 1.1 Install Vercel CLI
```bash
npm i -g vercel
```

### 1.2 Link Project
```bash
vercel login
cd C:\Saas
vercel link
```

### 1.3 Get Vercel Credentials
```bash
cat .vercel/project.json
```
- [ ] Copy `orgId` → Will be `VERCEL_ORG_ID`
- [ ] Copy `projectId` → Will be `VERCEL_PROJECT_ID`

### 1.4 Create Vercel Token
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: `GitHub Actions - Staging`
4. [ ] Copy token → Will be `VERCEL_TOKEN`

---

## Step 2: GitHub Secrets Configuration

### 2.1 Add Vercel Secrets
```bash
gh secret set VERCEL_TOKEN
# Paste token when prompted

gh secret set VERCEL_ORG_ID
# Paste org_id from .vercel/project.json

gh secret set VERCEL_PROJECT_ID
# Paste projectId from .vercel/project.json
```

**Manual alternative (GitHub UI):**
1. Go to: https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret listed above

- [ ] `VERCEL_TOKEN` configured
- [ ] `VERCEL_ORG_ID` configured
- [ ] `VERCEL_PROJECT_ID` configured

### 2.2 Add Staging Environment Variables

```bash
gh secret set STAGING_SUPABASE_URL
# Example: https://xxxxx.supabase.co

gh secret set STAGING_SUPABASE_ANON_KEY
# Get from Supabase Dashboard → Settings → API → anon key

gh secret set STAGING_STRIPE_PUBLISHABLE_KEY
# Example: pk_test_xxxxx (use TEST mode key)

gh secret set STAGING_SENTRY_DSN
# Get from Sentry → Project Settings → Client Keys (DSN)

gh secret set STAGING_POSTHOG_KEY
# Get from PostHog → Project Settings → Project API Key

gh secret set STAGING_POSTHOG_HOST
# Example: https://app.posthog.com
```

- [ ] `STAGING_SUPABASE_URL` configured
- [ ] `STAGING_SUPABASE_ANON_KEY` configured
- [ ] `STAGING_STRIPE_PUBLISHABLE_KEY` configured
- [ ] `STAGING_SENTRY_DSN` configured
- [ ] `STAGING_POSTHOG_KEY` configured
- [ ] `STAGING_POSTHOG_HOST` configured

### 2.3 Add Slack Webhook

1. Go to Slack App Directory
2. Search "Incoming Webhooks"
3. Add to your deployment notifications channel (e.g., `#deployments`)
4. Copy webhook URL

```bash
gh secret set SLACK_WEBHOOK_URL
# Paste webhook URL: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

- [ ] `SLACK_WEBHOOK_URL` configured

---

## Step 3: GitHub Environment Setup (Optional but Recommended)

1. Go to: https://github.com/YOUR_ORG/YOUR_REPO/settings/environments
2. Click "New environment"
3. Name: `staging`
4. Configure protection rules:
   - [ ] Add required reviewers (optional)
   - [ ] Deployment branches: Select "Selected branches" → `develop`

---

## Step 4: Verify Configuration

### 4.1 Check All Secrets
```bash
gh secret list
```

Expected output should include all 9 secrets:
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_STRIPE_PUBLISHABLE_KEY
STAGING_SENTRY_DSN
STAGING_POSTHOG_KEY
STAGING_POSTHOG_HOST
SLACK_WEBHOOK_URL
```

- [ ] All 9 secrets are listed

### 4.2 Test Slack Webhook
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"✅ Slack webhook configured successfully!"}' \
  YOUR_WEBHOOK_URL
```

- [ ] Test message received in Slack

---

## Step 5: Test Deployment

### 5.1 Push to Develop Branch
```bash
git checkout develop
git pull origin develop

# Create a test commit
echo "# Test staging deployment" >> README.md
git add README.md
git commit -m "test: verify staging deployment"
git push origin develop
```

### 5.2 Monitor Deployment
1. Go to: https://github.com/YOUR_ORG/YOUR_REPO/actions
2. Watch the "CI Pipeline" workflow
3. Wait for all jobs to complete
4. Verify "Deploy to Staging" job runs

- [ ] CI pipeline triggered
- [ ] All test jobs passed
- [ ] Deploy to Staging job ran
- [ ] Slack notification received
- [ ] GitHub commit comment added

### 5.3 Verify Staging Site
```bash
# Check deployment is live
curl -I https://staging.tauze.app

# Open in browser
# https://staging.tauze.app
```

- [ ] Staging site is accessible
- [ ] Login works
- [ ] Dashboard loads
- [ ] No console errors

---

## Step 6: Configure DNS (if using custom domain)

### 6.1 Add DNS Record
1. Go to your DNS provider (Cloudflare, Route53, etc.)
2. Add CNAME record:
   - Name: `staging`
   - Value: `cname.vercel-dns.com`
   - TTL: Auto or 300

### 6.2 Add Domain in Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `staging.tauze.app`
3. Wait for DNS propagation (1-5 minutes)

- [ ] DNS record added
- [ ] Domain configured in Vercel
- [ ] Domain is accessible

---

## Troubleshooting

### Issue: "Unauthorized" Error During Deployment

**Solution:**
```bash
# Generate new Vercel token
# Update secret
gh secret set VERCEL_TOKEN
```

### Issue: Build Fails with Missing Env Vars

**Solution:**
```bash
# Verify all staging secrets are set
gh secret list | grep STAGING

# Add any missing secrets
gh secret set STAGING_SUPABASE_URL
```

### Issue: Slack Notification Not Received

**Solution:**
```bash
# Test webhook directly
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  YOUR_WEBHOOK_URL

# If test fails, recreate webhook in Slack
# Update secret
gh secret set SLACK_WEBHOOK_URL
```

### Issue: Deployment Skipped

**Cause:** Deploy job only runs on `develop` branch

**Solution:**
```bash
# Verify you're pushing to develop
git branch --show-current
# Should output: develop

# If on another branch
git checkout develop
git merge your-branch
git push origin develop
```

---

## Success Criteria

✅ Staging deployment is complete when:

1. All 9 GitHub secrets configured
2. Push to `develop` triggers automatic deployment
3. Deployment succeeds and staging site is live
4. Slack notification received with deployment status
5. GitHub commit comment shows deployment URL
6. Staging site loads without errors

---

## Next Steps After Configuration

1. **Document staging URL** for team: https://staging.tauze.app
2. **Share deployment notifications channel** in Slack
3. **Configure production deployment** (Task 29.2) using same process but for `main` branch
4. **Set up monitoring** for staging environment
5. **Create runbook** for staging deployment issues

---

## Support

For issues or questions:
- 📖 Full Guide: `/docs/STAGING_DEPLOYMENT_SETUP.md`
- 🔧 GitHub Actions: https://github.com/YOUR_ORG/YOUR_REPO/actions
- 📊 Vercel Dashboard: https://vercel.com/dashboard
- 💬 Slack: #deployments channel

---

**Requirements Satisfied:**
- ✅ Requirement 13.3: Deploy to staging when code merged to `develop` branch
- ✅ Requirement 13.6: Notify team of deployment success or failure

**Task Completed:** 29.1 - Setup staging deployment on develop branch
