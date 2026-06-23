# 🚀 Staging Deployment - Next Steps

## Overview

The staging deployment infrastructure is now configured! This document outlines the **immediate next steps** required to activate automatic deployments to staging when pushing to the `develop` branch.

**Status:** ✅ Configuration Complete | ⏳ Secrets Setup Required

---

## ⚡ Quick Start (5 minutes)

### Step 1: Verify Prerequisites

```bash
# Check if GitHub CLI is installed
gh --version

# If not installed:
# Windows: winget install GitHub.cli
# macOS: brew install gh
# Linux: See https://cli.github.com/manual/installation

# Authenticate
gh auth login
```

### Step 2: Verify Configuration

```bash
# Run the automated verification script
npm run verify:staging-secrets
```

This will show you which secrets are missing and need to be configured.

### Step 3: Configure Secrets

Follow one of these guides:
- **Quick:** `STAGING_DEPLOYMENT_CHECKLIST.md` (step-by-step checklist)
- **Detailed:** `docs/STAGING_DEPLOYMENT_SETUP.md` (comprehensive guide)

**Required Secrets (10 total):**
1. Vercel credentials (3): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
2. Staging environment (6): Supabase, Stripe, Sentry, PostHog
3. Notifications (1): Slack webhook

### Step 4: Test Deployment

```bash
# Checkout develop branch
git checkout develop
git pull origin develop

# Make a test change
echo "# Test staging deployment" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify staging deployment"
git push origin develop

# Monitor deployment
gh run watch
```

### Step 5: Verify

- ✅ Check GitHub Actions completed successfully
- ✅ Check Slack notification received
- ✅ Check GitHub commit comment added
- ✅ Visit staging URL: `https://staging.tauze.app`

---

## 📋 Detailed Action Items

### For DevOps Team

- [ ] **Configure Vercel Project**
  - Install Vercel CLI: `npm i -g vercel`
  - Link project: `vercel link`
  - Create deployment token: https://vercel.com/account/tokens
  - Note org ID and project ID from `.vercel/project.json`

- [ ] **Set GitHub Secrets**
  ```bash
  gh secret set VERCEL_TOKEN
  gh secret set VERCEL_ORG_ID
  gh secret set VERCEL_PROJECT_ID
  ```

- [ ] **Create Staging Supabase Project**
  - Separate project from production
  - Copy URL and anon key
  - Configure RLS policies
  ```bash
  gh secret set STAGING_SUPABASE_URL
  gh secret set STAGING_SUPABASE_ANON_KEY
  ```

- [ ] **Configure Stripe Test Mode**
  - Get test publishable key (pk_test_...)
  ```bash
  gh secret set STAGING_STRIPE_PUBLISHABLE_KEY
  ```

- [ ] **Setup Sentry Staging Project**
  - Create separate project for staging
  - Copy DSN
  ```bash
  gh secret set STAGING_SENTRY_DSN
  ```

- [ ] **Setup PostHog Staging Project**
  - Create staging project or use test project
  - Copy API key
  ```bash
  gh secret set STAGING_POSTHOG_KEY
  gh secret set STAGING_POSTHOG_HOST
  ```

- [ ] **Configure Slack Webhook**
  - Create #deployments channel (or similar)
  - Add Incoming Webhooks app
  - Copy webhook URL
  ```bash
  gh secret set SLACK_WEBHOOK_URL
  ```

- [ ] **Test Webhook**
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"✅ Webhook configured!"}' \
    YOUR_WEBHOOK_URL
  ```

- [ ] **Verify All Secrets**
  ```bash
  npm run verify:staging-secrets
  ```

- [ ] **Test Deployment**
  - Push to develop branch
  - Monitor GitHub Actions
  - Verify notifications

### For Development Team

- [ ] **Read Documentation**
  - Review `STAGING_DEPLOYMENT_CHECKLIST.md`
  - Understand deployment flow
  - Know how to monitor deployments

- [ ] **Update Local Environment**
  ```bash
  git pull origin develop
  npm install
  ```

- [ ] **Understand Workflow**
  - Push to `develop` → automatic staging deployment
  - All CI checks must pass first
  - Notifications sent via Slack
  - Deployment URL in GitHub commit comment

- [ ] **Know Monitoring Commands**
  ```bash
  # List recent deployments
  gh run list --workflow=ci.yml --branch=develop
  
  # Watch current deployment
  gh run watch
  
  # View deployment logs
  gh run view RUN_ID --log
  ```

### For QA Team

- [ ] **Bookmark Staging URL**
  - `https://staging.tauze.app`

- [ ] **Join Slack Channel**
  - #deployments (or your configured channel)
  - Get notified of new deployments

- [ ] **Understand Update Cycle**
  - Staging auto-updates on push to `develop`
  - Check Slack for deployment notifications
  - Wait for ✅ success notification before testing

- [ ] **Report Issues**
  - Deployment failures: Check GitHub Actions logs
  - Application bugs: Use Sentry (staging environment)
  - Feature requests: Normal process

---

## 🔍 Verification Checklist

After completing setup:

### Infrastructure
- [ ] Vercel project linked and configured
- [ ] Staging Supabase project created
- [ ] Stripe test mode configured
- [ ] Sentry staging project created
- [ ] PostHog staging project created
- [ ] Slack webhook configured

### GitHub Configuration
- [ ] All 10 secrets configured
- [ ] Secrets verified with `npm run verify:staging-secrets`
- [ ] GitHub environment "staging" created (optional)
- [ ] Protection rules configured (optional)

### Testing
- [ ] Test deployment completed successfully
- [ ] Slack notification received (success)
- [ ] GitHub commit comment added
- [ ] Staging site accessible
- [ ] Staging site loads without errors
- [ ] Login works on staging
- [ ] Sentry receiving staging errors
- [ ] PostHog tracking staging events

### Documentation
- [ ] Team briefed on new workflow
- [ ] Staging URL shared with team
- [ ] Monitoring procedures documented
- [ ] Troubleshooting guide accessible

---

## 🎯 Success Criteria

Deployment is fully operational when:

1. ✅ Developer pushes to `develop` branch
2. ✅ CI runs automatically (lint, test, e2e, security)
3. ✅ If CI passes, deployment starts automatically
4. ✅ Build completes with staging environment variables
5. ✅ Deploy to Vercel succeeds
6. ✅ Slack notification sent with deployment status
7. ✅ GitHub commit comment added with URL
8. ✅ Staging site updates within 3-5 minutes
9. ✅ QA team can immediately test new changes

---

## 📚 Documentation Reference

- **Quick Setup:** `STAGING_DEPLOYMENT_CHECKLIST.md`
- **Complete Guide:** `docs/STAGING_DEPLOYMENT_SETUP.md`
- **Workflow Docs:** `.github/workflows/README.md`
- **Task Summary:** `docs/TASK_29.1_COMPLETION_SUMMARY.md`
- **Verification:** Run `npm run verify:staging-secrets`

---

## 🔧 Useful Commands

```bash
# Verify secrets configuration
npm run verify:staging-secrets

# List all GitHub secrets
gh secret list

# Configure a secret
gh secret set SECRET_NAME

# List recent workflow runs
gh run list --workflow=ci.yml

# Watch current deployment
gh run watch

# View specific run logs
gh run view RUN_ID --log

# Trigger manual deployment
gh workflow run ci.yml --ref develop

# Check staging site status
curl -I https://staging.tauze.app

# View Vercel deployments
vercel ls

# View Vercel logs
vercel logs staging.tauze.app
```

---

## 🚨 Troubleshooting

### Issue: Verification script shows missing secrets
**Solution:** Follow `STAGING_DEPLOYMENT_CHECKLIST.md` to configure each missing secret.

### Issue: Deployment fails with "Unauthorized"
**Solution:** 
```bash
# Create new Vercel token at https://vercel.com/account/tokens
gh secret set VERCEL_TOKEN
```

### Issue: Slack notifications not working
**Solution:**
```bash
# Test webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' YOUR_WEBHOOK_URL

# If fails, recreate webhook in Slack and update secret
gh secret set SLACK_WEBHOOK_URL
```

### Issue: Deployment skipped
**Solution:**
- Verify you pushed to `develop` branch
- Check if CI jobs passed
- Review GitHub Actions logs for errors

### Issue: Site deployed but not working
**Solution:**
- Check browser console for errors
- Verify staging Supabase credentials
- Check Sentry for error reports
- Verify environment variables in Vercel dashboard

---

## 📞 Support

**Questions or Issues?**
- 📖 Check documentation in `docs/`
- 💬 Ask in Slack #dev-help channel
- 🐛 Create GitHub issue with `ci/cd` label
- 📧 Contact DevOps team

---

## ✨ What's Next?

After staging deployment is working:

1. **Task 29.2:** Configure production deployment on `main` branch
2. **Task 29.3:** Add deployment smoke tests
3. **Task 29.4:** Configure automated rollback
4. **Task 29.5:** Add deployment metrics and monitoring

---

**Status:** ⏳ Ready for Secret Configuration  
**Estimated Setup Time:** 30-60 minutes (first time)  
**Estimated Deploy Time:** 3-5 minutes (after CI passes)  

**Requirements Satisfied:** 
- ✅ 13.3: Deploy to staging on merge to develop
- ✅ 13.6: Notify team of deployment status

---

**Let's ship to staging! 🚀**
