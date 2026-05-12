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
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { EliteMainChart } from '../../components/Charts/EliteMainChart';
import { KPISkeleton, TableSkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import './ExecutiveDashboard.css';

export const ExecutiveDashboard: React.FC = () => {
<<<<<<< HEAD
  const { activeFarm, tenant, userProfile, isGlobalMode, activeFarmId, applyFarmFilter } = useFarmFilter();
=======
  const { activeFarm, tenant, userProfile, isGlobalMode, activeFarmId, activeTenantId } = useTenant();
>>>>>>> 1fbbc88 (Elite ERP: Diamond Precision 5.0 - Sincronizacao Consolidada)
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
    { type: 'system', text: 'Olá! Sou o Elite Copilot. Como posso ajudar na sua gestão hoje?' }
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
<<<<<<< HEAD
    if (!activeFarmId && !isGlobalMode) return;
    fetchExecutiveStats();
  }, [activeFarmId, isGlobalMode, tenant]);
=======
    if (!activeTenantId) return;
    fetchExecutiveStats();
  }, [activeFarmId, activeTenantId, isGlobalMode, tenant]);
>>>>>>> 1fbbc88 (Elite ERP: Diamond Precision 5.0 - Sincronizacao Consolidada)

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
      if (e.key === 'elite_selected_metrics') {
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
    setLoading(true);
    try {
      console.log('[Dashboard] Buscando estatísticas. Modo Global:', isGlobalMode);
      
<<<<<<< HEAD
      let animalQuery = supabase.from('animais').select('*', { count: 'exact', head: true });
      animalQuery = applyFarmFilter(animalQuery);
      const { count: animalCount } = await animalQuery;
      
      const vivoValue = (animalCount || 0) * 3500;

      let bankQuery = supabase.from('contas_bancarias').select('saldo_atual');
      bankQuery = applyFarmFilter(bankQuery);
      const { data: bankAccounts } = await bankQuery;
      
      const totalCash = bankAccounts?.reduce((acc, curr) => acc + Number(curr.saldo_atual), 0) || 0;

      let stockQuery = supabase.from('produtos').select('estoque_atual, custo_medio');
      stockQuery = applyFarmFilter(stockQuery);
=======
      // 1. Animals
      let animalCount = 0;
      if (isGlobalMode && activeTenantId) {
        const { count } = await supabase.from('animais')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', activeTenantId);
        animalCount = count || 0;
      } else if (activeFarmId) {
        const { count } = await supabase.from('animais')
          .select('*', { count: 'exact', head: true })
          .eq('fazenda_id', activeFarmId);
        animalCount = count || 0;
      }
      
      // 2. Cash Flow
      const { data: bankAccounts } = await supabase
        .from('contas_bancarias')
        .select('saldo_atual')
        .eq('tenant_id', activeTenantId);
      
      const totalCash = bankAccounts?.reduce((acc, curr) => acc + Number(curr.saldo_atual), 0) || 0;

      // 3. Stock
      let stockQuery = supabase.from('produtos').select('estoque_atual, custo_medio');
      if (isGlobalMode) {
        stockQuery = stockQuery.eq('tenant_id', activeTenantId);
      } else {
        stockQuery = stockQuery.eq('fazenda_id', activeFarmId);
      }
>>>>>>> 1fbbc88 (Elite ERP: Diamond Precision 5.0 - Sincronizacao Consolidada)
      const { data: stockData } = await stockQuery;
      
      const totalStockValue = stockData?.reduce((acc, curr) => acc + (Number(curr.estoque_atual || 0) * Number(curr.custo_medio || 0)), 0) || 0;

      const allStats = [
        { 
          id: 'gmd',
          label: 'Evolução de GMD', 
          value: '0.842 kg', 
          icon: Activity, 
          color: '#10b981', 
          progress: 85, 
          trend: 'up',
          change: '+4.2%',
          periodLabel: 'Evolução 30d',
          sparkline: [
            { value: 30, label: '0.720' }, { value: 45, label: '0.750' }, { value: 40, label: '0.780' }, { value: 55, label: '0.810' }, { value: 50, label: '0.820' }, { value: 65, label: '0.830' }, { value: 60, label: '0.840' }, { value: 85, label: 'Hoje: 0.842' }
          ]
        },
        { 
          id: 'lotacao',
          label: 'Taxa de Lotação', 
          value: '1.42 UA/ha', 
          icon: PieChart, 
          color: '#3b82f6', 
          progress: 72, 
          trend: 'down',
          change: '-0.5%',
          periodLabel: 'Média Global',
          sparkline: [
            { value: 80, label: '1.50' }, { value: 75, label: '1.48' }, { value: 78, label: '1.47' }, { value: 72, label: '1.45' }, { value: 70, label: '1.44' }, { value: 74, label: '1.43' }, { value: 71, label: '1.42' }, { value: 72, label: 'Hoje: 1.42' }
          ]
        },
        { 
          id: 'caixa',
          label: 'Fluxo de Caixa', 
          value: `R$ ${(totalCash / 1000).toFixed(1)}k`, 
          icon: DollarSign, 
          color: '#f59e0b', 
          progress: 65, 
          trend: 'up',
          change: '+12.8%',
          periodLabel: 'Fluxo Mensal',
          sparkline: [
            { value: 60, label: 'R$ 12k' }, { value: 40, label: 'R$ 8k' }, { value: 70, label: 'R$ 14k' }, { value: 50, label: 'R$ 10k' }, { value: 80, label: 'R$ 16k' }, { value: 60, label: 'R$ 12k' }, { value: 90, label: 'R$ 18k' }, { value: 65, label: 'Saldo: ' + (totalCash / 1000).toFixed(1) + 'k' }
          ]
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
          periodLabel: 'Ativos em Pátio',
          sparkline: [
            { value: 30, label: 'R$ 120k' }, { value: 35, label: 'R$ 125k' }, { value: 42, label: 'R$ 130k' }, { value: 45, label: 'R$ 135k' }, { value: 48, label: 'R$ 140k' }, { value: 52, label: 'R$ 142k' }, { value: 55, label: 'R$ 145k' }, { value: 58, label: 'Agora: ' + (totalStockValue/1000).toFixed(1) + 'k' }
          ]
        },
        { 
          id: 'ebitda',
          label: 'EBITDA Projetado', 
          value: '24.8%', 
          icon: TrendingUp, 
          color: '#8b5cf6', 
          progress: 85, 
          trend: 'up',
          change: '+1.2%',
          periodLabel: 'Projeção Anual',
          sparkline: [
            { value: 80, label: '22%' }, { value: 82, label: '22.5%' }, { value: 85, label: '23%' }, { value: 88, label: '23.5%' }, { value: 90, label: '24%' }, { value: 91, label: '24.1%' }, { value: 92, label: 'Hoje: 24.8%' }
          ]
        },
        { 
          id: 'diesel',
          label: 'Eficiência Diesel', 
          value: '12.4 L/h', 
          icon: Activity, 
          color: '#ef4444', 
          progress: 45, 
          trend: 'down',
          change: '-2.1%',
          periodLabel: 'Consumo Médio',
          sparkline: [
            { value: 60, label: '14L' }, { value: 55, label: '13.5L' }, { value: 50, label: '13L' }, { value: 48, label: '12.8L' }, { value: 46, label: '12.6L' }, { value: 45, label: '12.5L' }, { value: 45, label: '12.4L' }, { value: 45, label: 'Agora: 12.4L' }
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
          value: '82.4%', 
          icon: Activity, 
          color: '#db2777', 
          progress: 82, 
          trend: 'up',
          change: '+3.1%',
          periodLabel: 'Reprodução',
          sparkline: [
            { value: 70, label: '78%' }, { value: 75, label: '79%' }, { value: 78, label: '80%' }, { value: 80, label: '81%' }, { value: 81, label: '81.5%' }, { value: 82, label: '82%' }, { value: 82, label: '82.4%' }, { value: 82, label: 'Hoje: 82.4%' }
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
        { id: 'conversao_alim', label: 'Conversão Alimentar', value: '6.2:1', icon: Activity, color: '#10b981', progress: 85, trend: 'up', change: '-2.1%', periodLabel: 'Nutrição', sparkline: [{value: 80}, {value: 82}, {value: 85}] },
        { id: 'produtividade_ha', label: 'Produtividade (@/ha)', value: '18.4 @', icon: TrendingUp, color: '#16a34a', progress: 75, trend: 'up', change: '+5.2%', periodLabel: 'Performance', sparkline: [{value: 60}, {value: 70}, {value: 75}] },
        { id: 'ciclo_engorda', label: 'Ciclo de Engorda', value: '94 dias', icon: Clock, color: '#3b82f6', progress: 90, trend: 'up', change: '-4d', periodLabel: 'Pecuária', sparkline: [{value: 95}, {value: 92}, {value: 90}] },
        { id: 'saving_compras', label: 'Saving de Compras', value: '12.4%', icon: DollarSign, color: '#10b981', progress: 88, trend: 'up', change: '+1.5%', periodLabel: 'Suprimentos', sparkline: [{value: 70}, {value: 80}, {value: 88}] },
        { id: 'lead_time', label: 'Lead Time Médio', value: '4.2 dias', icon: Clock, color: '#f59e0b', progress: 85, trend: 'up', change: '-0.5d', periodLabel: 'Suprimentos', sparkline: [{value: 90}, {value: 88}, {value: 85}] },
        { id: 'acuracidade_est', label: 'Acuracidade Estoque', value: '98.8%', icon: Settings, color: '#10b981', progress: 98, trend: 'up', change: '+0.5%', periodLabel: 'Estoque', sparkline: [{value: 95}, {value: 97}, {value: 98}] },
        { id: 'ruptura_est', label: 'Índice de Ruptura', value: '1.2%', icon: AlertCircle, color: '#ef4444', progress: 95, trend: 'up', change: '-0.8%', periodLabel: 'Estoque', sparkline: [{value: 20}, {value: 15}, {value: 10}] },
        { id: 'manutencao_hora', label: 'Custo Manutenção/h', icon: Settings, color: '#3b82f6', value: 'R$ 42,10', trend: 'down', change: '-2.5%', periodLabel: 'Frota', sparkline: [{value: 85}, {value: 80}, {value: 78}] },
        { id: 'disponibilidade_frota', label: 'Disp. de Frota', icon: Monitor, color: '#10b981', value: '92.4%', trend: 'up', change: '+2.1%', periodLabel: 'Frota', sparkline: [{value: 85}, {value: 90}, {value: 92}] },
        { id: 'margem_contribuicao', label: 'Margem Contrib.', icon: TrendingUp, color: '#8b5cf6', value: 'R$ 1.2k', trend: 'up', change: '+8.4%', periodLabel: 'Financeiro', sparkline: [{value: 60}, {value: 75}, {value: 84}] },
        { id: 'break_even', label: 'Break-even (@)', icon: Target, color: '#16a34a', value: 'R$ 172,40', trend: 'up', change: '-1.2%', periodLabel: 'Financeiro', sparkline: [{value: 95}, {value: 93}, {value: 92}] },
        { id: 'ticket_venda', label: 'Ticket Médio Venda', icon: DollarSign, color: '#f59e0b', value: 'R$ 4.2k', trend: 'up', change: '+2.5%', periodLabel: 'Vendas', sparkline: [{value: 70}, {value: 78}, {value: 82}] },
        { id: 'ebitda_operacional', label: 'EBITDA Operacional', icon: Zap, color: '#8b5cf6', value: 'R$ 152k', trend: 'up', change: '+4.5%', periodLabel: 'Financeiro', sparkline: [{value: 40}, {value: 60}, {value: 85}] },
        { id: 'burn_rate', label: 'Burn Rate / Runway', icon: Activity, color: '#f59e0b', value: '14 meses', trend: 'up', change: 'Estável', periodLabel: 'Estratégico', sparkline: [{value: 90}, {value: 85}, {value: 92}] },
        { id: 'ponto_equilibrio', label: 'Ponto de Equilíbrio', icon: Target, color: '#3b82f6', value: 'R$ 280k', trend: 'down', change: '-2.1%', periodLabel: 'Financeiro', sparkline: [{value: 50}, {value: 65}, {value: 75}] },
        { id: 'checklist_logistico', label: 'Checklist Logístico', icon: Check, color: '#10b981', value: '94%', trend: 'up', change: '+2.0%', periodLabel: 'Logística', sparkline: [{value: 80}, {value: 90}, {value: 94}] },
        { id: 'divergencia_log', label: 'Divergência de Frete', icon: AlertCircle, color: '#ef4444', value: '1.2%', trend: 'down', change: '-0.5%', periodLabel: 'Logística', sparkline: [{value: 20}, {value: 15}, {value: 12}] },
        { id: 'carbono_estoque', label: 'Estoque de Carbono', icon: Globe, color: '#059669', value: '2.4t/ha', trend: 'up', change: '+0.8', periodLabel: 'ESG', sparkline: [{value: 40}, {value: 55}, {value: 70}] },
        { id: 'compliance_amb', label: 'Compliance Amb.', icon: Shield, color: '#10b981', value: '100%', trend: 'up', change: 'Total', periodLabel: 'ESG', sparkline: [{value: 95}, {value: 100}, {value: 100}] },
        { id: 'preco_arroba', label: 'Cotação da @ (B3)', icon: TrendingUp, color: '#8b5cf6', value: 'R$ 242,50', trend: 'up', change: '+1.2%', periodLabel: 'Mercado', sparkline: [{value: 60}, {value: 75}, {value: 85}] }
      ];
      
      // Filtragem dinâmica baseada no Canvas Studio
      // Prioridade: localStorage (Live) > Perfil Pessoal > Configuração Global da Fazenda
      const savedLocal = localStorage.getItem('elite_selected_metrics');
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
      
      console.log('[Dashboard] Métricas aplicadas:', selectedIds);
      
      // Ordenar e filtrar allStats baseado na ordem de selectedIds
      const filteredStats = selectedIds
        .map((id: string) => allStats.find(s => s.id === id))
        .filter(Boolean);

      setKpiData(filteredStats);

      let weightsQuery = supabase.from('pesagens').select('peso, data_pesagem').order('data_pesagem', { ascending: true }).limit(200);
      weightsQuery = applyFarmFilter(weightsQuery);
      const { data: pesagens } = await weightsQuery;

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

<<<<<<< HEAD
      let activitiesQuery = supabase.from('pesagens').select('created_at, observacao, animais(brinco)').order('created_at', { ascending: false }).limit(4);
      activitiesQuery = applyFarmFilter(activitiesQuery);
      const { data: activities } = await activitiesQuery;
=======
      const { data: activities } = await supabase
        .from('pesagens')
        .select('created_at, observacao, animais(brinco)')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(4);
>>>>>>> 1fbbc88 (Elite ERP: Diamond Precision 5.0 - Sincronizacao Consolidada)

      setRecentActivities(activities || []);

    } catch (err) {
      console.error('Error fetching executive stats:', err);
      // Fallback to default metrics on error
      setKpiData(prev => prev.length > 4 ? prev : prev); 
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`executive-page animate-slide-up ${isTVMode ? 'tv-mode' : ''}`}>
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Zap size={14} fill="currentColor" />
            <span>ELITE INTELLIGENCE v5.0</span>
          </div>
          <h1 className="page-title">{isGlobalMode ? 'Centro de Comando Global' : 'Centro de Comando'}</h1>
          <p className="page-subtitle">Visão analítica consolidada do patrimônio e performance produtiva.</p>
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
          <EliteStatCard 
            key={kpi.id || idx}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            change={kpi.change}
            trend={kpi.trend}
            progress={kpi.progress}
            sparkline={kpi.sparkline}
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
            <EliteMainChart 
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
          <div className="elite-modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="elite-history-modal"
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
            className="elite-copilot-overlay"
          >
            <div className="copilot-header">
              <div className="c-info">
                <Sparkles size={18} />
                <span>ELITE COPILOT AI</span>
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
        <span>Elite Copilot</span>
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
        .tv-mode .elite-kpi-card {
          background: #0f172a !important;
          border-color: #1e293b !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
        }

        .tv-mode .kpi-value-elite { color: white !important; font-size: 2.4rem !important; }
        .tv-mode .kpi-label-elite { color: #94a3b8 !important; font-size: 0.9rem !important; }
        .tv-mode .ring-bg { stroke: #1e293b !important; }
        .tv-mode .kpi-divider { background: #1e293b !important; }
        .tv-mode .period-badge-elite { color: #64748b !important; }

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

        .elite-copilot-overlay {
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

        .elite-modal-overlay {
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

        .elite-history-modal {
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
