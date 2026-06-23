import React from 'react';
import { Route, Outlet } from 'react-router-dom';
import { LoadingSkeleton } from '../components/Feedback/LoadingSkeleton';
import { PermissionGuard } from '../components/Guards/PermissionGuard';
import { ModuleErrorBoundary } from '../components/Feedback/ModuleErrorBoundary';

const FinanceIntelligenceHub = React.lazy(() => import('../pages/Finance/FinanceIntelligenceHub').then((m) => ({ default: m.FinanceIntelligenceHub })));
const BankAccounts = React.lazy(() => import('../pages/Finance/BankAccounts').then((m) => ({ default: m.BankAccounts })));
const CashFlow = React.lazy(() => import('../pages/Finance/CashFlow').then((m) => ({ default: m.CashFlow })));
const AccountsPayable = React.lazy(() => import('../pages/Finance/AccountsPayable').then((m) => ({ default: m.AccountsPayable })));
const AccountsReceivable = React.lazy(() => import('../pages/Finance/AccountsReceivable').then((m) => ({ default: m.AccountsReceivable })));
const BankReconciliation = React.lazy(() => import('../pages/Finance/BankReconciliation').then((m) => ({ default: m.BankReconciliation })));
const LCDPRPage = React.lazy(() => import('../pages/Finance/LCDPR/LCDPRPage').then((m) => ({ default: m.LCDPRPage })));

const S = (msg: string, variant: 'card' | 'table' | 'form' | 'chart' = 'table') => (
  <LoadingSkeleton variant={variant} fullScreen={true} message={msg} />
);

export const financeiroRoutes = (
  <Route path="financeiro" element={<PermissionGuard permission="financeiro"><ModuleErrorBoundary moduleName="Financeiro"><Outlet /></ModuleErrorBoundary></PermissionGuard>}>
    <Route path="intelligence" element={<React.Suspense fallback={S('Carregando hub financeiro...', 'card')}><PermissionGuard permission="financeiro_dashboard"><FinanceIntelligenceHub /></PermissionGuard></React.Suspense>} />
    <Route path="contas" element={<PermissionGuard permission="financeiro_bancos"><React.Suspense fallback={S('Carregando contas bancárias...')}><BankAccounts /></React.Suspense></PermissionGuard>} />
    <Route path="fluxo" element={<React.Suspense fallback={S('Carregando fluxo de caixa...', 'chart')}><CashFlow /></React.Suspense>} />
    <Route path="pagar" element={<PermissionGuard permission="financeiro_operacoes"><React.Suspense fallback={S('Carregando contas a pagar...')}><AccountsPayable /></React.Suspense></PermissionGuard>} />
    <Route path="receber" element={<PermissionGuard permission="financeiro_operacoes"><React.Suspense fallback={S('Carregando contas a receber...')}><AccountsReceivable /></React.Suspense></PermissionGuard>} />
    <Route path="conciliacao" element={<PermissionGuard permission="financeiro_bancos"><React.Suspense fallback={S('Carregando conciliação bancária...')}><BankReconciliation /></React.Suspense></PermissionGuard>} />
    <Route path="lcdpr" element={<React.Suspense fallback={S('Carregando LCDPR...', 'form')}><LCDPRPage /></React.Suspense>} />
  </Route>
);
