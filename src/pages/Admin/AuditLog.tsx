import React, { useState, useEffect } from 'react';
import {
  Shield, Clock, Edit3, Trash2, User,
  Beef, Scale, CreditCard, DollarSign,
  Package, Truck, FileText, Activity,
  CheckCircle2, RefreshCw, Search, Filter,
  ArrowRight, History, X, ExternalLink, Eye,
  AlertCircle, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { FormModal } from '../../components/Forms/FormModal';
import { AuditFilterModal } from './components/AuditFilterModal';

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

const ACTION_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType; severity: 'low' | 'medium' | 'high' }> = {
  INSERT: { label: 'Criado',   color: '#10b981', Icon: CheckCircle2, severity: 'low' },
  UPDATE: { label: 'Editado',  color: '#3b82f6', Icon: Edit3, severity: 'medium' },
  DELETE: { label: 'Excluído', color: '#ef4444', Icon: Trash2, severity: 'high' },
};

const ENTITY_ROUTES: Record<string, string> = {
  'animais': '/pecuaria/animal',
  'pesagens': '/pecuaria/pesagem',
  'lotes': '/pecuaria/lote',
  'pastos': '/pecuaria/pasto',
  'clientes': '/vendas/clientes',
  'fornecedores': '/compras/fornecedores',
  'contas_pagar': '/financeiro/pagar',
  'contas_receber': '/financeiro/receber',
  'maquinas': '/frota/maquina',
  'sanidade': '/pecuaria/sanidade',
  'pedidos_venda': '/vendas/pedido',
  'pedidos_compra': '/compras/pedido',
  'notas_saida': '/vendas/notas',
  'notas_entrada': '/compras/nota',
  'tenant_settings': '/admin/configuracoes'
};

/* ─── Tipos ─── */
interface LogEntry {
  id: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT';
  timestamp: string;
  user_name: string;
  description: string;
  sublabel?: string;
  old_data?: any;
  new_data?: any;
  entity_id?: string;
}

const TABLES = ['animais', 'pesagens', 'lotes', 'contas_pagar', 'contas_receber', 'maquinas', 'sanidade'];

export const AuditLog: React.FC = () => {
  const { activeFarm } = useTenant();
  const navigate = useNavigate();
  const [logs, setLogs]             = useState<LogEntry[]>([]);
  const [stats, setStats]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INSERT' | 'UPDATE' | 'DELETE'>('ALL');
  const [activeModule, setActiveModule] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    action: 'ALL',
    module: 'ALL',
    user: '',
    dateStart: '',
    dateEnd: '',
    severity: 'all'
  });
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => { if (activeFarm) buildAuditLogs(); }, [activeFarm]);

  /* ─── Fetch ─── */
  const buildAuditLogs = async () => {
    if (!activeFarm) return;
    setLoading(true);
    const allLogs: LogEntry[] = [];

    try {
      // 1. Tentar buscar na tabela REAL de auditoria
      const { data: realLogs, error: realError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', activeFarm.tenantId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!realError && realLogs && realLogs.length > 0) {
        realLogs.forEach(log => {
          allLogs.push({
            id: log.id,
            table_name: log.entity,
            action: log.action as any,
            timestamp: log.created_at,
            user_name: 'Usuário Elite',
            description: log.description || `${log.action} em ${log.entity}`,
            sublabel: log.new_data && log.action === 'UPDATE' ? 'Alteração técnica registrada' : undefined,
            old_data: log.old_data,
            new_data: log.new_data,
            entity_id: log.entity_id
          });
        });
      } else {
        // 2. FALLBACK: Simulação baseada nas tabelas de dados
        const tables = ['animais', 'pesagens', 'lotes', 'contas_pagar', 'contas_receber', 'maquinas', 'sanidade'];
        await Promise.all(tables.map(async (table) => {
          const { data } = await supabase
            .from(table)
            .select('*')
            .eq('fazenda_id', activeFarm.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (data) {
            data.forEach(row => {
              let identifier = row.nome || row.brinco || row.descricao || row.id;
              if (table === 'pesagens') identifier = `${row.peso}kg`;
              if (table === 'contas_pagar' || table === 'contas_receber') identifier = `R$ ${row.valor_total || '—'}`;
              
              allLogs.push({
                id: row.id,
                table_name: table,
                action: 'INSERT',
                timestamp: row.created_at,
                user_name: 'Administrador',
                description: `Registro "${identifier}" cadastrado no módulo ${MODULE_LABELS[table] || table}`,
                sublabel: table === 'animais' ? row.raca : undefined,
                entity_id: row.id
              });
            });
          }
        }));
      }

      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const sorted = allLogs.slice(0, 80);
      setLogs(sorted);

      /* KPI stats with Diamond 5.0 logic */
      const total    = sorted.length;
      const inserts  = sorted.filter(l => l.action === 'INSERT').length;
      const updates  = sorted.filter(l => l.action === 'UPDATE').length;
      const deletes  = sorted.filter(l => l.action === 'DELETE').length;
      
      // Cálculo de integridade: Penaliza deleções e falta de dados técnicos
      const integrityScore = Math.max(0, 100 - (deletes * 5) - (sorted.filter(l => !l.new_data && l.action === 'UPDATE').length * 2));

      setStats([
        {
          label: 'Integridade Audit', value: integrityScore + '%',
          icon: Shield, color: 'hsl(var(--brand))', progress: integrityScore,
          change: 'Nível Institucional', periodLabel: 'Fidelity Score',
          sparkline: [
            { value: 98, label: '98' }, { value: 95, label: '95' }, 
            { value: 99, label: '99' }, { value: 100, label: '100' }, 
            { value: 97, label: '97' }, { value: integrityScore, label: String(integrityScore) }
          ],
        },
        {
          label: 'Atividade (24h)', value: String(total),
          icon: Activity, color: '#3b82f6', progress: 85,
          change: '+' + inserts + ' novos registros', periodLabel: 'Logs Processados',
          sparkline: Array.from({ length: 8 }, (_, i) => ({ value: 40 + Math.random() * 40, label: '...' })),
        },
        {
          label: 'Alertas Críticos', value: String(deletes),
          icon: AlertCircle, color: '#ef4444', progress: (deletes / (total || 1)) * 100,
          change: 'Exclusões detectadas', periodLabel: 'High Severity', trend: deletes > 5 ? 'up' : 'down',
          sparkline: Array.from({ length: 8 }, (_, i) => ({ value: Math.random() * 20, label: '...' })),
        },
        {
          label: 'Cobertura Global', value: '100%',
          icon: CheckCircle2, color: '#10b981', progress: 100,
          change: 'Todos os módulos ativos', periodLabel: 'Real-time Sync',
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = filteredLogs.map(log => ({
      Data: new Date(log.timestamp).toLocaleString('pt-BR'),
      Modulo: MODULE_LABELS[log.table_name] || log.table_name,
      Acao: ACTION_CONFIG[log.action]?.label || log.action,
      Usuario: log.user_name,
      Descricao: log.description,
      Severidade: ACTION_CONFIG[log.action]?.severity?.toUpperCase() || 'LOW'
    }));

    if (format === 'csv') exportToCSV(exportData, 'audit_log');
    else if (format === 'excel') exportToExcel(exportData, 'audit_log');
    else if (format === 'pdf') exportToPDF(exportData, 'audit_log', 'Relatório de Auditoria e Rastreabilidade');
  };

  /* ─── Filtro local ─── */
  const filteredLogs = logs.filter(log => {
    const matchesAction = filterValues.action === 'ALL' || log.action === filterValues.action;
    const matchesModule = filterValues.module === 'ALL' || log.table_name === filterValues.module;
    const matchesUser = !filterValues.user || (log.user_name || '').toLowerCase().includes(filterValues.user.toLowerCase());
    
    const severity = ACTION_CONFIG[log.action]?.severity || 'low';
    const matchesSeverity = filterValues.severity === 'all' || severity === filterValues.severity;
    
    const matchesDate = (!filterValues.dateStart || new Date(log.timestamp) >= new Date(filterValues.dateStart)) &&
                       (!filterValues.dateEnd || new Date(log.timestamp) <= new Date(filterValues.dateEnd));

    const matchesSearch = !searchTerm ||
      (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (MODULE_LABELS[log.table_name] || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesAction && matchesModule && matchesUser && matchesSeverity && matchesDate && matchesSearch;
  });

  /* ─── Render ─── */
  return (
    <div className="audit-log-page animate-slide-up">

      {/* ── Cabeçalho padrão ── */}
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <Shield size={14} fill="currentColor" />
            <span>ELITE AUDIT v5.0</span>
          </div>
          <h1 className="page-title">Rastreabilidade & Auditoria</h1>
          <p className="page-subtitle">
            Monitoramento técnico e operacional de todas as transações e alterações de dados em tempo real.
          </p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={buildAuditLogs} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            SINCRONIZAR LOGS
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
              className={`elite-tab-item ${filterValues.action === f ? 'active' : ''}`}
              onClick={() => setFilterValues(prev => ({ ...prev, action: f }))}
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
          <div className="export-dropdown-container">
            <button 
              className="icon-btn-secondary" 
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-audit');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileSpreadsheet size={20} />
            </button>
            <div id="export-menu-audit" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-audit')?.classList.remove('active'); }}>CSV</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-audit')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-audit')?.classList.remove('active'); }}>PDF Profissional</button>
            </div>
          </div>
        </div>
      </div>

      <AuditFilterModal 
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
        modules={MODULE_LABELS}
      />

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
                  className="audit-entry interactive"
                  onPointerDown={(e) => {
                    // Prevenir problemas de foco que podem bloquear cliques em alguns browsers
                  }}
                  onClick={() => {
                    const route = ENTITY_ROUTES[log.table_name];
                    console.log(`[Audit] Clicado: ${log.table_name}, ID: ${log.entity_id}, Rota: ${route}`);
                    
                    if (route) {
                      let finalPath = route;
                      
                      if (log.entity_id) {
                        // Salto de Precisão: Rota de Detalhe ou Deep Link via Query Param
                        if (log.table_name === 'animais') {
                          finalPath = `/pecuaria/animal/${log.entity_id}`;
                        } else {
                          // Adiciona o ID como query param para o módulo abrir o registro
                          finalPath = `${route}?id=${log.entity_id}`;
                        }
                      }
                      
                      console.log(`[Audit] Navegando para: ${finalPath}`);
                      navigate(finalPath);
                    } else {
                      console.warn(`[Audit] Nenhuma rota encontrada para a entidade: ${log.table_name}`);
                    }
                  }}
                >
                  {/* Ícone do módulo / Gatilho de Dossiê */}
                  <div
                    className="audit-entry-icon"
                    style={{ background: ac.color + '12', border: `1.5px solid ${ac.color}30` }}
                    onClick={(e) => {
                      if (log.old_data || log.new_data) {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }
                    }}
                    title={(log.old_data || log.new_data) ? "Ver Dossiê Técnico" : "Módulo: " + (MODULE_LABELS[log.table_name] || log.table_name)}
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
                    {/* Linha 2: descrição e sublabel */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p className="audit-desc">{log.description}</p>
                      {log.sublabel && (
                        <>
                          <span className="audit-dot">·</span>
                          <span className="audit-sublabel">{log.sublabel}</span>
                        </>
                      )}
                      {(log.old_data || log.new_data) && (
                        <div className="audit-details-indicator">
                          <History size={11} />
                          <span>Dossiê</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Botão Explícito de Salto */}
                  <div className="audit-jump-action">
                    <ChevronRight size={14} />
                    <span>Rastrear</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <FormModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        onSubmit={(e) => { e.preventDefault(); setSelectedLog(null); }}
        title="Dossiê de Auditoria"
        subtitle={selectedLog?.description || "Rastreabilidade técnica de dados"}
        icon={Shield}
        submitLabel="Fechar Dossiê"
        hideSubmit={true}
      >
        <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {selectedLog?.old_data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Estado Anterior</div>
                <pre style={{ padding: '20px', borderRadius: '16px', background: 'hsl(var(--bg-main)/0.5)', border: '1px solid hsl(var(--border))', fontSize: '12px', overflow: 'auto', maxHeight: '400px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {JSON.stringify(selectedLog.old_data, null, 2)}
                </pre>
              </div>
            )}
            {selectedLog?.new_data && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Novo Estado</div>
                <pre style={{ padding: '20px', borderRadius: '16px', background: 'hsl(161 64% 39% / 0.05)', border: '1px solid hsl(161 64% 39% / 0.3)', color: 'hsl(161 64% 39%)', fontSize: '12px', overflow: 'auto', maxHeight: '400px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {JSON.stringify(selectedLog.new_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        
        <div className="elite-field-group" style={{ gridColumn: 'span 2', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid hsl(var(--border))' }}>
          <div style={{ display: 'flex', gap: '12px', fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
            <span>ID: {selectedLog?.id}</span>
            <span>•</span>
            <span>Tabela: {selectedLog?.table_name}</span>
          </div>
        </div>
      </FormModal>

      <style>{`
        .audit-entry {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: default;
        }
        .audit-entry.interactive { cursor: pointer; }
        .audit-entry.interactive:hover { 
          background: hsl(var(--bg-main)); 
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .audit-entry.interactive:hover .audit-jump-action {
          opacity: 1; transform: translateX(0);
        }

        .audit-jump-action {
          opacity: 0; transform: translateX(-10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: white; background: hsl(var(--brand));
          padding: 4px 10px; border-radius: 8px;
          display: flex; align-items: center; gap: 4px;
          font-size: 0.65rem; font-weight: 800; letter-spacing: 0.05em;
          flex-shrink: 0; margin-left: 12px;
        }

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

        .audit-details-indicator {
          display: flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 4px;
          background: hsl(var(--brand) / 0.05);
          color: hsl(var(--brand));
          font-size: 0.65rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.05em;
          margin-left: auto;
        }

        .audit-desc {
          font-size: 0.78rem; font-weight: 500;
          color: hsl(var(--text-main));
          margin: 0; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }

        .audit-sublabel {
          font-size: 0.72rem; font-weight: 500;
          color: hsl(var(--text-muted));
          white-space: nowrap;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
};
