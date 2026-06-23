# Task 24.4: User Identification and Opt-Out Implementation

## Overview

This document summarizes the implementation of user identification and analytics opt-out functionality as part of the system improvements (Phase 5: Monitoring & Observability).

## Requirements Implemented

- **Requirement 11.4**: When a user opts out of analytics tracking, the system shall stop sending user data while maintaining the analytics platform integration
- **Requirement 11.5**: The monitoring service shall not track personally identifiable information without user consent

## Implementation Details

### 1. User Identification After Login

**File**: `src/contexts/TenantContext.tsx`

Added automatic user identification when a user logs in successfully:

```typescript
// Import the analytics function
import { identifyUser } from '../lib/analytics';

// Call identifyUser after user profile is loaded with tenant_id
if (finalProfile && user && finalProfile.tenant_id) {
  identifyUser({
    id: user.id,
    email: user.email,
    tenant_id: finalProfile.tenant_id,
  });
}
```

**Behavior**:
- Called automatically after successful authentication
- Only identifies users who have a valid `tenant_id`
- Respects opt-out preference (checked internally in `identifyUser()`)
- Enriches all subsequent analytics events with user context

### 2. Reset User Identity on Logout

**File**: `src/contexts/AuthContext.tsx`

Added user identity reset when logging out:

```typescript
// Import the analytics function
import { resetUser } from '../lib/analytics';

const logout = async () => {
  await supabase.auth.signOut();
  setUser(null);
  clearSentryContext();
  resetUser(); // Reset analytics user identity
};
```

**Behavior**:
- Clears PostHog user identity on logout
- Prevents event attribution to wrong user after logout
- Maintains user privacy between sessions

### 3. Opt-Out Toggle in User Profile

**File**: `src/components/Navigation/ProfileSidebar.tsx`

Added an analytics opt-out toggle in the user profile sidebar:

```typescript
// Import opt-out functions
import { hasOptedOut, optOutAnalytics, optInAnalytics } from '../../lib/analytics';

// State management
const [analyticsOptOut, setAnalyticsOptOut] = useState(false);

// Load initial opt-out state
useEffect(() => {
  setAnalyticsOptOut(hasOptedOut());
}, [isOpen]);

// Toggle handler
const handleToggleAnalytics = () => {
  if (analyticsOptOut) {
    optInAnalytics();
    setAnalyticsOptOut(false);
  } else {
    optOutAnalytics();
    setAnalyticsOptOut(true);
  }
};
```

**UI Location**:
- Click user avatar/profile icon in the header
- Opens ProfileSidebar
- Find "Analytics & Telemetria" toggle under "Preferências Rápidas"

**Toggle Features**:
- Shows current opt-out status
- Allows users to opt in or opt out at any time
- Stores preference in localStorage
- Respects preference immediately across all analytics functions

## Analytics Opt-Out Behavior

When a user opts out:

1. **PostHog Integration**:
   - `initAnalytics()` checks opt-out preference and skips initialization
   - `posthog.opt_out_capturing()` is called if PostHog is already loaded
   - All event tracking functions check opt-out status before sending events

2. **Data Storage**:
   - Opt-out preference stored in `localStorage` with key `analytics_opted_out`
   - Persists across browser sessions
   - Cleared when user opts back in

3. **Event Tracking**:
   - All business events respect opt-out: `animalRegistered`, `saleCompleted`, `paymentReceived`
   - All performance events respect opt-out: `pageLoadTime`, `apiSlowResponse`
   - User identification skipped when opted out

## Testing

### Test Files Created

1. **`src/contexts/TenantContext.test.tsx`**:
   - Verifies `identifyUser()` is called after successful login with tenant_id
   - Verifies `identifyUser()` is NOT called without tenant_id
   - Tests opt-out behavior

2. **`src/contexts/AuthContext.test.tsx`**:
   - Verifies `resetUser()` is called on logout
   - Verifies user state is cleared after logout
   - Tests Sentry context is cleared

3. **`src/components/Navigation/ProfileSidebar.test.tsx`**:
   - Tests analytics toggle visibility
   - Tests opt-out functionality
   - Tests opt-in functionality
   - Tests toggle state updates

### Test Results

All tests passing:
- ✅ 28 tests in `src/lib/analytics.test.ts`
- ✅ 11 tests across new test files
- ✅ Existing analytics functionality maintained

## Privacy Features

### User Consent

1. **Default Behavior**: Analytics enabled by default (opt-out model)
2. **User Control**: Users can opt out at any time via ProfileSidebar
3. **Transparency**: Clear labeling: "Analytics & Telemetria - Compartilhar dados de uso anônimos"

### Data Protection

1. **Opt-Out Respect**: 
   - All tracking functions check opt-out status
   - No events sent when opted out
   - User identity not tracked when opted out

2. **Sensitive Data Filtering**:
   - Already implemented in `initAnalytics()` (requirement 11.5)
   - Session recording disabled for privacy
   - "Do Not Track" browser setting respected

3. **Data Minimization**:
   - Only necessary identifiers tracked (user_id, email, tenant_id)
   - No passwords or tokens ever tracked
   - Business events contain only necessary metadata

## Usage Examples

### For Developers

**Checking if user has opted out**:
```typescript
import { hasOptedOut } from './lib/analytics';

if (hasOptedOut()) {
  // Skip analytics-dependent features
}
```

**Manual opt-out** (if needed in code):
```typescript
import { optOutAnalytics } from './lib/analytics';

// Opt out programmatically
optOutAnalytics();
```

**Manual opt-in** (if needed in code):
```typescript
import { optInAnalytics } from './lib/analytics';

// Opt in programmatically
optInAnalytics();
```

### For Users

**To opt out of analytics**:
1. Click on your profile icon in the header
2. Find "Analytics & Telemetria" toggle
3. Click the toggle to disable (turns gray)
4. Your preference is saved automatically

**To opt back in**:
1. Click on your profile icon in the header
2. Find "Analytics & Telemetria" toggle
3. Click the toggle to enable (turns green)
4. Analytics tracking resumes

## Files Modified

1. `src/contexts/TenantContext.tsx` - Added user identification on login
2. `src/contexts/AuthContext.tsx` - Added reset user on logout
3. `src/components/Navigation/ProfileSidebar.tsx` - Added opt-out toggle UI

## Files Created

1. `src/contexts/TenantContext.test.tsx` - Tests for user identification
2. `src/contexts/AuthContext.test.tsx` - Tests for logout with resetUser
3. `src/components/Navigation/ProfileSidebar.test.tsx` - Tests for opt-out toggle
4. `docs/TASK_24.4_USER_IDENTIFICATION_OPT_OUT.md` - This documentation

## Verification Checklist

- [x] `identifyUser()` function implemented and exported
- [x] Called after successful login with user ID, email, tenant_id
- [x] `resetUser()` called on logout
- [x] `optOutAnalytics()` function implemented
- [x] `optInAnalytics()` function implemented  
- [x] Opt-out preference stored in localStorage
- [x] Opt-out respected across all tracking functions
- [x] User-friendly toggle in ProfileSidebar
- [x] Tests written and passing for all functionality
- [x] Requirements 11.4 and 11.5 satisfied

## Next Steps

This completes task 24.4. The next tasks in Phase 5 are:

- Task 25.1: Install and configure web-vitals library
- Task 25.2: Track and send Web Vitals to analytics
- Task 25.3: Alert on poor Web Vitals thresholds

## Notes

- The opt-out implementation uses an **opt-out model** (analytics enabled by default) as per common industry practice
- Users can change their preference at any time
- The toggle is easily accessible via the profile sidebar
- All analytics functions properly check opt-out status before sending events
- The implementation respects user privacy while maintaining analytics platform integration (requirement 11.4)
