import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Users,
  CreditCard,
  Activity,
  Database,
  ArrowLeft,
  Settings,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../Sidebar/Sidebar.css'; // Reusing standard sidebar styles

interface NavItem {
  title: string;
  icon: React.ElementType;
  href?: string;
  subItems?: { title: string; href: string }[];
}

const saasMenuItems: NavItem[] = [
  {
    title: 'Painel',
    icon: Globe,
    subItems: [
      { title: 'Visão Global', href: '/saas' },
      { title: 'Analytics & BI', href: '/saas/analytics' },
      { title: 'Saúde do Sistema', href: '/saas/health' },
    ],
  },
  {
    title: 'CRM & Clientes',
    icon: Users,
    subItems: [
      { title: 'Leads de Vendas', href: '/saas/leads' },
      { title: 'Gestão de Tenants', href: '/saas/tenants' },
    ],
  },
  {
    title: 'Financeiro',
    icon: DollarSign,
    subItems: [
      { title: 'Monitor de Assinaturas', href: '/saas/billing' },
      { title: 'Planos & Faturamento', href: '/saas/plans' },
      { title: 'Catálogo de Add-ons', href: '/saas/addons' },
      { title: 'Campanhas & Promoções', href: '/saas/campaigns' },
    ],
  },
  {
    title: 'Configurações',
    icon: Settings,
    subItems: [
      { title: 'Identidade Visual', href: '/saas/branding' },
      { title: 'Tela de Login', href: '/saas/login-settings' },
      { title: 'Landing Page', href: '/saas/landing' },
      { title: 'Gateways de Pagamento', href: '/saas/settings' },
      { title: 'Comunicados Globais', href: '/saas/broadcast' },
    ],
  },
];

const routeToModule: Record<string, string> = {
  '/saas/analytics': 'Painel',
  '/saas/health': 'Painel',
  '/saas/leads': 'CRM & Clientes',
  '/saas/tenants': 'CRM & Clientes',
  '/saas/billing': 'Financeiro',
  '/saas/plans': 'Financeiro',
  '/saas/addons': 'Financeiro',
  '/saas/campaigns': 'Financeiro',
  '/saas/branding': 'Configurações',
  '/saas/login-settings': 'Configurações',
  '/saas/landing': 'Configurações',
  '/saas/settings': 'Configurações',
  '/saas/broadcast': 'Configurações',
};

const getModuleFromPath = (pathname: string): string => {
  if (pathname === '/saas' || pathname === '/saas/') return 'Painel';
  const match = Object.entries(routeToModule).find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : '';
};

interface SaaSSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const SaaSSidebar: React.FC<SaaSSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const active = getModuleFromPath(location.pathname);
    return active ? [active] : [];
  });

  const toggleMenu = useCallback((title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }, []);

  useEffect(() => {
    const active = getModuleFromPath(location.pathname);
    if (active) {
      setOpenMenus((prev) => (prev.includes(active) ? prev : [...prev, active]));
    }
  }, [location.pathname]);

  const isActive = (href: string) => {
    if (href === '/saas') {
      return location.pathname === '/saas' || location.pathname === '/saas/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div
            className="logo-icon"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--brand)) 0%, hsl(var(--brand) / 0.7) 100%)',
              boxShadow: '0 0 20px hsl(var(--brand) / 0.3)',
            }}
          >
            <Database size={24} color="white" />
          </div>
          <span className="system-name">
            Tauze SaaS
          </span>
        </div>
        {onToggleCollapse && (
          <button className="sidebar-collapse-btn" onClick={onToggleCollapse}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {saasMenuItems.map((item) => (
          <div key={item.title} className="menu-group">
            {item.subItems ? (
              <>
                <button
                  className={`menu-button ${openMenus.includes(item.title) ? 'open' : ''}`}
                  onClick={() => toggleMenu(item.title)}
                >
                  <div className="menu-button-content">
                    <item.icon size={20} className="menu-icon" />
                    <span>{item.title}</span>
                  </div>
                  {openMenus.includes(item.title) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                <AnimatePresence>
                  {openMenus.includes(item.title) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="submenu"
                      style={{ overflow: 'hidden' }}
                    >
                      {item.subItems.map((sub) => (
                        <Link
                          key={sub.title}
                          to={sub.href}
                          className={`submenu-item ${isActive(sub.href) ? 'active' : ''}`}
                        >
                          <span>{sub.title}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link
                to={item.href || '#'}
                className={`menu-button standalone ${isActive(item.href || '') ? 'active' : ''}`}
              >
                <div className="menu-button-content">
                  <item.icon size={20} className="menu-icon" />
                  <span>{item.title}</span>
                </div>
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="farm-selector-wrapper">
          <Link
            to="/"
            className="tenant-badge"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <ArrowLeft size={16} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span>SAIR DO ADMIN</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
};
