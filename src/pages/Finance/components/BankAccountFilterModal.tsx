import React from 'react';
import { X, Filter, Check, Building2, Wallet, CreditCard, Activity, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface BankAccountFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const BankAccountFilterModal: React.FC<BankAccountFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const handleClear = () => {
    setFilters({
      type: 'all',
      balanceStatus: 'all',
      institution: 'all'
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
              <Wallet size={20} />
            </div>
            <div>
              <h3>Filtros de Tesouraria</h3>
              <p>Gestão de liquidez e custódia.</p>
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
            <label className="elite-filter-label">Tipo de Conta <CreditCard size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {[
                { id: 'all', label: 'Todas as Modalidades' },
                { id: 'CONTA CORRENTE', label: 'Conta Corrente' },
                { id: 'POUPANÇA', label: 'Poupança / Reserva' },
                { id: 'INVESTIMENTO', label: 'Investimento / CDB' }
              ].map(t => (
                <button 
                  key={t.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.type === t.id ? '#3b82f6' : '#64748b', 
                    background: filters.type === t.id ? '#eff6ff' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.type === t.id ? '#3b82f6' : '#e2e8f0',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onClick={() => setFilters({ ...filters, type: t.id })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Status de Saldo <Activity size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'positive', label: 'Positivos' },
                { id: 'negative', label: 'Negativos' }
              ].map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.balanceStatus === s.id ? '#10b981' : '#64748b', 
                    background: filters.balanceStatus === s.id ? '#f0fdf4' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.balanceStatus === s.id ? '#10b981' : '#e2e8f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setFilters({ ...filters, balanceStatus: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Instituição <Building2 size={14} /></label>
            <select 
              className="elite-input" 
              value={filters.institution}
              onChange={e => setFilters({ ...filters, institution: e.target.value })}
              style={{ width: '100%', height: '45px', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '0 16px', fontWeight: 600, color: '#1e293b' }}
            >
              <option value="all">Todas as Instituições</option>
              <option value="itau">Itaú Unibanco</option>
              <option value="bradesco">Bradesco</option>
              <option value="bb">Banco do Brasil</option>
              <option value="santander">Santander</option>
              <option value="nubank">Nubank / Digital</option>
            </select>
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
