# Test Utilities

This directory contains reusable testing utilities for the Tauze ERP application.

## Overview

The test utilities provide pre-configured wrappers and helpers to make testing React components easier and more consistent across the codebase.

## Files

- **`render.tsx`** - Custom render function with all providers
- **`index.ts`** - Central export point for all utilities

## Usage

### Basic Component Testing

Use `renderWithProviders` instead of React Testing Library's default `render`:

```tsx
import { renderWithProviders, screen } from '@/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render successfully', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### What Providers Are Included?

The `renderWithProviders` function wraps your component with:

1. **QueryClientProvider** - React Query with retry disabled for tests
2. **BrowserRouter** - React Router for navigation
3. **AuthProvider** - Authentication context
4. **TenantProvider** - Multi-tenant context

### Custom QueryClient

If you need a custom QueryClient configuration:

```tsx
import { renderWithProviders } from '@/test-utils';
import { QueryClient } from '@tanstack/react-query';

const customQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 3 },
  },
});

renderWithProviders(<MyComponent />, { queryClient: customQueryClient });
```

### Testing Components with Hooks

Components that use authentication, tenant, or routing hooks will work automatically:

```tsx
import { renderWithProviders, screen } from '@/test-utils';
import { useAuth } from '@/contexts/AuthContext';

function MyAuthComponent() {
  const { user, isAuthenticated } = useAuth();
  return <div>{isAuthenticated ? 'Logged In' : 'Logged Out'}</div>;
}

describe('MyAuthComponent', () => {
  it('should access auth context', () => {
    renderWithProviders(<MyAuthComponent />);
    // Context is available - no manual mocking needed
    expect(screen.getByText(/Logged/)).toBeInTheDocument();
  });
});
```

### User Interactions

Use `@testing-library/user-event` for simulating user interactions:

```tsx
import { renderWithProviders, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';

describe('Form Component', () => {
  it('should handle user input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyForm />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Testing with MSW (Mock Service Worker)

API calls are automatically mocked using MSW. Override handlers in individual tests:

```tsx
import { renderWithProviders, screen, waitFor } from '@/test-utils';
import { server } from '@/__mocks__/browser';
import { http, HttpResponse } from 'msw';

describe('Data Fetching Component', () => {
  it('should load and display data', async () => {
    // Override the default handler
    server.use(
      http.get('*/rest/v1/animais', () => {
        return HttpResponse.json([{ id: '1', brinco: '001', peso_atual: 450 }]);
      })
    );

    renderWithProviders(<AnimalList />);

    await waitFor(() => {
      expect(screen.getByText('001')).toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **Always use `renderWithProviders`** for components that may use any application context
2. **Use `screen` queries** instead of destructuring from render result
3. **Prefer `userEvent`** over `fireEvent` for more realistic interactions
4. **Use `waitFor`** for async operations like data fetching
5. **Keep tests focused** - test one behavior per test case
6. **Mock external dependencies** using MSW for API calls

## Configuration

The test QueryClient is configured with:

- `retry: false` - No retries to make tests faster
- `cacheTime: 0` - No caching for test isolation
- `staleTime: 0` - Data is always stale
- `refetchOnWindowFocus: false` - No refetch on window focus

These settings ensure tests are:

- **Fast** - No unnecessary delays
- **Deterministic** - Same results every time
- **Isolated** - Tests don't affect each other

## Examples

See `render.test.tsx` for comprehensive examples of how to use these utilities.

## Related Documentation

- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [React Query Testing Guide](https://tanstack.com/query/latest/docs/react/guides/testing)
- [MSW Documentation](https://mswjs.io/docs/)
- [Vitest Documentation](https://vitest.dev/)
