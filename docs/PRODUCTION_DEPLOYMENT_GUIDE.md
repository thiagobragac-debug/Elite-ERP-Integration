# Production Deployment Guide - Task 29.2

## Overview

This guide documents the production deployment automation setup for the Tauze ERP v5.0 system. The deployment job is configured to run automatically when code is merged to the `main` branch, with manual approval requirements and full environment variable configuration.

## Configuration Summary

### Deployment Trigger
- **Branch**: `main` only
- **Event**: Push (merge)
- **Dependencies**: Requires `test`, `e2e`, and `security` jobs to pass
- **Approval**: Manual approval required (configured via GitHub Environment Protection Rules)

### Environment Variables

The following environment variables are configured for production deployment:

| Variable | Purpose | Secret Location |
|----------|---------|----------------|
| `VITE_SUPABASE_URL_PROD` | Production Supabase URL | GitHub Secrets |
| `VITE_SUPABASE_ANON_KEY_PROD` | Production Supabase anonymous key | GitHub Secrets |
| `VITE_STRIPE_PUBLISHABLE_KEY_PROD` | Production Stripe publishable key | GitHub Secrets |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | GitHub Secrets |
| `VITE_POSTHOG_KEY` | PostHog analytics key | GitHub Secrets |
| `VITE_POSTHOG_HOST` | PostHog analytics host | GitHub Secrets |

## Setup Instructions

### 1. Configure GitHub Environment

To enable manual approval for production deployments:

1. Navigate to your GitHub repository
2. Go to **Settings** → **Environments**
3. Click **New environment** or edit the `production` environment
4. Configure protection rules:
   - ✅ **Required reviewers**: Add team members who can approve deployments
   - ✅ **Wait timer**: Optional delay before deployment (e.g., 5 minutes)
   - ✅ **Deployment branches**: Select "Selected branches" and add `main`

**Documentation**: [GitHub Environment Protection Rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#environment-protection-rules)

### 2. Add GitHub Secrets

Add the following secrets to your repository:

1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each production secret:

```bash
# Required secrets:
VITE_SUPABASE_URL_PROD=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY_PROD=your-production-anon-key
VITE_STRIPE_PUBLISHABLE_KEY_PROD=pk_live_...
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://app.posthog.com

# Optional secrets (depending on your hosting provider):
VERCEL_TOKEN=...              # For Vercel deployments
NETLIFY_TOKEN=...             # For Netlify deployments
AWS_ACCESS_KEY_ID=...         # For AWS S3 deployments
AWS_SECRET_ACCESS_KEY=...     # For AWS S3 deployments
S3_BUCKET=...                 # Your S3 bucket name
CLOUDFRONT_DIST_ID=...        # Your CloudFront distribution ID
SLACK_WEBHOOK=...             # For Slack notifications
```

### 3. Configure Hosting Provider Deployment

The CI workflow includes commented examples for popular hosting providers. Uncomment and configure the appropriate section:

#### Option A: Vercel

```yaml
- name: Deploy to production
  run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Setup**:
1. Install Vercel CLI: `npm install -g vercel`
2. Generate token: `vercel login` → Account Settings → Tokens
3. Add `VERCEL_TOKEN` to GitHub Secrets
4. Configure `vercel.json` in your project root

#### Option B: Netlify

```yaml
- name: Deploy to production
  run: npx netlify-cli deploy --prod --dir=dist --auth=${{ secrets.NETLIFY_TOKEN }}
```

**Setup**:
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Generate token: Netlify Dashboard → User Settings → Applications → Personal Access Tokens
3. Add `NETLIFY_TOKEN` to GitHub Secrets
4. Configure `netlify.toml` in your project root

#### Option C: AWS S3 + CloudFront

```yaml
- name: Deploy to production
  run: |
    aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
    aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DIST_ID }} --paths "/*"
```

**Setup**:
1. Create S3 bucket configured for static website hosting
2. Create CloudFront distribution pointing to the S3 bucket
3. Create IAM user with S3 and CloudFront permissions
4. Add AWS credentials to GitHub Secrets

#### Option D: Custom Deployment

```yaml
- name: Deploy to production
  run: |
    # Your custom deployment script
    ./scripts/deploy-production.sh
```

### 4. Configure Notifications (Optional)

The workflow includes notification steps that can be configured with various services:

#### Slack Notifications

```yaml
- name: Notify deployment success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: '✅ Production deployment successful!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Setup**:
1. Create a Slack App and enable Incoming Webhooks
2. Add the webhook URL to GitHub Secrets as `SLACK_WEBHOOK`

#### Discord Notifications

```yaml
- name: Notify deployment success
  if: success()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: success
    title: "Production Deployment"
    description: "Deployment completed successfully!"
```

#### Email Notifications

```yaml
- name: Send email notification
  if: success()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "✅ Production Deployment Successful"
    to: team@example.com
    from: ci@example.com
```

## Workflow Execution

### Deployment Process

1. **Trigger**: Code is merged to `main` branch
2. **Pre-checks**: CI pipeline runs all tests and security checks
3. **Approval**: Designated reviewers receive notification
4. **Review**: Reviewers approve or reject the deployment
5. **Build**: Production build is created with production environment variables
6. **Deploy**: Build artifacts are deployed to hosting provider
7. **Notify**: Team is notified of deployment status

### Manual Approval Flow

When a deployment is triggered:

1. GitHub sends notification to configured reviewers
2. Reviewers can:
   - **Approve**: Deployment proceeds
   - **Reject**: Deployment is cancelled
   - **Comment**: Leave feedback before decision
3. Deployment waits for approval (no timeout by default)
4. Once approved, deployment executes immediately

### Monitoring Deployment Status

Check deployment status:
- **GitHub UI**: Repository → Actions → Select workflow run
- **GitHub CLI**: `gh run list --workflow=ci.yml`
- **API**: `GET /repos/{owner}/{repo}/actions/runs`

View deployment logs:
- Navigate to the workflow run
- Click on the `Deploy to Production` job
- Expand each step to view detailed logs

## Security Considerations

### Secret Management

- ✅ **Production secrets** use `_PROD` suffix to distinguish from staging
- ✅ **Secrets are never logged** or exposed in workflow output
- ✅ **Environment protection** ensures only approved deployments can access production secrets
- ✅ **Least privilege**: Each hosting provider token should have minimal required permissions

### Deployment Safety

- ✅ **Manual approval required**: Prevents accidental deployments
- ✅ **All tests must pass**: Ensures code quality
- ✅ **Security audit runs**: Checks for vulnerabilities
- ✅ **Branch protection**: Only `main` branch can trigger production deployments

### Rollback Strategy

If a deployment fails or introduces issues:

1. **Immediate rollback**: Revert the commit on `main` and push
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Hosting provider rollback**: Use provider's rollback feature
   - **Vercel**: Dashboard → Deployments → Select previous → "Promote to Production"
   - **Netlify**: Dashboard → Deploys → Select previous → "Publish deploy"
   - **AWS**: Restore previous S3 bucket version or use CloudFormation rollback

3. **Manual intervention**: Access hosting provider dashboard and restore previous deployment

## Testing the Deployment

### 1. Test in Staging First

Before deploying to production, verify the deployment process in staging:

```bash
git checkout develop
git pull origin develop
# Staging deployment triggers automatically
```

### 2. Dry Run (Optional)

Test the deployment workflow without actually deploying:

1. Create a test environment in GitHub
2. Modify the workflow to use the test environment
3. Push to a test branch and verify the workflow runs correctly

### 3. Verify Production Deployment

After deployment:

1. ✅ Check application loads: Visit production URL
2. ✅ Verify authentication: Test login functionality
3. ✅ Check critical paths: Test main user flows
4. ✅ Monitor errors: Check Sentry for new errors
5. ✅ Check analytics: Verify PostHog events are tracking
6. ✅ Review logs: Check hosting provider logs for errors

## Troubleshooting

### Deployment Job Not Triggering

**Issue**: Production deployment doesn't start after merging to `main`

**Solutions**:
1. Verify the branch name is exactly `main` (not `master`)
2. Check that the push event triggered: `git log --oneline -1`
3. Verify all prerequisite jobs (`test`, `e2e`, `security`) passed
4. Check GitHub Actions are enabled for the repository

### Approval Not Received

**Issue**: Waiting for manual approval but no notification received

**Solutions**:
1. Verify reviewers are configured in Environment settings
2. Check reviewer notification settings in GitHub
3. Manually check: Repository → Actions → Workflow run → "Review deployments"
4. Ensure the `production` environment exists

### Build Fails with Environment Variable Errors

**Issue**: Build step fails with "Missing required environment variables"

**Solutions**:
1. Verify all required secrets are added to GitHub Secrets
2. Check secret names match exactly (case-sensitive)
3. Verify secrets are accessible in the `production` environment
4. Test locally: `npm run build` with production `.env`

### Deployment Step Fails

**Issue**: Deployment command fails or times out

**Solutions**:
1. Verify hosting provider token/credentials are valid
2. Check hosting provider status: [Vercel Status](https://www.vercel-status.com/), [Netlify Status](https://www.netlifystatus.com/)
3. Review hosting provider logs for errors
4. Test deployment manually: Run deployment command locally
5. Increase timeout if needed: Add `timeout-minutes: 30` to job

### Notifications Not Sent

**Issue**: Deployment succeeds but team is not notified

**Solutions**:
1. Verify webhook URL is correct in GitHub Secrets
2. Test webhook manually: `curl -X POST $WEBHOOK_URL -d '{"text":"test"}'`
3. Check notification service logs (Slack, Discord, etc.)
4. Verify the `if: success()` or `if: failure()` condition is correct

## Requirements Validation

This implementation satisfies the following requirements:

### Requirement 13.4
> THE CI_Pipeline SHALL deploy to production when code is merged to the `main` branch

✅ **Satisfied**: Deployment job triggers on `push` events to `main` branch only

### Requirement 13.6
> THE CI_Pipeline SHALL notify the team of deployment success or failure

✅ **Satisfied**: 
- Success notification step included with deployment details
- Failure notification step included with error context
- Extensible with Slack, Discord, or email integrations

## Next Steps

1. **Configure hosting provider** (Uncomment and test the appropriate deployment method)
2. **Set up GitHub Environment** (Add protection rules and reviewers)
3. **Add GitHub Secrets** (All production environment variables)
4. **Configure notifications** (Slack, Discord, or email)
5. **Test staging deployment** (Task 29.1 - Deploy to `develop` branch)
6. **Perform dry run** (Optional - Test with a non-production environment)
7. **Production deployment** (Merge to `main` and monitor)
8. **Integrate Sentry releases** (Task 29.3 - Track deployments in Sentry)

## References

- [GitHub Actions Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)

## Related Documentation

- `DEPLOYMENT_AND_KEY_REVOCATION_GUIDE.md` - Key rotation and deployment procedures
- `ci.yml` - Complete CI/CD workflow configuration
- `.env.example` - Environment variable reference
