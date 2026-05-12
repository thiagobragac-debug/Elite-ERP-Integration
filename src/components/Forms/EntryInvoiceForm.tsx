import React, { useState, useEffect } from 'react';
import { 
  Hash, 
  Calendar, 
  Building2, 
  DollarSign, 
  FileText, 
  Layers, 
  Barcode,
  FileSearch,
  CreditCard,
  Banknote,
  Wallet
} from 'lucide-react';
import { FormModal } from './FormModal';
import { InsumoEntryTable } from './InsumoEntryTable';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface EntryInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const EntryInvoiceForm: React.FC<EntryInvoiceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const { activeTenantId, activeCompany, companies } = useTenant();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>(initialData?.itens || []);

  const [formData, setFormData] = useState({
    company_id: initialData?.company_id || activeCompany?.id || '',
    invoice_number: initialData?.invoice_number || '',
    series: initialData?.series || '1',
    supplier_id: initialData?.supplier_id || '',
    issue_date: initialData?.issue_date || new Date().toISOString().split('T')[0],
    entry_date: initialData?.entry_date || new Date().toISOString().split('T')[0],
    total_value: initialData?.total_value || '',
    xml_key: initialData?.xml_key || '',
    description: initialData?.description || '',
    payment_condition: initialData?.payment_condition || 'vista',
    payment_method: initialData?.payment_method || 'Boleto',
    installments: initialData?.installments || 1,
    bank_account_id: initialData?.bank_account_id || '',
    generate_financial: true
  });

  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [installmentsList, setInstallmentsList] = useState<any[]>([]);

  useEffect(() => {
    if (activeTenantId) {
      fetchSuppliers();
      fetchBankAccounts();
    }
  }, [activeTenantId]);

  // Handle installment generation
  useEffect(() => {
    if (formData.payment_condition === 'prazo' && formData.total_value) {
      generateInstallments();
    } else {
      setInstallmentsList([]);
    }
  }, [formData.payment_condition, formData.installments, formData.total_value]);

  const generateInstallments = () => {
    const count = formData.installments;
    const total = parseFloat(formData.total_value) || 0;
    const valuePerInstallment = parseFloat((total / count).toFixed(2));
    const newList = [];

    for (let i = 1; i <= count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + (30 * i));
      newList.push({
        id: i,
        dueDate: date.toISOString().split('T')[0],
        value: i === count ? parseFloat((total - (valuePerInstallment * (count - 1))).toFixed(2)) : valuePerInstallment
      });
    }
    setInstallmentsList(newList);
  };

  const updateInstallment = (id: number, field: string, value: any) => {
    setInstallmentsList(prev => prev.map(inst => 
      inst.id === id ? { ...inst, [field]: value } : inst
    ));
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('tenant_id', activeTenantId)
      .order('nome');
    if (data) setSuppliers(data);
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase
      .from('contas_bancarias')
      .select('*')
      .eq('tenant_id', activeTenantId);
    if (data) setBankAccounts(data);
  };

  useEffect(() => {
    if (items.length > 0) {
      const total = items.reduce((acc, item) => acc + (item.total || 0), 0);
      setFormData(prev => ({ ...prev, total_value: total.toString() }));
    }
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, itens: items, installmentsList });
      onClose();
    } catch (error) {
      console.error('Error submitting invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Nota Fiscal" : "Entrada de Nota Fiscal"}
      subtitle="Registro de documentos fiscais e atualização de estoque"
      icon={Barcode}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Processar Entrada"}
      size="xlarge"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px', width: '100%', gridColumn: 'span 4' }}>
        {/* LINHA 1 - IDENTIFICAÇÃO */}
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label><Building2 size={14} /> Empresa</label>
          <select 
            className="elite-input"
            value={formData.company_id}
            onChange={(e) => setFormData({...formData, company_id: e.target.value})}
            required
          >
            <option value="">Selecione...</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ gridColumn: 'span 6' }}>
          <label><Barcode size={14} /> Chave (NFe)</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input 
              className="elite-input"
              type="text" 
              placeholder="Chave de 44 dígitos..." 
              style={{ flex: 1, fontSize: '12px' }}
              value={formData.xml_key}
              onChange={(e) => setFormData({...formData, xml_key: e.target.value})}
            />
            <button type="button" className="secondary-btn" style={{ padding: '0 8px', height: '48px' }}>
              <FileSearch size={16} />
            </button>
          </div>
        </div>

        <div className="form-group" style={{ gridColumn: 'span 3' }}>
          <label><Hash size={14} /> Número</label>
          <input 
            className="elite-input"
            type="text" 
            placeholder="Ex: 000.123..." 
            value={formData.invoice_number}
            onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
            required 
          />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 1' }}>
          <label><Layers size={14} /> Série</label>
          <input 
            className="elite-input"
            type="text" 
            placeholder="1" 
            value={formData.series}
            onChange={(e) => setFormData({...formData, series: e.target.value})}
            required 
          />
        </div>

        {/* LINHA 2 - METADADOS */}
        <div className="form-group" style={{ gridColumn: 'span 6' }}>
          <label><Building2 size={14} /> Fornecedor</label>
          <select 
            className="elite-input"
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

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label><Calendar size={14} /> Emissão</label>
          <input 
            className="elite-input"
            type="date" 
            value={formData.issue_date}
            onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
            required
          />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label><Calendar size={14} /> Entrada</label>
          <input 
            className="elite-input"
            type="date" 
            value={formData.entry_date}
            onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
            required
          />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label><DollarSign size={14} /> Total (R$)</label>
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

        {/* TABELA DE ITENS */}
        <div style={{ gridColumn: 'span 12', marginTop: '12px' }}>
          <InsumoEntryTable 
            items={items}
            onChange={setItems}
          />
        </div>

        {/* FINANCEIRO */}
        <div style={{ gridColumn: 'span 12', marginTop: '24px' }}>
          <div className="elite-separator" style={{ margin: '0 0 24px 0' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--brand))', fontSize: '14px', fontWeight: '800', marginBottom: '16px', textTransform: 'uppercase' }}>
            <CreditCard size={18} />
            Condições de Pagamento e Financeiro
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <label><Banknote size={14} /> Condição</label>
              <select 
                className="elite-input"
                value={formData.payment_condition}
                onChange={(e) => setFormData({...formData, payment_condition: e.target.value})}
                required
              >
                <option value="vista">À Vista</option>
                <option value="prazo">Parcelado / A Prazo</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <label><CreditCard size={14} /> Meio de Pagamento</label>
              <select 
                className="elite-input"
                value={formData.payment_method}
                onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                required
              >
                <option value="Boleto">Boleto</option>
                <option value="Pix">Pix</option>
                <option value="Transferência">Transferência</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>

            {formData.payment_condition === 'prazo' && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label><Hash size={14} /> Parcelas</label>
                <input 
                  className="elite-input"
                  type="number" 
                  min="1"
                  max="48"
                  value={formData.installments}
                  onChange={(e) => setFormData({...formData, installments: parseInt(e.target.value) || 1})}
                />
              </div>
            )}

            <div className="form-group" style={{ gridColumn: formData.payment_condition === 'prazo' ? 'span 4' : 'span 6' }}>
              <label><Wallet size={14} /> Conta / Caixa</label>
              <select 
                className="elite-input"
                value={formData.bank_account_id}
                onChange={(e) => setFormData({...formData, bank_account_id: e.target.value})}
                required
              >
                <option value="">Selecione a conta...</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>{account.apelido || account.nome_banco}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 12', display: 'flex', alignItems: 'center', gap: '12px', background: 'hsl(var(--brand)/0.05)', padding: '12px', borderRadius: '12px', border: '1px dashed hsl(var(--brand)/0.3)', marginTop: '8px' }}>
              <input 
                type="checkbox" 
                id="gen_fin"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={formData.generate_financial}
                onChange={(e) => setFormData({...formData, generate_financial: e.target.checked})}
              />
              <label htmlFor="gen_fin" style={{ margin: 0, cursor: 'pointer', fontWeight: '700', color: 'hsl(var(--brand))', fontSize: '12px' }}>
                Gerar Financeiro Automático (Contas a Pagar)
              </label>
            </div>
          </div>

          {formData.payment_condition === 'prazo' && installmentsList.length > 0 && (
            <div style={{ marginTop: '24px', background: 'hsl(var(--bg-main)/0.3)', borderRadius: '16px', border: '1px solid hsl(var(--border))', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--text-muted))', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cronograma de Pagamento
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {installmentsList.map((inst, index) => (
                  <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'hsl(var(--brand))', width: '30px' }}>{index + 1}ª</span>
                    <input 
                      type="date" 
                      className="elite-input" 
                      style={{ height: '36px', padding: '0 8px', fontSize: '12px', flex: 1 }}
                      value={inst.dueDate}
                      onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                    />
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '800', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }}>R$</span>
                      <input 
                        type="number" 
                        className="elite-input" 
                        style={{ height: '36px', padding: '0 8px 0 24px', fontSize: '12px', width: '100%' }}
                        value={inst.value || ''}
                        onChange={(e) => updateInstallment(inst.id, 'value', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '800', color: installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) === parseFloat(formData.total_value).toFixed(2) ? '#10b981' : '#ef4444' }}>
                Soma das Parcelas: {installmentsList.reduce((acc, i) => acc + i.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          )}
        </div>

        {/* OBSERVAÇÕES */}
        <div className="form-group" style={{ gridColumn: 'span 12', marginTop: '16px' }}>
          <label><FileText size={14} /> Observações de Recebimento</label>
          <textarea 
            className="elite-input"
            placeholder="Notas adicionais sobre a conferência..." 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={{ height: '60px', paddingTop: '12px' }}
          />
        </div>
      </div>
    </FormModal>
  );
};
