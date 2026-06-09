import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

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
  Wallet,
  ClipboardList,
  MapPin,
  TrendingDown
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { InsumoEntryTable } from './InsumoEntryTable';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

interface PurchaseOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  actionId?: number;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({isOpen,
  onClose,
  onSubmit,
  initialData, actionId }) => {
  const { activeTenantId, activeCompany, companies } = useTenant();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [installmentsList, setInstallmentsList] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>(initialData?.itens || []);

  const [formData, setFormData] = usePersistentState('PurchaseOrderForm_formData', {
    quotation_id: initialData?.quotation_id || '',
    company_id: initialData?.company_id || activeCompany?.id || '',
    order_number: initialData?.order_number || '',
    supplier_id: initialData?.supplier_id || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    delivery_date: initialData?.delivery_date || '',
    freight_type: initialData?.freight_type || 'CIF',
    freight_value: initialData?.freight_value || '',
    discount: initialData?.discount || '',
    total_value: initialData?.total_value || '0',
    delivery_instructions: initialData?.delivery_instructions || '',
    description: initialData?.description || '', // Old notes
    payment_condition: initialData?.payment_condition || 'vista',
    payment_method: initialData?.payment_method || 'Boleto',
    installments: initialData?.installments || 1,
    bank_account_id: initialData?.bank_account_id || '',
    generate_financial: initialData ? initialData.generate_financial : false
  });

  useEffect(() => {
    if (activeTenantId) {
      fetchSuppliers();
      fetchBankAccounts();
    }
  }, [activeTenantId]);

  // Reseta todo o estado ao fechar o painel (evita dados do último lançamento persistirem)
  useEffect(() => {
    if (!isOpen && !initialData) {
      setItems([]);
      setInstallmentsList([]);
      setFormData({
        quotation_id: '',
        company_id: activeCompany?.id || '',
        order_number: '',
        supplier_id: '',
        date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        freight_type: 'CIF',
        freight_value: '',
        discount: '',
        total_value: '0',
        delivery_instructions: '',
        description: '',
        payment_condition: 'vista',
        payment_method: 'Boleto',
        installments: 1,
        bank_account_id: '',
        generate_financial: false,
      });
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('parceiros')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .eq('is_supplier', true)
      .order('nome');
    if (data) setSuppliers(data);
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase
      .from('contas_bancarias')
      .select('id, banco, descricao')
      .eq('tenant_id', activeTenantId)
      .order('banco');
    if (data) setBankAccounts(data);
  };

  // Cálculos Financeiros
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  }, [items]);

  const freightValue = parseFloat(formData.freight_value) || 0;
  const discountValue = parseFloat(formData.discount) || 0;

  const totalLiquido = useMemo(() => {
    const total = subtotal + freightValue - discountValue;
    return total > 0 ? total : 0;
  }, [subtotal, freightValue, discountValue]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, total_value: totalLiquido.toString() }));
  }, [totalLiquido]);

  // Handle installment generation
  useEffect(() => {
    if (formData.payment_condition === 'prazo' && totalLiquido > 0) {
      generateInstallments();
    } else {
      setInstallmentsList([]);
    }
  }, [formData.payment_condition, formData.installments, totalLiquido]);

  const generateInstallments = () => {
    const count = formData.installments;
    const valuePerInstallment = parseFloat((totalLiquido / count).toFixed(2));
    const newList = [];

    for (let i = 1; i <= count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + (30 * i));
      newList.push({
        id: i,
        dueDate: date.toISOString().split('T')[0],
        value: i === count ? parseFloat((totalLiquido - (valuePerInstallment * (count - 1))).toFixed(2)) : valuePerInstallment
      });
    }
    setInstallmentsList(newList);
  };

  const updateInstallment = (id: number, field: string, value: any) => {
    setInstallmentsList(prev => prev.map(inst => 
      inst.id === id ? { ...inst, [field]: value } : inst
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalLiquido <= 0) {
      alert("O total do pedido deve ser maior que zero.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ ...formData, itens: items, installmentsList, total_value: totalLiquido });
      onClose();
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Pedido de Compra" : "Novo Pedido de Compra"}
      subtitle="Formalize o pedido com o parceiro após a cotação."
      icon={ShoppingCart}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Gerar Pedido"}
      size="xlarge"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação do Pedido</h4>
        </div>

        <div className="tauze-input-grid grid-col-2" style={{ marginBottom: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Número do Pedido (OC)</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: OC-2024-001..." 
              value={formData.order_number}
              onChange={(e) => setFormData({...formData, order_number: e.target.value})}
              required 
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><ClipboardList size={14} /> Origem (Cotação Vencedora)</label>
            <SearchableSelect 
              value={formData.quotation_id}
              onChange={(val: any) => setFormData({...formData, quotation_id: val})}
              options={[
                { value: '', label: 'Criação Manual (Sem origem)' },
                { value: 'COT-001', label: 'COT-001 - Fertilizantes Safra (Vencedor: Bayer)' },
              ]}
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Empresa / Unidade Compradora</label>
            <SearchableSelect 
              value={formData.company_id}
              onChange={(val: any) => setFormData({...formData, company_id: val})}
              options={[
                { value: '', label: 'Selecione a empresa...' },
                ...(companies || []).map(c => ({ value: String(c.id), label: String(c.name) })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Parceiro</label>
            <SearchableSelect 
              value={formData.supplier_id}
              onChange={(val: any) => setFormData({...formData, supplier_id: val})}
              options={[
                { value: '', label: 'Selecione o parceiro...' },
                ...(suppliers || []).map(s => ({ value: String(s.id), label: String(s.nome) })),
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
            <label className="tauze-label"><Truck size={14} /> Previsão de Entrega (SLA)</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.delivery_date}
              onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Itens e Fechamento Financeiro</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-1">
          <InsumoEntryTable 
            items={items}
            onChange={setItems}
            companyId={formData.company_id}
          />
        </div>

        {/* MEGA RESUMO FINANCEIRO */}
        <div style={{ marginTop: '24px', background: 'hsl(var(--bg-main)/0.5)', border: '1px solid hsl(var(--border))', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: '24px', alignItems: 'flex-start' }}>
            
            {/* Inputs de Ajuste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: 'span 3' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'hsl(var(--bg-card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShoppingCart size={12}/> Subtotal dos Itens
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '8px', color: 'hsl(var(--text-main))' }}>
                    {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>

                <div>
                  <label className="tauze-label" style={{ fontSize: '11px' }}><Truck size={12}/> Valor do Frete (R$)</label>
                  <input 
                    className="tauze-input"
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={formData.freight_value}
                    onChange={(e) => setFormData({...formData, freight_value: e.target.value})}
                  />
                </div>

                <div>
                  <label className="tauze-label" style={{ fontSize: '11px' }}><TrendingDown size={12}/> Desconto Global (R$)</label>
                  <input 
                    className="tauze-input"
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* TOTAL LÍQUIDO */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', background: 'hsl(var(--brand)/0.1)', padding: '24px', borderRadius: '12px', border: '2px dashed hsl(var(--brand)/0.3)' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--brand))', letterSpacing: '0.05em' }}>TOTAL DO PEDIDO</span>
              <span style={{ fontSize: '28px', fontWeight: 900, color: 'hsl(var(--text-main))', marginTop: '4px' }}>
                {totalLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Logística</h4>
        </div>
        <div className="tauze-input-grid" style={{ gridTemplateColumns: '1fr 2.5fr' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Truck size={14} /> Tipo de Frete</label>
            <SearchableSelect 
              value={formData.freight_type}
              onChange={(val: any) => setFormData({...formData, freight_type: val})}
              options={[
                { value: 'CIF', label: 'CIF (Por conta do Fornecedor)' },
                { value: 'FOB', label: 'FOB (Por conta do Comprador)' },
              ]}
            />
          </div>
          
          <div className="tauze-field-group">
            <label className="tauze-label"><MapPin size={14} /> Instruções e Local de Entrega</label>
            <textarea className="tauze-input tauze-textarea"
              placeholder="Ex: Entregar na Fazenda Santa Cruz, Barracão 3. Horário de descarga até as 16h." 
              value={formData.delivery_instructions}
              onChange={(e) => setFormData({...formData, delivery_instructions: e.target.value})}
              style={{ minHeight: '60px' }}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Faturamento e Contas a Pagar</h4>
        </div>
        <div className="tauze-input-grid" style={{ gridTemplateColumns: formData.payment_condition === 'prazo' ? '1.5fr 1.5fr 1fr 2fr 1.2fr' : '1fr 1fr 1.5fr 1.2fr' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Banknote size={14} /> Condição Comercial</label>
            <SearchableSelect 
              value={formData.payment_condition}
              onChange={(val: any) => setFormData({...formData, payment_condition: val})}
              options={[
                { value: 'vista', label: 'À Vista' },
                { value: 'prazo', label: 'Parcelado / A Prazo' },
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><CreditCard size={14} /> Meio de Pagamento</label>
            <SearchableSelect 
              value={formData.payment_method}
              onChange={(val: any) => setFormData({...formData, payment_method: val})}
              options={[
                { value: 'Boleto', label: 'Boleto' },
                { value: 'Pix', label: 'Pix' },
                { value: 'Transferência', label: 'Transferência / TED' },
                { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
                { value: 'Dinheiro', label: 'Dinheiro' },
              ]}
            />
          </div>

          {formData.payment_condition === 'prazo' && (
            <div className="tauze-field-group">
              <label className="tauze-label"><Hash size={14} /> N° de Parcelas</label>
              <input 
                className="tauze-input"
                type="number" 
                min="1"
                max="48"
                value={formData.installments}
                onChange={(e) => setFormData({...formData, installments: parseInt(e.target.value) || 1})}
                required 
              />
            </div>
          )}

          <div className="tauze-field-group">
            <label className="tauze-label"><Wallet size={14} /> Conta Bancária / Caixa de Origem</label>
            <SearchableSelect 
              value={formData.bank_account_id}
              onChange={(val: any) => setFormData({...formData, bank_account_id: val})}
              options={[
                { value: '', label: 'Selecione a conta...' },
                ...(bankAccounts || []).map(account => ({ value: String(account.id), label: String(account.descricao || account.banco) })),
              ]}
            />
          </div>

          <div className="tauze-field-group" style={{ justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--brand)/0.05)', padding: '0 16px', height: '48px', borderRadius: '14px', border: '1px dashed hsl(var(--brand)/0.3)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <input 
                type="checkbox" 
                checked={formData.generate_financial}
                onChange={(e) => setFormData({...formData, generate_financial: e.target.checked})}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'hsl(var(--brand))', flexShrink: 0 }}
              />
              <span style={{ fontWeight: '700', color: 'hsl(var(--brand))', fontSize: '11px', lineHeight: 1.2 }}>
                Gerar Financeiro
              </span>
            </label>
          </div>
        </div>

        {formData.payment_condition === 'prazo' && installmentsList.length > 0 && (
          <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
            <div className="tauze-field-group" style={{ background: 'hsl(var(--bg-main)/0.3)', borderRadius: '12px', border: '1px solid hsl(var(--border))', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--text-muted))', marginBottom: '12px', textTransform: 'uppercase' }}>
                Cronograma de Pagamento
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {installmentsList.map((inst, index) => (
                  <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--bg-card))', padding: '8px', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--brand))', width: '30px' }}>{index + 1}ª</span>
                    <input 
                      type="date" 
                      className="tauze-input" 
                      style={{ height: '32px', padding: '0 8px', fontSize: '12px', flex: 1 }}
                      value={inst.dueDate}
                      onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                    />
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '800', color: 'hsl(var(--text-muted))' }}>R$</span>
                      <input 
                        type="number" 
                        className="tauze-input" 
                        style={{ height: '32px', padding: '0 8px 0 24px', fontSize: '12px', width: '100%' }}
                        value={inst.value}
                        onChange={(e) => updateInstallment(inst.id, 'value', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) === totalLiquido.toFixed(2) ? 'green' : 'red' }}>
                Soma das Parcelas: {installmentsList.reduce((acc, i) => acc + i.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) !== totalLiquido.toFixed(2) && (
                  <span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>(Divergente do total do pedido)</span>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <h4 className="tauze-section-title" style={{ fontSize: '13px' }}>Observações Adicionais</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <textarea className="tauze-input tauze-textarea"
              placeholder="Anotações gerais..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ minHeight: '60px' }}
            />
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
