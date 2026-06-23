# Task 25.2: Web Vitals Tracking with Route Context - Completion Summary

## Overview

Successfully implemented Web Vitals tracking with route and page context for analytics. This enhancement allows the team to track Core Web Vitals metrics segmented by page/route, enabling better performance monitoring and optimization insights.

## Requirements Addressed

- **Requirement 17.1**: Track Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
- **Requirement 17.2**: Send Web Vitals data to analytics with route/page context and metric names

## Implementation Details

### Changes Made

#### 1. Enhanced `src/lib/webVitals.ts`

Added route and page context tracking to all Web Vitals metrics:

**New Features:**
- `getCurrentRoute()` - Extracts current route from `window.location.pathname`
- `getPageName(pathname)` - Converts route path to readable page name
- Enhanced `AnalyticsEvent` interface with `route` and `page` fields
- Updated `sendToAnalytics()` to capture and send route/page context with every metric

**Analytics Integration:**
- **PostHog**: Sends `metric_name`, `value`, `rating`, `route`, and `page`
- **Google Analytics**: Sends `metric_name`, `page_route`, and `page_name`
- **Custom Endpoint**: Includes full event data with route/page context

#### 2. Test Coverage

Created comprehensive test suite in `src/lib/webVitals.test.ts`:

**Test Coverage:**
- ✅ Route extraction from various paths
- ✅ Page name generation from routes
- ✅ All 5 Core Web Vitals metrics tracked (LCP, INP, CLS, FCP, TTFB)
- ✅ Route and page context included in analytics events
- ✅ Metric names explicitly included (Requirement 17.2)
- ✅ Correct event structure for PostHog and Google Analytics

**Test Results:** All 8 tests passing ✓

## Metrics Tracked

### Core Web Vitals

1. **LCP (Largest Contentful Paint)** - Loading performance
   - Good: < 2.5s
   - Needs Improvement: < 4s
   - Poor: > 4s

2. **INP (Interaction to Next Paint)** - Interactivity (replaces FID)
   - Good: < 200ms
   - Needs Improvement: < 500ms
   - Poor: > 500ms

3. **CLS (Cumulative Layout Shift)** - Visual stability
   - Good: < 0.1
   - Needs Improvement: < 0.25
   - Poor: > 0.25

### Additional Metrics

4. **FCP (First Contentful Paint)** - Initial loading
   - Good: < 1.8s
   - Needs Improvement: < 3s
   - Poor: > 3s

5. **TTFB (Time to First Byte)** - Server responsiveness
   - Good: < 600ms
   - Needs Improvement: < 1.5s
   - Poor: > 1.5s

## Analytics Event Structure

### PostHog Event

```javascript
posthog.capture('web_vital', {
  metric_name: 'LCP',        // Metric name (Requirement 17.2)
  value: 2000,               // Metric value in ms
  rating: 'good',            // Performance rating
  navigation_type: 'navigate',
  route: '/pecuaria/animais', // Route context (Requirement 17.2)
  page: 'Pecuaria - Animais'  // Page context (Requirement 17.2)
});
```

### Google Analytics Event

```javascript
gtag('event', 'LCP', {
  event_category: 'Web Vitals',
  value: 2000,
  metric_name: 'LCP',          // Metric name (Requirement 17.2)
  page_route: '/pecuaria/animais', // Route context (Requirement 17.2)
  page_name: 'Pecuaria - Animais', // Page context (Requirement 17.2)
  metric_rating: 'good',
  non_interaction: true
});
```

## Route Naming Convention

Routes are automatically converted to readable page names:

| Route | Page Name |
|-------|-----------|
| `/` | Dashboard |
| `/pecuaria` | Pecuaria |
| `/pecuaria/animais` | Pecuaria - Animais |
| `/financeiro/contas-pagar` | Financeiro - Contas-pagar |
| `/admin/usuarios` | Admin - Usuarios |

## Usage in Production

The Web Vitals tracking is **already initialized** in `src/main.tsx`:

```typescript
// Inicializar monitoramento de Web Vitals (apenas produção)
initWebVitals();
```

### Production Behavior

- ✅ Only runs in production (`import.meta.env.PROD === true`)
- ✅ Automatically captures all 5 metrics
- ✅ Sends to PostHog (if configured)
- ✅ Sends to Google Analytics (if configured)
- ✅ Includes route/page context with every metric
- ✅ Silent failure for analytics endpoints (non-blocking)

### Development Behavior

- Console logs metrics for debugging
- Does not send to analytics
- Shows: `[Web Vitals] Monitoring disabled in development`

## Analytics Dashboard Setup

### PostHog Queries

To view Web Vitals by page in PostHog:

```sql
-- Average LCP by page
SELECT 
  properties.page as page,
  AVG(properties.value) as avg_lcp
FROM events
WHERE event = 'web_vital' 
  AND properties.metric_name = 'LCP'
GROUP BY properties.page
ORDER BY avg_lcp DESC;

-- Poor metrics by route
SELECT 
  properties.route as route,
  properties.metric_name as metric,
  COUNT(*) as poor_count
FROM events
WHERE event = 'web_vital' 
  AND properties.rating = 'poor'
GROUP BY properties.route, properties.metric_name
ORDER BY poor_count DESC;
```

### Google Analytics Custom Reports

1. Navigate to **Reports** → **Engagement** → **Events**
2. Filter by event name: `LCP`, `INP`, `CLS`, `FCP`, `TTFB`
3. Add custom dimensions: `page_route`, `page_name`, `metric_rating`
4. Create segment for poor metrics: `metric_rating = 'poor'`

## Benefits

### Performance Insights
- ✅ Track performance metrics per page/route
- ✅ Identify slow pages that need optimization
- ✅ Monitor performance improvements over time
- ✅ Compare performance across different modules

### User Experience
- ✅ Understand which pages users experience as slow
- ✅ Prioritize optimization efforts based on real user data
- ✅ Track impact of performance improvements

### Business Value
- ✅ Correlate performance with user engagement
- ✅ Identify performance bottlenecks affecting critical flows
- ✅ Make data-driven decisions about performance investments

## Next Steps

### Task 25.3: Alert on Poor Web Vitals Thresholds
- Log warnings when metrics exceed thresholds
- Send alerts to monitoring service

### Task 25.4: Initialize Web Vitals Tracking
- Already completed! ✓
- `initWebVitals()` is called in `main.tsx`

## Verification

### Manual Testing

1. **Production Build:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Check Console (Production):**
   - Should see: `[Web Vitals] Monitoring initialized`

3. **Navigate to Different Pages:**
   - Each navigation triggers new Web Vitals metrics

4. **Check Analytics:**
   - PostHog: Events → `web_vital`
   - Google Analytics: Events → Web Vitals category

### Automated Testing

```bash
npm test -- webVitals.test.ts --run
```

**Expected:** All 8 tests pass ✓

## Files Modified

- ✅ `src/lib/webVitals.ts` - Enhanced with route/page context
- ✅ `src/lib/webVitals.test.ts` - New comprehensive test suite

## Files Referenced (No Changes)

- `src/main.tsx` - Already calls `initWebVitals()`
- `src/lib/analytics.ts` - PostHog integration (Task 24.1)

## Compliance

- ✅ **Requirement 17.1**: All 5 Core Web Vitals tracked
- ✅ **Requirement 17.2**: Route/page context included with each metric
- ✅ **Requirement 17.2**: Metric name explicitly included in analytics
- ✅ TypeScript: No errors or warnings
- ✅ Tests: 8/8 passing
- ✅ Production-ready: Only runs in production environment

## Task Status

**Task 25.2: COMPLETED ✓**

All requirements met:
- ✅ Call each metric function and send to analytics
- ✅ Include route/page context with each metric
- ✅ Include metric name (CLS, INP, LCP, FCP, TTFB)
- ✅ Requirements 17.1 and 17.2 satisfied

---

**Implemented by:** Kiro AI Agent  
**Date:** 2024  
**Spec:** system-improvements  
**Phase:** Phase 5 - Monitoring & Observability
