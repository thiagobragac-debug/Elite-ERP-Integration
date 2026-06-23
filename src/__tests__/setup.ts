import '@testing-library/jest-dom';
import { server } from '../__mocks__/browser';

// Mock environment variables for tests (before any imports that use them)
// Note: These will override real values during test runs
if (!process.env.CI) {
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock';
}

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test to ensure test isolation
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());

// Mock window.matchMedia (used by Recharts and responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (used by lazy loading and virtual scrolling)
window.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (used by charts and responsive layouts)
window.ResizeObserver = class ResizeObserver {
  constructor() {}
} as any;

// Mock idb-keyval globally since JSDOM doesn't support IndexedDB
vi.mock('idb-keyval', () => {
  const store = new Map();
  return {
    get: vi.fn(async (key) => store.get(key) || []),
    set: vi.fn(async (key, value) => {
      store.set(key, value);
    }),
    createStore: vi.fn(() => 'mock-store'),
    clear: vi.fn(async () => {
      store.clear();
    }),
    del: vi.fn(async (key) => {
      store.delete(key);
    }),
    keys: vi.fn(async () => Array.from(store.keys())),
  };
});
