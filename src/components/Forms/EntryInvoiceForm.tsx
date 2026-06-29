import { showValidationAlert } from '../../utils/validationAlert';
import React, { useState, useEffect, useMemo } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';
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
  Settings,
  Beef,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { InsumoEntryTable, type InsumoItem } from './InsumoEntryTable';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';
import { LoteRecebimentoModal } from '../Modals/LoteRecebimentoModal';
import { readNFeFile, nfeDateToInputDate, parseNFeXML } from '../../utils/parseNFeXML';
import { fetchCNPJData } from '../../utils/cnpj';
import { DateInput } from '../../components/Form/DateInput';

interface EntryInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const EntryInvoiceForm: React.FC<EntryInvoiceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  actionId,
}) => {
  const { activeTenantId, activeCompany, activeFarm, companies } = useTenant();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<InsumoItem[]>(initialData?.itens || []);

  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `entry_invoice_form_${activeTenantId}`,
    initialState: {
      purchase_order_id: initialData?.purchase_order_id || '',
      storage_location_id: initialData?.storage_location_id || '',
      is_xml_imported: initialData?.is_xml_imported || false,
      company_id: initialData?.company_id || activeCompany?.id || '',
      invoice_number: initialData?.invoice_number || '',
      series: initialData?.series || '1',
      supplier_id: initialData?.supplier_id || '',
      issue_date:
        initialData?.issue_date ||
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      entry_date:
        initialData?.entry_date ||
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      total_value: initialData?.total_value || '',
      modelo_fiscal: initialData?.modelo_fiscal || '55',
      nature_of_operation: initialData?.nature_of_operation || 'Compra para Industrialização',
      xml_key: initialData?.xml_key || '',
      description: initialData?.description || '',
      payment_condition: initialData?.payment_condition || 'vista',
      payment_method: initialData?.payment_method || 'Boleto',
      installments: initialData?.installments || 1,
      bank_account_id: initialData?.bank_account_id || '',
      generate_financial: initialData ? initialData.generate_financial : true,
      iss_retido: initialData?.iss_retido?.toString() || '0',
      irrf_retido: initialData?.irrf_retido?.toString() || '0',
      csll_retido: initialData?.csll_retido?.toString() || '0',
      pis_retido: initialData?.pis_retido?.toString() || '0',
      cofins_retido: initialData?.cofins_retido?.toString() || '0',
      inss_retido: initialData?.inss_retido?.toString() || '0',
    },
    isOpen,
    isEditMode: !!initialData,
  });

  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [installmentsList, setInstallmentsList] = useState<any[]>([]);
  const [showFinancialConfirm, setShowFinancialConfirm] = useState(false);
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [loteModalDismissed, setLoteModalDismissed] = useState(false);
  const [pendingMatches, setPendingMatches] = useState(0);
  const [supplierConfirmData, setSupplierConfirmData] = useState<{
    nfeEmit: any;
    formattedCnpj: string;
    fetchedData?: any;
  } | null>(null);

  // Detecta se a nota contém animais/gado (usa NCM fiscal como fonte da verdade, e regex como fallback)
  const animalRegex =
    /\b(bovino|gado|nelore|angus|brahman|bezerro|novilho|boi|vaca|animal|rebanho|cabeça|cabeca)s?\b/i;
  const hasLivestockItems = items.some((item: any) => {
    // 1. Validação fiscal direta (NCM Capítulo 01 - Animais Vivos, ou 0102 - Bovinos)
    const ncmStr = String(item.xml_ncm || '').replace(/\D/g, '');
    if (ncmStr && (ncmStr.startsWith('0102') || ncmStr.startsWith('01'))) {
      return true;
    }
    // 2. Fallback de texto se a unidade de medida remeter a animal
    const unitStr = String(item.unidade || '').toUpperCase();
    if (
      (unitStr === 'CB' || unitStr === 'CABEÇA' || unitStr === 'KG') &&
      animalRegex.test(item.nome || '')
    ) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (activeTenantId) {
      fetchSuppliers();
      fetchBankAccounts();
    }
  }, [activeTenantId]);

  // Reseta estados secundários ao fechar o painel.
  // O reset do formData é gerenciado pelo useFormDraft (draft restaurado na próxima abertura).
  useEffect(() => {
    if (!isOpen && !initialData) {
      setItems([]);
      setInstallmentsList([]);
      setShowFinancialConfirm(false);
      setShowLoteModal(false);
      setLoteModalDismissed(false);
      setPendingMatches(0);
      setSupplierConfirmData(null);
    }
  }, [isOpen]);

  const isServiceInvoice =
    formData.modelo_fiscal === '00' || items.some((item) => item.tipo === 'servico');

  const totalWithholdings =
    (parseFloat(formData.iss_retido) || 0) +
    (parseFloat(formData.irrf_retido) || 0) +
    (parseFloat(formData.csll_retido) || 0) +
    (parseFloat(formData.pis_retido) || 0) +
    (parseFloat(formData.cofins_retido) || 0) +
    (parseFloat(formData.inss_retido) || 0);

  const valorLiquido = Math.max(0, (parseFloat(formData.total_value) || 0) - totalWithholdings);

  // Handle installment generation
  useEffect(() => {
    if (formData.payment_condition === 'prazo' && formData.total_value) {
      generateInstallments();
    } else {
      setInstallmentsList([]);
    }
  }, [
    formData.payment_condition,
    formData.installments,
    formData.total_value,
    formData.iss_retido,
    formData.irrf_retido,
    formData.csll_retido,
    formData.pis_retido,
    formData.cofins_retido,
    formData.inss_retido,
    isServiceInvoice,
    valorLiquido,
  ]);

  const generateInstallments = () => {
    const count = formData.installments;
    const baseValue = isServiceInvoice ? valorLiquido : parseFloat(formData.total_value) || 0;
    const valuePerInstallment = parseFloat((baseValue / count).toFixed(2));
    const newList = [];

    for (let i = 1; i <= count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + 30 * i);
      newList.push({
        id: i,
        dueDate: date.toISOString().split('T')[0],
        value:
          i === count
            ? parseFloat((baseValue - valuePerInstallment * (count - 1)).toFixed(2))
            : valuePerInstallment,
      });
    }
    setInstallmentsList(newList);
  };

  const updateInstallment = (id: number, field: string, value: any) => {
    setInstallmentsList((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, [field]: value } : inst))
    );
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('parceiros')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .eq('is_supplier', true)
      .order('nome');
    if (data) {
      setSuppliers(data);
    }
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase
      .from('contas_bancarias')
      .select('id, banco, descricao')
      .eq('tenant_id', activeTenantId)
      .order('banco');
    if (data) {
      setBankAccounts(data);
    }
  };

  const checkOrCreateSupplier = async (nfeEmit: any) => {
    if (!nfeEmit) {
      return;
    }
    try {
      const cleanCnpj = (nfeEmit.CNPJ || nfeEmit.CPF || '').replace(/\D/g, '');
      if (!cleanCnpj) {
        return;
      }

      const formatCNPJ = (cnpj: string): string => {
        const clean = cnpj.replace(/\D/g, '');
        if (clean.length === 11) {
          return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
        }
        if (clean.length !== 14) {
          return clean;
        }
        return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      };

      const formattedCnpj = formatCNPJ(cleanCnpj);

      // Search database for any partner with this CNPJ/CPF (either clean or formatted)
      const { data: matchedSupplier } = await supabase
        .from('parceiros')
        .select('id, nome, is_supplier')
        .eq('tenant_id', activeTenantId)
        .or(`cnpj_cpf.eq.${cleanCnpj},cnpj_cpf.eq.${formattedCnpj}`)
        .maybeSingle();

      if (matchedSupplier) {
        if (matchedSupplier.is_supplier) {
          setFormData((prev) => ({ ...prev, supplier_id: matchedSupplier.id }));
          toast.success(`Fornecedor vinculado: ${matchedSupplier.nome}`);
        } else {
          // Já existe cadastrado mas não é fornecedor (ex: cliente/parceiro comum). Marcamos como fornecedor para unificar.
          const { error: updateError } = await supabase
            .from('parceiros')
            .update({ is_supplier: true })
            .eq('id', matchedSupplier.id).eq('tenant_id', activeTenantId);

          if (updateError) {
            console.error('Error updating partner to supplier:', updateError);
            toast.error('Erro ao unificar parceiro como fornecedor.');
          } else {
            toast.success(`Parceiro existente unificado como fornecedor: ${matchedSupplier.nome}`);
            await fetchSuppliers();
            setFormData((prev) => ({ ...prev, supplier_id: matchedSupplier.id }));
          }
        }
      } else {
        let fetchedData: any = null;
        if (cleanCnpj.length === 14) {
          try {
            fetchedData = await fetchCNPJData(cleanCnpj);
          } catch (e) {
            console.warn('Erro ao buscar dados do CNPJ na API externa:', e);
          }
        }

        const finalName = fetchedData?.razao_social || nfeEmit.xNome || 'PRESTADOR DE SERVIÇO';
        const finalFantasia = fetchedData?.nome_fantasia || nfeEmit.xFant || finalName;

        setSupplierConfirmData({
          nfeEmit: {
            ...nfeEmit,
            xNome: finalName,
            xFant: finalFantasia,
          },
          formattedCnpj,
          fetchedData,
        });
      }
    } catch (err) {
      console.error('Error checking or creating supplier:', err);
    }
  };

  const handleConfirmRegisterSupplier = async () => {
    if (!supplierConfirmData) {
      return;
    }
    const { nfeEmit, formattedCnpj, fetchedData } = supplierConfirmData;
    setSupplierConfirmData(null);

    try {
      const insertPayload = {
        tenant_id: activeTenantId,
        nome: nfeEmit.xNome,
        fantasia: nfeEmit.xFant || nfeEmit.xNome,
        cnpj_cpf: formattedCnpj,
        inscricao_estadual: nfeEmit.IE || '',
        is_supplier: true,
        status: 'ATIVO',
        cep: fetchedData?.cep || '',
        tipo_logradouro: fetchedData?.tipo_logradouro || '',
        logradouro: fetchedData?.logradouro || '',
        numero: fetchedData?.numero || '',
        complemento: fetchedData?.complemento || '',
        bairro: fetchedData?.bairro || '',
        cidade: fetchedData?.municipio || '',
        estado: fetchedData?.uf || '',
        email: fetchedData?.email || '',
        telefone: fetchedData?.telefone || '',
      };

      const { data: newSupplier, error: insertError } = await supabase
        .from('parceiros')
        .insert([insertPayload])
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting supplier:', insertError);
        toast.error('Erro ao cadastrar fornecedor automaticamente.');
      } else if (newSupplier) {
        toast.success(`Fornecedor ${newSupplier.nome} cadastrado com sucesso!`);
        await fetchSuppliers();
        setFormData((prev) => ({ ...prev, supplier_id: newSupplier.id }));
      }
    } catch (err) {
      console.error('Error registering supplier:', err);
    }
  };

  const handleCancelRegisterSupplier = () => {
    setSupplierConfirmData(null);
    setFormData((prev) => ({ ...prev, supplier_id: '' }));
    toast.error('Associe o XML a um fornecedor manualmente ou efetue o cadastro.');
  };

  useEffect(() => {
    if (items.length > 0 && !formData.is_xml_imported) {
      const total = items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
      setFormData((prev) => ({ ...prev, total_value: total.toString() }));
    }
  }, [items, formData.is_xml_imported]);

  const isFinancialDisabledByOrder = useMemo(() => {
    if (!formData.purchase_order_id) {
      return false;
    }
    // Mock simples: OC-001 gerou financeiro, OC-002 NÃO gerou
    const mockOrdersDB: any = {
      'OC-001': { generate_financial: true },
      'OC-002': { generate_financial: false },
    };
    return mockOrdersDB[formData.purchase_order_id]?.generate_financial || false;
  }, [formData.purchase_order_id]);

  // Se um Pedido de Compra for vinculado, verifica a regra original dele
  useEffect(() => {
    if (formData.purchase_order_id) {
      if (isFinancialDisabledByOrder) {
        setFormData((prev) => ({ ...prev, generate_financial: false }));
      } else {
        setFormData((prev) => ({ ...prev, generate_financial: true }));
      }
    }
  }, [formData.purchase_order_id, isFinancialDisabledByOrder]);

  // ----------------------------------------------------------------
  // IMPORTAÇÃO REAL DE XML NF-e (browser-side via DOMParser)
  // ----------------------------------------------------------------
  const handleXMLDoubleClick = () => {
    if (formData.is_xml_imported) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml,text/xml,application/xml';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e: any) => {
      const file: File = e.target.files[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      const loadingToast = toast.loading(`Lendo ${file.name}...`);
      try {
        const nfe = await readNFeFile(file);

        // Avisa sobre warnings não-fatais
        if (nfe.warnings?.length) {
          nfe.warnings.forEach((w) => toast(w, { icon: 'âš ï¸' }));
        }

        // Preenche os campos do formulário com dados reais da NF-e
        setFormData((prev) => ({
          ...prev,
          is_xml_imported: true,
          xml_key: nfe.chNFe || '',
          invoice_number: nfe.nNF,
          series: nfe.serie,
          modelo_fiscal: nfe.modelo || '55',
          nature_of_operation: nfe.natOp || prev.nature_of_operation,
          issue_date: nfeDateToInputDate(nfe.dhEmi),
          total_value: nfe.vNF.toString(),
          description: nfe.infAdic || prev.description,
        }));

        // Converte os itens reais da NF-e para o formato do InsumoItem
        const xmlItems: InsumoItem[] = nfe.itens.map((item) => ({
          id: `xml-${item.nItem}-${Date.now()}`,
          produto_id: '',
          nome: item.xProd,
          quantidade: item.qCom,
          unidade: item.uCom,
          preco_unitario: item.vUnCom,
          despesa_adicional: 0,
          desconto: 0,
          deposito_id: '',
          total: item.vProd,
          // Campos XML para o matching inteligente
          xml_product_code: item.cProd,
          xml_product_name: item.xProd,
          xml_ncm: item.NCM,
          match_status: 'unmatched' as const,
        }));

        setItems(xmlItems);
        toast.success(`NF-e importada com sucesso! ${nfe.itens.length} item(s) carregados.`, {
          id: loadingToast,
          duration: 3000,
        });
        await checkOrCreateSupplier(nfe.emit);
      } catch (err: any) {
        toast.error(`Erro ao ler o XML: ${err.message || 'Arquivo inválido ou não é uma NF-e.'}`, {
          id: loadingToast,
          duration: 7000,
        });
      } finally {
        document.body.removeChild(input);
      }
    };

    input.click();
  };

  // ----------------------------------------------------------------
  // BUSCA SEFAZ (requer backend com certificado digital A1/A3)
  // Esta função hoje exibe orientação; quando o backend estiver pronto,
  // chamará uma Edge Function Supabase que consulta a SEFAZ.
  // ----------------------------------------------------------------
  const handleSimulateXMLImport = async () => {
    const chave = formData.xml_key.replace(/\D/g, '');
    if (chave.length !== 44 && chave.length !== 50) {
      toast.error('A chave de acesso deve ter 44 dígitos (NF-e) ou 50 dígitos (NFS-e Nacional).');
      return;
    }

    if (!formData.company_id) {
      showValidationAlert('Selecione uma Empresa Favorecida / Destinatário antes de buscar na SEFAZ.');
      return;
    }

    const loadingToast = toast.loading('Consultando portal da SEFAZ com certificado digital...', {
      style: {
        background: 'hsl(var(--bg-card))',
        color: 'hsl(var(--text-main))',
        border: '1px solid hsl(var(--border))',
      },
    });

    try {
      const { data, error } = await supabase.functions.invoke('fetch-sefaz-nfe', {
        body: {
          chave_acesso: chave,
          tenant_id: activeTenantId,
          company_id: formData.company_id,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Falha ao buscar Nota na SEFAZ.');
      }

      toast.success(data.message || 'Nota encontrada e importada com sucesso!', {
        id: loadingToast,
      });

      // Recebemos o XML mockado em Base64, parseamos e atualizamos o form!
      if (data.xmlBase64) {
        const xmlString = atob(data.xmlBase64);
        const nfe = parseNFeXML(xmlString);

        if (nfe.warnings?.length) {
          nfe.warnings.forEach((w) => toast(w, { icon: 'âš ï¸' }));
        }

        setFormData((prev) => ({
          ...prev,
          is_xml_imported: true,
          xml_key: chave || nfe.chNFe || '',
          invoice_number: nfe.nNF,
          series: nfe.serie,
          modelo_fiscal: nfe.modelo || '55',
          nature_of_operation: nfe.natOp || prev.nature_of_operation,
          issue_date: nfeDateToInputDate(nfe.dhEmi),
          total_value: nfe.vNF.toString(),
          description: nfe.infAdic || prev.description,
        }));

        const xmlItems: InsumoItem[] = nfe.itens.map((item) => ({
          id: `xml-${item.nItem}-${Date.now()}`,
          produto_id: '',
          nome: item.xProd,
          quantidade: item.qCom,
          unidade: item.uCom,
          preco_unitario: item.vUnCom,
          despesa_adicional: 0,
          desconto: 0,
          deposito_id: '',
          total: item.vProd,
          xml_product_code: item.cProd,
          xml_product_name: item.xProd,
          xml_ncm: item.NCM,
          match_status: 'unmatched' as const,
        }));

        setItems(xmlItems);
        await checkOrCreateSupplier(nfe.emit);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro SEFAZ: ${err.message}`, { id: loadingToast, duration: 8000 });
    }
  };

  const handleGenerateFinancialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecking = e.target.checked;
    if (!isChecking) {
      setShowFinancialConfirm(true);
    } else {
      setFormData((prev) => ({ ...prev, generate_financial: true }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        itens: items,
        installmentsList,
        iss_retido: isServiceInvoice ? parseFloat(formData.iss_retido) || 0 : 0,
        irrf_retido: isServiceInvoice ? parseFloat(formData.irrf_retido) || 0 : 0,
        csll_retido: isServiceInvoice ? parseFloat(formData.csll_retido) || 0 : 0,
        pis_retido: isServiceInvoice ? parseFloat(formData.pis_retido) || 0 : 0,
        cofins_retido: isServiceInvoice ? parseFloat(formData.cofins_retido) || 0 : 0,
        inss_retido: isServiceInvoice ? parseFloat(formData.inss_retido) || 0 : 0,
        valor_liquido: isServiceInvoice ? valorLiquido : parseFloat(formData.total_value) || 0,
      });
      clearDraft();
      onClose();
    } catch (error) {
      console.error('Error submitting invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const financialConfirmOverlay = showFinancialConfirm
    ? ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 15, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'hsl(var(--bg-card))',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'hsl(var(--warning)/0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--warning))',
                }}
              >
                <AlertCircle size={20} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-main))',
                  }}
                >
                  Atenção
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                  Confirmação necessária
                </p>
              </div>
            </div>
            <p
              style={{
                margin: '0 0 24px 0',
                fontSize: '13px',
                color: 'hsl(var(--text-main))',
                lineHeight: 1.5,
              }}
            >
              Tem certeza que deseja registrar esta Entrada de Nota SEM gerar os títulos
              financeiros? As obrigações no Contas a Pagar não serão criadas automaticamente.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowFinancialConfirm(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--bg-main))',
                  color: 'hsl(var(--text-main))',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, generate_financial: false }));
                  setShowFinancialConfirm(false);
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'hsl(var(--warning))',
                  color: 'hsl(var(--warning-foreground))',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Sim, desativar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const supplierConfirmOverlay = supplierConfirmData
    ? ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 15, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'hsl(var(--bg-card))',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'hsl(var(--primary)/0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--primary))',
                }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-main))',
                  }}
                >
                  Fornecedor não cadastrado
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                  Cadastro automático disponível
                </p>
              </div>
            </div>
            <p
              style={{
                margin: '0 0 24px 0',
                fontSize: '13px',
                color: 'hsl(var(--text-main))',
                lineHeight: 1.5,
              }}
            >
              O fornecedor{' '}
              <strong style={{ color: 'hsl(var(--primary))' }}>
                "{supplierConfirmData.nfeEmit.xNome}"
              </strong>{' '}
              (CNPJ/CPF: {supplierConfirmData.formattedCnpj}) não foi encontrado no banco de dados.
              Deseja cadastrá-lo automaticamente?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancelRegisterSupplier}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--bg-main))',
                  color: 'hsl(var(--text-main))',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Ignorar
              </button>
              <button
                type="button"
                onClick={handleConfirmRegisterSupplier}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Cadastrar Agora
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {financialConfirmOverlay}
      {supplierConfirmOverlay}
      <SidePanel
        isOpen={isOpen}
        onClose={() => {
          if (showFinancialConfirm) {
            setShowFinancialConfirm(false);
          } else if (supplierConfirmData) {
            setSupplierConfirmData(null);
          } else {
            onClose();
          }
        }}
        onCancel={() => { clearDraft(); setShowFinancialConfirm(false); setSupplierConfirmData(null); onClose(); }}
        onSubmit={handleSubmit}
        title={initialData ? 'Editar Nota Fiscal' : 'Entrada de Nota Fiscal'}
        subtitle="Registro blindado de documentos fiscais e atualização de estoque"
        icon={Barcode}
        loading={loading}
        submitLabel={initialData ? 'Salvar Alterações' : 'Processar Entrada'}
        submitDisabled={pendingMatches > 0}
        size="xxlarge"
      >
        {/* IMPORTAÇÃO E METADADOS FUNDIDOS NO PASSO 01 */}
        <section className="tauze-form-section">
          <div
            className="tauze-section-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="tauze-section-badge">PASSO 01</div>
              <h4 className="tauze-section-title">Metadados Fiscais</h4>
            </div>
            {formData.is_xml_imported ? (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: 'hsl(var(--success))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'hsl(var(--success)/0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
              >
                <Lock size={12} /> DADOS BLINDADOS
              </div>
            ) : (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: 'hsl(var(--warning))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'hsl(var(--warning)/0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
              >
                <AlertTriangle size={12} /> DIGITAÇÃO MANUAL
              </div>
            )}
          </div>

          {/* BANNER DE DETECÇÃO DE GADO */}
          {hasLivestockItems && !loteModalDismissed && (
            <div
              style={{
                background: 'hsl(var(--warning)/0.08)',
                border: '1px solid hsl(var(--warning)/0.3)',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'hsl(var(--warning)/0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--warning))',
                  flexShrink: 0,
                }}
              >
                <Beef size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-main))',
                  }}
                >
                  🐂 Detectamos animais nesta nota!
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                  Deseja criar um Lote de Recebimento no Módulo Bovinocultura para rastrear estes animais
                  individualmente?
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowLoteModal(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'hsl(var(--warning))',
                    border: 'none',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Criar Lote
                </button>
                <button
                  type="button"
                  onClick={() => setLoteModalDismissed(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--text-muted))',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Ignorar
                </button>
              </div>
            </div>
          )}

          {/* CARD BLINDADO OU ABERTO */}
          <div style={{ opacity: formData.is_xml_imported ? 0.85 : 1 }}>
            <div
              className="tauze-input-grid"
              style={{
                gridTemplateColumns: '1.2fr 1.2fr 0.8fr 1.2fr 1.2fr',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              {/* Row 1 */}
              <div className="tauze-field-group" style={{ minWidth: 0 }}>
                <label className="tauze-label">
                  <Building2 size={14} /> Empresa Destino
                </label>
                <SearchableSelect
                  value={formData.company_id}
                  onChange={(val: any) => setFormData({ ...formData, company_id: val })}
                  options={[
                    { value: '', label: 'Selecione...' },
                    ...(companies || []).map((c) => ({
                      value: String(c.id),
                      label: String(c.name),
                    })),
                  ]}
                />
              </div>

              <div className="tauze-field-group" style={{ minWidth: 0 }}>
                <label className="tauze-label">
                  <Settings size={14} /> Natureza da Operação
                </label>
                <SearchableSelect
                  value={formData.nature_of_operation}
                  onChange={(val: any) => setFormData({ ...formData, nature_of_operation: val })}
                  options={[
                    {
                      value: 'Compra para Industrialização',
                      label: 'Compra para Industrialização',
                    },
                    { value: 'Compra para Comercialização', label: 'Compra para Comercialização' },
                    {
                      value: 'Compra para Ativo Imobilizado',
                      label: 'Compra para Ativo Imobilizado',
                    },
                    { value: 'Devolução de Venda', label: 'Devolução de Venda' },
                  ]}
                />
              </div>

              <div className="tauze-field-group" style={{ minWidth: 0 }}>
                <label className="tauze-label">
                  <Calendar size={14} /> Emissão
                </label>
                <DateInput
                  className="tauze-input"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  readOnly={formData.is_xml_imported}
                  required
                />
              </div>

              <div className="tauze-field-group" style={{ gridColumn: 'span 2', minWidth: 0 }}>
                <label
                  className="tauze-label"
                  style={{
                    color: 'hsl(var(--brand))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  title="Dê um duplo clique no campo para importar o arquivo XML"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UploadCloud size={14} /> Importar XML
                  </span>
                  {formData.xml_key?.length === 44 && (
                    <span
                      style={{
                        fontSize: '10px',
                        background: 'hsl(var(--brand)/0.1)',
                        color: 'hsl(var(--brand))',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 800,
                      }}
                    >
                      NF-e
                    </span>
                  )}
                  {formData.xml_key?.length === 50 && (
                    <span
                      style={{
                        fontSize: '10px',
                        background: 'hsl(var(--warning)/0.1)',
                        color: 'hsl(var(--warning))',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 800,
                      }}
                    >
                      NFS-e
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="tauze-input"
                    type="text"
                    placeholder="Chave ou duplo clique p/ arquivo..."
                    value={formData.xml_key}
                    onChange={(e) =>
                      setFormData({ ...formData, xml_key: e.target.value.replace(/\D/g, '') })
                    }
                    onDoubleClick={handleXMLDoubleClick}
                    readOnly={formData.is_xml_imported}
                    style={{ flex: 1, cursor: formData.is_xml_imported ? 'default' : 'pointer' }}
                    title={
                      formData.is_xml_imported
                        ? ''
                        : 'Dê um duplo clique para fazer upload do arquivo XML'
                    }
                  />
                  {!formData.is_xml_imported && (
                    <button
                      type="button"
                      onClick={handleSimulateXMLImport}
                      className="primary-btn"
                      title="Buscar na SEFAZ"
                      style={{
                        padding: '0 16px',
                        height: '36px',
                        fontSize: '12px',
                        fontWeight: '800',
                        flexShrink: 0,
                      }}
                    >
                      Sefaz
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2 */}
              <div className="tauze-field-group" style={{ minWidth: 0 }}>
                <label className="tauze-label">
                  <Building2 size={14} /> Fornecedor Emissor
                </label>
                {formData.is_xml_imported ? (
                  <div
                    className="tauze-input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'hsl(var(--bg-main))',
                      overflow: 'hidden',
                      minWidth: 0,
                    }}
                    title={
                      suppliers.find((s) => String(s.id) === String(formData.supplier_id))?.nome ||
                      'Fornecedor XML...'
                    }
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      {suppliers.find((s) => String(s.id) === String(formData.supplier_id))?.nome ||
                        'Fornecedor XML...'}
                    </span>
                  </div>
                ) : (
                  <SearchableSelect
                    value={formData.supplier_id}
                    onChange={(val: any) => setFormData({ ...formData, supplier_id: val })}
                    options={[
                      { value: '', label: 'Selecione o parceiro...' },
                      ...(suppliers || []).map((s) => ({
                        value: String(s.id),
                        label: String(s.nome),
                      })),
                    ]}
                  />
                )}
              </div>

              <div className="tauze-field-group" style={{ minWidth: 0 }}>
                <label className="tauze-label">
                  <Hash size={14} /> Número da Nota
                </label>
                <input
                  className="tauze-input"
                  type="text"
                  placeholder="Ex: 000.123..."
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  readOnly={formData.is_xml_imported}
                  required
                />
              </div>

              <div className="tauze-field-group" style={{ minWidth: 0 }}>
                <label className="tauze-label">
                  <Layers size={14} /> Série
                </label>
                <input
                  className="tauze-input"
                  type="text"
                  placeholder="1"
                  value={formData.series}
                  onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                  readOnly={formData.is_xml_imported}
                  required
                />
              </div>

              <div className="tauze-field-group" style={{ minWidth: 0 }}>
                <label className="tauze-label">
                  <FileDigit size={14} /> Modelo Fiscal
                </label>
                <SearchableSelect
                  value={formData.modelo_fiscal}
                  onChange={(val: any) => setFormData({ ...formData, modelo_fiscal: val })}
                  options={[
                    { value: '55', label: '55 - NF-e (Normal)' },
                    { value: '65', label: '65 - NFC-e (Consumidor)' },
                    { value: '11', label: '11 - Produtor Rural' },
                    { value: '00', label: '00 - NFS-e (Serviço)' },
                  ]}
                />
              </div>

              <div className="tauze-field-group" style={{ minWidth: 0 }}>
                <label className="tauze-label" style={{ color: 'hsl(var(--warning))' }}>
                  <ClipboardList size={14} /> Vincular Ordem de Compra
                </label>
                <SearchableSelect
                  value={formData.purchase_order_id}
                  onChange={(val: any) => setFormData({ ...formData, purchase_order_id: val })}
                  options={[
                    { value: '', label: 'Sem vínculo' },
                    { value: 'OC-001', label: 'OC-001 - Adubos Safra (Bayer)' },
                    { value: 'OC-002', label: 'OC-002 - Peças Trator' },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Conferência de Estoque (Itens)</h4>
          </div>

          <div className="tauze-input-grid grid-col-1">
            <InsumoEntryTable
              key={`entry-table-${formData.is_xml_imported ? 'xml' : 'manual'}-${items.length}`}
              items={items}
              onChange={setItems}
              companyId={formData.company_id}
              supplierId={formData.supplier_id || undefined}
              onPendingMatchesChange={setPendingMatches}
              operationType="entry"
            />
            {pendingMatches > 0 && (
              <div
                style={{
                  margin: '12px 0 0',
                  padding: '10px 16px',
                  background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.25)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                  {pendingMatches} {pendingMatches === 1 ? 'item sem vínculo' : 'itens sem vínculo'}{' '}
                  com o catálogo — resolva antes de processar a entrada.
                </span>
              </div>
            )}
          </div>
        </section>

        {isServiceInvoice && (
          <section className="tauze-form-section">
            <div className="tauze-section-header" style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
              <div
                className="tauze-section-badge"
                style={{ background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)' }}
              >
                IMPOSTOS
              </div>
              <h4 className="tauze-section-title">Retenções Tributárias na Fonte</h4>
            </div>
            <div
              className="tauze-input-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}
            >
              <div className="tauze-field-group">
                <label
                  className="tauze-label"
                  style={{ fontWeight: '800', color: 'hsl(var(--text-muted))' }}
                >
                  ISS
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'hsl(var(--text-muted))',
                    }}
                  >
                    R$
                  </span>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.iss_retido}
                    onChange={(e) => setFormData({ ...formData, iss_retido: e.target.value })}
                    style={{ paddingLeft: '28px' }}
                  />
                </div>
              </div>
              <div className="tauze-field-group">
                <label
                  className="tauze-label"
                  style={{ fontWeight: '800', color: 'hsl(var(--text-muted))' }}
                >
                  IRRF
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'hsl(var(--text-muted))',
                    }}
                  >
                    R$
                  </span>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.irrf_retido}
                    onChange={(e) => setFormData({ ...formData, irrf_retido: e.target.value })}
                    style={{ paddingLeft: '28px' }}
                  />
                </div>
              </div>
              <div className="tauze-field-group">
                <label
                  className="tauze-label"
                  style={{ fontWeight: '800', color: 'hsl(var(--text-muted))' }}
                >
                  CSLL
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'hsl(var(--text-muted))',
                    }}
                  >
                    R$
                  </span>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.csll_retido}
                    onChange={(e) => setFormData({ ...formData, csll_retido: e.target.value })}
                    style={{ paddingLeft: '28px' }}
                  />
                </div>
              </div>
              <div className="tauze-field-group">
                <label
                  className="tauze-label"
                  style={{ fontWeight: '800', color: 'hsl(var(--text-muted))' }}
                >
                  PIS
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'hsl(var(--text-muted))',
                    }}
                  >
                    R$
                  </span>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.pis_retido}
                    onChange={(e) => setFormData({ ...formData, pis_retido: e.target.value })}
                    style={{ paddingLeft: '28px' }}
                  />
                </div>
              </div>
              <div className="tauze-field-group">
                <label
                  className="tauze-label"
                  style={{ fontWeight: '800', color: 'hsl(var(--text-muted))' }}
                >
                  COFINS
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'hsl(var(--text-muted))',
                    }}
                  >
                    R$
                  </span>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cofins_retido}
                    onChange={(e) => setFormData({ ...formData, cofins_retido: e.target.value })}
                    style={{ paddingLeft: '28px' }}
                  />
                </div>
              </div>
              <div className="tauze-field-group">
                <label
                  className="tauze-label"
                  style={{ fontWeight: '800', color: 'hsl(var(--text-muted))' }}
                >
                  INSS
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'hsl(var(--text-muted))',
                    }}
                  >
                    R$
                  </span>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.inss_retido}
                    onChange={(e) => setFormData({ ...formData, inss_retido: e.target.value })}
                    style={{ paddingLeft: '28px' }}
                  />
                </div>
              </div>
              <div className="tauze-field-group">
                <label
                  className="tauze-label"
                  style={{
                    fontWeight: '800',
                    color: 'hsl(var(--danger))',
                    textTransform: 'uppercase',
                  }}
                >
                  Total Retido
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#ef4444',
                    }}
                  >
                    -R$
                  </span>
                  <input
                    className="tauze-input"
                    type="text"
                    readOnly
                    disabled
                    value={totalWithholdings.toFixed(2)}
                    style={{
                      paddingLeft: '32px',
                      color: '#ef4444',
                      fontWeight: '800',
                      background: 'rgba(239, 68, 68, 0.05)',
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 03</div>
            <h4 className="tauze-section-title">Contas a Pagar</h4>
          </div>
          <div
            className="tauze-input-grid"
            style={{
              gridTemplateColumns:
                formData.payment_condition === 'prazo'
                  ? '1.5fr 1.5fr 1.5fr 1fr 2fr 1.2fr'
                  : '1.5fr 1fr 1fr 1.5fr 1.2fr',
            }}
          >
            <div className="tauze-field-group">
              <label
                className="tauze-label"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <DollarSign size={14} />{' '}
                {isServiceInvoice ? 'Valor Líquido da Nota' : 'Total da Nota'}
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: '900',
                    color: 'hsl(var(--success))',
                    fontSize: '18px',
                    letterSpacing: '-0.5px',
                  }}
                >
                  R$
                </span>
                <input
                  className="tauze-input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={isServiceInvoice ? valorLiquido : formData.total_value}
                  onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                  readOnly={formData.is_xml_imported || isServiceInvoice}
                  required
                  style={{
                    fontWeight: '900',
                    color: 'hsl(var(--success))',
                    fontSize: '18px',
                    height: '42px',
                    paddingLeft: '44px',
                    letterSpacing: '-0.5px',
                    background:
                      formData.is_xml_imported || isServiceInvoice
                        ? 'hsl(var(--bg-main))'
                        : 'transparent',
                  }}
                />
              </div>
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label">
                <Banknote size={14} /> Condição
              </label>
              <SearchableSelect
                value={formData.payment_condition}
                onChange={(val: any) => setFormData({ ...formData, payment_condition: val })}
                options={[
                  { value: 'vista', label: 'À Vista' },
                  { value: 'prazo', label: 'Parcelado / A Prazo' },
                ]}
              />
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label">
                <CreditCard size={14} /> Meio de Pagamento
              </label>
              <SearchableSelect
                value={formData.payment_method}
                onChange={(val: any) => setFormData({ ...formData, payment_method: val })}
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
                <label className="tauze-label">
                  <Hash size={14} /> Parcelas
                </label>
                <input
                  className="tauze-input"
                  type="number"
                  min="1"
                  max="48"
                  value={formData.installments}
                  onChange={(e) =>
                    setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            )}

            <div className="tauze-field-group">
              <label className="tauze-label">
                <Wallet size={14} /> Conta / Caixa de Origem
              </label>
              <SearchableSelect
                value={formData.bank_account_id}
                onChange={(val: any) => setFormData({ ...formData, bank_account_id: val })}
                options={[
                  { value: '', label: 'Selecione a conta...' },
                  ...(bankAccounts || []).map((account) => ({
                    value: String(account.id),
                    label: String(account.descricao || account.banco),
                  })),
                ]}
              />
            </div>

            <div className="tauze-field-group" style={{ justifyContent: 'flex-end' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isFinancialDisabledByOrder
                    ? 'hsl(var(--bg-main))'
                    : 'hsl(var(--brand)/0.05)',
                  padding: '0 16px',
                  height: '48px',
                  borderRadius: '14px',
                  border: isFinancialDisabledByOrder
                    ? '1px dashed hsl(var(--border))'
                    : '1px dashed hsl(var(--brand)/0.3)',
                  cursor: isFinancialDisabledByOrder ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isFinancialDisabledByOrder ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.generate_financial}
                  onChange={handleGenerateFinancialChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: isFinancialDisabledByOrder ? 'not-allowed' : 'pointer',
                    accentColor: 'hsl(var(--brand))',
                    flexShrink: 0,
                  }}
                  disabled={isFinancialDisabledByOrder}
                />
                <span
                  style={{
                    fontWeight: '700',
                    color: isFinancialDisabledByOrder
                      ? 'hsl(var(--text-muted))'
                      : 'hsl(var(--brand))',
                    fontSize: '11px',
                    lineHeight: 1.2,
                  }}
                >
                  Gerar Financeiro {isFinancialDisabledByOrder && '(Gerado no Pedido)'}
                </span>
              </label>
            </div>
          </div>

          {formData.payment_condition === 'prazo' && installmentsList.length > 0 && (
            <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
              <div className="tauze-field-group" style={{ padding: '8px 0' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: 'hsl(var(--text-muted))',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                  }}
                >
                  Faturas (Espelho do XML)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {installmentsList.map((inst, index) => (
                    <div
                      key={inst.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'hsl(var(--bg-card))',
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: 'hsl(var(--brand))',
                          width: '30px',
                        }}
                      >
                        {index + 1}ª
                      </span>
                      <DateInput
                        type="date"
                        className="tauze-input"
                        style={{ height: '32px', padding: '0 8px', fontSize: '12px', flex: 1 }}
                        value={inst.dueDate}
                        onChange={(e) => updateInstallment(inst.id, 'dueDate', e.target.value)}
                      />
                      <div style={{ position: 'relative', flex: 1 }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '10px',
                            fontWeight: '800',
                            color: 'hsl(var(--text-muted))',
                          }}
                        >
                          R$
                        </span>
                        <input
                          type="number"
                          className="tauze-input"
                          style={{
                            height: '32px',
                            padding: '0 8px 0 24px',
                            fontSize: '12px',
                            width: '100%',
                          }}
                          value={inst.value || ''}
                          onChange={(e) =>
                            updateInstallment(inst.id, 'value', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {(() => {
                  const targetComparisonValue = isServiceInvoice
                    ? valorLiquido
                    : parseFloat(formData.total_value) || 0;
                  const isMatch =
                    installmentsList.reduce((acc, i) => acc + i.value, 0).toFixed(2) ===
                    targetComparisonValue.toFixed(2);
                  if (isMatch) {
                    return null;
                  }
                  return (
                    <div
                      style={{
                        marginTop: '16px',
                        textAlign: 'right',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'hsl(var(--danger))',
                      }}
                    >
                      Soma das Parcelas:{' '}
                      {installmentsList
                        .reduce((acc, i) => acc + i.value, 0)
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      <span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>
                        (Divergente do valor {isServiceInvoice ? 'líquido' : 'total'} da nota)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </section>

        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <h4 className="tauze-section-title" style={{ fontSize: '13px' }}>
              Observações do Recebimento
            </h4>
          </div>
          <div className="tauze-input-grid grid-col-1">
            <div className="tauze-field-group">
              <textarea
                className="tauze-input tauze-textarea"
                placeholder="Notas adicionais sobre a conferência..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ minHeight: '60px' }}
              />
            </div>
          </div>
        </section>
      </SidePanel>
      <LoteRecebimentoModal
        isOpen={showLoteModal}
        onClose={() => setShowLoteModal(false)}
        quantidadeCabecas={items.reduce(
          (acc: number, item: any) => acc + (item.quantidade || 0),
          0
        )}
        valorTotal={parseFloat(formData.total_value) || 0}
        fornecedor={suppliers.find((s: any) => String(s.id) === String(formData.supplier_id))?.nome}
        onSuccess={(loteId, tipo) => {
          setShowLoteModal(false);
          setLoteModalDismissed(true);
          toast.success(
            tipo === 'pendente'
              ? '✅ Lote pendente criado! Acesse Bovinocultura > Lotes para processar os animais quando chegarem.'
              : '✅ Lote vinculado com sucesso! Custo por cabeça calculado automaticamente.'
          );
        }}
      />
    </>
  );
};
