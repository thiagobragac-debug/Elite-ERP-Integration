# Sentry Error Tracking Testing Guide

**Task ID:** 23.5  
**Status:** Testing Phase  
**Requirements:** 10.2, 10.3, 10.5, 10.6

## Overview

This guide provides comprehensive instructions for testing the Sentry error tracking integration in Tauze ERP v5.0. The testing validates that errors are properly captured, enriched with context, and filtered for sensitive data.

## Prerequisites

Before testing, ensure the following are configured:

### 1. Sentry Project Setup

1. **Create a Sentry Account** (if not already done):
   - Go to https://sentry.io/signup/
   - Create an account or log in

2. **Create a New Project**:
   - Navigate to Projects → Create Project
   - Select **React** as the platform
   - Name: "Tauze ERP Production"
   - Team: Select or create appropriate team
   - Click "Create Project"

3. **Get the DSN (Data Source Name)**:
   - After project creation, copy the DSN
   - Format: `https://[key]@[organization].ingest.sentry.io/[project-id]`
   - Alternative: Settings → Projects → [Your Project] → Client Keys (DSN)

### 2. Environment Configuration

Add the Sentry DSN to your environment:

```bash
# .env.production or .env.local (for production builds)
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id

# Note: Sentry only initializes in production mode (VITE_PROD=true)
```

### 3. Build Production Bundle

Sentry is disabled in development mode to avoid noise. You must build and serve the production bundle:

```bash
# Build production bundle
npm run build

# Serve production build locally
npm run preview
```

The preview server typically runs on `http://localhost:4173`

## Test Page Access

### Navigate to Sentry Error Test Page

1. **Log in** to the application
2. Navigate to: **Admin → Sentry Test** 
   - Direct URL: `http://localhost:4173/admin/sentry-test`
3. Ensure you're logged in with a valid user and tenant selected

### Environment Check

The test page will display:
- ✅ **Green banner**: "Production Mode - Sentry Active" → Ready to test
- ⚠️ **Yellow banner**: "Development Mode - Sentry Disabled" → Build production first

## Test Execution

### Automated Test Suite

Click the **"Run All Tests"** button to execute all test cases automatically with staggered timing.

### Individual Test Cases

Each test case can be run independently:

#### 1. Basic Error Test
**Purpose:** Validates basic error capture with stack trace

**Expected Result:**
- Error appears in Sentry dashboard
- Full stack trace visible
- Error message: "Test error from Sentry error test page"

**Verification in Sentry:**
```
Issue: Error: Test error from Sentry error test page
Stack Trace: Shows SentryErrorTest.tsx → runTest → test function
Event ID: Displayed on test page
```

#### 2. Tenant Context Test
**Purpose:** Validates tenant_id and tenant name enrichment

**Expected Result:**
- Error includes tenant context
- Tags: `tenant_id` = current tenant UUID
- Context section "tenant" with id and name

**Verification in Sentry:**
```
Tags:
  tenant_id: 00000000-0000-0000-0000-000000000000
Context → tenant:
  id: 00000000-0000-0000-0000-000000000000
  name: "Your Tenant Name"
```

#### 3. User Context Test
**Purpose:** Validates user_id, email, and role enrichment

**Expected Result:**
- Error includes user context
- User section with id, email, role, tenant_id

**Verification in Sentry:**
```
User:
  id: user-uuid-here
  email: user@example.com
  role: admin
  tenant_id: tenant-uuid-here
```

#### 4. Sensitive Data Filtering Test ⚠️ CRITICAL
**Purpose:** Validates that sensitive data is filtered to [FILTERED]

**Test Data Included:**
- `password`: "super_secret_password_123"
- `api_key`: "sk_test_EXAMPLE_KEY_FILTERED"
- `token`: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
- `card_number`: "4242424242424242"
- `cvv`: "123"

**Expected Result:**
- All sensitive fields replaced with `[FILTERED]`
- No actual passwords, tokens, or keys visible in Sentry

**Verification in Sentry:**
```json
{
  "username": "testuser",
  "password": "[FILTERED]",
  "api_key": "[FILTERED]",
  "token": "[FILTERED]",
  "card_number": "[FILTERED]",
  "cvv": "[FILTERED]"
}
```

**❌ FAILURE SCENARIO:** If actual sensitive values appear, the `beforeSend` hook is not working correctly.

#### 5. Async Error Test
**Purpose:** Validates error capture from asynchronous operations

**Expected Result:**
- Error captured after 100ms timeout
- Stack trace includes async context

#### 6. Network Error Test
**Purpose:** Validates network/API error categorization

**Expected Result:**
- Error tagged as `error_type: network`
- Additional context: statusCode, endpoint

**Verification in Sentry:**
```
Tags:
  error_type: network
Extra:
  statusCode: 500
  endpoint: /api/test-endpoint
```

#### 7. Validation Error Test
**Purpose:** Validates form validation error categorization

**Expected Result:**
- Error tagged as `error_type: validation`
- Additional context: field, value

**Verification in Sentry:**
```
Tags:
  error_type: validation
Extra:
  field: cpf
  value: ""
```

#### 8. Nested Error Test
**Purpose:** Validates stack trace depth for nested function calls

**Expected Result:**
- Stack trace shows all nested levels: level1 → level2 → level3
- Error message: "Error from deeply nested function"

## Verification Checklist

Use this checklist to validate requirements:

### ✅ Requirement 10.2: Error Capture with Stack Trace

- [ ] Error appears in Sentry dashboard within 5 seconds
- [ ] Full stack trace visible (file names, line numbers, function names)
- [ ] Error message clearly displayed
- [ ] Event ID matches the one shown on test page

### ✅ Requirement 10.3: Context Enrichment

**Tenant Context:**
- [ ] `tenant_id` tag present
- [ ] `tenant` context object with id and name
- [ ] Tenant information matches current logged-in tenant

**User Context:**
- [ ] User id present
- [ ] User email present
- [ ] User role present
- [ ] User tenant_id matches tenant context

**Module Context:**
- [ ] `module` tag = "Admin"
- [ ] `page` tag = "SentryErrorTest"
- [ ] `navigation` context object with module and page

### ✅ Requirement 10.5: Session Replay

- [ ] Session replay available for error event
- [ ] Replay shows user actions leading to error
- [ ] Text is masked (privacy protection)
- [ ] Media is blocked (privacy protection)

**How to Check:**
1. Open error in Sentry dashboard
2. Look for "Replay" tab or section
3. Click to view session replay
4. Verify replay shows actions before error

### ✅ Requirement 10.6: Sensitive Data Filtering

- [ ] `password` field = `[FILTERED]`
- [ ] `api_key` field = `[FILTERED]`
- [ ] `token` field = `[FILTERED]`
- [ ] `card_number` field = `[FILTERED]`
- [ ] `cvv` field = `[FILTERED]`
- [ ] Authorization headers removed
- [ ] Cookie headers removed

**Where to Check:**
- Event Details → Additional Data → Extra
- Event Details → Breadcrumbs
- Event Details → Request → Headers

## Sentry Dashboard Navigation

### Finding Test Errors

1. **Go to Issues**:
   - Navigate to Issues tab in Sentry dashboard
   - Should see new issues appearing as tests run

2. **Filter by Test**:
   - Search: "Test error from Sentry"
   - Or filter by tag: `test_type:manual_error_test`

3. **View Error Details**:
   - Click on any issue
   - Explore tabs: Details, Breadcrumbs, Tags, Context, User, Replay

### Key Sections to Review

#### Event Details Tab
- **Message**: Error message
- **Stack Trace**: Full call stack with source maps
- **Tags**: All custom tags (tenant_id, module, page, error_type)
- **Contexts**: Custom context objects (tenant, navigation)
- **User**: User information
- **Additional Data**: Extra context and filtered data

#### Breadcrumbs Tab
- Navigation events
- Console logs
- User interactions
- Network requests (with sensitive data filtered)

#### Replay Tab (if available)
- Video-like replay of user session
- Masked text for privacy
- Timeline of events leading to error

## Common Issues & Troubleshooting

### Issue: "Development Mode - Sentry Disabled" Banner

**Cause:** Application running in development mode

**Solution:**
```bash
npm run build
npm run preview
```

### Issue: Errors Not Appearing in Sentry

**Possible Causes:**
1. DSN not configured
2. Incorrect DSN format
3. Network blocked (firewall/proxy)
4. Sentry project deleted or disabled

**Solutions:**
1. Verify `VITE_SENTRY_DSN` in environment
2. Check DSN format: `https://[key]@[org].ingest.sentry.io/[project-id]`
3. Check browser console for Sentry initialization errors
4. Test network connectivity to `sentry.io`

### Issue: Sensitive Data Not Filtered

**Cause:** `beforeSend` hook not executing

**Debug Steps:**
1. Check `src/lib/sentry.ts` - ensure `beforeSend` is defined
2. Verify `filterSensitiveData()` function logic
3. Add console.log in `beforeSend` to debug
4. Check if error is being captured at all

### Issue: Context Not Attached

**Cause:** Context not set before error occurs

**Debug Steps:**
1. Verify `setUserContext()` called after login
2. Verify `setTenantContext()` called after tenant selection
3. Check if context is being cleared unexpectedly
4. Verify `import.meta.env.PROD` is true

### Issue: Session Replay Not Available

**Possible Causes:**
1. Replay not enabled in Sentry init
2. Sample rate set to 0
3. Sentry plan doesn't include replay

**Solutions:**
1. Check `replaysOnErrorSampleRate: 1.0` in `sentry.ts`
2. Verify `Sentry.replayIntegration()` in integrations
3. Check Sentry plan features

## Performance Considerations

### Sentry Impact on Production

- **Bundle Size**: ~50KB gzipped (Sentry SDK)
- **Runtime Overhead**: Negligible (<1% CPU)
- **Network**: ~2KB per error event
- **Sample Rates**:
  - Performance: 10% of transactions (`tracesSampleRate: 0.1`)
  - Session Replay: 10% of sessions, 100% of errors
  - Errors: 100% capture

### Rate Limiting

Sentry automatically rate limits to prevent overwhelming:
- Max 600 events per minute per project (default)
- Max 10 events per second per client
- Configurable in Sentry dashboard

## Testing in Different Environments

### Development Testing
**NOT RECOMMENDED** - Sentry is disabled by design

If you must test in dev:
```typescript
// Temporarily in src/lib/sentry.ts
export function initSentry(): void {
  const isProduction = import.meta.env.PROD;
  
  // Comment out this check for dev testing
  // if (!isProduction) {
  //   console.log('[Sentry] Skipping initialization in development mode');
  //   return;
  // }
  
  // ... rest of initialization
}
```

**Remember to uncomment before committing!**

### Staging Testing
```bash
# Build with staging environment
VITE_SENTRY_DSN=https://staging-key@org.ingest.sentry.io/staging-project npm run build

# Deploy to staging
```

### Production Testing
**Use with caution!** Only trigger test errors if necessary.

Alternative: Create dedicated "Sentry Test" environment in Sentry for production testing.

## Documentation for Developers

### How to Use Sentry in Code

#### Manual Error Capture
```typescript
import * as Sentry from '@sentry/react';

try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: 'risky_operation' },
    extra: { context: 'additional info' },
  });
  throw error; // Re-throw if needed
}
```

#### Manual Message Capture
```typescript
Sentry.captureMessage('Something unusual happened', {
  level: 'warning',
  tags: { module: 'Pecuária' },
});
```

#### Adding Breadcrumbs
```typescript
Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User clicked export button',
  level: 'info',
  data: { format: 'xlsx', rows: 150 },
});
```

#### Setting Context
```typescript
import { setUserContext, setTenantContext, setModuleContext } from '@/lib/sentry';

// After login
setUserContext(user, tenantId);
setTenantContext(tenantId, tenantName);

// On route change
setModuleContext('Pecuária', 'AnimalManagement');

// On logout
clearSentryContext();
```

## Next Steps After Testing

1. **Document Test Results**:
   - Take screenshots of Sentry dashboard showing successful captures
   - Note any issues or failures
   - Update task status in tasks.md

2. **Remove Test Page from Production** (Optional):
   - Comment out the route in App.tsx
   - Or add permission guard to restrict access

3. **Configure Alerts**:
   - Set up email/Slack alerts for critical errors
   - Configure alert rules in Sentry dashboard

4. **Team Training**:
   - Share this guide with team
   - Train on how to use Sentry dashboard
   - Establish error triage process

## References

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Session Replay Documentation](https://docs.sentry.io/product/session-replay/)
- [Data Scrubbing Documentation](https://docs.sentry.io/platforms/javascript/data-management/sensitive-data/)
- Task 23.1-23.4 Completion Summaries in `docs/`

## Summary

This testing guide ensures comprehensive validation of the Sentry error tracking integration. All four requirements (10.2, 10.3, 10.5, 10.6) are tested through the dedicated test page and verified in the Sentry dashboard.

**Test Page:** `/admin/sentry-test`  
**Status:** Ready for testing in production builds  
**Time Required:** ~15 minutes for full validation  
