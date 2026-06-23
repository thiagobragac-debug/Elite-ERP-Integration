import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEnv } from './validateEnv';

describe('validateEnv', () => {
  let originalEnv: any;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...import.meta.env };
  });

  afterEach(() => {
    // Restore original env
    Object.keys(import.meta.env).forEach((key) => {
      delete (import.meta.env as any)[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  it('should not throw when all required env vars are present and URL is valid', () => {
    // Set required env vars
    (import.meta.env as any).VITE_SUPABASE_URL = 'https://test.supabase.co';
    (import.meta.env as any).VITE_SUPABASE_ANON_KEY = 'test-key';

    expect(() => validateEnv()).not.toThrow();
  });

  it('should throw when both required vars are missing', () => {
    // Clear all env vars
    delete (import.meta.env as any).VITE_SUPABASE_URL;
    delete (import.meta.env as any).VITE_SUPABASE_ANON_KEY;

    expect(() => validateEnv()).toThrow(
      'Missing required environment variables:\nVITE_SUPABASE_URL\nVITE_SUPABASE_ANON_KEY\n\nPlease check .env.example for reference.'
    );
  });

  it('should throw when only VITE_SUPABASE_URL is missing', () => {
    delete (import.meta.env as any).VITE_SUPABASE_URL;
    (import.meta.env as any).VITE_SUPABASE_ANON_KEY = 'test-key';

    expect(() => validateEnv()).toThrow(
      'Missing required environment variables:\nVITE_SUPABASE_URL\n\nPlease check .env.example for reference.'
    );
  });

  it('should throw when only VITE_SUPABASE_ANON_KEY is missing', () => {
    (import.meta.env as any).VITE_SUPABASE_URL = 'https://test.supabase.co';
    delete (import.meta.env as any).VITE_SUPABASE_ANON_KEY;

    expect(() => validateEnv()).toThrow(
      'Missing required environment variables:\nVITE_SUPABASE_ANON_KEY\n\nPlease check .env.example for reference.'
    );
  });

  it('should throw when VITE_SUPABASE_URL is not a valid URL', () => {
    (import.meta.env as any).VITE_SUPABASE_URL = 'not-a-valid-url';
    (import.meta.env as any).VITE_SUPABASE_ANON_KEY = 'test-key';

    expect(() => validateEnv()).toThrow('VITE_SUPABASE_URL must be a valid URL');
  });

  it('should throw when VITE_SUPABASE_URL is empty string', () => {
    (import.meta.env as any).VITE_SUPABASE_URL = '';
    (import.meta.env as any).VITE_SUPABASE_ANON_KEY = 'test-key';

    expect(() => validateEnv()).toThrow(
      'Missing required environment variables:\nVITE_SUPABASE_URL\n\nPlease check .env.example for reference.'
    );
  });

  it('should accept valid HTTP URLs for VITE_SUPABASE_URL', () => {
    (import.meta.env as any).VITE_SUPABASE_URL = 'http://localhost:54321';
    (import.meta.env as any).VITE_SUPABASE_ANON_KEY = 'test-key';

    expect(() => validateEnv()).not.toThrow();
  });

  it('should accept valid HTTPS URLs for VITE_SUPABASE_URL', () => {
    (import.meta.env as any).VITE_SUPABASE_URL = 'https://myproject.supabase.co';
    (import.meta.env as any).VITE_SUPABASE_ANON_KEY = 'test-key';

    expect(() => validateEnv()).not.toThrow();
  });
});
