import React from 'react';
import { X, Filter, Check, ArrowRightLeft, Calendar, DollarSign, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ReconFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const ReconFilterModal: React.FC<ReconFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const statusOptions = [
    { id: 'all', label: 'Todos os Lançamentos', icon: Filter },
    { id: 'pending', label: 'Apenas Pendentes', icon: Activity },
    { id: 'matched', label: 'Conciliados (AI)', icon: Check }
  ];

  const handleClear = () => {
    setFilters({
      status: 'all',
      minAmount: 0,
      maxAmount: 1000000,
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#8b5cf6' }}>
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3>Filtros de Conciliação</h3>
              <p>Refine a auditoria de fluxos bancários.</p>
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
            <label className="elite-filter-label">Status de Pareamento</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#8b5cf6' : '#64748b', 
                    background: filters.status === s.id ? '#f5f3ff' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#8b5cf6' : '#e2e8f0',
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
            <label className="elite-filter-label">Faixa de Valor (R$) <DollarSign size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Valor Mínimo</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#8b5cf6' }}>
                    {Number(filters.minAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="500000" 
                  step="1000"
                  value={filters.minAmount}
                  onChange={e => setFilters({ ...filters, minAmount: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#8b5cf6', height: '6px', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Valor Máximo</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#8b5cf6' }}>
                    {Number(filters.maxAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1000000" 
                  step="5000"
                  value={filters.maxAmount}
                  onChange={e => setFilters({ ...filters, maxAmount: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#8b5cf6', height: '6px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período Fiscal <Calendar size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input 
                type="date" 
                className="elite-input" 
                value={filters.dateStart}
                onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
                style={{ height: '40px', fontSize: '12px' }}
              />
              <input 
                type="date" 
                className="elite-input" 
                value={filters.dateEnd}
                onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
                style={{ height: '40px', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#8b5cf6' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
