import React from 'react';
import {
  X,
  FlaskConical,
  Calendar,
  Dna,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  FileEdit,
  LayoutTemplate,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { DateInput } from '../../../components/Form/DateInput';

interface ProtocolFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    status: string;
    tipo: string;
    dateStart: string;
    dateEnd: string;
    onlyComSaldo: boolean;
  };
  setFilters: (f: any) => void;
}

const STATUS_OPTIONS = [
  { id: 'todos',     label: 'Todos',       icon: LayoutTemplate, color: '#64748b' },
  { id: 'ativo',     label: 'Ativo',       icon: CheckCircle2,   color: '#10b981' },
  { id: 'rascunho',  label: 'Rascunho',    icon: FileEdit,       color: '#f59e0b' },
  { id: 'concluido', label: 'Concluído',   icon: CheckCircle2,   color: '#3b82f6' },
  { id: 'cancelado', label: 'Cancelado',   icon: XCircle,        color: '#ef4444' },
];

const TIPO_OPTIONS = [
  { id: 'todos',  label: 'Todos',  icon: FlaskConical, color: '#64748b' },
  { id: 'IATF',   label: 'IATF',   icon: Zap,          color: '#3b82f6' },
  { id: 'Monta',  label: 'Monta',  icon: Activity,     color: '#22c55e' },
  { id: 'Custom', label: 'Custom', icon: Dna,           color: '#8b5cf6' },
];

export const ProtocolFilterModal: React.FC<ProtocolFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
}) => {
  if (!isOpen) return null;

  const handleClear = () =>
    setFilters({ status: 'todos', tipo: 'todos', dateStart: '', dateEnd: '', onlyComSaldo: false });

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
              style={{ background: 'rgba(59,130,246,0.1)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}
            >
              <FlaskConical size={20} />
            </div>
            <div>
              <h3>Filtros de Protocolo</h3>
              <p>Filtre por status, tipo e período.</p>
            </div>
          </div>
          <button
            style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="tauze-sidebar-body">

          {/* Filtro: Status */}
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Status do Protocolo <Clock size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {STATUS_OPTIONS.map((s) => {
                const active = filters.status === s.id;
                return (
                  <button
                    key={s.id}
                    style={{
                      padding: '10px 8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: active ? s.color : 'hsl(var(--text-muted))',
                      background: active ? `${s.color}15` : 'transparent',
                      borderRadius: '10px',
                      border: `1px solid ${active ? s.color : 'hsl(var(--border))'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => setFilters({ ...filters, status: s.id })}
                  >
                    <s.icon size={13} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro: Tipo */}
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Tipo de Protocolo <Dna size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {TIPO_OPTIONS.map((t) => {
                const active = filters.tipo === t.id;
                return (
                  <button
                    key={t.id}
                    style={{
                      padding: '10px 8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: active ? t.color : 'hsl(var(--text-muted))',
                      background: active ? `${t.color}15` : 'transparent',
                      borderRadius: '10px',
                      border: `1px solid ${active ? t.color : 'hsl(var(--border))'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => setFilters({ ...filters, tipo: t.id })}
                  >
                    <t.icon size={13} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro: Período de Início */}
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Período de Início <Calendar size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <DateInput
                type="date"
                className="tauze-input"
                value={filters.dateStart}
                onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
              />
              <DateInput
                type="date"
                className="tauze-input"
                value={filters.dateEnd}
                onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
              />
            </div>
          </div>

          {/* Toggle: Somente com Animais */}
          <div
            className="tauze-filter-section"
            style={{ background: 'rgba(59,130,246,0.05)', padding: '16px', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#3b82f6' }}>
                  <Activity size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                    Somente com Animais
                  </span>
                  <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', margin: 0 }}>
                    Oculta protocolos sem matrizes vinculadas
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={filters.onlyComSaldo}
                onChange={(e) => setFilters({ ...filters, onlyComSaldo: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#3b82f6', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>
            LIMPAR
          </button>
          <button
            className="primary-btn"
            style={{ flex: 1, background: '#3b82f6' }}
            onClick={onClose}
          >
            APLICAR
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
