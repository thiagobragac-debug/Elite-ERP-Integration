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
  Settings,
  CreditCard,
  Banknote,
  Wallet,
  ClipboardList,
  Lock,
  Scale
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
    sales_order_id: initialData?.sales_order_id || '',
    invoice_number: initialData?.numero_nota || 'Gerado pela SEFAZ',
    series: initialData?.serie || '1',
    client_id: initialData?.cliente_id || '',
    date: initialData?.data_emissao || new Date().toISOString().split('T')[0],
    total_value: initialData?.valor_total?.toString() || '0',
    nature_of_operation: initialData?.natureza_operacao || 'Venda de Produção Própria',
    
    // Logística
    transport_company: initialData?.transportadora || '',
    freight_type: initialData?.freight_type || 'CIF',
    vehicle_plate: initialData?.vehicle_plate || '',
    gross_weight: initialData?.gross_weight || '',
    
    // Financeiro
    payment_condition: initialData?.payment_condition || 'vista',
    payment_method: initialData?.payment_method || 'Boleto',
    installments: initialData?.installments || 1,
    bank_account_id: initialData?.bank_account_id || '',
    generate_financial: true,
    
    description: initialData?.observacoes || ''
  });
  const [items, setItems] = useState<any[]>(initialData?.itens || []);

  const [clients, setClients] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [installmentsList, setInstallmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchClients();
      fetchBankAccounts();
    }
  }, [isOpen, activeFarm]);

  const fetchClients = async () => {
    const { data } = await supabase.from('parceiros').select('id, nome').eq('tenant_id', activeFarm?.tenantId || '').eq('is_customer', true).order('nome');
    if (data) setClients(data);
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase
      .from('contas_bancarias')
      .select('id, banco, descricao')
      .eq('tenant_id', activeFarm?.tenantId || '')
      .order('banco');
    if (data) setBankAccounts(data);
  };

  useEffect(() => {
    const total = items.reduce((acc, curr) => acc + (curr.total || 0), 0);
    setFormData(prev => ({ ...prev, total_value: total.toString() }));
  }, [items]);

  // Handle installment generation
  useEffect(() => {
    if (formData.payment_condition === 'prazo' && formData.total_value && parseFloat(formData.total_value) > 0) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, itens: items, installmentsList });
      onClose();
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
      subtitle="Faturamento de vendas, integrações financeiras e baixas de estoque."
      icon={ArrowUpRight}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Transmitir NF-e"}
      size="xxlarge"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação da Nota</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2" style={{ marginBottom: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ color: 'hsl(var(--warning))' }}>
              <ClipboardList size={14} /> Vincular Pedido de Venda
            </label>
            <SearchableSelect 
              value={formData.sales_order_id}
              onChange={(val: any) => setFormData({...formData, sales_order_id: val})}
              options={[
                { value: '', label: 'Sem vínculo (Emissão Avulsa)' },
                { value: 'PV-001', label: 'PV-001 - Fazenda Boa Vista' },
                { value: 'PV-002', label: 'PV-002 - Grupo Scheffer' },
              ]}
            />
          </div>
          
          <div className="tauze-field-group">
            <label className="tauze-label"><Settings size={14} /> Natureza da Operação (CFOP)</label>
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

        {/* METADADOS BLINDADOS */}
        <div style={{ background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--brand))', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
            <Lock size={12}/> CONTROLE DO SISTEMA
          </div>
          <div className="tauze-input-grid grid-col-4">
            <div className="tauze-field-group">
              <label className="tauze-label"><Hash size={14} /> Número da Nota</label>
              <input 
                className="tauze-input"
                type="text" 
                value={formData.invoice_number}
                readOnly
                style={{ background: 'hsl(var(--bg-card))', opacity: 0.8 }}
              />
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label"><Layers size={14} /> Série</label>
              <input 
                className="tauze-input"
                type="text" 
                value={formData.series}
                readOnly
                style={{ background: 'hsl(var(--bg-card))', opacity: 0.8 }}
              />
            </div>
            
            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label"><DollarSign size={14} /> Valor Total (R$)</label>
              <input 
                className="tauze-input"
                type="number" 
                value={formData.total_value}
                readOnly
                style={{ fontWeight: '800', color: 'hsl(var(--success))', background: 'hsl(var(--bg-card))' }}
              />
            </div>
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
            <label className="tauze-label"><Calendar size={14} /> Data de Emissão</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Logística de Expedição</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Truck size={14} /> Transportadora</label>
            <SearchableSelect 
              value={formData.transport_company}
              onChange={(val: any) => setFormData({...formData, transport_company: val})}
              options={[
                { value: '', label: 'O Próprio Remetente' },
                { value: 'trans-1', label: 'TransAgro Logística' },
                { value: 'trans-2', label: 'Expresso Safra' },
              ]}
            />
          </div>
          
          <div className="tauze-field-group">
            <label className="tauze-label"><Package size={14} /> Frete por Conta</label>
            <SearchableSelect 
              value={formData.freight_type}
              onChange={(val: any) => setFormData({...formData, freight_type: val})}
              options={[
                { value: 'CIF', label: 'CIF (Remetente)' },
                { value: 'FOB', label: 'FOB (Destinatário)' },
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Placa do Veículo</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: ABC-1234" 
              value={formData.vehicle_plate}
              onChange={(e) => setFormData({...formData, vehicle_plate: e.target.value.toUpperCase()})}
            />
          </div>
          
          <div className="tauze-field-group">
            <label className="tauze-label"><Scale size={14} /> Peso Bruto Total (Kg)</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="Ex: 15000" 
              value={formData.gross_weight}
              onChange={(e) => setFormData({...formData, gross_weight: e.target.value})}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Itens e Saída de Estoque</h4>
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
          <h4 className="tauze-section-title">Contas a Receber (Faturamento)</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Banknote size={14} /> Condição</label>
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
            <label className="tauze-label"><CreditCard size={14} /> Meio de Pagamento (Fatura)</label>
            <SearchableSelect 
              value={formData.payment_method}
              onChange={(val: any) => setFormData({...formData, payment_method: val})}
              options={[
                { value: 'Boleto', label: 'Boleto Bancário' },
                { value: 'Pix', label: 'Pix' },
                { value: 'Transferência', label: 'Transferência Bancária' },
              ]}
            />
          </div>

          {formData.payment_condition === 'prazo' && (
            <div className="tauze-field-group">
              <label className="tauze-label"><Hash size={14} /> Qtd. Parcelas</label>
              <input 
                className="tauze-input"
                type="number" 
                min="1"
                max="48"
                value={formData.installments}
                onChange={(e) => setFormData({...formData, installments: parseInt(e.target.value) || 1})}
              />
            </div>
          )}

          <div className="tauze-field-group" style={{ gridColumn: formData.payment_condition === 'prazo' ? 'span 1' : 'span 2' }}>
            <label className="tauze-label"><Wallet size={14} /> Conta de Destino</label>
            <SearchableSelect 
              value={formData.bank_account_id}
              onChange={(val: any) => setFormData({...formData, bank_account_id: val})}
              options={[
                { value: '', label: 'Selecione a conta de recebimento...' },
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
                Gerar Títulos no Contas a Receber
              </span>
            </label>
          </div>
        </div>

        {formData.payment_condition === 'prazo' && installmentsList.length > 0 && (
          <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
            <div className="tauze-field-group" style={{ background: 'hsl(var(--bg-main)/0.3)', borderRadius: '12px', border: '1px solid hsl(var(--border))', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--text-muted))', marginBottom: '12px', textTransform: 'uppercase' }}>
                Cronograma de Recebimentos (Boletos)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {installmentsList.map((inst, index) => (
                  <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--bg-card))', padding: '8px', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--success))', width: '30px' }}>{index + 1}ª</span>
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
                        value={inst.value || ''}
                        onChange={(e) => updateInstallment(inst.id, 'value', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) === parseFloat(formData.total_value).toFixed(2) ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                Soma das Parcelas: {installmentsList.reduce((acc, i) => acc + i.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) !== parseFloat(formData.total_value).toFixed(2) && (
                  <span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>(Divergente do total da nota)</span>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 05</div>
          <h4 className="tauze-section-title">Informações Adicionais</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Dados Adicionais</label>
            <textarea 
              className="tauze-input tauze-textarea"
              placeholder="Informações complementares (ex: ICMS retido, observações do cliente)..." 
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
