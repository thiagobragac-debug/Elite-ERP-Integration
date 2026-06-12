import React from 'react';
import { X, Filter, Check, Truck, Settings, Wrench, AlertCircle, Gauge, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface FleetFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const FleetFilterModal: React.FC<FleetFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const marcas = ['John Deere', 'Massey Ferguson', 'Case IH', 'New Holland', 'Toyota', 'Volkswagen', 'Ford', 'Mercedes-Benz'];
  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'active', label: 'Em Campo', icon: Truck },
    { id: 'maintenance', label: 'Em Revisão', icon: Wrench },
    { id: 'stopped', label: 'Crítico', icon: AlertCircle }
  ];

  const toggleMarca = (marca: string) => {
    const newMarcas = filters.marcas?.includes(marca)
      ? filters.marcas.filter((m: string) => m !== marca)
      : [...(filters.marcas || []), marca];
    setFilters({ ...filters, marcas: newMarcas });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      marcas: [],
      minUsage: 0,
      maxUsage: 10000,
      category: 'All'
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(15, 23, 42, 0.1)', padding: '10px', borderRadius: '12px', color: '#0f172a' }}>
              <Settings size={20} />
            </div>
            <div>
              <h3>Filtros de Frota</h3>
              <p>Refine a visualização do seu maquinário.</p>
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
            <label className="tauze-filter-label">Status Operacional <Truck size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#0f172a' : 'hsl(var(--text-muted))', 
                    background: filters.status === s.id ? '#f1f5f9' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#0f172a' : 'hsl(var(--border))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
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
            <label className="tauze-filter-label">Marcas Predominantes <Check size={14} /></label>
            <div className="tauze-tag-cloud">
              {marcas.map(m => (
                <button 
                  key={m}
                  className={`tauze-tag-chip ${filters.marcas?.includes(m) ? 'active' : ''}`}
                  onClick={() => toggleMarca(m)}
                  style={{ 
                    borderColor: filters.marcas?.includes(m) ? '#0f172a' : 'hsl(var(--border))', 
                    background: filters.marcas?.includes(m) ? '#0f172a' : 'hsl(var(--bg-card))',
                    color: filters.marcas?.includes(m) ? 'white' : 'hsl(var(--text-muted))'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Uso do Ativo (h/km) <Gauge size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: 'hsl(var(--bg-main))', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{filters.maxUsage}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Limite Máximo</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10000" 
                step="500"
                value={filters.maxUsage}
                onChange={e => setFilters({ ...filters, maxUsage: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#0f172a', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Ano de Fabricação <Calendar size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select 
                className="tauze-input tauze-select"
                value={filters.minYear || ''}
                onChange={e => setFilters({ ...filters, minYear: e.target.value })}
              >
                <option value="">De (Ano)</option>
                {[...Array(30)].map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
              <select 
                className="tauze-input tauze-select"
                value={filters.maxYear || ''}
                onChange={e => setFilters({ ...filters, maxYear: e.target.value })}
              >
                <option value="">Até (Ano)</option>
                {[...Array(30)].map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#0f172a' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
