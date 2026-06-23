/**
 * Tests for MSW browser setup
 *
 * These tests verify that the MSW handlers are correctly configured
 * and can intercept network requests in test environments.
 *
 * Note: The MSW server is already started in src/__tests__/setup.ts
 * so we don't need to start it again in these tests.
 */

import { describe, it, expect } from 'vitest';
import { server, handlers } from './browser';
import { http, HttpResponse } from 'msw';

describe('MSW Browser Setup', () => {
  it('should export server instance', () => {
    expect(server).toBeDefined();
    expect(typeof server.listen).toBe('function');
    expect(typeof server.close).toBe('function');
  });

  it('should export handlers array', () => {
    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers.length).toBeGreaterThan(0);
  });

  it('should mock Supabase auth login endpoint', async () => {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.access_token).toBe('mock-jwt-token');
    expect(data.user.email).toBe('test@example.com');
  });

  it('should mock failed login with invalid credentials', async () => {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid@example.com', password: 'wrong' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid login credentials');
  });

  it('should mock Supabase REST API GET requests', async () => {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';

    const response = await fetch(`${SUPABASE_URL}/rest/v1/animais`);

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should mock Supabase REST API POST requests', async () => {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';

    const newAnimal = { brinco: 'TEST-001', peso: 450 };
    const response = await fetch(`${SUPABASE_URL}/rest/v1/animais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnimal),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.brinco).toBe('TEST-001');
  });

  it('should allow overriding handlers in tests', async () => {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';

    // Override the default empty array handler
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/animais`, () => {
        return HttpResponse.json([
          { id: '1', brinco: 'TEST-001', peso_atual: 450 },
          { id: '2', brinco: 'TEST-002', peso_atual: 500 },
        ]);
      })
    );

    const response = await fetch(`${SUPABASE_URL}/rest/v1/animais`);
    const data = await response.json();

    expect(data).toHaveLength(2);
    expect(data[0].brinco).toBe('TEST-001');
    expect(data[1].brinco).toBe('TEST-002');
  });

  it('should mock PATCH requests for updates', async () => {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';

    const updates = { peso_atual: 480 };
    const response = await fetch(`${SUPABASE_URL}/rest/v1/animais?id=eq.123`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.peso_atual).toBe(480);
    expect(data.updated_at).toBeDefined();
  });

  it('should mock DELETE requests', async () => {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';

    const response = await fetch(`${SUPABASE_URL}/rest/v1/animais?id=eq.123`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);
  });
});
