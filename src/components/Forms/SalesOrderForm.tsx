import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User,
  Package,
  Calendar,
  DollarSign,
  Truck,
  Activity,
  Layers,
  Hash,
  TrendingUp,
  Tag
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface SalesOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const SalesOrderForm: React.FC<SalesOrderFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    orderNumber: '',
    clientId: '',
    productId: '',
    quantity: '',
    unit: 'Cabeças',
    totalValue: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    transportadora: '',
    placa_veiculo: '',
    numero_gta: '',
    forma_pagamento: 'A Vista',
    comissao: '0',
    observacoes: ''
  });

  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        orderNumber: initialData.numero_pedido || '',
        clientId: initialData.cliente_id || '',
        productId: initialData.produto_id || '',
        quantity: initialData.quantidade?.toString() || '',
        unit: initialData.unidade || 'Cabeças',
        totalValue: initialData.valor_total?.toString() || '',
        date: initialData.data_pedido || new Date().toISOString().split('T')[0],
        status: initialData.status || 'pending',
        transportadora: initialData.transportadora || '',
        placa_veiculo: initialData.placa_veiculo || '',
        numero_gta: initialData.numero_gta || '',
        forma_pagamento: initialData.forma_pagamento || 'A Vista',
        comissao: initialData.comissao?.toString() || '0',
        observacoes: initialData.observacoes || ''
      });
    } else {
      setFormData({
        orderNumber: '',
        clientId: '',
        productId: '',
        quantity: '',
        unit: 'Cabeças',
        totalValue: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        transportadora: '',
        placa_veiculo: '',
        numero_gta: '',
        forma_pagamento: 'A Vista',
        comissao: '0',
        observacoes: ''
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchDependencies();
    }
  }, [isOpen]);

  const fetchDependencies = async () => {
    if (!activeFarm) return;
    const { data: clientsData } = await supabase.from('clientes').select('id, nome').eq('tenant_id', activeFarm.tenantId);
    const { data: productsData } = await supabase.from('produtos').select('id, nome').eq('tenant_id', activeFarm.tenantId);
    if (clientsData) setClients(clientsData);
    if (productsData) setProducts(productsData);
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
      title={initialData ? "Editar Pedido de Venda" : "Novo Pedido de Venda"}
      subtitle="Registre uma nova venda de animais ou produtos da fazenda."
      icon={FileText}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Pedido"}
    >
      <div className="form-group">
        <label><Hash size={14} /> Número do Pedido (PV)</label>
        <input 
          type="text" 
          placeholder="Ex: PV-001..." 
          value={formData.orderNumber}
          onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><User size={14} /> Cliente / Comprador</label>
        <select 
          value={formData.clientId}
          onChange={(e) => setFormData({...formData, clientId: e.target.value})}
          required
        >
          <option value="">Selecione o cliente...</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Package size={14} /> Produto</label>
        <select 
          value={formData.productId}
          onChange={(e) => setFormData({...formData, productId: e.target.value})}
          required
        >
          <option value="">Selecione o produto...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Layers size={14} /> Quantidade</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="number" 
            placeholder="0" 
            style={{ flex: 1 }}
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            required
          />
          <select 
            style={{ width: '100px' }}
            value={formData.unit}
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
          >
            <option>Cabeças</option>
            <option>Sacos</option>
            <option>Toneladas</option>
            <option>Arrobas (@)</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Valor Total (R$)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.totalValue}
          onChange={(e) => setFormData({...formData, totalValue: e.target.value})}
          required
        />
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
        <label><Truck size={14} /> Transportadora</label>
        <input 
          type="text" 
          placeholder="Nome da empresa ou motorista..." 
          value={formData.transportadora}
          onChange={(e) => setFormData({...formData, transportadora: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Placa do Veículo</label>
        <input 
          type="text" 
          placeholder="ABC-1234" 
          value={formData.placa_veiculo}
          onChange={(e) => setFormData({...formData, placa_veiculo: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><FileText size={14} /> Número da GTA</label>
        <input 
          type="text" 
          placeholder="Guia de Trânsito Animal" 
          value={formData.numero_gta}
          onChange={(e) => setFormData({...formData, numero_gta: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Forma de Pagamento</label>
        <select 
          value={formData.forma_pagamento}
          onChange={(e) => setFormData({...formData, forma_pagamento: e.target.value})}
        >
          <option>A Vista (PIX/TED)</option>
          <option>Boleto 30 Dias</option>
          <option>Parcelado (30/60/90)</option>
          <option>A Prazo (Safra)</option>
        </select>
      </div>

      <div className="form-group">
        <label><TrendingUp size={14} /> Comissão (%)</label>
        <input 
          type="number" 
          step="0.1"
          placeholder="0.0" 
          value={formData.comissao}
          onChange={(e) => setFormData({...formData, comissao: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Status da Entrega</label>
        <select 
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
          required
        >
          <option value="pending">Pendente (Aguardando)</option>
          <option value="shipped">Em Trânsito (Embarcado)</option>
          <option value="completed">Concluído (Entregue)</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="form-group full-width">
        <label><Tag size={14} /> Observações do Pedido</label>
        <textarea 
          placeholder="Detalhes sobre a entrega, local de embarque ou condições especiais..." 
          value={formData.observacoes}
          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
          style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
        />
      </div>
    </FormModal>
  );
};
