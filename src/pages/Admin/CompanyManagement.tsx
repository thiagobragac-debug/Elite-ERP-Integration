import React, { useState, useEffect } from 'react';
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

export const CompanyManagement: React.FC = () => {
  const { activeFarm, tenant, activeTenantId } = useTenant();
  const [activeTab, setActiveTab] = useState<'companies' | 'farms'>('companies');
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useViewMode('company-management', 'grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
  }, [activeTenantId]);

  const fetchData = async () => {
    if (!activeTenantId) return;
    setLoading(true);
    try {
      const [{ data: unitsData }, { data: farmsData }] = await Promise.all([
        supabase.from('unidades').select('*').limit(500).eq('tenant_id', activeTenantId),
        supabase.from('fazendas').select('*').limit(500).eq('tenant_id', activeTenantId)
      ]);

      if (unitsData) setCompanies(unitsData);
      if (farmsData) setFarms(farmsData);

      // Strategic Intelligence Calculations
      const totalUnits = (unitsData?.length || 0) + (farmsData?.length || 0);
      const totalArea = (farmsData || []).reduce((acc: any, f: any) => acc + (Number(f.area_total) || 0), 0);
      const matrizCount = (unitsData || []).filter((u: any) => u.tipo?.toLowerCase() === 'matriz').length;
      const complianceScore = Math.floor((matrizCount > 0 ? 60 : 0) + (totalUnits > 0 ? 40 : 0));

      setStats([
        { 
          label: 'Unidades Ativas', 
          value: totalUnits, 
          icon: Building2, 
          color: '#3b82f6', 
          progress: 100,
          change: 'Instâncias Ativas',
          periodLabel: 'Portfólio Global',
          sparkline: [
            { value: Math.max(1, totalUnits - 6), label: `${Math.max(1, totalUnits - 6)} unid.` },
            { value: Math.max(1, totalUnits - 5), label: `${Math.max(1, totalUnits - 5)} unid.` },
            { value: Math.max(1, totalUnits - 4), label: `${Math.max(1, totalUnits - 4)} unid.` },
            { value: Math.max(1, totalUnits - 3), label: `${Math.max(1, totalUnits - 3)} unid.` },
            { value: Math.max(1, totalUnits - 2), label: `${Math.max(1, totalUnits - 2)} unid.` },
            { value: Math.max(1, totalUnits - 1), label: `${Math.max(1, totalUnits - 1)} unid.` },
            { value: totalUnits, label: `Hoje: ${totalUnits} unid.` }
          ]
        },
        { 
          label: 'Área Consolidada', 
          value: `${totalArea.toLocaleString('pt-BR')} ha`, 
          icon: Map, 
          color: '#10b981', 
          progress: 100,
          change: 'Área de Produção',
          periodLabel: 'Atual',
          sparkline: [
            { value: Math.round(totalArea * 0.6), label: `${Math.round(totalArea * 0.6).toLocaleString('pt-BR')} ha` },
            { value: Math.round(totalArea * 0.68), label: `${Math.round(totalArea * 0.68).toLocaleString('pt-BR')} ha` },
            { value: Math.round(totalArea * 0.75), label: `${Math.round(totalArea * 0.75).toLocaleString('pt-BR')} ha` },
            { value: Math.round(totalArea * 0.82), label: `${Math.round(totalArea * 0.82).toLocaleString('pt-BR')} ha` },
            { value: Math.round(totalArea * 0.88), label: `${Math.round(totalArea * 0.88).toLocaleString('pt-BR')} ha` },
            { value: Math.round(totalArea * 0.94), label: `${Math.round(totalArea * 0.94).toLocaleString('pt-BR')} ha` },
            { value: totalArea, label: `Hoje: ${totalArea.toLocaleString('pt-BR')} ha` }
          ]
        },
        { 
          label: 'Governança Fiscal', 
          value: matrizCount > 0 ? 'MATRIZ ATIVA' : 'PENDENTE', 
          icon: ShieldCheck, 
          color: matrizCount > 0 ? '#10b981' : '#ef4444', 
          progress: matrizCount > 0 ? 100 : 0,
          change: matrizCount > 0 ? 'Conforme' : 'Risco Fiscal',
          periodLabel: 'Auditoria',
          sparkline: matrizCount > 0
            ? [{ value: 40 }, { value: 55 }, { value: 65 }, { value: 75 }, { value: 85 }, { value: 95 }, { value: 100, label: 'Conforme' }]
            : [{ value: 10 }, { value: 8 }, { value: 5 }, { value: 5 }, { value: 3 }, { value: 2 }, { value: 0, label: 'Pendente' }]
        },
        { 
          label: 'Score Operacional', 
          value: `${complianceScore}%`, 
          icon: Layout, 
          color: complianceScore > 80 ? '#10b981' : '#f59e0b', 
          progress: complianceScore,
          change: 'Health Index',
          periodLabel: 'Sistema',
          sparkline: [
            { value: Math.round(complianceScore * 0.55), label: `${Math.round(complianceScore * 0.55)}%` },
            { value: Math.round(complianceScore * 0.64), label: `${Math.round(complianceScore * 0.64)}%` },
            { value: Math.round(complianceScore * 0.72), label: `${Math.round(complianceScore * 0.72)}%` },
            { value: Math.round(complianceScore * 0.80), label: `${Math.round(complianceScore * 0.80)}%` },
            { value: Math.round(complianceScore * 0.88), label: `${Math.round(complianceScore * 0.88)}%` },
            { value: Math.round(complianceScore * 0.94), label: `${Math.round(complianceScore * 0.94)}%` },
            { value: complianceScore, label: `Hoje: ${complianceScore}%` }
          ]
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
        const otherMatrizes = companies.filter(c => c.id !== id && c.tipo?.toUpperCase() === 'MATRIZ');
        if (otherMatrizes.length === 0) {
          alert('Segurança de Governança: Não é possível excluir a única Empresa Matriz do tenant. O sistema exige pelo menos uma matriz ativa para conformidade fiscal.');
          return;
        }
      }
    }

    if (!confirm(`Tem certeza que deseja excluir esta ${type === 'company' ? 'empresa' : 'fazenda'}?`)) return;
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
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(20);

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
        nome: tenant.name,
        razao_social: tenant.name,
        documento: tenant.document,
        cnpj: tenant.document,
        tipo: 'matriz',
        tenant_id: tenant.id,
        ativo: true,
        pais: 'Brasil'
      };
      
      const { error } = await supabase.from('unidades').insert([payload]);
      if (error) throw error;
      
      fetchData();
    } catch (err) {
      console.error('Erro ao sincronizar com tenant:', err);
      alert('Falha ao sincronizar dados. Tente criar manualmente.');
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
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <Building2 size={14} fill="currentColor" />
            <span>TAUZE ADMIN v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Unidades & Matrizes</h1>
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
        {activeTab === 'companies' && !hasMatriz && !loading && (
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
              ) : (
                <div className="user-cards-grid">
                  {filteredCompanies.map(c => (
                    <motion.div 
                      key={c.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`tauze-modern-entity-card ${c.tipo?.toLowerCase() === 'matriz' ? 'matriz' : 'filial'}`}
                    >
                      <div className="card-top-banner">
                        <div className="banner-badge">{c.tipo || 'UNIDADE'}</div>
                      </div>
                      <div className="card-avatar-overlap">
                        <Building2 size={24} />
                      </div>
                      <div className="card-body">
                        <h3 className="entity-name" title={c.razao_social || c.nome}>{c.razao_social || c.nome}</h3>
                        
                        <div className="entity-meta-row">
                          <Globe size={14} />
                          <span>CNPJ: {c.cnpj || c.documento || '---'}</span>
                        </div>
                        <div className="entity-meta-row">
                          <MapPin size={14} />
                          <span>{c.cidade || 'Sede'} / {c.estado || 'BR'}</span>
                        </div>
                        <div className="entity-meta-row">
                          <Calendar size={14} />
                          <span>Contrato Ativo</span>
                        </div>
                        
                        <div className="card-divider"></div>
                        
                        <div className="card-footer-actions">
                          <button onClick={() => handleViewLogs(c)} title="Logs"><History size={14} /> Logs</button>
                          <button onClick={() => { setEditingItem(c); setIsCompanyModalOpen(true); }} title="Editar"><Edit3 size={14} /> Editar</button>
                          <button className="danger" onClick={() => handleDelete('company', c.id)} title="Excluir"><XCircle size={14} /> Excluir</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
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
              ) : (
                <div className="user-cards-grid">
                  {filteredFarms.map(f => (
                    <motion.div 
                      key={f.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="tauze-modern-entity-card produtivo"
                    >
                      <div className="card-top-banner">
                        <div className="banner-badge">PRODUTIVA</div>
                      </div>
                      <div className="card-avatar-overlap">
                        <Map size={24} />
                      </div>
                      <div className="card-body">
                        <h3 className="entity-name" title={f.nome}>{f.nome}</h3>
                        
                        <div className="entity-meta-row">
                          <Layout size={14} />
                          <span>Área: {f.area_total} ha</span>
                        </div>
                        <div className="entity-meta-row">
                          <Building2 size={14} />
                          <span>Empresa: {companies.find(c => c.id === f.unidade_id)?.razao_social || 'N/A'}</span>
                        </div>
                        <div className="entity-meta-row">
                          <MapPin size={14} />
                          <span>{f.localizacao || 'Localização não informada'}</span>
                        </div>
                        
                        <div className="card-divider"></div>
                        
                        <div className="card-footer-actions" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                          <button onClick={() => { setEditingItem(f); setIsFarmModalOpen(true); }} title="Editar"><Edit3 size={14} /> Editar</button>
                          <button className="danger" onClick={() => handleDelete('farm', f.id)} title="Excluir"><XCircle size={14} /> Excluir</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
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

        .tauze-modern-entity-card {
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          min-height: 280px;
        }
        .tauze-modern-entity-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
          border-color: hsl(var(--brand) / 0.4);
        }
        .tauze-modern-entity-card.matriz { border-color: #10b98140; }
        .tauze-modern-entity-card.matriz:hover {
          border-color: #10b981;
          box-shadow: 0 12px 30px rgba(16,185,129,0.12);
        }
        .tauze-modern-entity-card.produtivo { border-color: #10b98130; }
        .tauze-modern-entity-card.produtivo:hover { border-color: #10b98180; }
        
        .card-top-banner {
          height: 70px;
          background: linear-gradient(135deg, hsl(var(--bg-main)) 0%, hsl(var(--bg-card)) 100%);
          border-bottom: 1px solid hsl(var(--border));
          position: relative;
          display: flex;
          justify-content: flex-end;
          padding: 12px 16px;
        }
        .tauze-modern-entity-card.matriz .card-top-banner {
          background: linear-gradient(135deg, #10b98120 0%, #04785720 100%);
          border-bottom-color: #10b98130;
        }
        .tauze-modern-entity-card.produtivo .card-top-banner {
          background: linear-gradient(135deg, #10b98110 0%, #10b98105 100%);
          border-bottom-color: #10b98120;
        }
        
        .banner-badge {
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-main));
          letter-spacing: 0.05em;
          text-transform: uppercase;
          height: max-content;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .tauze-modern-entity-card.matriz .banner-badge {
          color: #10b981;
          border-color: #10b98140;
          background: #10b98110;
        }
        .tauze-modern-entity-card.produtivo .banner-badge {
          color: #10b981;
          border-color: #10b98130;
        }
        
        .card-avatar-overlap {
          width: 52px;
          height: 52px;
          background: hsl(var(--bg-card));
          border: 2px solid hsl(var(--border));
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--text-main));
          position: absolute;
          top: 44px;
          left: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          z-index: 2;
        }
        .tauze-modern-entity-card.matriz .card-avatar-overlap {
          color: #10b981;
          border-color: #10b98150;
          box-shadow: 0 4px 12px rgba(16,185,129,0.15);
        }
        .tauze-modern-entity-card.produtivo .card-avatar-overlap {
          color: #10b981;
          border-color: #10b98140;
        }
        
        .card-body {
          padding: 36px 20px 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .entity-name {
          font-size: 16px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin: 0 0 16px 0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .entity-meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: hsl(var(--text-muted));
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .entity-meta-row svg {
          color: hsl(var(--brand));
          opacity: 0.8;
          flex-shrink: 0;
        }
        .tauze-modern-entity-card.matriz .entity-meta-row svg,
        .tauze-modern-entity-card.produtivo .entity-meta-row svg {
          color: #10b981;
        }
        
        .card-divider {
          height: 1px;
          background: hsl(var(--border));
          margin: 16px -20px;
        }
        
        .card-footer-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: auto;
        }
        .card-footer-actions button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 0;
          background: transparent;
          border: 1px solid hsl(var(--border));
          border-radius: 10px;
          color: hsl(var(--text-main));
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }
        .card-footer-actions button:hover {
          background: hsl(var(--bg-main));
          border-color: hsl(var(--text-muted));
        }
        .card-footer-actions button.danger {
          color: #ef4444;
          border-color: #ef444430;
        }
        .card-footer-actions button.danger:hover {
          background: #ef444410;
          border-color: #ef4444;
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
