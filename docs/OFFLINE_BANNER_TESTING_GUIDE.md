# Offline Banner Testing Guide

This guide explains how to manually test the OfflineSyncBanner component integrated into the Layout.

## Overview

**Task 19.4: Create OfflineBanner component**

The OfflineSyncBanner component displays:
- A yellow banner when the user is offline with pending operations count
- A blue banner when the user is online with pending operations
- Nothing when online with no pending operations

## Component Location

- **Component:** `src/components/OfflineSync/OfflineSyncBanner.tsx`
- **Integration:** `src/components/Layout/Layout.tsx` (line 40)
- **Provider:** `src/App.tsx` (OfflineSyncProvider wrapper)

## Manual Testing Steps

### Test 1: Offline State with Pending Operations

**Validates: Requirement 9.3**
> THE PWA SHALL display a banner showing "Você está offline" with the number of pending operations

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Navigate to any page** (e.g., `/pecuaria/animal`)

3. **Open DevTools** → Application → Service Workers → Check "Offline"

4. **Perform a create/update operation** (e.g., create a new animal)

5. **Expected Result:**
   - Yellow banner appears at the top of the screen
   - Message: "Você está offline. X operação(ões) serão sincronizadas quando voltar online."
   - WifiOff icon displayed

### Test 2: Online State with Pending Operations

1. **With pending operations from Test 1**

2. **Uncheck "Offline"** in DevTools

3. **Expected Result:**
   - Banner changes to blue
   - Message: "Você está online. X operação(ões) pendente(s) de sincronização."
   - "Sincronizar Agora" button appears
   - Clicking the button triggers manual sync

### Test 3: Online State with No Pending Operations

1. **Ensure all operations are synced** (banner should be blue if any pending)

2. **Wait for auto-sync or click "Sincronizar Agora"**

3. **Expected Result:**
   - Banner disappears completely
   - No visual clutter when everything is synced

### Test 4: Manual Sync Button

1. **Go offline and create multiple operations** (3-5 operations)

2. **Go back online**

3. **Click "Sincronizar Agora" button**

4. **Expected Result:**
   - Button shows loading state briefly
   - Pending count decreases as operations sync
   - Banner disappears when all synced
   - Toast notifications show success/failure for each operation

### Test 5: Banner Positioning

1. **Navigate through different pages**

2. **Expected Result:**
   - Banner stays fixed at the top of the viewport
   - Banner appears above sidebar and header
   - Banner is responsive on mobile/tablet
   - Banner doesn't overlap critical UI elements

### Test 6: Multiple Operations

1. **Go offline**

2. **Create 10 different operations:**
   - Create animals
   - Update weights
   - Create payments
   - etc.

3. **Expected Result:**
   - Counter updates correctly (shows "10 operação(ões)")
   - Plural form used correctly

### Test 7: Auto-Sync on Reconnect

1. **Go offline and create operations**

2. **Go back online**

3. **Wait without clicking manual sync**

4. **Expected Result:**
   - Banner remains visible
   - Auto-sync happens in background
   - Counter decreases as operations complete
   - Banner disappears when all synced

## Browser DevTools Testing

### Simulating Network Conditions

**Chrome/Edge:**
1. F12 → Network tab
2. Throttling dropdown → Select "Offline"
3. Or: Application → Service Workers → Check "Offline"

**Firefox:**
1. F12 → Network tab
2. Throttling dropdown → Select "Offline"

### Checking IndexedDB Queue

1. F12 → Application (Chrome) / Storage (Firefox)
2. IndexedDB → Select database
3. Check `offline_queue` table
4. Verify operations are stored correctly

## Expected Styling

### Offline Banner (Yellow)
- Background: `bg-yellow-500`
- Text color: `text-gray-900`
- Icon: WifiOff (white)

### Online with Pending (Blue)
- Background: `bg-blue-500`
- Text color: `text-white`
- Button: White with opacity hover effect

### Positioning
- Fixed at top: `fixed top-0 left-0 right-0`
- Z-index: `z-50` (above most elements)
- Padding: `px-4 py-3`
- Shadow: `shadow-md`

## Integration Points

### OfflineSyncContext Hook

The banner uses:
```typescript
const { isOnline, pendingCount, syncQueue } = useOfflineSync();
```

### Layout Integration

The banner is rendered before the Sidebar:
```tsx
<div className="layout">
  <OfflineSyncBanner />  {/* Fixed at top of viewport */}
  <Sidebar />
  <main>...</main>
</div>
```

## Common Issues

### Issue: Banner not appearing when offline
- **Check:** OfflineSyncProvider is wrapped in App.tsx
- **Check:** Service Worker is registered
- **Check:** Browser supports Service Workers

### Issue: Pending count not updating
- **Check:** IndexedDB permissions
- **Check:** Context hook is properly connected
- **Check:** Operations are being queued in OfflineSyncContext

### Issue: Manual sync button not working
- **Check:** syncQueue function in context
- **Check:** Network connection is actually restored
- **Check:** Console for errors

## Automated Tests

Run the integration test:
```bash
npm test -- Layout.integration.test.tsx --run
```

Run the component test:
```bash
npm test -- OfflineSyncBanner --run
```

## Success Criteria ✓

- [x] Banner displays when offline
- [x] Shows pending operations count
- [x] Manual sync button works when online
- [x] Integrated into app layout
- [x] Proper styling (yellow offline, blue online with pending)
- [x] Fixed positioning at top
- [x] Banner hides when online with no pending operations
- [x] All tests passing

## Related Files

- `src/components/OfflineSync/OfflineSyncBanner.tsx` - Component
- `src/components/Layout/Layout.tsx` - Integration point
- `src/contexts/OfflineSyncContext.tsx` - State management
- `src/components/Layout/Layout.integration.test.tsx` - Tests
- `.kiro/specs/system-improvements/requirements.md` - R9.3

## Next Steps

After verifying the banner works correctly:
1. Test across different browsers (Chrome, Firefox, Safari, Edge)
2. Test on mobile devices
3. Verify accessibility (screen reader support)
4. Performance testing with many queued operations
5. Consider adding animation for banner appearance/disappearance
