const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/components/Sidebar/Sidebar.tsx', 'utf8');

// I will just use regex to replace everything from `const menuItems: NavItem[] = [` down to `];`
// Wait, `];` is at the end of the array.
// Let's replace the whole file from top to bottom since it's just the Sidebar.

// Let's write the new `menuItems` array WITH `permission` property and `useAuth` hook.
const newSidebar = `import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Activity, 
  Truck, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Wallet,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

interface NavItem {
  title: string;
  icon: React.ElementType;
  href?: string;
  permission?: string;
  subItems?: { title: string; href: string; permission?: string }[];
}

const menuItems: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { 
    title: 'Administração', 
    icon: Settings,
    permission: 'admin',
    subItems: [
      { title: 'Intelligence Hub', href: '/admin/intelligence' },
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
      { title: 'Fornecedor', href: '/compras/parceiroes', permission: 'compras_fornecedores' },
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

const routeToModule: Record<string, string> = {
  '/admin':      'Administração',
  '/pecuaria':   'Pecuária',
  '/frota':      'Máquina & Frota',
  '/compras':    'Compra & Cotação',
  '/vendas':     'Venda & CRM',
  '/estoque':    'Estoque',
  '/financeiro': 'Financeiro & Banco',
};

const getModuleFromPath = (pathname: string): string => {
  const match = Object.entries(routeToModule).find(([prefix]) =>
    pathname.startsWith(prefix)
  );
  return match ? match[1] : '';
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { userProfile } = useAuth();
  
  const userPerms = userProfile?.permissoes || userProfile?.permissions || [];
  const isAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'Administrador' || userPerms.includes('all');

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (isAdmin) return true;
    
    // Check for exact permission or parent permission (e.g. 'pecuaria_dashboard' is allowed if 'pecuaria' is granted)
    const baseModule = permission.split('_')[0];
    
    return userPerms.includes(permission) || userPerms.includes(baseModule);
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!hasPermission(item.permission)) return false;
    
    if (item.subItems) {
      item.subItems = item.subItems.filter(sub => hasPermission(sub.permission));
      // If a module has no subItems left and no main href, hide it
      if (item.subItems.length === 0 && !item.href) return false;
    }
    return true;
  });

  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const active = getModuleFromPath(location.pathname);
    return active ? [active] : [];
  });

  useEffect(() => {
    const active = getModuleFromPath(location.pathname);
    if (active) {
      setOpenMenus(prev => prev.includes(active) ? prev : [...prev, active]);
    }
  }, [location.pathname]);

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">T</div>
        <span>Tauze</span>
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item, index) => (
          <div key={index} className="nav-group">
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
                      {item.subItems.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.href}
                          className={`submenu-item ${location.pathname === subItem.href ? 'active' : ''}`}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link 
                to={item.href!}
                className={`menu-button ${location.pathname === item.href ? 'open active' : ''}`}
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
    </aside>
  );
};
`;

fs.writeFileSync('C:/Saas/src/components/Sidebar/Sidebar.tsx', newSidebar, 'utf8');