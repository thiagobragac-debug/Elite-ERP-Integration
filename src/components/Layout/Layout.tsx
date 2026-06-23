import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Outlet } from 'react-router-dom';
import { Maximize2, Minimize2, AlertTriangle } from 'lucide-react';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';
import { ProfileSidebar } from '../Navigation/ProfileSidebar';
import { BillingBanner } from '../Billing/BillingBanner';
import { GlobalCopilot } from '../Copilot/GlobalCopilot';
import { OfflineSyncBanner } from '../OfflineSync/OfflineSyncBanner';
import { usePageLoadTracking } from '../../hooks/usePageLoadTracking';
import { useTenantCore } from '../../contexts/TenantContext';
import './Layout.css';
import { useLiveSync } from '../../contexts/useLiveSync';

export const Layout: React.FC = () => {
  useLiveSync();
  usePageLoadTracking(); // Track page load performance for all routes
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { tenant, isTrialExpired, trialDaysLeft } = useTenantCore();
  const { settings } = useSystemSettings();

  // Compute billing status from real tenant data
  const { isOverdue, isLocked, daysOverdue } = useMemo(() => {
    if (!tenant) return { isOverdue: false, isLocked: false, daysOverdue: 0 };
    const status = tenant.status?.toLowerCase();
    if (status === 'suspenso' || status === 'bloqueado') {
      return { isOverdue: false, isLocked: true, daysOverdue: 0 };
    }
    if (tenant.plano_vencimento) {
      const vencimento = new Date(tenant.plano_vencimento);
      const hoje = new Date();
      const diffMs = hoje.getTime() - vencimento.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return { isOverdue: true, isLocked: false, daysOverdue: diffDays };
      }
    }
    return { isOverdue: false, isLocked: false, daysOverdue: 0 };
  }, [tenant]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'f') {
        setIsKioskMode((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsKioskMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`layout ${isKioskMode ? 'kiosk-mode' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <OfflineSyncBanner />
      
      <Sidebar
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
        <Header
          onOpenProfile={() => setIsProfileOpen(true)}
          onToggleKiosk={() => setIsKioskMode(true)}
          onOpenCommandPalette={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
        />

        <ProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

        <div className="page-container">
          {isOverdue && !isLocked && <BillingBanner status="warning" daysOverdue={daysOverdue} />}
          {isLocked && <BillingBanner status="lock" />}
          {(tenant?.plano as string)?.toLowerCase().includes('trial') && trialDaysLeft !== null && trialDaysLeft <= 3 && !isTrialExpired && (
            <div className="global-broadcast-banner" style={{ borderRadius: '12px', margin: '0 0 24px 0', background: 'linear-gradient(45deg, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.05))', border: '1px solid rgba(234, 179, 8, 0.2)', color: '#facc15' }}>
              <div className="broadcast-content" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Aviso Importante:</strong> Seu acesso VIP (Porteira Aberta) expira em <strong>{trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}</strong>. 
                  Não perca seus dados, faça o upgrade hoje mesmo!
                </span>
              </div>
            </div>
          )}

          <div className="page-transition-wrapper">
            <Outlet />
          </div>
        </div>
      </main>

      <GlobalCopilot />
    </div>
  );
};
