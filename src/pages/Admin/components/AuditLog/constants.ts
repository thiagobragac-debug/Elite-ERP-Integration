/**
 * Constants and configuration for Audit Log components
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import {
  Beef,
  Scale,
  Package,
  CreditCard,
  DollarSign,
  FileText,
  Truck,
  Activity,
  CheckCircle2,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { ActionConfig } from './types';

export const MODULE_ICONS = {
  animais: Beef,
  pesagens: Scale,
  lotes: Package,
  contas_pagar: CreditCard,
  contas_receber: DollarSign,
  pedidos_venda: FileText,
  maquinas: Truck,
  sanidade: Activity,
  pastos: Package,
} as const;

export const MODULE_LABELS: Record<string, string> = {
  animais: 'Gestão de Animais',
  pesagens: 'Controle de Pesagem',
  lotes: 'Gestão de Lotes',
  contas_pagar: 'Contas a Pagar',
  contas_receber: 'Contas a Receber',
  pedidos_venda: 'Pedidos de Venda',
  maquinas: 'Frota & Máquinas',
  sanidade: 'Sanidade',
  pastos: 'Gestão de Pastos',
};

export const ACTION_CONFIG: Record<string, ActionConfig> = {
  INSERT: { label: 'Criado', color: '#10b981', Icon: CheckCircle2, severity: 'low' },
  UPDATE: { label: 'Editado', color: '#3b82f6', Icon: Edit3, severity: 'medium' },
  DELETE: { label: 'Excluído', color: '#ef4444', Icon: Trash2, severity: 'high' },
};

export const ENTITY_ROUTES: Record<string, string> = {
  animais: '/pecuaria/animal',
  pesagens: '/pecuaria/pesagem',
  lotes: '/pecuaria/lote',
  pastos: '/pecuaria/pasto',
  parceiros: '/vendas/parceiros',
  fornecedores: '/compras/fornecedores',
  contas_pagar: '/financeiro/pagar',
  contas_receber: '/financeiro/receber',
  maquinas: '/frota/maquina',
  sanidade: '/pecuaria/sanidade',
  pedidos_venda: '/vendas/pedido',
  pedidos_compra: '/compras/pedido',
  notas_saida: '/vendas/notas',
  notas_entrada: '/compras/nota',
  tenant_settings: '/admin/configuracoes',
};

export const FIELD_TRANSLATIONS: Record<string, string> = {
  nome: 'Nome / Razão Social',
  descricao: 'Descrição',
  valor_total: 'Valor Total',
  valor: 'Valor',
  status: 'Situação',
  data_vencimento: 'Vencimento',
  data_pagamento: 'Data de Pagamento',
  data: 'Data',
  categoria: 'Categoria',
  cnpj_cpf: 'CNPJ / CPF',
  cep: 'CEP',
  cidade: 'Cidade',
  estado: 'UF',
  bairro: 'Bairro',
  logradouro: 'Logradouro',
  numero: 'Número',
  complemento: 'Complemento',
  telefone: 'Telefone',
  email: 'E-mail',
  identificador: 'Identificador',
  brinco: 'Brinco',
  raca: 'Raça',
  sexo: 'Sexo',
  peso: 'Peso (kg)',
  peso_inicial: 'Peso Inicial (kg)',
  observacoes: 'Observações',
  metodo_pagamento: 'Forma de Pagamento',
  created_at: 'Criado em',
  updated_at: 'Atualizado em',
};
