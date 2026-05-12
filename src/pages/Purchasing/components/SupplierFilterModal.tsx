import React from 'react';
import { X, Filter, Check, Star, Building2, Briefcase, DollarSign, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface SupplierFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const SupplierFilterModal: React.FC<SupplierFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const categories = ['Peças', 'Insumos', 'Combustíveis', 'Serviços', 'Maquinário', 'Logística'];
  const ratingOptions = [1, 2, 3, 4, 5];

  const toggleCategory = (cat: string) => {
    const newCats = filters.categories?.includes(cat)
      ? filters.categories.filter((c: string) => c !== cat)
      : [...(filters.categories || []), cat];
    setFilters({ ...filters, categories: newCats });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      categories: [],
      minRating: 0,
      minSpend: 0,
      maxSpend: 1000000,
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
              <Building2 size={20} />
            </div>
            <div>
              <h3>Filtros de Fornecedores</h3>
              <p>Auditoria de performance e homologação.</p>
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
            <label className="elite-filter-label">Rating Mínimo <Star size={14} /></label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {ratingOptions.map(r => (
                <button 
                  key={r}
                  style={{ 
                    flex: 1,
                    padding: '12px 8px', 
                    fontSize: '12px', 
                    fontWeight: 800, 
                    color: filters.minRating >= r ? '#f59e0b' : '#64748b', 
                    background: filters.minRating >= r ? '#fffbeb' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.minRating >= r ? '#f59e0b' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  onClick={() => setFilters({ ...filters, minRating: r })}
                >
                  <Star size={12} fill={filters.minRating >= r ? 'currentColor' : 'none'} />
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Categorias de Serviço <Briefcase size={14} /></label>
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
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Volume de Transação (R$) <DollarSign size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#3b82f6' }}>{filters.maxSpend.toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Gasto Acumulado</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000000" 
                step="50000"
                value={filters.maxSpend}
                onChange={e => setFilters({ ...filters, maxSpend: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Status do Parceiro <Check size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['ATIVO', 'INATIVO'].map(s => (
                <button 
                  key={s}
                  style={{ 
                    padding: '12px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === s ? '#10b981' : '#64748b', 
                    background: filters.status === s ? '#f0fdf4' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s ? '#10b981' : '#e2e8f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setFilters({ ...filters, status: s })}
                >
                  {s}
                </button>
              ))}
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
