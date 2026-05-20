import React from 'react';
import { X, Filter, Check, Tag, Scale, Activity, Beef } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface AnimalFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const AnimalFilterModal: React.FC<AnimalFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const racas = ['Nelore', 'Angus', 'Brahman', 'Senepol', 'Cruzamento'];
  const sexos = [{ id: 'M', label: 'Machos' }, { id: 'F', label: 'Fêmeas' }];

  const toggleRaca = (raca: string) => {
    const newRacas = filters.racas.includes(raca)
      ? filters.racas.filter((r: string) => r !== raca)
      : [...filters.racas, raca];
    setFilters({ ...filters, racas: newRacas });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      sexo: 'all',
      lote: 'all',
      racas: [],
      minWeight: 0,
      sanidadeOk: true
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
            <div className="icon-wrapper primary" style={{ background: 'hsl(var(--brand) / 0.1)', padding: '10px', borderRadius: '12px', color: 'hsl(var(--brand))' }}>
              <Filter size={20} />
            </div>
            <div>
              <h3>Filtros do Rebanho</h3>
              <p>Refine a busca por critérios zootécnicos.</p>
            </div>
          </div>
          <button 
            className="icon-btn-secondary"
            style={{ padding: '8px' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="elite-sidebar-body">
          <div className="elite-filter-section">
            <label className="elite-filter-label">Status Sanitário <Activity size={14} /></label>
            <label className="checkbox-item-premium">
              <input 
                type="checkbox" 
                checked={filters.sanidadeOk}
                onChange={e => setFilters({ ...filters, sanidadeOk: e.target.checked })}
              />
              <span className="checkbox-label">Apenas Animais em Dia</span>
              <div className="checkbox-visual">
                <Check size={12} />
              </div>
            </label>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Peso Mínimo (kg) <Scale size={14} /></label>
            <div className="integrity-slider-container">
              <div className="slider-header">
                <span className="slider-value">{filters.minWeight}kg</span>
                <span className="slider-hint">Filtro de Engorda</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="800" 
                step="50"
                value={filters.minWeight}
                onChange={e => setFilters({ ...filters, minWeight: parseInt(e.target.value) })}
                className="elite-range-slider"
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Raças Predominantes <Beef size={14} /></label>
            <div className="elite-tag-cloud">
              {racas.map(raca => (
                <button 
                  key={raca}
                  className={`elite-tag-chip ${filters.racas.includes(raca) ? 'active' : ''}`}
                  onClick={() => toggleRaca(raca)}
                >
                  {raca}
                  {filters.racas.includes(raca) && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Sexo <Tag size={14} /></label>
            <div className="elite-segmented-control">
              <button 
                className={`segment-item ${filters.sexo === 'all' ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, sexo: 'all' })}
              >
                Todos
              </button>
              {sexos.map(s => (
                <button 
                  key={s.id}
                  className={`segment-item ${filters.sexo === s.id ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, sexo: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1 }} onClick={onClose}>FILTRAR REBANHO</button>
        </div>
      </motion.div>

      <style>{`
        .checkbox-item-premium {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .checkbox-item-premium:hover {
          border-color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.02);
        }

        .checkbox-item-premium input {
          display: none;
        }

        .checkbox-label {
          font-size: 14px;
          font-weight: 700;
          color: hsl(var(--text-main));
        }

        .checkbox-visual {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          border: 2px solid hsl(var(--border-strong));
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: all 0.2s;
        }

        .checkbox-item-premium input:checked + .checkbox-label + .checkbox-visual {
          background: hsl(var(--brand));
          border-color: hsl(var(--brand));
          color: white;
          box-shadow: 0 4px 10px hsl(var(--brand) / 0.3);
        }

        .integrity-slider-container {
          padding: 24px;
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          border-radius: 20px;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 20px;
        }

        .slider-value {
          font-size: 32px;
          font-weight: 950;
          color: hsl(var(--brand));
          letter-spacing: -0.04em;
        }

        .slider-hint {
          font-size: 11px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .elite-range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: hsl(var(--border));
          outline: none;
          padding: 0;
          margin: 0;
        }

        .elite-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid hsl(var(--brand));
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          transition: 0.2s;
        }

        .elite-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 0 8px hsl(var(--brand) / 0.1);
        }

        .elite-segmented-control {
          display: flex;
          background: hsl(var(--bg-main));
          padding: 6px;
          border-radius: 16px;
          gap: 6px;
          border: 1px solid hsl(var(--border));
        }

        .segment-item {
          flex: 1;
          padding: 12px;
          font-size: 12px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          border-radius: 12px;
          transition: all 0.2s;
        }

        .segment-item.active {
          background: white;
          color: hsl(var(--brand));
          box-shadow: var(--shadow-md);
        }

        .icon-btn-secondary {
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--text-muted));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }

        .icon-btn-secondary:hover {
          background: hsl(var(--bg-card));
          color: hsl(var(--danger));
          border-color: hsl(var(--danger) / 0.3);
        }
      `}</style>
    </div>,
    document.body
  );
};

