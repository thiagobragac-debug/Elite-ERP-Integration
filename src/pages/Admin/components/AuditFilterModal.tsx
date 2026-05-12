import React from 'react';
import { X, Filter, Check, Shield, Activity, User, Calendar, AlertCircle, FileText, Layout } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface AuditFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  modules: Record<string, string>;
}

export const AuditFilterModal: React.FC<AuditFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  modules
}) => {
  if (!isOpen) return null;

  const severityOptions = [
    { id: 'low', label: 'Baixa (Insert)', color: '#10b981' },
    { id: 'medium', label: 'Média (Update)', color: '#3b82f6' },
    { id: 'high', label: 'Alta (Delete)', color: '#ef4444' }
  ];

  const handleClear = () => {
    setFilters({
      action: 'ALL',
      module: 'ALL',
      user: '',
      dateStart: '',
      dateEnd: '',
      severity: 'all'
    });
  };

  return createPortal(
    <div className="elite-sidebar-overlay" onClick={onClose}>
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="elite-sidebar-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="elite-sidebar-header">
          <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper primary" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3>Filtros de Auditoria</h3>
              <p>Rastreabilidade e compliance.</p>
            </div>
          </div>
          <button 
            style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="elite-sidebar-body">
          <div className="elite-filter-section">
            <label className="elite-filter-label">Severidade do Evento <AlertCircle size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <button 
                className={`elite-tag-chip ${filters.severity === 'all' ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, severity: 'all' })}
                style={{ width: '100%', justifyContent: 'space-between', padding: '12px 16px' }}
              >
                <span>Todas as Severidades</span>
                {filters.severity === 'all' && <Check size={14} />}
              </button>
              {severityOptions.map(opt => (
                <button 
                  key={opt.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.severity === opt.id ? 'white' : '#64748b', 
                    background: filters.severity === opt.id ? opt.color : 'white', 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: filters.severity === opt.id ? opt.color : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => setFilters({ ...filters, severity: opt.id })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: opt.color }} />
                    <span>{opt.label}</span>
                  </div>
                  {filters.severity === opt.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Módulo do Sistema <Layout size={14} /></label>
            <select 
              className="elite-input" 
              value={filters.module}
              onChange={e => setFilters({ ...filters, module: e.target.value })}
              style={{ width: '100%', fontWeight: 700 }}
            >
              <option value="ALL">Todos os Módulos</option>
              {Object.entries(modules).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Usuário Responsável <User size={14} /></label>
            <div className="elite-search-wrapper" style={{ margin: 0, width: '100%' }}>
              <input 
                type="text" 
                className="elite-search-input" 
                placeholder="Email ou nome..."
                value={filters.user}
                onChange={e => setFilters({ ...filters, user: e.target.value })}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Janela Temporal <Calendar size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="elite-field">
                <input 
                  type="date" 
                  className="elite-input" 
                  value={filters.dateStart}
                  onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
                />
              </div>
              <div className="elite-field">
                <input 
                  type="date" 
                  className="elite-input" 
                  value={filters.dateEnd}
                  onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#3b82f6' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
