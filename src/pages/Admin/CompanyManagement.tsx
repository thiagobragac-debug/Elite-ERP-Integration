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
  List as ListIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { CompanyForm } from '../../components/Forms/CompanyForm';
import { FarmForm } from '../../components/Forms/FarmForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';

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

  const filteredCompanies = companies.filter(c => 
    (c.razao_social?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.cnpj || '').includes(searchTerm) ||
    (c.documento || '').includes(searchTerm)
  );

  const filteredFarms = farms.filter(f => 
    (f.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

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
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Log">
            <FileText size={20} />
          </button>
        </div>
      </div>

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
                      className={`user-card-premium ${c.tipo === 'matriz' ? 'info-badge' : ''}`}
                    >
                      <div className="card-left-section">
                        <div className="card-avatar">
                          <Building2 size={32} />
                        </div>
                        <div className="card-bottom-actions">
                          <button className="action-icon-btn" onClick={() => handleViewLogs(c)} title="Logs"><Eye size={16} /></button>
                          <button className="action-icon-btn" onClick={() => { setEditingItem(c); setIsCompanyModalOpen(true); }} title="Editar"><Edit3 size={16} /></button>
                        </div>
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
                            <span>{c.cidade}/{c.estado}</span>
                          </div>
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
                      className={`user-card-premium active`}
                    >
                      <div className="card-left-section">
                        <div className="card-avatar">
                          <Map size={32} />
                        </div>
                        <div className="card-bottom-actions">
                          <button className="action-icon-btn" onClick={() => { setEditingItem(f); setIsFarmModalOpen(true); }} title="Editar"><Edit3 size={16} /></button>
                          <button className="action-icon-btn delete" onClick={() => handleDelete('farm', f.id)} title="Excluir"><XCircle size={16} /></button>
                        </div>
                      </div>

                      <div className="card-main-content">
                        <div className="card-header-info">
                          <h3>{f.nome}</h3>
                          <span className="card-role-badge">FAZENDA</span>
                        </div>

                        <div className="card-meta-grid">
                          <div className="meta-item">
                            <Layout size={14} className="meta-icon" />
                            <span>{f.area_total} ha</span>
                          </div>
                          <div className="meta-item">
                            <Building2 size={14} className="meta-icon" />
                            <span>{companies.find(c => c.id === f.unidade_id)?.razao_social || 'N/A'}</span>
                          </div>
                          <div className="meta-item">
                            <MapPin size={14} className="meta-icon" />
                            <span>{f.localizacao}</span>
                          </div>
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
          width: 64px;
          height: 64px;
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 12px;
          box-shadow: var(--shadow-sm);
          border: 1px solid hsl(var(--border));
        }

        .card-main-content {
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-header-info h3 {
          font-size: 16px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 900;
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.08);
          padding: 4px 12px;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid hsl(var(--brand) / 0.2);
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: hsl(var(--text-muted));
          font-size: 12px;
          font-weight: 600;
        }

        .meta-icon {
          color: hsl(var(--brand));
          opacity: 0.8;
        }

        .card-bottom-actions {
          display: flex;
          gap: 8px;
          margin-top: 15px;
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
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: hsl(var(--brand));
          color: white;
          transform: scale(1.1);
          border-color: hsl(var(--brand));
        }

        .action-icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
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
