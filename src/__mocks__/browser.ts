/**
 * MSW (Mock Service Worker) Setup for API Mocking
 *
 * This file provides comprehensive API mocking for:
 * - Supabase Auth endpoints (login, signup, token refresh)
 * - Supabase REST API (GET, POST, PATCH, DELETE)
 * - Generic REST API handlers for testing
 *
 * Usage: Import the server in tests and use server.use() to override handlers
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Base URL for Supabase - can be overridden by environment variable
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';

/**
 * Default MSW Handlers
 *
 * These handlers provide mock responses for common API endpoints.
 * They can be overridden in individual tests using `server.use()`.
 */
export const handlers = [
  // ==============================================
  // Supabase Auth Endpoints
  // ==============================================

  /**
   * POST /auth/v1/token - Login with email/password
   * Returns a mock JWT token and user object
   */
  http.post('*/auth/v1/token', async ({ request }) => {
    const body = (await request.json()) as any;

    // Simulate failed login for specific test credentials
    if (body.email === 'invalid@example.com') {
      return HttpResponse.json({ error: 'Invalid login credentials' }, { status: 400 });
    }

    // Successful login response
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: body.email || 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        app_metadata: {
          provider: 'email',
        },
        user_metadata: {
          full_name: 'Test User',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }),

  /**
   * POST /auth/v1/signup - Register new user
   * Returns a mock JWT token and user object
   */
  http.post('*/auth/v1/signup', async ({ request }) => {
    const body = (await request.json()) as any;

    // Simulate duplicate email error
    if (body.email === 'duplicate@example.com') {
      return HttpResponse.json({ error: 'User already registered' }, { status: 422 });
    }

    // Successful signup response
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-new-user-id',
        email: body.email,
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: null, // Email not confirmed yet
        app_metadata: {
          provider: 'email',
        },
        user_metadata: body.data || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }),

  /**
   * POST /auth/v1/token?grant_type=refresh_token - Refresh access token
   * Returns a new mock JWT token
   */
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const url = new URL(request.url);
    const grantType = url.searchParams.get('grant_type');

    if (grantType === 'refresh_token') {
      return HttpResponse.json({
        access_token: 'mock-refreshed-jwt-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-new-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
        },
      });
    }
  }),

  /**
   * POST /auth/v1/logout - Logout user
   * Returns empty success response
   */
  http.post('*/auth/v1/logout', () => {
    return HttpResponse.json({}, { status: 204 });
  }),

  /**
   * GET /auth/v1/user - Get current user
   * Returns the authenticated user object
   */
  http.get('*/auth/v1/user', ({ request }) => {
    const authHeader = request.headers.get('authorization');

    // Simulate unauthorized access
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {
        full_name: 'Test User',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  // ==============================================
  // Supabase REST API - Generic CRUD Operations
  // ==============================================

  /**
   * GET /rest/v1/:table - Query table rows
   * Returns an empty array by default, can be overridden in tests
   */
  http.get('*/rest/v1/:table', ({ params, request }) => {
    const { table } = params;
    const url = new URL(request.url);

    // You can inspect query parameters for filtering
    const select = url.searchParams.get('select');
    const filters = Object.fromEntries(url.searchParams.entries());

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MSW] GET /${table}`, { select, filters });
    }

    // Return empty array by default
    // Tests can override this handler to return specific data
    return HttpResponse.json([], {
      headers: {
        'Content-Range': '0-0/0',
      },
    });
  }),

  /**
   * POST /rest/v1/:table - Insert new row(s)
   * Returns the inserted data with generated ID
   */
  http.post('*/rest/v1/:table', async ({ params, request }) => {
    const { table } = params;
    const body = (await request.json()) as any;

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MSW] POST /${table}`, body);
    }

    // Return the inserted data with a generated ID
    const responseData = Array.isArray(body)
      ? body.map((item, index) => ({ ...item, id: `mock-id-${index}` }))
      : { ...body, id: 'mock-new-id', created_at: new Date().toISOString() };

    return HttpResponse.json(responseData, { status: 201 });
  }),

  /**
   * PATCH /rest/v1/:table - Update existing row(s)
   * Returns the updated data
   */
  http.patch('*/rest/v1/:table', async ({ params, request }) => {
    const { table } = params;
    const body = (await request.json()) as any;
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MSW] PATCH /${table}`, { filters, body });
    }

    // Return the updated data
    return HttpResponse.json({
      ...body,
      updated_at: new Date().toISOString(),
    });
  }),

  /**
   * DELETE /rest/v1/:table - Delete row(s)
   * Returns empty response with 204 status
   */
  http.delete('*/rest/v1/:table', ({ params, request }) => {
    const { table } = params;
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MSW] DELETE /${table}`, filters);
    }

    // Return empty response
    return HttpResponse.json({}, { status: 204 });
  }),

  // ==============================================
  // Supabase Storage API
  // ==============================================

  /**
   * POST /storage/v1/object/:bucket/:path - Upload file
   * Returns mock file metadata
   */
  http.post('*/storage/v1/object/:bucket/*', async ({ params, request }) => {
    const { bucket } = params;

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MSW] POST /storage/${bucket}`);
    }

    return HttpResponse.json({
      Key: `${bucket}/mock-file-id.jpg`,
      Id: 'mock-file-id',
    });
  }),

  /**
   * GET /storage/v1/object/:bucket/:path - Get file
   * Returns empty blob
   */
  http.get('*/storage/v1/object/:bucket/*', () => {
    return HttpResponse.json(new Blob());
  }),

  // ==============================================
  // Supabase RPC (Remote Procedure Calls)
  // ==============================================

  /**
   * POST /rest/v1/rpc/:function - Call database function
   * Returns empty object by default
   */
  http.post('*/rest/v1/rpc/:function', async ({ params, request }) => {
    const { function: functionName } = params;
    const body = (await request.json()) as any;

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MSW] RPC /${functionName}`, body);
    }

    // Return empty response by default
    // Tests should override this for specific RPC functions
    return HttpResponse.json({});
  }),
];

/**
 * MSW Server Instance
 *
 * This server is used in test setup to intercept network requests.
 * It is configured in src/__tests__/setup.ts to start before tests
 * and reset/close after tests complete.
 *
 * Tests can override handlers using server.use() with http handlers from msw
 */
export const server = setupServer(...handlers);
