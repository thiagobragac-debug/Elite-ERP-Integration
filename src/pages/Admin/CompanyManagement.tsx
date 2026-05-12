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
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { CompanyFilterModal } from './components/CompanyFilterModal';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';

export const CompanyManagement: React.FC = () => {
  const { activeFarm, tenant } = useTenant();
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
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
    if (tenant?.id) {
      fetchData();
    }
  }, [tenant?.id]);

  const fetchData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const { data: unitsData } = await supabase
        .from('unidades')
        .select('*')
        .eq('tenant_id', tenant.id);
      
      const { data: farmsData } = await supabase
        .from('fazendas')
        .select('*')
        .eq('tenant_id', tenant.id);

      if (unitsData) setCompanies(unitsData);
      if (farmsData) setFarms(farmsData);

      // Strategic Intelligence Calculations
      const totalUnits = (unitsData?.length || 0) + (farmsData?.length || 0);
      const totalArea = (farmsData || []).reduce((acc, f) => acc + (Number(f.area_total) || 0), 0);
      const matrizCount = (unitsData || []).filter(u => u.tipo?.toLowerCase() === 'matriz').length;
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
          sparkline: [{ value: 2 }, { value: 5 }, { value: totalUnits }]
        },
        { 
          label: 'Área Consolidada', 
          value: `${totalArea.toLocaleString('pt-BR')} ha`, 
          icon: Map, 
          color: '#10b981', 
          progress: 100,
          change: 'Área de Produção',
          periodLabel: 'Extensão Territorial',
          sparkline: [{ value: 1000 }, { value: 1500 }, { value: totalArea }]
        },
        { 
          label: 'Governança Fiscal', 
          value: matrizCount > 0 ? 'MATRIZ ATIVA' : 'PENDENTE', 
          icon: ShieldCheck, 
          color: matrizCount > 0 ? '#10b981' : '#ef4444', 
          progress: matrizCount > 0 ? 100 : 0,
          change: matrizCount > 0 ? 'Conforme' : 'Risco Fiscal',
          periodLabel: 'Compliance Contábil',
          sparkline: [{ value: 0 }, { value: matrizCount > 0 ? 1 : 0 }]
        },
        { 
          label: 'Score Operacional', 
          value: `${complianceScore}%`, 
          icon: Layout, 
          color: complianceScore > 80 ? '#10b981' : '#f59e0b', 
          progress: complianceScore,
          change: 'Health Index',
          periodLabel: 'Integridade de Dados',
          sparkline: [{ value: 40 }, { value: 60 }, { value: complianceScore }]
        }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (formData: any) => {
    try {
      const payload = {
        razao_social: formData.name,
        cnpj: formData.document,
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
        nome: formData.name,
        documento: formData.document
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
        area_total: formData.totalArea,
        localizacao: formData.location,
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
    // Simulating logs
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: new Date().toISOString(), title: 'Atualização de Cadastro', subtitle: 'Alteração de endereço fiscal', status: 'info' },
        { id: '2', date: new Date().toISOString(), title: 'Sincronização Fiscal', subtitle: 'Dados validados com a SEFAZ', status: 'success' },
      ]);
      setHistoryLoading(false);
    }, 1000);
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
      header: 'Localização',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <MapPin size={14} />
          <span>{item.cidade}/{item.estado}</span>
        </div>
      )
    },
    {
      header: 'Tipo',
      accessor: (item: any) => (
        <span className={`status-pill ${item.tipo === 'matriz' ? 'active' : 'info'}`}>
          {item.tipo}
        </span>
      ),
      align: 'center' as const
    }
  ];

  const farmColumns = [
    {
      header: 'Fazenda / Unidade',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.localizacao}
          </div>
        </div>
      )
    },
    {
      header: 'Área Total',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Layout size={14} />
          <span>{item.area_total} ha</span>
        </div>
      )
    },
    {
      header: 'Empresa',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Building2 size={14} />
          <span>{companies.find(c => c.id === item.unidade_id)?.razao_social || 'N/A'}</span>
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
            <span>ELITE ADMIN v5.0</span>
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
          <EliteStatCard
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

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            Empresas (Matriz/Filial)
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'farms' ? 'active' : ''}`}
            onClick={() => setActiveTab('farms')}
          >
            Fazendas & Unidades
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
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

        <div className="elite-filter-group">
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
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-company')?.classList.remove('active'); }}>CSV</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-company')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-company')?.classList.remove('active'); }}>PDF Profissional</button>
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
                      layout
                      className={`user-card-premium ${c.tipo?.toLowerCase() === 'matriz' ? 'active' : ''}`}
                    >
                      <div className="card-avatar">
                        <Building2 size={32} />
                      </div>
                      <div className="card-main-content">
                        <div className="card-header-info">
                          <h3>{c.razao_social || c.nome}</h3>
                          <span className="card-role-badge">{c.tipo || 'UNIDADE'}</span>
                        </div>
                        <div className="card-meta-grid">
                          <div className="meta-item">
                            <Globe size={14} className="meta-icon" />
                            <span>CNPJ: {c.cnpj || c.documento || '---'}</span>
                          </div>
                          <div className="meta-item">
                            <MapPin size={14} className="meta-icon" />
                            <span>{c.cidade || 'Sede'}/{c.estado || 'BR'}</span>
                          </div>
                          <div className="meta-item">
                            <Calendar size={14} className="meta-icon" />
                            <span>Contrato Ativo</span>
                          </div>
                        </div>
                        <div className="card-bottom-actions">
                          <button className="action-icon-btn" onClick={() => handleViewLogs(c)} title="Logs"><History size={16} /></button>
                          <button className="action-icon-btn" onClick={() => { setEditingItem(c); setIsCompanyModalOpen(true); }} title="Editar"><Edit3 size={16} /></button>
                          <button className="action-icon-btn delete" onClick={() => handleDelete('company', c.id)} title="Excluir"><XCircle size={16} /></button>
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
                      layout
                      className="user-card-premium active"
                    >
                      <div className="card-avatar profile-icon" style={{ background: '#10b981' }}>
                        <Map size={32} />
                      </div>
                      <div className="card-main-content">
                        <div className="card-header-info">
                          <h3>{f.nome}</h3>
                          <span className="card-role-badge" style={{ color: '#10b981', background: '#10b98115', borderColor: '#10b98130' }}>PRODUTIVA</span>
                        </div>
                        <div className="card-meta-grid">
                          <div className="meta-item">
                            <Layout size={14} className="meta-icon" />
                            <span>Área: {f.area_total} ha</span>
                          </div>
                          <div className="meta-item">
                            <Building2 size={14} className="meta-icon" />
                            <span>{companies.find(c => c.id === f.unidade_id)?.razao_social || 'N/A'}</span>
                          </div>
                          <div className="meta-item">
                            <MapPin size={14} className="meta-icon" />
                            <span>{f.localizacao || 'Localização não informada'}</span>
                          </div>
                        </div>
                        <div className="card-bottom-actions">
                          <button className="action-icon-btn" onClick={() => { setEditingItem(f); setIsFarmModalOpen(true); }} title="Editar"><Edit3 size={16} /></button>
                          <button className="action-icon-btn delete" onClick={() => handleDelete('farm', f.id)} title="Excluir"><XCircle size={16} /></button>
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
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
          padding: 8px;
        }

        .user-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          height: 180px;
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
          background: hsl(var(--border));
          transition: 0.3s;
        }

        .user-card-premium.active::before {
          background: hsl(161 64% 39%);
          box-shadow: 4px 0 15px hsl(161 64% 39% / 0.3);
        }

        .user-card-premium.info-badge::before {
          background: hsl(var(--brand));
          box-shadow: 4px 0 15px hsl(var(--brand) / 0.3);
        }

        .user-card-premium:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: hsl(var(--brand) / 0.3);
        }

        .card-left-section {
          width: 130px;
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
          border-radius: 16px;
          background: var(--bg-main);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--brand);
          flex-shrink: 0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .card-avatar.profile-icon {
          color: white;
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
        }
        .card-main-content { flex: 1; display: flex; flex-direction: column; gap: 12px; padding: 24px; }
        .card-header-info h3 { font-size: 1rem; font-weight: 900; color: var(--text-main); margin: 0; letter-spacing: -0.01em; }
        .card-role-badge { font-size: 0.625rem; font-weight: 800; color: var(--brand); background: rgba(var(--brand-rgb), 0.1); padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
        
        .card-meta-grid { display: grid; grid-template-columns: 1fr; gap: 6px; }
        .meta-item { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
        .meta-icon { color: var(--brand); opacity: 0.7; }
        
        .card-bottom-actions { display: flex; gap: 8px; margin-top: auto; }
        .action-icon-btn { 
          width: 32px; height: 32px; border-radius: 8px; 
          background: var(--bg-main); color: var(--text-muted); 
          display: flex; align-items: center; justify-content: center; 
          transition: 0.2s; 
          cursor: pointer;
        }
        .action-icon-btn:hover { background: var(--brand); color: white; transform: translateY(-2px); }
        .action-icon-btn.delete:hover { background: #ef4444; }
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
