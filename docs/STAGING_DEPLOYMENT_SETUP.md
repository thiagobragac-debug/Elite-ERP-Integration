# Staging Deployment Setup Guide

## Overview

Este guia documenta a configuração de deployment automatizado para o ambiente de staging quando houver push para a branch `develop`.

**Requirement:** 13.3, 13.6  
**Task:** 29.1 - Setup staging deployment on develop branch

---

## Architecture

### Deployment Flow

```
Developer → Push to develop → CI Pipeline → Deploy to Staging → Notify Team
```

### Pipeline Steps

1. **Trigger**: Push to `develop` branch
2. **Prerequisites**: All CI jobs must pass (test, coverage, e2e, security)
3. **Build**: Application built with staging environment variables
4. **Deploy**: Deploy to Vercel staging environment
5. **Notify**: Send deployment status to Slack and GitHub commit comment

---

## Configuration

### GitHub Secrets Required

Configure the following secrets in your GitHub repository settings:  
**Settings → Secrets and variables → Actions → New repository secret**

#### Vercel Deployment Secrets

| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `VERCEL_TOKEN` | Vercel authentication token | Vercel Dashboard → Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | Vercel organization ID | Run `vercel link` or check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel project ID | Run `vercel link` or check `.vercel/project.json` |

#### Staging Environment Variables

| Secret Name | Description | Example |
|------------|-------------|---------|
| `STAGING_SUPABASE_URL` | Staging Supabase URL | `https://xxxxx.supabase.co` |
| `STAGING_SUPABASE_ANON_KEY` | Staging Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `STAGING_STRIPE_PUBLISHABLE_KEY` | Staging Stripe publishable key | `pk_test_xxxxx` |
| `STAGING_SENTRY_DSN` | Staging Sentry DSN | `https://xxxx@xxxx.ingest.sentry.io/xxxx` |
| `STAGING_POSTHOG_KEY` | Staging PostHog key | `phc_xxxxx` |
| `STAGING_POSTHOG_HOST` | Staging PostHog host | `https://app.posthog.com` |

#### Notification Secrets

| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Slack → Apps → Incoming Webhooks → Add to Channel |

---

## Setup Instructions

### 1. Obtain Vercel Credentials

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
cd /path/to/project
vercel link

# Get your org and project IDs
cat .vercel/project.json
```

The `.vercel/project.json` will contain:
```json
{
  "orgId": "team_xxxxx",
  "projectId": "prj_xxxxx"
}
```

### 2. Create Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name: `GitHub Actions - Staging`
4. Scope: Select your team/organization
5. Copy the token (only shown once!)

### 3. Configure GitHub Secrets

```bash
# Using GitHub CLI (gh)
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID

gh secret set STAGING_SUPABASE_URL
gh secret set STAGING_SUPABASE_ANON_KEY
gh secret set STAGING_STRIPE_PUBLISHABLE_KEY
gh secret set STAGING_SENTRY_DSN
gh secret set STAGING_POSTHOG_KEY
gh secret set STAGING_POSTHOG_HOST

gh secret set SLACK_WEBHOOK_URL
```

Or manually via GitHub UI:
1. Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Enter name and value
4. Click "Add secret"

### 4. Create Slack Incoming Webhook

1. Go to Slack workspace
2. Apps → Search "Incoming Webhooks"
3. Add to Channel (select your deployment notifications channel)
4. Copy the Webhook URL
5. Add as `SLACK_WEBHOOK_URL` secret in GitHub

### 5. Configure GitHub Environment

1. Repository → Settings → Environments
2. Click "New environment"
3. Name: `staging`
4. (Optional) Add protection rules:
   - Required reviewers
   - Wait timer
   - Deployment branches: Only `develop`

---

## Deployment Workflow

### Automatic Deployment

Pushing to `develop` automatically triggers staging deployment:

```bash
git checkout develop
git pull origin develop

# Make changes
git add .
git commit -m "feat: add new feature"
git push origin develop

# CI will automatically:
# 1. Run tests
# 2. Build application
# 3. Deploy to staging
# 4. Notify team
```

### Manual Deployment Trigger

If you need to redeploy without new commits:

```bash
# Trigger workflow manually
gh workflow run ci.yml --ref develop
```

Or via GitHub UI:
1. Actions tab
2. Select "CI Pipeline"
3. Run workflow → Branch: develop

---

## Environment Configuration

### Staging Environment Variables

The staging build uses specific environment variables:

```bash
VITE_SUPABASE_URL=${{ secrets.STAGING_SUPABASE_URL }}
VITE_SUPABASE_ANON_KEY=${{ secrets.STAGING_SUPABASE_ANON_KEY }}
VITE_STRIPE_PUBLISHABLE_KEY=${{ secrets.STAGING_STRIPE_PUBLISHABLE_KEY }}
VITE_SENTRY_DSN=${{ secrets.STAGING_SENTRY_DSN }}
VITE_POSTHOG_KEY=${{ secrets.STAGING_POSTHOG_KEY }}
VITE_POSTHOG_HOST=${{ secrets.STAGING_POSTHOG_HOST }}
VITE_ENVIRONMENT=staging
```

### Vercel Deployment Configuration

The deployment uses:
- **Alias**: `staging.tauze.app`
- **Production deployment**: Uses `--prod` flag for stable URL
- **Working directory**: Project root

---

## Notifications

### Slack Notifications

**Success Message:**
```
✅ Staging Deployment Successful

Repository: owner/repo
Branch: develop
Commit: abc123
Author: @developer
Environment: Staging
URL: https://staging.tauze.app
Message: feat: add new feature
```

**Failure Message:**
```
❌ Staging Deployment Failed

Repository: owner/repo
Branch: develop
Commit: abc123
Author: @developer
Environment: Staging
Workflow: https://github.com/owner/repo/actions/runs/123456
Message: feat: add new feature
```

### GitHub Commit Comments

The workflow automatically adds a comment to the commit:

**Success:**
```
✅ Staging Deployment Successful

🔗 View Deployment: https://staging.tauze.app
```

**Failure:**
```
❌ Staging Deployment Failed

📋 View Logs: https://github.com/owner/repo/actions/runs/123456
```

---

## Monitoring & Verification

### Verify Deployment

After deployment, verify staging is working:

```bash
# Check deployment URL
curl -I https://staging.tauze.app

# Check Sentry (staging environment)
# https://sentry.io/organizations/your-org/projects/

# Check PostHog (staging events)
# https://app.posthog.com/project/your-project
```

### Check Deployment Logs

```bash
# Via GitHub CLI
gh run list --workflow=ci.yml --branch=develop
gh run view RUN_ID --log

# Via Vercel CLI
vercel logs staging.tauze.app
```

### Rollback if Needed

If staging deployment has issues:

```bash
# Revert the commit
git revert HEAD
git push origin develop

# Or deploy a specific commit
git checkout develop
git reset --hard GOOD_COMMIT_SHA
git push --force origin develop
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails with "Unauthorized"

**Cause:** Invalid or expired `VERCEL_TOKEN`

**Solution:**
```bash
# Create new token in Vercel Dashboard
# Update GitHub secret
gh secret set VERCEL_TOKEN
```

#### 2. Build Fails with Missing Environment Variables

**Cause:** Staging secrets not configured

**Solution:**
```bash
# Verify all required secrets are set
gh secret list

# Set missing secrets
gh secret set STAGING_SUPABASE_URL
```

#### 3. Slack Notifications Not Working

**Cause:** Invalid or missing `SLACK_WEBHOOK_URL`

**Solution:**
```bash
# Test webhook manually
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_WEBHOOK_URL

# Update secret if needed
gh secret set SLACK_WEBHOOK_URL
```

#### 4. Deployment Successful but App Not Working

**Cause:** Wrong environment variables or Supabase configuration

**Solution:**
1. Check Vercel deployment logs
2. Verify staging Supabase URL and key
3. Check browser console for errors
4. Verify RLS policies allow staging anon key

#### 5. "needs" Job Failed - Deployment Skipped

**Cause:** One of the prerequisite jobs (test, coverage, e2e, security) failed

**Solution:**
```bash
# Fix the failing test/check
npm run test
npm run lint
npm run type-check

# Commit fix and push
git add .
git commit -m "fix: resolve CI issues"
git push origin develop
```

---

## Security Best Practices

### 1. Separate Staging and Production Secrets

Always use different credentials for staging and production:
- Different Supabase projects
- Different Stripe accounts (test mode)
- Different Sentry projects
- Different PostHog projects

### 2. Restrict GitHub Environment Access

Configure environment protection rules:
```yaml
# In GitHub Settings → Environments → staging
- Required reviewers: [senior-developers]
- Wait timer: 0 minutes
- Deployment branches: develop only
```

### 3. Rotate Secrets Regularly

```bash
# Every 90 days, rotate:
# 1. Vercel token
# 2. Supabase keys
# 3. Stripe keys
# 4. Sentry DSN
# 5. Slack webhook
```

### 4. Monitor Deployment Activity

- Enable GitHub Actions notifications
- Monitor Slack channel for deployment alerts
- Review deployment logs weekly

---

## Next Steps

After staging deployment is working:

1. **Task 29.2**: Configure production deployment on `main` branch
2. **Task 29.3**: Add deployment smoke tests
3. **Task 29.4**: Configure deployment rollback automation
4. **Task 29.5**: Add deployment metrics and monitoring

---

## References

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [GitHub Actions Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- Requirements 13.3, 13.6 in `system-improvements/requirements.md`
