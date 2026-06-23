# Lighthouse Optimization Guide - Quick Reference

## 🚀 Quick Start

This guide provides quick reference for maintaining Lighthouse scores of 90+ across all categories.

---

## 📦 Available Scripts

```bash
# Image optimization
npm run optimize:images      # Convert PNG/JPG to WebP

# Accessibility check
npm run check:a11y          # Scan for A11y issues

# Lighthouse audit
npm run lighthouse          # Run full audit (requires dev server)

# Bundle analysis
npm run build:analyze       # Visualize bundle size
```

---

## 🖼️ Image Optimization

### When to Optimize
- ✅ After adding new images to `/public`
- ✅ Before committing image changes
- ✅ Weekly maintenance run

### How to Use

```bash
# 1. Add your PNG/JPG images to /public
# 2. Run optimization
npm run optimize:images

# 3. Use OptimizedImage component
```

### Code Example

```tsx
import { OptimizedImage } from '@/components/UI/OptimizedImage';

// Basic usage
<OptimizedImage 
  src="/dashboard.png" 
  alt="Dashboard overview"
  width={1200}
  height={800}
  loading="lazy"
/>

// Above-the-fold (critical) image
<OptimizedImage 
  src="/hero.png" 
  alt="Hero banner"
  width={1920}
  height={1080}
  loading="eager"
  fetchPriority="high"
/>
```

---

## ♿ Accessibility Checklist

### Before Every Commit

- [ ] All images have `alt` attributes
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated `<label>`
- [ ] No color-only information
- [ ] Keyboard navigation works
- [ ] Focus indicators visible

### Quick Check

```bash
npm run check:a11y
```

### Common Fixes

```tsx
// ❌ BAD
<img src="logo.png" />
<button><X /></button>
<input type="text" />

// ✅ GOOD
<img src="logo.png" alt="Company logo" />
<button aria-label="Close"><X /></button>
<label htmlFor="name">Name</label>
<input id="name" type="text" />
```

---

## 🔍 SEO Best Practices

### Page Titles
```tsx
import { Helmet } from 'react-helmet-async';

<Helmet>
  <title>Page Title | Tauze ERP</title>
  <meta name="description" content="Page description under 160 chars" />
</Helmet>
```

### Structured Data
Already configured in `index.html`. Update when:
- App features change
- Ratings/reviews update
- Major version release

### Link Best Practices
```tsx
// ❌ BAD
<a href="/details">Click here</a>

// ✅ GOOD
<a href="/details">View animal details</a>
```

---

## ⚡ Performance Checklist

### Before Deployment

- [ ] Run `npm run build:analyze`
- [ ] Check bundle size <500KB gzipped
- [ ] Lazy load all routes
- [ ] No console.log in production
- [ ] Service worker configured
- [ ] Images optimized

### Quick Wins

1. **Code Splitting**
   ```tsx
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

2. **Lazy Loading Images**
   ```tsx
   <OptimizedImage loading="lazy" ... />
   ```

3. **Preload Critical Resources**
   ```html
   <link rel="preload" href="/critical.woff2" as="font" />
   ```

---

## 🎯 Target Scores

| Category | Target | Current Status |
|----------|--------|---------------|
| Performance | 90+ | 🟢 On Track |
| Accessibility | 90+ | 🟢 Excellent |
| Best Practices | 90+ | 🟢 On Track |
| SEO | 90+ | 🟢 Excellent |

### Core Web Vitals Targets

| Metric | Target | Unit |
|--------|--------|------|
| LCP (Largest Contentful Paint) | <2.5 | seconds |
| FID (First Input Delay) | <100 | milliseconds |
| CLS (Cumulative Layout Shift) | <0.1 | score |

---

## 🔧 Troubleshooting

### Low Performance Score

**Common Causes:**
- Large bundle size
- Unoptimized images
- No lazy loading
- Too many requests

**Solutions:**
1. Run `npm run build:analyze`
2. Check image sizes
3. Verify code splitting
4. Review network tab

### Low Accessibility Score

**Common Causes:**
- Missing alt text
- Poor color contrast
- Missing ARIA labels
- No keyboard support

**Solutions:**
1. Run `npm run check:a11y`
2. Test with keyboard
3. Use browser DevTools
4. Test with screen reader

### Low SEO Score

**Common Causes:**
- Missing meta description
- No structured data
- Poor link text
- Missing title

**Solutions:**
1. Check `index.html`
2. Review page titles
3. Improve link text
4. Add meta descriptions

---

## 📚 Resources

### Tools
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [WebPageTest](https://www.webpagetest.org/)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)

### Documentation
- [Web.dev Guides](https://web.dev/learn/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)

### Testing
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## 🎓 Best Practices Summary

### Images
- ✅ Use WebP format
- ✅ Add width/height to prevent CLS
- ✅ Lazy load below-the-fold images
- ✅ Compress before upload

### Accessibility
- ✅ Use semantic HTML
- ✅ Provide text alternatives
- ✅ Ensure keyboard navigation
- ✅ Maintain color contrast

### Performance
- ✅ Code split by route
- ✅ Lazy load heavy components
- ✅ Minimize bundle size
- ✅ Use service worker

### SEO
- ✅ Add structured data
- ✅ Write meta descriptions
- ✅ Use descriptive URLs
- ✅ Create sitemap

---

## 📞 Need Help?

1. Check `docs/TASK_26.2_COMPLETION_SUMMARY.md` for detailed information
2. Review code examples in `src/components/UI/OptimizedImage.tsx`
3. Run diagnostic scripts: `npm run check:a11y`
4. Check Lighthouse reports in `docs/lighthouse-reports/`

---

**Last Updated:** 2024-06-18  
**Maintained By:** Development Team  
**Related Task:** 26.2 - Fix Lighthouse Recommendations
