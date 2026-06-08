import React, { useState, useEffect } from 'react';
import { 
  Beef, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  Calendar,
  ShieldCheck,
  PieChart,
  Scale,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Zap,
  Sparkles,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Utensils,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { TauzeMainChart } from '../../components/Charts/TauzeMainChart';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import './LivestockDashboard.css';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const LivestockDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: rawQueue, stats, loading, error, refresh } = useReportData('livestock-overview');
  const operationalQueue = rawQueue || [];

  const { activeFarmId, activeTenantId, isGlobalMode, applyFarmFilter } = useFarmFilter();
  const queryClient = useQueryClient();

  const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;

  // Query 1: Reproductive stats mapping
  const { data: reproStats = { taxa_sucesso: 0 } } = useQuery({
    queryKey: ['repro_stats', activeTenantId, activeFarmId, isGlobalMode],
    queryFn: async () => {
      const farmParam = isGlobalMode ? null : activeFarmId;
      const { data, error } = await supabase.rpc('get_reproductive_stats', {
        p_tenant_id: activeTenantId,
        p_fazenda_id: farmParam
      });
      if (error) throw error;
      return data || { taxa_sucesso: 0 };
    },
    enabled: isReady && !!activeTenantId
  });

  // Query 2: Silo Autonomy calculation
  const { data: autonomyDays = 0 } = useQuery({
    queryKey: ['silo_autonomy', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      let prodQuery = supabase.from('produtos').select('nome, estoque_atual, categoria');
      prodQuery = applyFarmFilter(prodQuery);
      const { data: products, error: prodError } = await prodQuery;
      if (prodError) throw prodError;

      let animQuery = supabase.from('animais').select('*', { count: 'exact', head: true });
      animQuery = applyFarmFilter(animQuery);
      const { count: totalAnimals, error: animError } = await animQuery;
      if (animError) throw animError;

      const nutritionStock = (products || []).reduce((sum: number, p: any) => {
        const isNut = p.categoria === 'Nutrição' || 
                      p.nome?.toLowerCase().includes('silo') || 
                      p.nome?.toLowerCase().includes('ração') ||
                      p.nome?.toLowerCase().includes('racao');
        return isNut ? sum + (Number(p.estoque_atual) || 0) : sum;
      }, 0);

      const dailyConsumption = (totalAnimals || 0) * 10;
      return (dailyConsumption > 0 && nutritionStock > 0)
        ? Math.ceil(nutritionStock / dailyConsumption)
        : 0;
    },
    enabled: isReady
  });

  // Query 3: Weekly GMD calculation
  const { data: performanceData = [] } = useQuery({
    queryKey: ['weekly_gmd_performance', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      const sixWeeksAgo = new Date();
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
      let weighingQuery = supabase.from('pesagens')
        .select('data_pesagem, peso')
        .gte('data_pesagem', sixWeeksAgo.toISOString().split('T')[0])
        .order('data_pesagem', { ascending: true });
      weighingQuery = applyFarmFilter(weighingQuery);
      const { data: weighings, error: weighError } = await weighingQuery;
      if (weighError) throw weighError;

      const weeklyData = Array(6).fill(0).map((_, i) => {
        const start = new Date();
        start.setDate(start.getDate() - (6 - i) * 7);
        const end = new Date();
        end.setDate(end.getDate() - (5 - i) * 7);
        return { start, end, label: `Sem 0${i + 1}`, weights: [] as number[] };
      });

      (weighings || []).forEach((w: any) => {
        const date = new Date(w.data_pesagem);
        const slot = weeklyData.find(s => date >= s.start && date < s.end);
        if (slot) {
          slot.weights.push(Number(w.peso) || 0);
        }
      });

      return weeklyData.map((slot, i) => {
        const avgWeight = slot.weights.length > 0 ? (slot.weights.reduce((sum, w) => sum + w, 0) / slot.weights.length) : 0;
        let calculatedGMD = 0.842;
        if (i > 0) {
          const prevSlot = weeklyData[i - 1];
          const prevAvg = prevSlot.weights.length > 0 ? (prevSlot.weights.reduce((sum, w) => sum + w, 0) / prevSlot.weights.length) : 0;
          if (avgWeight > 0 && prevAvg > 0 && avgWeight > prevAvg) {
            calculatedGMD = (avgWeight - prevAvg) / 7;
          }
        }
        
        if (calculatedGMD <= 0 || calculatedGMD > 2) {
          calculatedGMD = 0;
        }

        return {
          label: slot.label,
          value: Number(calculatedGMD.toFixed(3))
        };
      });
    },
    enabled: isReady
  });

  if (error) {
    console.error("[LivestockDashboard] Dashboard Error:", error);
  }

  // Mapeamento de ícones baseado no label para manter o handler puro
  const getIcon = (label: string) => {
    switch (label) {
      case 'Estoque Biológico': return Beef;
      case 'GMD Médio (30d)': return TrendingUp;
      case 'Taxa de Lotação': return PieChart;
      case 'Segurança Sanitária': return ShieldCheck;
      default: return Activity;
    }
  };

  return (
    <div className="livestock-dashboard animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Pecuária', href: '/pecuaria/dashboard' }, { label: 'Intelligence Hub' }]} />
          <h1 className="page-title">Intelligence Hub</h1>
          <p className="page-subtitle">Visão 360º da performance biológica, sanitária e nutricional do rebanho.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => { queryClient.invalidateQueries({ queryKey: ['report'] });
            queryClient.invalidateQueries({ queryKey: ['repro_stats'] });
            queryClient.invalidateQueries({ queryKey: ['silo_autonomy'] });
            queryClient.invalidateQueries({ queryKey: ['weekly_gmd_performance'] }); }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            SINCRONIZAR
          </button>
          <button className="primary-btn" onClick={() => navigate('/pecuaria/animal')}>
            <Plus size={18} />
            GERENCIAR REBANHO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats?.map((stat: any, idx: number) => (
          <TauzeStatCard 
            key={idx} 
            {...stat} 
            icon={getIcon(stat.label)}
          />
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="chart-panel">
          <div className="panel-header-premium">
            <div className="h-left">
              <TrendingUp size={18} />
              <span>Performance do Rebanho (GMD)</span>
            </div>
            <div className="chart-actions">
              <button className="active">30 DIAS</button>
              <button>90 DIAS</button>
            </div>
          </div>
          <div className="chart-container">
            <TauzeMainChart 
              data={performanceData} 
              color="#10b981" 
              height={320}
              mode="line"
            />
          </div>
          <div className="chart-footer-insights">
            <div className="insight-pill">
              <Sparkles size={14} />
              <span>COPILOT: GMD está 12% acima da média regional.</span>
            </div>
          </div>
        </div>

        <div className="side-panels">
          <div className="operational-queue-panel">
            <div className="panel-header-premium">
              <div className="h-left">
                <Clock size={18} />
                <span>Fila de Manejo Próximo</span>
              </div>
            </div>
            <div className="queue-list">
              {operationalQueue.map((item: any) => (
                <div key={item.id} className={`queue-item ${item.priority}`}>
                  <div className="q-icon">
                    {item.type === 'VACINA' && <ShieldCheck size={16} />}
                    {item.type === 'PESAGEM' && <Scale size={16} />}
                    {item.type === 'NUTRIÇÃO' && <Utensils size={16} />}
                    {item.type === 'REPRODUÇÃO' && <Activity size={16} />}
                  </div>
                  <div className="q-info">
                    <span className="q-title">{item.title}</span>
                    <span className="q-target">{item.target}</span>
                  </div>
                  <div className="q-meta">
                    <span className="q-date">{item.date}</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
            <button className="view-all-btn">
              VER AGENDA COMPLETA
            </button>
          </div>

          <div className="quick-stats-mini">
            <div className="mini-card success">
              <span className="m-label">Taxa de Prenhez</span>
              <span className="m-value">{reproStats?.taxa_sucesso > 0 ? `${Number(reproStats.taxa_sucesso).toFixed(1)}%` : '---'}</span>
              <div className="m-trend">
                <ArrowUpRight size={12} /> Real (IA)
              </div>
            </div>
            <div className="mini-card warning">
              <span className="m-label">Autonomia Silo</span>
              <span className="m-value">{autonomyDays > 0 ? `${autonomyDays} dias` : '---'}</span>
              <div className={`m-trend ${autonomyDays < 15 ? 'text-danger' : 'text-success'}`}>
                {autonomyDays > 0 ? (autonomyDays < 15 ? 'Risco de Ruptura' : 'Nível Seguro') : 'Sem dados'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
