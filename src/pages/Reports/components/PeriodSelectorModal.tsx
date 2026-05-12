import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, ChevronRight, Check, ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PeriodSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPeriod: string;
  onSelect: (period: string) => void;
}

export const PeriodSelectorModal: React.FC<PeriodSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedPeriod,
  onSelect
}) => {
  const [view, setView] = useState<'list' | 'custom'>('list');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const periods = [
    { id: 'safra_atual', label: 'Safra Atual (2025/26)', desc: 'Dados consolidados do ciclo produtivo vigente.', type: 'harvest' },
    { id: 'safra_anterior', label: 'Safra Anterior (2024/25)', desc: 'Comparativo histórico do último ciclo fechado.', type: 'harvest' },
    { id: 'mes_atual', label: 'Mês Atual', desc: 'Performance operacional dos últimos 30 dias.', type: 'period' },
    { id: 'trimestre', label: 'Último Trimestre', desc: 'Visão tática de médio prazo.', type: 'period' },
    { id: 'ano_civil', label: 'Ano Civil (2025)', desc: 'Fechamento contábil baseado em calendário gregoriano.', type: 'period' },
    { id: 'custom', label: 'Intervalo Personalizado', desc: 'Defina datas específicas de início e fim.', type: 'custom' },
  ];

  if (!isOpen) return null;

  const handleApplyCustom = () => {
    if (startDate && endDate) {
      onSelect(`custom:${startDate}:${endDate}`);
      onClose();
    }
  };

  return createPortal(
    <div className="elite-global-modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 40 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="elite-modal-container"
        style={{ maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="elite-modal-header">
          <div className="header-content">
            {view === 'custom' ? (
              <button className="back-btn" onClick={() => setView('list')}>
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className="icon-wrapper primary">
                <Calendar size={20} />
              </div>
            )}
            <div>
              <h3>{view === 'custom' ? 'Intervalo Customizado' : 'Período de Análise'}</h3>
              <p>{view === 'custom' ? 'Defina as datas limites para filtragem.' : 'Selecione o horizonte temporal para os relatórios.'}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="elite-modal-body">
          <AnimatePresence mode="wait">
            {view === 'list' ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="period-list"
              >
                {periods.map((period) => (
                  <button 
                    key={period.id}
                    className={`period-item ${selectedPeriod === period.id ? 'active' : ''}`}
                    onClick={() => {
                      if (period.id === 'custom') {
                        setView('custom');
                      } else {
                        onSelect(period.id);
                        onClose();
                      }
                    }}
                  >
                    <div className="period-info">
                      <span className="period-label">{period.label}</span>
                      <span className="period-desc">{period.desc}</span>
                    </div>
                    <div className="period-action">
                      {selectedPeriod === period.id ? (
                        <div className="active-dot-wrapper">
                          <Check size={16} className="text-brand" />
                        </div>
                      ) : (
                        <ChevronRight size={18} className="text-muted" />
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="custom"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="custom-range-view"
              >
                <div className="date-inputs-grid">
                  <div className="input-group">
                    <label>DATA INICIAL</label>
                    <div className="date-input-wrapper">
                      <Calendar size={14} className="input-icon" />
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>DATA FINAL</label>
                    <div className="date-input-wrapper">
                      <Calendar size={14} className="input-icon" />
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  className="apply-range-btn" 
                  disabled={!startDate || !endDate}
                  onClick={handleApplyCustom}
                >
                  <Send size={18} />
                  APLICAR INTERVALO
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="elite-modal-footer">
          <p className="footer-hint">A alteração do período recalcula todos os indicadores do Dashboard em tempo real.</p>
        </div>
      </motion.div>

      <style>{`
        .elite-global-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }

        .back-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: hsl(var(--bg-main));
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--text-main));
          border: 1px solid hsl(var(--border));
        }

        .period-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .period-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: hsl(var(--bg-main) / 0.5);
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          width: 100%;
        }

        .period-item:hover {
          border-color: hsl(var(--brand) / 0.4);
          background: white;
          transform: scale(1.02);
          box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1);
        }

        .period-item.active {
          border-color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.05);
          box-shadow: inset 0 0 0 1px hsl(var(--brand));
        }

        .active-dot-wrapper {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: hsl(var(--brand) / 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .period-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .period-label {
          font-size: 14px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }

        .period-desc {
          font-size: 11px;
          color: hsl(var(--text-muted));
          font-weight: 500;
        }

        .custom-range-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 10px 0;
        }

        .date-inputs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 10px;
          font-weight: 900;
          color: hsl(var(--text-muted));
          letter-spacing: 0.05em;
        }

        .date-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: hsl(var(--brand));
          pointer-events: none;
        }

        .date-input-wrapper input {
          padding-left: 38px;
          height: 50px;
          background: hsl(var(--bg-main));
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
          font-weight: 700;
          color: hsl(var(--text-main));
        }

        .apply-range-btn {
          height: 56px;
          background: hsl(var(--brand));
          color: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.02em;
          box-shadow: 0 10px 25px -5px hsl(var(--brand) / 0.4);
        }

        .apply-range-btn:disabled {
          background: hsl(var(--border));
          color: hsl(var(--text-muted));
          box-shadow: none;
          cursor: not-allowed;
        }

        .apply-range-btn:hover:not(:disabled) {
          background: hsl(var(--brand-dark));
          transform: translateY(-2px);
        }

        .text-brand { color: hsl(var(--brand)); }
        .text-muted { color: hsl(var(--text-muted)); }

        .footer-hint {
          font-size: 11px;
          color: hsl(var(--text-muted));
          font-style: italic;
          text-align: center;
          width: 100%;
          padding-top: 10px;
        }
      `}</style>
    </div>,
    document.body
  );
};
