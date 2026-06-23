import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  DollarSign,
  Package,
  Activity,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  RefreshCw,
  Download,
  TrendingUp,
  LayoutGrid,
  Zap,
  Clock,
  Beef,
  Target,
  Monitor,
  Sparkles,
  X,
  Search,
  Settings,
  PieChart as PieChartIcon,
  FileText,
  Globe,
  Shield,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { TauzeMainChart } from '../../components/Charts/TauzeMainChart';
import { KPISkeleton, TableSkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { isValidUUID } from '../../utils/validation';
import { generateHistoricalSparkline } from '../../lib/tauze_historical_engine';
import { buildSparkline } from '../../utils/report-utils';

import './ExecutiveDashboard.css';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { usePersistentState } from '../../hooks/usePersistentState';



export const ExecutiveDashboard: React.FC = () => {
  const queryClient = useQueryClient();

  const { tenant, userProfile } = useTenant();
  const {
    activeFarm,
    isGlobalMode,
    activeFarmId,
    applyFarmFilter,
    applyTenantFilter,
    activeTenantId,
  } = useFarmFilter();

  const [isTVMode, setIsTVMode] = usePersistentState('ExecutiveDashboard_isTVMode', false);
  const [isCopilotOpen, setIsCopilotOpen] = usePersistentState(
    'ExecutiveDashboard_isCopilotOpen',
    false
  );
  const [copilotInput, setCopilotInput] = useState('');


  const [activeChartMetric, setActiveChartMetric] = useState<'gmd' | 'peso' | 'arroba'>('gmd');
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');
  const [targetValue, setTargetValue] = useState<number>(1.2);

  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const navigate = useNavigate();
  const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;

  const {
    data: dashboardData,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['executive_stats', activeTenantId, activeFarmId, isGlobalMode],
    queryFn: async () => {
      if (!isGlobalMode && !isValidUUID(activeFarmId)) {
        return {
          animalCount: 0,
          bankAccounts: [],
          stockData: [],
          pesagens: [],
          activities: [],
          eccData: [],
          gmd: 0,
          lotation: { area_total: 0, media_lotacao: 0, pastos_descanso: 0 },
          reprod: { eventos_total: 0, ias_mes: 0, taxa_sucesso: 0 },
          fleet: { total_litros: 0, total_custo: 0, media_litros: 0 },
          financePagar: [],
          financeReceber: [],
          sparkRebanho: [],
          sparkCaixa: [],
          sparkGmd: [],
          sparkLotacao: [],
          sparkEstoque: [],
        };
      }

      const queries = [
        applyFarmFilter(supabase.from('animais').select('*', { count: 'exact', head: true }))
          .then((r: any) => r)
          .catch((e: any) => ({ count: 0, data: null, error: e })),
        applyTenantFilter(supabase.from('contas_bancarias').select('saldo_atual'))
          .then((r: any) => r)
          .catch((e: any) => ({ data: [], error: e })),
        applyFarmFilter(supabase.from('produtos').select('estoque_atual, custo_medio'))
          .then((r: any) => r)
          .catch((e: any) => ({ data: [], error: e })),
        applyFarmFilter(
          supabase
            .from('pesagens')
            .select('peso, data_pesagem')
            .order('data_pesagem', { ascending: true })
            .limit(200)
        )
          .then((r: any) => r)
          .catch((e: any) => ({ data: [], error: e })),
        applyFarmFilter(
          supabase
            .from('pesagens')
            .select('created_at, observacao, animais(brinco)')
            .order('created_at', { ascending: false })
            .limit(20)
        )
          .then((r: any) => r)
          .catch((e: any) => ({ data: [], error: e })),
        applyFarmFilter(
          supabase.from('manejo_reproducao').select('ecc').not('ecc', 'is', null).limit(100)
        )
          .then((r: any) => r)
          .catch((e: any) => ({ data: [], error: e })),

        Promise.resolve(
          supabase.rpc('calculate_herd_gmd', {
            p_tenant_id: activeTenantId,
            p_fazenda_id: isGlobalMode ? null : activeFarmId,
          })
        )
          .then((r: any) => r)
          .catch((e: any) => ({ data: 0, error: e })),
        Promise.resolve(
          supabase.rpc('get_paddock_lotation_summary', {
            p_tenant_id: activeTenantId,
            p_fazenda_id: isGlobalMode ? null : activeFarmId,
          })
        )
          .then((r: any) => r)
          .catch((e: any) => ({ data: null, error: e })),
        Promise.resolve(
          supabase.rpc('get_reproductive_stats', {
            p_tenant_id: activeTenantId,
            p_fazenda_id: isGlobalMode ? null : activeFarmId,
          })
        )
          .then((r: any) => r)
          .catch((e: any) => ({ data: null, error: e })),
        Promise.resolve(
          supabase.rpc('calculate_fleet_consumption', {
            p_tenant_id: activeTenantId,
            p_fazenda_id: isGlobalMode ? null : activeFarmId,
          })
        )
          .then((r: any) => r)
          .catch((e: any) => ({ data: null, error: e })),
        Promise.resolve(
          supabase.rpc('get_finance_summary', {
            p_table_name: 'contas_pagar',
            p_tenant_id: activeTenantId,
            p_fazenda_id: isGlobalMode ? null : activeFarmId,
          })
        )
          .then((r: any) => r)
          .catch((e: any) => ({ data: [], error: e })),
        Promise.resolve(
          supabase.rpc('get_finance_summary', {
            p_table_name: 'contas_receber',
            p_tenant_id: activeTenantId,
            p_fazenda_id: isGlobalMode ? null : activeFarmId,
          })
        )
          .then((r: any) => r)
          .catch((e: any) => ({ data: [], error: e })),

        generateHistoricalSparkline(
          'rebanho',
          activeTenantId || '',
          isGlobalMode ? null : activeFarmId,
          365
        ),
        generateHistoricalSparkline(
          'caixa',
          activeTenantId || '',
          isGlobalMode ? null : activeFarmId,
          30
        ),
        generateHistoricalSparkline(
          'gmd',
          activeTenantId || '',
          isGlobalMode ? null : activeFarmId,
          30
        ),
        generateHistoricalSparkline(
          'lotacao',
          activeTenantId || '',
          isGlobalMode ? null : activeFarmId,
          30
        ),
        generateHistoricalSparkline(
          'estoque',
          activeTenantId || '',
          isGlobalMode ? null : activeFarmId,
          30
        ),
      ];

      const [
        animalRes,
        bankRes,
        stockRes,
        weightsRes,
        activitiesRes,
        eccRes,
        gmdRes,
        lotationRes,
        reprodRes,
        fleetRes,
        financePagarRes,
        financeReceberRes,
        sparkRebanho,
        sparkCaixa,
        sparkGmd,
        sparkLotacao,
        sparkEstoque,
      ]: any[] = await Promise.all(queries);

      return {
        animalCount: animalRes.count || 0,
        bankAccounts: bankRes.data || [],
        stockData: stockRes.data || [],
        pesagens: weightsRes.data || [],
        activities: activitiesRes.data || [],
        eccData: eccRes.data || [],
        gmd: gmdRes.data !== null ? Number(gmdRes.data) : 0,
        lotation: lotationRes.data || { area_total: 0, media_lotacao: 0, pastos_descanso: 0 },
        reprod: reprodRes.data || { eventos_total: 0, ias_mes: 0, taxa_sucesso: 0 },
        fleet: fleetRes.data || { total_litros: 0, total_custo: 0, media_litros: 0 },
        financePagar: financePagarRes.data || [],
        financeReceber: financeReceberRes.data || [],
        sparkRebanho,
        sparkCaixa,
        sparkGmd,
        sparkLotacao,
        sparkEstoque,
      };
    },
    enabled: isReady,
    staleTime: 5 * 60 * 1000,  // 5 minutos — evita re-fetch agressivo de 17 queries
    gcTime: 10 * 60 * 1000,    // 10 minutos em cache
    refetchOnWindowFocus: false, // Gerenciado manualmente pelo Storage listener
  });

  // Sync quando métricas do Studio são alteradas em outra aba
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tauze_selected_metrics') {
        refetch();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refetch]);

  const fetchExecutiveStats = () => {
    refetch();
  };

  // Extract structured derived variables from queries
  const animalCount = dashboardData?.animalCount || 0;
  const bankAccounts = dashboardData?.bankAccounts || [];
  const stockData = dashboardData?.stockData || [];
  const pesagens = dashboardData?.pesagens || [];
  const activities = dashboardData?.activities || [];
  const eccData = dashboardData?.eccData || [];
  const gmd = dashboardData?.gmd || 0;
  const lotation = dashboardData?.lotation || {
    area_total: 0,
    media_lotacao: 0,
    pastos_descanso: 0,
  };
  const reprod = dashboardData?.reprod || { eventos_total: 0, ias_mes: 0, taxa_sucesso: 0 };
  const fleet = dashboardData?.fleet || { total_litros: 0, total_custo: 0, media_litros: 0 };
  const financePagar = dashboardData?.financePagar || [];
  const financeReceber = dashboardData?.financeReceber || [];
  const sparkRebanho = dashboardData?.sparkRebanho || [];
  const sparkCaixa = dashboardData?.sparkCaixa || [];
  const sparkGmd = dashboardData?.sparkGmd || [];
  const sparkLotacao = dashboardData?.sparkLotacao || [];
  const sparkEstoque = dashboardData?.sparkEstoque || [];

  // Derivações memoizadas — evitam recalcular a cada render (hover, toggles, etc.)
  const totalCash = useMemo(
    () => bankAccounts?.reduce((acc: number, curr: any) => acc + Number(curr.saldo_atual), 0) ?? 0,
    [bankAccounts]
  );
  const totalStockValue = useMemo(
    () =>
      stockData?.reduce(
        (acc: number, curr: any) =>
          acc + Number(curr.estoque_atual || 0) * Number(curr.custo_medio || 0),
        0
      ) ?? 0,
    [stockData]
  );

  const gmdVal = gmd || 0;
  const gmdText = gmdVal > 0 ? `${gmdVal.toFixed(3)} kg` : '---';

  const targetWeight = 500; // kg — peso alvo de abate
  const latestWeights = useMemo(() => pesagens?.slice(-10) ?? [], [pesagens]);
  const avgWeight = useMemo(
    () =>
      latestWeights.length > 0
        ? latestWeights.reduce((acc: number, w: any) => acc + Number(w.peso), 0) /
          latestWeights.length
        : 0,
    [latestWeights]
  );

  let projAbateText = '---';
  if (avgWeight > 0 && gmdVal > 0 && avgWeight < targetWeight) {
    const daysToSlaughter = (targetWeight - avgWeight) / gmdVal;
    if (daysToSlaughter < 3650) {
      const projDate = new Date();
      projDate.setDate(projDate.getDate() + daysToSlaughter);
      projAbateText = projDate
        .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        .toUpperCase();
    }
  }

  let desvioMetaText = '---';
  if (gmdVal > 0) {
    const deviation = ((gmdVal - 1.0) / 1.0) * 100;
    desvioMetaText = `${(deviation > 0 ? '+' : '') + deviation.toFixed(1)}%`;
  } else {
    desvioMetaText = '0.0%';
  }

  let eccText = '---';
  if (eccData && eccData.length > 0) {
    const avgEcc =
      eccData.reduce((acc: any, row: any) => acc + Number(row.ecc), 0) / eccData.length;
    eccText = `${avgEcc.toFixed(2)} avg`;
  } else {
    eccText = '0.00 avg';
  }

  const strategicInsights = { projAbate: projAbateText, desvioMeta: desvioMetaText, ecc: eccText };

  const areaTotal = Number(lotation?.area_total || 0);
  const lotacaoVal = areaTotal > 0 ? animalCount / areaTotal : 0;
  const lotacaoText = lotacaoVal > 0 ? `${lotacaoVal.toFixed(2)} UA/ha` : '---';

  const paidReceber = financeReceber?.find((x: any) => x.status === 'PAGO')?.total_value || 0;
  const paidPagar = financePagar?.find((x: any) => x.status === 'PAGO')?.total_value || 0;
  const fluxoCaixaVal = totalCash > 0 ? totalCash : Number(paidReceber) - Number(paidPagar);

  const totalReceber =
    financeReceber?.reduce((acc: number, x: any) => acc + Number(x.total_value || 0), 0) || 0;
  const totalPagar =
    financePagar?.reduce((acc: number, x: any) => acc + Number(x.total_value || 0), 0) || 0;
  const ebitdaVal = totalReceber > 0 ? ((totalReceber - totalPagar) / totalReceber) * 100 : 0;
  const ebitdaText = totalReceber > 0 || totalPagar > 0 ? `${ebitdaVal.toFixed(1)}%` : '---';

  const dieselVal = Number(fleet?.media_litros || 0);
  const dieselText = dieselVal > 0 ? `${dieselVal.toFixed(1)} L/h` : '---';

  const prenhezVal = Number(reprod?.taxa_sucesso || 0);
  const prenhezText = Number(reprod?.eventos_total) > 0 ? `${prenhezVal.toFixed(1)}%` : '---';

  const allStats = [
    {
      id: 'rebanho',
      label: 'Total de Rebanho',
      value: animalCount > 0 ? animalCount.toLocaleString() : '---',
      icon: Beef,
      color: '#f97316',
      progress: animalCount > 0 ? 100 : 0,
      trend: animalCount > 0 ? 'up' : 'none',
      change: animalCount > 0 ? 'Rebanho cadastrado' : 'Sem animais',
      periodLabel: 'Todo o Período',
      sparkline: sparkRebanho,
    },
    {
      id: 'gmd',
      label: 'Evolução de GMD',
      value: gmdText,
      icon: Activity,
      color: '#10b981',
      progress: Math.min(Math.round(gmdVal * 100), 100) || 0,
      trend: gmdVal > 0 ? (gmdVal >= 0.8 ? 'up' : 'down') : 'none',
      change: gmdVal > 0 ? 'Calculado de pesagens' : 'Sem pesagens registradas',
      periodLabel: 'Evolução 30d',
      sparkline: sparkGmd.length > 0 ? sparkGmd : [],
    },
    {
      id: 'lotacao',
      label: 'Taxa de Lotação',
      value: lotacaoText,
      icon: PieChart,
      color: '#3b82f6',
      progress: Math.min(Math.round(lotacaoVal * 50), 100) || 0,
      trend: lotacaoVal > 0 ? (lotacaoVal >= 1.5 ? 'up' : 'down') : 'none',
      change: lotacaoVal > 0 ? 'Pressão de pastejo' : 'Sem dados de pasto',
      periodLabel: 'Evolução 30d',
      sparkline: sparkLotacao.length > 0 ? sparkLotacao : [],
    },
    {
      id: 'caixa',
      label: 'Fluxo de Caixa',
      value: fluxoCaixaVal !== 0 ? `R$ ${(fluxoCaixaVal / 1000).toFixed(1)}k` : '---',
      icon: DollarSign,
      color: '#f59e0b',
      progress:
        fluxoCaixaVal > 0
          ? Math.min(100, Math.round((fluxoCaixaVal / Math.max(fluxoCaixaVal, 1)) * 100))
          : 0,
      trend: fluxoCaixaVal > 0 ? 'up' : fluxoCaixaVal < 0 ? 'down' : 'none',
      change: fluxoCaixaVal !== 0 ? 'Saldo bancário consolidado' : 'Sem dados bancários',
      periodLabel: 'Evolução 30d',
      sparkline: sparkCaixa.length > 0 ? sparkCaixa : [],
    },
    {
      id: 'estoque',
      label: 'Valor de Estoque',
      value: totalStockValue > 0 ? `R$ ${(totalStockValue / 1000).toFixed(1)}k` : '---',
      icon: Package,
      color: '#6366f1',
      progress: totalStockValue > 0 ? 100 : 0,
      trend: totalStockValue > 0 ? 'up' : 'none',
      change: totalStockValue > 0 ? 'Custo médio × estoque' : 'Sem produtos em estoque',
      periodLabel: 'Evolução 30d',
      sparkline: sparkEstoque.length > 0 ? sparkEstoque : [],
    },
    {
      id: 'ebitda',
      label: 'EBITDA Projetado',
      value: ebitdaText,
      icon: TrendingUp,
      color: '#8b5cf6',
      progress: ebitdaVal > 0 ? Math.min(Math.round(ebitdaVal), 100) : 0,
      trend: ebitdaVal > 0 ? (ebitdaVal >= 20 ? 'up' : 'down') : 'none',
      change: ebitdaVal !== 0 ? 'Receitas menos despesas' : 'Sem dados financeiros',
      periodLabel: 'Projeção Anual',
      sparkline: buildSparkline(
        [...(financeReceber || []), ...(financePagar || [])],
        'data_vencimento',
        'total_value'
      ),
    },
    {
      id: 'diesel',
      label: 'Eficiência Diesel',
      value: dieselText,
      icon: Activity,
      color: '#ef4444',
      progress: dieselVal > 0 ? Math.min(Math.round((dieselVal / 20) * 100), 100) : 0,
      trend: dieselVal > 0 ? (dieselVal <= 14 ? 'up' : 'down') : 'none',
      change: dieselVal > 0 ? 'Média de abastecimentos' : 'Sem abastecimentos',
      periodLabel: 'Consumo Médio',
      sparkline: buildSparkline(pesagens || [], 'data_pesagem', 'peso'),
    },
    {
      id: 'mortalidade',
      label: 'Taxa Mortalidade',
      value: '---',
      icon: AlertCircle,
      color: '#ef4444',
      progress: 0,
      trend: 'none',
      change: 'Disponível em breve',
      periodLabel: 'Sanidade',
      sparkline: [],
    },
    {
      id: 'arroba_custo',
      label: 'Custo p/ @ Produzida',
      value: '---',
      icon: DollarSign,
      color: '#16a34a',
      progress: 0,
      trend: 'none',
      change: 'Disponível em breve',
      periodLabel: 'Financeiro',
      sparkline: [],
    },
    {
      id: 'prenhez',
      label: 'Taxa de Prenhez',
      value: prenhezText,
      icon: Activity,
      color: '#db2777',
      progress: prenhezVal > 0 ? Math.round(prenhezVal) : 0,
      trend: prenhezVal > 0 ? (prenhezVal >= 80 ? 'up' : 'down') : 'none',
      change:
        Number(reprod?.eventos_total) > 0 ? 'Calculado de eventos' : 'Sem eventos reprodutivos',
      periodLabel: 'Reprodução',
      sparkline: buildSparkline(pesagens || [], 'data_pesagem', null),
    },
    {
      id: 'ims',
      label: 'Ingestão Mat. Seca',
      value: '---',
      icon: Activity,
      color: '#ea580c',
      progress: 0,
      trend: 'none',
      change: '---',
      periodLabel: 'Nutrição',
      sparkline: [],
    },
    {
      id: 'cocho',
      label: 'Disp. de Cocho',
      value: '---',
      icon: LayoutGrid,
      color: '#0891b2',
      progress: 0,
      trend: 'none',
      change: '---',
      periodLabel: 'Logística',
      sparkline: [],
    },
    {
      id: 'conversao_alim',
      label: 'Conversão Alimentar',
      value: '---',
      icon: Activity,
      color: '#10b981',
      progress: 0,
      trend: 'none',
      change: '---',
      periodLabel: 'Nutrição',
      sparkline: [],
    },
    {
      id: 'produtividade_ha',
      label: 'Produtividade (@/ha)',
      value: '---',
      icon: TrendingUp,
      color: '#16a34a',
      progress: 0,
      trend: 'none',
      change: '---',
      periodLabel: 'Performance',
      sparkline: [],
    },
    {
      id: 'ciclo_engorda',
      label: 'Ciclo de Engorda',
      value: '---',
      icon: Clock,
      color: '#3b82f6',
      progress: 0,
      trend: 'none',
      change: '---',
      periodLabel: 'Pecuária',
      sparkline: [],
    },
    {
      id: 'saving_compras',
      label: 'Saving de Compras',
      value: '---',
      icon: DollarSign,
      color: '#10b981',
      progress: 0,
      trend: 'none',
      change: '---',
      periodLabel: 'Suprimentos',
      sparkline: [],
    },
    {
      id: 'lead_time',
      label: 'Lead Time Médio',
      value: '---',
      icon: Clock,
      color: '#f59e0b',
      progress: 0,
      trend: 'none',
      change: '---',
      periodLabel: 'Suprimentos',
      sparkline: [],
    },
    {
      id: 'acuracidade_est',
      label: 'Acuracidade Estoque',
      value: '---',
      icon: Settings,
      color: '#10b981',
      progress: 0,
      trend: 'none',
      change: '---',
      periodLabel: 'Estoque',
      sparkline: [],
    },
    {
      id: 'ruptura_est',
      label: 'Índice de Ruptura',
      value: '---',
      icon: AlertCircle,
      color: '#ef4444',
      progress: 0,
      trend: 'none',
      change: '---',
      periodLabel: 'Estoque',
      sparkline: [],
    },
    {
      id: 'manutencao_hora',
      label: 'Custo Manutenção/h',
      icon: Settings,
      color: '#3b82f6',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Frota',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'disponibilidade_frota',
      label: 'Disp. de Frota',
      icon: Monitor,
      color: '#10b981',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Frota',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'margem_contribuicao',
      label: 'Margem Contrib.',
      icon: TrendingUp,
      color: '#8b5cf6',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Financeiro',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'break_even',
      label: 'Break-even (@)',
      icon: Target,
      color: '#16a34a',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Financeiro',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'ticket_venda',
      label: 'Ticket Médio Venda',
      icon: DollarSign,
      color: '#f59e0b',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Vendas',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'ebitda_operacional',
      label: 'EBITDA Operacional',
      icon: Zap,
      color: '#8b5cf6',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Financeiro',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'burn_rate',
      label: 'Burn Rate / Runway',
      icon: Activity,
      color: '#f59e0b',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Estratégico',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'ponto_equilibrio',
      label: 'Ponto de Equilíbrio',
      icon: Target,
      color: '#3b82f6',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Financeiro',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'checklist_logistico',
      label: 'Checklist Logístico',
      icon: Check,
      color: '#10b981',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Logística',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'divergencia_log',
      label: 'Divergência de Frete',
      icon: AlertCircle,
      color: '#ef4444',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Logística',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'carbono_estoque',
      label: 'Estoque de Carbono',
      icon: Globe,
      color: '#059669',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'ESG',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'compliance_amb',
      label: 'Compliance Amb.',
      icon: Shield,
      color: '#10b981',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'ESG',
      progress: 0,
      sparkline: [],
    },
    {
      id: 'preco_arroba',
      label: 'Cotação da @ (B3)',
      icon: TrendingUp,
      color: '#8b5cf6',
      value: '---',
      trend: 'none',
      change: '---',
      periodLabel: 'Mercado',
      progress: 0,
      sparkline: [],
    },
  ];

  const savedLocal = localStorage.getItem('tauze_selected_metrics');
  let selectedIds: string[] = (userProfile?.settings?.selected_metrics ||
    tenant?.settings?.selected_metrics) as string[] | undefined ?? [];

  if (savedLocal) {
    try {
      selectedIds = JSON.parse(savedLocal);
    } catch (e) {
      console.error('Erro ao ler métricas do localStorage', e);
    }
  }

  if (!selectedIds || selectedIds.length === 0) {
    selectedIds = ['gmd', 'lotacao', 'caixa', 'estoque'];
  }

  const accessibleStats = React.useMemo(() => {
    const planModules = tenant?.plan_details?.modules || [];
    const hasPlanRestriction = tenant && tenant.plano !== 'BETA_FREE' && planModules.length > 0;

    const kpiToModuleMap: Record<string, string[]> = {
      'caixa': ['Financeiro & Banco'],
      'ebitda': ['Financeiro & Banco'],
      'receitas': ['Financeiro & Banco'],
      'inadimplencia': ['Financeiro & Banco'],
      'despesas': ['Financeiro & Banco'],
      'margem': ['Financeiro & Banco'],
      'saving_compras': ['Compra & Cotação', 'Estoque'],
      'lead_time': ['Compra & Cotação', 'Estoque'],
      'acuracidade_est': ['Estoque'],
      'ruptura_est': ['Estoque'],
      'estoque': ['Estoque', 'Compra & Cotação'],
      'rebanho': ['Pecuária'],
      'gmd': ['Pecuária'],
      'lotacao': ['Pecuária'],
      'prenhez': ['Pecuária'],
      'ims': ['Pecuária'],
      'conversao_alim': ['Pecuária'],
      'produtividade_ha': ['Pecuária'],
      'ciclo_engorda': ['Pecuária'],
      'taxa_mortalidade': ['Pecuária'],
      'custo_arroba': ['Pecuária', 'Financeiro & Banco'],
      'diesel': ['Máquina & Frota'],
      'manutencao_hora': ['Máquina & Frota'],
      'disponibilidade_frota': ['Máquina & Frota'],
      'mtbf': ['Máquina & Frota'],
      'cocho': ['Pecuária', 'Máquina & Frota'],
      'preco_arroba': ['Mercado'],
      'carbono': ['Administração'],
      'compliance': ['Administração'],
      'seguranca_trab': ['Administração'],
    };

    return allStats.filter((stat) => {
      if (!hasPlanRestriction) return true;
      const requiredModules = kpiToModuleMap[stat.id] || [];
      if (requiredModules.length === 0) return true;
      return requiredModules.some((mod) => planModules.includes(mod));
    });
  }, [allStats, tenant]);

  const kpiData = selectedIds
    .map((id: string) => accessibleStats.find((s) => s.id === id))
    .filter(Boolean);

  let chartData: any[] = [];
  if (pesagens && pesagens.length > 0) {
    const sorted = [...pesagens].sort(
      (a: any, b: any) => new Date(a.data_pesagem).getTime() - new Date(b.data_pesagem).getTime()
    );
    chartData = Array.from({ length: 7 }, (_, i) => {
      const idx = Math.floor((i / 7) * sorted.length);
      const w = sorted[idx];
      const weekLabel = `Sem ${String(i + 1).padStart(2, '0')}`;
      return {
        label: weekLabel,
        peso: Number(w?.peso || 0),
        gmd:
          Number(w?.gmd_periodo || 0) ||
          (i > 0 && sorted[idx - 1]
            ? Math.max(0, (Number(w?.peso) - Number(sorted[idx > 0 ? idx - 1 : 0]?.peso)) / 7)
            : 0),
        arroba: Number(w?.peso || 0) / 15,
      };
    });
  } else {
    chartData = Array.from({ length: 7 }, (_, i) => ({
      label: `Sem ${String(i + 1).padStart(2, '0')}`,
      peso: 0,
      gmd: 0,
      arroba: 0,
    }));
  }

  const recentActivities = activities || [];

  useEffect(() => {
    if (isTVMode) {
      document.body.classList.add('tv-mode-active');
    } else {
      document.body.classList.remove('tv-mode-active');
    }
    return () => document.body.classList.remove('tv-mode-active');
  }, [isTVMode]);

  useEffect(() => {
    let interval: any;
    if (isTVMode) {
      interval = setInterval(() => {
        setActiveChartMetric((prev) => {
          if (prev === 'gmd') {
            return 'peso';
          }
          if (prev === 'peso') {
            return 'arroba';
          }
          return 'gmd';
        });
      }, 15000); // 15 seconds per metric
    }
    return () => clearInterval(interval);
  }, [isTVMode]);

  // Sincronização em tempo real com o Canvas Studio
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tauze_selected_metrics') {
        console.log('[Dashboard] Mudança detectada no Canvas. Atualizando...');
        fetchExecutiveStats();
      }
    };

    const handleFocus = () => {
      console.log('[Dashboard] Janela focada. Verificando atualizações...');
      fetchExecutiveStats();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTenantId, activeFarmId]);

  useEffect(() => {
    calculateDynamicTarget();
  }, [activeChartMetric, tenant?.settings?.metric_targets, userProfile?.settings?.metric_targets]);

  const calculateDynamicTarget = () => {
    // Prioritize Personal Profile Settings over Global Tenant Settings
    const targets = (userProfile?.settings?.metric_targets ||
      tenant?.settings?.metric_targets) as Record<string, { mode: string; manualValue: number }> | undefined;
    const personalConfig = targets?.[activeChartMetric];
    const globalConfig = targets?.[activeChartMetric];

    const config = personalConfig || globalConfig || { mode: 'auto', manualValue: 1.2 };

    if (config.mode === 'manual') {
      setTargetValue(config.manualValue);
    } else {
      // IA Logic: Average + 15%
      // In a real scenario, this would come from a complex aggregation
      // For now, let's base it on the active metric defaults
      const baseValues = { gmd: 0.85, peso: 450, arroba: 18 };
      const base = baseValues[activeChartMetric] || 1;
      setTargetValue(base * 1.15);
    }
  };

  const getTargetY = () => {
    // Basic mapping for SVG height (300px)
    if (activeChartMetric === 'gmd') {
      return 300 - targetValue * 200;
    } // 1kg ~ 100px from bottom
    if (activeChartMetric === 'peso') {
      return 300 - targetValue * 0.4;
    } // 500kg ~ 100px from bottom
    return 300 - targetValue * 10; // 20@ ~ 100px from bottom
  };

  return (
    <div className={`executive-page animate-slide-up ${isTVMode ? 'tv-mode' : ''}`}>
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Dashboard', href: '/painel' },
              { label: isGlobalMode ? 'Centro de Comando Global' : 'Centro de Comando' },
            ]}
          />
          <h1 className="page-title">
            {isGlobalMode ? 'Centro de Comando Global' : 'Centro de Comando'}
          </h1>
          <p className="page-subtitle">
            Visão analítica consolidada do patrimônio e performance produtiva.{' '}
            <span style={{ color: 'var(--brand)', fontWeight: 800 }}>(SISTEMA ATIVO)</span>
          </p>
        </div>
        <div className="page-actions">
          <div className="status-sync">
            <div className="sync-dot active" />
            <span>LIVE SYNC ACTIVE</span>
          </div>
          <button
            className={`glass-btn ${isTVMode ? 'active' : ''}`}
            onClick={() => setIsTVMode(!isTVMode)}
          >
            <Monitor size={18} />
            {isTVMode ? 'SAIR MODO TV' : 'MODO TV'}
          </button>
          <button className="glass-btn secondary" onClick={fetchExecutiveStats} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'SINCRONIZANDO...' : 'SINC. DADOS'}
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : kpiData.map((kpi: any, idx: number) => (
              <TauzeStatCard
                key={kpi.id || idx}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
                change={kpi.change}
                trend={kpi.trend}
                progress={kpi.progress}
                sparkline={kpi.sparkline}
                periodLabel="Mês Atual"
              />
            ))}
      </div>

      <div className="dashboard-grid-layout">
        <div className="analytics-canvas animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="intelligence-layout">
            <div className="intelligence-main">
              <div className="panel-header">
                <div className="title-group">
                  <h3 style={{ whiteSpace: 'nowrap' }}>Performance do Rebanho</h3>
                </div>
                <div className="chart-controls">
                  <div className="v-separator" />
                  <button
                    className={`chart-btn ${activeChartMetric === 'gmd' ? 'active' : ''}`}
                    onClick={() => setActiveChartMetric('gmd')}
                  >
                    GMD
                  </button>
                  <button
                    className={`chart-btn ${activeChartMetric === 'peso' ? 'active' : ''}`}
                    onClick={() => setActiveChartMetric('peso')}
                  >
                    PESO
                  </button>
                  <button
                    className={`chart-btn ${activeChartMetric === 'arroba' ? 'active' : ''}`}
                    onClick={() => setActiveChartMetric('arroba')}
                  >
                    @
                  </button>
                </div>
              </div>

              <div className="chart-visual-wrapper">
                <TauzeMainChart
                  data={(chartData as any[]).map((d: any) => ({
                    label: d.label,
                    value:
                      activeChartMetric === 'gmd'
                        ? Number((d.gmd ?? 0).toFixed(3))
                        : activeChartMetric === 'peso'
                          ? Number(d.peso ?? 0)
                          : Number((d.arroba ?? 0).toFixed(2)),
                  }))}
                  color={
                    activeChartMetric === 'gmd'
                      ? '#10b981'
                      : activeChartMetric === 'peso'
                        ? '#3b82f6'
                        : '#f59e0b'
                  }
                  height="100%"
                  unit={
                    activeChartMetric === 'gmd' ? 'kg/d' : activeChartMetric === 'peso' ? 'kg' : '@'
                  }
                  mode={chartMode}
                />
              </div>
            </div>

            <div className="intelligence-sidebar">
              <div className="sidebar-header">
                <Zap size={14} className="text-brand" />
                <span>ANÁLISE ESTRATÉGICA</span>
              </div>

              <div className="insight-cards-stack">
                <div
                  className="insight-card-mini clickable"
                  onClick={() => navigate('/pecuaria/pesagem')}
                >
                  <div className="i-header">
                    <div className="h-left">
                      <TrendingUp size={12} className="text-success" />
                      <span>Projeção de Abate</span>
                    </div>
                    <button
                      className="ai-quick-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCopilotInput('Como otimizar a projeção de abate?');
                        setIsCopilotOpen(true);
                      }}
                    >
                      <Sparkles size={10} />
                      <span>AJUDA IA</span>
                    </button>
                  </div>
                  <div className="i-value">{strategicInsights.projAbate}</div>
                  <div className="i-footer">Baseado no GMD atual</div>
                </div>

                <div
                  className="insight-card-mini warning clickable"
                  onClick={() => navigate('/pecuaria/lote')}
                >
                  <div className="i-header">
                    <div className="h-left">
                      <AlertCircle size={12} className="text-warning" />
                      <span>Desvio de Meta</span>
                    </div>
                    <button
                      className="ai-quick-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCopilotInput('O que está causando o desvio no GMD?');
                        setIsCopilotOpen(true);
                      }}
                    >
                      <Sparkles size={10} />
                      <span>DIAGNÓSTICO</span>
                    </button>
                  </div>
                  <div className="i-value">{strategicInsights.desvioMeta}</div>
                  <div className="i-footer">Monitoramento contínuo</div>
                </div>

                <div
                  className="insight-card-mini success clickable"
                  onClick={() => navigate('/pecuaria/sanidade')}
                >
                  <div className="i-header">
                    <div className="h-left">
                      <Sparkles size={12} className="text-brand" />
                      <span>Score Corporal</span>
                    </div>
                    <button
                      className="ai-quick-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCopilotInput('Plano nutricional para elevar score corporal');
                        setIsCopilotOpen(true);
                      }}
                    >
                      <Sparkles size={10} />
                      <span>PLANO</span>
                    </button>
                  </div>
                  <div className="i-value">
                    {strategicInsights.ecc.split(' ')[0]} <small>avg</small>
                  </div>
                  <div className="i-footer">Evolução do rebanho</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="recent-activity-panel">
          <div className="panel-header">
            <h3>Atividades Recentes</h3>
            <Clock size={18} color="#64748b" />
          </div>
          <div className="activity-list">
            {loading ? (
              <div style={{ padding: '20px' }}>
                <TableSkeleton />
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((act: any, i: number) => (
                <div key={i} className="activity-item">
                  <div
                    className="activity-icon"
                    style={{ background: i % 2 === 0 ? 'hsl(var(--brand) / 0.1)' : '#fef2f2' }}
                  >
                    {i % 2 === 0 ? (
                      <Beef size={20} color="hsl(var(--brand))" />
                    ) : (
                      <Activity size={20} color="#ef4444" />
                    )}
                  </div>
                  <div className="activity-info">
                    <h4>
                      {i % 2 === 0 ? 'Pesagem' : 'Alerta Sanitário'}:{' '}
                      {act.animais?.brinco || 'BR-001'}
                    </h4>
                    <p>
                      {act.observacao ||
                        (i % 2 === 0
                          ? 'Pesagem de rotina realizada no curral.'
                          : 'Vacinação pendente para este animal.')}
                    </p>
                    <span className="activity-time">
                      {new Date(act.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Sem atividades recentes"
                description="Não há novos registros de manejo para esta unidade nas últimas 24 horas."
                icon={Clock}
              />
            )}
          </div>
        </section>
      </div>

      <style>{`
        .executive-page.tv-mode {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 2147483647 !important;
          background: #020617 !important;
          color: white !important;
          padding: 60px !important;
          overflow-y: auto !important;
          margin: 0 !important;
        }

        /* Global overrides for TV Mode */
        body.tv-mode-active,
        body.tv-mode-active .layout,
        body.tv-mode-active .main-content,
        body.tv-mode-active .page-container {
          background: #020617 !important;
          background-color: #020617 !important;
          transform: none !important;
          animation: none !important;
          width: 100% !important;
          height: 100% !important;
          opacity: 1 !important;
        }

        body.tv-mode-active .sidebar,
        body.tv-mode-active header.header {
          display: none !important;
        }

        body.tv-mode-active .main-content {
          margin-left: 0 !important;
          padding: 0 !important;
          background: #020617 !important;
        }

        body.tv-mode-active .page-container {
          padding: 0 !important;
          max-width: none !important;
          margin: 0 !important;
          background: #020617 !important;
        }

        .tv-mode .page-title { color: white; font-size: 56px; }
        .tv-mode .page-subtitle { color: #94a3b8; font-size: 22px; }
        
        .tv-mode .next-gen-kpi-grid { 
          grid-template-columns: repeat(4, 1fr); 
          gap: 16px; 
          margin-top: 60px; 
          margin-bottom: 60px;
        }

        /* TV Mode Card Overrides */
        .tv-mode .tauze-kpi-card {
          background: #0f172a !important;
          border-color: #1e293b !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
        }

        .tv-mode .kpi-value-tauze { color: white !important; font-size: 2.4rem !important; }
        .tv-mode .kpi-label-tauze { color: #94a3b8 !important; font-size: 0.9rem !important; }
        .tv-mode .ring-bg { stroke: #1e293b !important; }
        .tv-mode .kpi-divider { background: #1e293b !important; }
        .tv-mode .period-badge-tauze { color: #64748b !important; }

        .tv-mode .analytics-canvas { 
          background: #0f172a !important; 
          border-color: #1e293b !important; 
          padding: 48px !important;
        }

        .tv-mode .recent-activity-panel { 
          background: #0f172a !important; 
          border-color: #1e293b !important;
          padding: 48px !important;
        }

        .tv-mode .panel-header h3 { color: white !important; font-size: 24px !important; }
        .tv-mode .activity-item { border-bottom-color: #1e293b !important; }
        .tv-mode .activity-info h4 { color: #cbd5e1 !important; }
        .tv-mode .activity-icon { background: #1e293b !important; }
        .tv-mode .viz-placeholder-lg { background: #1e293b !important; }

        .tv-mode .recent-activity-panel {
          top: 100px;
          background: #0f172a !important;
          border-color: #1e293b !important;
          color: white !important;
          max-height: calc(100vh - 160px);
        }

        .tauze-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(2, 6, 23, 0.85) !important;
          backdrop-filter: blur(12px) !important;
          z-index: 2147483647 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          margin: 0 !important;
        }

        .tauze-history-modal {
          background: hsl(var(--bg-card)) !important;
          width: 90% !important;
          max-width: 650px !important;
          border-radius: 32px !important;
          overflow: hidden !important;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8) !important;
          display: flex !important;
          flex-direction: column !important;
          max-height: 85vh !important;
          position: relative !important;
        }

        .modal-header-premium {
          padding: 16px 32px;
          background: #0f172a;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header-premium .m-title { display: flex; align-items: center; gap: 12px; }
        .modal-header-premium h3 { margin: 0; font-size: 18px; font-weight: 800; }
        .close-m-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .close-m-btn:hover { background: rgba(255,255,255,0.2); transform: rotate(90deg); }

        .modal-body-scroll { padding: 16px; overflow-y: auto; flex: 1; }
        .history-timeline { display: flex; flex-direction: column; gap: 16px; }
        .timeline-item { display: flex; gap: 20px; position: relative; }
        .timeline-item::after { content: ''; position: absolute; left: 18px; top: 36px; bottom: -12px; width: 2px; background: hsl(var(--border)); }
        .timeline-item:last-child::after { display: none; }
        .t-icon { width: 36px; height: 36px; border-radius: 12px; background: hsl(var(--bg-main)); border: 1px solid hsl(var(--border)); display: flex; align-items: center; justify-content: center; color: hsl(var(--text-muted)); z-index: 2; flex-shrink: 0; }
        .t-content { flex: 1; }
        .t-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .t-type { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #16a34a; letter-spacing: 0.05em; }
        .t-date { font-size: 11px; font-weight: 700; color: #94a3b8; }
        .t-desc { font-size: 13px; font-weight: 600; color: hsl(var(--text-main)); margin: 0; }
        .timeline-item.muted .t-type { color: #94a3b8; }
        .ai-quick-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: hsl(var(--bg-main));
          color: #475569;
          border: none;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
        }
        .ai-quick-btn:hover { background: #0f172a; color: white; transform: translateY(-1px); }
        .ai-quick-btn.danger { background: #fef2f2; color: #ef4444; }
        .ai-quick-btn.danger:hover { background: #ef4444; color: white; }
        .i-header { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 8px; }
        .i-header .h-left { display: flex; align-items: center; gap: 8px; }
      `}</style>
    </div>
  );
};
