# PWA Assets Checklist

## Overview

The PWA configuration references icons that need to be created for full Progressive Web App functionality.

## Required Icons

### 1. PWA Icon 192x192

**Filename:** `public/pwa-192x192.png`

**Requirements:**
- Size: 192x192 pixels
- Format: PNG
- Purpose: `any maskable`
- Background: Should work on any background color
- Design: Tauze ERP logo centered with padding for safe zone

**Safe Zone:**
- Keep important content within 144x144px center circle
- This ensures icon looks good when system applies mask shapes (circles, squircles, etc.)

### 2. PWA Icon 512x512

**Filename:** `public/pwa-512x512.png`

**Requirements:**
- Size: 512x512 pixels
- Format: PNG
- Purpose: `any maskable`
- Background: Should work on any background color
- Design: Tauze ERP logo centered with padding for safe zone

**Safe Zone:**
- Keep important content within 384x384px center circle
- Same principle as 192x192 but scaled up

## Current Status

- [x] favicon.ico exists (64x64, 32x32, 24x24, 16x16)
- [ ] pwa-192x192.png missing
- [ ] pwa-512x512.png missing

## How to Create Icons

### Option 1: Using Design Tool (Recommended)

1. Open Figma/Adobe Illustrator/Sketch
2. Create new artboard: 512x512px
3. Place Tauze logo in center
4. Keep logo within 384x384px safe zone (circle)
5. Add solid background color: `#27a376` (theme color)
6. Export as PNG @ 512x512
7. Resize copy to 192x192 for smaller icon

### Option 2: Using Existing Logo

If you have a logo file (SVG or high-res PNG):

```bash
# Using ImageMagick
magick convert logo.png -resize 512x512 -background "#27a376" -gravity center -extent 512x512 public/pwa-192x192.png
magick convert logo.png -resize 192x192 -background "#27a376" -gravity center -extent 192x192 public/pwa-512x512.png
```

### Option 3: Online PWA Icon Generator

1. Visit: https://maskable.app/editor
2. Upload your logo
3. Adjust padding to ensure it fits in safe zone (red circle)
4. Download 192x192 and 512x512 versions
5. Place in `public/` folder

## Maskable Icon Guidelines

**What is Maskable?**
- Modern Android/iOS apply shaped masks to PWA icons (circles, squircles, rounded squares)
- "Maskable" icons work correctly with all mask shapes
- Content outside the safe zone (circle) may be cropped

**Testing Maskable Icons:**
1. Visit: https://maskable.app/
2. Upload your icon
3. Preview with different mask shapes
4. Ensure logo is always visible

## Icon Design Best Practices

### DO:
✅ Use solid background color matching `theme_color` (#27a376)
✅ Keep important content in safe zone (center 75%)
✅ Use high contrast between logo and background
✅ Test on both light and dark device themes
✅ Use SVG source for best quality at all sizes
✅ Export with no transparency for maskable icons

### DON'T:
❌ Use transparent backgrounds (won't work as maskable)
❌ Place important elements near edges
❌ Use thin lines that may become invisible when scaled
❌ Rely on fine details (will be lost at small sizes)
❌ Use white background with white logo (no contrast)

## Testing Icons

### Before Deploy:

1. **Place icons in `public/` folder:**
   ```
   public/
   ├── favicon.ico          ✅ (already exists)
   ├── pwa-192x192.png      ⏳ (to create)
   └── pwa-512x512.png      ⏳ (to create)
   ```

2. **Run build:**
   ```bash
   npm run build
   ```

3. **Check manifest includes icons:**
   - Open `dist/manifest.webmanifest`
   - Verify icons array contains all 3 icons
   - Verify paths are correct

4. **Test in Chrome DevTools:**
   - Open DevTools → Application → Manifest
   - Check for errors
   - Preview icons in "Icons" section

### After Deploy:

1. **Test Installation:**
   - Desktop: Look for install icon (+) in address bar
   - Mobile: Check "Add to Home Screen" works

2. **Verify Icon Appearance:**
   - Check installed icon looks correct
   - Test on different devices (Android, iOS)
   - Verify icon isn't cropped or distorted

3. **Run Lighthouse Audit:**
   ```bash
   # In DevTools → Lighthouse → PWA
   # Should see:
   # ✅ Registers a service worker
   # ✅ Manifest has icons
   # ✅ Icons are maskable
   ```

## Quick Win: Temporary Solution

**Until proper icons are created**, you can use a solid color placeholder:

```bash
# Create solid color 192x192 icon
magick convert -size 192x192 xc:"#27a376" public/pwa-192x192.png

# Create solid color 512x512 icon
magick convert -size 512x512 xc:"#27a376" public/pwa-512x512.png
```

This ensures the PWA is installable, even though icons won't show the logo.

## Priority

**Priority:** HIGH

**Reason:** Without these icons:
- PWA may not be installable on some devices
- Browser may show warning in DevTools
- Installation UI will show generic placeholder
- Fails PWA Lighthouse audit

**Estimated Time:** 30 minutes - 1 hour (depending on availability of logo assets)

## Resources

- [Maskable Icon Editor](https://maskable.app/editor)
- [PWA Icon Generator](https://www.pwabuilder.com/imageGenerator)
- [Adaptive Icon Guidelines](https://web.dev/maskable-icon/)
- [PWA Assets Best Practices](https://web.dev/add-manifest/)

## Related Tasks

- Task 20.1: ✅ Update Vite PWA plugin configuration (COMPLETE)
- Task 20.2: ⏭️ Implement background sync for photo uploads
- Task 22: ⏭️ Checkpoint - Validate offline-first capabilities
