import type { ReportHandler } from '../../types/reports';
import * as bovinocultura from './bovinocultura';
import * as financeiro from './financeiro';
import * as logistica from './logistica';
import * as governanca from './governanca';
import * as comercial from './comercial';
import * as ia from './ia';
import * as panorama from './panorama';

export const handlers: Record<string, ReportHandler> = {
  // Panorama / Geral
  'panorama-overview': panorama.panoramaOverview,

  // Bovinocultura
  'performance-ponderal': bovinocultura.performancePonderal,
  'sanidade-animal': bovinocultura.sanidadeAnimal,
  pastagens: bovinocultura.pastagens,
  confinamento: bovinocultura.confinamento,
  reproducao: bovinocultura.reproducao,
  dietas: bovinocultura.dietas,
  animais: bovinocultura.animais,
  lotes: bovinocultura.lotes,
  pesagens: bovinocultura.pesagens,
  'livestock-overview': bovinocultura.dashboardOverview,

  // Financeiro - Diamond Precision 5.0
  'fluxo-caixa': financeiro.fluxoCaixa,
  'contas-pagar': financeiro.contasPagar,
  'contas-receber': financeiro.contasReceber,
  'extrato-bancario': financeiro.extratoBancario,
  'finance-overview': financeiro.financeOverview,

  // Logística/Suprimentos
  'consumo-frotas': logistica.consumoFrotas,
  'manutencoes-frota': logistica.manutencoesFrota,
  'suprimentos-inventario': logistica.suprimentosInventario,
  'pedidos-compra': logistica.pedidosCompra,

  // Governança
  'admin-overview': governanca.adminOverview,
  'audit-logs': governanca.auditLogs,
  'perfis-usuario': governanca.perfisUsuario,

  // Comercial
  'pedidos-venda': comercial.pedidosVenda,
  clientes: comercial.clientes,

  // IA
  'ia-monte-carlo': ia.monteCarlo,
  'ia-suporte-pasto': ia.suportePasto,

  // Aliases (IDs numéricos legados)
  '1': bovinocultura.performancePonderal,
  '2': bovinocultura.pastagens,
  '3': bovinocultura.animais,
  '4': bovinocultura.sanidadeAnimal,
  '5': bovinocultura.confinamento,
  '6': financeiro.fluxoCaixa,
  '7': financeiro.extratoBancario,
  '8': financeiro.contasPagar,
  '9': financeiro.contasReceber,
  '10': logistica.manutencoesFrota,
  '11': logistica.consumoFrotas,
  '12': logistica.manutencoesFrota,
  '13': logistica.suprimentosInventario,
  '14': logistica.pedidosCompra,
  '15': logistica.suprimentosInventario,
  '16': comercial.pedidosVenda,
  '17': comercial.pedidosVenda,
  '18': governanca.auditLogs,
  '19': governanca.perfisUsuario,
  '20': governanca.adminOverview,
  '21': ia.monteCarlo,
  '22': ia.suportePasto,
  '23': financeiro.fluxoCaixa,
  '24': bovinocultura.performancePonderal,
  '25': governanca.adminOverview,
  '26': governanca.perfisUsuario,
  '27': governanca.auditLogs,
  '28': financeiro.fluxoCaixa,
};
