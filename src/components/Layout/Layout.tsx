import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import { ProfileSidebar } from '../Navigation/ProfileSidebar';
import { BillingBanner } from '../Billing/BillingBanner';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Mock for governance logic
  const [isOverdue, setIsOverdue] = useState(false); // Mock for soft lock

  // Toggle Kiosk Mode with Alt+F
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
        
        {isKioskMode && (
          <button 
            className="kiosk-exit-btn" 
            onClick={() => setIsKioskMode(false)}
            title="Sair do Modo Kiosk (Alt+F)"
          >
            <Minimize2 size={20} />
          </button>
        )}

        <div className="page-container">
          {isOverdue && !isLocked && <BillingBanner status="warning" daysOverdue={3} />}
          {isLocked && <BillingBanner status="lock" />}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="page-transition-wrapper"
            >
              {children}
            </motion.div>
          </AnimatePresence>
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
