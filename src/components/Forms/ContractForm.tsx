import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  FileText, 
  User,
  Calendar,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Building2,
  FileDigit,
  Maximize,
  Hash,
  Settings,
  Users,
  Banknote,
  CreditCard,
  Wallet,
  Coins,
  Package,
  Activity,
  BarChart2
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';
import { DateInput } from '../../components/Form/DateInput';


interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const ContractForm: React.FC<ContractFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const { activeFarm, activeTenantId, activeCompany, companies } = useTenant();
  
  const [formData, setFormData] = usePersistentState('ContractForm_formData', {
    company_id: initialData?.company_id || activeCompany?.id || '',
    contract_number: '',
    type: 'Venda de Gado (Futuro)',
    party_id: '', 
    party_type: 'client', 
    currency: 'BRL',
    product_id: '',
    product_quantity: 0,
    product_unit: 'SC',
    product_price: 0,
    price_mechanism: 'fixed',
    start_date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    end_date: '',
    total_value: 0,
    status: 'active',
    description: '',
    payment_condition: 'vista',
    payment_method: 'Transferência',
    installments: 1,
    bank_account_id: '',
    generate_financial: true,
  });

  const [parties, setParties] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [installmentsList, setInstallmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actionId) return; // Ignore on initial mount / refresh

    if (initialData) { setFormData({
        company_id: initialData.company_id || activeCompany?.id || '',
        contract_number: initialData.numero_contrato || '',
        type: initialData.tipo || 'Venda de Gado (Futuro)',
        party_id: initialData.participante_id || '',
        party_type: initialData.tipo_participante || 'client',
        currency: initialData.currency || 'BRL',
        product_id: initialData.product_id || '',
        product_quantity: initialData.product_quantity || 0,
        product_unit: initialData.product_unit || 'SC',
        product_price: initialData.product_price || 0,
        price_mechanism: initialData.price_mechanism || 'fixed',
        start_date: initialData.data_inicio || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        end_date: initialData.data_fim || '',
        total_value: parseFloat(initialData.valor_total) || 0,
        status: initialData.status || 'active',
        description: initialData.descricao || '',
        payment_condition: initialData.payment_condition || 'vista',
        payment_method: initialData.payment_method || 'Transferência',
        installments: initialData.installments || 1,
        bank_account_id: initialData.bank_account_id || '',
        generate_financial: initialData.generate_financial ?? true,
      });
    }
  }, [initialData, isOpen, activeCompany, actionId]);

  useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchParties();
      fetchBankAccounts();
    }
  }, [isOpen, activeTenantId, formData.party_type]);

  const fetchParties = async () => {
    const { data } = await supabase
      .from('parceiros')
      .select('id, nome')
      .eq('tenant_id', activeTenantId);
    if (data) setParties(data);
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase
      .from('contas_bancarias')
      .select('*')
      .eq('tenant_id', activeTenantId)
      .order('banco');
    if (data) setBankAccounts(data);
  };

  // Auto-calculate Total Value based on quantity and price if fixed
  useEffect(() => {
    if (formData.price_mechanism === 'fixed') {
      const total = (formData.product_quantity || 0) * (formData.product_price || 0);
      if (total !== formData.total_value) {
        setFormData(prev => ({ ...prev, total_value: total }));
      }
    }
  }, [formData.product_quantity, formData.product_price, formData.price_mechanism]);

  // Handle installment generation
  useEffect(() => {
    if (formData.payment_condition === 'prazo' && formData.total_value > 0) {
      generateInstallments();
    } else {
      setInstallmentsList([]);
    }
  }, [formData.payment_condition, formData.installments, formData.total_value]);

  const generateInstallments = () => {
    const count = formData.installments;
    const total = parseFloat(formData.total_value.toString()) || 0;
    const valuePerInstallment = parseFloat((total / count).toFixed(2));
    const newList = [];

    for (let i = 1; i <= count; i++) {
      const date = new Date(formData.start_date || new Date());
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, installmentsList });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel 
      size="xxlarge"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Contrato" : "Novo Contrato / Hedge"}
      subtitle="Formalize contratos de compra, venda ou proteção de preços estruturados (Hedge/Barter)."
      icon={FileText}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Registrar Contrato"}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados Gerais do Contrato</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Empresa / Unidade Produtiva</label>
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
            <label className="tauze-label"><Settings size={14} /> Tipo de Operação</label>
            <SearchableSelect 
              value={formData.type}
              onChange={(val: any) => setFormData({...formData, type: val})}
              options={[
                { value: 'Venda de Gado (Futuro)', label: 'Venda de Gado (Futuro)' },
                { value: 'Compra de Grãos (Barter)', label: 'Compra de Grãos (Barter)' },
                { value: 'Arrendamento de Terras', label: 'Arrendamento de Terras' },
                { value: 'Hedge / Derivativos', label: 'Hedge / Derivativos' },
                { value: 'Prestação de Serviço', label: 'Prestação de Serviço' },
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Número do Contrato</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: CNT-2024-088..." 
              value={formData.contract_number}
              onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
              required 
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Users size={14} /> Parceiro Comercial</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
              <div className="tauze-form-radio-group" style={{ margin: 0 }}>
                <div 
                  className={`tauze-form-radio-item ${formData.party_type === 'client' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, party_type: 'client'})}
                  style={{ padding: '8px', fontSize: '11px' }}
                >
                  <User size={14} /> Cliente
                </div>
                <div 
                  className={`tauze-form-radio-item ${formData.party_type === 'supplier' ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, party_type: 'supplier'})}
                  style={{ padding: '8px', fontSize: '11px' }}
                >
                  <Building2 size={14} /> Fornecedor
                </div>
              </div>
              <SearchableSelect 
                value={formData.party_id}
                onChange={(val: any) => setFormData({...formData, party_id: val})}
                options={[
                  { value: '', label: 'Selecione o parceiro...' },
                  ...(parties || []).map(p => ({ value: String(p.id), label: String(p.nome) })),
                ]}
              />
            </div>
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Coins size={14} /> Moeda Base</label>
            <SearchableSelect 
              value={formData.currency}
              onChange={(val: any) => setFormData({...formData, currency: val})}
              options={[
                { value: 'BRL', label: 'BRL (Real Brasileiro)' },
                { value: 'USD', label: 'USD (Dólar Americano)' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Objeto do Contrato e Precificação</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-4">
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Package size={14} /> Produto / Ativo-Objeto</label>
            <SearchableSelect 
              value={formData.product_id}
              onChange={(val: any) => setFormData({...formData, product_id: val})}
              options={[
                { value: '', label: 'Selecione...' },
                { value: 'prod-1', label: 'Soja em Grãos' },
                { value: 'prod-2', label: 'Milho em Grãos' },
                { value: 'prod-3', label: 'Boi Gordo (Arroba)' },
                { value: 'prod-4', label: 'Fertilizante NPK' },
              ]}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Volume Total</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              value={formData.product_quantity}
              onChange={(e) => setFormData({...formData, product_quantity: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Unidade</label>
            <SearchableSelect 
              value={formData.product_unit}
              onChange={(val: any) => setFormData({...formData, product_unit: val})}
              options={[
                { value: 'SC', label: 'Sacas (SC)' },
                { value: 'KG', label: 'Quilogramas (KG)' },
                { value: 'TON', label: 'Toneladas (TON)' },
                { value: '@', label: 'Arrobas (@)' },
                { value: 'UN', label: 'Unidades' },
              ]}
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px', background: 'hsl(var(--brand)/0.05)', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--brand)/0.2)' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><BarChart2 size={14} /> Mecanismo de Preço</label>
            <SearchableSelect 
              value={formData.price_mechanism}
              onChange={(val: any) => setFormData({...formData, price_mechanism: val})}
              options={[
                { value: 'fixed', label: 'Preço Fixo Fechado' },
                { value: 'to_fix', label: 'A Fixar na Entrega' },
                { value: 'exchange', label: 'Referência de Bolsa (B3/CBOT)' },
              ]}
            />
          </div>

          {formData.price_mechanism === 'fixed' ? (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label"><DollarSign size={14} /> Preço Unitário ({formData.currency})</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  step="0.01"
                  value={formData.product_price}
                  onChange={(e) => setFormData({...formData, product_price: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label" style={{ color: 'hsl(var(--brand))' }}><DollarSign size={14} /> Valor Total do Contrato</label>
                <input 
                  className="tauze-input"
                  type="text" 
                  value={`${formData.currency} ${formData.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  readOnly
                  style={{ fontWeight: '800', background: 'transparent', border: '1px dashed hsl(var(--brand)/0.5)', color: 'hsl(var(--brand))' }}
                />
              </div>
            </>
          ) : (
            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label"><DollarSign size={14} /> Valor Total</label>
              <input 
                className="tauze-input"
                type="text" 
                value="[Valor em Aberto / A Fixar]"
                readOnly
                style={{ fontWeight: '800', background: 'hsl(var(--bg-card))', fontStyle: 'italic', color: 'hsl(var(--text-muted))' }}
              />
            </div>
          )}
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Prazos e Cláusulas</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data de Assinatura / Início</label>
            <DateInput 
              className="tauze-input"
              type="date" 
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data Limite de Entrega / Vencimento</label>
            <DateInput 
              className="tauze-input"
              type="date" 
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Cláusulas Principais / Multas e Garantias</label>
            <textarea 
              className="tauze-input tauze-textarea"
              placeholder="Descreva as condições de entrega, penalidades por atraso, padrão de qualidade, CPR atrelada..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              style={{ minHeight: '60px' }}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Financeiro Integrado</h4>
        </div>
        
        {formData.price_mechanism === 'fixed' ? (
          <>
            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group">
                <label className="tauze-label"><Banknote size={14} /> Condição de Liquidação</label>
                <SearchableSelect 
                  value={formData.payment_condition}
                  onChange={(val: any) => setFormData({...formData, payment_condition: val})}
                  options={[
                    { value: 'vista', label: 'Pagamento Único' },
                    { value: 'prazo', label: 'Parcelado / Fluxo Contínuo' },
                  ]}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><CreditCard size={14} /> Meio Principal</label>
                <SearchableSelect 
                  value={formData.payment_method}
                  onChange={(val: any) => setFormData({...formData, payment_method: val})}
                  options={[
                    { value: 'Transferência', label: 'Transferência Bancária (TED/PIX)' },
                    { value: 'Boleto', label: 'Boleto Bancário' },
                    { value: 'Permuta', label: 'Permuta / Troca' },
                  ]}
                />
              </div>

              {formData.payment_condition === 'prazo' && (
                <div className="tauze-field-group">
                  <label className="tauze-label"><Hash size={14} /> N° de Parcelas / Entregas</label>
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

              <div className="tauze-field-group" style={{ gridColumn: formData.payment_condition === 'prazo' ? 'span 1' : 'span 2' }}>
                <label className="tauze-label"><Wallet size={14} /> Conta Vinculada</label>
                <SearchableSelect 
                  value={formData.bank_account_id}
                  onChange={(val: any) => setFormData({...formData, bank_account_id: val})}
                  options={[
                    { value: '', label: 'Selecione a conta...' },
                    ...(bankAccounts || []).map(account => ({ value: String(account.id), label: String(account.descricao || account.banco) })),
                  ]}
                />
              </div>
            </div>

            <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
              <div className="tauze-field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'hsl(var(--success)/0.05)', padding: '16px', borderRadius: '12px', border: '1px dashed hsl(var(--success)/0.3)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.generate_financial}
                    onChange={(e) => setFormData({...formData, generate_financial: e.target.checked})}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'hsl(var(--success))' }}
                  />
                  <span style={{ fontWeight: '700', color: 'hsl(var(--success))' }}>
                    Projetar Títulos Financeiros Automaticamente
                  </span>
                </label>
              </div>
            </div>

            {formData.payment_condition === 'prazo' && installmentsList.length > 0 && (
              <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
                <div className="tauze-field-group" style={{ background: 'hsl(var(--bg-main)/0.3)', borderRadius: '12px', border: '1px solid hsl(var(--border))', padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--text-muted))', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Cronograma de Execução Financeira
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {installmentsList.map((inst, index) => (
                      <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--bg-card))', padding: '8px', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--brand))', width: '30px' }}>{index + 1}ª</span>
                        <DateInput 
                          type="date" 
                          className="tauze-input" 
                          style={{ height: '32px', padding: '0 8px', fontSize: '12px', flex: 1 }}
                          value={inst.dueDate}
                          onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                        />
                        <div style={{ position: 'relative', flex: 1 }}>
                          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '800', color: 'hsl(var(--text-muted))' }}>{formData.currency}</span>
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
                  <div style={{ marginTop: '16px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) === parseFloat(formData.total_value.toString()).toFixed(2) ? 'green' : 'red' }}>
                    Soma das Previsões: {formData.currency} {installmentsList.reduce((acc, i) => acc + i.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) !== parseFloat(formData.total_value.toString()).toFixed(2) && (
                      <span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>(Divergente do total do contrato)</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ background: 'hsl(var(--bg-main)/0.5)', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px dashed hsl(var(--border))' }}>
            <Activity size={24} style={{ color: 'hsl(var(--text-muted))', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'hsl(var(--text-primary))' }}>Cronograma Financeiro em Aberto</div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', maxWidth: '400px', margin: '4px auto 0' }}>
              Como este contrato possui precificação "A Fixar", as parcelas financeiras só poderão ser geradas após a fixação dos preços de tela no momento do embarque.
            </div>
          </div>
        )}
      </section>
    </SidePanel>
  );
};
