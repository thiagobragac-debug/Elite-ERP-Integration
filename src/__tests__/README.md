# Test Setup Documentation

This directory contains the global test setup configuration for the Tauze ERP v5.0 test suite.

## Files

### `setup.ts`

Global test setup file that is automatically loaded before all tests via `vitest.config.ts`.

**Features:**

- **@testing-library/jest-dom**: Provides custom Jest matchers for DOM assertions
- **MSW Server Lifecycle**: Manages Mock Service Worker for API mocking
  - `beforeAll()`: Starts MSW server with error reporting for unhandled requests
  - `afterEach()`: Resets handlers to ensure test isolation
  - `afterAll()`: Closes MSW server after all tests complete
- **Environment Variables**: Mocks test environment variables (non-CI environments)
  - `VITE_SUPABASE_URL`: https://test.supabase.co
  - `VITE_SUPABASE_ANON_KEY`: test-anon-key
  - `VITE_STRIPE_PUBLISHABLE_KEY`: pk_test_mock
- **Browser API Mocks**:
  - `window.matchMedia`: For responsive component testing
  - `window.IntersectionObserver`: For lazy loading and virtual scrolling
  - `window.ResizeObserver`: For chart and responsive layout testing

## Usage

The setup file is automatically loaded for all tests. You don't need to import it manually.

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

### Using MSW for API Mocking

The MSW server is already configured and running. To add custom handlers for specific tests:

```typescript
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('API Test', () => {
  it('should handle API response', async () => {
    // Override handler for this test
    server.use(
      http.get('*/rest/v1/animals', () => {
        return HttpResponse.json([{ id: '1', name: 'Test Animal' }]);
      })
    );

    // Your test code here
  });
});
```

## Configuration

To modify the test setup:

1. Edit `src/__tests__/setup.ts` for global setup changes
2. Edit `vitest.config.ts` for Vitest configuration changes
3. Edit `src/mocks/server.ts` for MSW handler changes

## Requirements Met

This setup fulfills **Requirement 4.3** from the System Improvements spec:

- ✅ Created `src/__tests__/setup.ts` with global test setup
- ✅ Imported `@testing-library/jest-dom` for matchers
- ✅ Setup MSW server lifecycle (beforeAll, afterEach, afterAll)
- ✅ Mocked environment variables for tests
- ✅ Mocked browser APIs (matchMedia, IntersectionObserver, ResizeObserver)

## Related Files

- `vitest.config.ts`: Vitest configuration that loads this setup
- `src/mocks/server.ts`: MSW server and default handlers
- `src/setupTests.ts`: Legacy setup file (deprecated, use `__tests__/setup.ts`)
