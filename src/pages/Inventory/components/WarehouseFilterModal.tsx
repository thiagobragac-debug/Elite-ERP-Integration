import React from 'react';
import { X, Filter, Check, Layout, Boxes, AlertTriangle, Activity, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface WarehouseFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const WarehouseFilterModal: React.FC<WarehouseFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const handleClear = () => {
    setFilters({
      status: 'all',
      occupation: 'all',
      types: []
    });
  };

  const toggleType = (type: string) => {
    const newTypes = filters.types?.includes(type)
      ? filters.types.filter((t: string) => t !== type)
      : [...(filters.types || []), type];
    setFilters({ ...filters, types: newTypes });
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
              <Layout size={20} />
            </div>
            <div>
              <h3>Filtros de Depósito</h3>
              <p>Otimização de espaço e estrutura.</p>
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
            <label className="elite-filter-label">Status Operacional <Activity size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'ativo', label: 'Ativos' },
                { id: 'inativo', label: 'Inativos' }
              ].map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#10b981' : '#64748b', 
                    background: filters.status === s.id ? '#f0fdf4' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#10b981' : '#e2e8f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Nível de Ocupação <Target size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {[
                { id: 'all', label: 'Qualquer Ocupação' },
                { id: 'critical', label: 'Crítica (> 90%)' },
                { id: 'high', label: 'Alta (> 70%)' },
                { id: 'low', label: 'Baixa (< 20%)' }
              ].map(o => (
                <button 
                  key={o.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.occupation === o.id ? '#10b981' : '#64748b', 
                    background: filters.occupation === o.id ? '#f0fdf4' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.occupation === o.id ? '#10b981' : '#e2e8f0',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onClick={() => setFilters({ ...filters, occupation: o.id })}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Tipo de Estrutura <Boxes size={14} /></label>
            <div className="elite-tag-cloud">
              {['Galpão', 'Silo', 'Tanque', 'Câmara Fria', 'Defensivos'].map(type => (
                <button 
                  key={type}
                  className={`elite-tag-chip ${filters.types?.includes(type) ? 'active' : ''}`}
                  onClick={() => toggleType(type)}
                  style={{ 
                    borderColor: filters.types?.includes(type) ? '#10b981' : '#e2e8f0', 
                    background: filters.types?.includes(type) ? '#10b981' : 'white',
                    color: filters.types?.includes(type) ? 'white' : '#64748b'
                  }}
                >
                  {type}
                </button>
              ))}
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
