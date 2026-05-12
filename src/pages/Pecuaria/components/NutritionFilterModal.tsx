import React from 'react';
import { X, Filter, Check, Utensils, Wheat, Scale, TrendingUp, Package, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface NutritionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const NutritionFilterModal: React.FC<NutritionFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const dietTypes = [
    { id: 'all', label: 'Todas', icon: Filter },
    { id: 'RECRA', label: 'Recria', icon: TrendingUp },
    { id: 'ENGORDA', label: 'Engorda', icon: Beef },
    { id: 'MANUTENCAO', label: 'Manutenção', icon: Utensils },
    { id: 'REPRODUCAO', label: 'Reprodução', icon: Zap }
  ];

  const ingredients = ['Milho Moído', 'Farelo de Soja', 'Ureia', 'Núcleo Mineral', 'Silagem', 'Caroço de Algodão'];

  const toggleIngredient = (ing: string) => {
    const newIngs = filters.ingredients?.includes(ing)
      ? filters.ingredients.filter((i: string) => i !== ing)
      : [...(filters.ingredients || []), ing];
    setFilters({ ...filters, ingredients: newIngs });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      tipo: 'all',
      ingredients: [],
      maxCostMS: 5,
      minMS: 0,
      onlyActive: true
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '12px', color: '#f59e0b' }}>
              <Utensils size={20} />
            </div>
            <div>
              <h3>Filtros de Nutrição</h3>
              <p>Gerencie custos e formulações.</p>
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
            <label className="elite-filter-label">Objetivo da Dieta <TrendingUp size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {dietTypes.map(t => (
                <button 
                  key={t.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: filters.tipo === t.id ? '#f59e0b' : '#64748b', 
                    background: filters.tipo === t.id ? '#fffbeb' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.tipo === t.id ? '#f59e0b' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setFilters({ ...filters, tipo: t.id })}
                >
                  <t.icon size={12} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Insumos Críticos <Wheat size={14} /></label>
            <div className="elite-tag-cloud">
              {ingredients.map(ing => (
                <button 
                  key={ing}
                  className={`elite-tag-chip ${filters.ingredients?.includes(ing) ? 'active' : ''}`}
                  onClick={() => toggleIngredient(ing)}
                  style={{ 
                    borderColor: filters.ingredients?.includes(ing) ? '#f59e0b' : '#e2e8f0', 
                    background: filters.ingredients?.includes(ing) ? '#f59e0b' : 'white',
                    color: filters.ingredients?.includes(ing) ? 'white' : '#64748b'
                  }}
                >
                  {ing}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Custo kg / Matéria Seca <TrendingUp size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b' }}>R$ {filters.maxCostMS.toFixed(2)}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Custo Máximo</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.10"
                value={filters.maxCostMS}
                onChange={e => setFilters({ ...filters, maxCostMS: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#f59e0b', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Percentual de MS (%) <Scale size={14} /></label>
            <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Concentração Mínima</span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#0369a1' }}>{filters.minMS}% MS</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={filters.minMS}
                onChange={e => setFilters({ ...filters, minMS: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#0369a1', height: '4px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section" style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#10b981' }}>
                  <Package size={18} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Somente Liberadas</span>
              </div>
              <input 
                type="checkbox" 
                checked={filters.onlyActive}
                onChange={e => setFilters({ ...filters, onlyActive: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
              />
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#f59e0b' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const Beef = ({ size }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3V11C21 16.5228 16.5228 21 11 21H3V13C3 7.47715 7.47715 3 13 3H21Z"/><path d="M12 12L7 17"/><path d="M12 12L17 7"/></svg>
);
