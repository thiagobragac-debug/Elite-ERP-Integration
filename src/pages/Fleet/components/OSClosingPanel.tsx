import React, { useState } from 'react';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Wrench, Check } from 'lucide-react';

interface OSClosingPanelProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  onConfirm: (data: { orderId: string; finalCost: number; closingDate: string }) => void;
  isSaving: boolean;
}

export const OSClosingPanel: React.FC<OSClosingPanelProps> = ({
  isOpen,
  order,
  onClose,
  onConfirm,
  isSaving,
}) => {
  const [finalCost, setFinalCost] = useState(order?.custo?.toString() || '0');
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      orderId: order.id,
      finalCost: parseFloat(finalCost) || 0,
      closingDate,
    });
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`Finalizar OS #${order.id.slice(0, 6).toUpperCase()}`}
      subtitle="Confirme os dados reais da intervenção antes de concluir."
      icon={Wrench}
    >
      <form onSubmit={handleSubmit} className="tauze-form">
        <div className="form-section">
          <h4 className="section-title">Valores Finais</h4>
          
          <div className="form-grid-1">
            <div className="tauze-input-group">
              <label>Custo Total Final (R$)</label>
              <div className="input-with-icon">
                <DollarSign size={16} className="input-icon" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="tauze-input"
                  value={finalCost}
                  onChange={(e) => setFinalCost(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="tauze-input-group">
              <label>Data de Conclusão</label>
              <div className="input-with-icon">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  className="tauze-input"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sidepanel-footer">
          <button type="button" className="glass-btn secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button type="submit" className="primary-btn" disabled={isSaving}>
            {isSaving ? (
              <span className="spinner"></span>
            ) : (
              <>
                <Check size={16} />
                Confirmar Fechamento
              </>
            )}
          </button>
        </div>
      </form>
    </SidePanel>
  );
};
