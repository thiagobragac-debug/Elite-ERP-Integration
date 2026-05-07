import React, { useState } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Building2, 
  FileText,
  CreditCard,
  Target,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useEffect } from 'react';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'payable' | 'receivable';
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, type, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    dueDate: '',
    category: '',
    entityId: '', 
    paymentMethod: 'Boleto',
    status: 'PENDENTE'
  });

  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchEntities();
    }
  }, [isOpen, activeFarm]);

  const fetchEntities = async () => {
    const table = type === 'payable' ? 'fornecedores' : 'clientes';
    const { data } = await supabase
      .from(table)
      .select('id, nome')
      .eq('tenant_id', activeFarm?.tenantId);
    if (data) setEntities(data);
  };

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.descricao || '',
        value: initialData.valor_total?.toString() || '',
        dueDate: initialData.data_vencimento || '',
        category: initialData.categoria || '',
        entityId: initialData.fornecedor_id || initialData.cliente_id || '',
        paymentMethod: initialData.metodo_pagamento || initialData.metodo_recebimento || 'Boleto',
        status: initialData.status || 'PENDENTE'
      });
    } else {
      setFormData({
        description: '',
        value: '',
        dueDate: '',
        category: '',
        entityId: '',
        paymentMethod: 'Boleto',
        status: 'PENDENTE'
      });
    }
  }, [initialData, isOpen]);

  const title = initialData 
    ? (type === 'payable' ? 'Editar Conta a Pagar' : 'Editar Conta a Receber')
    : (type === 'payable' ? 'Nova Conta a Pagar' : 'Nova Conta a Receber');
    
  const subtitle = type === 'payable' ? 'Registre uma saída de caixa para fornecedores.' : 'Registre uma entrada de caixa de clientes.';
  const entityLabel = type === 'payable' ? 'Fornecedor' : 'Cliente';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={title}
      subtitle={subtitle}
      icon={DollarSign}
      loading={loading}
      submitLabel={`Registrar ${type === 'payable' ? 'Despesa' : 'Receita'}`}
    >
      <div className="form-group full-width">
        <label><FileText size={14} /> Descrição da Transação</label>
        <input 
          type="text" 
          placeholder="Ex: Compra de Farelo de Soja" 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Valor (R$)</label>
        <input 
          type="number" 
          step="0.01" 
          placeholder="0,00" 
          value={formData.value}
          onChange={(e) => setFormData({...formData, value: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data de Vencimento</label>
        <input 
          type="date" 
          value={formData.dueDate}
          onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Building2 size={14} /> {entityLabel}</label>
        <select 
          value={formData.entityId}
          onChange={(e) => setFormData({...formData, entityId: e.target.value})}
          required
        >
          <option value="">Selecionar {entityLabel}...</option>
          {entities.map(e => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Target size={14} /> Categoria / Centro de Custo</label>
        <select 
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        >
          <option value="">Selecionar...</option>
          <option>Nutrição</option>
          <option>Sanidade</option>
          <option>Mão de Obra</option>
          <option>Venda de Gado</option>
          <option>Combustível</option>
          <option>Manutenção</option>
          <option>Administrativo</option>
        </select>
      </div>

      <div className="form-group full-width">
        <label><CreditCard size={14} /> Forma de Pagamento</label>
        <select 
          value={formData.paymentMethod}
          onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
        >
          <option>Boleto</option>
          <option>PIX</option>
          <option>Transferência</option>
          <option>Cartão</option>
          <option>Dinheiro</option>
        </select>
      </div>

      <div className="form-group full-width">
        <label><Activity size={14} /> Situação do Lançamento</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.status === 'PENDENTE' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, status: 'PENDENTE'})}
          >
            <Calendar size={16} />
            <span>Pendente</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.status === 'PAGO' || formData.status === 'RECEBIDO' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, status: type === 'payable' ? 'PAGO' : 'RECEBIDO'})}
          >
            <CheckCircle2 size={16} />
            <span>{type === 'payable' ? 'Pago' : 'Recebido'}</span>
          </div>
        </div>
      </div>
    </FormModal>
  );
};

