import React from 'react';
import { X, Filter, Check, ShoppingCart, Truck, Clock, DollarSign, Calendar, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface PurchasingFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const PurchasingFilterModal: React.FC<PurchasingFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'ordered', label: 'Emitidos', icon: Clock },
    { id: 'shipped', label: 'Em Trânsito', icon: Truck },
    { id: 'received', label: 'Recebidos', icon: Check }
  ];

  const suppliers = ['AgroLine', 'NutriPura', 'Fazenda Grande', 'Mecânica Sul', 'BioCeres', 'Cooperativa Central'];

  const toggleSupplier = (sup: string) => {
    const newSups = filters.suppliers?.includes(sup)
      ? filters.suppliers.filter((s: string) => s !== sup)
      : [...(filters.suppliers || []), sup];
    setFilters({ ...filters, suppliers: newSups });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      suppliers: [],
      minAmount: 0,
      maxAmount: 100000,
      dateStart: '',
      dateEnd: '',
      onlyDelayed: false
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
              <ShoppingCart size={20} />
            </div>
            <div>
              <h3>Filtros de Compras</h3>
              <p>Gerencie ordens e fornecedores.</p>
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
            <label className="elite-filter-label">Status da Ordem <Clock size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#3b82f6' : '#64748b', 
                    background: filters.status === s.id ? '#f1f5f9' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#3b82f6' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  <s.icon size={12} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Fornecedores Homologados <Building2 size={14} /></label>
            <div className="elite-tag-cloud">
              {suppliers.map(sup => (
                <button 
                  key={sup}
                  className={`elite-tag-chip ${filters.suppliers?.includes(sup) ? 'active' : ''}`}
                  onClick={() => toggleSupplier(sup)}
                  style={{ 
                    borderColor: filters.suppliers?.includes(sup) ? '#3b82f6' : '#e2e8f0', 
                    background: filters.suppliers?.includes(sup) ? '#3b82f6' : 'white',
                    color: filters.suppliers?.includes(sup) ? 'white' : '#64748b'
                  }}
                >
                  {sup}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Valor da Ordem (R$) <DollarSign size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#3b82f6' }}>{filters.maxAmount.toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Teto Orçamentário</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100000" 
                step="5000"
                value={filters.maxAmount}
                onChange={e => setFilters({ ...filters, maxAmount: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Prazo de Entrega <Calendar size={14} /></label>
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

          <div className="elite-filter-section" style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#ef4444' }}>
                  <AlertTriangle size={18} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Apenas Atrasados</span>
              </div>
              <input 
                type="checkbox" 
                checked={filters.onlyDelayed}
                onChange={e => setFilters({ ...filters, onlyDelayed: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#ef4444' }}
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

const AlertTriangle = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
);
