import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ShoppingCart,
  User,
  Package,
  Calendar,
  DollarSign,
  Truck,
  CreditCard,
  Building2,
  Hash
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface PurchaseOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    order_number: '',
    supplier_id: '',
    date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    payment_method: 'Boleto Bancário',
    total_value: '',
    status: 'ordered',
    description: ''
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        order_number: initialData.numero_pedido || '',
        supplier_id: initialData.fornecedor_id || '',
        date: initialData.data_pedido || new Date().toISOString().split('T')[0],
        delivery_date: initialData.previsao_entrega || '',
        payment_method: initialData.forma_pagamento || 'Boleto Bancário',
        total_value: initialData.valor_total?.toString() || '',
        status: initialData.status || 'ordered',
        description: initialData.observacoes || ''
      });
    } else {
      setFormData({
        order_number: '',
        supplier_id: '',
        date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        payment_method: 'Boleto Bancário',
        total_value: '',
        status: 'ordered',
        description: ''
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchSuppliers();
    }
  }, [isOpen, activeFarm]);

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('fornecedores').select('id, nome').eq('tenant_id', activeFarm.tenantId);
    if (data) setSuppliers(data);
  };

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
      title={initialData ? "Editar Pedido de Compra" : "Novo Pedido de Compra"}
      subtitle="Formalize o pedido com o fornecedor após a cotação."
      icon={ShoppingCart}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Gerar Pedido"}
    >
      <div className="form-group">
        <label><Hash size={14} /> Número do Pedido (OC)</label>
        <input 
          type="text" 
          placeholder="Ex: OC-2024-001..." 
          value={formData.order_number}
          onChange={(e) => setFormData({...formData, order_number: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Building2 size={14} /> Fornecedor</label>
        <select 
          value={formData.supplier_id}
          onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
          required
        >
          <option value="">Selecione o fornecedor...</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data do Pedido</label>
        <input 
          type="date" 
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Truck size={14} /> Previsão de Entrega</label>
        <input 
          type="date" 
          value={formData.delivery_date}
          onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><CreditCard size={14} /> Forma de Pagamento</label>
        <select 
          value={formData.payment_method}
          onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
          required
        >
          <option>Boleto Bancário</option>
          <option>Transferência (Pix/TED)</option>
          <option>Cartão de Crédito</option>
          <option>A Vista / Dinheiro</option>
          <option>Prazo (Safra)</option>
        </select>
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Valor Total do Pedido (R$)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.total_value}
          onChange={(e) => setFormData({...formData, total_value: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Observações / Itens do Pedido</label>
        <textarea 
          placeholder="Liste os itens, quantidades e condições negociadas..." 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>
    </FormModal>
  );
};
