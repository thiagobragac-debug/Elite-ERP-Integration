import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import toast from 'react-hot-toast';
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
  ClipboardList,
  AlertCircle,
  FileDigit,
  Settings
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
    modelo_fiscal: initialData?.modelo_fiscal || '55',
    nature_of_operation: initialData?.nature_of_operation || 'Compra para Industrialização',
    xml_key: initialData?.xml_key || '',
    description: initialData?.description || '',
    payment_condition: initialData?.payment_condition || 'vista',
    payment_method: initialData?.payment_method || 'Boleto',
    installments: initialData?.installments || 1,
    bank_account_id: initialData?.bank_account_id || '',
    generate_financial: initialData ? initialData.generate_financial : true
  });

  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [installmentsList, setInstallmentsList] = useState<any[]>([]);
  const [showFinancialConfirm, setShowFinancialConfirm] = useState(false);

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

  const isFinancialDisabledByOrder = useMemo(() => {
    if (!formData.purchase_order_id) return false;
    // Mock simples: OC-001 gerou financeiro, OC-002 NÃO gerou
    const mockOrdersDB: any = {
      'OC-001': { generate_financial: true },
      'OC-002': { generate_financial: false }
    };
    return mockOrdersDB[formData.purchase_order_id]?.generate_financial || false;
  }, [formData.purchase_order_id]);

  // Se um Pedido de Compra for vinculado, verifica a regra original dele
  useEffect(() => {
    if (formData.purchase_order_id) {
      if (isFinancialDisabledByOrder) {
        setFormData(prev => ({ ...prev, generate_financial: false }));
      } else {
        setFormData(prev => ({ ...prev, generate_financial: true }));
      }
    }
  }, [formData.purchase_order_id, isFinancialDisabledByOrder]);

  const handleXMLDoubleClick = () => {
    if (formData.is_xml_imported) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 1500)),
          {
            loading: 'Analisando e processando XML...',
            success: `XML importado com sucesso!`,
            error: 'Falha ao importar o XML'
          }
        ).then(() => {
          handleSimulateXMLImport();
        });
      }
    };
    input.click();
  };

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

  const handleGenerateFinancialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecking = e.target.checked;
    if (!isChecking) {
      setShowFinancialConfirm(true);
    } else {
      setFormData(prev => ({ ...prev, generate_financial: true }));
    }
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

  const financialConfirmOverlay = showFinancialConfirm ? ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 15, 0.75)', backdropFilter: 'blur(4px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'hsl(var(--bg-card))', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', border: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsl(var(--warning)/0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--warning))' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>Atenção</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Confirmação necessária</p>
          </div>
        </div>
        <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'hsl(var(--text-main))', lineHeight: 1.5 }}>
          Tem certeza que deseja registrar esta Entrada de Nota SEM gerar os títulos financeiros? As obrigações no Contas a Pagar não serão criadas automaticamente.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setShowFinancialConfirm(false)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-main))', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Cancelar</button>
          <button type="button" onClick={() => { setFormData(prev => ({ ...prev, generate_financial: false })); setShowFinancialConfirm(false); }} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: 'hsl(var(--warning))', color: 'hsl(var(--warning-foreground))', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Sim, desativar</button>
        </div>
      </div>
    </div>
  , document.body) : null;

  return (
    <>
    {financialConfirmOverlay}
    <SidePanel
      isOpen={isOpen}
      onClose={() => {
        if (showFinancialConfirm) {
          setShowFinancialConfirm(false);
        } else {
          onClose();
        }
      }}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Nota Fiscal" : "Entrada de Nota Fiscal"}
      subtitle="Registro blindado de documentos fiscais e atualização de estoque"
      icon={Barcode}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Processar Entrada"}
      size="xxlarge"
    >
      {/* IMPORTAÇÃO E METADADOS FUNDIDOS NO PASSO 01 */}
      <section className="tauze-form-section">
        <div className="tauze-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="tauze-section-badge">PASSO 01</div>
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
          
          {/* PRIMEIRA LINHA */}
          <div className="tauze-input-grid grid-col-4" style={{ marginBottom: '16px' }}>
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

            <div className="tauze-field-group">
              <label className="tauze-label"><Settings size={14} /> Natureza da Operação</label>
              <SearchableSelect 
                value={formData.nature_of_operation}
                onChange={(val: any) => setFormData({...formData, nature_of_operation: val})}
                options={[
                  { value: 'Compra para Industrialização', label: 'Compra para Industrialização' },
                  { value: 'Compra para Comercialização', label: 'Compra para Comercialização' },
                  { value: 'Compra para Ativo Imobilizado', label: 'Compra para Ativo Imobilizado' },
                  { value: 'Devolução de Venda', label: 'Devolução de Venda' },
                ]}
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

            {/* BOTÃO E CAMPO XML JUNTOS NO GRID */}
            <div className="tauze-field-group">
              <label className="tauze-label" style={{ color: 'hsl(var(--brand))' }} title="Dê um duplo clique no campo para importar o arquivo XML">
                <UploadCloud size={14} /> Importar XML
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder="Chave ou duplo clique p/ arquivo..." 
                  value={formData.xml_key}
                  onChange={(e) => setFormData({...formData, xml_key: e.target.value})}
                  onDoubleClick={handleXMLDoubleClick}
                  readOnly={formData.is_xml_imported}
                  style={{ flex: 1, cursor: formData.is_xml_imported ? 'default' : 'pointer' }}
                  title={formData.is_xml_imported ? '' : 'Dê um duplo clique para fazer upload do arquivo XML'}
                />
                {!formData.is_xml_imported && (
                  <button type="button" onClick={handleSimulateXMLImport} className="primary-btn" title="Buscar na SEFAZ" style={{ padding: '0 16px', height: '36px', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>
                    Sefaz
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="tauze-input-grid" style={{ gridTemplateColumns: '1fr 0.8fr 0.4fr 0.8fr 1fr', marginBottom: '16px' }}>
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
              <label className="tauze-label"><FileDigit size={14} /> Modelo Fiscal</label>
              <SearchableSelect 
                value={formData.modelo_fiscal}
                onChange={(val: any) => setFormData({...formData, modelo_fiscal: val})}
                options={[
                  { value: '55', label: '55 - NF-e (Normal)' },
                  { value: '65', label: '65 - NFC-e (Consumidor)' },
                  { value: '11', label: '11 - Produtor Rural' },
                ]}
              />
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label" style={{ color: 'hsl(var(--warning))' }}>
                <ClipboardList size={14} /> Vincular Ordem de Compra
              </label>
              <SearchableSelect 
                value={formData.purchase_order_id}
                onChange={(val: any) => setFormData({...formData, purchase_order_id: val})}
                options={[
                  { value: '', label: 'Sem vínculo' },
                  { value: 'OC-001', label: 'OC-001 - Adubos Safra (Bayer)' },
                  { value: 'OC-002', label: 'OC-002 - Peças Trator' },
                ]}
              />
            </div>
          </div>

          {/* TERCEIRA LINHA REMOVIDA (TOTAL MOVIDO) */}
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Conferência de Estoque (Itens)</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-1">
          <InsumoEntryTable 
            items={items}
            onChange={setItems}
            companyId={formData.company_id}
          />
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Contas a Pagar</h4>
        </div>
        <div className="tauze-input-grid" style={{ gridTemplateColumns: formData.payment_condition === 'prazo' ? '1.5fr 1.5fr 1.5fr 1fr 2fr 1.2fr' : '1.5fr 1fr 1fr 1.5fr 1.2fr' }}>
          
          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Total da Nota</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: 'hsl(var(--success))', fontSize: '18px', letterSpacing: '-0.5px' }}>R$</span>
              <input 
                className="tauze-input"
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={formData.total_value}
                onChange={(e) => setFormData({...formData, total_value: e.target.value})}
                readOnly={formData.is_xml_imported}
                required
                style={{ fontWeight: '900', color: 'hsl(var(--success))', fontSize: '18px', height: '42px', paddingLeft: '44px', letterSpacing: '-0.5px', background: formData.is_xml_imported ? 'hsl(var(--bg-main))' : 'transparent' }}
              />
            </div>
          </div>

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

          <div className="tauze-field-group">
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

          <div className="tauze-field-group" style={{ justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isFinancialDisabledByOrder ? 'hsl(var(--bg-main))' : 'hsl(var(--brand)/0.05)', padding: '0 16px', height: '48px', borderRadius: '14px', border: isFinancialDisabledByOrder ? '1px dashed hsl(var(--border))' : '1px dashed hsl(var(--brand)/0.3)', cursor: isFinancialDisabledByOrder ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isFinancialDisabledByOrder ? 0.6 : 1 }}>
              <input 
                type="checkbox" 
                checked={formData.generate_financial}
                onChange={handleGenerateFinancialChange}
                style={{ width: '18px', height: '18px', cursor: isFinancialDisabledByOrder ? 'not-allowed' : 'pointer', accentColor: 'hsl(var(--brand))', flexShrink: 0 }}
                disabled={isFinancialDisabledByOrder}
              />
              <span style={{ fontWeight: '700', color: isFinancialDisabledByOrder ? 'hsl(var(--text-muted))' : 'hsl(var(--brand))', fontSize: '11px', lineHeight: 1.2 }}>
                Gerar Financeiro {isFinancialDisabledByOrder && '(Gerado no Pedido)'}
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
            <textarea className="tauze-input tauze-textarea"
              placeholder="Notas adicionais sobre a conferência..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ minHeight: '60px' }}
            />
          </div>
        </div>
      </section>
    </SidePanel>
    </>
  );
};
