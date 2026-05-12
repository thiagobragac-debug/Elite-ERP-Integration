import React from 'react';
import { X, Filter, Check, Star, Users, Briefcase, DollarSign, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ClientFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const ClientFilterModal: React.FC<ClientFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const segments = ['Ouro/VIP', 'Prata/Recorrente', 'Bronze/Inativo', 'Novo'];
  const ratings = ['AAA', 'AA', 'A', 'B'];

  const toggleSegment = (seg: string) => {
    const newSegs = filters.segments?.includes(seg)
      ? filters.segments.filter((s: string) => s !== seg)
      : [...(filters.segments || []), seg];
    setFilters({ ...filters, segments: newSegs });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      segments: [],
      minLtv: 0,
      maxLtv: 1000000,
      onlyChurnRisk: false,
      rating: 'all'
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
              <Users size={20} />
            </div>
            <div>
              <h3>Filtros de Clientes</h3>
              <p>Segmentação e análise de carteira.</p>
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
            <label className="elite-filter-label">Risco de Churn <AlertTriangle size={14} /></label>
            <button 
              className={`elite-tag-chip ${filters.onlyChurnRisk ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, onlyChurnRisk: !filters.onlyChurnRisk })}
              style={{ 
                width: '100%', 
                justifyContent: 'center',
                borderColor: filters.onlyChurnRisk ? '#ef4444' : '#e2e8f0', 
                background: filters.onlyChurnRisk ? '#ef4444' : 'white',
                color: filters.onlyChurnRisk ? 'white' : '#64748b'
              }}
            >
              Apenas Clientes em Risco (&gt;90d inativo)
            </button>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Rating de Crédito <Star size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {ratings.map(r => (
                <button 
                  key={r}
                  style={{ 
                    padding: '12px 4px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.rating === r ? '#f59e0b' : '#64748b', 
                    background: filters.rating === r ? '#fffbeb' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.rating === r ? '#f59e0b' : '#e2e8f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setFilters({ ...filters, rating: r })}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Segmentação VIP <Star size={14} /></label>
            <div className="elite-tag-cloud">
              {segments.map(seg => (
                <button 
                  key={seg}
                  className={`elite-tag-chip ${filters.segments?.includes(seg) ? 'active' : ''}`}
                  onClick={() => toggleSegment(seg)}
                  style={{ 
                    borderColor: filters.segments?.includes(seg) ? '#10b981' : '#e2e8f0', 
                    background: filters.segments?.includes(seg) ? '#10b981' : 'white',
                    color: filters.segments?.includes(seg) ? 'white' : '#64748b'
                  }}
                >
                  {seg}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Exposição Financeira (LTV) <DollarSign size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>{filters.maxLtv.toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Volume Acumulado</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000000" 
                step="50000"
                value={filters.maxLtv}
                onChange={e => setFilters({ ...filters, maxLtv: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981', height: '6px', cursor: 'pointer' }}
              />
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
