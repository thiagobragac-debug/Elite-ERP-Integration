import type { ReportHandler } from '../../types/reports';
import * as pecuaria from './pecuaria';
import * as financeiro from './financeiro';
import * as logistica from './logistica';
import * as governanca from './governanca';
import * as comercial from './comercial';
import * as ia from './ia';
import * as panorama from './panorama';

export const handlers: Record<string, ReportHandler> = {
  // Panorama / Geral
  'panorama-overview': panorama.panoramaOverview,

  // Pecuária
  'performance-ponderal': pecuaria.performancePonderal,
  'sanidade-animal': pecuaria.sanidadeAnimal,
  'pastagens': pecuaria.pastagens,
  'confinamento': pecuaria.confinamento,
  'reproducao': pecuaria.reproducao,
  'dietas': pecuaria.dietas,
  'animais': pecuaria.animais,
  'lotes': pecuaria.lotes,
  'pesagens': pecuaria.pesagens,
  'livestock-overview': pecuaria.dashboardOverview,
  
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
  'clientes': comercial.clientes,
  
  // IA
  'ia-monte-carlo': ia.monteCarlo,
  'ia-suporte-pasto': ia.suportePasto,
  
  // Aliases (IDs numéricos legados)
  '1': pecuaria.performancePonderal,
  '2': pecuaria.sanidadeAnimal,
  '3': pecuaria.pastagens,
  '4': pecuaria.confinamento,
  '5': pecuaria.reproducao,
  '6': financeiro.fluxoCaixa,
  '8': financeiro.contasPagar,
  '10': financeiro.extratoBancario,
  '11': logistica.consumoFrotas,
  '12': logistica.manutencoesFrota,
  '14': logistica.suprimentosInventario,
  '15': logistica.pedidosCompra,
  '17': comercial.pedidosVenda,
  '20': comercial.clientes,
  '21': governanca.auditLogs,
  '22': governanca.perfisUsuario,
  '25': ia.monteCarlo,
  '27': ia.suportePasto,
};
