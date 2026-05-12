import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  CreditCard, 
  Calendar, 
  Building2,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { FormModal } from '../Forms/FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface BatchLiquidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedIds: (string | number)[];
  type: 'payable' | 'receivable';
  title?: string;
  subtitle?: string;
}

export const BatchLiquidationModal: React.FC<BatchLiquidationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  selectedIds,
  type,
  title,
  subtitle
}) => {
  const { activeFarm } = useTenant();
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_account_id: '',
    payment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchBankAccounts();
    }
  }, [isOpen, activeFarm]);

  const fetchBankAccounts = async () => {
    if (!activeFarm?.tenantId) return;
    
    const { data } = await supabase
      .from('contas_bancarias')
      .select('id, descricao, banco')
      .eq('tenant_id', activeFarm.tenantId);
    
    if (data) setBankAccounts(data);
  };

  const handleBatchLiquidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank_account_id) return alert('Selecione uma conta bancária.');
    
    setLoading(true);
    try {
      const table = type === 'payable' ? 'contas_pagar' : 'contas_receber';
      const statusField = type === 'payable' ? 'PAGO' : 'RECEBIDO';
      const dateField = type === 'payable' ? 'data_pagamento' : 'data_recebimento';

      // Perform updates in batch
      const { error } = await supabase
        .from(table)
        .update({ 
          status: statusField, 
          [dateField]: formData.payment_date,
          // We could also store which bank account was used if we had that field in the table
          // For now, we update the status
        })
        .in('id', selectedIds);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Batch liquidation error:', err);
      alert('Erro ao realizar a baixa em lote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleBatchLiquidation}
      title={title || "Baixa em Lote"}
      subtitle={subtitle || `Liquidando ${selectedIds.length} títulos selecionados.`}
      icon={CheckCircle2}
      loading={loading}
      submitLabel="Confirmar Baixa"
    >
      <div className="form-group full-width">
        <label><Building2 size={14} /> Conta Bancária (Destino/Origem)</label>
        <select 
          value={formData.bank_account_id}
          onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
          required
        >
          <option value="">Selecione a conta para liquidação...</option>
          {bankAccounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.descricao} - {acc.banco}</option>
          ))}
        </select>
      </div>

      <div className="form-group full-width">
        <label><Calendar size={14} /> Data da Liquidação</label>
        <input 
          type="date" 
          value={formData.payment_date}
          onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
          required
        />
      </div>

      <div style={{ gridColumn: 'span 2', padding: '16px', borderRadius: '12px', background: 'hsl(var(--warning)/0.1)', border: '1px solid hsl(var(--warning)/0.2)', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--warning))', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>
          <AlertCircle size={14} />
          ATENÇÃO
        </div>
        <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.4', color: 'hsl(var(--text-muted))' }}>
          Esta ação irá marcar todos os títulos selecionados como pagos/recebidos e não pode ser desfeita em lote.
        </p>
      </div>
    </FormModal>
  );
};
