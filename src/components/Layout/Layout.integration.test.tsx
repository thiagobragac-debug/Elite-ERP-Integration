/**
 * Integration test for Layout with OfflineSyncBanner
 * 
 * **Validates: Requirement 9.3**
 * - THE PWA SHALL display a banner showing "Você está offline" with the number of pending operations
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { OfflineSyncProvider } from '../../contexts/OfflineSyncContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { TenantProvider } from '../../contexts/TenantContext';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock child components that aren't critical for this test
vi.mock('../Sidebar/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('./Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('../Navigation/ProfileSidebar', () => ({
  ProfileSidebar: () => <div data-testid="profile-sidebar">ProfileSidebar</div>,
}));

vi.mock('../Billing/BillingBanner', () => ({
  BillingBanner: () => <div data-testid="billing-banner">BillingBanner</div>,
}));

vi.mock('../Copilot/GlobalCopilot', () => ({
  GlobalCopilot: () => <div data-testid="global-copilot">GlobalCopilot</div>,
}));

vi.mock('../../contexts/useLiveSync', () => ({
  useLiveSync: () => ({}),
}));

// Mock the OfflineSync context hook
vi.mock('../../contexts/OfflineSyncContext', async () => {
  const actual = await vi.importActual('../../contexts/OfflineSyncContext');
  return {
    ...actual,
    useOfflineSync: vi.fn(),
  };
});

const renderLayout = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <OfflineSyncProvider>
          <AuthProvider>
            <TenantProvider>
              <Layout />
            </TenantProvider>
          </AuthProvider>
        </OfflineSyncProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Layout with OfflineSyncBanner Integration', () => {
  it('should render the OfflineSyncBanner component in the layout', async () => {
    const { useOfflineSync } = await import('../../contexts/OfflineSyncContext');
    
    // Mock offline state with pending operations
    (useOfflineSync as any).mockReturnValue({
      isOnline: false,
      pendingCount: 3,
      queuedOperations: [],
      syncQueue: vi.fn(),
      retryOperation: vi.fn(),
      discardOperation: vi.fn(),
      clearQueue: vi.fn(),
    });

    renderLayout();

    // The banner should be present in the document
    // When offline, it shows the offline message
    expect(screen.getByText(/você está offline/i)).toBeInTheDocument();
    expect(screen.getByText(/3 operação/i)).toBeInTheDocument();
  });

  it('should not render banner when online with no pending operations', async () => {
    const { useOfflineSync } = await import('../../contexts/OfflineSyncContext');
    
    // Mock online state with no pending operations
    (useOfflineSync as any).mockReturnValue({
      isOnline: true,
      pendingCount: 0,
      queuedOperations: [],
      syncQueue: vi.fn(),
      retryOperation: vi.fn(),
      discardOperation: vi.fn(),
      clearQueue: vi.fn(),
    });

    renderLayout();

    // The banner should not be visible
    expect(screen.queryByText(/você está offline/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/você está online/i)).not.toBeInTheDocument();
  });

  it('should render banner when online with pending operations', async () => {
    const { useOfflineSync } = await import('../../contexts/OfflineSyncContext');
    
    // Mock online state with pending operations
    (useOfflineSync as any).mockReturnValue({
      isOnline: true,
      pendingCount: 5,
      queuedOperations: [],
      syncQueue: vi.fn(),
      retryOperation: vi.fn(),
      discardOperation: vi.fn(),
      clearQueue: vi.fn(),
    });

    renderLayout();

    // The banner should show online with pending operations
    expect(screen.getByText(/você está online/i)).toBeInTheDocument();
    expect(screen.getByText(/5 operação/i)).toBeInTheDocument();
    expect(screen.getByText(/sincronizar agora/i)).toBeInTheDocument();
  });

  it('should render all main layout components', () => {
    renderLayout();

    // Verify all main components are rendered
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('global-copilot')).toBeInTheDocument();
  });
});
