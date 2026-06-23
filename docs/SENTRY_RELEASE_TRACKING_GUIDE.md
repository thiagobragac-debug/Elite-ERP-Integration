# Sentry Release Tracking Guide

## Overview

Sentry release tracking has been integrated into the CI/CD pipeline to automatically associate errors with specific code releases. This enables:

- **Version-specific error tracking**: See which errors are introduced in each release
- **Regression detection**: Identify when bugs are introduced or fixed
- **Source map support**: View original source code in error stack traces
- **Deployment tracking**: Monitor error rates after each deployment
- **Commit integration**: Link errors to specific commits and PRs

## How It Works

### Build Process

1. **Source Maps Generation**: During production builds, Vite generates source maps alongside the minified JavaScript bundles
2. **Sentry Vite Plugin**: Automatically uploads source maps to Sentry and creates a release
3. **Release Naming**: Each release is named using the Git commit SHA (`${{ github.sha }}`)
4. **Environment Tagging**: Releases are tagged with their environment (staging or production)

### Deployment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CI/CD DEPLOYMENT FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

Push to main/develop
        │
        ▼
┌───────────────────┐
│  Build with       │
│  Source Maps      │ ← VITE_SENTRY_RELEASE=${{ github.sha }}
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Sentry Vite       │
│ Plugin Uploads    │ ← Uploads source maps to Sentry
│ Source Maps       │   Deletes .map files after upload
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Create Sentry     │
│ Release           │ ← Associates release with commits
└─────────┬─────────┘   Sets environment (staging/production)
          │
          ▼
┌───────────────────┐
│ Deploy to         │
│ Hosting Platform  │
└───────────────────┘
```

## Required Secrets Configuration

### GitHub Secrets

You need to configure the following secrets in your GitHub repository:

#### Sentry Authentication

1. **VITE_SENTRY_AUTH_TOKEN**
   - **Description**: Sentry authentication token for uploading source maps and creating releases
   - **How to Get**: 
     1. Go to Sentry Dashboard → Settings → Account → API → Auth Tokens
     2. Click "Create New Token"
     3. Name: "GitHub Actions CI/CD"
     4. Scopes: `project:releases`, `project:write`, `org:read`
     5. Copy the token immediately (it won't be shown again)
   - **Used In**: Build step and Sentry release creation

2. **SENTRY_ORG**
   - **Description**: Your Sentry organization slug
   - **How to Get**: 
     1. Go to Sentry Dashboard → Settings → General
     2. Copy the "Organization Slug" value
     3. Example: `my-company` (from URL: sentry.io/organizations/my-company/)
   - **Used In**: Build step and Sentry release creation

3. **SENTRY_PROJECT**
   - **Description**: Your Sentry project slug
   - **How to Get**: 
     1. Go to Sentry Dashboard → Projects → Select your project
     2. Go to Settings → General
     3. Copy the "Project Slug" value
     4. Example: `tauze-erp-frontend`
   - **Used In**: Build step and Sentry release creation

#### Sentry DSN (Already Configured)

4. **VITE_SENTRY_DSN** (Production)
   - Already configured for production error tracking
   - Used to send errors to Sentry

5. **STAGING_SENTRY_DSN** (Staging)
   - Already configured for staging error tracking
   - Can be the same project or a separate staging project

### Setting GitHub Secrets

```bash
# Via GitHub UI:
# 1. Go to your repository on GitHub
# 2. Settings → Secrets and variables → Actions
# 3. Click "New repository secret"
# 4. Add each secret with its value

# Via GitHub CLI:
gh secret set VITE_SENTRY_AUTH_TOKEN
gh secret set SENTRY_ORG
gh secret set SENTRY_PROJECT
```

## Verification

### 1. Check Build Logs

After a deployment, check the GitHub Actions logs for:

```
✓ Sentry plugin: Source maps uploaded successfully
✓ Release created: <commit-sha>
✓ Deploy associated with release
```

### 2. Verify in Sentry Dashboard

1. Go to Sentry Dashboard → Releases
2. You should see a new release with the commit SHA
3. Click on the release to see:
   - Associated commits
   - Deployed environment
   - Source maps (under "Artifacts")
   - New errors in this release

### 3. Test Error with Source Maps

1. Trigger an error in your production app
2. Go to Sentry → Issues → Click on the error
3. View the stack trace
4. You should see:
   - Original TypeScript/JSX code (not minified)
   - Correct file names and line numbers
   - Syntax highlighting

## Configuration Details

### Vite Configuration

The `vite.config.ts` file includes:

```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
      
      // Upload source maps
      sourcemaps: {
        assets: './dist/**',
        ignore: ['node_modules/**'],
        filesToDeleteAfterUpload: ['./dist/**/*.map'], // Clean up after upload
      },
      
      // Release configuration
      release: {
        name: process.env.VITE_SENTRY_RELEASE || process.env.GITHUB_SHA,
        deploy: {
          env: process.env.VITE_ENVIRONMENT || 'production',
        },
      },
      
      // Only enabled in CI
      disable: !process.env.CI,
    })
  ],
  build: {
    // Source maps enabled for CI builds only
    sourcemap: process.env.CI ? true : false,
  }
})
```

### Sentry Initialization

The `src/lib/sentry.ts` includes release tracking:

```typescript
Sentry.init({
  dsn,
  environment,
  release: import.meta.env.VITE_SENTRY_RELEASE || 'unknown',
  // ... other config
})
```

### CI/CD Workflow

Both `deploy-staging` and `deploy-production` jobs include:

1. **Build Step**: Sets `VITE_SENTRY_RELEASE=${{ github.sha }}` and other Sentry environment variables
2. **Sentry Release Step**: Uses `getsentry/action-release@v1` to finalize the release

## Release Naming Convention

- **Format**: Git commit SHA (e.g., `a1b2c3d4e5f6...`)
- **Why**: Unique identifier that links errors directly to code changes
- **Alternative**: You can use semantic versioning (e.g., `v1.2.3`) by setting `VITE_SENTRY_RELEASE` to your version number

### Using Semantic Versioning

If you prefer semantic versioning instead of commit SHAs:

1. Update the workflow to use your version:
   ```yaml
   env:
     VITE_SENTRY_RELEASE: "v1.2.3"  # Or read from package.json
   ```

2. Read from package.json:
   ```yaml
   - name: Get version
     id: version
     run: echo "version=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT
   
   - name: Build
     env:
       VITE_SENTRY_RELEASE: "v${{ steps.version.outputs.version }}"
   ```

## Troubleshooting

### Source Maps Not Uploading

**Symptom**: Errors show minified code in Sentry

**Solutions**:
1. Check that `VITE_SENTRY_AUTH_TOKEN` is set correctly
2. Verify the token has `project:releases` and `project:write` scopes
3. Check build logs for Sentry plugin errors
4. Ensure `sourcemap: true` in build configuration

### Release Not Created

**Symptom**: No release appears in Sentry dashboard

**Solutions**:
1. Check that `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry settings exactly
2. Verify the `getsentry/action-release@v1` step completed successfully
3. Check if the release was created with a different name than expected

### Wrong Environment Tagged

**Symptom**: Staging errors appear under production (or vice versa)

**Solutions**:
1. Verify `VITE_ENVIRONMENT` is set correctly in each deployment job
2. Check that staging and production use different Sentry DSNs (if using separate projects)
3. Ensure the `environment` parameter in the release action matches

### Source Maps Too Large

**Symptom**: Upload times are very long or fail

**Solutions**:
1. Source maps are automatically cleaned up after upload (`filesToDeleteAfterUpload`)
2. Consider using selective upload patterns in `sourcemaps.assets`
3. Exclude vendor chunks if not needed: `ignore: ['node_modules/**', 'vendor-*.js.map']`

## Best Practices

### 1. Use Separate Sentry Projects for Staging and Production

This prevents staging errors from polluting production error tracking:

```yaml
# Production
VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN_PROD }}
SENTRY_PROJECT: tauze-erp-production

# Staging
VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN_STAGING }}
SENTRY_PROJECT: tauze-erp-staging
```

### 2. Monitor Release Health

After each deployment:
1. Go to Sentry → Releases → Latest release
2. Check "Release Health" tab
3. Monitor for:
   - New error types
   - Spike in error rate
   - Affected users

### 3. Set Up Alerts

Configure Sentry alerts for new releases:
1. Go to Sentry → Alerts → Create Alert
2. Condition: "An issue is first seen in a release"
3. Action: Notify via Slack/Email/PagerDuty

### 4. Integrate with Commits

The workflow automatically associates releases with commits (`set_commits: auto`). This enables:
- Viewing which commits introduced errors
- Linking to GitHub PRs
- Tracking which developers worked on the code

### 5. Clean Up Old Releases

Sentry retains all releases by default. To manage storage:
1. Go to Sentry → Project Settings → General → Advanced Settings
2. Configure "Release Retention" policy
3. Recommended: Keep releases for 90 days

## Security Considerations

### Source Maps in Production

- **Source maps are uploaded to Sentry** but **not served to end users**
- The `filesToDeleteAfterUpload` option removes .map files from the deployed bundle
- Only Sentry users with project access can view the original source code

### Auth Token Security

- **Never commit `VITE_SENTRY_AUTH_TOKEN` to the repository**
- Store it as a GitHub Secret
- Rotate the token if it's ever exposed
- Use minimal scopes: `project:releases`, `project:write`, `org:read`

### Environment Variables

All Sentry configuration is injected at build time:
- `VITE_SENTRY_RELEASE`: Embedded in the built JavaScript
- `VITE_SENTRY_DSN`: Public (safe to expose, but specific to your project)
- `VITE_SENTRY_AUTH_TOKEN`: Only used during build, never embedded in the app

## Further Reading

- [Sentry Releases Documentation](https://docs.sentry.io/product/releases/)
- [Sentry Source Maps Guide](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Sentry Vite Plugin](https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite/)
- [GitHub Actions Sentry Release Action](https://github.com/getsentry/action-release)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review GitHub Actions logs for error messages
3. Check Sentry dashboard for configuration issues
4. Contact the DevOps team for assistance
