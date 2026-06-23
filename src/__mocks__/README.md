# MSW (Mock Service Worker) Setup

This directory contains the MSW setup for API mocking in tests.

## Files

- **`browser.ts`** - Main MSW server configuration with request handlers
- **`browser.test.ts`** - Tests verifying MSW setup works correctly

## Usage

The MSW server is automatically configured in `src/__tests__/setup.ts` and runs for all tests. You don't need to manually start/stop it in most test files.

### Default Handlers

The MSW setup provides handlers for:

1. **Supabase Auth Endpoints**
   - `POST /auth/v1/token` - Login
   - `POST /auth/v1/signup` - Signup
   - `POST /auth/v1/logout` - Logout
   - `GET /auth/v1/user` - Get current user

2. **Supabase REST API**
   - `GET /rest/v1/:table` - Query rows
   - `POST /rest/v1/:table` - Insert rows
   - `PATCH /rest/v1/:table` - Update rows
   - `DELETE /rest/v1/:table` - Delete rows

3. **Supabase Storage API**
   - `POST /storage/v1/object/:bucket/*` - Upload file
   - `GET /storage/v1/object/:bucket/*` - Get file

4. **Supabase RPC**
   - `POST /rest/v1/rpc/:function` - Call database function

### Overriding Handlers in Tests

You can override the default handlers for specific tests:

```typescript
import { server } from '@/__mocks__/browser';
import { http, HttpResponse } from 'msw';

describe('My Component', () => {
  it('should handle API response', async () => {
    // Override the default handler for this test
    server.use(
      http.get('*/rest/v1/animais', () => {
        return HttpResponse.json([
          { id: '1', brinco: 'TEST-001', peso_atual: 450 },
          { id: '2', brinco: 'TEST-002', peso_atual: 500 },
        ]);
      })
    );

    // Your test code here...
  });
});
```

### Simulating Errors

You can simulate API errors for testing error handling:

```typescript
server.use(
  http.post('*/rest/v1/animais', () => {
    return HttpResponse.json({ error: 'Database connection failed' }, { status: 500 });
  })
);
```

### Simulating Network Delays

You can add delays to test loading states:

```typescript
import { delay } from 'msw';

server.use(
  http.get('*/rest/v1/animais', async () => {
    await delay(2000); // 2 second delay
    return HttpResponse.json([...]);
  })
);
```

## Testing the MSW Setup

Run the MSW setup tests to verify everything is working:

```bash
npm test -- src/__mocks__/browser.test.ts
```

## Resources

- [MSW Documentation](https://mswjs.io/)
- [MSW with Vitest](https://mswjs.io/docs/integrations/node)
- [Request Handlers](https://mswjs.io/docs/basics/request-handler)
