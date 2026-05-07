import React from 'react';
import { 
  Globe, 
  Users, 
  CreditCard, 
  Activity, 
  Database,
  ArrowLeft
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../Sidebar/Sidebar.css'; // Reusing standard sidebar styles

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
}

const saasMenuItems: NavItem[] = [
  { title: 'Visão Global', icon: Globe, href: '/saas' },
  { title: 'Gestão de Tenants', icon: Users, href: '/saas/tenants' },
  { title: 'Planos & Faturamento', icon: CreditCard, href: '/saas/plans' },
  { title: 'Saúde do Sistema', icon: Activity, href: '/saas/health' },
];

export const SaaSSidebar: React.FC = () => {
  const location = useLocation();

  // Handle active state since /saas is prefix for others
  const isActive = (href: string) => {
    if (href === '/saas') {
      return location.pathname === '/saas' || location.pathname === '/saas/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            <Database size={24} color="#38bdf8" />
          </div>
          <span className="logo-text">Elite SaaS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {saasMenuItems.map((item) => (
          <div key={item.title} className="menu-group">
            <Link 
              to={item.href} 
              className={`menu-button standalone ${isActive(item.href) ? 'active' : ''}`}
            >
              <div className="menu-button-content">
                <item.icon size={20} className="menu-icon" />
                <span>{item.title}</span>
              </div>
            </Link>
          </div>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="farm-selector-wrapper">
          <Link 
            to="/"
            className="tenant-badge"
            style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', gap: '8px', color: '#94a3b8' }}
          >
            <ArrowLeft size={16} />
            <span>Voltar ao App</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};
