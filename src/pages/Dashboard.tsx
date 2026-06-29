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
  LandPlot,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useFarmFilter } from '../hooks/useFarmFilter';
import { useReportData } from '../hooks/useReportData';
import { TauzeStatCard } from '../components/Cards/TauzeStatCard';
import './Dashboard.css';
import { Breadcrumb } from '../components/Navigation/Breadcrumb';

export const Dashboard: React.FC = () => {
  const { activeFarm } = useFarmFilter();
  const report = useReportData('panorama-overview');

  const recentActivities = report?.data || [];
  const statsData = report?.stats || [];
  const loading = report?.loading || false;
  const error = report?.error || null;

  if (error) {
    console.error('[Dashboard] Panorama Error:', error);
  }

  // Mapeamento dinâmico de ícones para Atividades Recentes
  const getActivityIcon = (entity: string) => {
    switch (entity?.toLowerCase()) {
      case 'animais':
        return Beef;
      case 'lotes':
        return LandPlot;
      case 'contas_pagar':
      case 'contas_receber':
        return DollarSign;
      default:
        return Activity;
    }
  };

  // Mapeamento de ícones para KPIs
  const getStatIcon = (id: string) => {
    switch (id) {
      case 'gmd':
        return Activity;
      case 'lotacao':
        return PieChart;
      case 'caixa':
        return DollarSign;
      case 'rebanho':
        return Beef;
      default:
        return Zap;
    }
  };

  return (
    <div className="dashboard-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Tauze Bovinocultura' }, { label: 'Panorama Tauze' }]} />
          <h1 className="page-title">Panorama Tauze</h1>
          <p className="page-subtitle">
            Visão consolidada da operação agrobovinocultura na unidade {(activeFarm as { name?: string })?.name || 'Global'} em
            tempo real.
          </p>
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
          Array(4)
            .fill(0)
            .map((_, i) => (
              <TauzeStatCard
                key={i}
                loading={true}
                label=""
                value=""
                icon={Activity}
                color=""
                periodLabel="Mês Atual"
              />
            ))
        ) : statsData && statsData.length > 0 ? (
          statsData.map((stat: any, idx: number) => (
            <TauzeStatCard key={idx} {...stat} icon={getStatIcon(stat?.id)} />
          ))
        ) : (
          <div className="p-8 text-center bg-white/50 rounded-3xl border border-dashed border-slate-300 w-full col-span-4">
            <p className="text-slate-500 font-medium italic">Aguardando dados da operação...</p>
          </div>
        )}
      </div>

      <div className="tauze-separator" />

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
            {recentActivities?.map((act: any, idx: number) => {
              const Icon = getActivityIcon(act.entity);
              return (
                <div
                  key={idx}
                  className={`activity-item-modern ${act.isPredictive ? 'predictive' : ''}`}
                >
                  <div className={`icon-wrapper ${act.status}`}>
                    <Icon size={18} />
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
              );
            })}
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
                <div className="dot" style={{ backgroundColor: '#10b981' }} />
                <span>Área em Repouso (18%)</span>
              </div>
              <div className="legend-item">
                <div className="dot" style={{ backgroundColor: '#3b82f6' }} />
                <span>Em Pastejo (64%)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
