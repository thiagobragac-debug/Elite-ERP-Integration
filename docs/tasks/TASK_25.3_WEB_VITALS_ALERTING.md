# Task 25.3: Web Vitals Alerting Implementation

## Overview

This document summarizes the implementation of Web Vitals alerting functionality that monitors Core Web Vitals metrics and sends alerts when performance thresholds are exceeded.

## Implementation Details

### Requirements Addressed (17.4)

The implementation fulfills Requirement 17.4:
- **WHEN current Web Vitals values exceed their thresholds, THE Monitoring_Service SHALL alert the team**

### Alert Thresholds

The following thresholds trigger alerts when exceeded:

1. **LCP (Largest Contentful Paint)** > 2.5s (2500ms)
2. **FID (First Input Delay)** > 100ms
3. **CLS (Cumulative Layout Shift)** > 0.1

### Changes Made

#### 1. Updated `src/lib/webVitals.ts`

Added comprehensive alerting functionality:

- **Import Sentry**: Added `import * as Sentry from '@sentry/react'` for error tracking integration
- **FID Tracking**: Added support for FID (First Input Delay) metric tracking using `onFID` from web-vitals library
- **Alert Function**: Created `alertOnPoorMetrics()` function that:
  - Checks if metrics exceed thresholds (LCP > 2.5s, FID > 100ms, CLS > 0.1)
  - Logs warnings to console with detailed context
  - Sends alerts to Sentry with warning level and rich context
  - Sends alerts to PostHog analytics with performance tracking
  - Includes route and page context in all alerts

#### 2. Created Test Suite `src/lib/__tests__/webVitals.test.ts`

Comprehensive test coverage for alerting functionality:

- **LCP Alerting Tests**:
  - Verifies warning logs when LCP > 2.5s
  - Verifies Sentry alerts sent with correct parameters
  - Verifies PostHog alerts sent with performance tracking
  - Verifies no alerts when LCP ≤ 2.5s

- **FID Alerting Tests**:
  - Verifies warning logs when FID > 100ms
  - Verifies monitoring service alerts (Sentry + PostHog)
  - Verifies no alerts when FID ≤ 100ms

- **CLS Alerting Tests**:
  - Verifies warning logs when CLS > 0.1
  - Verifies monitoring service alerts
  - Verifies no alerts when CLS ≤ 0.1

- **Context Verification**:
  - Verifies route and page context included in all alerts

**Test Results**: All 11 tests passing ✅

### Alert Format

#### Console Warning

```
[Web Vitals] POOR LCP: 3000ms on Dashboard (/)
{
  metric: 'LCP',
  value: 3000,
  threshold: '< 2.5s (good), < 4s (ok), > 4s (poor)',
  rating: 'needs-improvement',
  route: '/',
  page: 'Dashboard',
  id: 'v3-1234567890',
  navigationType: 'navigate'
}
```

#### Sentry Alert

```javascript
Sentry.captureMessage('[Web Vitals] POOR LCP: 3000ms on Dashboard (/)', {
  level: 'warning',
  tags: {
    metric_name: 'LCP',
    metric_rating: 'needs-improvement',
    page_route: '/',
    page_name: 'Dashboard',
    web_vitals: 'poor_performance'
  },
  contexts: {
    web_vitals: {
      metric: 'LCP',
      value: 3000,
      rating: 'needs-improvement',
      threshold: '< 2.5s (good), < 4s (ok), > 4s (poor)',
      navigation_type: 'navigate'
    },
    page: {
      route: '/',
      name: 'Dashboard'
    }
  }
});
```

#### PostHog Event

```javascript
posthog.capture('web_vitals_poor_performance', {
  metric_name: 'LCP',
  value: 3000,
  rating: 'needs-improvement',
  threshold_exceeded: true,
  route: '/',
  page: 'Dashboard',
  navigation_type: 'navigate'
});
```

## Monitoring Configuration

### Sentry Integration

- Alerts are sent as **warning-level messages** (not errors)
- Tagged with `web_vitals: 'poor_performance'` for filtering
- Includes full metric context for debugging
- Only active in production (`import.meta.env.PROD`)

### PostHog Analytics

- Separate event `web_vitals_poor_performance` for dashboard tracking
- Includes all metric data for trend analysis
- Complements regular `web_vital` events
- Only active in production

## Production Usage

### Viewing Alerts

**Sentry Dashboard:**
1. Navigate to Issues → Search
2. Filter by tag: `web_vitals:poor_performance`
3. Group by `metric_name` to see LCP, FID, CLS trends
4. View page context to identify problematic routes

**PostHog Dashboard:**
1. Navigate to Events → Explore
2. Filter event: `web_vitals_poor_performance`
3. Break down by `metric_name` or `page`
4. Create insight for threshold exceedance trends

### Setting Up Alerts

**Sentry Alert Rules:**
1. Go to Alerts → Create Alert
2. Set condition: "Issue contains tag `web_vitals:poor_performance`"
3. Configure notification channels (email, Slack, PagerDuty)
4. Set thresholds (e.g., alert if > 10 events in 1 hour)

**PostHog Alerts:**
1. Create insight for `web_vitals_poor_performance` event
2. Set up Action → Slack/Email notification
3. Configure threshold (e.g., > 50 events per day)

## Testing

### Running Tests

```bash
# Run Web Vitals alerting tests
npm test -- src/lib/__tests__/webVitals.test.ts --run

# Run with coverage
npm test -- src/lib/__tests__/webVitals.test.ts --coverage
```

### Manual Testing

Since Web Vitals only initialize in production:

```bash
# Build production bundle
npm run build

# Serve production build
npm run preview

# Open browser and simulate poor metrics:
# - Use Chrome DevTools → Performance → Network throttling (Slow 3G)
# - Use CPU throttling (6x slowdown)
# - Check browser console for warning logs
# - Verify Sentry and PostHog dashboards for alerts
```

## Maintenance

### Updating Thresholds

If Google updates Core Web Vitals thresholds, update in two places:

1. **Alert thresholds** in `alertOnPoorMetrics()` function
2. **Rating thresholds** in `getRating()` function
3. **Threshold descriptions** in `getThreshold()` function

### Adding New Metrics

To add alerting for additional metrics (e.g., INP):

1. Add threshold check in `alertOnPoorMetrics()`
2. Update `getRating()` with metric thresholds
3. Update `getThreshold()` with threshold description
4. Add test cases in test suite

## Files Modified

- ✅ `src/lib/webVitals.ts` - Added alerting logic
- ✅ `src/lib/__tests__/webVitals.test.ts` - Created comprehensive test suite

## Verification Checklist

- [x] LCP alerts when > 2.5s
- [x] FID alerts when > 100ms
- [x] CLS alerts when > 0.1
- [x] Warnings logged to console
- [x] Alerts sent to Sentry
- [x] Alerts sent to PostHog
- [x] Route and page context included
- [x] No alerts for good metrics
- [x] All tests passing (11/11)
- [x] No TypeScript errors
- [x] Production-only behavior (no dev noise)

## Related Tasks

- Task 25.1: Web Vitals library setup ✅
- Task 25.2: Web Vitals tracking implementation ✅
- **Task 25.3: Web Vitals alerting (this task)** ✅

## Next Steps

After completing this task, the team should:

1. Deploy to production and verify alerts in Sentry/PostHog
2. Set up alert rules and notification channels
3. Create dashboard widgets for Web Vitals trends
4. Monitor for patterns in poor performance (specific routes, times of day)
5. Use alert data to prioritize performance optimization work

## References

- [Core Web Vitals Thresholds](https://web.dev/defining-core-web-vitals-thresholds/)
- [Sentry Performance Monitoring](https://docs.sentry.io/platforms/javascript/performance/)
- [PostHog Event Tracking](https://posthog.com/docs/integrate/client/js#capturing-events)
