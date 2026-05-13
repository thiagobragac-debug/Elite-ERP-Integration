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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import './Sidebar.css';

interface NavItem {
  title: string;
  icon: React.ElementType;
  href?: string;
  subItems?: { title: string; href: string }[];
}

const menuItems: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { 
    title: 'Administração', 
    icon: Settings,
    subItems: [
      { title: 'Intelligence Hub', href: '/admin/intelligence' },
      { title: 'Usuário', href: '/admin/usuarios' },
      { title: 'Empresa / Fazenda', href: '/admin/config' },
      { title: 'Configurações', href: '/admin/configuracoes' },
      { title: 'Log de Auditoria', href: '/admin/auditoria' },
    ]
  },
  { 
    title: 'Pecuária', 
    icon: Activity,
    subItems: [
      { title: 'Intelligence Hub', href: '/pecuaria/dashboard' },
      { title: 'Animal', href: '/pecuaria/animal' },
      { title: 'Lote', href: '/pecuaria/lote' },
      { title: 'Pasto', href: '/pecuaria/pasto' },
      { title: 'Pesagem & GMD', href: '/pecuaria/pesagem' },
      { title: 'Confinamento', href: '/pecuaria/confinamento' },
      { title: 'Reprodução', href: '/pecuaria/reproducao' },
      { title: 'Nutrição', href: '/pecuaria/nutricao' },
      { title: 'Sanidade', href: '/pecuaria/sanidade' },
    ]
  },
  { 
    title: 'Máquina & Frota', 
    icon: Truck,
    subItems: [
      { title: 'Intelligence Hub', href: '/frota/dashboard' },
      { title: 'Máquina', href: '/frota/maquina' },
      { title: 'Abastecimento', href: '/frota/abastecimento' },
      { title: 'Manutenção', href: '/frota/manutencao' },
    ]
  },
  { 
    title: 'Compra & Cotação', 
    icon: ShoppingCart,
    subItems: [
      { title: 'Intelligence Hub', href: '/compras/dashboard' },
      { title: 'Fornecedor', href: '/compras/fornecedores' },
      { title: 'Solicitação de Compra', href: '/compras/solicitacao' },
      { title: 'Mapa de Cotação', href: '/compras/cotacao' },
      { title: 'Pedido de Compra', href: '/compras/pedido' },
      { title: 'Nota Fiscal de Entrada', href: '/compras/nota' },
    ]
  },
  { 
    title: 'Venda & CRM', 
    icon: TrendingUp,
    subItems: [
      { title: 'Intelligence Hub', href: '/vendas/dashboard' },
      { title: 'Cliente (CRM)', href: '/vendas/clientes' },
      { title: 'Pedido de Venda', href: '/vendas/pedido' },
      { title: 'Contrato & Hedge', href: '/vendas/contrato' },
      { title: 'Nota Fiscal de Saída', href: '/vendas/notas' },
    ]
  },
  { 
    title: 'Estoque', 
    icon: Package, 
    subItems: [
      { title: 'Intelligence Hub', href: '/estoque/dashboard' },
      { title: 'Insumo', href: '/estoque/insumo' },
      { title: 'Depósito', href: '/estoque/deposito' },
      { title: 'Movimentação', href: '/estoque/movimentacao' },
      { title: 'Inventário', href: '/estoque/inventario' },
    ]
  },
  { 
    title: 'Financeiro & Banco', 
    icon: Wallet,
    subItems: [
      { title: 'Intelligence Hub', href: '/financeiro/intelligence' },
      { title: 'Fluxo de Caixa', href: '/financeiro/fluxo' },
      { title: 'Conta Bancária', href: '/financeiro/contas' },
      { title: 'Conta a Pagar', href: '/financeiro/pagar' },
      { title: 'Conta a Receber', href: '/financeiro/receber' },
      { title: 'Conciliação Bancária', href: '/financeiro/conciliacao' },
    ]
  },
  { title: 'Relatórios', icon: FileText, href: '/relatorios' },
];

export const Sidebar: React.FC = () => {
  const [openMenus, setOpenMenus] = useState<string[]>(['Pecuária', 'Administração', 'Compra & Cotação', 'Financeiro & Banco']);
  const [isFarmSelectorOpen, setIsFarmSelectorOpen] = useState(false);
  const { activeFarm, farms, setActiveFarm, isGlobalMode, setGlobalMode } = useTenant();
  const location = useLocation();
  const isFleetRoute = location.pathname.startsWith('/frota');
  const isPurchasingRoute = location.pathname.startsWith('/compras');

  useEffect(() => {
    if (isFleetRoute) {
      setOpenMenus(prev => {
        const next = prev.filter(m => m !== 'Pecuária');
        if (!next.includes('Máquina & Frota')) {
          next.push('Máquina & Frota');
        }
        return next;
      });
    }
    if (isPurchasingRoute) {
      setOpenMenus(prev => {
        const next = prev.filter(m => m !== 'Pecuária');
        if (!next.includes('Compra & Cotação')) {
          next.push('Compra & Cotação');
        }
        return next;
      });
    }
  }, [isFleetRoute, isPurchasingRoute]);

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon" style={{ 
            background: isFleetRoute ? '#0f172a' : isPurchasingRoute ? '#4f46e5' : 'hsl(var(--brand))' 
          }}>
            <Zap size={20} color="white" />
          </div>
          <div className="logo-text-group">
            <span className="logo-text">{isFleetRoute ? 'Elite Frota' : isPurchasingRoute ? 'Elite Compras' : 'Elite Pecuária'}</span>
            <span className="logo-version">DIAMOND 5.0</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
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
                        >
                          {sub.title}
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
