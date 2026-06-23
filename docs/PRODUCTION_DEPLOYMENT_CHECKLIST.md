# Production Deployment Setup Checklist - Task 29.2

Quick checklist for setting up production deployment automation on the `main` branch.

## Prerequisites

- [ ] All tests are passing in CI
- [ ] Staging deployment (Task 29.1) is configured and working
- [ ] You have admin access to the GitHub repository
- [ ] You have credentials for your hosting provider

## Setup Steps

### 1. GitHub Environment Configuration

- [ ] Navigate to **Settings** → **Environments** in GitHub repository
- [ ] Create or edit the `production` environment
- [ ] Add required reviewers (at least 1-2 team members)
- [ ] Configure deployment branch rule: Only `main` branch
- [ ] (Optional) Set wait timer before deployment

**Time estimate**: 5 minutes

### 2. GitHub Secrets Configuration

Add the following secrets in **Settings** → **Secrets and variables** → **Actions**:

**Required for build**:
- [ ] `VITE_SUPABASE_URL_PROD` - Production Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY_PROD` - Production Supabase anonymous key
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY_PROD` - Production Stripe publishable key
- [ ] `VITE_SENTRY_DSN` - Sentry error tracking DSN
- [ ] `VITE_POSTHOG_KEY` - PostHog analytics key
- [ ] `VITE_POSTHOG_HOST` - PostHog analytics host URL

**Required for deployment** (choose based on your hosting provider):
- [ ] **Vercel**: `VERCEL_TOKEN`
- [ ] **Netlify**: `NETLIFY_TOKEN`
- [ ] **AWS S3**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, `CLOUDFRONT_DIST_ID`

**Optional for notifications**:
- [ ] `SLACK_WEBHOOK` - For Slack notifications
- [ ] `DISCORD_WEBHOOK` - For Discord notifications

**Time estimate**: 10 minutes

### 3. Hosting Provider Configuration

Choose your hosting provider and complete the setup:

#### Option A: Vercel
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Generate token: Login to Vercel → Settings → Tokens → Create Token
- [ ] Add `VERCEL_TOKEN` to GitHub Secrets
- [ ] Create `vercel.json` configuration file (if needed)
- [ ] Uncomment Vercel deployment step in `.github/workflows/ci.yml`

#### Option B: Netlify
- [ ] Install Netlify CLI: `npm install -g netlify-cli`
- [ ] Generate token: Netlify Dashboard → User Settings → Applications → New access token
- [ ] Add `NETLIFY_TOKEN` to GitHub Secrets
- [ ] Create `netlify.toml` configuration file (if needed)
- [ ] Uncomment Netlify deployment step in `.github/workflows/ci.yml`

#### Option C: AWS S3 + CloudFront
- [ ] Create S3 bucket configured for static website hosting
- [ ] Create CloudFront distribution pointing to S3 bucket
- [ ] Create IAM user with S3 and CloudFront permissions
- [ ] Generate access keys and add to GitHub Secrets
- [ ] Uncomment AWS deployment step in `.github/workflows/ci.yml`

#### Option D: Custom Hosting
- [ ] Create deployment script: `scripts/deploy-production.sh`
- [ ] Make script executable: `chmod +x scripts/deploy-production.sh`
- [ ] Test script locally
- [ ] Add any required credentials to GitHub Secrets
- [ ] Update deployment step in `.github/workflows/ci.yml`

**Time estimate**: 15-30 minutes (varies by provider)

### 4. Notification Configuration (Optional)

#### Slack Notifications
- [ ] Create Slack App at https://api.slack.com/apps
- [ ] Enable Incoming Webhooks
- [ ] Create webhook for your channel
- [ ] Add `SLACK_WEBHOOK` to GitHub Secrets
- [ ] Uncomment Slack notification steps in `.github/workflows/ci.yml`

#### Discord Notifications
- [ ] Create Discord webhook in server settings
- [ ] Add `DISCORD_WEBHOOK` to GitHub Secrets
- [ ] Uncomment Discord notification steps in `.github/workflows/ci.yml`

**Time estimate**: 5 minutes

### 5. Workflow Configuration

- [ ] Review `.github/workflows/ci.yml` file
- [ ] Verify `deploy-production` job configuration
- [ ] Update production URL in `environment.url` field
- [ ] Uncomment your chosen deployment method
- [ ] Uncomment notification method (if using)
- [ ] Commit and push changes to `main` branch

**Time estimate**: 10 minutes

### 6. Testing

#### Pre-deployment Test
- [ ] Create a test branch: `git checkout -b test-prod-deploy`
- [ ] Make a small change (e.g., update README)
- [ ] Push and create PR to `main`
- [ ] Verify all CI checks pass

#### First Production Deployment
- [ ] Merge PR to `main` branch
- [ ] Navigate to **Actions** tab in GitHub
- [ ] Verify workflow starts automatically
- [ ] Wait for approval request notification
- [ ] Review deployment details
- [ ] Click "Review deployments" → "Approve"
- [ ] Monitor deployment progress
- [ ] Verify deployment completes successfully

**Time estimate**: 15 minutes

#### Post-deployment Verification
- [ ] Visit production URL
- [ ] Test login functionality
- [ ] Test critical user flows
- [ ] Check Sentry for new errors
- [ ] Verify PostHog events are tracking
- [ ] Review hosting provider logs

**Time estimate**: 10 minutes

## Troubleshooting

### Deployment job doesn't start
- Verify branch name is exactly `main`
- Check all prerequisite jobs passed
- Ensure GitHub Actions are enabled

### Approval notification not received
- Check Environment settings for reviewers
- Verify reviewer notification settings
- Manually check: Actions → Workflow run → "Review deployments"

### Build fails
- Verify all GitHub Secrets are set correctly
- Check secret names match exactly (case-sensitive)
- Test build locally: `npm run build`

### Deployment fails
- Verify hosting provider credentials
- Check hosting provider status page
- Review detailed error logs in Actions

### Notifications not working
- Verify webhook URL is correct
- Test webhook manually with `curl`
- Check notification service logs

## Validation

Verify the deployment setup satisfies requirements:

- [ ] **Req 13.4**: Deployment triggers when code is merged to `main` ✅
- [ ] **Req 13.6**: Team is notified of deployment success/failure ✅
- [ ] Manual approval is required for production deploys ✅
- [ ] Production environment variables are configured ✅
- [ ] All prerequisite jobs (test, e2e, security) must pass ✅

## Total Time Estimate

- **Minimum** (basic setup): ~45 minutes
- **Complete** (with notifications and testing): ~90 minutes

## Next Steps

After completing production deployment setup:

1. [ ] Document your specific hosting provider configuration
2. [ ] Create runbook for common deployment issues
3. [ ] Set up Sentry release tracking (Task 29.3)
4. [ ] Schedule production deployment testing with team
5. [ ] Create rollback procedure documentation

## Related Files

- `.github/workflows/ci.yml` - CI/CD workflow configuration
- `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `docs/DEPLOYMENT_AND_KEY_REVOCATION_GUIDE.md` - Key rotation procedures
- `.env.example` - Environment variable reference

## Support

If you encounter issues:

1. Review `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` troubleshooting section
2. Check GitHub Actions logs for detailed error messages
3. Verify hosting provider status page
4. Consult team members who completed staging deployment
5. Review hosting provider documentation

---

**Last Updated**: Task 29.2 completion
**Maintained By**: DevOps Team
