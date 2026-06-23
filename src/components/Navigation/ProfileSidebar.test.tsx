import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileSidebar } from './ProfileSidebar';
import { hasOptedOut, optOutAnalytics, optInAnalytics } from '../../lib/analytics';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../../lib/analytics');
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com', role: 'admin', name: 'Test User' },
    logout: vi.fn(),
  }),
}));
vi.mock('../../contexts/TenantContext', () => ({
  useTenant: () => ({
    userProfile: {
      full_name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
    },
  }),
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

const renderProfileSidebar = (isOpen: boolean = true) => {
  const onClose = vi.fn();
  const result = render(
    <BrowserRouter>
      <ProfileSidebar isOpen={isOpen} onClose={onClose} />
    </BrowserRouter>
  );
  return { ...result, onClose };
};

describe('ProfileSidebar - Analytics Opt-Out', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should show analytics toggle with correct initial state (opted in)', () => {
    vi.mocked(hasOptedOut).mockReturnValue(false);
    
    renderProfileSidebar();

    expect(screen.getByText('Analytics & Telemetria')).toBeInTheDocument();
    expect(screen.getByText('Compartilhar dados de uso anônimos')).toBeInTheDocument();
  });

  it('should show analytics toggle with correct initial state (opted out)', () => {
    vi.mocked(hasOptedOut).mockReturnValue(true);
    
    renderProfileSidebar();

    expect(screen.getByText('Analytics & Telemetria')).toBeInTheDocument();
  });

  it('should call optOutAnalytics when user opts out', async () => {
    vi.mocked(hasOptedOut).mockReturnValue(false);
    
    renderProfileSidebar();

    // Find the analytics toggle button
    const toggleButtons = screen.getAllByRole('button');
    const analyticsToggle = toggleButtons.find(btn => 
      btn.getAttribute('title')?.includes('Analytics')
    );

    expect(analyticsToggle).toBeDefined();

    if (analyticsToggle) {
      fireEvent.click(analyticsToggle);

      await waitFor(() => {
        expect(optOutAnalytics).toHaveBeenCalled();
      });
    }
  });

  it('should call optInAnalytics when user opts back in', async () => {
    vi.mocked(hasOptedOut).mockReturnValue(true);
    
    renderProfileSidebar();

    const toggleButtons = screen.getAllByRole('button');
    const analyticsToggle = toggleButtons.find(btn => 
      btn.getAttribute('title')?.includes('Analytics')
    );

    expect(analyticsToggle).toBeDefined();

    if (analyticsToggle) {
      fireEvent.click(analyticsToggle);

      await waitFor(() => {
        expect(optInAnalytics).toHaveBeenCalled();
      });
    }
  });

  it('should update toggle state after clicking', async () => {
    vi.mocked(hasOptedOut).mockReturnValue(false);
    
    const { rerender } = renderProfileSidebar();

    const toggleButtons = screen.getAllByRole('button');
    const analyticsToggle = toggleButtons.find(btn => 
      btn.getAttribute('title')?.includes('Analytics')
    );

    if (analyticsToggle) {
      // Initially should be active (opted in)
      expect(analyticsToggle.className).toContain('active');

      // Click to opt out
      fireEvent.click(analyticsToggle);

      await waitFor(() => {
        expect(optOutAnalytics).toHaveBeenCalled();
      });
    }
  });

  it('should not render when isOpen is false', () => {
    renderProfileSidebar(false);

    expect(screen.queryByText('Meu Perfil')).not.toBeInTheDocument();
  });
});
