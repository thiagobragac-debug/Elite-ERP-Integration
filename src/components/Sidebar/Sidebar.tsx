import React, { useState } from 'react';
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
  Server
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
  { title: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { 
    title: 'Administração', 
    icon: Settings,
    subItems: [
      { title: 'Usuários', href: '/admin/usuarios' },
      { title: 'Unidades', href: '/admin/config' },
      { title: 'Configurações', href: '/admin/configuracoes' },
      { title: 'Log de Auditoria', href: '/admin/auditoria' },
    ]
  },
  { 
    title: 'Pecuária', 
    icon: Activity,
    subItems: [
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
      { title: 'Máquina', href: '/frota/maquina' },
      { title: 'Abastecimento', href: '/frota/abastecimento' },
      { title: 'Manutenção', href: '/frota/manutencao' },
    ]
  },
  { 
    title: 'Compra & Cotação', 
    icon: ShoppingCart,
    subItems: [
      { title: 'Fornecedor', href: '/compras/fornecedores' },
      { title: 'Solicitação de Compra', href: '/compras/solicitacao' },
      { title: 'Mapa de Cotação', href: '/compras/cotacao' },
      { title: 'Pedido de Compra', href: '/compras/pedido' },
      { title: 'Nota Entrada', href: '/compras/nota' },
    ]
  },
  { 
    title: 'Venda & CRM', 
    icon: TrendingUp,
    subItems: [
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
      { title: 'Insumo', href: '/estoque/insumo' },
      { title: 'Movimentação', href: '/estoque/movimentacao' },
      { title: 'Inventário', href: '/estoque/inventario' },
    ]
  },
  { 
    title: 'Financeiro & Banco', 
    icon: Wallet,
    subItems: [
      { title: 'Conta Bancária', href: '/financeiro/contas' },
      { title: 'Conta a Pagar', href: '/financeiro/pagar' },
      { title: 'Conta a Receber', href: '/financeiro/receber' },
      { title: 'Conciliação Bancária', href: '/financeiro/conciliacao' },
    ]
  },
  { title: 'Relatórios & BI', icon: PieChart, href: '/relatorios' },
];

export const Sidebar: React.FC = () => {
  const [openMenus, setOpenMenus] = useState<string[]>(['Pecuária', 'Administração', 'Compra & Cotação', 'Financeiro & Banco']);
  const [isFarmSelectorOpen, setIsFarmSelectorOpen] = useState(false);
  const { activeFarm, farms, setActiveFarm } = useTenant();
  const location = useLocation();

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <Activity size={24} color="white" />
          </div>
          <span className="logo-text">Elite Pecuária</span>
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
            className={`tenant-badge ${isFarmSelectorOpen ? 'active' : ''}`}
            onClick={() => setIsFarmSelectorOpen(!isFarmSelectorOpen)}
          >
            <div className="tenant-dot"></div>
            <span>{activeFarm?.name || 'Selecionar Fazenda'}</span>
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
                  {farms.map(farm => (
                    <button 
                      key={farm.id}
                      className={`farm-option ${activeFarm?.id === farm.id ? 'active' : ''}`}
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
