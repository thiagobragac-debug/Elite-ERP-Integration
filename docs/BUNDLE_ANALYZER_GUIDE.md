# Bundle Analyzer Guide

## Overview
This project uses `rollup-plugin-visualizer` to analyze the bundle size and composition. The analyzer helps identify large dependencies and opportunities for optimization.

## Quick Start

### Generate Bundle Report
```bash
npm run build:analyze
```

This command will:
1. Build the production bundle
2. Generate a visual report at `dist/stats.html`
3. Automatically open the report in your default browser

## Understanding the Report

### Visual Elements
The report shows a **treemap** visualization where:
- **Size of box** = Size of the module/chunk
- **Color darkness** = Relative size (darker = larger)
- **Nested boxes** = Module hierarchy (parent chunks contain child modules)

### Metrics Displayed
- **Stat Size**: Uncompressed size of the module
- **Parsed Size**: Size after parsing (similar to stat size)
- **Gzip Size**: Compressed size (what users actually download) ⭐ Most important metric

### Interactive Features
1. **Hover**: See detailed information about a module
2. **Click**: Zoom into a specific chunk to see its contents
3. **Breadcrumbs**: Navigate back up the hierarchy
4. **Search**: Filter modules by name

## Key Metrics to Monitor

### Bundle Size Goals
| Metric | Target | Current Status |
|--------|--------|----------------|
| Total Gzipped | <500 KB | ⚠️ ~1,539 KB |
| Initial Load | <200 KB | ✅ ~106 KB |
| Largest Chunk | <150 KB | ⚠️ 587 KB |

### Critical Chunks
1. **pages-admin** - Currently 587 KB gzipped ⚠️
2. **pages-reports** - Currently 300 KB gzipped ⚠️
3. **pages-finance** - Currently 146 KB gzipped
4. **pages-pecuaria** - Currently 144 KB gzipped

## Optimization Strategies

### 1. Identify Large Dependencies
**Look for:**
- Large vendor libraries in the treemap
- Duplicate dependencies across chunks
- Unused code that can be removed

**Action:**
```bash
# Check what's in a specific chunk
npm run build:analyze
# Then click on the chunk in the report to drill down
```

### 2. Code Splitting
**Current Implementation:**
- Manual chunk splitting by module (pecuária, finance, inventory, etc.)
- Vendor splitting (react, charts, maps, icons)
- Lazy loading for all non-critical routes

**Opportunities:**
- Further split large modules into sub-routes
- Lazy load heavy components within routes

### 3. Tree Shaking
**Verify:**
- Only used exports are included
- Side effects are properly marked in package.json
- No circular dependencies

**Check:**
```bash
# Look for modules marked with (concatenated) in the report
# These are properly tree-shaken
```

### 4. Dependency Audit
**For each large dependency:**
1. Is it necessary?
2. Is there a lighter alternative?
3. Can it be lazy loaded?
4. Are we only importing what we use?

## Common Issues & Solutions

### Issue: Large Admin Chunk (587 KB)
**Cause:** All admin features bundled together
**Solution:**
```typescript
// Split into sub-routes
const UserManagement = lazy(() => import('./admin/UserManagement'));
const TenantManagement = lazy(() => import('./admin/TenantManagement'));
const AuditLog = lazy(() => import('./admin/AuditLog'));
```

### Issue: Reports Module (300 KB)
**Cause:** Entire Recharts library bundled
**Solution:**
```typescript
// Lazy load chart components
const LineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));
const BarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })));
```

### Issue: Duplicate Dependencies
**Cause:** Same library bundled in multiple chunks
**Solution:** Adjust `manualChunks` in `vite.config.ts` to create shared vendor chunks

## Analyzing Specific Scenarios

### Check Initial Load Size
1. Look for `index-*.js` chunk (main entry point)
2. Add `vendor-react-*.js` (React runtime)
3. Add `*.css` files
4. **Total should be <200 KB gzipped**

### Find Duplicate Modules
1. Open report
2. Use browser search (Ctrl+F)
3. Search for module name
4. If highlighted in multiple chunks = duplicate

### Identify Optimization Targets
**Priority order:**
1. Chunks >500 KB gzipped
2. Chunks >200 KB gzipped
3. Duplicate dependencies
4. Unused dependencies

## CI/CD Integration

### Automated Size Checks
Add to `.github/workflows/ci.yml`:
```yaml
- name: Bundle Size Check
  run: |
    npm run build:analyze
    # Add size limit checks here
```

### Size Budgets
Consider adding `size-limit` package:
```bash
npm install --save-dev @size-limit/preset-app
```

Then in `package.json`:
```json
{
  "size-limit": [
    {
      "path": "dist/assets/index-*.js",
      "limit": "150 KB"
    }
  ]
}
```

## Regular Monitoring

### Weekly Review
1. Run `npm run build:analyze`
2. Check if total size is increasing
3. Identify new large dependencies
4. Update optimization backlog

### Before Each Release
1. Generate bundle report
2. Compare with previous release
3. Investigate any size increases >10%
4. Document changes in release notes

## Resources

### Tools
- [Rollup Plugin Visualizer](https://github.com/btd/rollup-plugin-visualizer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) (alternative)
- [BundlePhobia](https://bundlephobia.com/) - Check package sizes before installing

### Best Practices
- [Web.dev: Code Splitting](https://web.dev/code-splitting-suspense/)
- [MDN: Lazy Loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading)
- [Vite: Build Optimizations](https://vitejs.dev/guide/build.html)

## Troubleshooting

### Report Not Opening
**Solution:**
```bash
# Manually open the report
cd dist
start stats.html  # Windows
open stats.html   # macOS
xdg-open stats.html  # Linux
```

### Build Fails with ANALYZE=true
**Solution:**
```bash
# Try without type checking
cross-env ANALYZE=true vite build
```

### PWA Cache Limit Error
**Issue:** Chunk exceeds 2 MB default limit
**Solution:**
Increase limit in `vite.config.ts`:
```typescript
VitePWA({
  workbox: {
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
  }
})
```

## Support
For issues or questions:
1. Check the visualization report at `dist/stats.html`
2. Review this guide
3. Consult Vite documentation: https://vitejs.dev/guide/build.html
4. Open an issue with the bundle size data
