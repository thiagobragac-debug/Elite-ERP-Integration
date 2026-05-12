import React from 'react';
import { X, Filter, Check, Building2, MapPin, Layout, Globe, Calendar, ShieldCheck, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface CompanyFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const CompanyFilterModal: React.FC<CompanyFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

  const handleClear = () => {
    setFilters({
      type: 'all',
      state: 'all',
      minArea: 0,
      maxArea: 50000,
      onlyValidated: false,
      hasMatriz: 'all'
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
              <Building2 size={20} />
            </div>
            <div>
              <h3>Filtros de Unidades</h3>
              <p>Governança e estruturação global.</p>
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
            <label className="elite-filter-label">Tipo de Unidade <Globe size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {['all', 'matriz', 'filial'].map(t => (
                <button 
                  key={t}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.type === t ? 'white' : '#64748b', 
                    background: filters.type === t ? '#10a34a' : 'white', 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: filters.type === t ? '#10a34a' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => setFilters({ ...filters, type: t })}
                >
                  <span className="uppercase">{t === 'all' ? 'Todos os Tipos' : t}</span>
                  {filters.type === t && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Estado (UF) <MapPin size={14} /></label>
            <select 
              className="elite-input" 
              value={filters.state}
              onChange={e => setFilters({ ...filters, state: e.target.value })}
              style={{ width: '100%', fontWeight: 700 }}
            >
              <option value="all">Todas as Regiões</option>
              {states.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Extensão Territorial (ha) <Layout size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#10a34a' }}>{filters.maxArea.toLocaleString()} ha</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Teto de Área</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100000" 
                step="500"
                value={filters.maxArea}
                onChange={e => setFilters({ ...filters, maxArea: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#10a34a', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section" style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#10b981' }}>
                  <ShieldCheck size={18} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Dados Validados</span>
              </div>
              <input 
                type="checkbox" 
                checked={filters.onlyValidated}
                onChange={e => setFilters({ ...filters, onlyValidated: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período de Ativação <Calendar size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input type="date" className="elite-input" placeholder="Início" />
              <input type="date" className="elite-input" placeholder="Fim" />
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
