export interface SaasSubmodule {
  id: string; // e.g., 'bovinocultura_animais', or 'Bovinocultura:Animais'
  label: string;
}

export interface SaasModule {
  id: string; // e.g., 'Bovinocultura'
  label: string;
  submodules: SaasSubmodule[];
}

export const SAAS_MODULES: SaasModule[] = [
  {
    id: 'Dashboard',
    label: 'Dashboard Geral',
    submodules: [],
  },
  {
    id: 'Administração',
    label: 'Administração',
    submodules: [
      { id: 'Administração:Intelligence Hub', label: 'Intelligence Hub' },
      { id: 'Administração:Aprovações', label: 'Aprovações' },
      { id: 'Administração:Usuários', label: 'Usuários' },
      { id: 'Administração:Empresas & Fazendas', label: 'Empresas & Fazendas' },
      { id: 'Administração:Configurações', label: 'Configurações' },
      { id: 'Administração:Assinatura & Planos', label: 'Assinatura & Planos' },
      { id: 'Administração:Logs de Auditoria', label: 'Logs de Auditoria' },
    ],
  },
  {
    id: 'Mercado',
    label: 'Mercado',
    submodules: [
      { id: 'Mercado:Intelligence Hub', label: 'Intelligence Hub' },
      { id: 'Mercado:Análise Avançada', label: 'Análise Avançada' },
      { id: 'Mercado:Sazonalidade', label: 'Sazonalidade' },
      { id: 'Mercado:Calculadora B3', label: 'Calculadora B3' },
    ],
  },
  {
    id: 'Bovinocultura',
    label: 'Bovinocultura',
    submodules: [
      { id: 'Bovinocultura:Intelligence Hub', label: 'Intelligence Hub' },
      { id: 'Bovinocultura:Animais', label: 'Animais' },
      { id: 'Bovinocultura:Lotes', label: 'Lotes' },
      { id: 'Bovinocultura:Pastos', label: 'Pastos' },
      { id: 'Bovinocultura:Pesagens & GMD', label: 'Pesagens & GMD' },
      { id: 'Bovinocultura:Nutrição', label: 'Nutrição' },
      { id: 'Bovinocultura:Sanidade', label: 'Sanidade' },
      { id: 'Bovinocultura:Reprodução', label: 'Reprodução' },
      { id: 'Bovinocultura:Confinamento', label: 'Confinamento' },
      { id: 'Bovinocultura:Embarques & Romaneios', label: 'Embarques & Romaneios' },
    ],
  },
  {
    id: 'Máquina & Frota',
    label: 'Máquina & Frota',
    submodules: [
      { id: 'Máquina & Frota:Intelligence Hub', label: 'Intelligence Hub' },
      { id: 'Máquina & Frota:Máquinas & Equipamentos', label: 'Máquinas & Equipamentos' },
      { id: 'Máquina & Frota:Abastecimentos', label: 'Abastecimentos' },
      { id: 'Máquina & Frota:Manutenções', label: 'Manutenções' },
    ],
  },
  {
    id: 'Compra & Cotação',
    label: 'Compra & Cotação',
    submodules: [
      { id: 'Compra & Cotação:Intelligence Hub', label: 'Intelligence Hub' },
      { id: 'Compra & Cotação:Fornecedores', label: 'Fornecedores' },
      { id: 'Compra & Cotação:Solicitações de Compra', label: 'Solicitações de Compra' },
      { id: 'Compra & Cotação:Mapas de Cotação', label: 'Mapas de Cotação' },
      { id: 'Compra & Cotação:Pedidos de Compra', label: 'Pedidos de Compra' },
      { id: 'Compra & Cotação:Notas Fiscais de Entrada', label: 'Notas Fiscais de Entrada' },
    ],
  },
  {
    id: 'Venda & CRM',
    label: 'Venda & CRM',
    submodules: [
      { id: 'Venda & CRM:Intelligence Hub', label: 'Intelligence Hub' },
      { id: 'Venda & CRM:Clientes', label: 'Clientes' },
      { id: 'Venda & CRM:Pedidos de Venda', label: 'Pedidos de Venda' },
      { id: 'Venda & CRM:Contratos & Hedge', label: 'Contratos & Hedge' },
      { id: 'Venda & CRM:Notas Fiscais de Saída', label: 'Notas Fiscais de Saída' },
    ],
  },
  {
    id: 'Estoque',
    label: 'Estoque',
    submodules: [
      { id: 'Estoque:Intelligence Hub', label: 'Intelligence Hub' },
      { id: 'Estoque:Insumos e Serviços', label: 'Insumos e Serviços' },
      { id: 'Estoque:Depósitos', label: 'Depósitos' },
      { id: 'Estoque:Movimentações', label: 'Movimentações' },
      { id: 'Estoque:Inventário', label: 'Inventário' },
    ],
  },
  {
    id: 'Financeiro & Banco',
    label: 'Financeiro & Banco',
    submodules: [
      { id: 'Financeiro & Banco:Intelligence Hub', label: 'Intelligence Hub' },
      { id: 'Financeiro & Banco:Contas Bancárias', label: 'Contas Bancárias' },
      { id: 'Financeiro & Banco:Contas a Pagar', label: 'Contas a Pagar' },
      { id: 'Financeiro & Banco:Contas a Receber', label: 'Contas a Receber' },
      { id: 'Financeiro & Banco:Conciliação Bancária', label: 'Conciliação Bancária' },
    ],
  },
  {
    id: 'Relatórios',
    label: 'Relatórios',
    submodules: [],
  },
];
