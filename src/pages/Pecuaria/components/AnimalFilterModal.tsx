import React from 'react';
import { X, Filter, Check, Tag, Scale, Activity, Beef } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface AnimalFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const AnimalFilterModal: React.FC<AnimalFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const racas = ['Nelore', 'Angus', 'Brahman', 'Senepol', 'Cruzamento'];
  const sexos = [{ id: 'M', label: 'Machos' }, { id: 'F', label: 'Fêmeas' }];

  const toggleRaca = (raca: string) => {
    const newRacas = filters.racas.includes(raca)
      ? filters.racas.filter((r: string) => r !== raca)
      : [...filters.racas, raca];
    setFilters({ ...filters, racas: newRacas });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      sexo: 'all',
      lote: 'all',
      racas: [],
      minWeight: 0,
      sanidadeOk: true
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
              <h3>Filtros do Rebanho</h3>
              <p>Refine a busca por critérios zootécnicos.</p>
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
            <label className="elite-filter-label">Status Sanitário <Activity size={14} /></label>
            <label className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <input 
                type="checkbox" 
                checked={filters.sanidadeOk}
                onChange={e => setFilters({ ...filters, sanidadeOk: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Apenas Animais em Dia</span>
            </label>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Peso Mínimo (kg) <Scale size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>{filters.minWeight}kg</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Filtro de Engorda</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="800" 
                step="50"
                value={filters.minWeight}
                onChange={e => setFilters({ ...filters, minWeight: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Raças Predominantes <Beef size={14} /></label>
            <div className="elite-tag-cloud">
              {racas.map(raca => (
                <button 
                  key={raca}
                  className={`elite-tag-chip ${filters.racas.includes(raca) ? 'active' : ''}`}
                  onClick={() => toggleRaca(raca)}
                >
                  {raca}
                  {filters.racas.includes(raca) && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Sexo <Tag size={14} /></label>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', gap: '4px' }}>
              <button 
                style={{ flex: 1, padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: filters.sexo === 'all' ? '#10b981' : '#64748b', background: filters.sexo === 'all' ? 'white' : 'transparent', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
                onClick={() => setFilters({ ...filters, sexo: 'all' })}
              >
                Todos
              </button>
              {sexos.map(s => (
                <button 
                  key={s.id}
                  style={{ flex: 1, padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: filters.sexo === s.id ? '#10b981' : '#64748b', background: filters.sexo === s.id ? 'white' : 'transparent', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
                  onClick={() => setFilters({ ...filters, sexo: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1 }} onClick={onClose}>FILTRAR REBANHO</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
