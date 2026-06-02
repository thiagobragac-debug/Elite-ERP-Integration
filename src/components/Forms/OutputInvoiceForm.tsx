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
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { InsumoEntryTable } from './InsumoEntryTable';
import { SearchableSelect } from './SearchableSelect';

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
  const [items, setItems] = useState<any[]>([]);

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
      setItems(initialData.itens || []);
    } else {
      setFormData({
        invoice_number: '',
        series: '1',
        client_id: '',
        date: new Date().toISOString().split('T')[0],
        total_value: '0',
        nature_of_operation: 'Venda de Produção Própria',
        transport_company: '',
        description: ''
      });
      setItems([]);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const total = items.reduce((acc, curr) => acc + (curr.total || 0), 0);
    setFormData(prev => ({ ...prev, total_value: total.toString() }));
  }, [items]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchClients();
    }
  }, [isOpen, activeFarm]);

  const fetchClients = async () => {
    const { data } = await supabase.from('parceiros').select('id, nome').eq('tenant_id', activeFarm?.tenantId || '').eq('is_customer', true);
    if (data) setClients(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, itens: items });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Nota Fiscal" : "Emitir Nota Fiscal de Saída"}
      subtitle="Faturamento de vendas e transferências de mercadorias."
      icon={ArrowUpRight}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Transmitir NF-e"}
      size="xlarge"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação da Nota</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Número da Nota</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: 123456..." 
              value={formData.invoice_number}
              onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Layers size={14} /> Série</label>
            <input 
              className="tauze-input"
              type="text" 
              value={formData.series}
              onChange={(e) => setFormData({...formData, series: e.target.value})}
              required 
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><User size={14} /> Parceiro / Destinatário</label>
            <SearchableSelect 
              value={formData.client_id}
              onChange={(val: any) => setFormData({...formData, client_id: val})}
              options={[
                { value: '', label: 'Selecione o parceiro...' },
                ...(clients || []).map(c => ({ value: String(c.id), label: String(c.nome) })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Settings size={14} /> Natureza da Operação</label>
            <SearchableSelect 
              value={formData.nature_of_operation}
              onChange={(val: any) => setFormData({...formData, nature_of_operation: val})}
              options={[
                { value: 'Venda de Produção Própria', label: 'Venda de Produção Própria' },
                { value: 'Venda de Mercadoria Terceiros', label: 'Venda de Mercadoria Terceiros' },
                { value: 'Remessa para Industrialização', label: 'Remessa para Industrialização' },
                { value: 'Transferência entre Unidades', label: 'Transferência entre Unidades' },
                { value: 'Devolução de Compra', label: 'Devolução de Compra' },
              ]}
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data de Emissão</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Valor Total (R$)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.total_value}
              onChange={(e) => setFormData({...formData, total_value: e.target.value})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Logística</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><Truck size={14} /> Transportadora</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Nome da transportadora ou frete próprio..." 
              value={formData.transport_company}
              onChange={(e) => setFormData({...formData, transport_company: e.target.value})}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Itens da Nota</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <InsumoEntryTable 
            items={items}
            onChange={setItems}
          />
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Informações Adicionais</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Dados Adicionais</label>
            <textarea 
              className="tauze-input tauze-textarea"
              placeholder="Informações complementares..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ minHeight: '80px' }}
            />
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
