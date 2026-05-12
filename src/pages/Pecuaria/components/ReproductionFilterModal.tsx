import React from 'react';
import { X, Filter, Check, Heart, Baby, Thermometer, Calendar, TrendingUp, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ReproductionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const ReproductionFilterModal: React.FC<ReproductionFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const eventTypes = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'IATF', label: 'IATF', icon: Zap },
    { id: 'Monta Natural', label: 'Monta Natural', icon: Activity },
    { id: 'Inseminação', label: 'Inseminação', icon: Heart },
    { id: 'Palpação', label: 'Palpação/Toque', icon: Thermometer },
    { id: 'Parto', label: 'Parto', icon: Baby }
  ];

  const results = ['Prenha', 'Vazia', 'Duvidosa', 'Aborto'];

  const toggleResult = (res: string) => {
    const newResults = filters.results?.includes(res)
      ? filters.results.filter((r: string) => r !== res)
      : [...(filters.results || []), res];
    setFilters({ ...filters, results: newResults });
  };

  const handleClear = () => {
    setFilters({
      tipo_evento: 'all',
      results: [],
      minECC: 1,
      maxECC: 5,
      dateStart: '',
      dateEnd: '',
      nearParto: false
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '10px', borderRadius: '12px', color: '#ec4899' }}>
              <Heart size={20} />
            </div>
            <div>
              <h3>Filtros de Reprodução</h3>
              <p>Otimize a fertilidade e parição.</p>
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
            <label className="elite-filter-label">Ação Reprodutiva <Zap size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {eventTypes.map(t => (
                <button 
                  key={t.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: filters.tipo_evento === t.id ? '#ec4899' : '#64748b', 
                    background: filters.tipo_evento === t.id ? '#fdf2f8' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.tipo_evento === t.id ? '#ec4899' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setFilters({ ...filters, tipo_evento: t.id })}
                >
                  <t.icon size={12} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Diagnóstico de Gestação <Thermometer size={14} /></label>
            <div className="elite-tag-cloud">
              {results.map(res => (
                <button 
                  key={res}
                  className={`elite-tag-chip ${filters.results?.includes(res) ? 'active' : ''}`}
                  onClick={() => toggleResult(res)}
                  style={{ 
                    borderColor: filters.results?.includes(res) ? '#ec4899' : '#e2e8f0', 
                    background: filters.results?.includes(res) ? '#ec4899' : 'white',
                    color: filters.results?.includes(res) ? 'white' : '#64748b'
                  }}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Escore Corporal (ECC) <TrendingUp size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#ec4899' }}>{filters.minECC} a {filters.maxECC}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Faixa de ECC</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="0.5"
                value={filters.minECC}
                onChange={e => setFilters({ ...filters, minECC: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#ec4899', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período do Evento <Calendar size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input 
                type="date" 
                className="elite-input" 
                value={filters.dateStart}
                onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
              />
              <input 
                type="date" 
                className="elite-input" 
                value={filters.dateEnd}
                onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
              />
            </div>
          </div>

          <div className="elite-filter-section" style={{ background: 'rgba(236, 72, 153, 0.05)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#ec4899' }}>
                  <Baby size={18} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Parição Iminente</span>
              </div>
              <input 
                type="checkbox" 
                checked={filters.nearParto}
                onChange={e => setFilters({ ...filters, nearParto: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#ec4899' }}
              />
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#ec4899' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
