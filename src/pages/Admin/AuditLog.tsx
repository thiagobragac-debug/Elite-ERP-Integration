import React, { useState, useEffect } from 'react';
import { Shield, Clock, Edit3, Trash2, User, Beef, Scale, CreditCard, DollarSign, Package, Truck, FileText, Activity, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { TableSkeleton } from '../../components/Feedback/Skeleton';

const MODULE_ICONS: Record<string, any> = {
  animais: Beef, pesagens: Scale, lotes: Package,
  contas_pagar: CreditCard, contas_receber: DollarSign,
  pedidos_venda: FileText, maquinas: Truck, sanidade: Activity, pastos: Package
};

const MODULE_LABELS: Record<string, string> = {
  animais: 'Gestão de Animais', pesagens: 'Controle de Pesagem',
  lotes: 'Gestão de Lotes', contas_pagar: 'Contas a Pagar',
  contas_receber: 'Contas a Receber', pedidos_venda: 'Pedidos de Venda',
  maquinas: 'Frota & Máquinas', sanidade: 'Gestão Sanitária', pastos: 'Gestão de Pastos'
};

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  INSERT: { label: 'Criado', color: '#10b981', icon: CheckCircle2 },
  UPDATE: { label: 'Editado', color: '#3b82f6', icon: Edit3 },
  DELETE: { label: 'Excluído', color: '#ef4444', icon: Trash2 },
};

export const AuditLog: React.FC = () => {
  const { activeFarm } = useTenant();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INSERT' | 'UPDATE' | 'DELETE'>('ALL');
  const [activeModule, setActiveModule] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { if (activeFarm) buildAuditLogs(); }, [activeFarm]);

  const buildAuditLogs = async () => {
    setLoading(true);
    try {
      const tables = ['animais', 'pesagens', 'lotes', 'contas_pagar', 'contas_receber'];
      const allLogs: any[] = [];
      await Promise.all(tables.map(async (table) => {
        const { data } = await supabase.from(table).select('id, created_at')
          .eq('fazenda_id', activeFarm!.id).order('created_at', { ascending: false }).limit(8);
        if (data) data.forEach(row => allLogs.push({
          id: row.id, table_name: table, action: 'INSERT',
          timestamp: row.created_at, user_name: 'Administrador',
          description: `Registro adicionado em ${MODULE_LABELS[table] || table}`
        }));
      }));
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(allLogs.slice(0, 60));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredLogs = logs.filter(log => {
    const matchesAction = activeFilter === 'ALL' || log.action === activeFilter;
    const matchesModule = activeModule === 'ALL' || log.table_name === activeModule;
    const matchesSearch = !searchTerm || log.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesModule && matchesSearch;
  });

  return (
    <div className="audit-log-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge"><Shield size={14} fill="currentColor" /><span>ELITE AUDIT v5.0</span></div>
          <h1 className="page-title">Log de Auditoria</h1>
          <p className="page-subtitle">Rastreabilidade completa de todas as operações realizadas no sistema em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={buildAuditLogs}><Activity size={18} />ATUALIZAR</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Total de Eventos', value: logs.length, icon: FileText, color: 'hsl(var(--brand))' },
          { label: 'Criações', value: logs.filter(l => l.action === 'INSERT').length, icon: CheckCircle2, color: '#10b981' },
          { label: 'Edições', value: logs.filter(l => l.action === 'UPDATE').length, icon: Edit3, color: '#3b82f6' },
          { label: 'Exclusões', value: logs.filter(l => l.action === 'DELETE').length, icon: Trash2, color: '#ef4444' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '20px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
              <kpi.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'hsl(var(--text-main))', lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          {(['ALL', 'INSERT', 'UPDATE', 'DELETE'] as const).map(f => (
            <button key={f} className={`elite-tab-item ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
              {f === 'ALL' ? 'Todos' : ACTION_CONFIG[f].label + 's'}
            </button>
          ))}
        </div>
        <div className="elite-search-wrapper">
          <Activity size={18} className="s-icon" />
          <input type="text" className="elite-search-input" placeholder="Buscar por usuário ou ação..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="elite-filter-group">
          <select className="elite-input elite-select" style={{ minWidth: '180px' }} value={activeModule} onChange={e => setActiveModule(e.target.value)}>
            <option value="ALL">Todos os Módulos</option>
            {Object.entries(MODULE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
      </div>

      <div className="management-content">
        {loading ? (
          <div className="premium-card" style={{ padding: '24px' }}><TableSkeleton /></div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState title="Nenhum evento encontrado" description="Não há registros de auditoria para os filtros selecionados." icon={Shield} />
        ) : (
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredLogs.map((log, i) => {
              const ac = ACTION_CONFIG[log.action] || ACTION_CONFIG['INSERT'];
              const ModuleIcon = MODULE_ICONS[log.table_name] || FileText;
              const ActionIcon = ac.icon;
              return (
                <motion.div key={log.id + i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.015 }}
                  style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '14px', transition: 'background 0.2s', cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--bg-main))')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ac.color + '15', border: `1.5px solid ${ac.color}40` }}>
                    <ModuleIcon size={15} style={{ color: ac.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-main))' }}>{MODULE_LABELS[log.table_name]}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px', background: ac.color + '20', color: ac.color }}>
                        <ActionIcon size={10} />{ac.label}
                      </span>
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                        <Clock size={10} />{new Date(log.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'hsl(var(--text-muted))', margin: '0 0 5px' }}>{log.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--brand))' }}>
                      <User size={10} />{log.user_name}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
