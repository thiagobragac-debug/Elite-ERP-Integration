import React from 'react';
import { X, Filter, Check, CreditCard, Calendar, Shield, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface BillingFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const BillingFilterModal: React.FC<BillingFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const handleClear = () => {
    setFilters({
      status: 'all',
      planType: 'all',
      dateStart: '',
      dateEnd: ''
    });
  };

  return createPortal(
    <div className="tauze-sidebar-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 10000 }}>
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="tauze-sidebar-modal"
        onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '400px', background: 'hsl(var(--bg-card))', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}
      >
        <div className="tauze-sidebar-header" style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper primary" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
              <Filter size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>Filtros Avançados</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Refine sua busca financeira.</p>
            </div>
          </div>
          <button 
            type="button"
            style={{ color: '#94a3b8', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="tauze-sidebar-body" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          
          <div className="tauze-filter-section" style={{ marginBottom: '32px' }}>
            <label className="tauze-filter-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '16px' }}>
              Status da Fatura <CreditCard size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {['all', 'pago', 'pendente', 'atrasado'].map(status => (
                <button 
                  type="button"
                  key={status}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === status ? 'white' : 'hsl(var(--text-muted))', 
                    background: filters.status === status ? '#10b981' : '#f8fafc', 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: filters.status === status ? '#10b981' : 'hsl(var(--border))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textTransform: 'uppercase'
                  }}
                  onClick={() => setFilters({ ...filters, status })}
                >
                  <span>{status === 'all' ? 'Todos os Status' : status}</span>
                  {filters.status === status && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section" style={{ marginBottom: '32px' }}>
            <label className="tauze-filter-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '16px' }}>
              Período de Vencimento <Calendar size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>DE</span>
                <input 
                  type="date" 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '13px', fontWeight: 600 }} 
                  value={filters.dateStart}
                  onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>ATÉ</span>
                <input 
                  type="date" 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '13px', fontWeight: 600 }} 
                  value={filters.dateEnd}
                  onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '16px' }}>
              Valor da Fatura <DollarSign size={14} />
            </label>
            <select 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '13px', fontWeight: 600, background: 'hsl(var(--bg-main))' }}
              value={filters.planType}
              onChange={e => setFilters({ ...filters, planType: e.target.value })}
            >
              <option value="all">Qualquer valor</option>
              <option value="low">Até R$ 500,00</option>
              <option value="medium">R$ 500,00 a R$ 2.000,00</option>
              <option value="high">Acima de R$ 2.000,00</option>
            </select>
          </div>

        </div>

        <div className="tauze-sidebar-footer" style={{ padding: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' }}>
          <button 
            type="button"
            style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-muted))', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
            onClick={handleClear}
          >
            LIMPAR
          </button>
          <button 
            type="button"
            style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
            onClick={onClose}
          >
            APLICAR FILTROS
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
