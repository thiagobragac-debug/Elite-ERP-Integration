import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Barcode,
  Building2,
  Calendar,
  DollarSign,
  Package,
  ShieldCheck,
  FileSearch,
  Hash,
  Layers
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface EntryInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const EntryInvoiceForm: React.FC<EntryInvoiceFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    invoice_number: '',
    series: '',
    supplier_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    entry_date: new Date().toISOString().split('T')[0],
    total_value: '',
    tax_value: '',
    xml_key: '',
    description: ''
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        invoice_number: initialData.numero_nota || '',
        series: initialData.serie || '',
        supplier_id: initialData.fornecedor_id || '',
        issue_date: initialData.data_emissao || new Date().toISOString().split('T')[0],
        entry_date: initialData.data_entrada || new Date().toISOString().split('T')[0],
        total_value: initialData.valor_total?.toString() || '',
        tax_value: initialData.valor_impostos?.toString() || '',
        xml_key: initialData.chave_xml || '',
        description: initialData.observacoes || ''
      });
    } else {
      setFormData({
        invoice_number: '',
        series: '',
        supplier_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        entry_date: new Date().toISOString().split('T')[0],
        total_value: '',
        tax_value: '',
        xml_key: '',
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
      title={initialData ? "Editar Nota Fiscal" : "Lançar Nota Fiscal de Entrada"}
      subtitle="Registre a entrada de mercadorias e alimente o estoque/financeiro."
      icon={FileText}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Processar Entrada"}
    >
      <div className="form-group full-width">
        <label><Barcode size={14} /> Chave de Acesso (NFe)</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Chave de 44 dígitos..." 
            style={{ flex: 1 }}
            value={formData.xml_key}
            onChange={(e) => setFormData({...formData, xml_key: e.target.value})}
          />
          <button type="button" className="secondary-btn" style={{ padding: '0 12px' }}>
            <FileSearch size={18} />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label><Hash size={14} /> Número da Nota</label>
        <input 
          type="text" 
          placeholder="Ex: 123456..." 
          value={formData.invoice_number}
          onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Layers size={14} /> Série</label>
        <input 
          type="text" 
          placeholder="1" 
          value={formData.series}
          onChange={(e) => setFormData({...formData, series: e.target.value})}
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
        <label><Calendar size={14} /> Data de Emissão</label>
        <input 
          type="date" 
          value={formData.issue_date}
          onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data de Entrada</label>
        <input 
          type="date" 
          value={formData.entry_date}
          onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Valor Total da Nota (R$)</label>
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
        <label><FileText size={14} /> Observações de Recebimento</label>
        <textarea 
          placeholder="Ex: Mercadoria conferida, avaria detectada no item X..." 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={2}
        />
      </div>
    </FormModal>
  );
};
