import React from 'react';
import { X, Filter, Check, BarChart2, TrendingDown, Building2, Clock, DollarSign, Calendar, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface QuotationFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const QuotationFilterModal: React.FC<QuotationFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'analyzing', label: 'Em Análise', icon: BarChart2 },
    { id: 'closed', label: 'Contratados', icon: Check }
  ];

  const handleClear = () => {
    setFilters({
      status: 'all',
      minSaving: 0,
      minBids: 0,
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
              <Target size={20} />
            </div>
            <div>
              <h3>Filtros de Cotação</h3>
              <p>Análise de saving e competitividade.</p>
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
            <label className="elite-filter-label">Status do Processo <Clock size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#3b82f6' : '#64748b', 
                    background: filters.status === s.id ? '#f1f5f9' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#3b82f6' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  <s.icon size={14} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Saving Mínimo Desejado (%) <TrendingDown size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#3b82f6' }}>{filters.minSaving}%</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Meta de Economia</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="1"
                value={filters.minSaving}
                onChange={e => setFilters({ ...filters, minSaving: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Mínimo de Propostas <Building2 size={14} /></label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 5].map(n => (
                <button 
                  key={n}
                  style={{ 
                    flex: 1,
                    padding: '12px', 
                    fontSize: '12px', 
                    fontWeight: 800, 
                    color: filters.minBids === n ? '#3b82f6' : '#64748b', 
                    background: filters.minBids === n ? '#f1f5f9' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.minBids === n ? '#3b82f6' : '#e2e8f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setFilters({ ...filters, minBids: n })}
                >
                  {n === 1 ? '1+' : n === 5 ? '5+' : n}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período de Abertura <Calendar size={14} /></label>
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
          <button className="primary-btn" style={{ flex: 1, background: '#3b82f6' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
