import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SaaSSidebar } from './SaaSSidebar';
import { Header } from '../Layout/Header';
import '../Layout/Layout.css'; // Reuse layout styles for structure
import { useLiveSync } from '../../contexts/useLiveSync';

interface SaaSLayoutProps {
  children: React.ReactNode;
}

export const SaaSLayout: React.FC<SaaSLayoutProps> = ({ children }) => {
  const location = useLocation();
  useLiveSync();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="layout">
      <SaaSSidebar />
      <main className="main-content">
        <Header />
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
};
