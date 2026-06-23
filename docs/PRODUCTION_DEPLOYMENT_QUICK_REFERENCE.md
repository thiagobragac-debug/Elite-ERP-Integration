# Production Deployment Quick Reference - Task 29.2

Quick reference card for production deployment on the `main` branch.

## 🚀 Deployment Trigger

```yaml
Branch: main
Event: push (merge)
Condition: All tests pass + Manual approval
```

## 🔐 Required GitHub Secrets

```bash
# Build secrets
VITE_SUPABASE_URL_PROD
VITE_SUPABASE_ANON_KEY_PROD
VITE_STRIPE_PUBLISHABLE_KEY_PROD
VITE_SENTRY_DSN
VITE_POSTHOG_KEY
VITE_POSTHOG_HOST

# Deployment secrets (choose one)
VERCEL_TOKEN              # For Vercel
NETLIFY_TOKEN             # For Netlify
AWS_ACCESS_KEY_ID         # For AWS S3
AWS_SECRET_ACCESS_KEY     # For AWS S3
S3_BUCKET                 # For AWS S3
CLOUDFRONT_DIST_ID        # For AWS S3

# Notification secrets (optional)
SLACK_WEBHOOK             # For Slack
DISCORD_WEBHOOK           # For Discord
```

## 📋 Deployment Flow

```
1. Push to main branch
   ↓
2. Run CI pipeline (lint, test, e2e, security)
   ↓
3. Wait for manual approval ⏸️
   ↓
4. Build production artifacts
   ↓
5. Deploy to hosting provider
   ↓
6. Notify team
```

## ✅ Pre-deployment Checklist

- [ ] All tests passing in CI
- [ ] GitHub Environment configured with reviewers
- [ ] All production secrets added
- [ ] Hosting provider deployment method configured
- [ ] Production URL updated in workflow

## 🔧 Quick Setup Commands

### GitHub Environment
```bash
Repository → Settings → Environments → production
- Add required reviewers
- Select "main" branch only
```

### GitHub Secrets
```bash
Repository → Settings → Secrets and variables → Actions → New repository secret
```

### Test Workflow
```bash
git checkout -b test-prod-deploy
# Make a small change
git commit -am "Test production deployment"
git push origin test-prod-deploy
# Create PR to main → Merge → Monitor Actions
```

## 🔍 Monitoring

### Check Workflow Status
```bash
GitHub UI: Repository → Actions → CI Pipeline
CLI: gh run list --workflow=ci.yml
```

### Approve Deployment
```bash
GitHub UI: Actions → Workflow run → "Review deployments" → Approve
```

### View Logs
```bash
GitHub UI: Actions → Workflow run → "Deploy to Production" job → Expand steps
```

## ⚠️ Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Job doesn't start | Check branch is `main`, verify tests passed |
| No approval notification | Check Environment reviewers configured |
| Build fails | Verify all secrets are set correctly |
| Deployment fails | Check hosting provider credentials |

## 🔄 Rollback

### Quick Rollback
```bash
# Revert last commit and push
git revert HEAD
git push origin main
# New deployment triggers automatically
```

### Hosting Provider Rollback
- **Vercel**: Dashboard → Deployments → Previous → "Promote"
- **Netlify**: Dashboard → Deploys → Previous → "Publish deploy"
- **AWS**: Restore previous S3 version

## 📞 Support

**Detailed Guide**: `docs/PRODUCTION_DEPLOYMENT_GUIDE.md`  
**Checklist**: `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`  
**Troubleshooting**: See deployment guide troubleshooting section

## 🎯 Requirements Met

- ✅ **Req 13.4**: Deploy on `main` merge
- ✅ **Req 13.6**: Notify team of success/failure
- ✅ Manual approval required
- ✅ Production environment variables configured

---

**Last Updated**: Task 29.2 completion
