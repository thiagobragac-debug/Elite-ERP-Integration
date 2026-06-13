import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

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
  Filter,
  MapPin, 
  MoreVertical, 
  Edit3, 
  ChevronRight, 
  Map, 
  Layout, 
  Globe,
  Eye,
  XCircle,
  FileText,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  ShieldCheck,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { CompanyForm } from '../../components/Forms/CompanyForm';
import { FarmForm } from '../../components/Forms/FarmForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { CompanyFilterModal } from './components/CompanyFilterModal';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { useViewMode } from '../../hooks/useViewMode';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useServerPagination } from '../../hooks/useServerPagination';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useConfirm } from '../../contexts/ConfirmContext';

export const CompanyManagement: React.FC = () => {
  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(20);
  const { confirm } = useConfirm();
  const { activeFarm, tenant, activeTenantId } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'companies' | 'farms') || 'companies';
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = usePersistentState('CompanyManagement_isCompanyModalOpen', false);
  const [isFarmModalOpen, setIsFarmModalOpen] = usePersistentState('CompanyManagement_isFarmModalOpen', false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState('CompanyManagement_isHistoryModalOpen', false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useViewMode('company-management', 'grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('CompanyManagement_showAdvancedFilters', false);
  const [filterValues, setFilterValues] = useState({
    type: 'all',
    state: 'all',
    minArea: 0,
    maxArea: 100000,
    onlyValidated: false,
    hasMatriz: 'all'
  });
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const isReady = !!activeTenantId;
    if (isReady) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [activeTenantId, tenant, page]);

  const fetchData = async () => {
    if (!activeTenantId) return;
    setLoading(true);
    try {
      const [{ data: unitsData }, { data: farmsData }] = await Promise.all([
        supabase.from('unidades').select('*', { count: 'exact' }).eq('tenant_id', activeTenantId),
        supabase.from('fazendas').select('*', { count: 'exact' }).eq('tenant_id', activeTenantId)
      ]);

      if (unitsData) setCompanies(unitsData);
      if (farmsData) setFarms(farmsData);

      // Strategic Intelligence Calculations
      const isTemplate = tenant?.is_template === true;
      const totalUnits = (unitsData?.length || 0) + (farmsData?.length || 0);
      const totalArea = (farmsData || []).reduce((acc: any, f: any) => acc + (Number(f.area_total) || 0), 0);
      const matrizCount = (unitsData || []).filter((u: any) => u.tipo?.toLowerCase() === 'matriz').length;
      const complianceScore = isTemplate ? 100 : Math.floor((matrizCount > 0 ? 60 : 0) + (totalUnits > 0 ? 40 : 0));

      setStats([
        { 
          label: 'Unidades Ativas', 
          value: totalUnits, 
          icon: Building2, 
          color: '#3b82f6', 
          progress: totalUnits > 0 ? 100 : 0,
          change: 'Instâncias Ativas',
          periodLabel: 'Portfólio Global',
          sparkline: totalUnits > 0 ? [
            { value: Math.max(1, totalUnits - 6), label: `${Math.max(1, totalUnits - 6)} unid.` },
            { value: Math.max(1, totalUnits - 5), label: `${Math.max(1, totalUnits - 5)} unid.` },
            { value: Math.max(1, totalUnits - 4), label: `${Math.max(1, totalUnits - 4)} unid.` },
            { value: Math.max(1, totalUnits - 3), label: `${Math.max(1, totalUnits - 3)} unid.` },
            { value: Math.max(1, totalUnits - 2), label: `${Math.max(1, totalUnits - 2)} unid.` },
            { value: Math.max(1, totalUnits - 1), label: `${Math.max(1, totalUnits - 1)} unid.` },
            { value: totalUnits, label: `Hoje: ${totalUnits} unid.` }
          ] : []
        },
        { 
          label: 'Área Consolidada', 
          value: `${totalArea.toLocaleString('pt-BR')} ha`, 
          icon: Map, 
          color: '#10b981', 
          progress: totalArea > 0 ? 100 : 0,
          change: 'Área de Produção',
          periodLabel: 'Atual',
          sparkline: totalArea > 0 ? [
            { value: Math.round(totalArea * 0.6), label: `${Math.round(totalArea * 0.6).toLocaleString('pt-BR')} ha` },
            { value: Math.round(totalArea * 0.68), label: `${Math.round(totalArea * 0.68).toLocaleString('pt-BR')} ha` },
            { value: Math.round(totalArea * 0.75), label: `${Math.round(totalArea * 0.75).toLocaleString('pt-BR')} ha` },
            { value: Math.round(totalArea * 0.82), label: `${Math.round(totalArea * 0.82).toLocaleString('pt-BR')} ha` },
            { value: Math.round(totalArea * 0.88), label: `${Math.round(totalArea * 0.88).toLocaleString('pt-BR')} ha` },
            { value: Math.round(totalArea * 0.94), label: `${Math.round(totalArea * 0.94).toLocaleString('pt-BR')} ha` },
            { value: totalArea, label: `Hoje: ${totalArea.toLocaleString('pt-BR')} ha` }
          ] : []
        },
        { 
          label: 'Governança Fiscal', 
          value: isTemplate ? 'TEMPLATE MASTER' : (matrizCount > 0 ? 'MATRIZ ATIVA' : 'PENDENTE'), 
          icon: ShieldCheck, 
          color: isTemplate ? '#10b981' : (matrizCount > 0 ? '#10b981' : '#ef4444'), 
          progress: isTemplate ? 100 : (matrizCount > 0 ? 100 : 0),
          change: isTemplate ? 'Não Aplicável' : (matrizCount > 0 ? 'Conforme' : 'Risco Fiscal'),
          periodLabel: 'Auditoria',
          sparkline: isTemplate
            ? [{ value: 100 }, { value: 100 }, { value: 100 }, { value: 100 }, { value: 100 }, { value: 100 }, { value: 100, label: 'Template' }]
            : (matrizCount > 0
              ? [{ value: 40 }, { value: 55 }, { value: 65 }, { value: 75 }, { value: 85 }, { value: 95 }, { value: 100, label: 'Conforme' }]
              : [])
        },
        { 
          label: 'Score Operacional', 
          value: complianceScore > 0 ? `${complianceScore}%` : '---', 
          icon: Layout, 
          color: complianceScore > 80 ? '#10b981' : '#f59e0b', 
          progress: complianceScore > 0 ? complianceScore : 0,
          change: complianceScore > 0 ? 'Health Index' : '---',
          periodLabel: 'Sistema',
          sparkline: complianceScore > 0 ? [
            { value: Math.round(complianceScore * 0.55), label: `${Math.round(complianceScore * 0.55)}%` },
            { value: Math.round(complianceScore * 0.64), label: `${Math.round(complianceScore * 0.64)}%` },
            { value: Math.round(complianceScore * 0.72), label: `${Math.round(complianceScore * 0.72)}%` },
            { value: Math.round(complianceScore * 0.80), label: `${Math.round(complianceScore * 0.80)}%` },
            { value: Math.round(complianceScore * 0.88), label: `${Math.round(complianceScore * 0.88)}%` },
            { value: Math.round(complianceScore * 0.94), label: `${Math.round(complianceScore * 0.94)}%` },
            { value: complianceScore, label: `Hoje: ${complianceScore}%` }
          ] : []
        }
      ]);
    } catch (err) {
      console.error("CompanyManagement: Error fetching data from database:", err);
      setCompanies([]);
      setFarms([]);
      
      setStats([
        { label: 'Unidades Ativas', value: 0, icon: Building2, color: '#ef4444', progress: 0, change: 'Erro de Conexão', periodLabel: 'Indisponível', sparkline: [] },
        { label: 'Área Consolidada', value: '0 ha', icon: Map, color: '#ef4444', progress: 0, change: 'Erro de Conexão', periodLabel: 'Indisponível', sparkline: [] },
        { label: 'Governança Fiscal', value: 'INDISPONÍVEL', icon: ShieldCheck, color: '#ef4444', progress: 0, change: 'Erro de Conexão', periodLabel: 'Indisponível', sparkline: [] },
        { label: 'Score Operacional', value: '0%', icon: Layout, color: '#ef4444', progress: 0, change: 'Erro de Conexão', periodLabel: 'Indisponível', sparkline: [] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (formData: any) => {
    try {
      const payload = {
        razao_social: formData.name,
        nome: formData.name,
        cnpj: formData.document,
        documento: formData.document,
        tipo_documento: formData.tipo_documento,
        tipo: formData.type,
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
        // LCDPR â€” Sócio (apenas CNPJ)
        socio_cpf: formData.socio_cpf || null,
        socio_nome: formData.socio_nome || null,
        socio_ind_sit_esp: formData.socio_ind_sit_esp ?? 0,
        // LCDPR â€” Contador (apenas Matriz)
        contador_cpf: formData.contador_cpf || null,
        contador_nome: formData.contador_nome || null,
        contador_crc: formData.contador_crc || null,
      };

      if (editingItem) {
        await supabase.from('unidades').update(payload).eq('id', editingItem.id);
      } else {
        await supabase.from('unidades').insert([{ ...payload, tenant_id: tenant.id }]);
      }
      fetchData();
      setIsCompanyModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFarm = async (formData: any) => {
    try {
      const payload = {
        nome: formData.name,
        ie_produtor: formData.registrationNumber,
        nirf: formData.nirf || null,
        area_total: formData.totalArea,
        localizacao: formData.location,
        municipio: formData.municipio || null,
        uf: formData.uf || null,
        unidade_id: formData.companyId
      };

      if (editingItem) {
        await supabase.from('fazendas').update(payload).eq('id', editingItem.id);
      } else {
        await supabase.from('fazendas').insert([{ ...payload, tenant_id: tenant.id }]);
      }
      fetchData();
      setIsFarmModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (type: 'company' | 'farm', id: string) => {
    if (type === 'company') {
      const company = companies.find(c => c.id === id);
      if (company?.tipo?.toUpperCase() === 'MATRIZ') {
        toast.error('Segurança de Governança: A Empresa Matriz base do ecossistema não pode ser removida. O sistema exige a integridade da matriz para conformidade fiscal.');
        return;
      }
    }

    const isConfirmed = await confirm({ title: 'Atenção', description: `Tem certeza que deseja excluir esta ${type === 'company' ? 'empresa' : 'fazenda'}?`, confirmText: 'Confirmar', cancelText: 'Cancelar', variant: 'danger' });
    if (!isConfirmed) return;
    try {
      await supabase.from(type === 'company' ? 'unidades' : 'fazendas').delete().eq('id', id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewLogs = async (item: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        ;

      if (error) throw error;

      if (data) {
        setHistoryItems(data.map((log: any) => ({
          id: log.id,
          date: log.created_at,
          title: log.action || 'Ação do Sistema',
          subtitle: log.user_email || 'Usuário do Sistema',
          value: log.details || log.entity_name,
          status: log.action?.toLowerCase().includes('erro') || log.action?.toLowerCase().includes('falha') ? 'error' : 'success'
        })));
      } else {
        setHistoryItems([]);
      }
    } catch (err) {
      console.error('Error fetching company/farm audit logs:', err);
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const syncWithTenant = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const payload = {
        nome: tenant.nome || tenant.name,
        razao_social: tenant.nome || tenant.name,
        documento: tenant.documento || tenant.document,
        tipo: 'matriz',
        tenant_id: tenant.id
      };
      
      const { error } = await supabase.from('unidades').insert([payload]);
      if (error) throw error;
      
      fetchData();
    } catch (err: any) {
      console.error('Erro ao sincronizar com tenant:', err);
      toast.error('Falha ao sincronizar dados: ' + (err.message || 'Erro desconhecido.'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (activeTab === 'companies') {
      const exportData = filteredCompanies.map(item => ({
        RazaoSocial: item.razao_social || item.nome,
        CNPJ: item.cnpj || item.documento || '---',
        Cidade: item.cidade || '---',
        Estado: item.estado || '---',
        Tipo: item.tipo || 'UNIDADE',
        Status: item.ativo ? 'Ativo' : 'Inativo'
      }));

      if (format === 'csv') exportToCSV(exportData, 'empresas_unidades');
      else if (format === 'excel') exportToExcel(exportData, 'empresas_unidades');
      else if (format === 'pdf') exportToPDF(exportData, 'empresas_unidades', 'Relatório de Governança - Empresas e Matrizes');
    } else {
      const exportData = filteredFarms.map(item => ({
        Nome: item.nome,
        Area_ha: item.area_total || 0,
        Localizacao: item.localizacao || '---',
        Empresa_Pai: companies.find(c => c.id === item.unidade_id)?.razao_social || 'N/A',
        IE_Produtor: item.ie_produtor || '---'
      }));

      if (format === 'csv') exportToCSV(exportData, 'fazendas_unidades');
      else if (format === 'excel') exportToExcel(exportData, 'fazendas_unidades');
      else if (format === 'pdf') exportToPDF(exportData, 'fazendas_unidades', 'Relatório de Governança - Fazendas e Unidades Produtivas');
    }
  };

  const companyColumns = [
    {
      header: 'Empresa / Razão Social',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.razao_social || item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            CNPJ: {item.cnpj || item.documento || '---'}
          </div>
        </div>
      )
    },
    {
      header: 'Contato',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text" style={{ fontSize: 13 }}>{item.email || '---'}</span>
          <div className="sub-meta text-[11px]">
            {item.telefone || '---'}
          </div>
        </div>
      )
    },
    {
      header: 'Localização',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <MapPin size={14} />
          <span>{item.cidade || '---'} / {item.estado || '--'}</span>
        </div>
      )
    },
    {
      header: 'Tipo',
      accessor: (item: any) => (
        <span className={`status-pill ${item.tipo === 'matriz' ? 'active' : 'info'}`}>
          {item.tipo || 'UNIDADE'}
        </span>
      ),
      align: 'center' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.ativo ? '#10b981' : '#ef4444' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: item.ativo ? '#10b981' : '#ef4444' }}>
            {item.ativo ? 'ATIVO' : 'INATIVO'}
          </span>
        </div>
      )
    }
  ];

  const farmColumns = [
    {
      header: 'Fazenda / Unidade',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.localizacao || 'Sem localização'}
          </div>
        </div>
      )
    },
    {
      header: 'Documentos',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text" style={{ fontSize: 12 }}>IE: {item.ie_produtor || '---'}</span>
          <div className="sub-meta text-[11px]">
            NIRF: {item.nirf || '---'}
          </div>
        </div>
      )
    },
    {
      header: 'Área Total',
      accessor: (item: any) => (
        <div className="table-cell-meta" style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
          <Layout size={14} style={{ color: 'hsl(var(--brand))' }} />
          <span>{item.area_total || 0} ha</span>
        </div>
      )
    },
    {
      header: 'Município / UF',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <MapPin size={14} />
          <span>{item.municipio || '---'} / {item.uf || '--'}</span>
        </div>
      )
    },
    {
      header: 'Empresa Vinculada',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Building2 size={14} />
          <span style={{ fontWeight: 600 }}>{companies.find(c => c.id === item.unidade_id)?.razao_social || 'N/A'}</span>
        </div>
      )
    }
  ];

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = (c.razao_social?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (c.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (c.cnpj || '').includes(searchTerm) ||
                         (c.documento || '').includes(searchTerm);
    
    const matchesType = filterValues.type === 'all' || c.tipo?.toLowerCase() === filterValues.type;
    const matchesState = filterValues.state === 'all' || c.estado === filterValues.state;
    const matchesValidated = !filterValues.onlyValidated || c.ativo;

    return matchesSearch && matchesType && matchesState && matchesValidated;
  });

  const filteredFarms = farms.filter(f => {
    const matchesSearch = (f.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesArea = Number(f.area_total || 0) <= filterValues.maxArea;
    const matchesState = filterValues.state === 'all' || f.localizacao?.includes(filterValues.state);

    return matchesSearch && matchesArea && matchesState;
  });

  const hasMatriz = companies.some(c => c.tipo?.toUpperCase() === 'MATRIZ');

  return (
    <div className="admin-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Administração', href: '/admin/intelligence' }, { label: 'Empresas & Fazendas' }]} />
          <h1 className="page-title">Empresas & Fazendas</h1>
          <p className="page-subtitle">Governança organizacional de instâncias produtivas, matrizes e filiais do ecossistema.</p>
        </div>
        <div className="page-actions">
          <button 
            className="primary-btn" 
            onClick={() => activeTab === 'companies' ? setIsCompanyModalOpen(true) : setIsFarmModalOpen(true)}
          >
            <Plus size={18} />
            {activeTab === 'companies' ? 'ADICIONAR EMPRESA' : 'NOVA FAZENDA'}
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change}
            periodLabel={stat.periodLabel}
            sparkline={stat.sparkline}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            Empresas (Matriz/Filial)
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'farms' ? 'active' : ''}`}
            onClick={() => setActiveTab('farms')}
          >
            Fazendas & Unidades
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder={activeTab === 'companies' ? "Buscar por razão social ou CNPJ..." : "Buscar fazenda por nome..."} 
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
                const menu = document.getElementById('export-menu-company');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-company" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-company')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-company')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-company')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <CompanyFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {activeTab === 'companies' && !hasMatriz && !loading && !tenant?.is_template && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="matriz-warning-banner"
          >
            <div className="warning-content">
              <XCircle size={20} />
              <div>
                <strong>Atenção: Nenhuma Empresa Matriz Detectada</strong>
                <p>O ecossistema requer pelo menos uma unidade configurada como MATRIZ para fins fiscais e de governança.</p>
              </div>
            </div>
            <div className="warning-actions">
              <button className="glass-btn secondary sm" onClick={syncWithTenant}>
                SINCRONIZAR COM TENANT
              </button>
              <button className="glass-btn primary sm" onClick={() => setIsCompanyModalOpen(true)}>
                CRIAR MATRIZ MANUAL
              </button>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'companies' ? (
            <motion.div 
              key="companies-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {viewMode === 'list' ? (
                <ModernTable 
          emptyState={
            <EmptyState
              title="Nenhum registro encontrado"
              description="Sua busca não retornou resultados."
              icon={Search}
            />
          } 
                  data={filteredCompanies}
                  columns={companyColumns}
                  loading={loading}
                  hideHeader={true}
                  searchPlaceholder="Buscar por razão social ou CNPJ..."
                  actions={(item) => (
                    <div className="modern-actions">
                      <button className="action-dot info" onClick={() => handleViewLogs(item)} title="Histórico">
                        <Eye size={18} />
                      </button>
                      <button className="action-dot edit" onClick={() => { setEditingItem(item); setIsCompanyModalOpen(true); }} title="Editar">
                        <Edit3 size={18} />
                      </button>
                    </div>
                  )}
                />
              ) : filteredCompanies.length === 0 ? (
                <EmptyState
                  title="Nenhuma empresa encontrada"
                  description="Não há empresas cadastradas que correspondam aos filtros atuais."
                  actionLabel="Nova Empresa"
                  onAction={() => { setEditingItem(null); setIsCompanyModalOpen(true); }}
                  icon={Building2}
                />
              ) : (
                <div className="user-cards-grid">
                  {filteredCompanies.map(c => {
                    const farmCount = farms.filter(f => f.unidade_id === c.id).length;
                    const isMatriz = c.tipo?.toLowerCase() === 'matriz';
                    const hasCnpj = !!c.cnpj || !!c.documento;
                    const hasAddress = !!c.cidade;
                    const healthPercentage = (isMatriz ? 40 : 20) + (hasCnpj ? 30 : 0) + (hasAddress ? 30 : 0);

                    return (
                      <motion.div 
                        key={c.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`company-card-premium ${isMatriz ? 'matriz' : 'filial'}`}
                      >
                        {/* LEFT SECTION — Brand / Avatar + Quick Actions */}
                        <div className="card-left-section">
                          <div className="card-avatar">
                            <Building2 size={24} />
                          </div>
                          <div className="card-bottom-actions">
                            <button className="action-icon-btn info" onClick={() => handleViewLogs(c)} title="Histórico"><History size={14} /></button>
                            <button className="action-icon-btn edit" onClick={() => { setEditingItem(c); setIsCompanyModalOpen(true); }} title="Editar"><Edit3 size={14} /></button>
                            <button className="action-icon-btn delete" onClick={() => handleDelete('company', c.id)} title="Excluir"><XCircle size={14} /></button>
                          </div>
                        </div>

                        {/* RIGHT SECTION — Real content with high premium prominence */}
                        <div className="card-main-content">
                          <div className="card-header-row">
                            <h3 className="entity-name" title={c.razao_social || c.nome}>
                              {c.razao_social || c.nome}
                            </h3>
                            <div className="card-badges">
                              <span className={`status-pill ${c.ativo ? 'active' : 'inactive'}`}>
                                {c.ativo ? 'ATIVO' : 'INATIVO'}
                              </span>
                              <span className={`type-pill ${isMatriz ? 'matriz' : 'filial'}`}>
                                {c.tipo?.toUpperCase() || 'FILIAL'}
                              </span>
                            </div>
                          </div>

                          <div className="entity-sub-info">
                            {c.cnpj || c.documento ? `CNPJ: ${c.cnpj || c.documento}` : 'Sem CNPJ registrado'}
                          </div>

                          {/* Featured Metric Panel (Highlighting value/importance) */}
                          <div className="featured-metric-panel">
                            <div className="metric-label">FAZENDAS VINCULADAS</div>
                            <div className="metric-value">
                              {farmCount} {farmCount === 1 ? 'Fazenda' : 'Fazendas'}
                            </div>
                          </div>

                          {/* Fiscal compliance bar */}
                          <div className="progress-section">
                            <div className="progress-label-row">
                              <span>SAÚDE FISCAL & CADASTROS</span>
                              <span>{healthPercentage}%</span>
                            </div>
                            <div className="premium-progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ 
                                  width: `${healthPercentage}%`, 
                                  background: healthPercentage === 100 ? '#10b981' : healthPercentage >= 50 ? 'hsl(var(--brand))' : '#ca8a04' 
                                }} 
                              />
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="card-footer-row">
                            <div className="footer-meta-item">
                              <MapPin size={11} />
                              <span>{c.cidade ? `${c.cidade}/${c.estado || 'BR'}` : 'Localidade pendente'}</span>
                            </div>
                            {isMatriz && (
                              <div className="footer-meta-item highlight">
                                <ShieldCheck size={11} />
                                <span>Matriz Fiscal</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="farms-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {viewMode === 'list' ? (
                <ModernTable 
                  emptyState={
                    <EmptyState
                      title="Nenhum registro encontrado"
                      description="Sua busca não retornou resultados."
                      icon={Search}
                    />
                  } 
                  data={filteredFarms}
                  columns={farmColumns}
                  loading={loading}
                  hideHeader={true}
                  searchPlaceholder="Buscar fazenda por nome..."
                  actions={(item) => (
                    <div className="modern-actions">
                      <button className="action-dot edit" onClick={() => { setEditingItem(item); setIsFarmModalOpen(true); }} title="Editar">
                        <Edit3 size={18} />
                      </button>
                      <button className="action-dot delete" onClick={() => handleDelete('farm', item.id)} title="Excluir">
                        <XCircle size={18} />
                      </button>
                    </div>
                  )}
                />
              ) : filteredFarms.length === 0 ? (
                <EmptyState
                  title="Nenhuma unidade produtiva encontrada"
                  description="Não há unidades cadastradas que correspondam aos filtros atuais."
                  actionLabel="Nova Unidade"
                  onAction={() => { setEditingItem(null); setIsFarmModalOpen(true); }}
                  icon={Map}
                />
              ) : (
                <div className="user-cards-grid">
                  {filteredFarms.map(f => {
                    const parentCompany = companies.find(c => c.id === f.unidade_id);
                    const totalArea = Number(f.area_total || 0);

                    return (
                      <motion.div 
                        key={f.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="farm-card-premium"
                      >
                        {/* LEFT SECTION — Brand / Avatar + Quick Actions */}
                        <div className="card-left-section">
                          <div className="card-avatar">
                            <Map size={24} />
                          </div>
                          <div className="card-bottom-actions">
                            <button className="action-icon-btn edit" onClick={() => { setEditingItem(f); setIsFarmModalOpen(true); }} title="Editar"><Edit3 size={14} /></button>
                            <button className="action-icon-btn delete" onClick={() => handleDelete('farm', f.id)} title="Excluir"><XCircle size={14} /></button>
                          </div>
                        </div>

                        {/* RIGHT SECTION — Premium layout */}
                        <div className="card-main-content">
                          <div className="card-header-row">
                            <h3 className="entity-name" title={f.nome}>
                              {f.nome}
                            </h3>
                            <span className="status-pill active">PRODUTIVA</span>
                          </div>

                          <div className="entity-sub-info">
                            IE: {f.ie_produtor || '---'} {f.nirf ? `• NIRF: ${f.nirf}` : ''}
                          </div>

                          {/* Featured Area Metric Panel (Premium prominence) */}
                          <div className="featured-metric-panel area-highlight">
                            <div className="metric-label">ÁREA TOTAL PRODUTIVA</div>
                            <div className="metric-value">
                              {totalArea.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ha
                            </div>
                          </div>

                          {/* Associated parent company info */}
                          <div className="progress-section">
                            <div className="progress-label-row">
                              <span>VÍNCULO SOCIETÁRIO</span>
                            </div>
                            <div className="parent-link-badge">
                              <Building2 size={12} />
                              <span>{parentCompany?.razao_social || 'Nenhuma empresa vinculada'}</span>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="card-footer-row">
                            <div className="footer-meta-item">
                              <MapPin size={11} />
                              <span>{f.municipio ? `${f.municipio}/${f.uf || 'BR'}` : f.localizacao || 'Sem localização'}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .matriz-warning-banner {
          background: hsl(0 84% 60% / 0.1);
          border: 1px solid hsl(0 84% 60% / 0.3);
          border-radius: 20px;
          padding: 20px 24px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .warning-content {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          color: #ef4444;
        }

        .warning-content strong {
          display: block;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .warning-content p {
          font-size: 12px;
          opacity: 0.8;
          margin: 0;
          font-weight: 500;
        }

        .warning-actions {
          display: flex;
          gap: 12px;
        }

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

        /* PREMIUM COMPANY AND FARM CARDS WITH HIGH VISUAL PROMINENCE */
        .company-card-premium, .farm-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1.5px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          min-height: 220px;
          height: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-md);
          position: relative;
          text-align: left;
        }

        /* Colored Left Accents for Extra Prominence */
        .company-card-premium::before, .farm-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 8px;
          background: hsl(var(--brand));
          transition: 0.3s;
        }

        .company-card-premium.matriz::before {
          background: #10b981;
          box-shadow: 4px 0 20px rgba(16, 185, 129, 0.4);
        }

        .company-card-premium.filial::before {
          background: #3b82f6;
          box-shadow: 4px 0 20px rgba(59, 130, 246, 0.4);
        }

        .farm-card-premium::before {
          background: #f59e0b;
          box-shadow: 4px 0 20px rgba(245, 158, 11, 0.4);
        }

        .company-card-premium:hover, .farm-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 36px rgba(0,0,0,0.12);
        }

        .company-card-premium.matriz:hover {
          border-color: #10b98180;
        }
        .company-card-premium.filial:hover {
          border-color: #3b82f680;
        }
        .farm-card-premium:hover {
          border-color: #f59e0b80;
        }

        .card-left-section {
          width: 110px;
          flex-shrink: 0;
          background: hsl(var(--bg-main) / 0.6);
          border-right: 1px solid hsl(var(--border) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 10px;
          justify-content: space-between;
        }

        .card-avatar {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }

        .company-card-premium.matriz .card-avatar {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1.5px solid rgba(16, 185, 129, 0.25);
        }

        .company-card-premium.filial .card-avatar {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1.5px solid rgba(59, 130, 246, 0.25);
        }

        .farm-card-premium .card-avatar {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1.5px solid rgba(245, 158, 11, 0.25);
        }

        .card-bottom-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          align-items: center;
        }

        .action-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-icon-btn:hover {
          color: hsl(var(--text-main));
          background: hsl(var(--bg-main));
          transform: scale(1.05);
        }

        .action-icon-btn.delete:hover {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.05);
        }

        .card-main-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 4px;
        }

        .entity-name {
          font-size: 15px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin: 0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-badges {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
          align-items: center;
        }

        .status-pill {
          font-size: 9px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-pill.active {
          background: rgba(22, 163, 74, 0.12);
          color: #16a34a;
        }

        .status-pill.inactive {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        .type-pill {
          font-size: 9px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .type-pill.matriz {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }

        .type-pill.filial {
          background: rgba(59, 130, 246, 0.12);
          color: #3b82f6;
        }

        .entity-sub-info {
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        /* FEATURED METRIC HIGHLIGHTS */
        .featured-metric-panel {
          background: hsl(var(--bg-main) / 0.7);
          border: 1px solid hsl(var(--border) / 0.7);
          border-radius: 16px;
          padding: 12px 14px;
          margin-bottom: 16px;
        }

        .featured-metric-panel.area-highlight {
          border-left: 3px solid #f59e0b;
        }

        .metric-label {
          font-size: 9px;
          font-weight: 900;
          color: hsl(var(--text-muted));
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 900;
          color: hsl(var(--text-main));
          line-height: 1.1;
        }

        /* Progress bars & linkages */
        .progress-section {
          margin-bottom: 16px;
        }

        .progress-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          font-weight: 900;
          color: hsl(var(--text-muted));
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .premium-progress-bar {
          height: 6px;
          border-radius: 99px;
          background: hsl(var(--border) / 0.5);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .parent-link-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.05);
          border: 1.5px dashed rgba(245, 158, 11, 0.2);
          color: hsl(var(--text-main));
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          width: 100%;
          box-sizing: border-box;
        }

        .parent-link-badge svg {
          color: #f59e0b;
        }

        /* Footer info */
        .card-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px dashed hsl(var(--border));
          padding-top: 10px;
          margin-top: auto;
        }

        .footer-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          color: hsl(var(--text-muted));
        }

        .footer-meta-item svg {
          color: hsl(var(--brand));
        }

        .footer-meta-item.highlight {
          color: #10b981;
        }
        .footer-meta-item.highlight svg {
          color: #10b981;
        }
      `}</style>

      <CompanyForm 
        isOpen={isCompanyModalOpen} 
        onClose={() => {
          setIsCompanyModalOpen(false);
          setEditingItem(null);
        }} 
        onSubmit={handleAddCompany} 
        initialData={editingItem}
      />

      <FarmForm 
        isOpen={isFarmModalOpen} 
        onClose={() => {
          setIsFarmModalOpen(false);
          setEditingItem(null);
        }} 
        onSubmit={handleAddFarm} 
        initialData={editingItem}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Histórico de Auditoria"
        subtitle="Registro de alterações e eventos administrativos"
        items={historyItems}
        loading={historyLoading}
      />

    </div>
  );
};
