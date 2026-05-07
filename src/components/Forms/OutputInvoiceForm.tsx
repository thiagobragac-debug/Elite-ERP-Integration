import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User,
  Calendar,
  DollarSign,
  Package,
  Truck,
  Building2,
  FileDigit,
  Maximize,
  ArrowUpRight,
  Hash,
  Layers,
  Settings
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface OutputInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const OutputInvoiceForm: React.FC<OutputInvoiceFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    invoice_number: '',
    series: '1',
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    total_value: '',
    nature_of_operation: 'Venda de Produção Própria',
    transport_company: '',
    description: ''
  });

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        invoice_number: initialData.numero_nota || '',
        series: initialData.serie || '1',
        client_id: initialData.cliente_id || '',
        date: initialData.data_emissao || new Date().toISOString().split('T')[0],
        total_value: initialData.valor_total?.toString() || '',
        nature_of_operation: initialData.natureza_operacao || 'Venda de Produção Própria',
        transport_company: initialData.transportadora || '',
        description: initialData.observacoes || ''
      });
    } else {
      setFormData({
        invoice_number: '',
        series: '1',
        client_id: '',
        date: new Date().toISOString().split('T')[0],
        total_value: '',
        nature_of_operation: 'Venda de Produção Própria',
        transport_company: '',
        description: ''
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchClients();
    }
  }, [isOpen, activeFarm]);

  const fetchClients = async () => {
    const { data } = await supabase.from('clientes').select('id, nome').eq('tenant_id', activeFarm.tenantId);
    if (data) setClients(data);
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
      title={initialData ? "Editar Nota Fiscal" : "Emitir Nota Fiscal de Saída"}
      subtitle="Faturamento de vendas e transferências de mercadorias."
      icon={ArrowUpRight}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Transmitir NF-e"}
    >
      <div className="elite-field-group">
        <label className="elite-label"><Hash size={14} /> Número da Nota</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Gerado automaticamente ou manual..." 
          value={formData.invoice_number}
          onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
          required 
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Layers size={14} /> Série</label>
        <input 
          className="elite-input"
          type="text" 
          value={formData.series}
          onChange={(e) => setFormData({...formData, series: e.target.value})}
          required 
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><User size={14} /> Cliente / Destinatário</label>
        <select 
          className="elite-input elite-select"
          value={formData.client_id}
          onChange={(e) => setFormData({...formData, client_id: e.target.value})}
          required
        >
          <option value="">Selecione o cliente...</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Settings size={14} /> Natureza da Operação</label>
        <select 
          className="elite-input elite-select"
          value={formData.nature_of_operation}
          onChange={(e) => setFormData({...formData, nature_of_operation: e.target.value})}
          required
        >
          <option>Venda de Produção Própria</option>
          <option>Venda de Mercadoria Terceiros</option>
          <option>Remessa para Industrialização</option>
          <option>Transferência entre Unidades</option>
          <option>Devolução de Compra</option>
        </select>
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Calendar size={14} /> Data de Emissão</label>
        <input 
          className="elite-input"
          type="date" 
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          required
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><DollarSign size={14} /> Valor Total da NF (R$)</label>
        <input 
          className="elite-input"
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.total_value}
          onChange={(e) => setFormData({...formData, total_value: e.target.value})}
          required
        />
      </div>

      <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
        <label className="elite-label"><Truck size={14} /> Transportadora</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Nome da transportadora ou frete próprio..." 
          value={formData.transport_company}
          onChange={(e) => setFormData({...formData, transport_company: e.target.value})}
        />
      </div>

      <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
        <label className="elite-label"><FileText size={14} /> Dados Adicionais</label>
        <textarea 
          className="elite-input elite-textarea"
          placeholder="Informações complementares..." 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={2}
        />
      </div>
    </FormModal>
  );
};
