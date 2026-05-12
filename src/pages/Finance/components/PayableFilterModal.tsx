import React from 'react';
import { X, Filter, Check, CreditCard, DollarSign, Calendar, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface PayableFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const PayableFilterModal: React.FC<PayableFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

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
            <div className="icon-wrapper primary" style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '12px', color: '#6366f1' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h3>Filtros de Pagamento</h3>
              <p>Gestão de obrigações e fluxo de saída.</p>
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
            <label className="elite-filter-label">Status da Conta <Activity size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {[
                { id: 'all', label: 'Todos os Status', color: '#64748b' },
                { id: 'PENDENTE', label: 'Pendentes (Em Aberto)', color: '#f59e0b' },
                { id: 'PAGO', label: 'Liquidados (Pagos)', color: '#10b981' },
                { id: 'ATRASADO', label: 'Em Atraso (Overdue)', color: '#ef4444' }
              ].map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? s.color : '#64748b', 
                    background: filters.status === s.id ? `${s.color}10` : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? s.color : '#e2e8f0',
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
            <label className="elite-filter-label">Valor do Título (R$) <DollarSign size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#6366f1' }}>{filters.maxAmount.toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Teto de Valor</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000000" 
                step="25000"
                value={filters.maxAmount}
                onChange={e => setFilters({ ...filters, maxAmount: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#6366f1', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período de Vencimento <Calendar size={14} /></label>
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
          <button className="primary-btn" style={{ flex: 1, background: '#6366f1' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
