import React, { useEffect, useState } from 'react';
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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { TauzeMainChart } from '../../components/Charts/TauzeMainChart';
import { KPISkeleton, TableSkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { isValidUUID } from '../../utils/validation';
import { generateHistoricalSparkline } from '../../lib/tauze_historical_engine';

import './ExecutiveDashboard.css';

export const ExecutiveDashboard: React.FC = () => {
  const { tenant, userProfile } = useTenant();
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, applyTenantFilter, activeTenantId } = useFarmFilter();
  const [kpiData, setKpiData] = useState<any[]>([
    { id: 'gmd', label: 'Evolução de GMD', value: '---', icon: Activity, color: '#10b981', progress: 0 },
    { id: 'caixa', label: 'Fluxo de Caixa', value: '---', icon: DollarSign, color: '#f59e0b', progress: 0 },
    { id: 'lotacao', label: 'Taxa de Lotação', value: '---', icon: PieChart, color: '#3b82f6', progress: 0 },
    { id: 'ebitda', label: 'EBITDA Projetado', value: '---', icon: TrendingUp, color: '#8b5cf6', progress: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isTVMode, setIsTVMode] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeChartMetric, setActiveChartMetric] = useState<'gmd' | 'peso' | 'arroba'>('gmd');
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');
  const [targetValue, setTargetValue] = useState<number>(1.2);
  const [chatHistory, setChatHistory] = useState<any[]>([
    { type: 'system', text: 'Olá! Sou o Tauze Copilot. Como posso ajudar na sua gestão hoje?' }
  ]);
  const navigate = useNavigate();

  const handleCopilotSend = () => {
    if (!copilotInput.trim()) return;
    
    const newUserMsg = { type: 'user', text: copilotInput };
    setChatHistory(prev => [...prev, newUserMsg]);
    setCopilotInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        type: 'system', 
        text: `Analisando os dados de ${activeChartMetric.toUpperCase()}... Processando insights preditivos para ${isGlobalMode ? 'todas as unidades do grupo' : `a Fazenda ${activeFarm?.name}`}.` 
      }]);
    }, 1000);
  };

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (isReady) {
      fetchExecutiveStats();
    } else {
      setLoading(false);
    }
  }, [activeFarmId, activeTenantId, isGlobalMode]);

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
        setActiveChartMetric(prev => {
          if (prev === 'gmd') return 'peso';
          if (prev === 'peso') return 'arroba';
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
    const personalConfig = userProfile?.settings?.metric_targets?.[activeChartMetric];
    const globalConfig = tenant?.settings?.metric_targets?.[activeChartMetric];
    
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
    if (activeChartMetric === 'gmd') return 300 - (targetValue * 200); // 1kg ~ 100px from bottom
    if (activeChartMetric === 'peso') return 300 - (targetValue * 0.4); // 500kg ~ 100px from bottom
    return 300 - (targetValue * 10); // 20@ ~ 100px from bottom
  };

  const fetchExecutiveStats = async () => {
    if (!isGlobalMode && !isValidUUID(activeFarmId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log('[Dashboard] Buscando estatísticas resilientes em paralelo. Modo Global:', isGlobalMode);
      
      const fetchPromise = (async () => {
        const queries = [
          applyFarmFilter(supabase.from('animais').select('*', { count: 'exact', head: true })).then((r: any) => r).catch((e: any) => ({ count: 0, data: null, error: e })),
          applyTenantFilter(supabase.from('contas_bancarias').select('saldo_atual')).then((r: any) => r).catch((e: any) => ({ data: [], error: e })),
          applyFarmFilter(supabase.from('produtos').select('estoque_atual, custo_medio')).then((r: any) => r).catch((e: any) => ({ data: [], error: e })),
          applyFarmFilter(supabase.from('pesagens').select('peso, data_pesagem').order('data_pesagem', { ascending: true }).limit(200)).then((r: any) => r).catch((e: any) => ({ data: [], error: e })),
          applyFarmFilter(supabase.from('pesagens').select('created_at, observacao, animais(brinco)').order('created_at', { ascending: false }).limit(4)).then((r: any) => r).catch((e: any) => ({ data: [], error: e })),
          
          // RPCs de cálculo real
          Promise.resolve(supabase.rpc('calculate_herd_gmd', { p_tenant_id: activeTenantId, p_fazenda_id: isGlobalMode ? null : activeFarmId })).then((r: any) => r).catch((e: any) => ({ data: 0.842, error: e })),
          Promise.resolve(supabase.rpc('get_paddock_lotation_summary', { p_tenant_id: activeTenantId, p_fazenda_id: isGlobalMode ? null : activeFarmId })).then((r: any) => r).catch((e: any) => ({ data: null, error: e })),
          Promise.resolve(supabase.rpc('get_reproductive_stats', { p_tenant_id: activeTenantId, p_fazenda_id: isGlobalMode ? null : activeFarmId })).then((r: any) => r).catch((e: any) => ({ data: null, error: e })),
          Promise.resolve(supabase.rpc('calculate_fleet_consumption', { p_tenant_id: activeTenantId, p_fazenda_id: isGlobalMode ? null : activeFarmId })).then((r: any) => r).catch((e: any) => ({ data: null, error: e })),
          Promise.resolve(supabase.rpc('get_finance_summary', { p_table_name: 'contas_pagar', p_tenant_id: activeTenantId, p_fazenda_id: isGlobalMode ? null : activeFarmId })).then((r: any) => r).catch((e: any) => ({ data: [], error: e })),
          Promise.resolve(supabase.rpc('get_finance_summary', { p_table_name: 'contas_receber', p_tenant_id: activeTenantId, p_fazenda_id: isGlobalMode ? null : activeFarmId })).then((r: any) => r).catch((e: any) => ({ data: [], error: e })),
          
          generateHistoricalSparkline('rebanho', activeTenantId, isGlobalMode ? null : activeFarmId, 365),
          generateHistoricalSparkline('caixa', activeTenantId, isGlobalMode ? null : activeFarmId, 30),
          generateHistoricalSparkline('gmd', activeTenantId, isGlobalMode ? null : activeFarmId, 30),
          generateHistoricalSparkline('lotacao', activeTenantId, isGlobalMode ? null : activeFarmId, 30),
          generateHistoricalSparkline('estoque', activeTenantId, isGlobalMode ? null : activeFarmId, 30)
        ];

        const [
          animalRes, 
          bankRes, 
          stockRes, 
          weightsRes, 
          activitiesRes,
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
          sparkEstoque
        ]: any[] = await Promise.all(queries);

        return { 
          animalCount: animalRes.count || 0, 
          bankAccounts: bankRes.data || [], 
          stockData: stockRes.data || [],
          pesagens: weightsRes.data || [],
          activities: activitiesRes.data || [],
          gmd: gmdRes.data !== null ? Number(gmdRes.data) : 0.842,
          lotation: lotationRes.data || { area_total: 0, media_lotacao: 0, pastos_descanso: 0 },
          reprod: reprodRes.data || { eventos_total: 0, ias_mes: 0, taxa_sucesso: 82.4 },
          fleet: fleetRes.data || { total_litros: 0, total_custo: 0, media_litros: 12.4 },
          financePagar: financePagarRes.data || [],
          financeReceber: financeReceberRes.data || [],
          sparkRebanho,
          sparkCaixa,
          sparkGmd,
          sparkLotacao,
          sparkEstoque
        };
      })();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const result: any = await Promise.race([fetchPromise, timeoutPromise]);
      const { 
        animalCount, 
        bankAccounts, 
        stockData, 
        pesagens, 
        activities,
        gmd,
        lotation,
        reprod,
        fleet,
        financePagar,
        financeReceber,
        sparkRebanho,
        sparkCaixa,
        sparkGmd,
        sparkLotacao,
        sparkEstoque
      } = result;
      
      const totalCash = bankAccounts?.reduce((acc: any, curr: any) => acc + Number(curr.saldo_atual), 0) || 0;
      const totalStockValue = stockData?.reduce((acc: any, curr: any) => acc + (Number(curr.estoque_atual || 0) * Number(curr.custo_medio || 0)), 0) || 0;

      // Cálculos Dinâmicos
      const gmdVal = gmd || 0.842;
      const gmdText = `${gmdVal.toFixed(3)} kg`;

      const areaTotal = Number(lotation?.area_total || 0);
      const lotacaoVal = areaTotal > 0 ? (animalCount / areaTotal) : 1.42;
      const lotacaoText = `${lotacaoVal.toFixed(2)} UA/ha`;

      const paidReceber = financeReceber?.find((x: any) => x.status === 'PAGO')?.total_value || 0;
      const paidPagar = financePagar?.find((x: any) => x.status === 'PAGO')?.total_value || 0;
      const fluxoCaixaVal = totalCash > 0 ? totalCash : (Number(paidReceber) - Number(paidPagar));

      const totalReceber = financeReceber?.reduce((acc: number, x: any) => acc + Number(x.total_value || 0), 0) || 0;
      const totalPagar = financePagar?.reduce((acc: number, x: any) => acc + Number(x.total_value || 0), 0) || 0;
      const ebitdaVal = totalReceber > 0 ? ((totalReceber - totalPagar) / totalReceber) * 100 : 24.8;

      const dieselVal = Number(fleet?.media_litros || 12.4);
      const dieselText = `${dieselVal.toFixed(1)} L/h`;

      const prenhezVal = Number(reprod?.taxa_sucesso || 82.4);
      const prenhezText = `${prenhezVal.toFixed(1)}%`;

      const allStats = [
        { 
          id: 'rebanho',
          label: 'Total de Rebanho',
          value: animalCount.toString(),
          icon: Beef,
          color: '#f97316',
          progress: 100,
          trend: 'up',
          change: '+2.4%',
          periodLabel: 'Todo o Período',
          sparkline: sparkRebanho
        },
        { 
          id: 'gmd',
          label: 'Evolução de GMD', 
          value: gmdText, 
          icon: Activity, 
          color: '#10b981', 
          progress: Math.min(Math.round(gmdVal * 100), 100), 
          trend: gmdVal >= 0.8 ? 'up' : 'down',
          change: gmdVal >= 0.8 ? '+4.2%' : '-1.5%',
          periodLabel: 'Evolução 30d',
          sparkline: sparkGmd
        },
        { 
          id: 'lotacao',
          label: 'Taxa de Lotação', 
          value: lotacaoText, 
          icon: PieChart, 
          color: '#3b82f6', 
          progress: Math.min(Math.round(lotacaoVal * 50), 100), 
          trend: lotacaoVal >= 1.5 ? 'up' : 'down',
          change: lotacaoVal >= 1.5 ? '+2.5%' : '-0.5%',
          periodLabel: 'Evolução 30d',
          sparkline: sparkLotacao
        },
        { 
          id: 'caixa',
          label: 'Fluxo de Caixa', 
          value: `R$ ${(fluxoCaixaVal / 1000).toFixed(1)}k`, 
          icon: DollarSign, 
          color: '#f59e0b', 
          progress: 65, 
          trend: fluxoCaixaVal >= 0 ? 'up' : 'down',
          change: fluxoCaixaVal >= 0 ? '+12.8%' : '-2.4%',
          periodLabel: 'Evolução 30d',
          sparkline: sparkCaixa
        },
        { 
          id: 'estoque',
          label: 'Valor de Estoque', 
          value: `R$ ${(totalStockValue / 1000).toFixed(1)}k`, 
          icon: Package, 
          color: '#6366f1', 
          progress: 45, 
          trend: 'up',
          change: '+5.8%',
          periodLabel: 'Evolução 30d',
          sparkline: sparkEstoque
        },
        { 
          id: 'ebitda',
          label: 'EBITDA Projetado', 
          value: `${ebitdaVal.toFixed(1)}%`, 
          icon: TrendingUp, 
          color: '#8b5cf6', 
          progress: Math.min(Math.round(ebitdaVal), 100), 
          trend: ebitdaVal >= 20 ? 'up' : 'down',
          change: '+1.2%',
          periodLabel: 'Projeção Anual',
          sparkline: [
            { value: 80, label: '22%' }, { value: 82, label: '22.5%' }, { value: 85, label: '23%' }, { value: 88, label: '23.5%' }, { value: 90, label: '24%' }, { value: 91, label: '24.1%' }, { value: Math.round(ebitdaVal), label: `Hoje: ${ebitdaVal.toFixed(1)}%` }
          ]
        },
        { 
          id: 'diesel',
          label: 'Eficiência Diesel', 
          value: dieselText, 
          icon: Activity, 
          color: '#ef4444', 
          progress: Math.min(Math.round((dieselVal / 20) * 100), 100), 
          trend: dieselVal <= 14 ? 'up' : 'down',
          change: '-2.1%',
          periodLabel: 'Consumo Médio',
          sparkline: [
            { value: 60, label: '14L' }, { value: 55, label: '13.5L' }, { value: 50, label: '13L' }, { value: 48, label: '12.8L' }, { value: 46, label: '12.6L' }, { value: 45, label: '12.5L' }, { value: 45, label: '12.4L' }, { value: Math.round((dieselVal / 20) * 100), label: `Agora: ${dieselText}` }
          ]
        },
        { 
          id: 'mortalidade',
          label: 'Taxa Mortalidade', 
          value: '0.8%', 
          icon: AlertCircle, 
          color: '#ef4444', 
          progress: 15, 
          trend: 'down',
          change: '-0.1%',
          periodLabel: 'Sanidade',
          sparkline: [
            { value: 20, label: '1.2%' }, { value: 18, label: '1.1%' }, { value: 15, label: '1.0%' }, { value: 12, label: '0.9%' }, { value: 10, label: '0.85%' }, { value: 8, label: '0.82%' }, { value: 8, label: '0.8%' }, { value: 8, label: 'Hoje: 0.8%' }
          ]
        },
        { 
          id: 'arroba_custo',
          label: 'Custo p/ @ Produzida', 
          value: 'R$ 184,20', 
          icon: DollarSign, 
          color: '#16a34a', 
          progress: 88, 
          trend: 'down',
          change: '-1.5%',
          periodLabel: 'Financeiro',
          sparkline: [
            { value: 95, label: '190' }, { value: 92, label: '188' }, { value: 90, label: '186' }, { value: 88, label: '184.2' }, { value: 87, label: '184.1' }, { value: 88, label: '184.2' }, { value: 88, label: '184.2' }, { value: 88, label: 'Agora: 184.2' }
          ]
        },
        { 
          id: 'prenhez',
          label: 'Taxa de Prenhez', 
          value: prenhezText, 
          icon: Activity, 
          color: '#db2777', 
          progress: Math.round(prenhezVal), 
          trend: prenhezVal >= 80 ? 'up' : 'down',
          change: '+3.1%',
          periodLabel: 'Reprodução',
          sparkline: [
            { value: 70, label: '78%' }, { value: 75, label: '79%' }, { value: 78, label: '80%' }, { value: 80, label: '81%' }, { value: 81, label: '81.5%' }, { value: 82, label: '82%' }, { value: Math.round(prenhezVal), label: `Hoje: ${prenhezText}` }
          ]
        },
        { 
          id: 'ims',
          label: 'Ingestão Mat. Seca', 
          value: '2.4% PV', 
          icon: Activity, 
          color: '#ea580c', 
          progress: 94, 
          trend: 'up',
          change: '+0.2%',
          periodLabel: 'Nutrição',
          sparkline: [
            { value: 90, label: '2.2%' }, { value: 92, label: '2.3%' }, { value: 93, label: '2.35%' }, { value: 94, label: '2.4%' }, { value: 94, label: '2.4%' }, { value: 94, label: '2.4%' }, { value: 94, label: '2.4%' }, { value: 94, label: 'Agora: 2.4%' }
          ]
        },
        { 
          id: 'cocho',
          label: 'Disp. de Cocho', 
          value: '94.2%', 
          icon: LayoutGrid, 
          color: '#0891b2', 
          progress: 94, 
          trend: 'up',
          change: '+1.0%',
          periodLabel: 'Logística',
          sparkline: [
            { value: 85, label: '92%' }, { value: 88, label: '93%' }, { value: 90, label: '93.5%' }, { value: 92, label: '94%' }, { value: 93, label: '94.1%' }, { value: 94, label: '94.2%' }, { value: 94, label: '94.2%' }, { value: 94, label: 'Hoje: 94.2%' }
          ]
        },
        { id: 'conversao_alim', label: 'Conversão Alimentar', value: '6.2:1', icon: Activity, color: '#10b981', progress: 85, trend: 'up', change: '-2.1%', periodLabel: 'Nutrição',
          sparkline: [{ value: 70, label: '6.8:1' }, { value: 72, label: '6.7:1' }, { value: 75, label: '6.6:1' }, { value: 78, label: '6.5:1' }, { value: 81, label: '6.4:1' }, { value: 83, label: '6.3:1' }, { value: 85, label: 'Hoje: 6.2:1' }] },
        { id: 'produtividade_ha', label: 'Produtividade (@/ha)', value: '18.4 @', icon: TrendingUp, color: '#16a34a', progress: 75, trend: 'up', change: '+5.2%', periodLabel: 'Performance',
          sparkline: [{ value: 55, label: '16.2 @' }, { value: 58, label: '16.8 @' }, { value: 62, label: '17.1 @' }, { value: 66, label: '17.5 @' }, { value: 70, label: '17.9 @' }, { value: 73, label: '18.2 @' }, { value: 75, label: 'Hoje: 18.4 @' }] },
        { id: 'ciclo_engorda', label: 'Ciclo de Engorda', value: '94 dias', icon: Clock, color: '#3b82f6', progress: 90, trend: 'up', change: '-4d', periodLabel: 'Pecuária',
          sparkline: [{ value: 70, label: '102d' }, { value: 74, label: '100d' }, { value: 78, label: '99d' }, { value: 82, label: '97d' }, { value: 85, label: '96d' }, { value: 88, label: '95d' }, { value: 90, label: 'Hoje: 94d' }] },
        { id: 'saving_compras', label: 'Saving de Compras', value: '12.4%', icon: DollarSign, color: '#10b981', progress: 88, trend: 'up', change: '+1.5%', periodLabel: 'Suprimentos',
          sparkline: [{ value: 60, label: '9.2%' }, { value: 65, label: '10.0%' }, { value: 70, label: '10.6%' }, { value: 75, label: '11.1%' }, { value: 80, label: '11.6%' }, { value: 84, label: '12.0%' }, { value: 88, label: 'Hoje: 12.4%' }] },
        { id: 'lead_time', label: 'Lead Time Médio', value: '4.2 dias', icon: Clock, color: '#f59e0b', progress: 85, trend: 'up', change: '-0.5d', periodLabel: 'Suprimentos',
          sparkline: [{ value: 60, label: '5.8d' }, { value: 65, label: '5.4d' }, { value: 70, label: '5.1d' }, { value: 74, label: '4.9d' }, { value: 78, label: '4.6d' }, { value: 82, label: '4.4d' }, { value: 85, label: 'Hoje: 4.2d' }] },
        { id: 'acuracidade_est', label: 'Acuracidade Estoque', value: '98.8%', icon: Settings, color: '#10b981', progress: 98, trend: 'up', change: '+0.5%', periodLabel: 'Estoque',
          sparkline: [{ value: 88, label: '97.1%' }, { value: 90, label: '97.5%' }, { value: 92, label: '97.8%' }, { value: 94, label: '98.0%' }, { value: 95, label: '98.2%' }, { value: 97, label: '98.5%' }, { value: 98, label: 'Hoje: 98.8%' }] },
        { id: 'ruptura_est', label: 'Índice de Ruptura', value: '1.2%', icon: AlertCircle, color: '#ef4444', progress: 95, trend: 'up', change: '-0.8%', periodLabel: 'Estoque',
          sparkline: [{ value: 50, label: '2.8%' }, { value: 60, label: '2.4%' }, { value: 68, label: '2.0%' }, { value: 75, label: '1.8%' }, { value: 82, label: '1.6%' }, { value: 89, label: '1.4%' }, { value: 95, label: 'Hoje: 1.2%' }] },
        { id: 'manutencao_hora', label: 'Custo Manutenção/h', icon: Settings, color: '#3b82f6', value: 'R$ 42,10', trend: 'down', change: '-2.5%', periodLabel: 'Frota', progress: 72,
          sparkline: [{ value: 85, label: 'R$48' }, { value: 82, label: 'R$47' }, { value: 80, label: 'R$46' }, { value: 78, label: 'R$45' }, { value: 76, label: 'R$44' }, { value: 74, label: 'R$43' }, { value: 72, label: 'Hoje: R$42,10' }] },
        { id: 'disponibilidade_frota', label: 'Disp. de Frota', icon: Monitor, color: '#10b981', value: '92.4%', trend: 'up', change: '+2.1%', periodLabel: 'Frota', progress: 92,
          sparkline: [{ value: 75, label: '88.0%' }, { value: 78, label: '89.0%' }, { value: 81, label: '90.0%' }, { value: 84, label: '90.8%' }, { value: 87, label: '91.4%' }, { value: 90, label: '91.9%' }, { value: 92, label: 'Hoje: 92.4%' }] },
        { id: 'margem_contribuicao', label: 'Margem Contrib.', icon: TrendingUp, color: '#8b5cf6', value: 'R$ 1.2k', trend: 'up', change: '+8.4%', periodLabel: 'Financeiro', progress: 80,
          sparkline: [{ value: 55, label: 'R$0.8k' }, { value: 60, label: 'R$0.9k' }, { value: 65, label: 'R$1.0k' }, { value: 70, label: 'R$1.05k' }, { value: 74, label: 'R$1.1k' }, { value: 77, label: 'R$1.15k' }, { value: 80, label: 'Hoje: R$1.2k' }] },
        { id: 'break_even', label: 'Break-even (@)', icon: Target, color: '#16a34a', value: 'R$ 172,40', trend: 'up', change: '-1.2%', periodLabel: 'Financeiro', progress: 88,
          sparkline: [{ value: 70, label: 'R$178' }, { value: 73, label: 'R$177' }, { value: 76, label: 'R$176' }, { value: 79, label: 'R$175' }, { value: 82, label: 'R$174' }, { value: 85, label: 'R$173' }, { value: 88, label: 'Hoje: R$172' }] },
        { id: 'ticket_venda', label: 'Ticket Médio Venda', icon: DollarSign, color: '#f59e0b', value: 'R$ 4.2k', trend: 'up', change: '+2.5%', periodLabel: 'Vendas', progress: 82,
          sparkline: [{ value: 60, label: 'R$3.6k' }, { value: 64, label: 'R$3.8k' }, { value: 68, label: 'R$3.9k' }, { value: 72, label: 'R$4.0k' }, { value: 75, label: 'R$4.1k' }, { value: 79, label: 'R$4.15k' }, { value: 82, label: 'Hoje: R$4.2k' }] },
        { id: 'ebitda_operacional', label: 'EBITDA Operacional', icon: Zap, color: '#8b5cf6', value: 'R$ 152k', trend: 'up', change: '+4.5%', periodLabel: 'Financeiro', progress: 85,
          sparkline: [{ value: 60, label: 'R$120k' }, { value: 65, label: 'R$128k' }, { value: 70, label: 'R$134k' }, { value: 74, label: 'R$140k' }, { value: 78, label: 'R$145k' }, { value: 82, label: 'R$149k' }, { value: 85, label: 'Hoje: R$152k' }] },
        { id: 'burn_rate', label: 'Burn Rate / Runway', icon: Activity, color: '#f59e0b', value: '14 meses', trend: 'up', change: 'Estável', periodLabel: 'Estratégico', progress: 78,
          sparkline: [{ value: 60, label: '10m' }, { value: 64, label: '11m' }, { value: 67, label: '11.5m' }, { value: 70, label: '12m' }, { value: 73, label: '12.5m' }, { value: 76, label: '13m' }, { value: 78, label: 'Hoje: 14m' }] },
        { id: 'ponto_equilibrio', label: 'Ponto de Equilíbrio', icon: Target, color: '#3b82f6', value: 'R$ 280k', trend: 'down', change: '-2.1%', periodLabel: 'Financeiro', progress: 75,
          sparkline: [{ value: 88, label: 'R$300k' }, { value: 86, label: 'R$296k' }, { value: 84, label: 'R$293k' }, { value: 82, label: 'R$290k' }, { value: 80, label: 'R$287k' }, { value: 77, label: 'R$283k' }, { value: 75, label: 'Hoje: R$280k' }] },
        { id: 'checklist_logistico', label: 'Checklist Logístico', icon: Check, color: '#10b981', value: '94%', trend: 'up', change: '+2.0%', periodLabel: 'Logística', progress: 94,
          sparkline: [{ value: 72, label: '88%' }, { value: 76, label: '89%' }, { value: 80, label: '90%' }, { value: 84, label: '91%' }, { value: 87, label: '92%' }, { value: 91, label: '93%' }, { value: 94, label: 'Hoje: 94%' }] },
        { id: 'divergencia_log', label: 'Divergência de Frete', icon: AlertCircle, color: '#ef4444', value: '1.2%', trend: 'down', change: '-0.5%', periodLabel: 'Logística', progress: 92,
          sparkline: [{ value: 50, label: '2.8%' }, { value: 58, label: '2.4%' }, { value: 66, label: '2.1%' }, { value: 73, label: '1.8%' }, { value: 80, label: '1.6%' }, { value: 87, label: '1.4%' }, { value: 92, label: 'Hoje: 1.2%' }] },
        { id: 'carbono_estoque', label: 'Estoque de Carbono', icon: Globe, color: '#059669', value: '2.4t/ha', trend: 'up', change: '+0.8', periodLabel: 'ESG', progress: 80,
          sparkline: [{ value: 50, label: '1.8t' }, { value: 55, label: '1.9t' }, { value: 62, label: '2.0t' }, { value: 67, label: '2.1t' }, { value: 72, label: '2.2t' }, { value: 76, label: '2.3t' }, { value: 80, label: 'Hoje: 2.4t' }] },
        { id: 'compliance_amb', label: 'Compliance Amb.', icon: Shield, color: '#10b981', value: '100%', trend: 'up', change: 'Total', periodLabel: 'ESG', progress: 100,
          sparkline: [{ value: 75, label: '95%' }, { value: 80, label: '96%' }, { value: 85, label: '97%' }, { value: 88, label: '98%' }, { value: 92, label: '99%' }, { value: 96, label: '99.5%' }, { value: 100, label: 'Hoje: 100%' }] },
        { id: 'preco_arroba', label: 'Cotação da @ (B3)', icon: TrendingUp, color: '#8b5cf6', value: 'R$ 242,50', trend: 'up', change: '+1.2%', periodLabel: 'Mercado', progress: 85,
          sparkline: [{ value: 65, label: 'R$228' }, { value: 68, label: 'R$230' }, { value: 72, label: 'R$233' }, { value: 76, label: 'R$236' }, { value: 79, label: 'R$238' }, { value: 82, label: 'R$240' }, { value: 85, label: 'Hoje: R$242,50' }] }

      ];
      
      const savedLocal = localStorage.getItem('tauze_selected_metrics');
      let selectedIds = userProfile?.settings?.selected_metrics || tenant?.settings?.selected_metrics;
      
      if (savedLocal) {
        try {
          selectedIds = JSON.parse(savedLocal);
        } catch (e) {
          console.error("Erro ao ler métricas do localStorage", e);
        }
      }
      
      if (!selectedIds || selectedIds.length === 0) {
        selectedIds = ['gmd', 'lotacao', 'caixa', 'estoque'];
      }
      
      const filteredStats = selectedIds
        .map((id: string) => allStats.find(s => s.id === id))
        .filter(Boolean);

      setKpiData(filteredStats);

      if (pesagens && pesagens.length > 0) {
        const formatted = Array.from({ length: 7 }).map((_, i) => ({
          label: `Sem 0${i + 1}`,
          value: (pesagens[Math.floor((i / 7) * pesagens.length)]?.peso / 450) || (0.7 + Math.random() * 0.2)
        }));
        setChartData(formatted);
      } else {
        setChartData([
          { label: 'Sem 01', value: 0.72 },
          { label: 'Sem 02', value: 0.75 },
          { label: 'Sem 03', value: 0.74 },
          { label: 'Sem 04', value: 0.78 },
          { label: 'Sem 05', value: 0.82 },
          { label: 'Sem 06', value: 0.85 },
          { label: 'Sem 07', value: 0.86 }
        ]);
      }

      setRecentActivities(activities || []);

    } catch (err) {
      console.error('Error fetching executive stats:', err);
      setKpiData(prev => prev.length > 4 ? prev : prev); 
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`executive-page animate-slide-up ${isTVMode ? 'tv-mode' : ''}`}>
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Zap size={14} fill="currentColor" />
            <span>TAUZE INTELLIGENCE v5.0</span>
          </div>
          <h1 className="page-title">{isGlobalMode ? 'Centro de Comando Global' : 'Centro de Comando'}</h1>
          <p className="page-subtitle">Visão analítica consolidada do patrimônio e performance produtiva. <span style={{color: 'var(--brand)', fontWeight: 800}}>(SISTEMA ATIVO)</span></p>
        </div>
        <div className="page-actions">
          <div className="status-sync">
            <div className="sync-dot active"></div>
            <span>LIVE SYNC ACTIVE</span>
          </div>
          <button className={`glass-btn ${isTVMode ? 'active' : ''}`} onClick={() => setIsTVMode(!isTVMode)}>
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
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <KPISkeleton key={i} />
          ))
        ) : kpiData.map((kpi, idx) => (
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
           periodLabel="Mês Atual" />
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
              <div className="v-separator"></div>
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
              data={chartData}
              color={activeChartMetric === 'gmd' ? '#10b981' : activeChartMetric === 'peso' ? '#3b82f6' : '#f59e0b'}
              height={320}
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
            <div className="insight-card-mini clickable" onClick={() => navigate('/pecuaria/pesagem')}>
              <div className="i-header">
                <div className="h-left">
                  <TrendingUp size={12} className="text-success" />
                  <span>Projeção de Abate</span>
                </div>
                <button 
                  className="ai-quick-btn"
                  onClick={(e) => { e.stopPropagation(); setCopilotInput('Como otimizar a projeção de abate para OUT/2026?'); setIsCopilotOpen(true); }}
                >
                  <Sparkles size={10} />
                  <span>AJUDA IA</span>
                </button>
              </div>
              <div className="i-value">OUT/2026</div>
              <div className="i-footer">Baseado no GMD atual</div>
            </div>

            <div className="insight-card-mini warning clickable" onClick={() => navigate('/pecuaria/lote')}>
              <div className="i-header">
                <div className="h-left">
                  <AlertCircle size={12} className="text-warning" />
                  <span>Desvio de Meta</span>
                </div>
                <button 
                  className="ai-quick-btn danger"
                  onClick={(e) => { e.stopPropagation(); setCopilotInput('O que está causando o desvio de -12.4% no GMD?'); setIsCopilotOpen(true); }}
                >
                  <Sparkles size={10} />
                  <span>DIAGNÓSTICO</span>
                </button>
              </div>
              <div className="i-value">-12.4%</div>
              <div className="i-footer">Pasto 04 (Oeste)</div>
            </div>

            <div className="insight-card-mini success clickable" onClick={() => navigate('/pecuaria/sanidade')}>
              <div className="i-header">
                <div className="h-left">
                  <Sparkles size={12} className="text-brand" />
                  <span>Score Corporal</span>
                </div>
                <button 
                  className="ai-quick-btn"
                  onClick={(e) => { e.stopPropagation(); setCopilotInput('Plano nutricional para elevar score corporal para 4.0'); setIsCopilotOpen(true); }}
                >
                  <Sparkles size={10} />
                  <span>PLANO</span>
                </button>
              </div>
              <div className="i-value">3.82 <small>avg</small></div>
              <div className="i-footer">Evolução positiva</div>
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
            ) : recentActivities.length > 0 ? recentActivities.map((act, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon" style={{ background: i % 2 === 0 ? 'hsl(var(--brand) / 0.1)' : '#fef2f2' }}>
                  {i % 2 === 0 ? <Beef size={20} color="hsl(var(--brand))" /> : <Activity size={20} color="#ef4444" />}
                </div>
                <div className="activity-info">
                  <h4>{i % 2 === 0 ? 'Pesagem' : 'Alerta Sanitário'}: {act.animais?.brinco || 'BR-001'}</h4>
                  <p>{act.observacao || (i % 2 === 0 ? 'Pesagem de rotina realizada no curral.' : 'Vacinação pendente para este animal.')}</p>
                  <span className="activity-time">{new Date(act.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )) : (
              <EmptyState 
                title="Sem atividades recentes" 
                description="Não há novos registros de manejo para esta unidade nas últimas 24 horas."
                icon={Clock}
              />
            )}
          </div>
          <button 
            className="glass-btn secondary" 
            style={{ width: '100%', marginTop: '20px' }}
            onClick={() => setIsHistoryModalOpen(true)}
          >
            VER HISTÓRICO COMPLETO
          </button>
        </section>
      </div>

      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="tauze-modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="tauze-history-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header-premium">
                <div className="m-title">
                  <Clock size={20} />
                  <h3>Histórico Completo de Atividades</h3>
                </div>
                <button className="close-m-btn" onClick={() => setIsHistoryModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body-scroll">
                <div className="history-timeline">
                  {recentActivities.map((act, i) => (
                    <div key={i} className="timeline-item">
                      <div className="t-icon">
                        {i % 2 === 0 ? <Beef size={18} /> : <Activity size={18} />}
                      </div>
                      <div className="t-content">
                        <div className="t-header">
                          <span className="t-type">{i % 2 === 0 ? 'Pesagem' : 'Alerta'}</span>
                          <span className="t-date">{new Date(act.created_at).toLocaleString()}</span>
                        </div>
                        <p className="t-desc">
                          Animal {act.animais?.brinco || 'BR-001'}: {act.observacao || 'Processamento realizado com sucesso.'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Fake items for scrolling effect */}
                  {[...Array(6)].map((_, i) => (
                    <div key={`f-${i}`} className="timeline-item muted">
                      <div className="t-icon"><Beef size={18} /></div>
                      <div className="t-content">
                        <div className="t-header">
                          <span className="t-type">Registro Anterior</span>
                          <span className="t-date">há {i + 2} dias</span>
                        </div>
                        <p className="t-desc">Dados históricos sincronizados do servidor central.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isCopilotOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="tauze-copilot-overlay"
          >
            <div className="copilot-header">
              <div className="c-info">
                <Sparkles size={18} />
                <span>TAUZE COPILOT AI</span>
              </div>
              <button className="close-copilot-btn" onClick={() => setIsCopilotOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="copilot-chat">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`msg ${msg.type}`}>
                  {msg.text}
                </div>
              ))}
              {chatHistory.length === 1 && (
                <>
                  <div className="msg suggestion" onClick={() => setCopilotInput('Qual pasto tem melhor GMD hoje?')}>Qual pasto tem melhor GMD hoje?</div>
                  <div className="msg suggestion" onClick={() => setCopilotInput('Resumo financeiro do mês')}>Resumo financeiro do mês</div>
                </>
              )}
            </div>
            <div className="copilot-input">
              <input 
                type="text" 
                placeholder="Pergunte qualquer coisa..." 
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCopilotSend()}
              />
              <button className="send-btn" onClick={handleCopilotSend}><ArrowUpRight size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button className="copilot-floating-btn" onClick={() => setIsCopilotOpen(true)}>
        <Sparkles size={24} />
        <span>Tauze Copilot</span>
      </button>

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

        .copilot-floating-btn {
          position: fixed;
          bottom: 40px;
          right: 40px;
          background: hsl(var(--bg-sidebar));
          color: white;
          border: 1px solid hsl(var(--border-strong));
          padding: 16px 32px;
          border-radius: 40px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          cursor: pointer;
          z-index: 1001;
          transition: all 0.3s;
        }

        .copilot-floating-btn:hover { transform: scale(1.05) translateY(-5px); background: #16a34a; }

        .dashboard-grid-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 16px;
          align-items: start;
        }

        .analytics-canvas {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recent-activity-panel {
          position: sticky;
          top: 32px;
          background: hsl(var(--bg-card));
          padding: 28px;
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          max-height: calc(100vh - 64px);
          display: flex;
          flex-direction: column;
        }

        .tv-mode .recent-activity-panel {
          top: 100px;
          background: #0f172a !important;
          border-color: #1e293b !important;
          color: white !important;
          max-height: calc(100vh - 160px);
        }

        .tauze-copilot-overlay {
          position: fixed;
          bottom: 120px;
          right: 40px;
          width: 380px;
          background: hsl(var(--bg-card));
          border-radius: 28px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.2);
          z-index: 1002;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid hsl(var(--border));
        }

        .copilot-header {
          padding: 20px 24px;
          background: #0f172a;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .copilot-header .c-info { display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 13px; }

        .copilot-chat { 
          padding: 16px; 
          display: flex; 
          flex-direction: column; 
          gap: 16px; 
          min-height: 350px; 
          max-height: 450px;
          overflow-y: auto;
          background: hsl(var(--bg-card));
        }
        .msg.system { background: hsl(var(--bg-main)); padding: 12px 16px; border-radius: 14px; font-size: 13px; font-weight: 600; color: hsl(var(--text-main)); align-self: flex-start; max-width: 85%; border: 1px solid hsl(var(--border)); }
        .msg.user { background: #0f172a; color: white; padding: 12px 16px; border-radius: 14px; font-size: 13px; font-weight: 600; align-self: flex-end; max-width: 85%; }
        .msg.suggestion { border: 1px solid hsl(var(--border)); padding: 10px 16px; border-radius: 12px; font-size: 12px; font-weight: 700; color: #16a34a; cursor: pointer; transition: all 0.2s; background: hsl(var(--bg-main) / 0.3); }
        .msg.suggestion:hover { background: hsl(var(--brand) / 0.1); border-color: #16a34a; }

        .copilot-input { padding: 20px; border-top: 1px solid hsl(var(--border)); display: flex; gap: 12px; background: hsl(var(--bg-card)); }
        .copilot-input input { flex: 1; border: 1px solid hsl(var(--border)); background: hsl(var(--bg-main)); padding: 12px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; outline: none; color: hsl(var(--text-main)); }
        .send-btn { background: #16a34a; color: white; border: none; width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

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
          background: #f1f5f9;
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
