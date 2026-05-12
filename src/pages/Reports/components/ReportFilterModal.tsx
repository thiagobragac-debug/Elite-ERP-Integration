import React from 'react';
import { X, Filter, Check, Shield, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ReportFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const ReportFilterModal: React.FC<ReportFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const tags = ['Financeiro', 'Operacional', 'Zootécnico', 'Auditoria', 'Fiscal', 'RH', 'Logística'];
  const complexities = ['Leve', 'Médio', 'Pesado'];

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t: string) => t !== tag)
      : [...filters.tags, tag];
    setFilters({ ...filters, tags: newTags });
  };

  const handleClear = () => {
    setFilters({
      tags: [],
      complexity: 'all',
      onlyFavorites: false,
      minIntegrity: 0
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
              <Filter size={20} />
            </div>
            <div>
              <h3>Filtros Avançados</h3>
              <p>Refine a listagem técnica de relatórios.</p>
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
            <label className="elite-filter-label">Preferências <Star size={14} /></label>
            <div className="filter-options">
              <label className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid transparent' }}>
                <input 
                  type="checkbox" 
                  checked={filters.onlyFavorites}
                  onChange={e => setFilters({ ...filters, onlyFavorites: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Apenas Favoritos</span>
              </label>
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Integridade de Dados <Shield size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>{filters.minIntegrity}%</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Acuracidade Mínima</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="25"
                value={filters.minIntegrity}
                onChange={e => setFilters({ ...filters, minIntegrity: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981', height: '6px', borderRadius: '3px', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Tags Técnicas</label>
            <div className="elite-tag-cloud">
              {tags.map(tag => (
                <button 
                  key={tag}
                  className={`elite-tag-chip ${filters.tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {filters.tags.includes(tag) && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Carga do Motor (Latency) <Zap size={14} /></label>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', gap: '4px' }}>
              <button 
                style={{ flex: 1, padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: filters.complexity === 'all' ? '#10b981' : '#64748b', background: filters.complexity === 'all' ? 'white' : 'transparent', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: filters.complexity === 'all' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}
                onClick={() => setFilters({ ...filters, complexity: 'all' })}
              >
                Todos
              </button>
              {complexities.map(c => (
                <button 
                  key={c}
                  style={{ flex: 1, padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: filters.complexity === c ? '#10b981' : '#64748b', background: filters.complexity === c ? 'white' : 'transparent', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: filters.complexity === c ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}
                  onClick={() => setFilters({ ...filters, complexity: c })}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR TUDO</button>
          <button className="primary-btn" style={{ flex: 1 }} onClick={onClose}>APLICAR FILTROS</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
