import React from 'react';
import { X, Filter, Check, Tag, TrendingUp, AlertTriangle, User, Calendar, DollarSign, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface SalesFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const SalesFilterModal: React.FC<SalesFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'pending', label: 'Pendentes', icon: Clock },
    { id: 'shipped', label: 'Em Trânsito', icon: Truck },
    { id: 'delivered', label: 'Entregues', icon: Check }
  ];

  const clientTypes = ['Premium (A)', 'Regular (B)', 'Novo (C)', 'Risco'];

  const toggleClientType = (type: string) => {
    const newTypes = filters.clientTypes?.includes(type)
      ? filters.clientTypes.filter((t: string) => t !== type)
      : [...(filters.clientTypes || []), type];
    setFilters({ ...filters, clientTypes: newTypes });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      clientTypes: [],
      minMargin: 0,
      maxMargin: 100,
      dateStart: '',
      dateEnd: '',
      onlyHighRisk: false,
      missingGta: false
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(16, 163, 74, 0.1)', padding: '10px', borderRadius: '12px', color: '#10a34a' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h3>Filtros Comerciais</h3>
              <p>Analise conversão e saúde das vendas.</p>
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
            <label className="elite-filter-label">Fluxo de Faturamento <Tag size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#10a34a' : '#64748b', 
                    background: filters.status === s.id ? '#f0fdf4' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#10a34a' : '#e2e8f0',
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

          <div className="elite-filter-section">
            <label className="elite-filter-label">Perfil de Carteira <User size={14} /></label>
            <div className="elite-tag-cloud">
              {clientTypes.map(type => (
                <button 
                  key={type}
                  className={`elite-tag-chip ${filters.clientTypes?.includes(type) ? 'active' : ''}`}
                  onClick={() => toggleClientType(type)}
                  style={{ 
                    borderColor: filters.clientTypes?.includes(type) ? '#10a34a' : '#e2e8f0', 
                    background: filters.clientTypes?.includes(type) ? '#10a34a' : 'white',
                    color: filters.clientTypes?.includes(type) ? 'white' : '#64748b'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Margem Operacional (%) <Zap size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#10a34a' }}>{filters.minMargin}%</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Margem Mínima</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="1"
                value={filters.minMargin}
                onChange={e => setFilters({ ...filters, minMargin: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#10a34a', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período de Venda <Calendar size={14} /></label>
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

          <div className="elite-filter-section" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            <button 
              style={{ 
                padding: '12px', 
                borderRadius: '12px', 
                border: '1px solid', 
                borderColor: filters.onlyHighRisk ? '#ef4444' : '#e2e8f0',
                background: filters.onlyHighRisk ? 'rgba(239, 68, 68, 0.05)' : 'white',
                color: filters.onlyHighRisk ? '#ef4444' : '#64748b',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={() => setFilters({ ...filters, onlyHighRisk: !filters.onlyHighRisk })}
            >
              <AlertTriangle size={14} /> EXPOSIÇÃO DE RISCO ATIVA
            </button>
            <button 
              style={{ 
                padding: '12px', 
                borderRadius: '12px', 
                border: '1px solid', 
                borderColor: filters.missingGta ? '#f59e0b' : '#e2e8f0',
                background: filters.missingGta ? 'rgba(245, 158, 11, 0.05)' : 'white',
                color: filters.missingGta ? '#f59e0b' : '#64748b',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={() => setFilters({ ...filters, missingGta: !filters.missingGta })}
            >
              <Check size={14} /> GTA/DOCUMENTOS PENDENTES
            </button>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#10a34a' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const Clock = ({ size }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const Truck = ({ size }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
);
