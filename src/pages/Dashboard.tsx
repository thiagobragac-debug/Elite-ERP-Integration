import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Calendar,
  Filter,
  Download,
  LayoutGrid,
  Zap,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Clock,
  ChevronDown,
  Beef,
  LandPlot
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { EliteStatCard } from '../components/Cards/EliteStatCard';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { activeFarm, tenant } = useTenant();
  const [statsData, setStatsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchDashboardStats();
  }, [activeFarm]);

  const fetchDashboardStats = async () => {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const { count: animalCount } = await supabase
        .from('animais')
        .select('*', { count: 'exact', head: true })
        .eq('fazenda_id', activeFarm.id);

      const { data: bankAccounts } = await supabase
        .from('contas_bancarias')
        .select('saldo_atual')
        .eq('tenant_id', activeFarm.tenantId);

      const totalBalance = bankAccounts?.reduce((acc, curr) => acc + Number(curr.saldo_atual), 0) || 0;

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
          value: (totalBalance / 1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + 'k', 
          icon: DollarSign, 
          color: '#f59e0b', 
          progress: 65, 
          trend: 'up',
          change: '+12.8%',
          periodLabel: 'Fluxo Mensal',
          sparkline: [
            { value: 60, label: 'R$ 12k' }, { value: 40, label: 'R$ 8k' }, { value: 70, label: 'R$ 14k' }, { value: 50, label: 'R$ 10k' }, { value: 80, label: 'R$ 16k' }, { value: 60, label: 'R$ 12k' }, { value: 90, label: 'R$ 18k' }, { value: 65, label: 'Saldo: ' + (totalBalance / 1000).toFixed(1) + 'k' }
          ]
        },
        { 
          id: 'estoque',
          label: 'Giro de Estoque', 
          value: '4.2x', 
          icon: LayoutGrid, 
          color: '#6366f1', 
          progress: 58, 
          trend: 'up',
          change: '+1.2%',
          periodLabel: 'Mensal',
          sparkline: [
            { value: 30, label: '3.1x' }, { value: 35, label: '3.3x' }, { value: 42, label: '3.6x' }, { value: 45, label: '3.8x' }, { value: 48, label: '4.0x' }, { value: 52, label: '4.1x' }, { value: 55, label: '4.2x' }, { value: 58, label: 'Agora: 4.2x' }
          ]
        },
        { 
          id: 'ebitda',
          label: 'EBITDA Projetado', 
          value: '24.2%', 
          icon: Zap, 
          color: '#8b5cf6', 
          progress: 92, 
          trend: 'up',
          change: '+0.8%',
          periodLabel: 'Projeção Anual',
          sparkline: [
            { value: 80, label: '22%' }, { value: 82, label: '22.5%' }, { value: 85, label: '23%' }, { value: 88, label: '23.5%' }, { value: 90, label: '24%' }, { value: 91, label: '24.1%' }, { value: 92, label: 'Hoje: 24.2%' }
          ]
        }
      ];

      const selectedIds = tenant?.settings?.selected_metrics || 
                          (localStorage.getItem('elite_selected_metrics') ? JSON.parse(localStorage.getItem('elite_selected_metrics')!) : ['gmd', 'lotacao', 'caixa']);
      
      const filteredStats = allStats.filter(s => selectedIds.includes(s.id));
      const sortedStats = [...filteredStats].sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));
      setStatsData(sortedStats.length > 0 ? sortedStats : allStats.slice(0, 4));

      // Fetch Real Recent Activities from audit_logs
      const { data: realLogs, error: realError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', activeFarm.tenantId)
        .order('created_at', { ascending: false })
        .limit(6);

      const finalActivities: any[] = [];

      if (!realError && realLogs) {
        realLogs.forEach(log => {
          let icon = Activity;
          if (log.entity === 'animais') icon = Beef;
          if (log.entity === 'pesagens') icon = Activity;
          if (log.entity === 'lotes') icon = LandPlot;
          if (log.entity === 'contas_pagar') icon = DollarSign;

          finalActivities.push({
            type: log.entity.toUpperCase(),
            desc: log.description || `${log.action} em ${log.entity}`,
            time: formatTimeAgo(log.created_at),
            status: log.action === 'DELETE' ? 'critical' : log.action === 'UPDATE' ? 'warning' : 'info',
            icon,
            isPredictive: false
          });
        });
      }

      // Add predictive mocks if empty or just to keep the AI feel
      if (finalActivities.length < 4) {
        finalActivities.push(
          { type: 'PROJETADO', desc: 'Troca de Pasto Sugerida - Lote 14', time: 'Em 4h', status: 'warning', icon: LandPlot, isPredictive: true },
          { type: 'PROJETADO', desc: 'Suplementação Mineral - Piquete 09', time: 'Amanhã', status: 'info', icon: Beef, isPredictive: true }
        );
      }

      setRecentActivities(finalActivities.slice(0, 4));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Há ${days}d`;
    if (hours > 0) return `Há ${hours}h`;
    return `Há ${minutes}m`;
  };


  return (
    <div className="dashboard-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <LayoutGrid size={14} fill="currentColor" />
            <span>ELITE PANORAMA v5.0</span>
          </div>
          <h1 className="page-title">Panorama Elite</h1>
          <p className="page-subtitle">Visão consolidada da operação agropecuária na unidade {activeFarm?.name} em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <Download size={18} />
            RELATÓRIO GERENCIAL
          </button>
          <button className="primary-btn">
            <Zap size={18} />
            CHECKLIST GERAL
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Activity} color="" />)
        ) : statsData.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change}
            trend={stat.trend}
            sparkline={stat.sparkline}
            periodLabel={stat.periodLabel}
          />
        ))}
      </div>

      <div className="elite-separator"></div>

      <div className="dashboard-content-grid">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="main-analytics"
        >
          <div className="modern-section-header">
            <div className="title-group">
              <Activity size={20} className="text-brand" />
              <h2>Atividade Recente</h2>
            </div>
            <button className="text-btn">
              Ver Histórico
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="activity-stack timeline-mode">
            {recentActivities.map((act, idx) => (
              <div key={idx} className={`activity-item-modern ${act.isPredictive ? 'predictive' : ''}`}>
                <div className={`icon-wrapper ${act.status}`}>
                  <act.icon size={18} />
                </div>
                <div className="activity-info">
                  <div className="top-row">
                    <span className="type-tag">{act.type}</span>
                    <span className="time-tag">
                      <Clock size={12} />
                      {act.time}
                    </span>
                  </div>
                  <p className="description">{act.desc}</p>
                  {act.isPredictive && (
                    <div className="predictive-badge">
                      <Zap size={10} />
                      IA Sugestão
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="side-analytics"
        >
          <div className="modern-section-header">
            <div className="title-group">
              <PieChart size={20} className="text-brand" />
              <h2>Ocupação de Pastagens</h2>
            </div>
          </div>
          
          <div className="occupation-preview premium-card">
            <div className="chart-mockup">
              <div className="c-circle">
                <div className="c-inner">
                  <span className="c-val">82%</span>
                  <span className="c-label">Capacidade</span>
                </div>
              </div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="dot" style={{ backgroundColor: '#10b981' }}></div>
                <span>Área em Repouso (18%)</span>
              </div>
              <div className="legend-item">
                <div className="dot" style={{ backgroundColor: '#3b82f6' }}></div>
                <span>Em Pastejo (64%)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
};
