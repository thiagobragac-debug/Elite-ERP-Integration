import React from 'react';
import { X, Filter, Check, ClipboardCheck, Target, Activity, Calendar, History, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { DateInput } from '../../../components/Form/DateInput';


interface AuditFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const AuditFilterModal: React.FC<AuditFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const handleClear = () => {
    setFilters({
      status: 'all',
      accuracyRange: 'all',
      dateStart: '',
      dateEnd: ''
    });
  };

  return createPortal(
    <div className="tauze-sidebar-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="tauze-sidebar-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="tauze-sidebar-header">
          <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper primary" style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '12px', color: '#6366f1' }}>
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h3>Filtros de Auditoria</h3>
              <p>Reconciliação e acuracidade física.</p>
            </div>
          </div>
          <button 
            style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="tauze-sidebar-body">
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Acuracidade do Inventário <Target size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {[
                { id: 'all', label: 'Qualquer Acuracidade', color: 'hsl(var(--text-muted))' },
                { id: 'excellent', label: 'Excelente (> 98%)', color: '#10b981' },
                { id: 'good', label: 'Regular (90% - 98%)', color: '#f59e0b' },
                { id: 'critical', label: 'Crítico (< 90%)', color: '#ef4444' }
              ].map(r => (
                <button 
                  key={r.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.accuracyRange === r.id ? r.color : 'hsl(var(--text-muted))', 
                    background: filters.accuracyRange === r.id ? `${r.color}10` : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.accuracyRange === r.id ? r.color : 'hsl(var(--border))',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onClick={() => setFilters({ ...filters, accuracyRange: r.id })}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Status da Sessão <Activity size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'completed', label: 'Concluídas' },
                { id: 'in_progress', label: 'Em Aberto' }
              ].map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#6366f1' : 'hsl(var(--text-muted))', 
                    background: filters.status === s.id ? '#6366f115' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#6366f1' : 'hsl(var(--border))',
                    cursor: 'pointer'
                  }}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Data de Realização <Calendar size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <DateInput 
                type="date" 
                className="tauze-input" 
                value={filters.dateStart}
                onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
              />
              <DateInput 
                type="date" 
                className="tauze-input" 
                value={filters.dateEnd}
                onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#6366f1' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
