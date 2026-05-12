import React from 'react';
import { X, Filter, Check, Package, AlertTriangle, FlaskConical, Wheat, Zap, Boxes, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface InventoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const InventoryFilterModal: React.FC<InventoryFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const categorias = ['Suplemento', 'Medicamento', 'Vacina', 'Combustível', 'Semente', 'Fertilizante', 'Peça', 'Defensivo'];
  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'critico', label: 'Reposição', icon: AlertTriangle },
    { id: 'normal', label: 'Normal', icon: Check }
  ];

  const toggleCategoria = (cat: string) => {
    const newCats = filters.categorias?.includes(cat)
      ? filters.categorias.filter((c: string) => c !== cat)
      : [...(filters.categorias || []), cat];
    setFilters({ ...filters, categorias: newCats });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      categorias: [],
      minStock: 0,
      maxStock: 5000,
      minPrice: 0,
      maxPrice: 10000
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
              <Package size={20} />
            </div>
            <div>
              <h3>Filtros de Inventário</h3>
              <p>Refine a gestão de insumos e ativos.</p>
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
            <label className="elite-filter-label">Status de Suprimento <AlertTriangle size={14} /></label>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', gap: '4px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    flex: 1, 
                    padding: '12px 8px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#10b981' : '#64748b', 
                    background: filters.status === s.id ? 'white' : 'transparent', 
                    borderRadius: '10px', 
                    border: 'none', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
            <label className="elite-filter-label">Categorias de Insumos <Boxes size={14} /></label>
            <div className="elite-tag-cloud">
              {categorias.map(cat => (
                <button 
                  key={cat}
                  className={`elite-tag-chip ${filters.categorias?.includes(cat) ? 'active' : ''}`}
                  onClick={() => toggleCategoria(cat)}
                  style={{ 
                    borderColor: filters.categorias?.includes(cat) ? '#10b981' : '#e2e8f0', 
                    background: filters.categorias?.includes(cat) ? '#10b981' : 'white',
                    color: filters.categorias?.includes(cat) ? 'white' : '#64748b'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Volume em Estoque <Package size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>{filters.maxStock}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Limite Máximo</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5000" 
                step="100"
                value={filters.maxStock}
                onChange={e => setFilters({ ...filters, maxStock: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Faixa de Custo Médio <DollarSign size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="filter-field">
                <label className="elite-label" style={{ fontSize: '10px', marginBottom: '8px' }}>Min (R$)</label>
                <input 
                  type="number" 
                  className="elite-input" 
                  placeholder="0,00"
                  value={filters.minPrice}
                  onChange={e => setFilters({ ...filters, minPrice: parseFloat(e.target.value) })}
                />
              </div>
              <div className="filter-field">
                <label className="elite-label" style={{ fontSize: '10px', marginBottom: '8px' }}>Max (R$)</label>
                <input 
                  type="number" 
                  className="elite-input" 
                  placeholder="10.000,00"
                  value={filters.maxPrice}
                  onChange={e => setFilters({ ...filters, maxPrice: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#10b981' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
