# PWA Configuration Guide

## Overview

The Tauze ERP has been configured as a **Progressive Web App (PWA)** with full offline-first capabilities. This document explains the PWA configuration and how to work with it.

## Configuration Location

PWA configuration is in `vite.config.ts` using the `vite-plugin-pwa` plugin.

## Key Features

### 1. Service Worker Strategy

**Auto-Update Mode:**
- Service worker automatically updates when new version is available
- No manual intervention needed
- Users get the latest version seamlessly

**Registration:**
```typescript
registerType: 'autoUpdate',
injectRegister: 'auto',
```

### 2. Caching Strategies

The PWA implements multiple caching strategies based on resource type:

#### Network First (API Calls)
- **Pattern:** `https://*.supabase.co/rest/*`
- **Strategy:** Try network first, fallback to cache if offline
- **Cache duration:** 5 minutes
- **Timeout:** 10 seconds
- **Use case:** API data that changes frequently

```typescript
{
  urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'supabase-api',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 5 * 60, // 5 minutes
    },
    networkTimeoutSeconds: 10,
  },
}
```

#### Network Only (Auth Endpoints)
- **Pattern:** `https://*.supabase.co/auth/*`
- **Strategy:** Never cache (always use network)
- **Use case:** Authentication/authorization endpoints that should never be cached

#### Cache First (Static Assets)
- **Pattern:** `.js`, `.css`, `.png`, `.jpg`, `.svg`, `.woff2`, etc.
- **Strategy:** Check cache first, use network as fallback
- **Cache duration:** 30 days (assets), 1 year (fonts)
- **Use case:** Static resources that don't change often

#### Stale While Revalidate (CDN Resources)
- **Pattern:** `https://cdn.*`
- **Strategy:** Serve from cache immediately while fetching update in background
- **Use case:** Third-party CDN resources

### 3. Cache Size Management

**Increased Cache Limit:**
```typescript
maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
```

This allows caching of larger code chunks (like the admin module) without exceeding browser limits.

**Automatic Cleanup:**
```typescript
cleanupOutdatedCaches: true,
```

Old caches are automatically removed when new service worker is activated.

### 4. Navigation Preload

```typescript
navigationPreload: true,
```

**Benefit:** Faster page loads by starting navigation requests in parallel with service worker boot.

### 5. App Manifest

The PWA includes a comprehensive Web App Manifest:

```typescript
manifest: {
  name: "Tauze ERP - Sistema de Gestão Agropecuária",
  short_name: "Tauze ERP",
  description: "Sistema de Gestão SaaS Agropecuária com suporte offline",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#05080f",
  theme_color: "#27a376",
  orientation: "any",
  
  // Icons for all platforms
  icons: [
    { src: "favicon.ico", sizes: "64x64 32x32 24x24 16x16", type: "image/x-icon" },
    { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
  ],
  
  // App shortcuts (quick actions)
  shortcuts: [
    { name: "Dashboard", url: "/", ... },
    { name: "Animais", url: "/pecuaria/animais", ... },
    { name: "Financeiro", url: "/financeiro/contas-pagar", ... }
  ]
}
```

## Installation

### Desktop (Chrome/Edge)

1. Visit the app in Chrome/Edge
2. Click the install icon (⊕) in the address bar
3. Click "Install" in the dialog
4. App will open in a standalone window

### Mobile (Android)

1. Visit the app in Chrome
2. Tap the "Add to Home Screen" banner or menu option
3. Confirm installation
4. App icon appears on home screen

### Mobile (iOS/Safari)

1. Visit the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Confirm installation
5. App icon appears on home screen

## Testing PWA Features

### Test Offline Functionality

1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Navigate the app - cached pages should work
4. Try to access API data - should show cached version

### Test Cache Strategies

1. Open DevTools → Application → Cache Storage
2. Inspect caches:
   - `supabase-api` - API responses
   - `static-resources` - JS/CSS files
   - `images` - Image files
   - `fonts` - Font files

### Test Service Worker Updates

1. Make changes to code
2. Build app: `npm run build`
3. Deploy new version
4. Service worker will automatically update in background
5. Page reload will use new version

## Development Mode

By default, service worker is **disabled in development** to avoid caching issues during development.

To enable in dev (for testing):

```typescript
devOptions: {
  enabled: true, // Change to true
  type: 'module',
}
```

**Warning:** Only enable in dev when specifically testing PWA features. Keep disabled during normal development.

## Build Commands

```bash
# Standard build (includes PWA generation)
npm run build

# Build with bundle analysis
npm run build:analyze

# Build for staging
npm run build:staging
```

The build process generates:
- `dist/sw.js` - Service worker file
- `dist/manifest.webmanifest` - Web app manifest
- `dist/workbox-*.js` - Workbox runtime

## Troubleshooting

### Service Worker Not Updating

**Solution:**
1. Open DevTools → Application → Service Workers
2. Click "Unregister" for old service worker
3. Click "Update on reload"
4. Refresh the page

### Cache Not Clearing

**Solution:**
1. Open DevTools → Application → Cache Storage
2. Right-click cache → Delete
3. Or programmatically: `caches.delete('cache-name')`

### App Not Installable

**Checklist:**
- [ ] Manifest includes all required fields
- [ ] At least one icon with sizes 192x192 or 512x512
- [ ] App served over HTTPS (required in production)
- [ ] Service worker registered successfully
- [ ] `start_url` resolves correctly

### Large Chunks Failing to Cache

If you see build errors about files exceeding cache limit:

1. Increase `maximumFileSizeToCacheInBytes` in `vite.config.ts`
2. Or split large chunks using code splitting
3. Current limit: 5 MB (should be sufficient for most cases)

## Integration with Offline Sync

The PWA service worker works together with the **OfflineSyncContext** for complete offline functionality:

1. **Service Worker:** Handles caching of static assets and API responses
2. **OfflineSyncContext:** Handles queueing of mutations (create/update/delete) when offline
3. **IndexedDB:** Stores queued operations for later sync

See `src/contexts/OfflineSyncContext.tsx` for offline sync implementation.

## Best Practices

### DO:
✅ Test PWA features before deploying to production
✅ Use appropriate caching strategies for each resource type
✅ Set reasonable cache expiration times
✅ Monitor cache size and usage
✅ Keep service worker disabled in development (except when testing)
✅ Test app installability on multiple devices

### DON'T:
❌ Cache auth endpoints (always use Network Only)
❌ Set very long cache times for API data
❌ Enable service worker in dev mode unless testing
❌ Forget to update icons when branding changes
❌ Cache sensitive data without encryption

## Resources

- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Related Files

- `vite.config.ts` - PWA configuration
- `src/contexts/OfflineSyncContext.tsx` - Offline sync logic
- `src/components/Feedback/OfflineBanner.tsx` - Offline UI indicator
- `public/favicon.ico` - App icon
- `public/pwa-*.png` - PWA icons (to be created)

## Next Steps

1. ✅ PWA configuration complete
2. ⏭️ Create PWA icons (192x192, 512x512)
3. ⏭️ Implement background sync for photo uploads (Task 20.2)
4. ⏭️ Create offline fallback page
5. ⏭️ Test installation on multiple devices
6. ⏭️ Validate with Lighthouse PWA audit
