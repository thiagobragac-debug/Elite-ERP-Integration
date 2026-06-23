import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SaaSSidebar } from './SaaSSidebar';
import { Header } from '../Layout/Header';
import { AlertTriangle } from 'lucide-react';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';
import '../Layout/Layout.css'; // Reuse layout styles for structure
import { useLiveSync } from '../../contexts/useLiveSync';
import { useSecurityEnforcer } from '../../hooks/useSecurityEnforcer';

interface SaaSLayoutProps {
  children: React.ReactNode;
}

export const SaaSLayout: React.FC<SaaSLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { settings } = useSystemSettings();
  useLiveSync();
  useSecurityEnforcer();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className={`layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <SaaSSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className="main-content">
        {settings.broadcast_active && settings.broadcast_message && (
          <div className="global-broadcast-banner" style={{ borderRadius: '12px', margin: '16px 24px 0 24px' }}>
            <div className="broadcast-content">
              <AlertTriangle size={16} className="animate-pulse" style={{ flexShrink: 0 }} />
              <span>{settings.broadcast_message}</span>
            </div>
          </div>
        )}
        <Header />
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
};
