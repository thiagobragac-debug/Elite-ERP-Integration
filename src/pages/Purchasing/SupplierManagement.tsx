import React, { useState, useEffect } from 'react';
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
import { SupplierForm } from '../../components/Forms/SupplierForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { SupplierNetworkMapModal } from '../../components/Modals/SupplierNetworkMapModal';
import { SupplierFilterModal } from './components/SupplierFilterModal';
import './SupplierManagement.css';

export const SupplierManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeTenantId } = useTenant();
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    categories: [],
    minRating: 0,
    minSpend: 0,
    maxSpend: 1000000,
  });

  useEffect(() => {
    if (!activeTenantId && !activeFarm) {
      setLoading(false);
      return;
    }
    fetchSuppliers();
  }, [activeFarm, isGlobalMode, activeTenantId]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data: supplierData } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('tenant_id', activeTenantId || activeFarm?.tenantId)
        .order('nome', { ascending: true });

      const { data: purchaseData } = await supabase
        .from('notas_entrada')
        .select('fornecedor_id, valor_total')
        .eq('tenant_id', activeTenantId || activeFarm?.tenantId);
      
      if (supplierData) {
        // Calculate spend per supplier
        const spendMap: Record<string, number> = {};
        let totalSpend = 0;
        purchaseData?.forEach(n => {
          spendMap[n.fornecedor_id] = (spendMap[n.fornecedor_id] || 0) + Number(n.valor_total);
          totalSpend += Number(n.valor_total);
        });

        const processedSuppliers = supplierData.map(s => ({
          ...s,
          totalSpend: spendMap[s.id] || 0,
          rating: spendMap[s.id] ? Math.min(5, 3 + (spendMap[s.id] / 100000)) : 0
        }));

        setSuppliers(processedSuppliers);

        const mainSupplierSpend = Math.max(...Object.values(spendMap), 0);
        const concentrationRisk = totalSpend > 0 ? (mainSupplierSpend / totalSpend) * 100 : 0;
        
        setStats([
          { 
            label: 'Parceiros Ativos', 
            value: processedSuppliers.filter(s => s.status === 'ATIVO').length, 
            icon: Building2, 
            color: '#10b981', 
            progress: 100, 
            change: 'Homologados',
            sparkline: [{ value: 12 }, { value: 15 }, { value: 18 }]
          },
          { 
            label: 'Volume Procurement', 
            value: `R$ ${(totalSpend / 1000).toFixed(1)}k`, 
            icon: TrendingUp, 
            color: '#3b82f6', 
            progress: 75, 
            trend: 'up', 
            change: 'Total Histórico',
            sparkline: [{ value: 45000 }, { value: 65000 }, { value: totalSpend }]
          },
          { 
            label: 'Risco Concentração', 
            value: `${concentrationRisk.toFixed(1)}%`, 
            icon: AlertCircle, 
            color: concentrationRisk > 40 ? '#ef4444' : '#f59e0b', 
            progress: concentrationRisk, 
            change: 'Concentração Lead',
            trend: concentrationRisk > 40 ? 'up' : 'stable'
          },
          { 
            label: 'SLA Médio Rede', 
            value: '4.8', 
            icon: Star, 
            color: '#166534', 
            progress: 96, 
            change: 'Rating Eficiência' 
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
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
    if (!activeFarm) return;
    const payload = {
      nome: formData.nome,
      cnpj_cpf: formData.cnpj,
      contato: formData.contato,
      email: formData.email,
      categoria: formData.categoria,
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
      const { error } = await supabase.from('fornecedores').update({
        ...payload,
        is_global: formData.is_global,
        fazendas_vinculadas: formData.fazendas_vinculadas
      }).eq('id', selectedSupplier.id);
      if (!error) { setIsModalOpen(false); fetchSuppliers(); }
    } else {
      const { error } = await supabase.from('fornecedores').insert([{ 
        ...payload, 
        tenant_id: activeTenantId || activeFarm?.tenantId,
        is_global: formData.is_global,
        fazendas_vinculadas: formData.fazendas_vinculadas
      }]);
      if (!error) { setIsModalOpen(false); fetchSuppliers(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este fornecedor?')) return;
    const { error } = await supabase.from('fornecedores').delete().eq('id', id);
    if (!error) fetchSuppliers();
  };

  const handleViewHistory = async (sup: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    const { data } = await supabase
      .from('notas_entrada')
      .select('*')
      .eq('fornecedor_id', sup.id)
      .eq('tenant_id', activeTenantId || activeFarm?.tenantId)
      .order('data_entrada', { ascending: false });
    if (data && data.length > 0) {
      setHistoryItems(data.map(n => ({ id: n.id, date: n.data_entrada, title: 'Nota Fiscal: ' + n.numero_nota, subtitle: n.observacoes || 'Compra de Insumos', value: Number(n.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: 'success' })));
    } else {
      setHistoryItems([{ id: '1', date: sup.created_at, title: 'Cadastro Inicial', subtitle: 'Fornecedor homologado', value: 'OK', status: 'info' }]);
    }
    setHistoryLoading(false);
  };

  const columns = [
    {
      header: 'Fornecedor / Performance',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider flex items-center gap-2">
            <span>{item.cnpj_cpf || 'Sem documento'}</span>
            <span className="text-amber-500 flex items-center gap-1">
              <Star size={10} fill="currentColor" /> {item.rating?.toFixed(1) || 'N/A'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Categoria / Gasto',
      accessor: (item: any) => (
        <div className="flex flex-col">
          <div className="table-cell-meta">
            <Briefcase size={14} />
            <span>{item.categoria}</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase">
            Total: R$ {Number(item.totalSpend || 0).toLocaleString('pt-BR')}
          </span>
        </div>
      )
    },
    {
      header: 'Contato',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Phone size={14} />
          <span>{item.telefone || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'ATIVO' ? 'active' : 'stopped'}`}>
          {item.status}
        </span>
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
            <span>ELITE PROCUREMENT v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Fornecedores</h1>
          <p className="page-subtitle">Homologação de parceiros, análise de performance e histórico transacional de compras em tempo real.</p>
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
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Building2} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            {...stat}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'HOMOLOGADO' ? 'active' : ''}`}
            onClick={() => setActiveTab('HOMOLOGADO')}
          >
            Rede Homologada
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'PENDENTE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDENTE')}
          >
            Pendentes
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
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

        <div className="elite-filter-group">
          <button 
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Fornecedores">
            <FileText size={20} />
          </button>
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
            data={suppliers.filter(sup => {
              const matchesSearch = (sup.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (sup.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'HOMOLOGADO' ? sup.status === 'ATIVO' : sup.status !== 'ATIVO';
              const matchesFarm = isGlobalMode || sup.is_global || (activeFarm && sup.fazendas_vinculadas?.includes(activeFarm.id));
              
              const matchesStatus = filterValues.status === 'all' || sup.status === filterValues.status;
              const matchesRating = (sup.rating || 0) >= filterValues.minRating;
              const matchesSpend = (sup.totalSpend || 0) <= filterValues.maxSpend;
              const matchesCategories = filterValues.categories.length === 0 || filterValues.categories.includes(sup.categoria);

              return matchesSearch && matchesTab && matchesFarm && matchesStatus && matchesRating && matchesSpend && matchesCategories;
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
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
            {suppliers
              .filter(sup => {
                const matchesSearch = (sup.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (sup.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesTab = activeTab === 'HOMOLOGADO' ? sup.status === 'ATIVO' : sup.status !== 'ATIVO';
                const matchesFarm = isGlobalMode || sup.is_global || (activeFarm && sup.fazendas_vinculadas?.includes(activeFarm.id));
                
                const matchesStatus = filterValues.status === 'all' || sup.status === filterValues.status;
                const matchesRating = (sup.rating || 0) >= filterValues.minRating;
                const matchesSpend = (sup.totalSpend || 0) <= filterValues.maxSpend;
                const matchesCategories = filterValues.categories.length === 0 || filterValues.categories.includes(sup.categoria);

                return matchesSearch && matchesTab && matchesFarm && matchesStatus && matchesRating && matchesSpend && matchesCategories;
              })
              .map(sup => (
                <motion.div 
                  key={sup.id} 
                  layout
                  className={`user-card-premium ${sup.status === 'ATIVO' ? 'active' : ''}`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      {sup.nome?.charAt(0) || 'F'}
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn" onClick={() => handleViewHistory(sup)} title="Dossiê"><History size={16} /></button>
                      <button className="action-icon-btn" onClick={() => handleOpenEdit(sup)} title="Editar"><Edit3 size={16} /></button>
                      <button className="action-icon-btn delete" onClick={() => handleDelete(sup.id)} title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <div className="flex justify-between items-start">
                        <h3>{sup.nome}</h3>
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                          <Star size={14} fill="currentColor" />
                          {sup.rating?.toFixed(1)}
                        </div>
                      </div>
                      <span className="card-role-badge">{sup.categoria || 'Geral'}</span>
                    </div>

                    <div className="card-meta-grid">
                      <div className="meta-item">
                        <FileText size={14} className="meta-icon" />
                        <span>{sup.cnpj_cpf || 'Sem Documento'}</span>
                      </div>
                      <div className="meta-item">
                        <DollarSign size={14} className="meta-icon text-emerald-600" />
                        <span className="font-bold text-emerald-700">R$ {Number(sup.totalSpend || 0).toLocaleString('pt-BR')} consumidos</span>
                      </div>
                      <div className="meta-item">
                        <MapPin size={14} className="meta-icon" />
                        <span>{sup.cidade ? `${sup.cidade}/${sup.estado}` : 'Sem endereço'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
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
          background: hsl(var(--border-strong));
          transition: 0.3s;
        }

        .user-card-premium.active::before {
          background: #16a34a;
          box-shadow: 4px 0 15px rgba(22, 163, 74, 0.3);
        }

        .user-card-premium:hover {
          transform: translateX(8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          border-color: #16a34a33;
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
          width: 70px;
          height: 70px;
          background: #0f172a;
          color: white;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 12px;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
        }

        .card-main-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-header-info h3 {
          font-size: 19px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.1);
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-top: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: hsl(var(--text-muted));
          font-size: 12px;
          font-weight: 600;
        }

        .meta-icon {
          color: #16a34a;
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
          background: #0f172a;
          color: white;
          transform: scale(1.1);
        }

        .action-icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }
      `}</style>

      <SupplierForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedSupplier}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê do Fornecedor"
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
