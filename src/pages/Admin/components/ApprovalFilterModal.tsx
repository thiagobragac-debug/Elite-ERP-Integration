import React from 'react';
import { X, Filter, Check, ShoppingCart, DollarSign, FileText, Calendar, Activity, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ApprovalFilters {
  status: string;
  type: string;
  dateStart: string;
  dateEnd: string;
  minAmount: string;
  maxAmount: string;
}

interface ApprovalFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ApprovalFilters;
  setFilters: (filters: ApprovalFilters) => void;
  activeTab: 'pendencies' | 'rules';
}

export const ApprovalFilterModal: React.FC<ApprovalFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  activeTab
}) => {
  if (!isOpen) return null;

  const handleClear = () => {
    setFilters({
      status: 'all',
      type: 'all',
      dateStart: '',
      dateEnd: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  const isPendencies = activeTab === 'pendencies';

  return createPortal(
    <div className="tauze-sidebar-overlay" onClick={onClose}>
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
              <Filter size={20} />
            </div>
            <div>
              <h3>Filtros Avançados</h3>
              <p>{isPendencies ? 'Filtrar fila de aprovações.' : 'Filtrar regras operacionais.'}</p>
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
            <label className="tauze-filter-label">Módulo / Tipo <Activity size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <button 
                style={{ 
                  padding: '12px 16px', 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  color: filters.type === 'all' ? 'white' : 'hsl(var(--text-muted))', 
                  background: filters.type === 'all' ? '#3b82f6' : 'hsl(var(--bg-card))', 
                  borderRadius: '12px', 
                  border: '1px solid',
                  borderColor: filters.type === 'all' ? '#3b82f6' : 'hsl(var(--border))',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onClick={() => setFilters({ ...filters, type: 'all' })}
              >
                <span>Todos os Módulos</span>
                {filters.type === 'all' && <Check size={14} />}
              </button>
              
              {['Contas a Pagar', 'Pedidos de Compra', 'Contratos de Venda'].map(type => (
                <button 
                  key={type}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.type === type ? 'white' : 'hsl(var(--text-muted))', 
                    background: filters.type === type ? '#3b82f6' : 'hsl(var(--bg-card))', 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: filters.type === type ? '#3b82f6' : 'hsl(var(--border))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => setFilters({ ...filters, type })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {type.includes('Compra') ? <ShoppingCart size={14} /> : type.includes('Pagar') ? <DollarSign size={14} /> : <FileText size={14} />}
                    <span>{type}</span>
                  </div>
                  {filters.type === type && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Status <AlertCircle size={14} /></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {isPendencies ? (
                <>
                  <button className={`tauze-tag-chip ${filters.status === 'all' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, status: 'all' })} style={{ flex: '1 1 45%', borderColor: filters.status === 'all' ? '#3b82f6' : 'hsl(var(--border))', background: filters.status === 'all' ? '#3b82f6' : 'hsl(var(--bg-card))', color: filters.status === 'all' ? 'white' : 'hsl(var(--text-muted))' }}>Todos</button>
                  <button className={`tauze-tag-chip ${filters.status === 'pending' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, status: 'pending' })} style={{ flex: '1 1 45%', borderColor: filters.status === 'pending' ? '#3b82f6' : 'hsl(var(--border))', background: filters.status === 'pending' ? '#3b82f6' : 'hsl(var(--bg-card))', color: filters.status === 'pending' ? 'white' : 'hsl(var(--text-muted))' }}>Aguardando</button>
                  <button className={`tauze-tag-chip ${filters.status === 'approved' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, status: 'approved' })} style={{ flex: '1 1 45%', borderColor: filters.status === 'approved' ? '#3b82f6' : 'hsl(var(--border))', background: filters.status === 'approved' ? '#3b82f6' : 'hsl(var(--bg-card))', color: filters.status === 'approved' ? 'white' : 'hsl(var(--text-muted))' }}>Aprovados</button>
                  <button className={`tauze-tag-chip ${filters.status === 'rejected' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, status: 'rejected' })} style={{ flex: '1 1 45%', borderColor: filters.status === 'rejected' ? '#3b82f6' : 'hsl(var(--border))', background: filters.status === 'rejected' ? '#3b82f6' : 'hsl(var(--bg-card))', color: filters.status === 'rejected' ? 'white' : 'hsl(var(--text-muted))' }}>Recusados</button>
                </>
              ) : (
                <>
                  <button className={`tauze-tag-chip ${filters.status === 'all' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, status: 'all' })} style={{ flex: '1 1 45%', borderColor: filters.status === 'all' ? '#3b82f6' : 'hsl(var(--border))', background: filters.status === 'all' ? '#3b82f6' : 'hsl(var(--bg-card))', color: filters.status === 'all' ? 'white' : 'hsl(var(--text-muted))' }}>Todas</button>
                  <button className={`tauze-tag-chip ${filters.status === 'active' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, status: 'active' })} style={{ flex: '1 1 45%', borderColor: filters.status === 'active' ? '#3b82f6' : 'hsl(var(--border))', background: filters.status === 'active' ? '#3b82f6' : 'hsl(var(--bg-card))', color: filters.status === 'active' ? 'white' : 'hsl(var(--text-muted))' }}>Ativas</button>
                  <button className={`tauze-tag-chip ${filters.status === 'inactive' ? 'active' : ''}`} onClick={() => setFilters({ ...filters, status: 'inactive' })} style={{ flex: '1 1 45%', borderColor: filters.status === 'inactive' ? '#3b82f6' : 'hsl(var(--border))', background: filters.status === 'inactive' ? '#3b82f6' : 'hsl(var(--bg-card))', color: filters.status === 'inactive' ? 'white' : 'hsl(var(--text-muted))' }}>Inativas</button>
                </>
              )}
            </div>
          </div>

          {isPendencies && (
            <>
              <div className="tauze-filter-section">
                <label className="tauze-filter-label">Período da Solicitação <Calendar size={14} /></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Data Inicial</span>
                    <input 
                      type="date" 
                      className="tauze-input" 
                      value={filters.dateStart}
                      onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Data Final</span>
                    <input 
                      type="date" 
                      className="tauze-input" 
                      value={filters.dateEnd}
                      onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="tauze-filter-section">
                <label className="tauze-filter-label">Faixa de Valor (R$) <DollarSign size={14} /></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input 
                    type="number" 
                    className="tauze-input" 
                    placeholder="Mínimo"
                    value={filters.minAmount}
                    onChange={e => setFilters({ ...filters, minAmount: e.target.value })}
                  />
                  <input 
                    type="number" 
                    className="tauze-input" 
                    placeholder="Máximo"
                    value={filters.maxAmount}
                    onChange={e => setFilters({ ...filters, maxAmount: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

        </div>

        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#3b82f6' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
