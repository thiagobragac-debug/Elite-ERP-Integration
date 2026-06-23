import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationResult } from './lib/validateEnv';

// Mock the modules before importing main
vi.mock('./lib/validateEnv', () => ({
  validateEnv: vi.fn(),
}));

vi.mock('./lib/webVitals', () => ({
  initWebVitals: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

describe('main.tsx startup validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render error screen when validation fails', async () => {
    const { validateEnv } = await import('./lib/validateEnv');
    const { createRoot } = await import('react-dom/client');

    // Mock validation failure
    vi.mocked(validateEnv).mockReturnValue({
      valid: false,
      missing: ['VITE_SUPABASE_URL'],
    } as ValidationResult);

    // Mock DOM element
    const mockRoot = document.createElement('div');
    mockRoot.id = 'root';
    document.body.appendChild(mockRoot);

    const mockRender = vi.fn();
    vi.mocked(createRoot).mockReturnValue({
      render: mockRender,
    } as any);

    // Import main (this executes the startup logic)
    await import('./main');

    // Verify createRoot was called
    expect(createRoot).toHaveBeenCalledWith(mockRoot);

    // Verify render was called (with error screen)
    expect(mockRender).toHaveBeenCalled();

    document.body.removeChild(mockRoot);
  });

  it('should render app normally when validation passes', async () => {
    const { validateEnv } = await import('./lib/validateEnv');
    const { createRoot } = await import('react-dom/client');
    const { initWebVitals } = await import('./lib/webVitals');

    // Mock validation success
    vi.mocked(validateEnv).mockReturnValue({
      valid: true,
      missing: [],
    } as ValidationResult);

    // Mock DOM element
    const mockRoot = document.createElement('div');
    mockRoot.id = 'root';
    document.body.appendChild(mockRoot);

    const mockRender = vi.fn();
    vi.mocked(createRoot).mockReturnValue({
      render: mockRender,
    } as any);

    // Import main (this executes the startup logic)
    await import('./main');

    // Verify webVitals was initialized
    expect(initWebVitals).toHaveBeenCalled();

    // Verify createRoot was called
    expect(createRoot).toHaveBeenCalledWith(mockRoot);

    // Verify render was called (with App)
    expect(mockRender).toHaveBeenCalled();

    document.body.removeChild(mockRoot);
  });
});
