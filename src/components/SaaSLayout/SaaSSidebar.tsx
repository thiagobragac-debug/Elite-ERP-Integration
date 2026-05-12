import React from 'react';
import { 
  Globe, 
  Users, 
  CreditCard, 
  Activity, 
  Database,
  ArrowLeft,
  Settings
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
  { title: 'Configurações', icon: Settings, href: '/saas/settings' },
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
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg, hsl(var(--brand)) 0%, hsl(var(--brand) / 0.7) 100%)', boxShadow: '0 0 20px hsl(var(--brand) / 0.3)' }}>
            <Database size={24} color="white" />
          </div>
          <span className="logo-text" style={{ color: 'white', fontWeight: 900, letterSpacing: '-0.02em' }}>Elite SaaS</span>
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
        <div className="farm-selector-wrapper" style={{ padding: '0 12px' }}>
          <Link 
            to="/"
            className="tenant-badge"
            style={{ 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px', 
              color: 'rgba(255, 255, 255, 0.7)',
              background: 'hsl(var(--bg-main) / 0.5)',
              padding: '12px',
              borderRadius: '14px',
              border: '1px solid hsl(var(--border))',
              fontSize: '12px',
              fontWeight: 800,
              transition: '0.2s',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--bg-card))';
              e.currentTarget.style.color = 'hsl(var(--brand))';
              e.currentTarget.style.borderColor = 'hsl(var(--brand) / 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'hsl(var(--bg-main) / 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <ArrowLeft size={16} />
            <span>SAIR DO ADMIN</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};
