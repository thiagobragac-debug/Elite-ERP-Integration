# Task 26.1: Initial Lighthouse Audit Guide

## Overview

This guide provides instructions for running the initial Lighthouse audit to establish baseline performance metrics for the Tauze ERP v5.0 application. The audit results will guide optimization work in subsequent tasks.

**Task:** Run Lighthouse in Chrome DevTools  
**Objective:** Record baseline scores for Performance, Accessibility, Best Practices, and SEO  
**Requirements:** 17.3 - System SHALL achieve Lighthouse score of 90+ for Performance, Accessibility, Best Practices, and SEO

---

## Prerequisites

- ✅ Development server running on `http://localhost:5173/`
- ✅ Google Chrome browser (latest version recommended)
- ✅ Chrome DevTools (built into Chrome)

---

## Step-by-Step Instructions

### 1. Start Development Server

The development server is already running. You can verify it's accessible by visiting:
- **Local URL:** http://localhost:5173/

If you need to restart it:
```bash
npm run dev
```

### 2. Open Chrome DevTools

1. Open Google Chrome
2. Navigate to `http://localhost:5173/`
3. Wait for the application to fully load
4. Open Chrome DevTools using one of these methods:
   - Press `F12`
   - Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Right-click on the page → "Inspect"

### 3. Navigate to Lighthouse Tab

1. In Chrome DevTools, locate the **Lighthouse** tab at the top
   - If you don't see it, click the `>>` icon and select "Lighthouse" from the dropdown
2. Click on the **Lighthouse** tab to open the audit panel

### 4. Configure Lighthouse Audit

Configure the following settings:

**Mode:**
- ✅ Select **"Navigation"** (default)

**Device:**
- ✅ Run audits for **Desktop** first
- Then repeat for **Mobile** to see mobile performance

**Categories (Select All):**
- ✅ **Performance**
- ✅ **Accessibility**
- ✅ **Best Practices**
- ✅ **SEO**
- ⬜ Progressive Web App (optional for now, will be tested in Phase 4)

**Throttling:**
- ✅ Use **"Simulated throttling"** (default) for consistent results
- Optional: Run a second audit with **"Applied throttling"** for real-world testing

### 5. Run the Audit

1. Click the **"Analyze page load"** button
2. Chrome will reload the page and run the audit (takes ~30-60 seconds)
3. Wait for the audit to complete

### 6. Review and Document Results

Once the audit completes, you'll see a report with scores for each category.

**Record the following baseline metrics:**

#### Overall Scores (0-100)
- **Performance:** _____
- **Accessibility:** _____
- **Best Practices:** _____
- **SEO:** _____

#### Core Web Vitals
- **LCP (Largest Contentful Paint):** _____ seconds (Target: < 2.5s)
- **FID (First Input Delay):** _____ ms (Target: < 100ms) *Note: May show TBT instead*
- **CLS (Cumulative Layout Shift):** _____ (Target: < 0.1)

#### Additional Performance Metrics
- **First Contentful Paint (FCP):** _____ seconds
- **Time to Interactive (TTI):** _____ seconds
- **Speed Index:** _____ seconds
- **Total Blocking Time (TBT):** _____ ms

### 7. Identify Specific Issues

Scroll down through the Lighthouse report to identify specific issues in each category:

#### Performance Issues
Look for recommendations such as:
- Eliminate render-blocking resources
- Reduce unused JavaScript
- Reduce unused CSS
- Properly size images
- Defer offscreen images
- Minify JavaScript/CSS
- Serve images in next-gen formats
- Reduce server response times

#### Accessibility Issues
Common findings:
- Missing alt attributes on images
- Low color contrast ratios
- Missing form labels
- Missing ARIA attributes
- Incorrect heading hierarchy
- Missing focus indicators

#### Best Practices Issues
Check for:
- Browser errors in console
- Deprecated APIs
- Insecure resources (HTTP instead of HTTPS)
- Missing Content Security Policy
- JavaScript vulnerabilities

#### SEO Issues
Review:
- Missing meta descriptions
- Document doesn't have a title
- Links don't have descriptive text
- Images missing alt text
- Document doesn't have a valid hreflang

### 8. Export the Report

1. Click the **"View Report"** button (top right, three-dot menu)
2. Choose **"Save as HTML"** or **"Save as JSON"**
3. Save the file to: `c:\Saas\docs\lighthouse-reports\baseline-audit-[date].html`

### 9. Take Screenshots

Capture screenshots of:
1. Overall scores summary (top of report)
2. Core Web Vitals metrics
3. Main performance opportunities section
4. Accessibility issues section
5. Any critical issues highlighted in red

### 10. Document Findings

Use the template below to document your findings.

---

## Baseline Audit Results Template

### Audit Information
- **Date:** [Insert date]
- **Time:** [Insert time]
- **Chrome Version:** [Insert version]
- **Device Mode:** Desktop / Mobile
- **Throttling:** Simulated / Applied / None
- **URL:** http://localhost:5173/

### Overall Scores

| Category | Score | Status | Target |
|----------|-------|--------|--------|
| Performance | ___ / 100 | 🔴/🟠/🟢 | 90+ |
| Accessibility | ___ / 100 | 🔴/🟠/🟢 | 90+ |
| Best Practices | ___ / 100 | 🔴/🟠/🟢 | 90+ |
| SEO | ___ / 100 | 🔴/🟠/🟢 | 90+ |

**Legend:**
- 🔴 Red (0-49): Poor
- 🟠 Orange (50-89): Needs Improvement
- 🟢 Green (90-100): Good

### Core Web Vitals

| Metric | Value | Status | Target |
|--------|-------|--------|--------|
| LCP (Largest Contentful Paint) | ___s | 🔴/🟠/🟢 | < 2.5s |
| FID (First Input Delay) | ___ms | 🔴/🟠/🟢 | < 100ms |
| CLS (Cumulative Layout Shift) | ___ | 🔴/🟠/🟢 | < 0.1 |

### Performance Metrics

| Metric | Value |
|--------|-------|
| First Contentful Paint (FCP) | ___s |
| Speed Index | ___s |
| Time to Interactive (TTI) | ___s |
| Total Blocking Time (TBT) | ___ms |
| Bundle Size (gzipped) | ___KB |

### Top Performance Issues

List the top 5-10 performance opportunities identified by Lighthouse:

1. **[Issue Name]**
   - **Impact:** [High/Medium/Low]
   - **Potential Savings:** [Time/Size]
   - **Description:** [Brief description]
   - **Recommendation:** [What needs to be done]

2. **[Issue Name]**
   - **Impact:** [High/Medium/Low]
   - **Potential Savings:** [Time/Size]
   - **Description:** [Brief description]
   - **Recommendation:** [What needs to be done]

3. **[Continue for top issues...]**

### Accessibility Issues

List all accessibility violations:

1. **[Issue Name]**
   - **Severity:** [Critical/Serious/Moderate/Minor]
   - **Affected Elements:** [Count]
   - **Description:** [Brief description]
   - **Fix:** [How to resolve]

2. **[Continue for all issues...]**

### Best Practices Issues

List all best practices violations:

1. **[Issue Name]**
   - **Description:** [Brief description]
   - **Fix:** [How to resolve]

2. **[Continue for all issues...]**

### SEO Issues

List all SEO issues:

1. **[Issue Name]**
   - **Description:** [Brief description]
   - **Fix:** [How to resolve]

2. **[Continue for all issues...]**

### Bundle Analysis (if available)

- **Total JavaScript:** ___KB (gzipped)
- **Total CSS:** ___KB (gzipped)
- **Total Images:** ___KB
- **Number of Requests:** ___
- **Largest Bundles:**
  1. [Bundle name]: ___KB
  2. [Bundle name]: ___KB
  3. [Bundle name]: ___KB

### Recommendations Summary

#### Priority 1 (Critical - High Impact)
- [ ] [Recommendation 1]
- [ ] [Recommendation 2]

#### Priority 2 (Important - Medium Impact)
- [ ] [Recommendation 1]
- [ ] [Recommendation 2]

#### Priority 3 (Nice to Have - Low Impact)
- [ ] [Recommendation 1]
- [ ] [Recommendation 2]

### Next Steps

Based on the audit results, the following tasks will address the identified issues:

- **Task 26.2:** Implement performance optimizations (will address [list key performance issues])
- **Task 26.3:** Fix accessibility and SEO issues (will address [list key a11y/SEO issues])
- **Related Tasks:** Tasks 14.x (Bundle optimization), 15.x (Component refactoring), 16.x (Database indexes)

### Notes

[Add any additional observations, context, or important notes here]

---

## Tips for Accurate Results

1. **Clear Cache:** Before running audit, clear browser cache (Ctrl+Shift+Del)
2. **Close Other Tabs:** Minimize interference from other browser activity
3. **Stable Network:** Ensure stable internet connection
4. **Multiple Runs:** Run audit 2-3 times and average the scores for consistency
5. **Incognito Mode:** Consider running in incognito mode to avoid extension interference
6. **Production vs Development:** Note that development builds are typically slower than production builds

---

## Common Issues in Development Mode

Development builds typically have:
- ❌ Larger bundle sizes (unminified code)
- ❌ Slower load times (hot reload overhead)
- ❌ Additional debugging tools loaded
- ❌ Source maps included
- ✅ All source files available for debugging

**Note:** Some issues seen in development may not appear in production builds. For the most accurate audit, run Lighthouse against a production build:

```bash
npm run build
npm run preview
```

Then audit the preview URL (typically `http://localhost:4173/`).

---

## Troubleshooting

### Issue: Lighthouse tab not visible
**Solution:** Update Chrome to the latest version. Lighthouse is built into Chrome DevTools.

### Issue: Audit fails to run
**Solution:** 
- Ensure page loads successfully
- Check for console errors
- Try closing and reopening DevTools
- Restart Chrome

### Issue: Performance score varies significantly between runs
**Solution:**
- Close other applications to free up system resources
- Run multiple audits and use the average
- Use "Simulated throttling" for more consistent results

### Issue: Cannot save report
**Solution:**
- Ensure you have write permissions to the save location
- Try saving to a different directory first
- Check available disk space

---

## Additional Resources

- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Chrome DevTools Overview](https://developer.chrome.com/docs/devtools/)
- [Web.dev Performance](https://web.dev/performance/)

---

## After Completing the Audit

Once you've completed the audit and documented the results:

1. ✅ Save this document with your findings filled in
2. ✅ Save the HTML/JSON report to `docs/lighthouse-reports/`
3. ✅ Share the results with the team
4. ✅ Update the task in `tasks.md` as complete
5. ✅ Proceed to Task 26.2 (Implement performance optimizations)

---

**Task Status:** Ready to Execute  
**Estimated Time:** 15-30 minutes  
**Output:** Baseline audit report with documented scores and specific issues  
