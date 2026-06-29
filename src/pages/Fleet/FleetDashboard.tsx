import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Settings,
  Zap,
  Droplets,
  Clock,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Activity,
  ChevronRight,
  BarChart3,
  Calendar,
  Wrench,
  Gauge,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

function buildSparkline(
  records: any[],
  dateField: string,
  valueField: string | null,
  buckets = 7
): { value: number; label: string }[] {
  if (!records || records.length === 0) {
    return [];
  }
  const sorted = [...records]
    .filter((r) => r[dateField])
    .sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) {
    return [];
  }
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter((r) => {
      const t = new Date(r[dateField]).getTime();
      return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd;
    });
    const v =
      inBucket.length === 0
        ? 0
        : valueField
          ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0)
          : inBucket.length;
    return {
      value: Number(v.toFixed(2)),
      label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
    };
  });
}

export const FleetDashboard: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, activeTenantId } =
    useFarmFilter();

  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['fleet_dashboard', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      const queries = [
        applyFarmFilter(
          supabase.from('maquinas').select('id, nome, tipo, placa, status, created_at').eq('tenant_id', activeTenantId).limit(500)
        ),
        applyFarmFilter(
          supabase
            .from('abastecimentos')
            .select('*, maquinas(nome)').eq('tenant_id', activeTenantId)
            .order('data', { ascending: false })
            .limit(5)
        ),
        applyFarmFilter(
          supabase
            .from('manutencao_frota')
            .select('*, maquinas(nome)').eq('tenant_id', activeTenantId)
            .order('data_inicio', { ascending: false })
            .limit(5)
        ),
        supabase.rpc('calculate_fleet_consumption', {
          p_tenant_id: activeTenantId || '',
          p_fazenda_id: isGlobalMode ? null : activeFarmId,
        }),
        applyFarmFilter(supabase.from('manutencao_frota').select('custo, maquina_id, status').eq('tenant_id', activeTenantId)),
      ];

      const [machRes, fuelRes, maintRes, consumptionRes, maintStatsRes] =
        await Promise.all(queries);

      if (machRes.error) {
        throw machRes.error;
      }
      if (fuelRes.error) {
        throw fuelRes.error;
      }
      if (maintRes.error) {
        throw maintRes.error;
      }
      if (maintStatsRes.error) {
        throw maintStatsRes.error;
      }

      // Transform machines to include missing fields for UI
      const transformedMachines = (machRes.data || []).map((m: any) => ({
        ...m,
        modelo: m.tipo || 'Maquinário',
        ano: 'N/A',
        status: m.status || 'active',
        hodometro: 0,
      }));

      return {
        machines: transformedMachines,
        fuelings: fuelRes.data || [],
        maintenance: maintRes.data || [],
        consumption: consumptionRes.data || { total_litros: 0, total_custo: 0, media_litros: 0 },
        maintStats: maintStatsRes.data || [],
      };
    },
    enabled: isGlobalMode ? !!activeTenantId : !!activeFarmId,
  });

  const criticalMachines = useMemo(() => {
    if (!dashboardData) {
      return [];
    }
    const { machines, maintStats } = dashboardData;
    // Identificar máquinas em manutenção ativa
    const inMaintIds = new Set(
      maintStats
        .filter(
          (m: any) =>
            m.status !== 'CONCLUIDO' && m.status !== 'completed' && m.status !== 'FINALIZADO'
        )
        .map((m: any) => m.maquina_id)
    );
    return machines.filter((m: any) => inMaintIds.has(m.id)).slice(0, 4);
  }, [dashboardData]);

  const recentActivities = useMemo(() => {
    if (!dashboardData) {
      return [];
    }
    const { fuelings, maintenance } = dashboardData;
    return [
      ...(fuelings || []).map((f: any) => ({
        type: 'fuel',
        date: f.data,
        title: `Abastecimento: ${f.maquinas?.nome || 'Equipamento'}`,
        subtitle: `${f.litros}L`,
        value: `R$ ${f.valor_total}`,
      })),
      ...(maintenance || []).map((m: any) => ({
        type: 'maint',
        date: m.data_inicio,
        title: `Manutenção: ${m.maquinas?.nome || 'Equipamento'}`,
        subtitle: m.descricao || 'Reparo Geral',
        value: m.status === 'CONCLUIDO' || m.status === 'completed' ? 'Finalizada' : 'Em Aberto',
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [dashboardData]);

  const stats = useMemo(() => {
    if (!dashboardData) {
      return [
        {
          label: 'Disponibilidade Real',
          value: '---',
          icon: Truck,
          color: 'hsl(var(--brand))',
          progress: 0,
          trend: 'none' as const,
          change: 'Processando...',
          sparkline: [],
        },
        {
          label: 'Custo Total Frota (TCO)',
          value: '---',
          icon: DollarSign,
          color: '#ef4444',
          progress: 0,
          trend: 'none' as const,
          change: 'Processando...',
          periodLabel: 'Custo Acumulado',
          sparkline: [],
        },
        {
          label: 'MTBF (Confiabilidade)',
          value: '---',
          icon: Zap,
          color: '#10b981',
          progress: 0,
          trend: 'none' as const,
          change: 'Processando...',
          periodLabel: 'Ciclo Falhas',
          sparkline: [],
        },
        {
          label: 'Eficiência Diesel',
          value: '---',
          icon: Droplets,
          color: '#f59e0b',
          progress: 0,
          trend: 'none' as const,
          change: 'Processando...',
          periodLabel: 'Consumo Médio',
          sparkline: [],
        },
      ];
    }
    const { machines, fuelings, maintenance, consumption, maintStats } = dashboardData;
    const total = machines.length;

    const inMaintIds = new Set(
      maintStats
        .filter(
          (m: any) =>
            m.status !== 'CONCLUIDO' && m.status !== 'completed' && m.status !== 'FINALIZADO'
        )
        .map((m: any) => m.maquina_id)
    );

    const inField = machines.filter(
      (m: any) => m.status === 'ATIVO' && !inMaintIds.has(m.id)
    ).length;
    const availability = total > 0 ? (inField / total) * 100 : 0;

    const totalFuelCost = Number(consumption?.total_custo || 0);
    const totalMaintCost = maintStats.reduce(
      (acc: number, cur: any) => acc + Number(cur.custo || 0),
      0
    );
    const totalTCO = totalFuelCost + totalMaintCost;

    const failures = maintStats.length;
    const mtbf = failures > 0 ? Math.round((total * 720) / failures) : 0;

    const avgDiesel = Number(consumption?.media_litros || 0);

    return [
      {
        label: 'Disponibilidade Real',
        value: availability > 0 ? `${availability.toFixed(1)}%` : '---',
        icon: Truck,
        color: 'hsl(var(--brand))',
        progress: availability,
        trend: 'none' as const,
        change: availability > 0 ? 'Uptime calculated' : 'Sem dados',
        periodLabel: 'Uptime',
        sparkline: buildSparkline(machines, 'created_at', null),
      },
      {
        label: 'Custo Total Frota (TCO)',
        value: totalTCO > 0 ? `R$ ${(totalTCO / 1000).toFixed(1)}k` : '---',
        icon: DollarSign,
        color: '#ef4444',
        progress: totalTCO > 0 ? Math.min(100, (totalTCO / 500000) * 100) : 0,
        trend: totalTCO > 0 ? 'up' : 'none',
        change: totalTCO > 0 ? 'Combustível + Oficina' : 'Sem custos registrados',
        periodLabel: 'Custo Acumulado',
        sparkline: buildSparkline(fuelings, 'data', 'valor_total'),
      },
      {
        label: 'MTBF (Confiabilidade)',
        value: mtbf > 0 ? `${mtbf}h` : '---',
        icon: Zap,
        color: '#10b981',
        progress: mtbf > 0 ? Math.min(100, (mtbf / 1000) * 100) : 0,
        trend: mtbf > 0 ? 'up' : 'none',
        change: mtbf > 0 ? `${failures} ocorrências registradas` : 'Sem manutenções',
        periodLabel: 'Ciclo Falhas',
        sparkline: buildSparkline(maintenance, 'data_inicio', 'custo'),
      },
      {
        label: 'Eficiência Diesel',
        value: avgDiesel > 0 ? `${avgDiesel.toFixed(1)} L/abast.` : '---',
        icon: Droplets,
        color: '#f59e0b',
        progress: avgDiesel > 0 ? Math.min(100, (avgDiesel / 200) * 100) : 0,
        trend: avgDiesel > 0 ? 'up' : 'none',
        change: avgDiesel > 0 ? 'Média real de abastecimentos' : 'Sem abastecimentos',
        periodLabel: 'Consumo Médio',
        sparkline: buildSparkline(fuelings, 'data', 'litros'),
      },
    ];
  }, [dashboardData]);

  return (
    <div className="fleet-hub animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Frota & Máquinas', href: '/frota/dashboard' },
              { label: 'Intelligence Hub' },
            ]}
          />
          <h1 className="page-title">Intelligence Hub</h1>
          <p className="page-subtitle">
            Central de comando para monitoramento de custos, telemetria e disponibilidade mecânica.
          </p>
        </div>
        <div className="page-actions">
          <button className="glass-btn primary">
            <BarChart3 size={18} />
            RELATÓRIO TCO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : stats.map((stat, idx) => (
              <TauzeStatCard
                key={idx}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                progress={stat.progress}
                change={stat.change}
                periodLabel={stat.periodLabel}
                sparkline={stat.sparkline}
                trend={stat.trend === 'up' || stat.trend === 'down' ? stat.trend : undefined}
              />
            ))}
      </div>

      <div className="fleet-hub-grid">
        {/* Left: Health Monitor */}
        <section className="hub-section main-panel">
          <div className="section-header">
            <div className="title-group">
              <Activity size={20} className="section-icon" />
              <h3>Monitor de Saúde da Frota</h3>
            </div>
            <span className="header-meta">Manutenção Preditiva</span>
          </div>

          <div className="critical-assets-grid">
            {criticalMachines.length > 0 ? (
              criticalMachines.map((m: any) => (
                <div key={m.id} className="asset-health-card">
                  <div className="asset-header">
                    <div className="asset-icon">
                      <Truck size={24} />
                    </div>
                    <div className="asset-name-group">
                      <h4>{m.nome}</h4>
                      <span>{m.modelo || 'Maquinário'}</span>
                    </div>
                  </div>

                  <div className="health-status-bar">
                    <div className="bar-label">
                      <span>Revisão {m.intervalo_revisao || 250}h</span>
                      <span className="urgent">Urgente</span>
                    </div>
                    <div className="bar-progress-bg">
                      {(() => {
                        const current = m.horimetro_atual || 0;
                        const interval = m.intervalo_revisao || 250;
                        const remaining = interval - (current % interval);
                        const progress = ((interval - remaining) / interval) * 100;
                        return (
                          <motion.div
                            className="bar-progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            style={{ backgroundColor: '#ef4444' }}
                          />
                        );
                      })()}
                    </div>
                    <div className="bar-footer">
                      <span>{m.horimetro_atual}h atuais</span>
                      <span className="remaining-text">Atraso Crítico</span>
                    </div>
                  </div>

                  <div className="asset-card-actions">
                    <button className="asset-btn">ABRIR O.S.</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-health">
                <CheckCircle2 size={32} />
                <p>Toda a frota operando dentro dos parâmetros de revisão.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right: Operational Activity */}
        <section className="hub-section side-panel">
          <div className="section-header">
            <div className="title-group">
              <Clock size={20} className="section-icon" />
              <h3>Atividade Operacional</h3>
            </div>
          </div>

          <div className="activity-list">
            {recentActivities.length === 0 && (
              <div className="text-center py-4 text-xs font-bold text-slate-400">
                Nenhuma atividade recente
              </div>
            )}
            {recentActivities.map((act, i) => (
              <div key={i} className="activity-item-tauze">
                <div className={`act-icon-wrapper ${act.type}`}>
                  {act.type === 'fuel' ? <Droplets size={16} /> : <Wrench size={16} />}
                </div>
                <div className="act-content">
                  <div className="act-main-row">
                    <span className="act-title">{act.title}</span>
                    <span className="act-value">{act.value}</span>
                  </div>
                  <div className="act-meta-row">
                    <span>{act.subtitle}</span>
                    <span>•</span>
                    <span>{new Date(act.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="view-all-btn">
            VER LOG COMPLETO
            <ChevronRight size={16} />
          </button>
        </section>
      </div>

      <style>{`
        .fleet-hub {
        }

        .next-gen-kpi-grid {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 20px !important;
          margin-bottom: 32px !important;
          width: 100% !important;
        }

        @media (max-width: 1024px) {
          .next-gen-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .next-gen-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }

        .fleet-hub-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }

        .hub-section {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-icon {
          color: hsl(var(--brand));
        }

        .section-header h3 {
          font-size: 18px;
          font-weight: 800;
          color: hsl(var(--text-main));
          letter-spacing: -0.02em;
        }

        .header-meta {
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.1);
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
        }

        .critical-assets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .asset-health-card {
          background: hsl(var(--bg-main) / 0.3);
          border-radius: 20px;
          border: 1px solid hsl(var(--border));
          padding: 20px;
          transition: 0.2s;
        }

        .asset-health-card:hover {
          border-color: #ef444444;
          transform: translateY(-4px);
        }

        .asset-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .asset-icon {
          width: 48px;
          height: 48px;
          background: #0f172a;
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .asset-name-group h4 {
          font-size: 15px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin: 0;
        }

        .asset-name-group span {
          font-size: 11px;
          color: hsl(var(--text-muted));
          font-weight: 600;
        }

        .health-status-bar {
          margin-bottom: 16px;
        }

        .bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .urgent {
          color: #ef4444;
        }

        .bar-progress-bg {
          height: 8px;
          background: hsl(var(--border));
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .bar-progress-fill {
          height: 100%;
          border-radius: 4px;
        }

        .bar-footer {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          color: hsl(var(--text-muted));
        }

        .remaining-text {
          color: #ef4444;
        }

        .asset-card-actions {
          display: flex;
          gap: 12px;
        }

        .asset-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: none;
          background: #ef444415;
          color: #ef4444;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
        }

        .asset-btn:hover {
          background: #ef4444;
          color: white;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item-tauze {
          display: flex;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid hsl(var(--border));
        }

        .activity-item-tauze:last-child {
          border-bottom: none;
        }

        .act-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .act-icon-wrapper.fuel {
          background: #f59e0b15;
          color: #f59e0b;
        }

        .act-icon-wrapper.maint {
          background: #3b82f615;
          color: #3b82f6;
        }

        .act-content {
          flex: 1;
        }

        .act-main-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .act-title {
          font-size: 13px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }

        .act-value {
          font-size: 12px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }

        .act-meta-row {
          display: flex;
          gap: 8px;
          font-size: 11px;
          color: hsl(var(--text-muted));
          font-weight: 600;
        }

        .view-all-btn {
          width: 100%;
          margin-top: 24px;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-main) / 0.5);
          color: hsl(var(--text-main));
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.2s;
        }

        .view-all-btn:hover {
          background: hsl(var(--bg-card));
          border-color: hsl(var(--brand));
          color: hsl(var(--brand));
        }

        @media (max-width: 1200px) {
          .fleet-hub-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
