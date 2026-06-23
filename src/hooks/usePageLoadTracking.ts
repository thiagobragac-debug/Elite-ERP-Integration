import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../lib/analytics';

/**
 * Custom hook to automatically track page load performance
 * 
 * Measures the time from component mount to completion and sends
 * the metric to PostHog analytics as a 'page_load_time' event.
 * 
 * Features:
 * - Automatic tracking on route changes
 * - Captures route path for context
 * - Only tracks in production (via analytics.pageLoadTime check)
 * - Respects user opt-out preferences
 * 
 * @example
 * // In your component:
 * function MyPage() {
 *   usePageLoadTracking();
 *   return <div>Content</div>;
 * }
 * 
 * Requirements: 11.2 - Track performance events (page_load_time)
 */
export function usePageLoadTracking(): void {
  const location = useLocation();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Reset start time on location change
    startTimeRef.current = Date.now();

    // Track page load time after component renders
    const timeoutId = setTimeout(() => {
      const duration = Date.now() - startTimeRef.current;
      
      // Send page load event to analytics
      analytics.pageLoadTime({
        route: location.pathname,
        duration,
        metric: 'component_mount',
      });
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname]);
}
