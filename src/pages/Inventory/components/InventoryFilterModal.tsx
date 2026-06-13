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
    <div className="tauze-sidebar-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="tauze-sidebar-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="tauze-sidebar-header">
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

        <div className="tauze-sidebar-body">
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Status de Suprimento <AlertTriangle size={14} /></label>
            <div style={{ display: 'flex', background: 'hsl(var(--bg-main))', padding: '4px', borderRadius: '14px', gap: '4px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    flex: 1, 
                    padding: '12px 8px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#10b981' : 'hsl(var(--text-muted))', 
                    background: filters.status === s.id ? 'hsl(var(--bg-card))' : 'transparent', 
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

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Categorias de Insumos <Boxes size={14} /></label>
            <div className="tauze-tag-cloud">
              {categorias.map(cat => (
                <button 
                  key={cat}
                  className={`tauze-tag-chip ${filters.categorias?.includes(cat) ? 'active' : ''}`}
                  onClick={() => toggleCategoria(cat)}
                  style={{ 
                    borderColor: filters.categorias?.includes(cat) ? '#10b981' : 'hsl(var(--border))', 
                    background: filters.categorias?.includes(cat) ? '#10b981' : 'hsl(var(--bg-card))',
                    color: filters.categorias?.includes(cat) ? 'white' : 'hsl(var(--text-muted))'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Volume em Estoque <Package size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: 'hsl(var(--bg-main))', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>{filters.maxStock}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Limite Máximo</span>
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

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Faixa de Custo Médio <DollarSign size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="filter-field">
                <label className="tauze-label" style={{ fontSize: '10px', marginBottom: '8px' }}>Min (R$)</label>
                <input 
                  type="number" 
                  className="tauze-input" 
                  placeholder="0,00"
                  value={filters.minPrice}
                  onChange={e => setFilters({ ...filters, minPrice: parseFloat(e.target.value) })}
                />
              </div>
              <div className="filter-field">
                <label className="tauze-label" style={{ fontSize: '10px', marginBottom: '8px' }}>Max (R$)</label>
                <input 
                  type="number" 
                  className="tauze-input" 
                  placeholder="10.000,00"
                  value={filters.maxPrice}
                  onChange={e => setFilters({ ...filters, maxPrice: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#10b981' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
