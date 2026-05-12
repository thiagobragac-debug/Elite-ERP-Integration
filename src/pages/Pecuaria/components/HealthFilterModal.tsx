import React from 'react';
import { X, Filter, Check, ShieldCheck, AlertCircle, Calendar, FlaskConical, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface HealthFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const HealthFilterModal: React.FC<HealthFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const typeOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'VACINA', label: 'Vacinação', icon: ShieldCheck },
    { id: 'CURATIVO', label: 'Curativo', icon: Activity },
    { id: 'PROTOCOLO', label: 'Protocolo', icon: FlaskConical },
    { id: 'OUTROS', label: 'Outros', icon: Clock }
  ];

  const handleClear = () => {
    setFilters({
      status: 'all',
      tipo: 'all',
      onlyBlocked: false,
      minCarencia: 0,
      dateStart: '',
      dateEnd: ''
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
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3>Filtros Sanitários</h3>
              <p>Rastreabilidade e controle de carência.</p>
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
            <label className="elite-filter-label">Tipo de Manejo <FlaskConical size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {typeOptions.map(t => (
                <button 
                  key={t.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: filters.tipo === t.id ? '#10a34a' : '#64748b', 
                    background: filters.tipo === t.id ? '#f0fdf4' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.tipo === t.id ? '#10a34a' : '#e2e8f0',
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
            <label className="elite-filter-label">Status de Execução <Activity size={14} /></label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'PENDENTE', 'REALIZADO'].map(status => (
                <button 
                  key={status}
                  className={`elite-tag-chip ${filters.status === status ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, status })}
                  style={{ 
                    flex: 1,
                    borderColor: filters.status === status ? '#10a34a' : '#e2e8f0', 
                    background: filters.status === status ? '#10a34a' : 'white',
                    color: filters.status === status ? 'white' : '#64748b'
                  }}
                >
                  {status === 'all' ? 'Todos' : status}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section" style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#ef4444' }}>
                  <AlertCircle size={18} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Apenas Bloqueados</span>
              </div>
              <input 
                type="checkbox" 
                checked={filters.onlyBlocked}
                onChange={e => setFilters({ ...filters, onlyBlocked: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#ef4444' }}
              />
            </div>
            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Filtra animais em período de carência ativa que não podem ser destinados ao abate ou venda.</p>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Intervalo de Manejo <Calendar size={14} /></label>
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

          <div className="elite-filter-section">
            <label className="elite-filter-label">Duração da Carência (Dias) <Clock size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#10a34a' }}>{filters.minCarencia} d</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Mínimo Esperado</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="90" 
                step="5"
                value={filters.minCarencia}
                onChange={e => setFilters({ ...filters, minCarencia: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#10a34a', height: '6px', cursor: 'pointer' }}
              />
            </div>
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
