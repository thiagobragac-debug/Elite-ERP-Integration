import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import ReactDOM from 'react-dom';
import toast from 'react-hot-toast';
import { 
  FileText, 
  User,
  Users,
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
  Scale,
  AlertCircle,
  UploadCloud,
  FileSearch,
  X
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { InsumoEntryTable, type InsumoItem } from './InsumoEntryTable';
import { SearchableSelect } from './SearchableSelect';

interface OutputInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const OutputInvoiceForm: React.FC<OutputInvoiceFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const { activeFarm, companies, activeCompany } = useTenant();
  const [formData, setFormData] = usePersistentState('OutputInvoiceForm_formData', {
    company_id: initialData?.company_id || activeCompany?.id || '',
    seller_id: initialData?.seller_id || '',
    sales_order_id: initialData?.sales_order_id || '',
    invoice_number: initialData?.numero_nota || 'Gerado pela SEFAZ',
    series: initialData?.serie || '1',
    modelo_fiscal: initialData?.modelo_fiscal || '55',
    client_id: initialData?.cliente_id || '',
    date: initialData?.data_emissao || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
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
    generate_financial: initialData ? initialData.generate_financial : true,
    
    description: initialData?.observacoes || '',
    is_xml_imported: false,
    xml_key: ''
  });
  const [items, setItems] = useState<InsumoItem[]>(initialData?.itens || []);

  const [clients, setClients] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [installmentsList, setInstallmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFinancialConfirm, setShowFinancialConfirm] = useState(false);
  const [showXMLField, setShowXMLField] = useState(false);
  const [pendingMatches, setPendingMatches] = useState(0);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchClients();
      fetchBankAccounts();
    }
  }, [isOpen, activeFarm]);

  // Reseta todo o estado ao fechar o painel (evita dados do último lançamento persistirem)
  useEffect(() => {
    if (!isOpen && !initialData) {
      setItems([]);
      setInstallmentsList([]);
      setShowFinancialConfirm(false);
      setShowXMLField(false);
      setPendingMatches(0);
      setFormData({
        company_id: activeCompany?.id || '',
        seller_id: '',
        sales_order_id: '',
        invoice_number: 'Gerado pela SEFAZ',
        series: '1',
        modelo_fiscal: '55',
        client_id: '',
        date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        total_value: '0',
        nature_of_operation: 'Venda de Produção Própria',
        transport_company: '',
        freight_type: 'CIF',
        vehicle_plate: '',
        gross_weight: '',
        payment_condition: 'vista',
        payment_method: 'Boleto',
        installments: 1,
        bank_account_id: '',
        generate_financial: true,
        description: '',
        is_xml_imported: false,
        xml_key: '',
      });
    }
  }, [isOpen]);


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

  const isFinancialDisabledByOrder = useMemo(() => {
    if (!formData.sales_order_id) return false;
    // Mock simples: PV-001 gerou financeiro, PV-002 NÃƒO gerou
    const mockOrdersDB: any = {
      'PV-001': { generate_financial: true },
      'PV-002': { generate_financial: false }
    };
    return mockOrdersDB[formData.sales_order_id]?.generate_financial || false;
  }, [formData.sales_order_id]);

  // Se um Pedido for vinculado, verifica a regra original dele
  useEffect(() => {
    if (formData.sales_order_id) {
      if (isFinancialDisabledByOrder) {
        setFormData(prev => ({ ...prev, generate_financial: false }));
      } else {
        setFormData(prev => ({ ...prev, generate_financial: true }));
      }
    }
  }, [formData.sales_order_id, isFinancialDisabledByOrder]);

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

  const handleGenerateFinancialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecking = e.target.checked;
    if (!isChecking) {
      setShowFinancialConfirm(true);
    } else {
      setFormData(prev => ({ ...prev, generate_financial: true }));
    }
  };

  const handleXMLDoubleClick = () => {
    if (formData.is_xml_imported) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 1500)),
          {
            loading: 'Analisando XML externo...',
            success: `XML importado com sucesso!`,
            error: 'Falha ao importar o XML'
          }
        ).then(() => {
          setFormData(prev => ({
            ...prev,
            is_xml_imported: true,
            nature_of_operation: 'Venda de Produção Própria',
            company_id: companies.length > 0 ? String(companies[0].id) : '',
            customer_id: clients.length > 0 ? String(clients[0].id) : '',
          }));
          
          const xmlItems: InsumoItem[] = [{
            id: 'xml-out-1',
            produto_id: '',
            nome: 'PRODUTO IMPORTADO DO XML',
            quantidade: 10,
            unidade: 'UN',
            preco_unitario: 100.00,
            despesa_adicional: 0,
            desconto: 0,
            deposito_id: '',
            total: 1000.00,
            xml_product_code: 'XML-OUT-001',
            xml_product_name: 'PRODUTO IMPORTADO XML DESCRIÃ‡ÃƒO ORIGINAL',
            match_status: 'unmatched',
          }];
          setItems(xmlItems);
        });
      }
      document.body.removeChild(input);
    };
    input.click();
  };

  const handleSefazMock = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Buscando dados na SEFAZ...',
        success: `Nota importada da SEFAZ com sucesso!`,
        error: 'Chave não encontrada'
      }
    ).then(() => {
      setFormData(prev => ({
        ...prev,
        is_xml_imported: true,
        nature_of_operation: 'Venda de Produção Própria',
        company_id: companies.length > 0 ? String(companies[0].id) : '',
        customer_id: clients.length > 0 ? String(clients[0].id) : '',
      }));

      const xmlItems: InsumoItem[] = [{
        id: 'xml-out-2',
        produto_id: '',
        nome: 'PRODUTO BUSCADO NA SEFAZ',
        quantidade: 15,
        unidade: 'UN',
        preco_unitario: 100.00,
        despesa_adicional: 0,
        desconto: 0,
        deposito_id: '',
        total: 1500.00,
        xml_product_code: 'SEFAZ-OUT-002',
        xml_product_name: 'PRODUTO BUSCADO SEFAZ DESCRIÃ‡ÃƒO ORIGINAL',
        match_status: 'unmatched',
      }];
      setItems(xmlItems);
      setShowXMLField(false);
    });
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
          Tem certeza que deseja registrar esta Nota SEM gerar os títulos financeiros? As obrigações no Contas a Receber não serão criadas automaticamente.
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
      title={initialData ? "Editar Nota Fiscal" : "Emitir Nota Fiscal de Saída"}
      subtitle="Faturamento de vendas, integrações financeiras e baixas de estoque."
      icon={ArrowUpRight}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Transmitir NF-e"}
      submitDisabled={pendingMatches > 0}
      size="xxlarge"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="tauze-section-badge">PASSO 01</div>
            <h4 className="tauze-section-title">Identificação da Nota</h4>
          </div>
          {!showXMLField ? (
            <button 
              type="button" 
              onClick={() => setShowXMLField(true)} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'hsl(var(--text-muted))', 
                fontSize: '11px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
              }} 
              title="Importar XML ou buscar Chave"
              onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--brand))'; e.currentTarget.style.background = 'hsl(var(--brand)/0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(var(--text-muted))'; e.currentTarget.style.background = 'transparent'; }}
            >
              <UploadCloud size={12} /> Importar NF-e
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
               <div style={{ position: 'relative' }}>
                 <input 
                   type="text" 
                   value={formData.xml_key}
                   onChange={(e) => setFormData({...formData, xml_key: e.target.value.replace(/\D/g, '')})}
                   onDoubleClick={handleXMLDoubleClick}
                   placeholder="Chave de acesso (ou duplo clique)..." 
                   style={{ width: '250px', height: '26px', fontSize: '11px', borderRadius: '6px', border: '1px solid hsl(var(--border))', padding: '0 40px 0 8px', background: 'transparent', color: 'hsl(var(--text-main))', outline: 'none' }}
                   title="Cole a chave de acesso ou dê dois cliques para upload de arquivo"
                 />
                 {formData.xml_key?.length === 44 && <span style={{ position: 'absolute', right: '4px', top: '4px', fontSize: '9px', background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))', padding: '2px 4px', borderRadius: '4px', fontWeight: 800 }}>NF-e</span>}
                 {formData.xml_key?.length === 50 && <span style={{ position: 'absolute', right: '4px', top: '4px', fontSize: '9px', background: 'hsl(var(--warning)/0.1)', color: 'hsl(var(--warning))', padding: '2px 4px', borderRadius: '4px', fontWeight: 800 }}>NFS-e</span>}
               </div>
               <button type="button" onClick={handleSefazMock} style={{ height: '26px', padding: '0 8px', borderRadius: '6px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--text-main))', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                 <FileSearch size={12} /> Sefaz
               </button>
               <button type="button" onClick={handleXMLDoubleClick} style={{ height: '26px', padding: '0 8px', borderRadius: '6px', background: 'hsl(var(--brand))', border: 'none', color: '#fff', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                 <UploadCloud size={12} /> XML
               </button>
               <button type="button" onClick={() => setShowXMLField(false)} style={{ height: '26px', width: '26px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Cancelar">
                 <X size={14} />
               </button>
            </div>
          )}
        </div>
        
        <div className="tauze-input-grid grid-col-4" style={{ marginBottom: '16px' }}>
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
            <label className="tauze-label"><Users size={14} /> Vendedor</label>
            <SearchableSelect 
              value={formData.seller_id}
              onChange={(val: any) => setFormData({...formData, seller_id: val})}
              options={[
                { value: '', label: 'Selecione o vendedor...' },
                { value: 'vend-1', label: 'João Silva' },
                { value: 'vend-2', label: 'Maria Souza' },
              ]}
            />
          </div>
        </div>

        <div className="tauze-input-grid" style={{ gridTemplateColumns: '1fr 0.8fr 0.4fr 0.8fr 1fr', marginBottom: '16px' }}>
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
            <label className="tauze-label"><Hash size={14} /> Número da Nota</label>
            <input 
              className="tauze-input"
              type="text" 
              value={formData.invoice_number}
              readOnly
              style={{ background: 'hsl(var(--bg-main))', opacity: 0.8 }}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Layers size={14} /> Série</label>
            <input 
              className="tauze-input"
              type="text" 
              value={formData.series}
              readOnly
              style={{ background: 'hsl(var(--bg-main))', opacity: 0.8 }}
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
        </div>

          {/* CONTROLE DO SISTEMA (VALOR TOTAL) MOVIDO PARA O PASSO 04 */}
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Logística de Expedição</h4>
        </div>
        <div className="tauze-input-grid grid-col-4">
          <div className="tauze-field-group">
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
            key={`output-table-${formData.is_xml_imported ? 'xml' : 'manual'}-${items.length}`}
            items={items}
            onChange={(items) => setItems(items)}
            companyId={formData.company_id}
            onPendingMatchesChange={setPendingMatches}
          />
          {pendingMatches > 0 && (
            <div style={{ margin: '12px 0 0', padding: '10px 16px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                {pendingMatches} {pendingMatches === 1 ? 'item sem vínculo' : 'itens sem vínculo'} com o catálogo â€” resolva antes de transmitir a NF-e.
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Contas a Receber (Faturamento)</h4>
        </div>
        <div className="tauze-input-grid" style={{ gridTemplateColumns: formData.payment_condition === 'prazo' ? '1.5fr 1.5fr 1.5fr 1fr 2fr 1.2fr' : '1.5fr 1fr 1fr 1.5fr 1.2fr' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Total da Nota</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: 'hsl(var(--success))', fontSize: '18px', letterSpacing: '-0.5px' }}>R$</span>
              <input 
                className="tauze-input"
                type="text" 
                value={parseFloat(formData.total_value || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                readOnly
                style={{ fontWeight: '900', color: 'hsl(var(--success))', fontSize: '18px', height: '42px', paddingLeft: '44px', letterSpacing: '-0.5px', background: 'hsl(var(--bg-main))' }}
              />
            </div>
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Banknote size={14} /> Condição</label>
            <SearchableSelect 
              value={formData.payment_condition}
              onChange={(val: any) => setFormData({...formData, payment_condition: val})}
              options={[
                { value: 'vista', label: 'Ã€ Vista' },
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

          <div className="tauze-field-group">
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

          <div className="tauze-field-group" style={{ justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isFinancialDisabledByOrder ? 'hsl(var(--bg-main))' : 'hsl(var(--success)/0.05)', padding: '0 16px', height: '48px', borderRadius: '14px', border: isFinancialDisabledByOrder ? '1px dashed hsl(var(--border))' : '1px dashed hsl(var(--success)/0.3)', cursor: isFinancialDisabledByOrder ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isFinancialDisabledByOrder ? 0.6 : 1 }}>
              <input 
                type="checkbox" 
                checked={formData.generate_financial}
                onChange={handleGenerateFinancialChange}
                style={{ width: '18px', height: '18px', cursor: isFinancialDisabledByOrder ? 'not-allowed' : 'pointer', accentColor: 'hsl(var(--success))', flexShrink: 0 }}
                disabled={isFinancialDisabledByOrder}
              />
              <span style={{ fontWeight: '700', color: isFinancialDisabledByOrder ? 'hsl(var(--text-muted))' : 'hsl(var(--success))', fontSize: '11px', lineHeight: 1.2 }}>
                Gerar Financeiro {isFinancialDisabledByOrder && '(Gerado no Pedido)'}
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
    </>
  );
};
