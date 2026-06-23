import { describe, it, expect } from 'vitest';
import { renderWithProviders } from './render';
import { screen } from '@testing-library/react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

describe('renderWithProviders', () => {
  it('should render a simple component with all providers', () => {
    const TestComponent = () => <div>Test Component</div>;

    renderWithProviders(<TestComponent />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should provide QueryClient context', () => {
    const TestComponent = () => {
      const queryClient = useQueryClient();

      return <div>QueryClient provided: {queryClient ? 'Yes' : 'No'}</div>;
    };

    renderWithProviders(<TestComponent />);

    expect(screen.getByText('QueryClient provided: Yes')).toBeInTheDocument();
  });

  it('should provide Router context', () => {
    const TestComponent = () => {
      const navigate = useNavigate();

      return <div>Router provided: {navigate ? 'Yes' : 'No'}</div>;
    };

    renderWithProviders(<TestComponent />);

    expect(screen.getByText('Router provided: Yes')).toBeInTheDocument();
  });

  it('should provide AuthProvider context', () => {
    const TestComponent = () => {
      const auth = useAuth();

      return <div>Auth provided: {auth ? 'Yes' : 'No'}</div>;
    };

    renderWithProviders(<TestComponent />);

    expect(screen.getByText('Auth provided: Yes')).toBeInTheDocument();
  });

  it('should provide TenantProvider context', () => {
    const TestComponent = () => {
      const tenant = useTenant();

      return <div>Tenant provided: {tenant ? 'Yes' : 'No'}</div>;
    };

    renderWithProviders(<TestComponent />);

    expect(screen.getByText('Tenant provided: Yes')).toBeInTheDocument();
  });

  it('should allow rendering without errors', () => {
    const TestComponent = () => {
      return <div data-testid="test">Component with providers</div>;
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    expect(getByTestId('test')).toHaveTextContent('Component with providers');
  });
});
