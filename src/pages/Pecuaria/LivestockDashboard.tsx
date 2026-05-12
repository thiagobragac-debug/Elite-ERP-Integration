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
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { EliteMainChart } from '../../components/Charts/EliteMainChart';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './LivestockDashboard.css';

export const LivestockDashboard: React.FC = () => {
  const { activeFarm } = useTenant();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [operationalQueue, setOperationalQueue] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeFarm) return;
    fetchDashboardData();
  }, [activeFarm]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Real Herd Stats
      const { count: totalAnimals } = await supabase
        .from('animais')
        .select('*', { count: 'exact', head: true })
        .eq('fazenda_id', activeFarm.id);

      const { data: weights } = await supabase
        .from('pesagens')
        .select('peso, data_pesagem')
        .eq('fazenda_id', activeFarm.id)
        .order('data_pesagem', { ascending: false })
        .limit(100);

      const avgWeight = weights?.length ? weights.reduce((acc, curr) => acc + curr.peso, 0) / weights.length : 0;
      
      // 2. Fetch Active Withdrawal Alerts
      const { data: healthEvents } = await supabase
        .from('sanidade')
        .select('*')
        .eq('fazenda_id', activeFarm.id)
        .eq('status', 'REALIZADO');

      const activeWithdrawals = healthEvents?.filter(e => {
        const releaseDate = new Date(e.data_manejo);
        releaseDate.setDate(releaseDate.getDate() + (e.carencia_dias || 0));
        return releaseDate > new Date();
      }).length || 0;

      // 3. Mock Data for Demo (Real data would require more complex joins)
      setStats([
        { 
          label: 'Estoque Biológico', 
          value: `${totalAnimals || 0} Cabeças`, 
          icon: Beef, 
          color: '#10b981', 
          progress: 100,
          change: 'Rebanho Ativo',
          periodLabel: 'Total em Pátio',
          sparkline: [{value: 400}, {value: 410}, {value: 415}, {value: 420}, {value: 418}, {value: 425}]
        },
        { 
          label: 'GMD Médio (30d)', 
          value: '0.842 kg', 
          icon: TrendingUp, 
          color: '#3b82f6', 
          progress: 85, 
          trend: 'up',
          change: '+4.2%',
          periodLabel: 'Performance Global',
          sparkline: [{value: 0.72}, {value: 0.75}, {value: 0.78}, {value: 0.81}, {value: 0.842}]
        },
        { 
          label: 'Taxa de Lotação', 
          value: '1.82 UA/ha', 
          icon: PieChart, 
          color: '#f59e0b', 
          progress: 86,
          change: '+2.1%',
          periodLabel: 'Pressão de Pastejo',
          sparkline: [{value: 1.5}, {value: 1.6}, {value: 1.7}, {value: 1.82}]
        },
        { 
          label: 'Segurança Sanitária', 
          value: activeWithdrawals, 
          icon: ShieldCheck, 
          color: activeWithdrawals > 0 ? '#ef4444' : '#10b981', 
          progress: activeWithdrawals > 0 ? 30 : 100,
          change: activeWithdrawals > 0 ? 'Trava Ativa' : 'Seguro',
          periodLabel: 'Alertas de Carência',
          sparkline: [{value: 5}, {value: 8}, {value: 4}, {value: 2}, {value: activeWithdrawals}]
        }
      ]);

      setOperationalQueue([
        { id: '1', type: 'VACINA', title: 'Vacinação Aftosa', target: 'Lote Recria 01', date: 'Hoje', priority: 'high' },
        { id: '2', type: 'PESAGEM', title: 'Pesagem de Saída', target: 'Confinamento Curral A', date: 'Amanhã', priority: 'medium' },
        { id: '3', type: 'NUTRIÇÃO', title: 'Ruptura Milho Projetada', target: 'Silo Central', date: 'em 3 dias', priority: 'high' },
        { id: '4', type: 'REPRODUÇÃO', title: 'DGN (Diagnóstico)', target: 'Matrizes Primíparas', date: 'Sexta-feira', priority: 'medium' },
      ]);

      setPerformanceData([
        { label: 'Sem 01', value: 0.78 },
        { label: 'Sem 02', value: 0.82 },
        { label: 'Sem 03', value: 0.80 },
        { label: 'Sem 04', value: 0.85 },
        { label: 'Sem 05', value: 0.88 },
        { label: 'Sem 06', value: 0.842 },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="livestock-dashboard animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Zap size={14} fill="currentColor" />
            <span>ELITE LIVESTOCK INTELLIGENCE</span>
          </div>
          <h1 className="page-title">Intelligence Hub</h1>
          <p className="page-subtitle">Visão 360º da performance biológica, sanitária e nutricional do rebanho.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={fetchDashboardData}>
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
        ) : stats.map((stat, idx) => (
          <EliteStatCard key={idx} {...stat} />
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
            <EliteMainChart 
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
              {operationalQueue.map((item) => (
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
              <span className="m-value">82.4%</span>
              <div className="m-trend"><ArrowUpRight size={12} /> 3.1%</div>
            </div>
            <div className="mini-card warning">
              <span className="m-label">Autonomia Silo</span>
              <span className="m-value">12 dias</span>
              <div className="m-trend text-warning">Risco de Ruptura</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
