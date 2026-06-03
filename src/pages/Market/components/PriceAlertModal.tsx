import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';
import { X, Target, Bell, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { SearchableSelect } from '../../../components/Forms/SearchableSelect';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultIndicator?: string;
  onSuccess?: () => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ isOpen, onClose, defaultIndicator = 'boi_gordo_cepea', onSuccess }) => {
  const { activeTenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [indicator, setIndicator] = useState(defaultIndicator);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState('UP');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('market_alerts').insert({
        tenant_id: activeTenantId,
        indicator,
        target_price: parseFloat(targetPrice),
        direction,
        is_active: true
      });

      if (error) throw error;
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create alert:', err);
      toast.error('Erro ao criar alerta de preço.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="modal-overlay">
        <motion.div 
          className="modal-content"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          style={{ maxWidth: '400px', width: '100%', padding: '24px', borderRadius: '24px', background: 'hsl(var(--bg-card))' }}
        >
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f59e0b20', color: '#f59e0b', padding: '8px', borderRadius: '12px' }}>
                <Target size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Novo Alvo de Preço</h3>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>Indicador de Mercado</label>
              <SearchableSelect 
                value={indicator}
                onChange={setIndicator}
                options={[
                  { value: 'boi_gordo_cepea', label: 'Boi Gordo (CEPEA) - R$/@' },
                  { value: 'bezerro_ms_cepea', label: 'Bezerro MS (CEPEA) - R$/cb' },
                  { value: 'bezerro_sp_cepea', label: 'Bezerro SP (CEPEA) - R$/cb' },
                  { value: 'milho_cepea', label: 'Milho (CEPEA) - R$/sc' }
                ]}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>Preço Alvo (R$)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder="Ex: 350.00"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', fontWeight: 700 }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>Me avise quando a cotação...</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setDirection('UP')}
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: '0.2s',
                    border: direction === 'UP' ? '2px solid #10b981' : '1px solid #e2e8f0',
                    background: direction === 'UP' ? '#10b98110' : 'white',
                    color: direction === 'UP' ? '#10b981' : '#64748b'
                  }}
                >
                  Subir para
                </button>
                <button 
                  type="button"
                  onClick={() => setDirection('DOWN')}
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: '0.2s',
                    border: direction === 'DOWN' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    background: direction === 'DOWN' ? '#ef444410' : 'white',
                    color: direction === 'DOWN' ? '#ef4444' : '#64748b'
                  }}
                >
                  Cair para
                </button>
              </div>
            </div>

            <div style={{ background: 'hsl(var(--bg-main))', padding: '12px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Bell size={16} color="#94a3b8" />
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                O robô do Copilot monitora as cotações oficiais todos os dias. Se este alvo for atingido, você receberá um alerta no Painel de Vendas.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 800, fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}
            >
              {loading ? 'Salvando Alvo...' : 'CRIAR ALERTA DE MERCADO'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
