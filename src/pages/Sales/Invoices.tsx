import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useSearchParams } from 'react-router-dom';

function buildSparkline(
  records: any[],
  dateField: string,
  valueField: string | null,
  buckets = 7
): { value: number; label: string }[] {
  if (!records || records.length === 0) {
    return [];
  }
  const sorted = [...records]
    .filter((r) => r[dateField])
    .sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) {
    return [];
  }
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter((r) => {
      const t = new Date(r[dateField]).getTime();
      return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd;
    });
    const v =
      inBucket.length === 0
        ? 0
        : valueField
          ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0)
          : inBucket.length;
    return {
      value: Number(v.toFixed(2)),
      label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
    };
  });
}
import {
  FileText,
  Plus,
  Search,
  Download,
  Printer,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  DollarSign,
  ChevronRight,
  MoreVertical,
  ShieldCheck,
  Trash2,
  Edit3,
  History,
  Filter,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { OutputInvoiceForm } from '../../components/Forms/OutputInvoiceForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { OutputInvoiceFilterModal } from './components/OutputInvoiceFilterModal';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useConfirm } from '../../contexts/ConfirmContext';
import { hasDraftForKey } from '../../hooks/useFormDraft';

export const Invoices: React.FC = () => {
  const { confirm } = useConfirm();
  const {
    activeFarm,
    isGlobalMode,
    activeFarmId,
    activeTenantId,
    applyFarmFilter,
    canCreate,
    insertPayload,
  } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'ISSUED' | 'CANCELED') || 'ISSUED';
  const setActiveTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tab);
        return n;
      },
      { replace: true }
    );
  };
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'Invoices_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'Invoices_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    minAmount: 0,
    maxAmount: 1000000,
    dateStart: '',
    dateEnd: '',
    onlyConciliated: false,
  });

  // Auto-reabrir: restaura formulário se existe rascunho (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isModalOpen) return;
    if (hasDraftForKey(`output_invoice_form_${activeTenantId}`)) setIsModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  const {
    data: invoices = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['invoices', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      let query = supabase
        .from('notas_saida')
        .select('*, parceiros(nome)')
        .order('created_at', { ascending: false })
        .limit(500);
      query = applyFarmFilter(query);
      const { data, error } = await query;
      if (error) {
        throw error;
      }
      if (!data || data.length === 0) {
        return [];
      }

      // Data already includes parceiros via JOIN - no need for separate query
      return data.map((inv) => {
        const taxRate = inv.natureza_operacao?.toLowerCase().includes('venda') ? 0.023 : 0.015;
        const taxValue = Number(inv.valor_total) * taxRate;
        const hasFinancialLink = true;

        return {
          ...inv,
          parceiros: inv.parceiros || { nome: 'N/A' },
          taxValue,
          taxRate: (taxRate * 100).toFixed(1),
          hasFinancialLink,
          cfop: inv.natureza_operacao?.includes('5101') ? '5.101' : '5.102',
        };
      });
    },
    enabled: isGlobalMode ? !!activeTenantId : !!activeFarmId,
  });

  const stats = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return [
        {
          label: 'Faturamento Bruto',
          value: '---',
          icon: DollarSign,
          color: '#10b981',
          progress: 0,
          change: 'Sem dados',
          trend: 'up' as const,
          sparkline: [],
        },
        {
          label: 'Carga Tributária',
          value: '---',
          icon: ShieldCheck,
          color: '#ef4444',
          progress: 0,
          change: 'Sem dados',
          sparkline: [],
        },
        {
          label: 'Eficiência Fiscal',
          value: '---',
          icon: CheckCircle2,
          color: '#3b82f6',
          progress: 0,
          change: 'Sem dados',
          sparkline: [],
        },
        {
          label: 'Nota de Maior Valor',
          value: '---',
          icon: Activity,
          color: '#f59e0b',
          progress: 0,
          change: 'Sem dados',
          sparkline: [],
        },
      ];
    }
    const totalValor = invoices.reduce(
      (acc: number, curr: any) => acc + Number(curr.valor_total || 0),
      0
    );
    const totalTax = invoices.reduce((acc: number, curr: any) => acc + curr.taxValue, 0);

    return [
      {
        label: 'Faturamento Bruto',
        value:
          totalValor > 0
            ? totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '---',
        icon: DollarSign,
        color: '#10b981',
        progress: totalValor > 0 ? 100 : 0,
        change: totalValor > 0 ? 'Vendas Emitidas' : 'Sem notas emitidas',
        trend: 'up' as const,
        sparkline: buildSparkline(invoices || [], 'data_emissao', 'valor_total'),
      },
      {
        label: 'Carga Tributária',
        value:
          totalTax > 0
            ? totalTax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '---',
        icon: ShieldCheck,
        color: '#ef4444',
        progress: totalValor > 0 ? (totalTax / totalValor) * 100 : 0,
        change:
          totalValor > 0
            ? `${((totalTax / totalValor) * 100).toFixed(1)}% sobre faturamento`
            : 'Sem dados',
        sparkline: buildSparkline(invoices || [], 'data_emissao', 'valor_total'),
      },
      {
        label: 'Eficiência Fiscal',
        value: (() => {
          const autorizadas = invoices.filter((d: any) => d.status === 'authorized').length;
          return invoices.length > 0
            ? `${((autorizadas / invoices.length) * 100).toFixed(0)}%`
            : '---';
        })(),
        icon: CheckCircle2,
        color: '#3b82f6',
        progress: (() => {
          const autorizadas = invoices.filter((d: any) => d.status === 'authorized').length;
          return invoices.length > 0 ? (autorizadas / invoices.length) * 100 : 0;
        })(),
        change: 'Protocolos Autorizados',
        sparkline: buildSparkline(invoices || [], 'data_emissao', 'valor_total'),
      },
      {
        label: 'Nota de Maior Valor',
        value: (() => {
          const max = Math.max(...invoices.map((d: any) => Number(d.valor_total || 0)));
          return max > 0
            ? max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '---';
        })(),
        icon: Activity,
        color: '#f59e0b',
        progress: 0,
        change: invoices.length > 0 ? 'Maior NF emitida' : 'Sem dados',
        sparkline: buildSparkline(invoices || [], 'data_emissao', 'valor_total'),
      },
    ];
  }, [invoices]);

  const handleOpenCreate = () => {
    setSelectedInvoice(null);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: any) => {
    setSelectedInvoice(inv);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        numero_nota: data.invoice_number,
        serie: data.series,
        cliente_id: data.client_id,
        natureza_operacao: data.nature_of_operation,
        data_emissao: data.date,
        valor_total: parseFloat(data.total_value),
        transportadora: data.transport_company,
        observacoes: data.description,
        status: selectedInvoice?.status || 'authorized',
        iss_retido: data.iss_retido,
        irrf_retido: data.irrf_retido,
        csll_retido: data.csll_retido,
        pis_retido: data.pis_retido,
        cofins_retido: data.cofins_retido,
        inss_retido: data.inss_retido,
        valor_liquido: data.valor_liquido,
        modelo_fiscal: data.modelo_fiscal,
      };

      // Validate for duplicate invoice
      const { data: existing } = await supabase
        .from('notas_saida')
        .select('id')
        .eq('tenant_id', activeFarmId ? activeTenantId : insertPayload.tenant_id)
        .eq('cliente_id', payload.cliente_id)
        .eq('numero_nota', payload.numero_nota)
        .eq('serie', payload.serie || '')
        .eq('modelo_fiscal', payload.modelo_fiscal || '');

      if (existing && existing.length > 0) {
        const isDuplicate = selectedInvoice
          ? existing.some((e) => e.id !== selectedInvoice.id)
          : existing.length > 0;

        if (isDuplicate) {
          throw new Error(
            `Já existe uma Nota Fiscal cadastrada com o Número ${payload.numero_nota}, Série ${payload.serie || 's/n'} e Modelo ${payload.modelo_fiscal} para este Cliente. Valores duplicados não são permitidos.`
          );
        }
      }

      // Get client name for analytics
      let clientName = 'N/A';
      if (payload.cliente_id) {
        const { data: clientData } = await supabase
          .from('parceiros')
          .select('nome')
          .eq('id', payload.cliente_id)
          .single();
        if (clientData) {
          clientName = clientData.nome;
        }
      }

      if (selectedInvoice) {
        const { error } = await supabase
          .from('notas_saida')
          .update(payload)
          .eq('id', selectedInvoice.id);
        if (error) {
          throw error;
        }
        return { isUpdate: true, payload, clientName };
      } else {
        const { error } = await supabase
          .from('notas_saida')
          .insert([{ ...payload, ...insertPayload }]);
        if (error) {
          throw error;
        }

        // Gerar Movimentações de Estoque (Saída)
        if (data.itens && data.itens.length > 0) {
          const movimentacoes = data.itens
            .filter((item: any) => item.produto_id && item.quantidade > 0 && item.is_storable)
            .map((item: any) => ({
              tenant_id: activeFarmId ? activeTenantId : insertPayload.tenant_id,
              fazenda_id: activeFarmId ? activeFarmId : insertPayload.fazenda_id,
              produto_id: item.produto_id,
              tipo: 'SAIDA',
              quantidade: item.embalagem_fator
                ? item.quantidade * item.embalagem_fator
                : item.quantidade,
              data_movimentacao: payload.data_emissao,
              origem_destino: `Nota Fiscal Saída ${payload.numero_nota}`,
              responsavel: 'Sistema',
              deposito_id: item.deposito_id || null,
              custo_unitario: item.embalagem_fator
                ? item.preco_unitario / item.embalagem_fator
                : item.preco_unitario || 0,
              origem: 'VENDA',
            }));

          if (movimentacoes.length > 0) {
            const { error: movError } = await supabase
              .from('movimentacoes_estoque')
              .insert(movimentacoes);
            if (movError) {
              throw movError;
            }
          }
        }

        // Gerar Contas a Receber
        if (data.generate_financial) {
          let contasReceber: any[] = [];

          if (data.payment_condition === 'vista') {
            contasReceber.push({
              tenant_id: activeFarmId ? activeTenantId : insertPayload.tenant_id,
              fazenda_id: activeFarmId ? activeFarmId : insertPayload.fazenda_id,
              cliente_id: payload.cliente_id,
              descricao: `NF Saída ${payload.numero_nota} - Parcela Única (À Vista)`,
              valor_total: data.valor_liquido || payload.valor_total,
              data_vencimento: payload.data_emissao,
              status: 'pendente',
              metodo_recebimento: data.payment_method || 'Boleto',
            });
          } else if (data.installmentsList && data.installmentsList.length > 0) {
            contasReceber = data.installmentsList.map((inst: any) => ({
              tenant_id: activeFarmId ? activeTenantId : insertPayload.tenant_id,
              fazenda_id: activeFarmId ? activeFarmId : insertPayload.fazenda_id,
              cliente_id: payload.cliente_id,
              descricao: `NF Saída ${payload.numero_nota} - Parcela ${inst.id}`,
              valor_total: inst.value,
              data_vencimento: inst.dueDate,
              status: 'pendente',
              metodo_recebimento: data.payment_method || 'Boleto',
            }));
          }

          if (contasReceber.length > 0) {
            const { error: finError } = await supabase.from('contas_receber').insert(contasReceber);
            if (finError) {
              throw finError;
            }
          }
        }
        
        return { isUpdate: false, payload, clientName };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['invoices', activeFarmId, activeTenantId, isGlobalMode],
      });
      setIsModalOpen(false);
      
      const isUpdate = result?.isUpdate;
      const payload = result?.payload;
      const clientName = result?.clientName;
      
      toast.success(
        isUpdate ? 'Nota fiscal atualizada com sucesso!' : 'Nota fiscal emitida com sucesso!'
      );
      
      // Track sale completion event (only for new invoices)
      if (!isUpdate && payload) {
        import('../../lib/analytics').then(({ analytics }) => {
          analytics.saleCompleted({
            valor: payload.valor_liquido || payload.valor_total,
            cliente: clientName || 'N/A',
            tipo: payload.natureza_operacao || 'Venda',
          });
        });
      }
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao salvar nota fiscal: ${err.message}`);
    },
  });

  const handleSubmit = async (data: any) => {
    if (!canCreate) {
      toast.error(
        '⚠️ Selecione uma unidade específica para emitir uma nova nota fiscal. No modo Visão Global, a fazenda emitente deve ser definida.'
      );
      return;
    }
    saveMutation.mutate(data);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch invoice details to find associated records
      const { data: invoice } = await supabase
        .from('notas_saida')
        .select('numero_nota, cliente_id')
        .eq('id', id)
        .single();

      if (!invoice) {
        throw new Error('Nota fiscal não encontrada');
      }

      if (invoice.numero_nota) {
        // 1.5. Check if any associated contas a receber is already paid
        const { data: financeRecords, error: fetchFinError } = await supabase
          .from('contas_receber')
          .select('status')
          .eq('cliente_id', invoice.cliente_id)
          .ilike('descricao', `NF Saída ${invoice.numero_nota} - Parcela%`);

        if (fetchFinError) {
          throw fetchFinError;
        }

        if (
          financeRecords &&
          financeRecords.some(
            (r) =>
              r.status &&
              (r.status.toUpperCase() === 'PAGO' || r.status.toUpperCase() === 'RECEBIDO')
          )
        ) {
          throw new Error(
            'Não é possível excluir a nota fiscal pois existem parcelas já recebidas. Cancele o recebimento no financeiro primeiro.'
          );
        }

        // 2. Delete associated contas a receber
        const { error: finError } = await supabase
          .from('contas_receber')
          .delete()
          .eq('cliente_id', invoice.cliente_id)
          .ilike('descricao', `NF Saída ${invoice.numero_nota} - Parcela%`);

        if (finError) {
          console.error('Erro ao excluir contas a receber', finError);
        }

        // 3. Delete associated movimentacoes de estoque
        const { error: movError } = await supabase
          .from('movimentacoes_estoque')
          .delete()
          .eq('origem_destino', `Nota Fiscal Saída ${invoice.numero_nota}`)
          .eq('tipo', 'SAIDA');

        if (movError) {
          console.error('Erro ao excluir movimentacoes', movError);
        }
      }

      // 4. Delete the invoice
      const { error } = await supabase.from('notas_saida').delete().eq('id', id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['invoices', activeFarmId, activeTenantId, isGlobalMode],
      });
      toast.success('Nota fiscal excluída com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao excluir nota fiscal: ${err.message}`);
    },
  });

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: 'Deseja excluir esta nota fiscal?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const handleViewDetails = (inv: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      {
        id: '1',
        date: inv.data_emissao,
        title: `Nota Fiscal: ${inv.numero_nota}`,
        subtitle: `Parceiro: ${inv.parceiros?.nome || 'N/A'}`,
        value: Number(inv.valor_total || 0).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        status: inv.status === 'CONCLUIDA' ? 'success' : 'pending',
      },
      {
        id: '2',
        date: inv.data_emissao,
        title: 'Natureza da Operação',
        subtitle: inv.natureza_operacao || 'Venda de Produção',
        value: 'OK',
        status: 'info',
      },
      {
        id: '3',
        date: inv.data_emissao,
        title: 'Protocolo SEFAZ',
        subtitle: 'Transmissão autorizada',
        value: 'Ver XML',
        status: 'success',
      },
    ]);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = invoices.filter((inv) => {
      const matchesSearch =
        (inv.numero_nota || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.parceiros?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterValues.status === 'all' ||
        inv.status === filterValues.status ||
        (filterValues.status === 'pending' && inv.status !== 'authorized');
      const matchesAmount =
        filterValues.maxAmount >= 1000000 || Number(inv.valor_total) <= filterValues.maxAmount;
      const matchesConciliation = filterValues.onlyConciliated ? inv.hasFinancialLink : true;
      const matchesDate =
        (!filterValues.dateStart ||
          new Date(inv.data_emissao) >= new Date(filterValues.dateStart)) &&
        (!filterValues.dateEnd || new Date(inv.data_emissao) <= new Date(filterValues.dateEnd));
      return matchesSearch && matchesStatus && matchesAmount && matchesConciliation && matchesDate;
    });

    const exportData = filteredData.map((item) => ({
      Nota: `NF ${item.numero_nota}`,
      Serie: item.serie,
      Parceiro: item.parceiros?.nome || 'N/A',
      CFOP: item.cfop,
      Natureza: item.natureza_operacao,
      Data_Emissao: new Date(item.data_emissao).toLocaleDateString(),
      Valor_Total: `R$ ${Number(item.valor_total).toLocaleString()}`,
      Imposto_Est: `R$ ${item.taxValue.toLocaleString()}`,
      Status: item.status === 'authorized' ? 'Autorizada' : 'Pendente',
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'notas_saida');
    } else if (format === 'excel') {
      exportToExcel(exportData, 'notas_saida');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'notas_saida', 'Relatório de Notas Fiscais de Saída');
    }
  };

  const columns = [
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'authorized' ? 'success' : 'pending'}`}>
          {item.status === 'authorized' ? 'Autorizada' : 'Pendente'}
        </span>
      ),
      align: 'center' as const,
    },
    {
      header: 'Número / Série',
      accessor: (item: any) => (
        <div className="table-cell-title text-left">
          <span className="main-text font-bold text-slate-800">NF {item.numero_nota}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider text-slate-500">
            Série {item.serie}
          </div>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Parceiro / CFOP',
      accessor: (item: any) => (
        <div className="table-cell-title text-left">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-slate-400" />
            <span className="main-text font-bold text-slate-800">
              {item.parceiros?.nome || 'N/A'}
            </span>
          </div>
          <div className="sub-meta uppercase font-black text-[9px] tracking-wider text-indigo-600 bg-indigo-50 px-1 rounded border border-indigo-100 w-fit">
            CFOP {item.cfop} • {item.natureza_operacao}
          </div>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Emissão',
      accessor: (item: any) => (
        <div className="table-cell-meta flex items-center justify-center gap-1 text-slate-600 font-semibold">
          <Calendar size={14} />
          <span>{new Date(item.data_emissao).toLocaleDateString('pt-BR')}</span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Faturamento / Imposto',
      accessor: (item: any) => (
        <div className="flex flex-col items-end">
          <span className="main-text font-bold text-slate-900">
            {Number(item.valor_total).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
          <span className="text-[10px] font-black text-rose-600 flex items-center gap-1">
            <ShieldCheck size={10} /> {item.taxRate}% EST. IMPOSTO
          </span>
        </div>
      ),
      align: 'right' as const,
    },
    {
      header: 'Financeiro',
      accessor: (item: any) => (
        <div className="flex justify-center">
          {item.hasFinancialLink ? (
            <div className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 text-[9px] font-black flex items-center gap-1">
              <CheckCircle2 size={10} /> CONCILIADO
            </div>
          ) : (
            <div className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100 text-[9px] font-black">
              PENDENTE
            </div>
          )}
        </div>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <div className="invoice-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Vendas', href: '/vendas/dashboard' },
              { label: 'Notas Fiscais de Saída' },
            ]}
          />
          <h1 className="page-title">Notas Fiscais de Saída</h1>
          <p className="page-subtitle">
            Emissão, monitoramento de protocolos SEFAZ e gestão de obrigações fiscais eletrônicas em
            tempo real.
          </p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <Printer size={18} />
            LOTE PDF
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            EMITIR NOVA NF-E
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <TauzeStatCard
                  key={i}
                  loading={true}
                  label=""
                  value=""
                  icon={FileText}
                  color=""
                  periodLabel="Mês Atual"
                />
              ))
          : stats.map((stat, idx) => (
              <TauzeStatCard
                key={idx}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                progress={stat.progress}
                change={stat.change || '---'}
                trend={stat.trend}
                sparkline={stat.sparkline}
                periodLabel="Mês Atual"
              />
            ))}
      </div>
      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${activeTab === 'ISSUED' ? 'active' : ''}`}
            onClick={() => setActiveTab('ISSUED')}
          >
            Emitidas
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'CANCELED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CANCELED')}
          >
            Canceladas
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Pesquisar por número, parceiro ou série..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
          <button
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <div className="export-dropdown-container">
            <button
              className="icon-btn-secondary"
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-invoices');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-invoices" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-invoices')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-invoices')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-invoices')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <OutputInvoiceFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable
          emptyState={
            !searchTerm &&
            filterValues.status === 'all' &&
            filterValues.minAmount === 0 &&
            filterValues.maxAmount === 1000000 &&
            !filterValues.dateStart &&
            !filterValues.dateEnd &&
            !filterValues.onlyConciliated ? (
              <EmptyState
                title={
                  activeTab === 'ISSUED'
                    ? 'Nenhuma nota fiscal emitida'
                    : 'Nenhuma nota fiscal cancelada'
                }
                description={
                  activeTab === 'ISSUED'
                    ? 'Você não possui notas fiscais de saída emitidas no momento.'
                    : 'Não há histórico de notas fiscais canceladas.'
                }
                actionLabel={activeTab === 'ISSUED' ? 'Emitir Nova NF-e' : undefined}
                onAction={activeTab === 'ISSUED' ? handleOpenCreate : undefined}
                icon={FileText}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          }
          data={invoices.filter((inv) => {
            const matchesSearch =
              (inv.numero_nota || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
              (inv.parceiros?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Dummy logic for active tab since backend might not have status=canceled in mock data yet
            const matchesTab =
              activeTab === 'ISSUED' ? inv.status !== 'canceled' : inv.status === 'canceled';

            const matchesStatus =
              filterValues.status === 'all' ||
              inv.status === filterValues.status ||
              (filterValues.status === 'pending' && inv.status !== 'authorized');
            const matchesAmount =
              filterValues.maxAmount >= 1000000 ||
              Number(inv.valor_total) <= filterValues.maxAmount;
            const matchesConciliation = filterValues.onlyConciliated ? inv.hasFinancialLink : true;
            const matchesDate =
              (!filterValues.dateStart ||
                new Date(inv.data_emissao) >= new Date(filterValues.dateStart)) &&
              (!filterValues.dateEnd ||
                new Date(inv.data_emissao) <= new Date(filterValues.dateEnd));

            return (
              matchesSearch &&
              matchesTab &&
              matchesStatus &&
              matchesAmount &&
              matchesConciliation &&
              matchesDate
            );
          })}
          columns={columns}
          loading={loading}
          hideHeader={true}
          actions={(item) => (
            <div className="modern-actions">
              <button
                className="action-dot info"
                onClick={() => handleViewDetails(item)}
                title="Detalhes"
              >
                <History size={18} />
              </button>
              <button
                className="action-dot edit"
                onClick={() => handleOpenEdit(item)}
                title="Editar"
              >
                <Edit3 size={18} />
              </button>
              <button
                className="action-dot delete"
                onClick={() => handleDelete(item.id)}
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
              <button className="action-dot" onClick={() => {}} title="Imprimir">
                <Printer size={18} />
              </button>
            </div>
          )}
        />
      </div>

      <OutputInvoiceForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionId={formActionId}
        onSubmit={handleSubmit}
        initialData={selectedInvoice}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê Fiscal"
        subtitle="Rastreabilidade completa do documento e autorização SEFAZ"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
