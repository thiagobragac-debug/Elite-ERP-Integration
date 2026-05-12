import React from 'react';
import { X, Filter, Check, Layers, Users, Scale, TrendingUp, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface LotFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const LotFilterModal: React.FC<LotFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const finalidades = ['Cria', 'Recria', 'Engorda', 'Confinamento', 'Quarentena'];
  const statusOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'ATIVO', label: 'Em Uso' },
    { id: 'ARQUIVADO', label: 'Arquivado' }
  ];

  const toggleFinalidade = (fin: string) => {
    const newFins = filters.finalidades?.includes(fin)
      ? filters.finalidades.filter((f: string) => f !== fin)
      : [...(filters.finalidades || []), fin];
    setFilters({ ...filters, finalidades: newFins });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      dateStart: '',
      dateEnd: '',
      finalidades: [],
      minOccupancy: 0,
      uniformityLevel: 'all'
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#8b5cf6' }}>
              <Layers size={20} />
            </div>
            <div>
              <h3>Filtros de Lotes</h3>
              <p>Refine a gestão de grupos e pastagens.</p>
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
            <label className="elite-filter-label">Status Operacional <Clock size={14} /></label>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', gap: '4px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ flex: 1, padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: filters.status === s.id ? '#8b5cf6' : '#64748b', background: filters.status === s.id ? 'white' : 'transparent', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Ocupação Mínima (%) <Users size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '28px', fontWeight: 900, color: '#8b5cf6' }}>{filters.minOccupancy}%</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Capacidade Alocada</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="10"
                value={filters.minOccupancy}
                onChange={e => setFilters({ ...filters, minOccupancy: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#8b5cf6', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Finalidade Produtiva <TrendingUp size={14} /></label>
            <div className="elite-tag-cloud">
              {finalidades.map(fin => (
                <button 
                  key={fin}
                  className={`elite-tag-chip ${filters.finalidades?.includes(fin) ? 'active' : ''}`}
                  onClick={() => toggleFinalidade(fin)}
                  style={{ 
                    borderColor: filters.finalidades?.includes(fin) ? '#8b5cf6' : '#e2e8f0', 
                    background: filters.finalidades?.includes(fin) ? '#8b5cf6' : 'white',
                    color: filters.finalidades?.includes(fin) ? 'white' : '#64748b'
                  }}
                >
                  {fin}
                  {filters.finalidades?.includes(fin) && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Uniformidade (CV) <Scale size={14} /></label>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', gap: '4px' }}>
              {['all', 'Alta', 'Média', 'Baixa'].map(u => (
                <button 
                  key={u}
                  style={{ flex: 1, padding: '12px 4px', fontSize: '10px', fontWeight: 800, color: filters.uniformityLevel === u ? '#8b5cf6' : '#64748b', background: filters.uniformityLevel === u ? 'white' : 'transparent', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
                  onClick={() => setFilters({ ...filters, uniformityLevel: u })}
                >
                  {u === 'all' ? 'Todas' : u}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Data de Formação <Calendar size={14} /></label>
            <div className="date-range-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#8b5cf6' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
