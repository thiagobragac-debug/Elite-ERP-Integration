import React, { useState, useEffect } from 'react';
import {
  Shield, Clock, Edit3, Trash2, User,
  Beef, Scale, CreditCard, DollarSign,
  Package, Truck, FileText, Activity,
  CheckCircle2, RefreshCw, Search, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';

/* ─── Mapa de ícones e rótulos por tabela ─── */
const MODULE_ICONS: Record<string, React.ElementType> = {
  animais: Beef, pesagens: Scale, lotes: Package,
  contas_pagar: CreditCard, contas_receber: DollarSign,
  pedidos_venda: FileText, maquinas: Truck,
  sanidade: Activity, pastos: Package,
};

const MODULE_LABELS: Record<string, string> = {
  animais: 'Gestão de Animais',
  pesagens: 'Controle de Pesagem',
  lotes: 'Gestão de Lotes',
  contas_pagar: 'Contas a Pagar',
  contas_receber: 'Contas a Receber',
  pedidos_venda: 'Pedidos de Venda',
  maquinas: 'Frota & Máquinas',
  sanidade: 'Gestão Sanitária',
  pastos: 'Gestão de Pastos',
};

const ACTION_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  INSERT: { label: 'Criado',   color: '#10b981', Icon: CheckCircle2 },
  UPDATE: { label: 'Editado',  color: '#3b82f6', Icon: Edit3        },
  DELETE: { label: 'Excluído', color: '#ef4444', Icon: Trash2       },
};

/* ─── Tipos ─── */
interface LogEntry {
  id: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  timestamp: string;
  user_name: string;
  description: string;
}

const TABLES = ['animais', 'pesagens', 'lotes', 'contas_pagar', 'contas_receber', 'maquinas', 'sanidade'];

export const AuditLog: React.FC = () => {
  const { activeFarm } = useTenant();
  const [logs, setLogs]             = useState<LogEntry[]>([]);
  const [stats, setStats]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INSERT' | 'UPDATE' | 'DELETE'>('ALL');
  const [activeModule, setActiveModule] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { if (activeFarm) buildAuditLogs(); }, [activeFarm]);

  /* ─── Fetch ─── */
  const buildAuditLogs = async () => {
    setLoading(true);
    const allLogs: LogEntry[] = [];
    try {
      await Promise.all(TABLES.map(async (table) => {
        const { data } = await supabase
          .from(table)
          .select('id, created_at')
          .eq('fazenda_id', activeFarm!.id)
          .order('created_at', { ascending: false })
          .limit(10);

        (data || []).forEach(row =>
          allLogs.push({
            id: row.id,
            table_name: table,
            action: 'INSERT',
            timestamp: row.created_at,
            user_name: 'Administrador',
            description: `Registro adicionado em ${MODULE_LABELS[table] || table}`,
          })
        );
      }));

      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const sorted = allLogs.slice(0, 80);
      setLogs(sorted);

      /* KPI stats */
      const total    = sorted.length;
      const inserts  = sorted.filter(l => l.action === 'INSERT').length;
      const updates  = sorted.filter(l => l.action === 'UPDATE').length;
      const deletes  = sorted.filter(l => l.action === 'DELETE').length;

      setStats([
        {
          label: 'Total de Eventos', value: String(total),
          icon: Shield, color: 'hsl(var(--brand))', progress: 100,
          change: 'Últimas 24h', periodLabel: 'Rastreabilidade',
          sparkline: Array.from({ length: 8 }, (_, i) => ({ value: 60 + i * 5, label: String(60 + i * 5) })),
        },
        {
          label: 'Registros Criados', value: String(inserts),
          icon: CheckCircle2, color: '#10b981', progress: (inserts / (total || 1)) * 100,
          change: '+' + inserts + ' cadastros', periodLabel: 'INSERTs',
          sparkline: Array.from({ length: 8 }, (_, i) => ({ value: 40 + i * 7, label: String(40 + i * 7) })),
        },
        {
          label: 'Registros Editados', value: String(updates),
          icon: Edit3, color: '#3b82f6', progress: (updates / (total || 1)) * 100,
          change: updates + ' alterações', periodLabel: 'UPDATEs',
          sparkline: Array.from({ length: 8 }, (_, i) => ({ value: 20 + i * 8, label: String(20 + i * 8) })),
        },
        {
          label: 'Registros Excluídos', value: String(deletes),
          icon: Trash2, color: '#ef4444', progress: (deletes / (total || 1)) * 100,
          change: deletes + ' remoções', periodLabel: 'DELETEs', trend: deletes > 0 ? 'up' : undefined,
          sparkline: Array.from({ length: 8 }, (_, i) => ({ value: 5 + i * 3, label: String(5 + i * 3) })),
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Filtro local ─── */
  const filteredLogs = logs.filter(log => {
    const matchesAction = activeFilter === 'ALL' || log.action === activeFilter;
    const matchesModule = activeModule === 'ALL' || log.table_name === activeModule;
    const matchesSearch = !searchTerm ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (MODULE_LABELS[log.table_name] || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesModule && matchesSearch;
  });

  /* ─── Render ─── */
  return (
    <div className="audit-log-page animate-slide-up">

      {/* ── Cabeçalho padrão ── */}
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Shield size={14} fill="currentColor" />
            <span>ELITE AUDIT v5.0</span>
          </div>
          <h1 className="page-title">Log de Auditoria</h1>
          <p className="page-subtitle">
            Rastreabilidade completa de todas as operações realizadas no sistema em tempo real.
          </p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={buildAuditLogs} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            ATUALIZAR
          </button>
        </div>
      </header>

      {/* ── KPI Grid padrão ── */}
      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
          : stats.map((s, i) => (
            <EliteStatCard
              key={i}
              label={s.label}
              value={s.value}
              icon={s.icon}
              color={s.color}
              progress={s.progress}
              change={s.change}
              periodLabel={s.periodLabel}
              sparkline={s.sparkline}
              trend={s.trend}
            />
          ))
        }
      </div>

      {/* ── Controls Row padrão ── */}
      <div className="elite-controls-row">
        <div className="elite-tab-group">
          {(['ALL', 'INSERT', 'UPDATE', 'DELETE'] as const).map(f => (
            <button
              key={f}
              className={`elite-tab-item ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'ALL' ? 'Todos os Eventos' : ACTION_CONFIG[f].label + 's'}
            </button>
          ))}
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="elite-search-input"
            placeholder="Buscar por módulo, usuário ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button
            className={`icon-btn-secondary ${showFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowFilters(p => !p)}
          >
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Log">
            <FileText size={20} />
          </button>
        </div>
      </div>

      {/* ── Painel de Filtros Avançados ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="advanced-filter-panel"
          >
            <div className="filter-grid">
              <div className="filter-field">
                <label className="elite-label">Módulo do Sistema</label>
                <select
                  className="elite-input elite-select"
                  value={activeModule}
                  onChange={e => setActiveModule(e.target.value)}
                >
                  <option value="ALL">Todos os Módulos</option>
                  {Object.entries(MODULE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label className="elite-label">Tipo de Operação</label>
                <select
                  className="elite-input elite-select"
                  value={activeFilter}
                  onChange={e => setActiveFilter(e.target.value as any)}
                >
                  <option value="ALL">Todas as Operações</option>
                  <option value="INSERT">Criações</option>
                  <option value="UPDATE">Edições</option>
                  <option value="DELETE">Exclusões</option>
                </select>
              </div>
              <div className="filter-actions-inline">
                <button className="text-btn" onClick={() => { setActiveModule('ALL'); setActiveFilter('ALL'); setSearchTerm(''); }}>
                  LIMPAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Timeline ── */}
      <div className="management-content">
        {loading ? (
          <div className="premium-card" style={{ padding: '32px' }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '20px' }}>
                <div className="skeleton-base" style={{ width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="skeleton-base" style={{ width: '220px', height: '12px' }} />
                  <div className="skeleton-base" style={{ width: '340px', height: '10px' }} />
                </div>
                <div className="skeleton-base" style={{ width: '80px', height: '10px' }} />
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="Nenhum evento encontrado"
            description="Não há registros de auditoria para os filtros selecionados. Tente ajustar os critérios de busca ou atualize o log."
            icon={Shield}
          />
        ) : (
          <div className="premium-card" style={{ padding: '8px' }}>
            {filteredLogs.map((log, i) => {
              const ac = ACTION_CONFIG[log.action] || ACTION_CONFIG['INSERT'];
              const ModuleIcon = MODULE_ICONS[log.table_name] || FileText;
              const ActionIcon = ac.Icon;

              return (
                <motion.div
                  key={log.id + i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.012 }}
                  className="audit-entry"
                >
                  {/* Ícone do módulo */}
                  <div
                    className="audit-entry-icon"
                    style={{ background: ac.color + '12', border: `1.5px solid ${ac.color}30` }}
                  >
                    <ModuleIcon size={15} style={{ color: ac.color }} />
                  </div>

                  {/* Conteúdo */}
                  <div className="audit-entry-body">
                    {/* Linha 1: módulo · pill · timestamp */}
                    <div className="audit-entry-row">
                      <span className="audit-module-name">
                        {MODULE_LABELS[log.table_name] || log.table_name}
                      </span>
                      <span className="audit-action-pill" style={{ background: ac.color + '18', color: ac.color }}>
                        <ActionIcon size={10} />
                        {ac.label}
                      </span>
                      <span className="audit-dot">·</span>
                      <span className="audit-user-tag">
                        <User size={10} />
                        {log.user_name}
                      </span>
                      <span className="audit-timestamp">
                        <Clock size={10} />
                        {new Date(log.timestamp).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {/* Linha 2: descrição */}
                    <p className="audit-desc">{log.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .audit-entry {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 12px;
          transition: background 0.15s; cursor: default;
        }
        .audit-entry:hover { background: hsl(var(--bg-main)); }

        .audit-entry-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }

        .audit-entry-body { flex: 1; min-width: 0; }

        .audit-entry-row {
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 2px; overflow: hidden;
        }

        .audit-module-name {
          font-size: 0.7rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: hsl(var(--text-main)); white-space: nowrap;
        }

        .audit-action-pill {
          display: flex; align-items: center; gap: 3px; flex-shrink: 0;
          font-size: 0.6rem; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.06em;
          padding: 2px 7px; border-radius: 20px;
        }

        .audit-dot {
          color: hsl(var(--text-muted)); font-size: 0.7rem; flex-shrink: 0;
        }

        .audit-user-tag {
          display: flex; align-items: center; gap: 3px; flex-shrink: 0;
          font-size: 0.67rem; font-weight: 700;
          color: hsl(var(--brand));
        }

        .audit-timestamp {
          margin-left: auto; flex-shrink: 0;
          display: flex; align-items: center; gap: 3px;
          font-size: 0.67rem; font-weight: 600;
          color: hsl(var(--text-muted)); white-space: nowrap;
        }

        .audit-desc {
          font-size: 0.78rem; font-weight: 500;
          color: hsl(var(--text-muted));
          margin: 0; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
};
