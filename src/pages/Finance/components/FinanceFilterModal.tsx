import React from 'react';
import { X, Filter, Check, Calendar, Wallet, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface FinanceFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const FinanceFilterModal: React.FC<FinanceFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const categories = ['Custo Operacional', 'Insumos', 'Folha Pagto', 'Manutenção', 'Receita de Venda', 'Impostos'];
  const types = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'inflow', label: 'Entradas', icon: TrendingUp },
    { id: 'outflow', label: 'Saídas', icon: TrendingDown }
  ];

  const toggleCategory = (cat: string) => {
    const newCats = filters.categories?.includes(cat)
      ? filters.categories.filter((c: string) => c !== cat)
      : [...(filters.categories || []), cat];
    setFilters({ ...filters, categories: newCats });
  };

  const handleClear = () => {
    setFilters({
      type: 'all',
      dateStart: '',
      dateEnd: '',
      categories: [],
      status: 'all'
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
              <Wallet size={20} />
            </div>
            <div>
              <h3>Filtros Financeiros</h3>
              <p>Refine o fluxo de caixa por período e tipo.</p>
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
            <label className="elite-filter-label">Tipo de Lançamento <Activity size={14} /></label>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', gap: '4px' }}>
              {types.map(t => (
                <button 
                  key={t.id}
                  style={{ flex: 1, padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: filters.type === t.id ? '#3b82f6' : '#64748b', background: filters.type === t.id ? 'white' : 'transparent', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => setFilters({ ...filters, type: t.id })}
                >
                  <t.icon size={12} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período <Calendar size={14} /></label>
            <div className="date-range-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="filter-field">
                <label className="elite-label" style={{ fontSize: '10px', marginBottom: '8px' }}>Início</label>
                <input 
                  type="date" 
                  className="elite-input" 
                  value={filters.dateStart}
                  onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
                  style={{ height: '40px', fontSize: '12px' }}
                />
              </div>
              <div className="filter-field">
                <label className="elite-label" style={{ fontSize: '10px', marginBottom: '8px' }}>Término</label>
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

          <div className="elite-filter-section">
            <label className="elite-filter-label">Categorias <Filter size={14} /></label>
            <div className="elite-tag-cloud">
              {categories.map(cat => (
                <button 
                  key={cat}
                  className={`elite-tag-chip ${filters.categories?.includes(cat) ? 'active' : ''}`}
                  onClick={() => toggleCategory(cat)}
                  style={{ 
                    borderColor: filters.categories?.includes(cat) ? '#3b82f6' : '#e2e8f0', 
                    background: filters.categories?.includes(cat) ? '#3b82f6' : 'white',
                    color: filters.categories?.includes(cat) ? 'white' : '#64748b'
                  }}
                >
                  {cat}
                  {filters.categories?.includes(cat) && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Status de Liquidação <Clock size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                className={`elite-tag-chip ${filters.status === 'PAID' ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, status: 'PAID' })}
                style={{ 
                  borderColor: filters.status === 'PAID' ? '#10b981' : '#e2e8f0', 
                  background: filters.status === 'PAID' ? '#10b981' : 'white',
                  color: filters.status === 'PAID' ? 'white' : '#64748b'
                }}
              >
                Efetivados
              </button>
              <button 
                className={`elite-tag-chip ${filters.status === 'PENDING' ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, status: 'PENDING' })}
                style={{ 
                  borderColor: filters.status === 'PENDING' ? '#f59e0b' : '#e2e8f0', 
                  background: filters.status === 'PENDING' ? '#f59e0b' : 'white',
                  color: filters.status === 'PENDING' ? 'white' : '#64748b'
                }}
              >
                Previstos
              </button>
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
