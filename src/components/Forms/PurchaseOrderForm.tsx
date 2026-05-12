import React, { useState, useEffect } from 'react';
import { 
  Hash, 
  Calendar, 
  Building2, 
  DollarSign, 
  FileText, 
  Truck,
  CreditCard,
  ShoppingCart,
  Banknote,
  Wallet
} from 'lucide-react';
import { FormModal } from './FormModal';
import { InsumoEntryTable } from './InsumoEntryTable';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface PurchaseOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const { activeTenantId, activeCompany, companies } = useTenant();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [installmentsList, setInstallmentsList] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>(initialData?.itens || []);

  const [formData, setFormData] = useState({
    company_id: initialData?.company_id || activeCompany?.id || '',
    order_number: initialData?.order_number || '',
    supplier_id: initialData?.supplier_id || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    delivery_date: initialData?.delivery_date || '',
    total_value: initialData?.total_value || '',
    notes: initialData?.notes || '',
    payment_condition: initialData?.payment_condition || 'vista',
    payment_method: initialData?.payment_method || 'Boleto',
    installments: initialData?.installments || 1,
    bank_account_id: initialData?.bank_account_id || '',
    generate_financial: true,
    description: initialData?.description || ''
  });

  useEffect(() => {
    if (activeTenantId) {
      fetchSuppliers();
      fetchBankAccounts();
    }
  }, [activeTenantId]);

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('fornecedores')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .order('nome');
    if (data) setSuppliers(data);
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase
      .from('contas_bancarias')
      .select('id, nome_banco, apelido')
      .eq('tenant_id', activeTenantId)
      .order('apelido');
    if (data) setBankAccounts(data);
  };

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

  // Auto-calculate total from items
  useEffect(() => {
    const total = items.reduce((acc, item) => acc + (item.total || 0), 0);
    if (total > 0) {
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
      console.error('Error submitting order:', error);
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
      size="xlarge"
    >
      <div className="form-group full-width">
        <label><Building2 size={14} /> Empresa / Unidade Compradora</label>
        <select 
          className="elite-input"
          value={formData.company_id}
          onChange={(e) => setFormData({...formData, company_id: e.target.value})}
          required
        >
          <option value="">Selecione a empresa...</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group span-1">
        <label><Hash size={14} /> Número do Pedido (OC)</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Ex: OC-2024-001..." 
          value={formData.order_number}
          onChange={(e) => setFormData({...formData, order_number: e.target.value})}
          required 
        />
      </div>

      <div className="form-group span-3">
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

      <div className="form-group span-1">
        <label><Calendar size={14} /> Data</label>
        <input 
          className="elite-input"
          type="date" 
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          required
        />
      </div>

      <div className="form-group span-1">
        <label><Truck size={14} /> Previsão</label>
        <input 
          className="elite-input"
          type="date" 
          value={formData.delivery_date}
          onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
          required
        />
      </div>

      <div className="form-group span-1">
        <label><DollarSign size={14} /> Valor Total (R$)</label>
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

      <div className="form-group full-width">
        <InsumoEntryTable 
          items={items}
          onChange={setItems}
        />
      </div>

      <div className="form-section-title full-width" style={{ marginTop: '24px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--brand))', fontSize: '14px', fontWeight: '800' }}>
        <CreditCard size={18} />
        CONDIÇÕES DE PAGAMENTO E FINANCEIRO
      </div>

      <div className="form-group span-1">
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

      <div className="form-group span-1">
        <label><CreditCard size={14} /> Meio de Pagamento</label>
        <select 
          className="elite-input"
          value={formData.payment_method}
          onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
          required
        >
          <option value="Boleto">Boleto</option>
          <option value="Pix">Pix</option>
          <option value="Transferência">Transferência / TED</option>
          <option value="Cartão de Crédito">Cartão de Crédito</option>
          <option value="Dinheiro">Dinheiro</option>
        </select>
      </div>

      {formData.payment_condition === 'prazo' && (
        <div className="form-group span-1">
          <label><Hash size={14} /> N° de Parcelas</label>
          <input 
            className="elite-input"
            type="number" 
            min="1"
            max="48"
            value={formData.installments}
            onChange={(e) => setFormData({...formData, installments: parseInt(e.target.value) || 1})}
            required 
          />
        </div>
      )}

      <div className={formData.payment_condition === 'prazo' ? "form-group span-1" : "form-group span-2"}>
        <label><Wallet size={14} /> Conta Bancária / Caixa</label>
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

      <div className="form-group full-width" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'hsl(var(--brand)/0.05)', padding: '16px', borderRadius: '12px', border: '1px dashed hsl(var(--brand)/0.3)' }}>
        <input 
          type="checkbox" 
          id="gen_fin_po"
          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          checked={formData.generate_financial}
          onChange={(e) => setFormData({...formData, generate_financial: e.target.checked})}
        />
        <label htmlFor="gen_fin_po" style={{ margin: 0, cursor: 'pointer', fontWeight: '700', color: 'hsl(var(--brand))' }}>
          Gerar Financeiro Automático (Contas a Pagar)
        </label>
      </div>

      {formData.payment_condition === 'prazo' && installmentsList.length > 0 && (
        <div className="form-group full-width" style={{ marginTop: '8px' }}>
          <div style={{ background: 'hsl(var(--bg-main)/0.3)', borderRadius: '12px', border: '1px solid hsl(var(--border))', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--text-muted))', marginBottom: '8px', textTransform: 'uppercase' }}>
              CRONOGRAMA DE PAGAMENTO
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {installmentsList.map((inst, index) => (
                <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--brand))', width: '30px' }}>{index + 1}ª</span>
                  <input 
                    type="date" 
                    className="elite-input" 
                    style={{ height: '32px', padding: '0 8px', fontSize: '12px', flex: 1 }}
                    value={inst.dueDate}
                    onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                  />
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '800', color: 'hsl(var(--text-muted))' }}>R$</span>
                    <input 
                      type="number" 
                      className="elite-input" 
                      style={{ height: '32px', padding: '0 8px 0 24px', fontSize: '12px', width: '100%' }}
                      value={inst.value}
                      onChange={(e) => updateInstallment(inst.id, 'value', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) === parseFloat(formData.total_value).toFixed(2) ? 'green' : 'red' }}>
              Soma das Parcelas: {installmentsList.reduce((acc, i) => acc + i.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              {installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) !== parseFloat(formData.total_value).toFixed(2) && (
                <span style={{ display: 'block', fontSize: '10px' }}>(Divergente do total do pedido)</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="form-group full-width">
        <label><FileText size={14} /> Observações Adicionais</label>
        <textarea 
          className="elite-input"
          placeholder="Condições especiais de frete, observações de descarga, etc..." 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          style={{ height: '80px', paddingTop: '12px' }}
        />
      </div>
    </FormModal>
  );
};
