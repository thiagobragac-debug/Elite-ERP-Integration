import React from 'react';
import { X, Filter, Check, ShoppingCart, Clock, AlertTriangle, User, DollarSign, Calendar, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface PurchaseRequestFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const PurchaseRequestFilterModal: React.FC<PurchaseRequestFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const priorities = [
    { id: 'low', label: 'Baixa', color: '#64748b' },
    { id: 'medium', label: 'Média', color: '#3b82f6' },
    { id: 'high', label: 'Alta', color: '#ed6c02' },
    { id: 'urgent', label: 'Urgente', color: '#ef4444' }
  ];

  const departments = ['Pecuária', 'Frota', 'Infraestrutura', 'Administrativo', 'Agrícola'];

  const toggleDept = (dept: string) => {
    const newDepts = filters.departments?.includes(dept)
      ? filters.departments.filter((d: string) => d !== dept)
      : [...(filters.departments || []), dept];
    setFilters({ ...filters, departments: newDepts });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      priorities: [],
      departments: [],
      maxAmount: 100000,
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(16, 163, 74, 0.1)', padding: '10px', borderRadius: '12px', color: '#10a34a' }}>
              <ShoppingCart size={20} />
            </div>
            <div>
              <h3>Filtros de Requisição</h3>
              <p>Gerencie o fluxo interno de compras.</p>
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
            <label className="elite-filter-label">Nível de Prioridade <AlertTriangle size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {priorities.map(p => (
                <button 
                  key={p.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.priorities?.includes(p.id) ? p.color : '#64748b', 
                    background: filters.priorities?.includes(p.id) ? `${p.color}10` : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.priorities?.includes(p.id) ? p.color : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onClick={() => {
                    const newPrios = filters.priorities?.includes(p.id)
                      ? filters.priorities.filter((id: string) => id !== p.id)
                      : [...(filters.priorities || []), p.id];
                    setFilters({ ...filters, priorities: newPrios });
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Departamentos <User size={14} /></label>
            <div className="elite-tag-cloud">
              {departments.map(dept => (
                <button 
                  key={dept}
                  className={`elite-tag-chip ${filters.departments?.includes(dept) ? 'active' : ''}`}
                  onClick={() => toggleDept(dept)}
                  style={{ 
                    borderColor: filters.departments?.includes(dept) ? '#10a34a' : '#e2e8f0', 
                    background: filters.departments?.includes(dept) ? '#10a34a' : 'white',
                    color: filters.departments?.includes(dept) ? 'white' : '#64748b'
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Valor Estimado (R$) <DollarSign size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#10a34a' }}>{filters.maxAmount.toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Teto Estimado</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100000" 
                step="5000"
                value={filters.maxAmount}
                onChange={e => setFilters({ ...filters, maxAmount: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#10a34a', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Data da Solicitação <Calendar size={14} /></label>
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
          <button className="primary-btn" style={{ flex: 1, background: '#10a34a' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
