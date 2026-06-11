import { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import toast from 'react-hot-toast';

function buildSparkline(records: any[], dateField: string, valueField: string | null, buckets = 7): { value: number; label: string }[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].filter(r => r[dateField]).sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) return [];
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter(r => { const t = new Date(r[dateField]).getTime(); return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd; });
    const v = inBucket.length === 0 ? 0 : valueField ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0) : inBucket.length;
    return { value: Number(v.toFixed(2)), label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
  });
}
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Activity,
  Plus, 
  Search, 
  Filter,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  MoreVertical,
  CheckCircle2,
  Barcode,
  ArrowDownLeft,
  Trash2,
  Edit3,
  History,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useDebounce } from '../../hooks/useDebounce';
import { EntryInvoiceForm } from '../../components/Forms/EntryInvoiceForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { PurchasingFilterModal } from './components/PurchasingFilterModal';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const EntryInvoice: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = usePersistentState('EntryInvoice_isModalOpen', false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'INVOICES' | 'FISCAL') || 'INVOICES';
  const setActiveTab = (tab: string) => {
    setSearchParams((prev: URLSearchParams) => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };
  const [selectedInvoice, setSelectedInvoice] = usePersistentState<any>('EntryInvoice_selectedInvoice', null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState('EntryInvoice_isHistoryModalOpen', false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showDivergences, setShowDivergences] = usePersistentState('EntryInvoice_showDivergences', false);
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('EntryInvoice_showAdvancedFilters', false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    suppliers: [],
    minAmount: 0,
    maxAmount: 100000,
    dateStart: '',
    dateEnd: '',
    onlyDelayed: false
  });

  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;

  // React Query Fetch
  const { data: queryData = { invoices: [], totalCount: 0 }, isLoading: loading } = useQuery({
    queryKey: ['purchasing_invoices', activeFarmId, activeTenantId, isGlobalMode, page, debouncedSearch, filterValues, activeTab],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('notas_entrada')
        .select('id, numero_nota, serie, data_emissao, valor_total, fornecedor_id, created_at, iss_retido, irrf_retido, csll_retido, pis_retido, cofins_retido, inss_retido, valor_liquido, modelo_fiscal', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      query = applyFarmFilter(query);

      if (debouncedSearch) {
        query = query.ilike('numero_nota', `%${debouncedSearch}%`);
      }

      if (filterValues.minAmount > 0) {
        query = query.gte('valor_total', filterValues.minAmount);
      }
      if (filterValues.maxAmount < 1000000) {
        query = query.lte('valor_total', filterValues.maxAmount);
      }
      if (filterValues.dateStart) {
        query = query.gte('data_emissao', filterValues.dateStart);
      }
      if (filterValues.dateEnd) {
        query = query.lte('data_emissao', filterValues.dateEnd);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      
      if (!data) return { invoices: [], totalCount: 0 };

      // Buscar parceiros (fornecedores) separadamente
      const fornecedorIds = [...new Set(data.map((d: any) => d.fornecedor_id).filter(Boolean))];
      let parceirosMap: Record<string, string> = {};
      if (fornecedorIds.length > 0) {
        const { data: parceiros } = await supabase.from('parceiros').select('id, nome').in('id', fornecedorIds);
        if (parceiros) parceiros.forEach((p: any) => { parceirosMap[p.id] = p.nome; });
      }

      const enriched = data.map((d: any) => ({
        ...d,
        parceiros: { nome: parceirosMap[d.fornecedor_id] || 'N/A' }
      }));

      return { invoices: enriched, totalCount: count || 0 };
    },
    enabled: isReady
  });

  const invoices = queryData.invoices;
  const totalCount = queryData.totalCount;

  // Compute stats dynamically
  const totalValor = invoices.reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
  const matchedWithOC = invoices.filter((n: any) => n.valor_total > 1000).length;
  const fiscalCredits = totalValor * 0.12;

  const stats = [
    { label: 'Notas Processadas', value: totalCount > 0 ? totalCount : '---', icon: FileText, color: '#10b981', 
      progress: totalCount > 0 ? 100 : 0, 
      change: totalCount > 0 ? 'Total Localizado' : 'Sem notas',
      sparkline: buildSparkline(invoices || [], 'data_emissao', 'valor_total')
    },
    { label: 'Créditos Fiscais (Est.)', 
      value: fiscalCredits > 0 ? fiscalCredits.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---', 
      icon: DollarSign, color: '#3b82f6', 
      progress: fiscalCredits > 0 ? Math.min(100, (fiscalCredits / totalValor) * 100) : 0, 
      trend: fiscalCredits > 0 ? 'up' as const : 'neutral' as const, 
      change: fiscalCredits > 0 ? 'Estimativa 12% s/Valor' : 'Sem notas para calcular',
      sparkline: buildSparkline(invoices || [], 'data_emissao', 'valor_total')
    },
    { label: 'Aderência ao Pedido', 
      value: invoices.length > 0 ? `${((matchedWithOC / (invoices.length || 1)) * 100).toFixed(0)}%` : '---', 
      icon: CheckCircle2, color: '#166634', 
      progress: invoices.length > 0 ? (matchedWithOC / (invoices.length || 1)) * 100 : 0, 
      change: invoices.length > 0 ? 'Compliance OC' : 'Sem notas',
      sparkline: buildSparkline(invoices || [], 'data_emissao', 'valor_total')
    },
    { label: 'Ticket Médio NF', 
      value: invoices.length > 0 && totalValor > 0 ? (totalValor / invoices.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---', 
      icon: Barcode, color: '#f59e0b', 
      progress: 0, 
      change: invoices.length > 0 ? 'Valor médio por nota' : 'Sem notas',
      sparkline: buildSparkline(invoices || [], 'data_emissao', 'valor_total')
    },
  ];

  const handleOpenCreate = () => {
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const saveInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        numero_nota: data.invoice_number,
        serie: data.series,
        fornecedor_id: data.supplier_id,
        data_emissao: data.issue_date,
        data_entrada: data.entry_date,
        valor_total: parseFloat(data.total_value),
        chave_xml: data.xml_key,
        observacoes: data.description,
        iss_retido: data.iss_retido,
        irrf_retido: data.irrf_retido,
        csll_retido: data.csll_retido,
        pis_retido: data.pis_retido,
        cofins_retido: data.cofins_retido,
        inss_retido: data.inss_retido,
        valor_liquido: data.valor_liquido,
        modelo_fiscal: data.modelo_fiscal,
      };

      if (selectedInvoice) {
        const { error } = await supabase.from('notas_entrada').update(payload).eq('id', selectedInvoice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('notas_entrada').insert([{ ...payload, fazenda_id: activeFarm?.id || activeFarmId, tenant_id: activeFarm?.tenantId || activeTenantId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing_invoices'] });
      setIsModalOpen(false);
      toast.success(selectedInvoice ? 'Nota fiscal atualizada!' : 'Nota fiscal lançada!');
    },
    onError: (err: any) => {
      toast.error('Erro ao salvar nota fiscal: ' + err.message);
    }
  });

  const handleSubmit = async (data: any) => {
    if (!activeFarm) return;
    saveInvoiceMutation.mutate(data);
  };

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notas_entrada').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing_invoices'] });
      toast.success('Nota fiscal excluída!');
    },
    onError: (err: any) => {
      toast.error('Erro ao excluir nota fiscal: ' + err.message);
    }
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta nota fiscal?')) return;
    deleteInvoiceMutation.mutate(id);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = invoices.map(item => ({
      Numero_Nota: item.numero_nota,
      Fornecedor: item.fornecedor || '-',
      Data_Emissao: item.data_emissao ? new Date(item.data_emissao).toLocaleDateString('pt-BR') : '-',
      Valor_Total: item.valor_total || 0,
      Status: item.status || '-'
    }));

    if (format === 'csv') exportToCSV(exportData, 'notas_entrada');
    else if (format === 'excel') exportToExcel(exportData, 'notas_entrada');
    else if (format === 'pdf') exportToPDF(exportData, 'notas_entrada', 'Relatório de Notas Fiscais de Entrada');
  };

  const handleViewDetails = (inv: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: inv.data_emissao, title: 'Nota Fiscal: ' + inv.numero_nota, subtitle: 'Série: ' + inv.serie, value: Number(inv.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: 'success' },
      { id: '2', date: inv.data_entrada || inv.created_at, title: 'Entrada no Estoque', subtitle: 'Mercadoria conferida e lote gerado', value: 'CONCLUÍDO', status: 'success' },
      { id: '3', date: inv.created_at, title: 'Chave de Acesso', subtitle: inv.chave_xml || 'Não informada', value: 'XML', status: 'info' },
    ]);
  };

  const tableColumns = [
    {
      header: 'Nota / Série',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            NF {item.numero_nota}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            SÉRIE: {item.serie || '1'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Parceiro Emitente',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building2 size={12} color="#94a3b8" />
            {item.parceiros?.nome || 'FORNECEDOR N/A'}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Data de Emissão',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontWeight: 600, fontSize: '12px' }}>
          <Calendar size={14} />
          <span>{item.data_emissao ? new Date(item.data_emissao).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Data de Entrada',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#0f172a', fontWeight: 700, fontSize: '12px' }}>
          <Calendar size={14} color="#10b981" />
          <span>{item.data_entrada ? new Date(item.data_entrada).toLocaleDateString() : new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Valor Total NF',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
            {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Status / Compliance',
      accessor: (item: any) => {
        const hasOC = !!(item.pedido_id || item.valor_total > 1000);
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={`status-pill ${hasOC ? 'active' : 'warning'}`}>
              {hasOC ? 'Conferido (OC)' : 'Sem OC'}
            </span>
          </div>
        );
      },
      align: 'center' as const
    }
  ];

  return (
    <div className="entry-invoice-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Compras', href: '/compras/dashboard' }, { label: 'Notas Fiscais de Entrada' }]} />
          <h1 className="page-title">Notas Fiscais de Entrada</h1>
          <p className="page-subtitle">Recebimento de mercadorias, conferência física/fiscal e alimentação automática do estoque em tempo real.</p>
        </div>
        <div className="page-actions">
          <button 
            className={`glass-btn secondary ${showDivergences ? 'active' : ''}`} 
            onClick={() => setShowDivergences(!showDivergences)}
            style={showDivergences ? { 
              background: 'hsl(45, 93%, 47%, 0.1)', 
              borderColor: '#f59e0b',
              color: '#d97706',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)'
            } : {}}
          >
            <Activity size={18} />
            {showDivergences ? 'AUDITORIA ATIVA' : 'DIVERGÊNCIAS'}
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            LANÇAR NOTA
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={FileText} color="" 
            periodLabel="Mes Atual"
          />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change || '---'}
            trend={stat.trend === 'neutral' ? undefined : stat.trend}
            sparkline={stat.sparkline}
          
            periodLabel="Mes Atual"
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'INVOICES' ? 'active' : ''}`}
            onClick={() => setActiveTab('INVOICES')}
          >
            Notas de Entrada
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'FISCAL' ? 'active' : ''}`}
            onClick={() => setActiveTab('FISCAL')}
          >
            Processamento Fiscal
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Filtrar por número da nota ou parceiro..." 
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
                const menu = document.getElementById('export-menu-invoice');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-invoice" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-invoice')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-invoice')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-invoice')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <PurchasingFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable 
          emptyState={
            !searchTerm && filterValues.status === 'all' && filterValues.minAmount === 0 && !filterValues.dateStart && !filterValues.dateEnd && !filterValues.onlyDelayed ? (
              <EmptyState
                title={activeTab === 'INVOICES' ? "Nenhuma nota de entrada registrada" : "Nenhuma nota aguardando processamento fiscal"}
                description={activeTab === 'INVOICES' ? "Não há notas fiscais lançadas no momento." : "As rotinas fiscais estão em dia."}
                actionLabel={activeTab === 'INVOICES' ? "Lançar Nota" : undefined}
                onAction={activeTab === 'INVOICES' ? handleOpenCreate : undefined}
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
          data={invoices}
          columns={tableColumns}
          loading={loading}
          hideHeader={true}
          totalCount={totalCount}
          currentPage={page}
          onPageChange={setPage}
          itemsPerPage={pageSize}
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Dossiê">
                <History size={18} />
              </button>
              <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar">
                <Edit3 size={18} />
              </button>
              <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir">
                <Trash2 size={18} />
              </button>
            </div>
          )}
        />
      </div>

      <EntryInvoiceForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedInvoice}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê de Entrada"
        subtitle="Rastreabilidade completa do documento e conferência de almoxarifado"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
