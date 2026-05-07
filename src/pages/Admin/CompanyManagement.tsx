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
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { CompanyForm } from '../../components/Forms/CompanyForm';
import { FarmForm } from '../../components/Forms/FarmForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const CompanyManagement: React.FC = () => {
  const { activeFarm } = useTenant();
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: unitsData } = await supabase
        .from('unidades')
        .select('*');
      
      const { data: farmsData } = await supabase
        .from('fazendas')
        .select('*');

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
        endereco: formData.address,
        nome: formData.name, // mantendo compatibilidade com unidades
        documento: formData.document // mantendo compatibilidade com unidades
      };

      if (editingItem) {
        await supabase.from('unidades').update(payload).eq('id', editingItem.id);
      } else {
        await supabase.from('unidades').insert([payload]);
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
        await supabase.from('fazendas').insert([payload]);
      }
      fetchData();
      setIsFarmModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (type: 'company' | 'farm', id: string) => {
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

  return (
    <div className="admin-page">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Building2 size={14} fill="currentColor" />
            <span>ELITE ADMIN v5.0</span>
          </div>
          <h1 className="page-title">Administração de Empresas & Fazendas</h1>
          <p className="page-subtitle">Gerencie a estrutura organizacional de matrizes, filiais e unidades produtivas em tempo real.</p>
        </div>
        <button 
          className="primary-btn" 
          onClick={() => activeTab === 'companies' ? setIsCompanyModalOpen(true) : setIsFarmModalOpen(true)}
        >
          <Plus size={18} />
          {activeTab === 'companies' ? 'NOVA EMPRESA' : 'NOVA FAZENDA'}
        </button>
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
        <AnimatePresence mode="wait">
          {activeTab === 'companies' ? (
            <motion.div 
              key="companies-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
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
            </motion.div>
          ) : (
            <motion.div 
              key="farms-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
