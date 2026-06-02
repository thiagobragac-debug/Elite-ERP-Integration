import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Activity, 
  Truck, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Wallet,
  ChevronDown,
  ChevronRight,
  PieChart,
  Server,
  FileText,
  Globe,
  Building2,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import './Sidebar.css';

interface NavItem {
  title: string;
  icon: React.ElementType;
  href?: string;
  permission?: string;
  subItems?: { title: string; href: string; permission?: string }[];
}

const menuItems: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/painel' },
  { 
    title: 'Administração', 
    icon: Settings,
    permission: 'admin',
    subItems: [
      { title: 'Intelligence Hub', href: '/admin/intelligence' },
      { title: 'Aprovações', href: '/admin/aprovacoes' },
      { title: 'Usuário', href: '/admin/usuarios' },
      { title: 'Empresa / Fazenda', href: '/admin/config' },
      { title: 'Configurações', href: '/admin/configuracoes' },
      { title: 'Assinatura & Planos', href: '/admin/assinatura' },
      { title: 'Log de Auditoria', href: '/admin/auditoria' },
    ]
  },
  { 
    title: 'Mercado', 
    icon: Globe,
    permission: 'mercado',
    subItems: [
      { title: 'Intelligence Hub', href: '/mercado/indicadores' },
      { title: 'Análise Avançada', href: '/mercado/analise' },
      { title: 'Sazonalidade', href: '/mercado/sazonalidade' },
      { title: 'Calculadora B3', href: '/mercado/b3' }
    ]
  },
  { 
    title: 'Pecuária', 
    icon: Activity,
    permission: 'pecuaria',
    subItems: [
      { title: 'Intelligence Hub', href: '/pecuaria/dashboard', permission: 'pecuaria_dashboard' },
      { title: 'Animal', href: '/pecuaria/animal', permission: 'pecuaria_animais' },
      { title: 'Lote', href: '/pecuaria/lote', permission: 'pecuaria_animais' },
      { title: 'Pasto', href: '/pecuaria/pasto', permission: 'pecuaria_animais' },
      { title: 'Pesagem & GMD', href: '/pecuaria/pesagem', permission: 'pecuaria_animais' },
      { title: 'Confinamento', href: '/pecuaria/confinamento', permission: 'pecuaria_animais' },
      { title: 'Reprodução', href: '/pecuaria/reproducao', permission: 'pecuaria_saude' },
      { title: 'Nutrição', href: '/pecuaria/nutricao', permission: 'pecuaria_saude' },
      { title: 'Sanidade', href: '/pecuaria/sanidade', permission: 'pecuaria_saude' },
    ]
  },
  { 
    title: 'Máquina & Frota', 
    icon: Truck,
    permission: 'frota',
    subItems: [
      { title: 'Intelligence Hub', href: '/frota/dashboard' },
      { title: 'Máquina', href: '/frota/maquina' },
      { title: 'Abastecimento', href: '/frota/abastecimento', permission: 'frota_abastecimento' },
      { title: 'Manutenção', href: '/frota/manutencao', permission: 'frota_manutencao' },
    ]
  },
  { 
    title: 'Compra & Cotação', 
    icon: ShoppingCart,
    permission: 'compras',
    subItems: [
      { title: 'Intelligence Hub', href: '/compras/dashboard' },
      { title: 'Fornecedor', href: '/compras/fornecedores', permission: 'compras_fornecedores' },
      { title: 'Solicitação de Compra', href: '/compras/solicitacao', permission: 'compras_pedidos' },
      { title: 'Mapa de Cotação', href: '/compras/cotacao', permission: 'compras_pedidos' },
      { title: 'Pedido de Compra', href: '/compras/pedido', permission: 'compras_pedidos' },
      { title: 'Nota Fiscal de Entrada', href: '/compras/nota' },
    ]
  },
  { 
    title: 'Venda & CRM', 
    icon: TrendingUp,
    permission: 'comercial',
    subItems: [
      { title: 'Intelligence Hub', href: '/vendas/dashboard' },
      { title: 'Cliente (CRM)', href: '/vendas/parceiros', permission: 'comercial_clientes' },
      { title: 'Pedido de Venda', href: '/vendas/pedido', permission: 'comercial_pedidos' },
      { title: 'Contrato & Hedge', href: '/vendas/contrato', permission: 'comercial_pedidos' },
      { title: 'Nota Fiscal de Saída', href: '/vendas/notas' },
    ]
  },
  { 
    title: 'Estoque', 
    icon: Package, 
    permission: 'logistica',
    subItems: [
      { title: 'Intelligence Hub', href: '/estoque/dashboard' },
      { title: 'Insumo', href: '/estoque/insumo', permission: 'logistica_armazens' },
      { title: 'Depósito', href: '/estoque/deposito', permission: 'logistica_armazens' },
      { title: 'Movimentação', href: '/estoque/movimentacao' },
      { title: 'Inventário', href: '/estoque/inventario' },
    ]
  },
  { 
    title: 'Financeiro & Banco', 
    icon: Wallet,
    permission: 'financeiro',
    subItems: [
      { title: 'Intelligence Hub', href: '/financeiro/intelligence', permission: 'financeiro_dashboard' },
      { title: 'Fluxo de Caixa', href: '/financeiro/fluxo' },
      { title: 'Conta Bancária', href: '/financeiro/contas', permission: 'financeiro_bancos' },
      { title: 'Conta a Pagar', href: '/financeiro/pagar', permission: 'financeiro_operacoes' },
      { title: 'Conta a Receber', href: '/financeiro/receber', permission: 'financeiro_operacoes' },
      { title: 'Conciliação Bancária', href: '/financeiro/conciliacao', permission: 'financeiro_bancos' },
      { title: 'LCDPR', href: '/financeiro/lcdpr' },
    ]
  },
  { title: 'Relatórios', icon: FileText, href: '/relatorios' },
];

/** Maps URL prefix → sidebar module title */
const routeToModule: Record<string, string> = {
  '/admin':      'Administração',
  '/pecuaria':   'Pecuária',
  '/frota':      'Máquina & Frota',
  '/compras':    'Compra & Cotação',
  '/vendas':     'Venda & CRM',
  '/estoque':    'Estoque',
  '/financeiro': 'Financeiro & Banco',
};

/** Returns the module title that matches the current pathname, or empty string */
const getModuleFromPath = (pathname: string): string => {
  const match = Object.entries(routeToModule).find(([prefix]) =>
    pathname.startsWith(prefix)
  );
  return match ? match[1] : '';
};

export const Sidebar: React.FC<{ isCollapsed?: boolean; onToggleCollapse?: () => void }> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();

  // On first render, open only the module that matches the current URL.
  // This makes F5 / direct navigation behave correctly.
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const active = getModuleFromPath(location.pathname);
    return active ? [active] : [];
  });

  const [isFarmSelectorOpen, setIsFarmSelectorOpen] = useState(false);
  const { activeFarm, farms, setActiveFarm, isGlobalMode, setGlobalMode, userProfile, tenant, activeTenantId } = useTenant();
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    if (!activeTenantId) return;
    const fetchPending = async () => {
      const { count } = await supabase
        .from('approval_queue')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', activeTenantId)
        .eq('status', 'pending');
      
      setPendingApprovals(count || 0);
    };
    fetchPending();

    const subscription = supabase
      .channel('approval-queue-sidebar')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'approval_queue', 
        filter: `tenant_id=eq.${activeTenantId}` 
      }, fetchPending)
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [activeTenantId]);

  const auditEnabled = tenant?.settings?.security?.auditLogsEnabled ?? true;

  // Helper function to check if the user has a specific permission (or is ADMIN/Administrador)
  const checkPermission = (permission?: string): boolean => {
    if (!permission) return true;
    const role = userProfile?.role?.toUpperCase();
    if (role === 'ADMIN' || role === 'ADMINISTRADOR') return true;
    const perms = userProfile?.permissoes || userProfile?.permissions || [];
    return perms.includes('all') || perms.includes(permission);
  };

  // Dynamically compute the menu items the user has access to
  const filteredMenuItems = menuItems
    .filter(item => checkPermission(item.permission))
    .map(item => {
      if (!item.subItems) return item;
      return {
        ...item,
        subItems: item.subItems.filter(sub => {
          if (!checkPermission(sub.permission)) return false;
          if (sub.title === 'Log de Auditoria' && !auditEnabled) return false;
          return true;
        })
      };
    })
    .filter(item => !item.subItems || item.subItems.length > 0 || item.href);

  // When the user navigates to a new module section, automatically open it
  // (but don't close others — let the user manage that with clicks).
  useEffect(() => {
    const active = getModuleFromPath(location.pathname);
    if (active) {
      setOpenMenus(prev =>
        prev.includes(active) ? prev : [...prev, active]
      );
    }
  }, [location.pathname]);

  const isFleetRoute = location.pathname.startsWith('/frota');
  const isPurchasingRoute = location.pathname.startsWith('/compras');

  const toggleMenu = (title: string) => {
    setOpenMenus(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon" style={{ 
            background: isFleetRoute ? '#0f172a' : isPurchasingRoute ? '#4f46e5' : 'hsl(var(--brand))' 
          }}>
            {isFleetRoute ? <Truck size={24} color="white" /> : isPurchasingRoute ? <ShoppingCart size={24} color="white" /> : <Activity size={24} color="white" />}
          </div>
          <span className="logo-text">{isFleetRoute ? 'Tauze Frota' : isPurchasingRoute ? 'Tauze Compras' : 'Tauze Pecuária'}</span>
        </div>
        {onToggleCollapse && (
          <button className="sidebar-collapse-btn" onClick={onToggleCollapse}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
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
                  {openMenus.includes(item.title) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <AnimatePresence>
                  {openMenus.includes(item.title) && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="submenu"
                    >
                      {item.subItems.map((sub) => (
                        <Link 
                          key={sub.title} 
                          to={sub.href}
                          className={`submenu-item ${location.pathname === sub.href ? 'active' : ''}`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <span>{sub.title}</span>
                          {sub.title === 'Aprovações' && pendingApprovals > 0 && (
                            <span style={{ 
                              background: '#ef4444', 
                              color: 'white', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '9px', 
                              fontWeight: 800,
                              minWidth: '18px',
                              textAlign: 'center'
                            }}>
                              {pendingApprovals}
                            </span>
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link 
                to={item.href || '#'} 
                className={`menu-button standalone ${location.pathname === item.href ? 'active' : ''}`}
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
          <button 
            className={`tenant-badge ${isFarmSelectorOpen ? 'active' : ''} ${isGlobalMode ? 'global' : ''}`}
            onClick={() => setIsFarmSelectorOpen(!isFarmSelectorOpen)}
          >
            {isGlobalMode 
              ? <Globe size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
              : <div className="tenant-dot"></div>
            }
            <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isGlobalMode ? 'Visão Global' : (activeFarm?.name || 'Selecionar Fazenda')}
            </span>
            <ChevronDown size={14} className={`selector-arrow ${isFarmSelectorOpen ? 'up' : ''}`} />
          </button>

          <AnimatePresence>
            {isFarmSelectorOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="farm-dropdown"
              >
                <div className="dropdown-header">Mudar Unidade Ativa</div>
                <div className="farm-list">
                  {/* ── Global Mode Option ── */}
                  <button
                    className={`farm-option global-option ${isGlobalMode ? 'active' : ''}`}
                    onClick={() => {
                      setGlobalMode(true);
                      setIsFarmSelectorOpen(false);
                    }}
                  >
                    <Globe size={14} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>Visão Global</span>
                    <span style={{ fontSize: '9px', fontWeight: 800, opacity: 0.7, letterSpacing: '0.05em' }}>TODAS</span>
                  </button>

                  {/* ── Divider ── */}
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', padding: '4px 12px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={10} /> Unidades
                  </div>

                  {/* ── Individual Farms ── */}
                  {farms.map(farm => (
                    <button 
                      key={farm.id}
                      className={`farm-option ${!isGlobalMode && activeFarm?.id === farm.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveFarm(farm);
                        setIsFarmSelectorOpen(false);
                      }}
                    >
                      <div className="option-dot"></div>
                      <span>{farm.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
};
