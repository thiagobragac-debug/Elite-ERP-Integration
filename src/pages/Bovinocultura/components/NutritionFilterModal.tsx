import React from 'react';
import {
  X,
  Filter,
  Utensils,
  Wheat,
  Droplets,
  Shuffle,
  Layers,
  TrendingUp,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface NutritionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  availableIngredients?: string[]; // lista din\u00e2mica passada pelo pai
}

// Valores de 'tipo' que correspondem exatamente aos cadastrados no banco
const TIPOS_FORMULACAO = [
  { id: 'all',         label: 'Todos',       icon: Filter    },
  { id: 'Concentrado', label: 'Concentrado', icon: Layers    },
  { id: 'Sal Mineral', label: 'Sal Mineral', icon: Droplets  },
  { id: 'Total Mix',   label: 'Total Mix',   icon: Shuffle   },
  { id: 'Volumoso',    label: 'Volumoso',    icon: Wheat     },
];

const DEFAULT_FILTERS = {
  status: 'all',
  tipo: 'all',
  ingredients: [],
  maxCostMS: 100,  // coerente com o valor inicial da p\u00e1gina
  minMS: 0,
  onlyActive: true,
};

export const NutritionFilterModal: React.FC<NutritionFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  availableIngredients = [],
}) => {
  if (!isOpen) {return null;}

  const toggleIngredient = (ing: string) => {
    const current: string[] = filters.ingredients || [];
    const updated = current.includes(ing)
      ? current.filter((i) => i !== ing)
      : [...current, ing];
    setFilters({ ...filters, ingredients: updated });
  };

  const handleClear = () => setFilters({ ...DEFAULT_FILTERS });

  return createPortal(
    <div
      className="tauze-sidebar-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {onClose();}
      }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="tauze-sidebar-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabe\u00e7alho */}
        <div className="tauze-sidebar-header">
          <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              className="icon-wrapper primary"
              style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '12px', color: '#f59e0b' }}
            >
              <Utensils size={20} />
            </div>
            <div>
              <h3>Filtros Nutricionais</h3>
              <p>Refine por tipo, custo e qualidade das f\u00f3rmulas.</p>
            </div>
          </div>
          <button
            className="icon-btn-secondary"
            onClick={onClose}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="tauze-sidebar-body">

          {/* Tipo de Formula\u00e7\u00e3o */}
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Tipo de Formula\u00e7\u00e3o <Layers size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {TIPOS_FORMULACAO.map(({ id, label, icon: Icon }) => {
                const isActive = filters.tipo === id;
                return (
                  <button
                    key={id}
                    onClick={() => setFilters({ ...filters, tipo: id })}
                    style={{
                      padding: '10px 8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: isActive ? '#f59e0b' : 'hsl(var(--text-muted))',
                      background: isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isActive ? '#f59e0b' : 'hsl(var(--border))',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.18s',
                    }}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Status <CheckCircle2 size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {([['all', 'Todas'], ['active', 'Liberadas'], ['inactive', 'Bloqueadas']] as const).map(([val, label]) => {
                const isActive = filters.status === val;
                return (
                  <button
                    key={val}
                    onClick={() => setFilters({ ...filters, status: val })}
                    style={{
                      padding: '8px 6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isActive ? '#f59e0b' : 'hsl(var(--text-muted))',
                      background: isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isActive ? '#f59e0b' : 'hsl(var(--border))',
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ingredientes din\u00e2micos */}
          {availableIngredients.length > 0 && (
            <div className="tauze-filter-section">
              <label className="tauze-filter-label">
                Ingredientes na F\u00f3rmula <Wheat size={14} />
              </label>
              <div className="tauze-tag-cloud">
                {availableIngredients.map((ing) => {
                  const isActive = (filters.ingredients || []).includes(ing);
                  return (
                    <button
                      key={ing}
                      className={`tauze-tag-chip ${isActive ? 'active' : ''}`}
                      onClick={() => toggleIngredient(ing)}
                      style={{
                        borderColor: isActive ? '#f59e0b' : 'hsl(var(--border))',
                        background: isActive ? '#f59e0b' : 'hsl(var(--bg-card))',
                        color: isActive ? 'white' : 'hsl(var(--text-muted))',
                      }}
                    >
                      {ing}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custo m\u00e1ximo por kg MS */}
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Custo M\u00e1ximo / kg MS <TrendingUp size={14} />
            </label>
            <div
              className="integrity-slider-container"
              style={{ padding: '20px', background: 'hsl(var(--bg-main))', borderRadius: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b' }}>
                  {filters.maxCostMS >= 100 ? 'Sem limite' : `R$ ${Number(filters.maxCostMS).toFixed(2)}`}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                  por kg em Matéria Seca
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={filters.maxCostMS}
                onChange={(e) => setFilters({ ...filters, maxCostMS: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#f59e0b', height: '6px', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                <span>R$ 0,00</span>
                <span>Sem limite (R$ 100+)</span>
              </div>
            </div>
          </div>

          {/* Teor m\u00ednimo de MS */}
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Teor M\u00ednimo de Matéria Seca <Package size={14} />
            </label>
            <div style={{ padding: '16px', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                  M\u00ednimo aceit\u00e1vel
                </span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#0369a1' }}>
                  {filters.minMS}% MS
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filters.minMS}
                onChange={(e) => setFilters({ ...filters, minMS: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#0369a1', height: '4px', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Apenas dietas liberadas */}
          <div
            className="tauze-filter-section"
            style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#10b981' }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))', display: 'block' }}>
                    Somente Liberadas
                  </span>
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                    Ocultar dietas bloqueadas e inativas
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={filters.onlyActive}
                onChange={(e) => setFilters({ ...filters, onlyActive: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
              />
            </div>
          </div>
        </div>

        {/* Rodap\u00e9 */}
        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>
            LIMPAR
          </button>
          <button className="primary-btn" style={{ flex: 1 }} onClick={onClose}>
            APLICAR
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
