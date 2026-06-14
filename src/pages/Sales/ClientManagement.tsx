import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';


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
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Building2, 
  Phone,
  Star,
  TrendingUp,
  Trash2,
  Edit3,
  FileText,
  MapPin,
  Target,
  LayoutGrid,
  List as ListIcon,
  AlertTriangle,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { ClientForm } from '../../components/Forms/ClientForm';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { useSearchParams } from 'react-router-dom';
import { ClientFilterModal } from './components/ClientFilterModal';
import { useDebounce } from '../../hooks/useDebounce';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useViewMode } from '../../hooks/useViewMode';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useServerPagination } from '../../hooks/useServerPagination';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '../../contexts/ConfirmContext';

export const ClientManagement: React.FC = () => {
  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(20);
  const { confirm } = useConfirm();
  const { activeFarm, isGlobalMode, activeTenantId } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = usePersistentState('ClientManagement_isModalOpen', false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ATIVO' | 'LEAD'>('ATIVO');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState('ClientManagement_isHistoryModalOpen', false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useViewMode('sales-client-management', 'grid');
  const [selectedSegment, setSelectedSegment] = useState('TODOS');
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('ClientManagement_showAdvancedFilters', false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    segments: [] as string[],
    minLtv: 0,
    maxLtv: 1000000,
    onlyChurnRisk: false,
    rating: 'all'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const queryClient = useQueryClient();

  const tenantId = activeTenantId || activeFarm?.tenantId;
  const isReady = isGlobalMode ? !!activeTenantId : !!activeFarm;

  const { data: crmData = { enrichedClients: [], totalSales: 0 }, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['parceiros-crm', tenantId, isReady],
    queryFn: async () => {
      if (!isReady || !tenantId) return { enrichedClients: [], totalSales: 0 };

      const { data: clientData, error: clientError } = await supabase
        .from('parceiros')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_customer', true)
        .order('nome', { ascending: true });

      if (clientError) throw clientError;

      const { data: salesData, error: salesError } = await supabase
        .from('pedidos_venda')
        .select('*')
        .eq('tenant_id', tenantId);

      if (salesError) throw salesError;

      const enrichedClients = (clientData || []).map(client => {
        const clientSales = salesData?.filter(s => s.cliente_id === client.id) || [];
        const ltv = clientSales.reduce((acc, s) => acc + Number(s.valor_total || 0), 0);
        const lastSale = clientSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        const daysSinceLastSale = lastSale ? (new Date().getTime() - new Date(lastSale.created_at).getTime()) / (1000 * 3600 * 24) : 999;
        const churnRisk = daysSinceLastSale > 90 && ltv > 0;

        return {
          ...client,
          ltv,
          daysSinceLastSale,
          churnRisk,
          rating: String(ltv > 100000 ? 'AAA' : ltv > 50000 ? 'AA' : ltv > 10000 ? 'A' : 'B'),
          segmento: String(client.segmento || (ltv > 50000 ? 'Ouro/VIP' : 'Prata/Recorrente'))
        };
      });

      const totalSales = salesData?.reduce((acc, s) => acc + Number(s.valor_total || 0), 0) || 0;

      return { enrichedClients, totalSales };
    },
    enabled: isReady && !!tenantId
  });

  const clients = crmData.enrichedClients;
  const totalSales = crmData.totalSales;

  if (queryError) {
    console.error("[ClientManagement] Query error:", queryError);
  }

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && clients.length > 0) {
      console.log('[DeepLink] Tentando abrir parceiro:', id);
      const client = clients.find((c) => c.id === id);
      if (client) {
        console.log('[DeepLink] Parceiro encontrado, abrindo modal...');
        handleOpenEdit(client);
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        console.warn('[DeepLink] Parceiro não encontrado na lista atual');
      }
    }
  }, [searchParams, clients]);

  const stats = React.useMemo(() => {
    if (!clients || clients.length === 0) {
      return [
        { label: 'Rede de Parceiros', value: '---', icon: Users, color: '#10b981', progress: 0, change: 'Sem clientes', sparkline: [] },
        { label: 'Receita Retida (LTV)', value: '---', icon: TrendingUp, color: '#3b82f6', progress: 0, change: 'Sem vendas', sparkline: [] },
        { label: 'Risco de Churn', value: '---', icon: AlertTriangle, color: '#ef4444', progress: 0, change: 'Nenhum em risco', sparkline: [] },
        { label: 'Aderência VIP', value: '---', icon: Star, color: '#f59e0b', progress: 0, change: 'Sem dados', sparkline: [] }
      ];
    }

    return [
      { 
        label: 'Rede de Parceiros', 
        value: clients.length > 0 ? clients.length : '---', 
        icon: Users, color: '#10b981', 
        progress: clients.length > 0 ? 100 : 0, 
        change: clients.length > 0 ? 'Base Total' : 'Sem clientes',
        sparkline: buildSparkline(clients, 'created_at', null)
      },
      { 
        label: 'Receita Retida (LTV)', 
        value: totalSales > 0 ? 'R$ ' + (totalSales / 1000).toFixed(1) + 'k' : '---', 
        icon: TrendingUp, color: '#3b82f6', 
        progress: totalSales > 0 ? Math.min(100, Math.log10(totalSales + 1) * 15) : 0, 
        trend: totalSales > 0 ? 'up' : 'neutral', 
        change: totalSales > 0 ? 'Total Histórico' : 'Sem vendas',
        sparkline: buildSparkline(clients, 'created_at', null)
      },
      { 
        label: 'Risco de Churn', 
        value: (() => { const ch = clients.filter((c) => c.churnRisk).length; return ch > 0 ? ch : '---'; })(),
        icon: AlertTriangle, color: '#ef4444', 
        progress: clients.length > 0 ? (clients.filter((c) => c.churnRisk).length / clients.length) * 100 : 0, 
        change: clients.filter((c) => c.churnRisk).length > 0 ? 'Inativos >90d' : 'Nenhum em risco',
        sparkline: buildSparkline(clients, 'created_at', null)
      },
      { 
        label: 'Aderência VIP', 
        value: clients.length > 0 ? ((clients.filter((c) => String(c.rating || '').startsWith('A')).length / (clients.length || 1)) * 100).toFixed(0) + '%' : '---',
        icon: Star, color: '#f59e0b', 
        progress: clients.length > 0 ? (clients.filter((c) => String(c.rating || '').startsWith('A')).length / clients.length) * 100 : 0, 
        change: clients.length > 0 ? 'Rating A+' : 'Sem dados',
        sparkline: buildSparkline(clients, 'created_at', null)
      },
    ];
  }, [clients, totalSales]);

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    setSelectedClient(client);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        nome: formData.name,
        cnpj_cpf: formData.cnpj,
        categoria_id: formData.categoria_id || null,
        email: formData.email,
        telefone: formData.phone,
        cep: formData.cep,
        tipo_logradouro: formData.tipo_logradouro,
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        pais: formData.pais,
        status: formData.status,
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      if (selectedClient) {
        const { error } = await supabase.from('parceiros').update({
          ...payload,
          is_customer: true,
          is_global: formData.is_global,
          fazendas_vinculadas: formData.fazendas_vinculadas
        }).eq('id', selectedClient.id);
        if (error) throw error;
      } else {
        let cleanCnpj = formData.cnpj?.replace(/\D/g, '');
        if (cleanCnpj && cleanCnpj.length > 0) {
          const { data: existing } = await supabase
            .from('parceiros')
            .select('id, is_supplier, is_customer')
            .eq('cnpj_cpf', formData.cnpj)
            .maybeSingle();

          if (existing) {
            if (existing.is_customer) {
              throw new Error('Este CPF/CNPJ já está cadastrado como cliente!');
            }
            
            const { error } = await supabase.from('parceiros').update({
              ...payload,
              is_customer: true,
              tenant_id: tenantId,
              is_global: formData.is_global,
              fazendas_vinculadas: formData.fazendas_vinculadas
            }).eq('id', existing.id);
            if (error) throw error;
            return { unificado: true };
          }
        }

        const { error } = await supabase.from('parceiros').insert([{ 
          ...payload, 
          is_customer: true,
          tenant_id: tenantId,
          is_global: formData.is_global,
          fazendas_vinculadas: formData.fazendas_vinculadas
        }]);
        if (error) throw error;
      }
      return { unificado: false };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parceiros-crm'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsModalOpen(false);
      if (data?.unificado) {
        toast.success('Parceiro unificado! Ele agora também é um Cliente.');
      } else {
        toast.success('Cliente salvo com sucesso!');
      }
    },
    onError: (err: any) => {
      console.error('[ClientManagement] Erro ao salvar parceiro:', err);
      toast.error('❌ Erro ao salvar parceiro: ' + (err.message || 'Erro desconhecido'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parceiros').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parceiros-crm'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('Parceiro excluído com sucesso!');
    },
    onError: (err: any) => {
      console.error('[ClientManagement] Erro ao excluir parceiro:', err);
      toast.error('❌ Erro ao excluir parceiro: ' + err.message);
    }
  });

  const handleSubmit = async (formData: any) => {
    if (!tenantId && !selectedClient) return;
    saveMutation.mutate(formData);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = clients.filter(client => {
      const matchesSearch = (client.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (client.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'ATIVO' ? client.status?.toUpperCase() === 'ATIVO' : client.status?.toUpperCase() !== 'ATIVO';
      const matchesFarm = isGlobalMode || client.is_global || (activeFarm && client.fazendas_vinculadas?.includes(activeFarm.id));
      const matchesSegmentTab = selectedSegment === 'TODOS' ? true : client.segmento === selectedSegment;
      
      const matchesStatus = filterValues.status === 'all' || client.status === filterValues.status;
      const matchesRating = filterValues.rating === 'all' || client.rating === filterValues.rating;
      const matchesLtv = filterValues.maxLtv >= 1000000 || ((client.ltv || 0) <= filterValues.maxLtv);
      const matchesChurn = filterValues.onlyChurnRisk ? client.churnRisk : true;
      const matchesSegments = filterValues.segments.length === 0 || filterValues.segments.includes(client.segmento);

      return matchesSearch && matchesTab && matchesFarm && matchesSegmentTab && matchesStatus && matchesRating && matchesLtv && matchesChurn && matchesSegments;
    });

    const exportData = filteredData.map(item => ({
      Nome: item.nome,
      Documento: item.documento || '-',
      Tipo: item.tipo,
      Email: item.email || '-',
      Telefone: item.telefone || '-',
      Cidade: item.cidade || '-',
      Estado: item.estado || '-',
      LTV: item.ltv || 0,
      Segmento: item.segmento || '-',
      Rating: item.rating || '-',
      Status: item.status
    }));

    if (format === 'csv') exportToCSV(exportData, 'parceiros');
    else if (format === 'excel') exportToExcel(exportData, 'parceiros');
    else if (format === 'pdf') exportToPDF(exportData, 'parceiros', 'Relatório de Parceiros e CRM');
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ title: 'Atenção', description: 'Deseja excluir este parceiro?', confirmText: 'Confirmar', cancelText: 'Cancelar', variant: 'danger' });
    if (!isConfirmed) return;
    deleteMutation.mutate(id);
  };

  const handleViewHistory = (client: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: client.created_at, title: 'Cadastro Inicial', subtitle: 'Ponto de equilíbrio', value: 'OK', status: 'success' },
      { id: '2', date: new Date().toISOString(), title: 'Análise de Crédito', subtitle: 'Limite: ' + (client.limite_credito || 'N/A'), value: 'APROVADO', status: 'success' },
    ]);
  };

  const columns = [
    {
      header: 'Cliente / Identificação',
      accessor: (item: any) => (
        <div className="table-cell-title text-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>{item.nome}</span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px' }}>
            {item.documento || 'Sem Documento'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Contato / E-mail',
      accessor: (item: any) => (
        <div className="table-cell-title text-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="main-text" style={{ fontSize: '13px', fontWeight: 600 }}>{item.telefone || 'Sem telefone'}</span>
          <span className="sub-meta" style={{ fontSize: '11px', textTransform: 'lowercase', color: '#64748b' }}>{item.email || 'Sem e-mail'}</span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Segmento / Categoria',
      accessor: (item: any) => (
        <div className="table-cell-title text-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>{item.segmento || 'Prata'}</span>
          <span className="sub-meta" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
            {item.tipo || 'Parceiro'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Faturamento (LTV)',
      accessor: (item: any) => (
        <div className="table-cell-title text-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span className="main-text" style={{ color: 'hsl(var(--brand))', fontWeight: 800 }}>
            {Number(item.ltv || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="sub-meta" style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
            Última: {item.daysSinceLastSale > 365 ? 'NUNCA' : `${item.daysSinceLastSale.toFixed(0)}d atrás`}
          </span>
        </div>
      ),
      align: 'right' as const
    },
    {
      header: 'Rating / Risco',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span className="status-pill info" style={{ fontSize: '9px', padding: '2px 8px', fontWeight: 900, borderRadius: '99px' }}>
            RATING {item.rating || 'B'}
          </span>
          {item.churnRisk && (
            <span className="status-pill danger" style={{ fontSize: '8px', padding: '2px 6px', fontWeight: 900, borderRadius: '99px' }}>
              RISCO CHURN
            </span>
          )}
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${(item.status || '').toUpperCase() === 'ATIVO' ? 'active' : 'warning'}`}>
            {(item.status || 'Lead').toUpperCase()}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="crm-page animate-slide-up">
      {(!activeFarm && !isGlobalMode) && (
        <div className="no-farm-selected-overlay">
          <div className="glass-card text-center p-12">
            <Building2 size={64} className="mx-auto mb-6 opacity-20" />
            <h2 className="text-2xl font-bold mb-2">Unidade não Selecionada</h2>
            <p className="text-slate-400">Selecione uma fazenda no menu lateral ou ative a Visão Global para gerenciar parceiros.</p>
          </div>
        </div>
      )}
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Vendas', href: '/vendas/dashboard' }, { label: 'Clientes' }]} />
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gestão de clientes, análise de crédito e histórico comercial consolidado em tempo real.</p>
        </div>
        <div className="page-actions">
          <button 
            className={`glass-btn secondary ${selectedSegment !== 'TODOS' ? 'active' : ''}`}
            onClick={() => {
              const segments = ['TODOS', 'Ouro/VIP', 'Prata/Recorrente', 'Bronze/Inativo', 'Novo'];
              const nextIdx = (segments.indexOf(selectedSegment) + 1) % segments.length;
              setSelectedSegment(segments[nextIdx]);
            }}
            style={selectedSegment !== 'TODOS' ? { 
              background: 'hsl(var(--brand) / 0.1)', 
              borderColor: 'hsl(var(--brand))',
              color: 'hsl(var(--brand))' 
            } : {}}
          >
            <Star size={18} fill={selectedSegment !== 'TODOS' ? "currentColor" : "none"} />
            {selectedSegment === 'TODOS' ? 'SEGMENTOS' : selectedSegment.toUpperCase()}
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO CLIENTE
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={Users} color="" 
            periodLabel="Carteira Ativa"
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
            trend={stat.trend as "up" | "down" | undefined}
            sparkline={stat.sparkline}
          
            periodLabel="Carteira Ativa"
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'ATIVO' ? 'active' : ''}`}
            onClick={() => setActiveTab('ATIVO')}
          >
            Clientes Ativos
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'LEAD' ? 'active' : ''}`}
            onClick={() => setActiveTab('LEAD')}
          >
            Leads / Prospectos
          </button>
        </div>
        
        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar por nome, cidade ou tipo de comprador..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
          >
            <ListIcon size={18} />
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Visualização em Cards"
          >
            <LayoutGrid size={18} />
          </button>
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
                const menu = document.getElementById('export-menu-clients');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-clients" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-clients')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-clients')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-clients')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <ClientFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {viewMode === 'list' ? (
          <ModernTable 
            emptyState={
              !searchTerm ? (
                <EmptyState
                  title={activeTab === 'ATIVO' ? "Nenhum cliente homologado" : "Nenhum lead pendente"}
                  description={activeTab === 'ATIVO' ? "Você não possui clientes ativos cadastrados nesta unidade." : "Não há leads ou prospectos com pendências de cadastro no momento."}
                  actionLabel="Novo Cliente"
                  onAction={handleOpenCreate}
                  icon={Users}
                />
              ) : (
                <EmptyState
                  title="Nenhum registro encontrado"
                  description="Sua busca não retornou resultados."
                  icon={Search}
                />
              )
            }
            data={clients.filter(client => {
              const matchesSearch = (client.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (client.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'ATIVO' ? client.status?.toUpperCase() === 'ATIVO' : client.status?.toUpperCase() !== 'ATIVO';
              const matchesFarm = isGlobalMode || client.is_global || (activeFarm && client.fazendas_vinculadas?.includes(activeFarm.id));
              const matchesSegmentTab = selectedSegment === 'TODOS' ? true : client.segmento === selectedSegment;
              
              const matchesStatus = filterValues.status === 'all' || client.status === filterValues.status;
              const matchesRating = filterValues.rating === 'all' || client.rating === filterValues.rating;
              const matchesLtv = filterValues.maxLtv >= 1000000 || ((client.ltv || 0) <= filterValues.maxLtv);
              const matchesChurn = filterValues.onlyChurnRisk ? client.churnRisk : true;
              const matchesSegments = filterValues.segments.length === 0 || filterValues.segments.includes(client.segmento);

              return matchesSearch && matchesTab && matchesFarm && matchesSegmentTab && matchesStatus && matchesRating && matchesLtv && matchesChurn && matchesSegments;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewHistory(item)} title="Dossiê">
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
        ) : (() => {
          const filteredClients = clients.filter(client => {
            const matchesSearch = (client.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (client.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'ATIVO' ? client.status?.toUpperCase() === 'ATIVO' : client.status?.toUpperCase() !== 'ATIVO';
            const matchesFarm = isGlobalMode || client.is_global || (activeFarm && client.fazendas_vinculadas?.includes(activeFarm.id));
            const matchesSegmentTab = selectedSegment === 'TODOS' ? true : client.segmento === selectedSegment;
            const matchesStatus = filterValues.status === 'all' || client.status === filterValues.status;
            const matchesRating = filterValues.rating === 'all' || client.rating === filterValues.rating;
            const matchesLtv = filterValues.maxLtv >= 1000000 || ((client.ltv || 0) <= filterValues.maxLtv);
            const matchesChurn = filterValues.onlyChurnRisk ? client.churnRisk : true;
            const matchesSegments = filterValues.segments.length === 0 || filterValues.segments.includes(client.segmento);
            return matchesSearch && matchesTab && matchesFarm && matchesSegmentTab && matchesStatus && matchesRating && matchesLtv && matchesChurn && matchesSegments;
          });

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="user-cards-grid"
            >
              {filteredClients.length === 0 ? (
                <div 
                  className="user-card-premium"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '20px',
                    background: 'hsl(var(--bg-card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '24px',
                    gap: '6px',
                    minHeight: '180px',
                    height: '100%',
                    boxShadow: 'none'
                  }}
                >
                  <div 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      color: '#10b981', 
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {!searchTerm ? <Users size={22} style={{ color: 'hsl(var(--brand))' }} /> : <Search size={22} />}
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}>
                    {!searchTerm ? (activeTab === 'ATIVO' ? 'Nenhum cliente homologado' : 'Nenhum lead pendente') : 'Nenhum registro encontrado'}
                  </h3>
                  <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: '1.3', maxWidth: '260px' }}>
                    {!searchTerm ? (activeTab === 'ATIVO' ? 'Você não possui clientes ativos cadastrados nesta unidade.' : 'Não há leads ou prospectos com pendências de cadastro no momento.') : 'Sua busca não retornou resultados.'}
                  </p>
                  {!searchTerm && (
                    <button 
                      className="primary-btn" 
                      onClick={handleOpenCreate}
                      style={{ fontSize: '10.5px', padding: '6px 12px', height: '30px', marginTop: '4px', minHeight: 'auto' }}
                    >
                      <Plus size={12} />
                      <span>NOVO CLIENTE</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredClients.map(client => (
                  <motion.div 
                    key={client.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`user-card-premium ${client.status?.toUpperCase() === 'ATIVO' ? 'active' : 'warning-badge'}`}
                  >
                    {/* LEFT — avatar + actions */}
                    <div className="card-left-section">
                      <div className="card-avatar" style={{
                        background: 'hsl(var(--brand) / 0.08)',
                        color: 'hsl(var(--brand))',
                        border: '1.5px solid hsl(var(--brand) / 0.2)',
                        borderRadius: '16px',
                        fontSize: '22px'
                      }}>
                        {client.nome?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="card-bottom-actions">
                        <button className="action-icon-btn info" onClick={() => handleViewHistory(client)} title="Dossiê"><History size={14} /></button>
                        <button className="action-icon-btn edit" onClick={() => handleOpenEdit(client)} title="Editar"><Edit3 size={14} /></button>
                        <button className="action-icon-btn delete" onClick={() => handleDelete(client.id)} title="Excluir"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* RIGHT — content */}
                    <div className="card-main-content">
                      {/* Row 1: Name + status + rating */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
                        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: 'hsl(var(--text-main))', lineHeight: 1.3, wordBreak: 'break-word', flex: '1 1 auto', minWidth: 0 }}>
                          {client.nome}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                          <span style={{
                            fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em',
                            background: client.status?.toUpperCase() === 'ATIVO' ? 'rgba(22,163,74,0.12)' : 'rgba(234,179,8,0.12)',
                            color: client.status?.toUpperCase() === 'ATIVO' ? '#16a34a' : '#ca8a04'
                          }}>{client.status || 'ATIVO'}</span>
                          {client.rating && (
                            <span style={{ fontSize: '9px', fontWeight: 900, padding: '2px 7px', borderRadius: '20px', background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))' }}>
                              {client.rating}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Category badge */}
                      <span style={{ display: 'inline-block', fontSize: '9px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                        {client.tipo || 'Parceiro'} {client.cnpj_cpf ? `• ${client.cnpj_cpf}` : ''}
                      </span>

                      {/* Row 3: LTV metric */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LTV TOTAL</span>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
                          R$ {(client.ltv || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>

                      {/* Churn indicator bar */}
                      <div style={{ height: '3px', borderRadius: '99px', background: 'hsl(var(--border))', marginBottom: '8px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '99px', width: client.churnRisk ? '100%' : '30%', background: client.churnRisk ? '#ef4444' : '#10b981', transition: 'width 0.5s' }} />
                      </div>
                      {client.churnRisk && (
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444', display: 'block', marginBottom: '6px' }}>⚠ Risco de Churn — inativo &gt;90d</span>
                      )}

                      {/* Footer: location + phone */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed hsl(var(--border))', paddingTop: '6px', marginTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                          <MapPin size={11} style={{ color: 'hsl(var(--brand))' }} />
                          <span>{client.cidade ? `${client.cidade}/${client.estado}` : 'Sem endereço'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                          <TrendingUp size={11} style={{ color: '#10b981' }} />
                          <span>Seg: {client.segmento || 'Geral'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <button className="add-client-card-premium" onClick={handleOpenCreate}>
                <Plus size={32} />
                <span>NOVO CLIENTE</span>
              </button>
            </motion.div>
          );
        })()}
      </div>

      <style>{`
        .view-mode-toggle {
          display: flex;
          background: hsl(var(--bg-main));
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
          margin: 0 16px;
          border: 1px solid hsl(var(--border));
        }

        .view-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: 0.2s;
        }

        .view-btn.active {
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .user-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 8px;
        }

        @media (max-width: 1400px) {
          .user-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .user-cards-grid { grid-template-columns: 1fr; }
        }

        .user-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          min-height: 180px;
          height: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-sm);
          position: relative;
          text-align: left;
        }

        .user-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: hsl(var(--border-strong));
          transition: 0.3s;
        }

        .user-card-premium.active::before {
          background: #16a34a;
          box-shadow: 4px 0 15px rgba(22, 163, 74, 0.3);
        }

        .user-card-premium.warning-badge::before {
          background: #f59e0b;
          box-shadow: 4px 0 15px rgba(245, 158, 11, 0.3);
        }

        .user-card-premium:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
          border-color: hsl(var(--brand) / 0.4);
        }

        .card-left-section {
          width: 130px;
          flex-shrink: 0;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
        }

        .card-avatar {
          width: 56px;
          height: 56px;
          background: #0f172a;
          color: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 8px;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
        }

        .card-main-content {
          flex: 1;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .card-header-info h3 {
          font-size: 14px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin-bottom: 2px;
          letter-spacing: -0.02em;
          white-space: normal;
          overflow: visible;
          word-break: break-word;
          line-height: 1.3;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.1);
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
          margin-top: 6px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: hsl(var(--text-muted));
          font-size: 11px;
          font-weight: 600;
        }

        .meta-icon {
          color: #16a34a;
        }

        .card-bottom-actions {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 8px;
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: #0f172a;
          color: white;
          transform: scale(1.1);
        }

        .action-icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }

        .add-client-card-premium {
          border: 2px dashed #e2e8f0;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: transparent;
          cursor: pointer;
          color: #94a3b8;
          transition: 0.2s;
          min-height: 180px;
          height: 100%;
        }

        .add-client-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-client-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

        [data-theme='dark'] .add-client-card-premium {
          background: hsl(var(--bg-main)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }
      `}</style>

      <ClientForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        actionId={formActionId}
        onSubmit={handleSubmit}
        initialData={selectedClient}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê do Parceiro"
        subtitle="Rastreabilidade completa de crédito e interações"
        items={historyItems}
        loading={historyLoading}
      />

    </div>
  );
};
