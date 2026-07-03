import React from 'react';
import { X, Filter, Truck, MapPin, CheckCircle, Clock, XCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { DateInput } from '../../../../components/Form/DateInput';

interface PurchaseFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  fornecedores?: string[];
}

const DEFAULT_FILTERS = {
  fornecedor: 'all',
  dateStart: '',
  dateEnd: '',
};

const STATUS_OPTIONS = [
  { id: 'PENDENTE', label: 'Pendente', icon: Clock, color: '#3b82f6' },
  { id: 'EM_TRANSITO', label: 'Em Trânsito', icon: Truck, color: '#f59e0b' },
  { id: 'CONCLUIDO', label: 'Concluído', icon: CheckCircle, color: '#10b981' },
  { id: 'CANCELADO', label: 'Cancelado', icon: XCircle, color: '#ef4444' },
];

export const PurchaseFilterModal: React.FC<PurchaseFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  fornecedores = [],
}) => {
  if (!isOpen) return null;

  const handleClear = () => setFilters(DEFAULT_FILTERS);

  const toggleStatus = (statusId: string) => {
    const current = filters.statuses || [];
    const next = current.includes(statusId)
      ? current.filter((s: string) => s !== statusId)
      : [...current, statusId];
    setFilters({ ...filters, statuses: next });
  };

  return createPortal(
    <div
      className="tauze-sidebar-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="tauze-sidebar-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="tauze-sidebar-header">
          <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              className="icon-wrapper primary"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#3b82f6',
              }}
            >
              <Filter size={20} />
            </div>
            <div>
              <h3>Filtros Avançados</h3>
              <p>Refine a busca de compras e entradas.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="tauze-sidebar-body">

          {/* Filtro por Status */}
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Status do Lote <MapPin size={14} />
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              {STATUS_OPTIONS.map(({ id, label, icon: Icon, color }) => {
                const active = (filters.statuses || []).includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleStatus(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${active ? color : 'hsl(var(--border))'}`,
                      background: active ? `${color}18` : 'transparent',
                      color: active ? color : 'hsl(var(--text-muted))',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro por Fornecedor */}
          {fornecedores.length > 0 && (
            <div className="tauze-filter-section">
              <label className="tauze-filter-label">
                Fornecedor <Truck size={14} />
              </label>
              <div className="filter-chips-group">
                <button
                  className={`tauze-tag-chip ${filters.fornecedor === 'all' ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, fornecedor: 'all' })}
                >
                  Todos
                </button>
                {fornecedores.map((fornecedor) => (
                  <button
                    key={fornecedor}
                    className={`tauze-tag-chip ${filters.fornecedor === fornecedor ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, fornecedor })}
                  >
                    {fornecedor}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtro por Período */}
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Período de Compra <Calendar size={14} />
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '4px', display: 'block' }}>
                  Data Início
                </label>
                <DateInput
                  value={filters.dateStart || ''}
                  onChange={(v) => setFilters({ ...filters, dateStart: v })}
                  className="tauze-input"
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '4px', display: 'block' }}>
                  Data Fim
                </label>
                <DateInput
                  value={filters.dateEnd || ''}
                  onChange={(v) => setFilters({ ...filters, dateEnd: v })}
                  className="tauze-input"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>
            LIMPAR
          </button>
          <button className="primary-btn" style={{ flex: 1 }} onClick={onClose}>
            APLICAR
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
