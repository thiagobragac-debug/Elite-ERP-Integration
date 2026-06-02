import React, { useState, useEffect } from 'react';
import { 
  User, 
  Hash, 
  Calendar, 
  Truck, 
  DollarSign, 
  FileText, 
  Activity, 
  TrendingUp,
  ShoppingCart,
  Building2,
  Banknote,
  Wallet,
  CreditCard
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { InsumoEntryTable } from './InsumoEntryTable';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

interface SalesOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const SalesOrderForm: React.FC<SalesOrderFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const { activeTenantId, activeCompany, companies } = useTenant();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [installmentsList, setInstallmentsList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    company_id: initialData?.company_id || activeCompany?.id || '',
    clientId: initialData?.client_id || '',
    orderNumber: initialData?.order_number || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    status: initialData?.status || 'pending',
    totalValue: initialData?.total_value || 0,
    items: initialData?.itens || [],
    transportadora: initialData?.transportadora || '',
    placa_veiculo: initialData?.placa_veiculo || '',
    numero_gta: initialData?.numero_gta || '',
    observacoes: initialData?.observacoes || '',
    payment_condition: initialData?.payment_condition || 'vista',
    payment_method: initialData?.payment_method || 'Pix',
    installments: initialData?.installments || 1,
    bank_account_id: initialData?.bank_account_id || '',
    generate_financial: true,
    comissao: initialData?.comissao || 0,
    description: initialData?.description || ''
  });

  useEffect(() => {
    if (activeTenantId) {
      fetchClients();
      fetchBankAccounts();
    }
  }, [activeTenantId]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('parceiros')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .eq('is_customer', true)
      .order('nome');
    if (data) setClients(data);
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase
      .from('contas_bancarias')
      .select('*')
      .eq('tenant_id', activeTenantId);
    if (data) setBankAccounts(data);
  };

  // Handle installment generation
  useEffect(() => {
    if (formData.payment_condition === 'prazo' && formData.totalValue) {
      generateInstallments();
    } else {
      setInstallmentsList([]);
    }
  }, [formData.payment_condition, formData.installments, formData.totalValue]);

  const generateInstallments = () => {
    const count = formData.installments;
    const total = parseFloat(formData.totalValue.toString()) || 0;
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
    const total = (formData.items || []).reduce((acc: number, item: any) => acc + (item.total || 0), 0);
    if (total > 0 && total !== formData.totalValue) {
      setFormData(prev => ({ ...prev, totalValue: total }));
    }
  }, [formData.items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, installmentsList });
      onClose();
    } catch (error) {
      console.error('Error submitting sales order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Pedido de Venda" : "Novo Pedido de Venda"}
      subtitle="Registre os detalhes da venda e logística de saída."
      icon={ShoppingCart}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Pedido"}
      size="xlarge"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação do Pedido</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Empresa / Unidade Vendedora</label>
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
            <label className="tauze-label"><User size={14} /> Parceiro / Comprador</label>
            <SearchableSelect 
              value={formData.clientId}
              onChange={(val: any) => setFormData({...formData, clientId: val})}
              options={[
                { value: '', label: 'Selecione o parceiro...' },
                ...(clients || []).map(c => ({ value: String(c.id), label: String(c.nome) })),
              ]}
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Número do Pedido (PV)</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: PV-001..." 
              value={formData.orderNumber}
              onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data do Pedido</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Status</label>
            <SearchableSelect 
              value={formData.status}
              onChange={(val: any) => setFormData({...formData, status: val})}
              options={[
                { value: 'pending', label: 'Pendente' },
                { value: 'shipped', label: 'Em Trânsito' },
                { value: 'completed', label: 'Concluído' },
                { value: 'cancelled', label: 'Cancelado' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Logística e Comissões</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><Truck size={14} /> Transportadora</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Nome da empresa..." 
              value={formData.transportadora}
              onChange={(e) => setFormData({...formData, transportadora: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Placa</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="ABC-1234" 
              value={formData.placa_veiculo}
              onChange={(e) => setFormData({...formData, placa_veiculo: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> GTA</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Número GTA" 
              value={formData.numero_gta}
              onChange={(e) => setFormData({...formData, numero_gta: e.target.value})}
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><TrendingUp size={14} /> Comissão (%)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.1"
              placeholder="0.0" 
              value={formData.comissao}
              onChange={(e) => setFormData({...formData, comissao: parseFloat(e.target.value) || 0})}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Itens do Pedido</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <InsumoEntryTable 
            items={formData.items}
            onChange={(items) => setFormData({ ...formData, items })}
          />
        </div>
        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group" style={{ gridColumn: '1 / span 2' }}></div>
          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Valor Total (R$)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.totalValue}
              onChange={(e) => setFormData({...formData, totalValue: parseFloat(e.target.value) || 0})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Condições de Recebimento e Financeiro</h4>
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
            <label className="tauze-label"><CreditCard size={14} /> Meio de Recebimento</label>
            <SearchableSelect 
              value={formData.payment_method}
              onChange={(val: any) => setFormData({...formData, payment_method: val})}
              options={[
                { value: 'Pix', label: 'Pix' },
                { value: 'Boleto', label: 'Boleto' },
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

          <div className="tauze-field-group" style={{ gridColumn: formData.payment_condition === 'prazo' ? 'span 1' : 'span 2' }}>
            <label className="tauze-label"><Wallet size={14} /> Conta de Destino</label>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'hsl(var(--brand)/0.05)', padding: '16px', borderRadius: '12px', border: '1px dashed hsl(var(--brand)/0.3)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.generate_financial}
                onChange={(e) => setFormData({...formData, generate_financial: e.target.checked})}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'hsl(var(--brand))' }}
              />
              <span style={{ fontWeight: '700', color: 'hsl(var(--brand))' }}>
                Gerar Financeiro Automático (Contas a Receber)
              </span>
            </label>
          </div>
        </div>

        {formData.payment_condition === 'prazo' && installmentsList.length > 0 && (
          <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
            <div className="tauze-field-group" style={{ background: 'hsl(var(--bg-main)/0.3)', borderRadius: '12px', border: '1px solid hsl(var(--border))', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--text-muted))', marginBottom: '12px', textTransform: 'uppercase' }}>
                Cronograma de Recebimento
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {installmentsList.map((inst, index) => (
                  <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
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
              <div style={{ marginTop: '16px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) === parseFloat(formData.totalValue.toString()).toFixed(2) ? 'green' : 'red' }}>
                Soma das Parcelas: {installmentsList.reduce((acc, i) => acc + i.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) !== parseFloat(formData.totalValue.toString()).toFixed(2) && (
                  <span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>(Divergente do total do pedido)</span>
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
            <label className="tauze-label"><FileText size={14} /> Observações do Pedido</label>
            <textarea 
              className="tauze-input"
              placeholder="Detalhes sobre a entrega, local de embarque ou condições especiais..." 
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
