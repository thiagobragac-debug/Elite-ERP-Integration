import React, { useState, useEffect } from 'react';

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
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  MoreVertical,
  Star,
  TrendingUp,
  History,
  Briefcase,
  Trash2,
  Edit3,
  Globe,
  FileText,
  Filter,
  LayoutGrid,
  List as ListIcon,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { SupplierForm } from '../../components/Forms/SupplierForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useDebounce } from '../../hooks/useDebounce';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { SupplierNetworkMapModal } from '../../components/Modals/SupplierNetworkMapModal';
import { SupplierFilterModal } from './components/SupplierFilterModal';
import { useViewMode } from '../../hooks/useViewMode';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './SupplierManagement.css';
import toast from 'react-hot-toast';

export const SupplierManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'HOMOLOGADO' | 'PENDENTE'>('HOMOLOGADO');
  const [loading, setLoading] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [viewMode, setViewMode] = useViewMode('purchasing-supplier-management', 'grid');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    categories: [] as string[],
    minRating: 0,
    minSpend: 0,
    maxSpend: 1000000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (isReady) {
      fetchSuppliers();
    } else {
      setLoading(false);
    }
  }, [activeFarmId, activeTenantId, isGlobalMode, page, debouncedSearch, filterValues, activeTab]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const fetchPromise = (async () => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('parceiros')
          .select('*', { count: 'exact' })
          .eq('is_supplier', true)
          .order('nome', { ascending: true })
          .range(from, to);
        
        query = query.eq('tenant_id', activeTenantId);

        if (debouncedSearch) {
          query = query.or(`nome.ilike.%${debouncedSearch}%,categoria.ilike.%${debouncedSearch}%`);
        }

        if (activeTab === 'HOMOLOGADO') {
          query = query.eq('status', 'ATIVO');
        } else {
          query = query.neq('status', 'ATIVO');
        }

        if (filterValues.status !== 'all') {
          query = query.eq('status', filterValues.status);
        }

        if (filterValues.categories.length > 0) {
          query = query.in('categoria', filterValues.categories);
        }

        const { data: supplierData, count, error } = await query;
        if (error) throw error;

        const supplierIds = supplierData?.map(s => s.id) || [];
        let purchaseData: any[] = [];
        if (supplierIds.length > 0) {
          const { data: pd } = await supabase
            .from('notas_entrada')
            .select('fornecedor_id, valor_total')
            .in('fornecedor_id', supplierIds);
          purchaseData = pd || [];
        }

        return { supplierData, purchaseData, count };
      })();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { supplierData, purchaseData, count } = result;
      
      if (supplierData) {
        const spendMap: Record<string, number> = {};
        let totalSpend = 0;
        purchaseData?.forEach((n: any) => {
          const fid = n.fornecedor_id;
          spendMap[fid] = (spendMap[fid] || 0) + Number(n.valor_total);
          totalSpend += Number(n.valor_total);
        });

        const processedSuppliers = supplierData.map((s: any) => ({
          ...s,
          totalSpend: spendMap[s.id] || 0,
          rating: spendMap[s.id] ? Math.min(5, 3 + (spendMap[s.id] / 100000)) : 0
        }));

        setSuppliers(processedSuppliers);
        setTotalCount(count || 0);

        setStats([
          { 
            label: 'Fornecedores Ativos', value: count || 0, icon: Building2, color: '#10b981', 
            progress: 100, change: 'Homologados',
            sparkline: buildSparkline(supplierData || [], 'created_at', null)
          },
          { 
            label: 'Volume Procurement', value: totalSpend > 0 ? `R$ ${(totalSpend / 1000).toFixed(1)}k` : '---', 
            icon: TrendingUp, color: '#3b82f6', 
            progress: totalSpend > 0 ? 100 : 0, 
            trend: 'up', change: 'Total Compras',
            sparkline: buildSparkline(supplierData || [], 'created_at', null)
          },
          { 
            label: 'Risco Concentração', 
            value: (() => {
              if (totalSpend <= 0 || processedSuppliers.length === 0) return '---';
              const topSpend = Math.max(...processedSuppliers.map((s: any) => s.totalSpend));
              const pct = (topSpend / totalSpend) * 100;
              return `${pct.toFixed(1)}%`;
            })(),
            icon: AlertCircle, color: '#f59e0b', 
            progress: (() => {
              if (totalSpend <= 0 || processedSuppliers.length === 0) return 0;
              const topSpend = Math.max(...processedSuppliers.map((s: any) => s.totalSpend));
              return Math.min(100, (topSpend / totalSpend) * 100);
            })(),
            change: 'Concentração Lead',
            sparkline: buildSparkline(supplierData || [], 'created_at', null)
          },
          { 
            label: 'Rating Médio Rede', 
            value: (() => {
              const withRating = processedSuppliers.filter((s: any) => s.rating > 0);
              if (withRating.length === 0) return '---';
              const avg = withRating.reduce((a: number, s: any) => a + s.rating, 0) / withRating.length;
              return avg.toFixed(1);
            })(),
            icon: Star, color: '#166534', 
            progress: (() => {
              const withRating = processedSuppliers.filter((s: any) => s.rating > 0);
              if (withRating.length === 0) return 0;
              const avg = withRating.reduce((a: number, s: any) => a + s.rating, 0) / withRating.length;
              return Math.min(100, avg * 20);
            })(),
            change: 'Rating Eficiência',
            sparkline: buildSparkline(supplierData || [], 'created_at', null)
          },
        ]);
      }
    } catch (err) {
      console.error('[SupplierManagement] Error fetching suppliers:', err);
      setSuppliers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: any) => {
    setSelectedSupplier(sup);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeTenantId && !activeFarm && !selectedSupplier) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        nome: formData.nome,
        cnpj_cpf: formData.cnpj,
        contato: formData.contato,
        email: formData.email,
        cep: formData.cep,
        tipo_logradouro: formData.tipo_logradouro,
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        pais: formData.pais,
        status: formData.status
      };

      if (selectedSupplier) {
        const { error } = await supabase.from('parceiros').update({
          ...payload,
          is_supplier: true,
          is_global: formData.is_global,
          fazendas_vinculadas: formData.fazendas_vinculadas
        }).eq('id', selectedSupplier.id);
        if (error) throw error;
        setIsModalOpen(false); 
        fetchSuppliers();
      } else {
        // Verificar se já existe um parceiro com esse CNPJ/CPF (unificação Opção B)
        let cleanCnpj = formData.cnpj?.replace(/\D/g, '');
        if (cleanCnpj && cleanCnpj.length > 0) {
            const { data: existing } = await supabase
              .from('parceiros')
              .select('id, is_supplier, is_customer')
              .eq('cnpj_cpf', formData.cnpj)
              .maybeSingle();

            if (existing) {
                if (existing.is_supplier) {
                    toast.error('❌ Este CPF/CNPJ já está cadastrado como fornecedor!');
                    setIsSubmitting(false);
                    return;
                }
                
                // Já existe, vamos apenas atualizar e "ativar" a flag de fornecedor
                const { error } = await supabase.from('parceiros').update({
                    ...payload,
                    is_supplier: true,
                    tenant_id: activeTenantId || activeFarm?.tenantId,
                    is_global: formData.is_global,
                    fazendas_vinculadas: formData.fazendas_vinculadas
                }).eq('id', existing.id);
                if (error) throw error;
                
                toast.error(`Parceiro unificado! Um cadastro com este CNPJ/CPF já existia (Cliente). Ele agora também é um Fornecedor.`);
                setIsModalOpen(false); 
                fetchSuppliers();
                setIsSubmitting(false);
                return;
            }
        }

        const { error } = await supabase.from('parceiros').insert([{ 
          ...payload, 
          is_supplier: true,
          tenant_id: activeTenantId || activeFarm?.tenantId,
          is_global: formData.is_global,
          fazendas_vinculadas: formData.fazendas_vinculadas
        }]);
        if (error) throw error;
        setIsModalOpen(false); 
        fetchSuppliers();
      }
    } catch (err: any) {
      console.error('[SupplierManagement] Erro ao salvar parceiro:', err);
      toast.error('❌ Erro ao salvar parceiro: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este parceiro?')) return;
    try {
      const { error } = await supabase.from('parceiros').delete().eq('id', id);
      if (error) throw error;
      fetchSuppliers();
    } catch (err: any) {
      toast.error('❌ Erro ao excluir parceiro: ' + err.message);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = suppliers.filter(sup => {
      const matchesSearch = (sup.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (sup.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'HOMOLOGADO' ? sup.status === 'ATIVO' : sup.status !== 'ATIVO';
      const matchesFarm = isGlobalMode || sup.is_global || (activeFarm && sup.fazendas_vinculadas?.includes(activeFarm.id));
      
      const matchesStatus = filterValues.status === 'all' || sup.status === filterValues.status;
      const matchesRating = (sup.rating || 0) >= filterValues.minRating;
      const matchesSpend = (sup.totalSpend || 0) <= filterValues.maxSpend;
      const matchesCategories = filterValues.categories.length === 0 || filterValues.categories.includes(sup.categoria);

      return matchesSearch && matchesTab && matchesFarm && matchesStatus && matchesRating && matchesSpend && matchesCategories;
    });

    const exportData = filteredData.map(item => ({
      Nome: item.nome,
      Documento: item.cnpj_cpf || '-',
      Categoria: item.categoria,
      Email: item.email || '-',
      Telefone: item.telefone || '-',
      Cidade: item.cidade || '-',
      Estado: item.estado || '-',
      Gasto_Total: item.totalSpend || 0,
      Rating: item.rating?.toFixed(1) || '0.0',
      Status: item.status
    }));

    if (format === 'csv') exportToCSV(exportData, 'fornecedores');
    else if (format === 'excel') exportToExcel(exportData, 'fornecedores');
    else if (format === 'pdf') exportToPDF(exportData, 'fornecedores', 'Relatório de Parceiroes Homologados');
  };

  const handleViewHistory = async (sup: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    const { data } = await supabase
      .from('notas_entrada')
      .select('*').limit(500)
      .eq('fornecedor_id', sup.id)
      .eq('tenant_id', activeTenantId || activeFarm?.tenantId)
      .order('data_entrada', { ascending: false });
    if (data && data.length > 0) {
      setHistoryItems(data.map(n => ({ id: n.id, date: n.data_entrada, title: 'Nota Fiscal: ' + n.numero_nota, subtitle: n.observacoes || 'Compra de Insumos', value: Number(n.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: 'success' })));
    } else {
      setHistoryItems([{ id: '1', date: sup.created_at, title: 'Cadastro Inicial', subtitle: 'Parceiro homologado', value: 'OK', status: 'info' }]);
    }
    setHistoryLoading(false);
  };

  const columns = [
    {
      header: 'Fornecedor / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>{item.nome}</span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'CNPJ / CPF',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.cnpj_cpf || 'Sem documento'}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            Documento
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Categoria & Segmento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.categoria}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            Insumos
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Rating & Performance',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '12px', fontWeight: 800 }}>
            <Star size={14} fill="currentColor" />
            <span>{item.rating?.toFixed(1) || '0.0'}</span>
          </div>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            Eficiência Rede
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Volume Compras (Gasto)',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
            R$ {Number(item.totalSpend || 0).toLocaleString('pt-BR')}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Contato & Telefone',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Phone size={12} color="#94a3b8" />
            {item.telefone || 'N/A'}
          </span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            {item.email || 'Sem E-mail'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="suppliers-page animate-slide-up">
      {(!activeFarm && !isGlobalMode) && (
        <div className="no-farm-selected-overlay">
          <div className="glass-card text-center p-12">
            <Building2 size={64} className="mx-auto mb-6 opacity-20" />
            <h2 className="text-2xl font-bold mb-2">Unidade não Selecionada</h2>
            <p className="text-slate-400">Selecione uma fazenda no menu lateral ou ative a Visão Global para gerenciar fornecedores.</p>
          </div>
        </div>
      )}
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Building2 size={14} fill="currentColor" />
            <span>TAUZE PROCUREMENT v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Fornecedores</h1>
          <p className="page-subtitle">Homologação de fornecedores, análise de performance e histórico transacional de compras em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsMapOpen(true)}>
            <Globe size={18} />
            MAPA DE REDE
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO FORNECEDOR
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={Building2} color=""  periodLabel="Mês Atual" />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            {...stat}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'HOMOLOGADO' ? 'active' : ''}`}
            onClick={() => setActiveTab('HOMOLOGADO')}
          >
            Rede Homologada
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'PENDENTE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDENTE')}
          >
            Pendentes
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Pesquisar por nome, categoria ou contato..." 
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
                const menu = document.getElementById('export-menu-suppliers');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-suppliers" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-suppliers')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-suppliers')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-suppliers')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <SupplierFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {viewMode === 'list' ? (
          <ModernTable 
            data={suppliers}
            columns={columns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            emptyState={
              !searchTerm ? (
                <EmptyState
                  title={activeTab === 'HOMOLOGADO' ? "Nenhum fornecedor homologado" : "Nenhum fornecedor pendente"}
                  description={activeTab === 'HOMOLOGADO' ? "Você não possui fornecedores ativos cadastrados nesta unidade." : "Não há fornecedores com pendências de cadastro no momento."}
                  actionLabel="Novo Fornecedor"
                  onAction={handleOpenCreate}
                  icon={Building2}
                />
              ) : (
                <EmptyState
                  title="Nenhum registro encontrado"
                  description="Sua busca não retornou resultados."
                  icon={Search}
                />
              )
            }
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
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
            {suppliers.length === 0 ? (
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
                  {!searchTerm ? <Building2 size={22} style={{ color: 'hsl(var(--brand))' }} /> : <Search size={22} />}
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}>
                  {!searchTerm ? (activeTab === 'HOMOLOGADO' ? 'Nenhum fornecedor homologado' : 'Nenhum fornecedor pendente') : 'Nenhum registro encontrado'}
                </h3>
                <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: '1.3', maxWidth: '260px' }}>
                  {!searchTerm ? (activeTab === 'HOMOLOGADO' ? 'Você não possui fornecedores ativos cadastrados nesta unidade.' : 'Não há fornecedores com pendências de cadastro no momento.') : 'Sua busca não retornou resultados.'}
                </p>
                {!searchTerm && (
                  <button 
                    className="primary-btn" 
                    onClick={handleOpenCreate}
                    style={{ fontSize: '10.5px', padding: '6px 12px', height: '30px', marginTop: '4px', minHeight: 'auto' }}
                  >
                    <Plus size={12} />
                    <span>NOVO FORNECEDOR</span>
                  </button>
                )}
              </div>
            ) : (
              suppliers.map(sup => (
                <motion.div 
                  key={sup.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`user-card-premium ${sup.status === 'ATIVO' ? 'active' : ''}`}
                >
                  {/* LEFT — avatar + actions */}
                  <div className="card-left-section">
                    <div className="card-avatar" style={{
                      background: 'hsl(142 71% 45% / 0.08)',
                      color: '#16a34a',
                      border: '1.5px solid hsl(142 71% 45% / 0.2)',
                      borderRadius: '16px',
                      fontSize: '22px'
                    }}>
                      {sup.nome?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn info" onClick={() => handleViewHistory(sup)} title="Dossiê"><History size={14} /></button>
                      <button className="action-icon-btn edit" onClick={() => handleOpenEdit(sup)} title="Editar"><Edit3 size={14} /></button>
                      <button className="action-icon-btn delete" onClick={() => handleDelete(sup.id)} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* RIGHT — content */}
                  <div className="card-main-content">
                    {/* Row 1: Name + status badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
                      <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: 'hsl(var(--text-main))', lineHeight: 1.3, wordBreak: 'break-word', flex: '1 1 auto', minWidth: 0 }}>
                        {sup.nome}
                      </h3>
                      <span style={{
                        fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase' as const, letterSpacing: '0.05em', flexShrink: 0,
                        background: sup.status === 'ATIVO' ? 'rgba(22,163,74,0.12)' : 'rgba(234,179,8,0.12)',
                        color: sup.status === 'ATIVO' ? '#16a34a' : '#ca8a04'
                      }}>{sup.status || 'ATIVO'}</span>
                    </div>

                    {/* Row 2: Category + CNPJ */}
                    <span style={{ display: 'inline-block', fontSize: '9px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '10px' }}>
                      {sup.categoria || 'Geral'}{sup.cnpj_cpf ? ` • ${sup.cnpj_cpf}` : ''}
                    </span>

                    {/* Row 3: Spend metric */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>VOLUME COMPRAS</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#059669' }}>
                        R$ {Number(sup.totalSpend || 0).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {/* Spend bar */}
                    <div style={{ height: '3px', borderRadius: '99px', background: 'hsl(var(--border))', marginBottom: '8px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '99px', width: `${Math.min(100, (sup.totalSpend || 0) / 1000)}%`, background: '#10b981', transition: 'width 0.5s' }} />
                    </div>

                    {/* Footer: city + phone */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed hsl(var(--border))', paddingTop: '6px', marginTop: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                        <MapPin size={11} style={{ color: 'hsl(var(--brand))' }} />
                        <span>{sup.cidade ? `${sup.cidade}/${sup.estado}` : 'Sem endereço'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                        <Phone size={11} style={{ color: 'hsl(var(--brand))' }} />
                        <span>{sup.telefone || 'Sem telefone'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <button className="add-supplier-card-premium" onClick={handleOpenCreate}>
              <Plus size={32} />
              <span>NOVO FORNECEDOR</span>
            </button>
          </motion.div>
        )}
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
          font-size: 16px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin-bottom: 2px;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta-icon {
          color: #16a34a;
          flex-shrink: 0;
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

        .add-supplier-card-premium {
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

        .add-supplier-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-supplier-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

        [data-theme='dark'] .add-supplier-card-premium {
          background: hsl(var(--bg-main)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }
      `}</style>

      <SupplierForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedSupplier}
        loading={isSubmitting}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê do Parceiro"
        subtitle="Rastreabilidade completa de compras e atividades"
        items={historyItems}
        loading={historyLoading}
      />

      <SupplierNetworkMapModal 
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        suppliers={suppliers}
      />
    </div>
  );
};
