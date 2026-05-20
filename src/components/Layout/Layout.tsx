import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Outlet } from 'react-router-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import { ProfileSidebar } from '../Navigation/ProfileSidebar';
import { BillingBanner } from '../Billing/BillingBanner';
import './Layout.css';

export const Layout: React.FC = () => {
  const location = useLocation();
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOverdue] = useState(false); 
  const [isLocked] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'f') {
        setIsKioskMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`layout ${isKioskMode ? 'kiosk-mode' : ''}`}>
      <Sidebar />
      <main className="main-content">
        <Header onOpenProfile={() => setIsProfileOpen(true)} />
        
        <ProfileSidebar 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
        />
        
        <div className="page-container">
          {isOverdue && !isLocked && <BillingBanner status="warning" daysOverdue={3} />}
          {isLocked && <BillingBanner status="lock" />}
          
          <div className="page-transition-wrapper">
            <Outlet />
          </div>
        </div>
      </main>
      
      {!isKioskMode && (
        <button 
          className="glass-btn primary" 
          style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100, borderRadius: '50%', width: '44px', height: '44px', padding: 0, justifyContent: 'center' }}
          onClick={() => setIsKioskMode(true)}
          title="Ativar Modo Kiosk (Alt+F)"
        >
          <Maximize2 size={20} />
        </button>
      )}
    </div>
  );
};
