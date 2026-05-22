const fs = require('fs');

const menuItemsDefinition = 
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
;

const fileContent = fs.readFileSync('C:/Saas/src/components/Sidebar/Sidebar.tsx', 'utf-8');

// Replace the old menuItems array with the new one that has permissions
const withPermissions = fileContent.replace(/const menuItems: NavItem\[\] = \[[\s\S]*?\];/, menuItemsDefinition.trim());

// Insert the permissions logic into the Sidebar component
const withLogic = withPermissions.replace(
  'const { activeFarm, farms, setActiveFarm, isGlobalMode, setGlobalMode } = useTenant();',
  \const { activeFarm, farms, setActiveFarm, isGlobalMode, setGlobalMode, userProfile } = useTenant();

  const userPerms = userProfile?.permissoes || userProfile?.permissions || [];
  const isAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'Administrador' || userPerms.includes('all');

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (isAdmin) return true;
    
    // Check for exact permission or parent permission (e.g. 'pecuaria_dashboard' is allowed if 'pecuaria' is granted)
    const baseModule = permission.split('_')[0];
    
    return userPerms.includes(permission) || userPerms.includes(baseModule);
  };

  const filteredMenuItems = menuItems.map(item => {
    if (!hasPermission(item.permission)) return null;
    
    if (item.subItems) {
      const filteredSubItems = item.subItems.filter(sub => hasPermission(sub.permission));
      if (filteredSubItems.length === 0 && !item.href) return null;
      return { ...item, subItems: filteredSubItems };
    }
    return item;
  }).filter(Boolean) as NavItem[];\
);

// Update the render logic to use filteredMenuItems instead of menuItems
const finalContent = withLogic.replace(
  '{menuItems.map((item) => (',
  '{filteredMenuItems.map((item, index) => ('
).replace(
  '<div key={item.title}',
  '<div key={index}'
).replace(
  'interface NavItem {',
  'interface NavItem {\n  permission?: string;'
);

fs.writeFileSync('C:/Saas/src/components/Sidebar/Sidebar.tsx', finalContent);
console.log('Done!');
