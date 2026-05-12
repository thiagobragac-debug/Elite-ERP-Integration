import React from 'react';
import { X, Filter, Check, Users, Shield, Lock, Monitor, Calendar, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface UserFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  profiles: any[];
}

export const UserFilterModal: React.FC<UserFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  profiles
}) => {
  if (!isOpen) return null;

  const handleClear = () => {
    setFilters({
      status: 'all',
      profileId: 'all',
      mfaOnly: false,
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
            <div>
              <h3>Filtros de Usuários</h3>
              <p>Gerencie acessos e governança.</p>
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
            <label className="elite-filter-label">Perfil de Acesso <Shield size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <button 
                style={{ 
                  padding: '12px 16px', 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  color: filters.profileId === 'all' ? 'white' : '#64748b', 
                  background: filters.profileId === 'all' ? '#3b82f6' : 'white', 
                  borderRadius: '12px', 
                  border: '1px solid',
                  borderColor: filters.profileId === 'all' ? '#3b82f6' : '#e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onClick={() => setFilters({ ...filters, profileId: 'all' })}
              >
                <span>Todos os Perfis</span>
                {filters.profileId === 'all' && <Check size={14} />}
              </button>
              {profiles.map(p => (
                <button 
                  key={p.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.profileId === p.id ? 'white' : '#64748b', 
                    background: filters.profileId === p.id ? '#3b82f6' : 'white', 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: filters.profileId === p.id ? '#3b82f6' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => setFilters({ ...filters, profileId: p.id })}
                >
                  <span>{p.nome || p.name}</span>
                  {filters.profileId === p.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Status da Conta <Monitor size={14} /></label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'active', 'inactive'].map(status => (
                <button 
                  key={status}
                  className={`elite-tag-chip ${filters.status === status ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, status })}
                  style={{ 
                    flex: 1,
                    borderColor: filters.status === status ? '#3b82f6' : '#e2e8f0', 
                    background: filters.status === status ? '#3b82f6' : 'white',
                    color: filters.status === status ? 'white' : '#64748b'
                  }}
                >
                  {status === 'all' ? 'Todos' : status === 'active' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section" style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#8b5cf6' }}>
                  <Lock size={18} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Apenas com MFA</span>
              </div>
              <input 
                type="checkbox" 
                checked={filters.mfaOnly}
                onChange={e => setFilters({ ...filters, mfaOnly: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#8b5cf6' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Data de Cadastro <Calendar size={14} /></label>
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
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#3b82f6' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
