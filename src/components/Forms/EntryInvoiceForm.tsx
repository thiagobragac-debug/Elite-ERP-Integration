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
  Wallet,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Lock,
  UploadCloud,
  ClipboardList
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { InsumoEntryTable } from './InsumoEntryTable';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

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
    purchase_order_id: initialData?.purchase_order_id || '',
    storage_location_id: initialData?.storage_location_id || '',
    is_xml_imported: initialData?.is_xml_imported || false,
    
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

  useEffect(() => {
    if (items.length > 0 && !formData.is_xml_imported) {
      const total = items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
      setFormData(prev => ({ ...prev, total_value: total.toString() }));
    }
  }, [items, formData.is_xml_imported]);

  const handleSimulateXMLImport = () => {
    // Simulando a leitura de um XML para mostrar o poder da UI Read-Only
    setFormData(prev => ({
      ...prev,
      is_xml_imported: true,
      xml_key: '35240112345678000199550010001234561001234567',
      invoice_number: '123456',
      series: '1',
      total_value: '15500.00',
      issue_date: new Date().toISOString().split('T')[0],
      supplier_id: suppliers.length > 0 ? String(suppliers[0].id) : ''
    }));
    
    // Simula a injeção de itens
    setItems([
      {
        id: 'xml-1',
        nome: 'Adubo NPK 10-10-10 (XML)',
        quantidade: 50,
        unidade: 'SC',
        preco_unitario: 150.00,
        despesa_adicional: 0,
        desconto: 0,
        deposito_id: '',
        total: 7500.00
      },
      {
        id: 'xml-2',
        nome: 'Semente de Soja Brasmax (XML)',
        quantidade: 20,
        unidade: 'SC',
        preco_unitario: 300.00,
        despesa_adicional: 0,
        desconto: 0,
        deposito_id: '',
        total: 6000.00
      },
      {
        id: 'xml-3',
        nome: 'Glifosato 480 (XML)',
        quantidade: 10,
        unidade: 'GL',
        preco_unitario: 200.00,
        despesa_adicional: 0,
        desconto: 0,
        deposito_id: '',
        total: 2000.00
      }
    ]);
  };

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
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Nota Fiscal" : "Entrada de Nota Fiscal"}
      subtitle="Registro blindado de documentos fiscais e atualização de estoque"
      icon={Barcode}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Processar Entrada"}
      size="xxlarge"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Importação e Vínculos</h4>
        </div>
        
        {/* BIG BANNER IMPORT */}
        <div style={{ background: formData.is_xml_imported ? 'hsl(var(--success)/0.1)' : 'hsl(var(--brand)/0.05)', border: formData.is_xml_imported ? '2px solid hsl(var(--success))' : '2px dashed hsl(var(--brand)/0.3)', borderRadius: '16px', padding: '24px', marginBottom: '24px', transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: formData.is_xml_imported ? 'hsl(var(--success))' : 'hsl(var(--brand))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {formData.is_xml_imported ? <CheckCircle2 size={24} /> : <UploadCloud size={24} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: formData.is_xml_imported ? 'hsl(var(--success))' : 'hsl(var(--text-main))', margin: 0 }}>
                    {formData.is_xml_imported ? 'NFe Importada com Sucesso!' : 'Importação Mágica (Recomendado)'}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: '4px 0 0 0' }}>
                    {formData.is_xml_imported ? 'Os metadados fiscais foram travados para garantir auditoria.' : 'Importe o XML ou busque pela chave para autopreencher a nota.'}
                  </p>
                </div>
              </div>
              
              {!formData.is_xml_imported && (
                <button type="button" onClick={handleSimulateXMLImport} className="primary-btn" style={{ padding: '0 24px', height: '40px', fontWeight: '800' }}>
                  Simular Importação XML
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder="Ou cole a Chave de 44 dígitos..." 
                  style={{ fontSize: '14px', height: '44px' }}
                  value={formData.xml_key}
                  onChange={(e) => setFormData({...formData, xml_key: e.target.value})}
                  readOnly={formData.is_xml_imported}
                />
              </div>
              {!formData.is_xml_imported && (
                <button type="button" onClick={handleSimulateXMLImport} className="secondary-btn" style={{ padding: '0 24px', height: '44px' }}>
                  <FileSearch size={18} style={{ marginRight: '8px' }}/> Buscar Sefaz
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ color: 'hsl(var(--warning))' }}>
              <ClipboardList size={14} /> Vincular Ordem de Compra (3-Way Matching)
            </label>
            <SearchableSelect 
              value={formData.purchase_order_id}
              onChange={(val: any) => setFormData({...formData, purchase_order_id: val})}
              options={[
                { value: '', label: 'Sem vínculo (Entrada Avulsa)' },
                { value: 'OC-001', label: 'OC-001 - Adubos Safra (Bayer)' },
                { value: 'OC-002', label: 'OC-002 - Peças Trator' },
              ]}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Empresa Destino</label>
            <SearchableSelect 
              value={formData.company_id}
              onChange={(val: any) => setFormData({...formData, company_id: val})}
              options={[
                { value: '', label: 'Selecione...' },
                ...(companies || []).map(c => ({ value: String(c.id), label: String(c.name) })),
              ]}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Metadados Fiscais</h4>
          </div>
          {formData.is_xml_imported ? (
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--success)/0.1)', padding: '4px 8px', borderRadius: '4px' }}>
              <Lock size={12}/> DADOS BLINDADOS
            </div>
          ) : (
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--warning))', display: 'flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--warning)/0.1)', padding: '4px 8px', borderRadius: '4px' }}>
              <AlertTriangle size={12}/> DIGITAÇÃO MANUAL
            </div>
          )}
        </div>
        
        {/* CARD BLINDADO OU ABERTO */}
        <div style={{ background: formData.is_xml_imported ? 'hsl(var(--bg-card))' : 'transparent', border: formData.is_xml_imported ? '1px solid hsl(var(--border))' : 'none', borderRadius: '12px', padding: formData.is_xml_imported ? '20px' : '0', opacity: formData.is_xml_imported ? 0.8 : 1 }}>
          <div className="tauze-input-grid grid-col-3" style={{ marginBottom: '16px' }}>
            <div className="tauze-field-group">
              <label className="tauze-label"><Hash size={14} /> Número da Nota</label>
              <input 
                className="tauze-input"
                type="text" 
                placeholder="Ex: 000.123..." 
                value={formData.invoice_number}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                readOnly={formData.is_xml_imported}
                required 
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label"><Layers size={14} /> Série</label>
              <input 
                className="tauze-input"
                type="text" 
                placeholder="1" 
                value={formData.series}
                onChange={(e) => setFormData({...formData, series: e.target.value})}
                readOnly={formData.is_xml_imported}
                required 
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label"><Calendar size={14} /> Emissão</label>
              <input 
                className="tauze-input"
                type="date" 
                value={formData.issue_date}
                onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                readOnly={formData.is_xml_imported}
                required
              />
            </div>
          </div>

          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group">
              <label className="tauze-label"><Building2 size={14} /> Fornecedor Emissor</label>
              {formData.is_xml_imported ? (
                <div className="tauze-input" style={{ display: 'flex', alignItems: 'center', background: 'hsl(var(--bg-main))' }}>
                  {suppliers.find(s => String(s.id) === String(formData.supplier_id))?.nome || 'Fornecedor XML...'}
                </div>
              ) : (
                <SearchableSelect 
                  value={formData.supplier_id}
                  onChange={(val: any) => setFormData({...formData, supplier_id: val})}
                  options={[
                    { value: '', label: 'Selecione o parceiro...' },
                    ...(suppliers || []).map(s => ({ value: String(s.id), label: String(s.nome) })),
                  ]}
                />
              )}
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label"><DollarSign size={14} /> Total da Nota Fiscal (R$)</label>
              <input 
                className="tauze-input"
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={formData.total_value}
                onChange={(e) => setFormData({...formData, total_value: e.target.value})}
                readOnly={formData.is_xml_imported}
                required
                style={formData.is_xml_imported ? { fontWeight: '800', color: 'hsl(var(--success))' } : {}}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Conferência de Estoque (Itens)</h4>
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
          <h4 className="tauze-section-title">Contas a Pagar</h4>
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
            <label className="tauze-label"><CreditCard size={14} /> Meio de Pagamento</label>
            <SearchableSelect 
              value={formData.payment_method}
              onChange={(val: any) => setFormData({...formData, payment_method: val})}
              options={[
                { value: 'Boleto', label: 'Boleto' },
                { value: 'Pix', label: 'Pix' },
                { value: 'Transferência', label: 'Transferência' },
                { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
                { value: 'Dinheiro', label: 'Dinheiro' },
              ]}
            />
          </div>

          {formData.payment_condition === 'prazo' && (
            <div className="tauze-field-group">
              <label className="tauze-label"><Hash size={14} /> Parcelas</label>
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
            <label className="tauze-label"><Wallet size={14} /> Conta / Caixa de Origem</label>
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
                Gerar Títulos no Contas a Pagar
              </span>
            </label>
          </div>
        </div>

        {formData.payment_condition === 'prazo' && installmentsList.length > 0 && (
          <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
            <div className="tauze-field-group" style={{ background: 'hsl(var(--bg-main)/0.3)', borderRadius: '12px', border: '1px solid hsl(var(--border))', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--text-muted))', marginBottom: '12px', textTransform: 'uppercase' }}>
                Faturas (Espelho do XML)
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
          <h4 className="tauze-section-title" style={{ fontSize: '13px' }}>Observações do Recebimento</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <textarea 
              className="tauze-input"
              placeholder="Notas adicionais sobre a conferência..." 
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
