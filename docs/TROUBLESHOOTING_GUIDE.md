# Troubleshooting Guide - Tauze ERP v5.0

**Last Updated:** 2024-12-19  
**Task:** 32.4 - System Improvements Phase 6  
**Requirements:** 16.4

## Overview

This comprehensive troubleshooting guide helps developers and administrators diagnose and resolve common issues in the Tauze ERP v5.0 platform. Issues are organized by category with step-by-step solutions.

## Quick Diagnostic Commands

Run these commands to quickly identify issues:

```bash
# Check Node and npm versions
node --version    # Should be v20.x+
npm --version     # Should be v10.x+

# Verify environment variables
npm run env:check

# Check for TypeScript errors
npm run type-check

# Run linting
npm run lint

# Test database connection
npm run db:check

# Health check (if available)
npm run healthcheck
```

## Table of Contents

1. [Setup and Installation Issues](#1-setup-and-installation-issues)
2. [Environment Variable Issues](#2-environment-variable-issues)
3. [Build and Compilation Issues](#3-build-and-compilation-issues)
4. [Database Connection Issues](#4-database-connection-issues)
5. [Authentication and Authorization Issues](#5-authentication-and-authorization-issues)
6. [Performance Issues](#6-performance-issues)
7. [Offline Sync Issues](#7-offline-sync-issues)
8. [Service Worker and PWA Issues](#8-service-worker-and-pwa-issues)
9. [Deployment Issues](#9-deployment-issues)
10. [Error Monitoring Issues](#10-error-monitoring-issues)
11. [Test Failures](#11-test-failures)
12. [Browser-Specific Issues](#12-browser-specific-issues)

---

## 1. Setup and Installation Issues

### Issue 1.1: `npm install` Fails

**Symptoms:**
- Error: "ERESOLVE unable to resolve dependency tree"
- Error: "Permission denied"
- Installation hangs or times out

**Solutions:**

#### Solution A: Clear npm cache and retry
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Solution B: Use legacy peer dependencies
```bash
npm install --legacy-peer-deps
```

#### Solution C: Check Node.js version
```bash
node --version  # Must be v20.x or higher
nvm install 20  # If using nvm
nvm use 20
npm install
```

#### Solution D: Fix permissions (Linux/Mac)
```bash
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) .
```

#### Solution E: Network issues
```bash
# Check npm registry
npm config get registry  # Should be https://registry.npmjs.org/

# Set registry explicitly
npm config set registry https://registry.npmjs.org/

# Use different network or VPN
```

---

### Issue 1.2: Port 5173 Already in Use

**Symptoms:**
- Error: "Port 5173 is already in use"
- Development server fails to start

**Solutions:**

#### Solution A: Kill process using port
```bash
# Linux/Mac
lsof -ti:5173 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force

# Cross-platform
npx kill-port 5173
```

#### Solution B: Use different port
```bash
npm run dev -- --port 3000
```

#### Solution C: Configure default port in vite.config.ts
```typescript
export default defineConfig({
  server: {
    port: 3000,
    strictPort: false, // Try next available port if occupied
  },
});
```

---

### Issue 1.3: Husky Pre-commit Hooks Failing

**Symptoms:**
- Git commit blocked with linting errors
- Error: ".husky/pre-commit: Permission denied"

**Solutions:**

#### Solution A: Fix linting errors
```bash
npm run lint:fix
npm run format
git add .
git commit -m "your message"
```

#### Solution B: Fix hook permissions (Linux/Mac)
```bash
chmod +x .husky/pre-commit
```

#### Solution C: Bypass hooks (not recommended)
```bash
git commit --no-verify -m "your message"
```

#### Solution D: Reinstall Husky
```bash
npm uninstall husky
npm install husky --save-dev
npx husky install
```

---

## 2. Environment Variable Issues

### Issue 2.1: "Missing Required Environment Variables"

**Symptoms:**
- Application fails to start
- Error message: "Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY"
- Blank screen or error screen on startup

**Solutions:**

#### Solution A: Create .env file
```bash
# Copy example file
cp .env.example .env

# Edit .env and add your values
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Solution B: Verify .env exists and has correct values
```bash
# Check if .env exists
ls -la .env

# View contents (be careful not to commit!)
cat .env

# Verify required variables are set
grep VITE_SUPABASE_ .env
```

#### Solution C: Restart development server
```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

**Note:** Vite requires server restart after changing `.env` files.

---

### Issue 2.2: Invalid Supabase URL Format

**Symptoms:**
- Error: "VITE_SUPABASE_URL must be a valid URL"
- Application crashes on startup

**Solutions:**

#### Verify URL format
```bash
# Correct format
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co

# Incorrect formats (missing https://)
VITE_SUPABASE_URL=abcdefghijk.supabase.co  ❌
```

#### Get correct URL from Supabase Dashboard
1. Go to https://app.supabase.com/
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy **Project URL** (includes https://)

---

### Issue 2.3: Environment Variables Not Loading in Build

**Symptoms:**
- Variables work in dev but not in production build
- Build succeeds but app fails at runtime

**Solutions:**

#### Solution A: Verify VITE_ prefix
```bash
# ✅ Correct (VITE_ prefix for client-side variables)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# ❌ Incorrect (no VITE_ prefix)
SUPABASE_URL=...  # Won't be available in client code
```

#### Solution B: Check build command includes env
```bash
# Build with specific env file
npm run build --mode production

# Preview build locally to test
npm run preview
```

#### Solution C: Verify hosting platform environment variables
For Vercel/Netlify/AWS:
1. Go to project settings
2. Navigate to Environment Variables section
3. Add all `VITE_*` variables
4. Redeploy

---

## 3. Build and Compilation Issues

### Issue 3.1: TypeScript Errors During Build

**Symptoms:**
- Error: "TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'"
- Build fails with TypeScript errors

**Solutions:**

#### Solution A: Run type-check to identify errors
```bash
npm run type-check
```

#### Solution B: Fix null/undefined errors
```typescript
// ❌ Problem
const url = import.meta.env.VITE_SUPABASE_URL;
apiCall(url); // Error: url might be undefined

// ✅ Solution 1: Non-null assertion (if you're sure it exists)
const url = import.meta.env.VITE_SUPABASE_URL!;

// ✅ Solution 2: Provide default or throw error
const url = import.meta.env.VITE_SUPABASE_URL ?? 
  throw new Error('VITE_SUPABASE_URL is required');

// ✅ Solution 3: Type guard
if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL');
}
const url = import.meta.env.VITE_SUPABASE_URL;
```

#### Solution C: Temporary disable strict mode (not recommended)
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false  // Only as last resort for legacy code
  }
}
```

---

### Issue 3.2: Bundle Size Exceeds Limit

**Symptoms:**
- Warning: "Chunk size exceeds 500KB"
- Large bundle sizes impacting performance

**Solutions:**

#### Solution A: Analyze bundle
```bash
npm run build:analyze
```

This opens a visual report showing what's taking up space.

#### Solution B: Implement code splitting
```typescript
// ❌ Eager loading (adds to main bundle)
import HeavyComponent from './HeavyComponent';

// ✅ Lazy loading (separate chunk)
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### Solution C: Tree-shake icon imports
```typescript
// ❌ Imports entire library
import * as Icons from 'lucide-react';

// ✅ Import only what you need
import { ChevronRight, Users, DollarSign } from 'lucide-react';
```

#### Solution D: Remove unused dependencies
```bash
npm uninstall <unused-package>
npx depcheck  # Find unused dependencies
```

---

### Issue 3.3: Build Fails with "Failed to Fetch Dynamically Imported Module"

**Symptoms:**
- Build succeeds but fails when loading lazy routes
- Console error in browser

**Solutions:**

#### Solution A: Clear Vite cache
```bash
rm -rf node_modules/.vite
npm run build
```

#### Solution B: Check base URL in vite.config.ts
```typescript
export default defineConfig({
  base: '/',  // For root domain
  // OR
  base: '/app/',  // For subdirectory
});
```

#### Solution C: Verify deployment serves index.html for all routes
For SPA routing to work, hosting must redirect all routes to index.html.

**Vercel:** Add `vercel.json`
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Netlify:** Add `_redirects` file
```
/*    /index.html   200
```

---

## 4. Database Connection Issues

### Issue 4.1: "Failed to Connect to Supabase"

**Symptoms:**
- API calls fail with network errors
- Console: "Failed to fetch"
- Authentication doesn't work

**Solutions:**

#### Solution A: Verify Supabase project is active
1. Go to https://app.supabase.com/
2. Check project status (should be "Active" not "Paused")
3. If paused, restore from dashboard

#### Solution B: Verify API credentials
```bash
# Check .env file
cat .env | grep VITE_SUPABASE

# Test connection manually
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your-anon-key"
```

Should return: `{"message":"The server is running"}`

#### Solution C: Check Supabase service status
Visit: https://status.supabase.com/

#### Solution D: Verify IP not blocked
1. Go to Supabase Dashboard → Settings → API
2. Check "Network Restrictions" section
3. Add your IP if using IP allowlist

#### Solution E: CORS issues
Verify `VITE_SUPABASE_URL` includes `https://` protocol.

---

### Issue 4.2: Row Level Security (RLS) Blocking Queries

**Symptoms:**
- Queries return empty results
- Console error: "permission denied for table"
- Data exists in database but not visible

**Solutions:**

#### Solution A: Verify RLS policies exist
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'your_table';

-- View policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

#### Solution B: Check JWT token includes tenant_id
```typescript
// In browser console
const session = await supabase.auth.getSession();
console.log(session.data.session?.user);
```

Verify user metadata includes `tenant_id`.

#### Solution C: Test without RLS temporarily
```sql
-- ⚠️ DEVELOPMENT ONLY - Never in production
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT * FROM your_table;

-- Re-enable
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

#### Solution D: Run RLS audit
```bash
node src/database/audit-rls.cjs
```

---

### Issue 4.3: Slow Database Queries

**Symptoms:**
- Pages take >3 seconds to load
- Dashboard feels sluggish
- Console warnings about slow queries

**Solutions:**

#### Solution A: Check for missing indexes
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add indexes for common filters
CREATE INDEX idx_animais_tenant_status 
ON animais(tenant_id, status);
```

#### Solution B: Use query planner
```sql
EXPLAIN ANALYZE 
SELECT * FROM animais 
WHERE tenant_id = 'xxx' AND status = 'Ativo';
```

Look for "Seq Scan" (bad) vs "Index Scan" (good).

#### Solution C: Eliminate N+1 queries
```typescript
// ❌ N+1 query (fetches fazenda for each animal)
const animals = await supabase.from('animais').select('*');
for (const animal of animals) {
  const fazenda = await supabase
    .from('fazendas')
    .select('*')
    .eq('id', animal.fazenda_id)
    .single();
}

// ✅ Single query with JOIN
const { data: animals } = await supabase
  .from('animais')
  .select('*, fazendas(*)');
```

#### Solution D: Apply indexes from performance-indexes.sql
```bash
# Run index creation script
psql -h your-db-host -U postgres -d your-database -f src/database/performance-indexes.sql
```

---

## 5. Authentication and Authorization Issues

### Issue 5.1: "Invalid Refresh Token" or Session Expired

**Symptoms:**
- User logged out unexpectedly
- Console: "Invalid refresh token"
- Redirect to login page frequently

**Solutions:**

#### Solution A: Clear localStorage and retry
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
// Then refresh page and login again
```

#### Solution B: Verify Supabase Auth settings
1. Go to Supabase Dashboard → Authentication → Settings
2. Check "JWT Expiry" (default: 3600 seconds = 1 hour)
3. Check "Refresh Token Lifetime" (default: 30 days)

#### Solution C: Implement token refresh logic
```typescript
// Check token expiration and refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    // Redirect to login
  }
});
```

---

### Issue 5.2: Multi-Factor Authentication (MFA) Not Working

**Symptoms:**
- MFA prompt doesn't appear
- QR code not generating
- TOTP codes rejected

**Solutions:**

#### Solution A: Verify MFA is enabled in Supabase
1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "Multi-Factor Authentication"
3. Ensure "Enable MFA" is toggled ON

#### Solution B: Check user enrollment
```typescript
const { data: factors } = await supabase.auth.mfa.listFactors();
console.log('Enrolled MFA factors:', factors);
```

#### Solution C: Resync time on device
TOTP codes are time-based. Ensure device clock is accurate:
```bash
# Linux
sudo ntpdate -s time.nist.gov

# Mac
sudo sntp -sS time.apple.com

# Windows
w32tm /resync
```

#### Solution D: Re-enroll MFA
```typescript
// Unenroll current factor
await supabase.auth.mfa.unenroll({ factorId: 'factor-id' });

// Enroll again
const { data } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
});
```

---

### Issue 5.3: "Permission Denied" for Specific Actions

**Symptoms:**
- User can view data but not create/update/delete
- Error: "new row violates row-level security policy"

**Solutions:**

#### Solution A: Check user role and permissions
```typescript
// In browser console
const { data: { user } } = await supabase.auth.getUser();
console.log('User role:', user?.user_metadata?.role);
```

#### Solution B: Verify RLS policies include INSERT/UPDATE/DELETE
```sql
-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'your_table' 
AND cmd IN ('INSERT', 'UPDATE', 'DELETE');

-- Example policy for INSERT
CREATE POLICY "Users can insert their own tenant data"
ON animais FOR INSERT
WITH CHECK (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);
```

#### Solution C: Test with service role key (admin bypass)
⚠️ **Only for debugging, never in production client code!**
```typescript
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Backend only!
);
```

---

## 6. Performance Issues

### Issue 6.1: Slow Page Load Times (LCP > 2.5s)

**Symptoms:**
- Initial page load takes >2.5 seconds
- Lighthouse Performance score <90
- Poor LCP (Largest Contentful Paint) metric

**Solutions:**

#### Solution A: Implement code splitting
```typescript
// Split routes by module
const Pecuaria = lazy(() => import('./pages/Pecuaria'));
const Finance = lazy(() => import('./pages/Finance'));
```

#### Solution B: Optimize images
```typescript
// Use compression
import { compressImage } from '@/utils/imageCompression';

const compressed = await compressImage(file, {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
});
```

#### Solution C: Reduce initial bundle size
```bash
# Analyze bundle
npm run build:analyze

# Look for large chunks and split them
```

#### Solution D: Enable CDN caching
Configure `Cache-Control` headers in hosting platform:
```
Cache-Control: public, max-age=31536000, immutable  # For assets
Cache-Control: no-cache  # For index.html
```

---

### Issue 6.2: High Cumulative Layout Shift (CLS > 0.1)

**Symptoms:**
- Content jumps around during load
- Poor Lighthouse CLS score
- Buttons move as page loads

**Solutions:**

#### Solution A: Use LoadingSkeleton components
```typescript
<Suspense fallback={<LoadingSkeleton type="table" />}>
  <LazyComponent />
</Suspense>
```

#### Solution B: Reserve space for images
```typescript
// ❌ No dimensions
<img src={url} alt="Animal" />

// ✅ Fixed dimensions or aspect ratio
<img src={url} alt="Animal" width={400} height={300} />

// ✅ CSS aspect ratio
<div className="aspect-video">
  <img src={url} alt="Animal" className="w-full h-full object-cover" />
</div>
```

#### Solution C: Avoid inserting content above existing content
```typescript
// ❌ Inserts banner after load
{showBanner && <Banner />}
<MainContent />

// ✅ Reserve space for banner
<div className="min-h-[60px]">
  {showBanner && <Banner />}
</div>
<MainContent />
```

---

### Issue 6.3: React Query Refetching Too Frequently

**Symptoms:**
- Network tab shows excessive API calls
- Data refreshes constantly
- High bandwidth usage

**Solutions:**

#### Solution A: Increase staleTime
```typescript
// In QueryClientProvider config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});
```

#### Solution B: Disable refetchOnWindowFocus in production
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: import.meta.env.DEV, // Only in dev
    },
  },
});
```

#### Solution C: Use longer staleTime for static data
```typescript
// Market data that changes infrequently
const { data } = useQuery({
  queryKey: ['cepea-prices'],
  queryFn: fetchCepeaPrices,
  staleTime: 60 * 60 * 1000, // 1 hour
});
```

---

### Issue 6.4: Memory Leaks

**Symptoms:**
- Browser becomes slow over time
- High memory usage in Task Manager
- DevTools shows increasing heap size

**Solutions:**

#### Solution A: Clean up event listeners
```typescript
useEffect(() => {
  const handleResize = () => { /* ... */ };
  window.addEventListener('resize', handleResize);
  
  // ✅ Cleanup
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

#### Solution B: Cancel pending requests on unmount
```typescript
useEffect(() => {
  const controller = new AbortController();
  
  fetch(url, { signal: controller.signal })
    .then(res => res.json())
    .then(setData);
  
  // ✅ Cleanup
  return () => controller.abort();
}, []);
```

#### Solution C: Clear intervals and timeouts
```typescript
useEffect(() => {
  const interval = setInterval(() => { /* ... */ }, 1000);
  
  // ✅ Cleanup
  return () => clearInterval(interval);
}, []);
```

---

## 7. Offline Sync Issues

### Issue 7.1: Offline Operations Not Queuing

**Symptoms:**
- Create/update/delete operations fail silently when offline
- No items appear in offline queue
- Offline banner doesn't show pending operations

**Solutions:**

#### Solution A: Verify OfflineSyncContext is wrapped
```typescript
// App.tsx or main.tsx
<OfflineSyncProvider>
  <App />
</OfflineSyncProvider>
```

#### Solution B: Check IndexedDB is supported
```typescript
// In browser console
if ('indexedDB' in window) {
  console.log('IndexedDB supported');
} else {
  console.error('IndexedDB not supported');
}
```

#### Solution C: Verify offline detection
```typescript
// In browser console
console.log('Online:', navigator.onLine);

// Test offline mode
// DevTools → Network → Throttling → Offline
```

#### Solution D: Check queue operations are called
```typescript
// In mutation handlers
const { addToQueue } = useOfflineSync();

const handleCreate = async (data) => {
  if (!navigator.onLine) {
    await addToQueue({
      action: 'create',
      table: 'animais',
      data,
      timestamp: Date.now(),
    });
    return;
  }
  // Normal API call
};
```

---

### Issue 7.2: Sync Fails When Coming Back Online

**Symptoms:**
- Operations remain in queue after going online
- Sync errors in console
- Manual sync button doesn't work

**Solutions:**

#### Solution A: Check sync error logs
```typescript
// In browser console
const { queue, syncQueue } = useOfflineSync();
console.log('Queue:', queue);
await syncQueue(); // Manually trigger sync
```

#### Solution B: Verify API endpoints are correct
```typescript
// Check queue item structure
{
  action: 'create',
  table: 'animais',  // Must match Supabase table name
  data: { /* valid data */ },
  timestamp: 1234567890,
}
```

#### Solution C: Check for validation errors
```typescript
// Sync might fail due to missing required fields
// Check Supabase table constraints
```

#### Solution D: Clear corrupted queue items
```typescript
// In browser console
const { removeFromQueue } = useOfflineSync();
await removeFromQueue(corruptedItemId);
```

---

### Issue 7.3: Photos Not Uploading in Background

**Symptoms:**
- Photo uploads fail when offline
- Background sync not triggering
- Photos disappear after upload attempt

**Solutions:**

#### Solution A: Verify service worker registered
```typescript
// In browser console
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('Service Workers:', regs));
```

#### Solution B: Check Background Sync API support
```typescript
// In browser console
if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
  console.log('Background Sync supported');
} else {
  console.error('Background Sync not supported');
}
```

#### Solution C: Manually trigger sync
```typescript
// Request background sync
navigator.serviceWorker.ready.then(registration => {
  return registration.sync.register('sync-photos');
});
```

#### Solution D: Fallback for unsupported browsers
```typescript
// Implement manual retry for Safari/Firefox
if (!('sync' in ServiceWorkerRegistration.prototype)) {
  // Use regular upload with retry logic
  uploadWithRetry(photo);
}
```

---

## 8. Service Worker and PWA Issues

### Issue 8.1: Service Worker Not Registering

**Symptoms:**
- App doesn't work offline
- No service worker in DevTools → Application → Service Workers
- Console: "Service worker registration failed"

**Solutions:**

#### Solution A: Verify HTTPS or localhost
Service workers require HTTPS (or localhost for development).

```bash
# ✅ Works
http://localhost:5173
https://your-domain.com

# ❌ Doesn't work
http://192.168.1.100:5173  # Use HTTPS or use localhost
```

#### Solution B: Check vite-plugin-pwa configuration
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
});
```

#### Solution C: Clear service worker cache
```typescript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Clear caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Refresh page
location.reload();
```

---

### Issue 8.2: PWA Not Installable

**Symptoms:**
- "Install App" prompt doesn't appear
- DevTools shows manifest errors
- Lighthouse PWA score low

**Solutions:**

#### Solution A: Verify manifest.json
```json
// public/manifest.json
{
  "name": "Tauze ERP",
  "short_name": "Tauze",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Solution B: Check manifest linked in HTML
```html
<!-- index.html -->
<link rel="manifest" href="/manifest.json">
```

#### Solution C: Verify required icons exist
```bash
# Icons must exist in public/ directory
ls public/icon-192.png
ls public/icon-512.png
```

#### Solution D: Test PWA installability
1. Open DevTools → Application → Manifest
2. Check for errors
3. Click "Add to home screen" to test

---

### Issue 8.3: Cached Content Not Updating

**Symptoms:**
- Old version of app loads after deployment
- Users see outdated content
- Changes don't appear after refresh

**Solutions:**

#### Solution A: Implement cache versioning
```typescript
// Service worker
const CACHE_VERSION = 'v2';
const CACHE_NAME = `tauze-erp-${CACHE_VERSION}`;

// Delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
});
```

#### Solution B: Force update on deployment
```typescript
// In App.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.update());
    });
  }
}, []);
```

#### Solution C: Show update prompt to users
```typescript
// Notify user when new version is available
const [updateAvailable, setUpdateAvailable] = useState(false);

useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setUpdateAvailable(true);
    });
  }
}, []);

// Show banner
{updateAvailable && (
  <Banner>
    Nova versão disponível! 
    <button onClick={() => window.location.reload()}>
      Atualizar
    </button>
  </Banner>
)}
```

---

## 9. Deployment Issues

### Issue 9.1: CI/CD Pipeline Failing

**Symptoms:**
- GitHub Actions workflow fails
- Build step errors
- Tests fail in CI but pass locally

**Solutions:**

#### Solution A: Check logs in GitHub Actions
1. Go to repository → Actions
2. Click on failed workflow run
3. Expand failed step to see error details

#### Solution B: Run CI commands locally
```bash
# Run same commands as CI
npm run lint
npm run type-check
npm run test:run
npm run build
```

#### Solution C: Verify GitHub Secrets are set
1. Repository → Settings → Secrets and variables → Actions
2. Verify all required secrets exist:
   - `VITE_SUPABASE_URL_PROD`
   - `VITE_SUPABASE_ANON_KEY_PROD`
   - `VITE_SENTRY_DSN`
   - etc.

#### Solution D: Check Node version in CI
```yaml
# .github/workflows/ci.yml
- uses: actions/setup-node@v4
  with:
    node-version: '20'  # Match your local version
```

---

### Issue 9.2: Deployment Succeeds But Site Not Working

**Symptoms:**
- Deployment marked as successful
- Site loads but shows errors or blank page
- Functions timeout or fail

**Solutions:**

#### Solution A: Check browser console
1. Open deployed site
2. Press F12 → Console
3. Look for errors (CORS, 404, etc.)

#### Solution B: Verify environment variables in hosting platform
**Vercel:**
1. Project Settings → Environment Variables
2. Verify all VITE_* variables are set for Production

**Netlify:**
1. Site Settings → Build & Deploy → Environment
2. Add all required variables

#### Solution C: Check deployment logs
Look for errors during build process in hosting platform dashboard.

#### Solution D: Test production build locally
```bash
npm run build
npm run preview
```

If it works locally but not on hosting, issue is with hosting configuration.

---

### Issue 9.3: Sentry Source Maps Not Uploading

**Symptoms:**
- Errors in Sentry show minified code
- Source maps missing in Sentry dashboard
- Can't debug errors properly

**Solutions:**

#### Solution A: Verify Sentry auth token
```bash
# Check if token is set
echo $SENTRY_AUTH_TOKEN  # Linux/Mac
echo %SENTRY_AUTH_TOKEN%  # Windows

# Generate new token
# Sentry Dashboard → Settings → Auth Tokens → Create New Token
# Scopes: project:read, project:releases, org:read
```

#### Solution B: Check vite-sentry-plugin configuration
```typescript
// vite.config.ts
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: {
    sourcemap: true, // ✅ Must be enabled
  },
  plugins: [
    sentryVitePlugin({
      org: "your-org",
      project: "your-project",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

#### Solution C: Verify source maps uploaded
```bash
# Check Sentry CLI
sentry-cli releases list

# Check artifacts for release
sentry-cli releases files <version> list
```

#### Solution D: Manual upload (if automatic fails)
```bash
sentry-cli releases new <version>
sentry-cli releases files <version> upload-sourcemaps ./dist
sentry-cli releases finalize <version>
```

---

## 10. Error Monitoring Issues

### Issue 10.1: Sentry Not Capturing Errors

**Symptoms:**
- No errors appear in Sentry dashboard
- Console shows errors but Sentry doesn't
- `initSentry()` called but not working

**Solutions:**

#### Solution A: Verify Sentry only initializes in production
```typescript
// Sentry is disabled in development
console.log('Production mode:', import.meta.env.PROD);

// Test in production build
npm run build
npm run preview
```

#### Solution B: Check Sentry DSN is correct
```bash
# Verify DSN format
VITE_SENTRY_DSN=https://key@organization.ingest.sentry.io/project-id
```

#### Solution C: Test error manually
```typescript
// In production build
import * as Sentry from '@sentry/react';

// Trigger test error
Sentry.captureException(new Error('Test error'));
```

#### Solution D: Check browser console for Sentry errors
Look for initialization errors or network failures.

---

### Issue 10.2: Analytics Events Not Tracking

**Symptoms:**
- No events in PostHog/Mixpanel dashboard
- `trackEvent()` calls don't register
- User properties not set

**Solutions:**

#### Solution A: Verify analytics initialized
```typescript
// In browser console (production build)
if (window.posthog) {
  console.log('PostHog initialized');
  window.posthog.capture('test_event');
} else {
  console.error('PostHog not initialized');
}
```

#### Solution B: Check analytics key
```bash
# Verify key format
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://app.posthog.com
```

#### Solution C: Verify user hasn't opted out
```typescript
// Check opt-out status
const optedOut = localStorage.getItem('analytics_opt_out');
console.log('Opted out:', optedOut);
```

#### Solution D: Check network tab for blocked requests
- Look for requests to PostHog/Mixpanel
- Check if ad blockers are interfering
- Try in incognito mode without extensions

---

### Issue 10.3: Web Vitals Not Being Tracked

**Symptoms:**
- No performance metrics in analytics
- Lighthouse scores available but not tracked
- Missing LCP, FID, CLS data

**Solutions:**

#### Solution A: Verify web-vitals library installed
```bash
npm list web-vitals
```

#### Solution B: Check tracking is initialized
```typescript
// src/main.tsx
import { trackWebVitals } from '@/lib/webVitals';

// Should be called after React renders
trackWebVitals();
```

#### Solution C: Test metric reporting
```typescript
// In browser console
import { onLCP, onFID, onCLS } from 'web-vitals';

onLCP(console.log);
onFID(console.log);
onCLS(console.log);
```

#### Solution D: Check analytics integration
```typescript
// Verify sendToAnalytics function
export function sendToAnalytics({ name, value, rating }) {
  if (window.posthog) {
    window.posthog.capture('web_vital', {
      metric_name: name,
      value: value,
      rating: rating,
    });
  }
}
```

---

## 11. Test Failures

### Issue 11.1: Unit Tests Failing

**Symptoms:**
- `npm run test` shows failures
- Specific tests consistently fail
- Tests pass locally but fail in CI

**Solutions:**

#### Solution A: Run tests with verbose output
```bash
npm run test:run -- --reporter=verbose
```

#### Solution B: Check for timing issues
```typescript
// ❌ Flaky test (timing dependent)
test('data loads', () => {
  render(<Component />);
  expect(screen.getByText('Data')).toBeInTheDocument();
});

// ✅ Wait for async operations
test('data loads', async () => {
  render(<Component />);
  expect(await screen.findByText('Data')).toBeInTheDocument();
});
```

#### Solution C: Clear test cache
```bash
npm run test:run -- --clearCache
```

#### Solution D: Run single test file
```bash
npm run test:run -- src/utils/format.test.ts
```

---

### Issue 11.2: E2E Tests Failing

**Symptoms:**
- Playwright tests timeout
- Elements not found
- Tests pass locally but fail in CI

**Solutions:**

#### Solution A: Run tests with UI mode
```bash
npm run test:e2e:ui
```

#### Solution B: Increase timeout
```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 60000, // 60 seconds instead of 30
});
```

#### Solution C: Add explicit waits
```typescript
// ❌ May fail if element loads slowly
await page.click('button');

// ✅ Wait for element to be visible
await page.waitForSelector('button', { state: 'visible' });
await page.click('button');
```

#### Solution D: Run with headed browser to debug
```bash
npm run test:e2e:debug
```

---

### Issue 11.3: Test Coverage Below Threshold

**Symptoms:**
- Build fails with coverage error
- Coverage report shows <60%
- Specific files missing coverage

**Solutions:**

#### Solution A: Generate coverage report
```bash
npm run test:coverage
```

Open `coverage/index.html` to see detailed report.

#### Solution B: Identify uncovered files
```bash
# Show uncovered lines
npm run test:coverage -- --reporter=verbose
```

#### Solution C: Exclude non-testable files
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/__tests__/**',
        'src/types/**',
        'src/main.tsx',
        // Add more exclusions as needed
      ],
    },
  },
});
```

#### Solution D: Write tests for uncovered code
Focus on critical business logic first.

---

## 12. Browser-Specific Issues

### Issue 12.1: Works in Chrome But Not Safari

**Symptoms:**
- Features work in Chrome/Edge but fail in Safari
- Blank screen or JavaScript errors in Safari

**Solutions:**

#### Solution A: Check for unsupported APIs
```typescript
// Check browser support
if ('serviceWorker' in navigator) {
  // Supported
} else {
  // Fallback for Safari
}
```

#### Solution B: Add polyfills
```bash
npm install core-js
```

```typescript
// main.tsx
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

#### Solution C: Test in Safari Technology Preview
Safari TP has newer features than regular Safari.

#### Solution D: Check console in Safari
Safari has different DevTools: Develop → Show JavaScript Console

---

### Issue 12.2: Mobile-Specific Issues

**Symptoms:**
- Works on desktop but not mobile
- Touch events not working
- Layout issues on mobile

**Solutions:**

#### Solution A: Test on actual device
```bash
# Run dev server accessible on network
npm run dev -- --host

# Access from mobile on same WiFi
http://192.168.x.x:5173
```

#### Solution B: Use mobile DevTools
Chrome DevTools → Toggle device toolbar (Cmd+Shift+M)

#### Solution C: Add touch event handlers
```typescript
<button
  onClick={handleClick}
  onTouchEnd={handleClick}  // For mobile
>
  Click Me
</button>
```

#### Solution D: Fix viewport for mobile
```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

---

### Issue 12.3: Internet Explorer Support

**Note:** IE is not officially supported as of 2024, but if required:

**Solutions:**

#### Solution A: Add legacy browser message
```typescript
// main.tsx
const isIE = /MSIE|Trident/.test(navigator.userAgent);

if (isIE) {
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Navegador não suportado</h1>
      <p>Por favor, use Chrome, Firefox, Edge ou Safari.</p>
    </div>
  `;
} else {
  // Normal initialization
}
```

---

## Advanced Troubleshooting

### Debugging Production Builds Locally

```bash
# Build production version
npm run build

# Serve production build locally
npm run preview

# Access at http://localhost:4173
```

This allows testing production-only features (Sentry, service workers, etc.) before deploying.

---

### Using Browser DevTools Effectively

#### React DevTools
- Install: [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- View component tree and props
- Profile performance
- Debug hooks

#### React Query DevTools
- Automatically included in dev mode
- View query states and cache
- Manually trigger refetch
- See query timings

#### Network Tab
- Filter by type (XHR, JS, CSS, IMG)
- Check request/response headers
- Look for failed requests (red)
- Monitor request timing

#### Performance Tab
- Record page load
- Analyze flame graph
- Identify long tasks
- Check FPS

#### Application Tab
- View IndexedDB data
- Check service workers
- Inspect cache storage
- View cookies and localStorage

---

### Common Console Commands

```javascript
// Check authentication status
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);

// Check user context
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Test Supabase query
const { data, error } = await supabase
  .from('animais')
  .select('*')
  .limit(1);
console.log('Data:', data, 'Error:', error);

// Check environment
console.log('Environment:', import.meta.env);

// Check React Query cache
// (open React Query DevTools in bottom-left)

// Clear all caches
localStorage.clear();
sessionStorage.clear();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(reg => reg.unregister()));
}
caches.keys().then(names => 
  names.forEach(name => caches.delete(name))
);
location.reload();
```

---

### Analyzing Bundle Size

```bash
# Generate bundle analysis
npm run build:analyze

# Opens visual report in browser
```

**What to look for:**
- Large vendor chunks (>200KB)
- Duplicate dependencies
- Unused libraries
- Opportunities for code splitting

---

### Database Query Debugging

```sql
-- Enable query logging in Supabase
-- Dashboard → Database → Settings → Enable query logging

-- View slow queries
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- Queries slower than 1 second
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Analyze specific query
EXPLAIN ANALYZE
SELECT * FROM animais
WHERE tenant_id = 'xxx' AND status = 'Ativo';

-- Look for:
-- - "Seq Scan" (bad - needs index)
-- - "Index Scan" (good)
-- - High execution time
-- - Large row counts
```

---

## Getting Help

### Before Asking for Help

**Checklist:**
- [ ] Checked this troubleshooting guide
- [ ] Searched existing GitHub issues
- [ ] Verified environment variables are set correctly
- [ ] Tested in production build (`npm run build && npm run preview`)
- [ ] Checked browser console for errors
- [ ] Tried clearing cache and reinstalling dependencies
- [ ] Checked Supabase/Sentry/hosting provider status pages

### Information to Provide

When reporting an issue, include:

1. **Environment:**
   - OS: (Windows/Mac/Linux)
   - Node version: `node --version`
   - npm version: `npm --version`
   - Browser: (Chrome 120, Safari 17, etc.)

2. **Error Details:**
   - Full error message
   - Stack trace
   - Console logs
   - Screenshot if UI issue

3. **Steps to Reproduce:**
   1. Step 1
   2. Step 2
   3. Expected result
   4. Actual result

4. **What You've Tried:**
   - List solutions you've attempted
   - Results of each attempt

---

### Where to Get Help

#### Documentation
- **Project Docs:** `docs/` directory
- **Onboarding Guide:** `docs/ONBOARDING_GUIDE.md`
- **Deployment Guide:** `docs/PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Error Tracking:** `docs/SENTRY_ERROR_TRACKING_GUIDE.md`

#### External Resources
- **Supabase Docs:** https://supabase.com/docs
- **Vite Docs:** https://vite.dev/
- **React Docs:** https://react.dev/
- **React Query Docs:** https://tanstack.com/query/latest
- **Sentry Docs:** https://docs.sentry.io/

#### Community
- GitHub Issues: Report bugs or request features
- Team Slack/Discord: Internal communication
- Stack Overflow: General programming questions

---

## Preventive Measures

### Regular Maintenance Checklist

**Weekly:**
- [ ] Review Sentry errors
- [ ] Check analytics for anomalies
- [ ] Review failed deployments
- [ ] Update dependencies with security patches

**Monthly:**
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review and update dependencies
- [ ] Run Lighthouse audit
- [ ] Review database slow query log
- [ ] Check bundle size hasn't increased significantly

**Quarterly:**
- [ ] Major dependency updates
- [ ] Database index optimization
- [ ] Review and update documentation
- [ ] Security audit of RLS policies
- [ ] Performance benchmarking

---

### Best Practices to Avoid Issues

1. **Always use environment variable validation**
   - Never assume env vars exist
   - Validate on startup

2. **Test in production mode before deploying**
   ```bash
   npm run build && npm run preview
   ```

3. **Write tests for critical features**
   - Prevents regressions
   - Documents expected behavior

4. **Monitor errors in production**
   - Set up Sentry alerts
   - Review errors weekly

5. **Keep dependencies updated**
   - Run `npm outdated` regularly
   - Test after major updates

6. **Use TypeScript strict mode**
   - Catch errors at compile time
   - Better code quality

7. **Follow code quality standards**
   - Run linting before commits
   - Use pre-commit hooks

8. **Document complex logic**
   - Add comments for non-obvious code
   - Update docs when changing features

---

## Quick Reference

### Essential Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Fix linting errors |
| `npm run format` | Format code |
| `npm run type-check` | Check TypeScript |
| `npm run test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run E2E tests |
| `npm run build:analyze` | Analyze bundle size |

### Port Reference

| Port | Service |
|------|---------|
| 5173 | Vite development server |
| 4173 | Vite preview server |
| 5432 | PostgreSQL (local) |
| 54321 | Supabase local API |

### File Locations

| File/Directory | Purpose |
|----------------|---------|
| `.env` | Environment variables (gitignored) |
| `.env.example` | Environment variable template |
| `src/main.tsx` | Application entry point |
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/sentry.ts` | Sentry initialization |
| `src/contexts/` | React Context providers |
| `docs/` | Documentation |
| `tests/e2e/` | E2E tests |
| `src/__tests__/` | Unit/integration tests |

---

## Status Pages

Check service status if experiencing issues:

- **Supabase:** https://status.supabase.com/
- **Vercel:** https://www.vercel-status.com/
- **Netlify:** https://www.netlifystatus.com/
- **GitHub:** https://www.githubstatus.com/
- **npm:** https://status.npmjs.org/

---

## Changelog

| Date | Changes |
|------|---------|
| 2024-12-19 | Initial creation - Task 32.4 |

---

## Related Documentation

- [Onboarding Guide](./ONBOARDING_GUIDE.md) - Setup and getting started
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md) - Deployment procedures
- [Sentry Error Tracking Guide](./SENTRY_ERROR_TRACKING_GUIDE.md) - Error monitoring
- [Offline Sync Implementation](./OFFLINE_SYNC_IMPLEMENTATION.md) - PWA and offline features
- [Architecture Documentation](./ARQUITETURA_ATUAL.md) - System architecture

---

**Need additional help?** Check the specific guide for your issue category or contact the development team.

