# Sentry Secrets Setup Checklist

This checklist helps you configure the required GitHub Secrets for Sentry release tracking.

## Prerequisites

- [ ] You have a Sentry account
- [ ] You have created a Sentry organization
- [ ] You have created a Sentry project for your application
- [ ] You have admin access to your GitHub repository

## Step 1: Create Sentry Auth Token

1. [ ] Go to [Sentry Dashboard](https://sentry.io/)
2. [ ] Navigate to: **Settings → Account → API → Auth Tokens**
3. [ ] Click **"Create New Token"**
4. [ ] Configure the token:
   - **Name**: `GitHub Actions CI/CD`
   - **Scopes**: Select the following:
     - [ ] `project:releases`
     - [ ] `project:write`
     - [ ] `org:read`
5. [ ] Click **"Create Token"**
6. [ ] **IMPORTANT**: Copy the token immediately (you won't be able to see it again)
7. [ ] Store it securely (you'll add it to GitHub in the next step)

## Step 2: Get Sentry Organization Slug

1. [ ] Go to [Sentry Dashboard](https://sentry.io/)
2. [ ] Navigate to: **Settings → General**
3. [ ] Copy the **"Organization Slug"** value
   - Example: `my-company` (from URL: `sentry.io/organizations/my-company/`)
4. [ ] Save this value for the next step

## Step 3: Get Sentry Project Slug

1. [ ] Go to [Sentry Dashboard](https://sentry.io/)
2. [ ] Navigate to: **Projects → [Your Project]**
3. [ ] Click on **Settings → General**
4. [ ] Copy the **"Project Slug"** value
   - Example: `tauze-erp-frontend`
5. [ ] Save this value for the next step

## Step 4: Add Secrets to GitHub

### Option A: Via GitHub Web Interface

1. [ ] Go to your GitHub repository
2. [ ] Navigate to: **Settings → Secrets and variables → Actions**
3. [ ] Click **"New repository secret"**
4. [ ] Add the following secrets one by one:

#### Required Secrets

**VITE_SENTRY_AUTH_TOKEN**
- [ ] Name: `VITE_SENTRY_AUTH_TOKEN`
- [ ] Value: `<paste the auth token from Step 1>`
- [ ] Click **"Add secret"**

**SENTRY_ORG**
- [ ] Name: `SENTRY_ORG`
- [ ] Value: `<paste the organization slug from Step 2>`
- [ ] Click **"Add secret"**

**SENTRY_PROJECT**
- [ ] Name: `SENTRY_PROJECT`
- [ ] Value: `<paste the project slug from Step 3>`
- [ ] Click **"Add secret"**

### Option B: Via GitHub CLI

If you have the [GitHub CLI](https://cli.github.com/) installed:

```bash
# Set the auth token
gh secret set VITE_SENTRY_AUTH_TOKEN
# Paste your token when prompted

# Set the organization slug
gh secret set SENTRY_ORG
# Enter your org slug when prompted

# Set the project slug
gh secret set SENTRY_PROJECT
# Enter your project slug when prompted
```

## Step 5: Verify Existing Sentry DSN Secrets

These secrets should already be configured from previous Sentry setup:

- [ ] `VITE_SENTRY_DSN` (Production DSN)
- [ ] `STAGING_SENTRY_DSN` (Staging DSN)

If not configured, add them:

1. [ ] Go to Sentry Dashboard → **Projects → [Your Project]**
2. [ ] Navigate to **Settings → Client Keys (DSN)**
3. [ ] Copy the **DSN** value
4. [ ] Add to GitHub Secrets:
   - Name: `VITE_SENTRY_DSN` (for production)
   - Value: `<paste the DSN>`

## Step 6: Test the Configuration

### Test Build Locally (Optional)

You can test the Sentry integration locally:

```bash
# Set environment variables
export VITE_SENTRY_AUTH_TOKEN="your-token"
export SENTRY_ORG="your-org"
export SENTRY_PROJECT="your-project"
export VITE_SENTRY_RELEASE="test-release"
export CI=true

# Build with Sentry integration
npm run build
```

Expected output:
```
✓ Sentry plugin: Source maps uploaded successfully
✓ Release created: test-release
```

### Test via GitHub Actions

1. [ ] Push a commit to the `develop` branch (for staging) or `main` branch (for production)
2. [ ] Go to: **Actions** tab in your GitHub repository
3. [ ] Click on the latest workflow run
4. [ ] Expand the **"Build for staging/production"** step
5. [ ] Look for Sentry-related output:
   ```
   ✓ Sentry plugin: Source maps uploaded
   ```
6. [ ] Expand the **"Create Sentry release"** step
7. [ ] Verify it completed successfully

### Verify in Sentry Dashboard

1. [ ] Go to [Sentry Dashboard](https://sentry.io/)
2. [ ] Navigate to: **Releases**
3. [ ] You should see a new release with the commit SHA
4. [ ] Click on the release to verify:
   - [ ] Environment is set correctly (staging or production)
   - [ ] Commits are associated with the release
   - [ ] Source maps are uploaded (under "Artifacts" tab)

## Step 7: Test Error Tracking with Source Maps

1. [ ] Deploy your application to staging or production
2. [ ] Trigger a test error in the application:
   ```typescript
   // Add this temporarily to test
   throw new Error('Test error for Sentry release tracking');
   ```
3. [ ] Go to Sentry Dashboard → **Issues**
4. [ ] Click on the error
5. [ ] Verify the stack trace shows:
   - [ ] Original TypeScript/JSX code (not minified)
   - [ ] Correct file names and line numbers
   - [ ] Syntax highlighting
   - [ ] Release version (commit SHA)
6. [ ] Remove the test error

## Troubleshooting

### ❌ "Sentry plugin failed: Unauthorized"

**Problem**: The auth token is invalid or doesn't have the right scopes.

**Solution**: 
1. Go back to Step 1 and create a new token
2. Ensure the token has `project:releases`, `project:write`, and `org:read` scopes
3. Update the `VITE_SENTRY_AUTH_TOKEN` secret in GitHub

### ❌ "Release creation failed: Project not found"

**Problem**: The `SENTRY_ORG` or `SENTRY_PROJECT` values are incorrect.

**Solution**:
1. Verify the values in Sentry Dashboard
2. Ensure there are no typos or extra spaces
3. Update the secrets in GitHub

### ❌ Source maps not showing in Sentry

**Problem**: Source maps weren't uploaded or the upload failed.

**Solution**:
1. Check the GitHub Actions logs for Sentry plugin errors
2. Verify `sourcemap: true` is set in the build configuration
3. Ensure the build completed successfully before the deploy step

### ❌ Release not appearing in Sentry

**Problem**: The `getsentry/action-release@v1` step failed.

**Solution**:
1. Check the "Create Sentry release" step in GitHub Actions logs
2. Verify all three secrets are set correctly
3. Ensure the Sentry project exists and is accessible

## Security Notes

- ✅ **Never commit secrets to the repository**
- ✅ **Rotate auth tokens if exposed**
- ✅ **Use minimal scopes for auth tokens**
- ✅ **Source maps are only uploaded to Sentry, not served to users**
- ✅ **Auth token is only used during build, never embedded in the app**

## Reference

For detailed information, see: [`SENTRY_RELEASE_TRACKING_GUIDE.md`](./SENTRY_RELEASE_TRACKING_GUIDE.md)

## Completion

- [ ] All secrets configured in GitHub
- [ ] Test build completed successfully
- [ ] Release visible in Sentry Dashboard
- [ ] Source maps working in error stack traces
- [ ] Documentation reviewed and understood

✅ **Sentry release tracking is now fully configured!**
