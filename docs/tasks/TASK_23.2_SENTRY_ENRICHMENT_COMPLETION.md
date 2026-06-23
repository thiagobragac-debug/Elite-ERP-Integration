# Task 23.2 Completion Summary: Sentry Error Enrichment and Context

## Task Overview

**Task ID:** 23.2  
**Task Name:** Configure error enrichment and context  
**Spec:** system-improvements  
**Status:** ✅ Completed

## Implementation Summary

Configured comprehensive Sentry error enrichment with multi-tenant context, user context, module tracking, and sensitive data filtering. The implementation ensures all production errors are captured with rich context while automatically filtering sensitive information like passwords, tokens, and API keys.

## Files Created

### 1. `src/lib/sentry.ts` - Core Sentry Configuration

**Purpose:** Central Sentry initialization and context management

**Key Functions:**
- `initSentry()` - Initialize Sentry with all configurations
- `setUserContext(user, tenantId)` - Set user and tenant context
- `setTenantContext(tenantId, tenantName)` - Set tenant-specific context
- `setModuleContext(module, page)` - Set module/page location context
- `clearSentryContext()` - Clear all contexts on logout

**Features Implemented:**
✅ Automatic initialization in production only  
✅ Environment variable validation (VITE_SENTRY_DSN)  
✅ Performance monitoring (10% transaction sampling)  
✅ Session replay (10% normal sessions, 100% error sessions)  
✅ Sensitive data filtering with `beforeSend` hook  
✅ Error classification (network, authentication, validation)  
✅ Smart ignore patterns for browser extensions and non-critical errors  

**Sensitive Data Patterns Filtered:**
- Passwords: `password`, `senha`, `pass`, `pwd`, `secret`
- Tokens: `token`, `jwt`, `bearer`, `api_key`, `access_token`, `refresh_token`
- Payment: `credit_card`, `cvv`, `cvc`, `card_number`
- PII: `cpf`, `cnpj`, `ssn`, `rg`
- Keys: `private_key`, `public_key`, `encryption_key`

### 2. `src/hooks/useSentryModule.ts` - Module Tracking Hook

**Purpose:** React hook for automatic module/page context tracking

**Usage Example:**
```typescript
function MyPageComponent() {
  // Automatically sets module and page context for all errors
  useSentryModule('Financeiro', 'AccountsPayable');
  
  // Rest of component...
}
```

**Benefits:**
- Automatic context setting on component mount
- Clear error location tracking
- Easy to add to any page component

### 3. `docs/SENTRY_ERROR_TRACKING_GUIDE.md` - Comprehensive Documentation

**Purpose:** Complete guide for using and maintaining Sentry integration

**Contents:**
- Configuration instructions
- Usage examples
- Sensitive data filtering details
- Error context structure
- Performance monitoring setup
- Troubleshooting guide
- Security and GDPR considerations
- Integration checklist

## Integration Points

### 1. Application Entry Point (`src/main.tsx`)

```typescript
import { initSentry } from './lib/sentry';

// Validar variáveis de ambiente antes de iniciar o app
validateEnv();

// Inicializar Sentry para rastreamento de erros (apenas produção)
initSentry();

// Inicializar monitoramento de Web Vitals (apenas produção)
initWebVitals();
```

**Order of Operations:**
1. Validate environment variables
2. Initialize Sentry
3. Initialize Web Vitals
4. Render React app

### 2. Authentication Context (`src/contexts/AuthContext.tsx`)

**User Context Setting:**
```typescript
import { setUserContext, clearSentryContext } from '../lib/sentry';

// On logout - clear all Sentry contexts
const logout = async () => {
  await supabase.auth.signOut();
  setUser(null);
  clearSentryContext(); // ✅ Prevents context leakage between users
};
```

### 3. Tenant Context (`src/contexts/TenantContext.tsx`)

**Multi-Tenant Context Setting:**
```typescript
import { setUserContext, setTenantContext } from '../lib/sentry';

// Set user context with tenant information
if (finalProfile) {
  setUserProfile(finalProfile);
  
  // ✅ Enrich errors with user and tenant context
  if (user) {
    setUserContext(
      {
        id: user.id,
        email: user.email,
        role: finalProfile.role || 'user',
      },
      finalProfile.tenant_id || null
    );
  }
}

// Set tenant context separately for additional metadata
if (tenantData) {
  setTenant(tenantData);
  
  // ✅ Add tenant name for human-readable context
  setTenantContext(tenantData.id, tenantData.nome);
}
```

## Context Enrichment Details

### User Context Structure

Every error includes:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "tenant_id": "tenant-uuid"
}
```

### Tenant Context Structure

```json
{
  "tenant": {
    "id": "tenant-uuid",
    "name": "Fazenda ABC Ltda"
  }
}
```

### Tags Applied

```json
{
  "tenant_id": "tenant-uuid",
  "module": "Pecuária",
  "page": "AnimalManagement",
  "error_type": "network" // Auto-classified
}
```

### Navigation Context

```json
{
  "navigation": {
    "module": "Pecuária",
    "page": "AnimalManagement"
  }
}
```

## Sensitive Data Filtering Examples

### Example 1: Login Form Data

**Before Filtering:**
```json
{
  "email": "user@example.com",
  "password": "mySecret123",
  "remember_me": true
}
```

**After Filtering:**
```json
{
  "email": "user@example.com",
  "password": "[FILTERED]",
  "remember_me": true
}
```

### Example 2: API Request Headers

**Before Filtering:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1...",
  "Cookie": "session=abc123"
}
```

**After Filtering:**
```json
{
  "Content-Type": "application/json"
  // Authorization and Cookie removed
}
```

### Example 3: Nested Sensitive Data

**Before Filtering:**
```json
{
  "user": {
    "name": "John Doe",
    "credentials": {
      "password": "secret",
      "api_key": "sk_live_12345"
    }
  }
}
```

**After Filtering:**
```json
{
  "user": {
    "name": "John Doe",
    "credentials": {
      "password": "[FILTERED]",
      "api_key": "[FILTERED]"
    }
  }
}
```

## Error Classification

Errors are automatically tagged based on their message:

| Error Message Contains | Tag Applied |
|------------------------|-------------|
| "fetch", "network" | `error_type: network` |
| "auth", "unauthorized" | `error_type: authentication` |
| "validation", "invalid" | `error_type: validation` |

**Example:**
```typescript
// Error: "fetch failed: network error"
// → Automatically tagged with { error_type: "network" }

// Error: "unauthorized access to resource"
// → Automatically tagged with { error_type: "authentication" }
```

## Performance Monitoring Configuration

### Transaction Sampling

```typescript
tracesSampleRate: 0.1  // 10% of transactions sampled
```

**What's Tracked:**
- Page navigation timing
- API call durations
- Component render times
- User interaction latency

### Session Replay

```typescript
replaysSessionSampleRate: 0.1   // 10% of normal sessions
replaysOnErrorSampleRate: 1.0   // 100% of error sessions
```

**Privacy Settings:**
```typescript
replayIntegration({
  maskAllText: true,      // All text content masked
  blockAllMedia: true,    // Images/videos blocked
})
```

## How to Use in Components

### Basic Usage

```typescript
import { useSentryModule } from '@/hooks/useSentryModule';

function MyPageComponent() {
  // Set module context - all errors on this page will include this context
  useSentryModule('Financeiro', 'AccountsPayable');
  
  return (
    <div>
      {/* Your component content */}
    </div>
  );
}
```

### Manual Error Capture

```typescript
import * as Sentry from '@sentry/react';

async function handlePayment() {
  try {
    await processPayment(amount);
  } catch (error) {
    // Manually capture with additional context
    Sentry.captureException(error, {
      tags: {
        payment_method: 'credit_card',
        amount: String(amount),
      },
    });
    
    // Show user-friendly error
    toast.error('Erro ao processar pagamento');
  }
}
```

### Adding Breadcrumbs

```typescript
import * as Sentry from '@sentry/react';

function handleExport() {
  // Add breadcrumb to understand user actions
  Sentry.addBreadcrumb({
    category: 'export',
    message: 'User exported animals to Excel',
    level: 'info',
    data: {
      format: 'excel',
      count: animals.length,
    },
  });
  
  exportToExcel(animals);
}
```

## Environment Configuration

### Required Environment Variable

Add to `.env`:
```bash
# Sentry DSN (for error tracking)
# Get from: Sentry Dashboard → Settings → Projects → [Your Project] → Client Keys (DSN)
VITE_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/1234567
```

### Already Documented in `.env.example`

```bash
# Sentry DSN (for error tracking)
# Get from: Sentry Dashboard → Settings → Projects → [Your Project] → Client Keys (DSN)
# VITE_SENTRY_DSN=https://...
```

## Testing the Integration

### 1. Build for Production

```bash
npm run build
npm run preview
```

### 2. Trigger Test Error

Add to any component:
```typescript
<button onClick={() => { 
  throw new Error('Test Sentry error'); 
}}>
  Test Sentry
</button>
```

### 3. Verify in Sentry Dashboard

Check that error includes:
- ✅ User context (ID, email, role, tenant_id)
- ✅ Tenant context (ID, name)
- ✅ Module and page tags
- ✅ Full stack trace
- ✅ Session replay (if configured)

## Requirements Validation

### Requirement 10.3: Tenant/User Context
✅ **COMPLETED** - All errors enriched with:
- User ID, email, role
- Tenant ID and name
- Multi-tenant isolation maintained

### Requirement 10.6: Sensitive Data Filtering
✅ **COMPLETED** - `beforeSend` hook filters:
- Passwords and credentials
- API tokens and keys
- Payment information
- PII (CPF, CNPJ, etc.)
- Request headers (Authorization, Cookie)

### Additional Features Implemented

✅ Module/page tagging for error location  
✅ Automatic error classification (network, auth, validation)  
✅ Performance monitoring with 10% sampling  
✅ Session replay for error reproduction  
✅ Smart error ignore patterns  
✅ Breadcrumb filtering  
✅ Nested object recursive filtering  

## Known Limitations

1. **Development Mode:** Sentry is disabled in development to avoid noise. Use production build to test.

2. **Sample Rates:** Only 10% of transactions and sessions are sampled. Adjust if needed for higher visibility.

3. **Session Replay:** Text and media are masked for privacy. Adjust `maskAllText` if you need more detailed replays.

4. **Error Volume:** High-traffic applications may need rate limiting or additional filtering.

## Next Steps for Team

1. **Create Sentry Project:**
   - Go to [sentry.io](https://sentry.io)
   - Create new React project
   - Copy DSN to environment variables

2. **Deploy to Production:**
   - Add `VITE_SENTRY_DSN` to hosting platform (Vercel/Netlify)
   - Deploy application
   - Verify errors are captured

3. **Set Up Alerts:**
   - Configure Sentry alert rules
   - Connect to Slack or email
   - Set thresholds for critical errors

4. **Add Module Tracking:**
   - Add `useSentryModule()` hook to major page components
   - See `src/hooks/useSentryModule.ts` for usage

5. **Review Errors Weekly:**
   - Schedule team review of Sentry dashboard
   - Prioritize errors by frequency and tenant impact
   - Create issues for recurring errors

## Documentation

- **Integration Guide:** `docs/SENTRY_ERROR_TRACKING_GUIDE.md`
- **Source Code:** `src/lib/sentry.ts`
- **Module Hook:** `src/hooks/useSentryModule.ts`
- **Official Docs:** [https://docs.sentry.io/platforms/javascript/guides/react/](https://docs.sentry.io/platforms/javascript/guides/react/)

## Verification Steps

- [x] Created `src/lib/sentry.ts` with all enrichment logic
- [x] Integrated into `src/main.tsx` for automatic initialization
- [x] Updated `AuthContext.tsx` to clear context on logout
- [x] Updated `TenantContext.tsx` to set user and tenant context
- [x] Created `useSentryModule` hook for page tracking
- [x] Implemented sensitive data filtering in `beforeSend`
- [x] Added error classification (network, auth, validation)
- [x] Configured performance monitoring (10% sampling)
- [x] Configured session replay (10% normal, 100% errors)
- [x] Created comprehensive documentation
- [x] TypeScript compilation successful (no errors)

## Task Completion Checklist

- [x] Add tenant context to all error events
- [x] Add user context with ID, email, role using `Sentry.setUser()`
- [x] Implement `beforeSend` hook to filter sensitive data (passwords, tokens)
- [x] Add custom tags for module/page where error occurred
- [x] Document implementation
- [x] Validate requirements 10.3 and 10.6

---

**Task Status:** ✅ **COMPLETED**  
**Implementation Date:** 2024  
**Developer:** Kiro AI Agent  
**Spec:** system-improvements (Task 23.2)
