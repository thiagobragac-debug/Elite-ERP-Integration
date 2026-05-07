import React from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from './Header';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
};
