import React from 'react';
import { X, Filter, Check, FileText, ShieldCheck, DollarSign, Calendar, Activity, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface OutputInvoiceFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const OutputInvoiceFilterModal: React.FC<OutputInvoiceFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'CONCLUIDA', label: 'Autorizada', icon: ShieldCheck },
    { id: 'pending', label: 'Pendente', icon: Activity }
  ];

  const handleClear = () => {
    setFilters({
      status: 'all',
      minAmount: 0,
      maxAmount: 1000000,
      dateStart: '',
      dateEnd: '',
      onlyConciliated: false
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
              <FileText size={20} />
            </div>
            <div>
              <h3>Filtros Fiscais (Saída)</h3>
              <p>Auditoria de faturamento e impostos.</p>
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
            <label className="elite-filter-label">Status Fiscal SEFAZ <ShieldCheck size={14} /></label>
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
            <label className="elite-filter-label">Faturamento da Nota (R$) <DollarSign size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#3b82f6' }}>{filters.maxAmount.toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Teto de Valor</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000000" 
                step="50000"
                value={filters.maxAmount}
                onChange={e => setFilters({ ...filters, maxAmount: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Conciliação Financeira <Activity size={14} /></label>
            <button 
              className={`elite-tag-chip ${filters.onlyConciliated ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, onlyConciliated: !filters.onlyConciliated })}
              style={{ 
                width: '100%', 
                justifyContent: 'center',
                borderColor: filters.onlyConciliated ? '#10b981' : '#e2e8f0', 
                background: filters.onlyConciliated ? '#10b981' : 'white',
                color: filters.onlyConciliated ? 'white' : '#64748b'
              }}
            >
              Apenas Notas Conciliadas no Caixa
            </button>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período de Emissão <Calendar size={14} /></label>
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
