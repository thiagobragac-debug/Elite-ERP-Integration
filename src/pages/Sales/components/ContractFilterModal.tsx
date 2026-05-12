import React from 'react';
import { X, Filter, Check, ShieldCheck, BarChart2, DollarSign, Calendar, Target, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ContractFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const ContractFilterModal: React.FC<ContractFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const handleClear = () => {
    setFilters({
      status: 'all',
      priceType: 'all',
      minProgress: 0,
      dateStart: '',
      dateEnd: ''
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(22, 101, 52, 0.1)', padding: '10px', borderRadius: '12px', color: '#166534' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3>Filtros de Contrato</h3>
              <p>Monitoramento de Hedge e Exposição.</p>
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
            <label className="elite-filter-label">Modalidade de Preço <DollarSign size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['all', 'FIXO', 'A FIXAR'].map(t => (
                <button 
                  key={t}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.priceType === t ? '#166534' : '#64748b', 
                    background: filters.priceType === t ? '#f0fdf4' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.priceType === t ? '#166534' : '#e2e8f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setFilters({ ...filters, priceType: t })}
                >
                  {t === 'all' ? 'TODOS' : t}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Progresso Físico Mínimo (%) <Activity size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#166534' }}>{filters.minProgress}%</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Execução Física</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={filters.minProgress}
                onChange={e => setFilters({ ...filters, minProgress: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#166534', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Status do Contrato <Clock size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {[
                { id: 'all', label: 'Todos os Status' },
                { id: 'active', label: 'Vigentes' },
                { id: 'completed', label: 'Encerrados' }
              ].map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#166534' : '#64748b', 
                    background: filters.status === s.id ? '#f0fdf4' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#166534' : '#e2e8f0',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período de Vigência <Calendar size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input 
                type="date" 
                className="elite-input" 
                value={filters.dateStart}
                onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
              />
              <input 
                type="date" 
                className="elite-input" 
                value={filters.dateEnd}
                onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#166534' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
