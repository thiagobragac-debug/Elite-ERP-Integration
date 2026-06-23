#!/usr/bin/env node

/**
 * Verify Staging Deployment Secrets
 * 
 * This script checks if all required GitHub secrets are configured
 * for staging deployment on the develop branch.
 * 
 * Requirements: 13.3, 13.6
 * Task: 29.1 - Setup staging deployment on develop branch
 * 
 * Usage:
 *   node scripts/verify-staging-secrets.js
 * 
 * Prerequisites:
 *   - GitHub CLI (gh) installed and authenticated
 */

import { execSync } from 'child_process';

const REQUIRED_SECRETS = [
  {
    name: 'VERCEL_TOKEN',
    description: 'Vercel authentication token',
    howToGet: 'Vercel Dashboard → Account → Tokens → Create Token',
  },
  {
    name: 'VERCEL_ORG_ID',
    description: 'Vercel organization ID',
    howToGet: 'Run "vercel link" and check .vercel/project.json',
  },
  {
    name: 'VERCEL_PROJECT_ID',
    description: 'Vercel project ID',
    howToGet: 'Run "vercel link" and check .vercel/project.json',
  },
  {
    name: 'STAGING_SUPABASE_URL',
    description: 'Staging Supabase project URL',
    howToGet: 'Staging Supabase Dashboard → Settings → API → Project URL',
  },
  {
    name: 'STAGING_SUPABASE_ANON_KEY',
    description: 'Staging Supabase anon key',
    howToGet: 'Staging Supabase Dashboard → Settings → API → anon public',
  },
  {
    name: 'STAGING_STRIPE_PUBLISHABLE_KEY',
    description: 'Staging Stripe publishable key (test mode)',
    howToGet: 'Stripe Dashboard → Developers → API keys → Test mode',
  },
  {
    name: 'STAGING_SENTRY_DSN',
    description: 'Staging Sentry DSN',
    howToGet: 'Staging Sentry Project → Settings → Client Keys (DSN)',
  },
  {
    name: 'STAGING_POSTHOG_KEY',
    description: 'Staging PostHog project key',
    howToGet: 'Staging PostHog → Project Settings → Project API Key',
  },
  {
    name: 'STAGING_POSTHOG_HOST',
    description: 'PostHog host URL',
    howToGet: 'Usually https://app.posthog.com',
  },
  {
    name: 'SLACK_WEBHOOK_URL',
    description: 'Slack webhook for deployment notifications',
    howToGet: 'Slack → Apps → Incoming Webhooks → Add to Channel',
  },
];

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getConfiguredSecrets() {
  try {
    const output = execSync('gh secret list', { encoding: 'utf-8' });
    const secrets = output
      .split('\n')
      .map(line => line.split('\t')[0])
      .filter(Boolean);
    return new Set(secrets);
  } catch (error) {
    log(`\n❌ Error fetching secrets: ${error.message}`, COLORS.red);
    return new Set();
  }
}

function verifySecrets() {
  log('\n📋 Verifying Staging Deployment Secrets...\n', COLORS.bright);

  // Check GitHub CLI
  if (!checkGitHubCLI()) {
    log('❌ GitHub CLI (gh) not found!', COLORS.red);
    log('\nPlease install GitHub CLI:', COLORS.yellow);
    log('  • macOS: brew install gh', COLORS.yellow);
    log('  • Windows: winget install GitHub.cli', COLORS.yellow);
    log('  • Linux: See https://cli.github.com/manual/installation', COLORS.yellow);
    log('\nThen authenticate: gh auth login\n');
    process.exit(1);
  }

  log('✅ GitHub CLI detected\n', COLORS.green);

  // Get configured secrets
  const configuredSecrets = getConfiguredSecrets();

  if (configuredSecrets.size === 0) {
    log('⚠️  No secrets found or unable to fetch secrets\n', COLORS.yellow);
    log('Make sure you are authenticated: gh auth login\n', COLORS.yellow);
    process.exit(1);
  }

  // Check each required secret
  const missing = [];
  const configured = [];

  log('Checking required secrets:\n', COLORS.blue);

  REQUIRED_SECRETS.forEach(secret => {
    if (configuredSecrets.has(secret.name)) {
      log(`  ✅ ${secret.name}`, COLORS.green);
      configured.push(secret);
    } else {
      log(`  ❌ ${secret.name} (MISSING)`, COLORS.red);
      missing.push(secret);
    }
  });

  // Summary
  log('\n' + '='.repeat(60), COLORS.blue);
  log(`\nSummary:`, COLORS.bright);
  log(`  • Total required: ${REQUIRED_SECRETS.length}`);
  log(`  • Configured: ${configured.length}`, COLORS.green);
  log(`  • Missing: ${missing.length}`, missing.length > 0 ? COLORS.red : COLORS.green);

  if (missing.length > 0) {
    log('\n' + '='.repeat(60), COLORS.red);
    log('\n⚠️  Missing Secrets Configuration\n', COLORS.yellow);
    log('The following secrets need to be configured:\n', COLORS.yellow);

    missing.forEach((secret, index) => {
      log(`${index + 1}. ${secret.name}`, COLORS.bright);
      log(`   Description: ${secret.description}`, COLORS.blue);
      log(`   How to get: ${secret.howToGet}\n`, COLORS.blue);
    });

    log('To configure a secret:', COLORS.yellow);
    log('  gh secret set SECRET_NAME\n', COLORS.blue);

    log('Quick setup (interactive):');
    missing.forEach(secret => {
      log(`  gh secret set ${secret.name}`, COLORS.blue);
    });

    log('\n📖 See STAGING_DEPLOYMENT_CHECKLIST.md for detailed instructions\n');

    process.exit(1);
  }

  // Success
  log('\n' + '='.repeat(60), COLORS.green);
  log('\n✅ All staging deployment secrets are configured!\n', COLORS.green);
  log('You can now push to the develop branch to trigger staging deployment.\n');
  log('Deployment flow:', COLORS.blue);
  log('  1. Push to develop branch', COLORS.blue);
  log('  2. CI runs (lint, test, e2e, security)', COLORS.blue);
  log('  3. Deploy to staging (if all checks pass)', COLORS.blue);
  log('  4. Slack notification sent', COLORS.blue);
  log('  5. GitHub commit comment with deployment URL\n', COLORS.blue);

  log('Monitor deployments:', COLORS.yellow);
  log('  • GitHub Actions: gh run list --workflow=ci.yml', COLORS.blue);
  log('  • Vercel Dashboard: https://vercel.com/dashboard', COLORS.blue);
  log('  • Staging URL: https://staging.tauze.app\n', COLORS.blue);

  process.exit(0);
}

// Run verification
verifySecrets();
