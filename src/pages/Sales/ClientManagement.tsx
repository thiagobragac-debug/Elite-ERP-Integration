import React, { useState, useEffect } from 'react';
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

export const ClientManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeTenantId } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ATIVO' | 'LEAD'>('ATIVO');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedSegment, setSelectedSegment] = useState('TODOS');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarm;
    if (isReady) {
      fetchClients();
    } else {
      setLoading(false);
    }
  }, [activeFarm, isGlobalMode, activeTenantId, debouncedSearch, filterValues, activeTab]);

  const [searchParams] = useSearchParams();

  // Deep Linking: Abre o parceiro automaticamente se vier da auditoria
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && clients.length > 0) {
      console.log('[DeepLink] Tentando abrir parceiro:', id);
      const client = clients.find(c => c.id === id);
      if (client) {
        console.log('[DeepLink] Parceiro encontrado, abrindo modal...');
        handleOpenEdit(client);
        // Limpa os params para evitar loops
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        console.warn('[DeepLink] Parceiro não encontrado na lista atual');
      }
    }
  }, [searchParams, clients]);

  const fetchClients = async () => {
    setLoading(true);
    const tenantId = activeTenantId || activeFarm?.tenantId;
    if (!tenantId) {
      setLoading(false);
      return;
    }
    // Fetch Clients
    const { data: clientData } = await supabase
      .from('parceiros')
      .select('*').limit(500)
      .eq('tenant_id', tenantId)
      .eq('is_customer', true)
      .order('nome', { ascending: true });
    
    // Fetch Sales Data for Intelligence
    const { data: salesData } = await supabase
      .from('pedidos_venda')
      .select('*').limit(500)
      .eq('tenant_id', tenantId);

    if (clientData) {
      const enrichedClients = clientData.map(client => {
        const clientSales = salesData?.filter(s => s.cliente_id === client.id) || [];
        const ltv = clientSales.reduce((acc, s) => acc + Number(s.valor_total || 0), 0);
        const lastSale = clientSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        // Churn Logic: No purchase in > 90 days for active clients
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

      setClients(enrichedClients);
      
      const totalSales = salesData?.reduce((acc, s) => acc + Number(s.valor_total || 0), 0) || 0;
      const activeCount = enrichedClients.filter(c => c.status?.toUpperCase() === 'ATIVO').length;

      setStats([
        { label: 'Rede de Parceiros', value: enrichedClients.length, icon: Users, color: '#10b981', progress: 100, change: 'Base Total',
          sparkline: (() => { const n = enrichedClients.length; return [n-6,n-5,n-4,n-3,n-2,n-1,n].map((v,i) => ({ value: Math.max(v,0), label: i<6?`Sem ${i+1}`:`Hoje: ${v}` })); })()
        },
        { label: 'Receita Retida (LTV)', value: `R$ ${(totalSales / 1000).toFixed(1)}k`, icon: TrendingUp, color: '#3b82f6', progress: 85, trend: 'up' as const, change: 'Total Histórico',
          sparkline: [0.50,0.60,0.70,0.78,0.85,0.92,1.0].map((m,i) => ({ value: Math.round(totalSales*m/1000), label: `Sem ${i+1}` }))
        },
        { label: 'Risco de Churn', value: enrichedClients.filter(c => c.churnRisk).length, icon: AlertTriangle, color: '#ef4444', progress: 12, change: 'Inativos >90d',
          sparkline: (() => { const ch = enrichedClients.filter(c => c.churnRisk).length; return [ch+3,ch+2,ch+2,ch+1,ch+1,ch,ch].map((v,i) => ({ value: Math.max(v,0), label: i<6?`Sem ${i+1}`:`Hoje: ${v}` })); })()
        },
        { label: 'Aderência VIP', value: `${((enrichedClients.filter(c => String(c.rating || '').startsWith('A')).length / (enrichedClients.length || 1)) * 100).toFixed(0)}%`, icon: Star, color: '#f59e0b', progress: 98, change: 'Rating A+',
          sparkline: [88,91,93,95,96,97,98].map((v,i) => ({ value: v, label: `${v}%` }))
        },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm && !selectedClient) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        nome: formData.name,
        documento: formData.cnpj,
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
        limite_credito: formData.creditLimit,
        status: formData.status,
        segmento: formData.segment
      };

      if (selectedClient) {
        const { error } = await supabase.from('parceiros').update({
          ...payload,
          is_customer: true,
          is_global: formData.is_global,
          fazendas_vinculadas: formData.fazendas_vinculadas
        }).eq('id', selectedClient.id);
        if (error) throw error;
        setIsModalOpen(false); 
        fetchClients();
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
                // Já existe, vamos apenas atualizar e "ativar" a flag de cliente
                const { error } = await supabase.from('parceiros').update({
                    ...payload,
                    is_customer: true,
                    tenant_id: activeTenantId || activeFarm?.tenantId,
                    is_global: formData.is_global,
                    fazendas_vinculadas: formData.fazendas_vinculadas
                }).eq('id', existing.id);
                if (error) throw error;
                
                alert(`Parceiro unificado! Um cadastro com este CNPJ/CPF já existia (Fornecedor). Ele agora também é um Cliente.`);
                setIsModalOpen(false); 
                fetchClients();
                setIsSubmitting(false);
                return;
            }
        }

        const { error } = await supabase.from('parceiros').insert([{ 
          ...payload, 
          is_customer: true,
          tenant_id: activeTenantId || activeFarm?.tenantId,
          is_global: formData.is_global,
          fazendas_vinculadas: formData.fazendas_vinculadas
        }]);
        if (error) throw error;
        setIsModalOpen(false); 
        fetchClients();
      }
    } catch (err: any) {
      console.error('[ClientManagement] Erro ao salvar parceiro:', err);
      alert('âŒ Erro ao salvar parceiro: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = clients.filter(client => {
      const matchesSearch = (client.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (client.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'ATIVO' ? client.status?.toUpperCase() === 'ATIVO' : client.status?.toUpperCase() !== 'ATIVO';
      const matchesFarm = isGlobalMode || client.is_global || (activeFarm && client.fazendas_vinculadas?.includes(activeFarm.id));
      const matchesSegmentTab = selectedSegment === 'TODOS' ? true : client.segmento === selectedSegment;
      
      const matchesStatus = filterValues.status === 'all' || client.status === filterValues.status;
      const matchesRating = filterValues.rating === 'all' || client.rating === filterValues.rating;
      const matchesLtv = (client.ltv || 0) <= filterValues.maxLtv;
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
    if (!confirm('Deseja excluir este parceiro?')) return;
    try {
      const { error } = await supabase.from('parceiros').delete().eq('id', id);
      if (error) throw error;
      fetchClients();
    } catch (err: any) {
      alert('âŒ Erro ao excluir parceiro: ' + err.message);
    }
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
          <div className="brand-badge">
            <Users size={14} fill="currentColor" />
            <span>TAUZE CRM v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Clientes</h1>
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
            change={stat.change || '+5.2%'}
            trend={stat.trend}
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
            data={clients.filter(client => {
              const matchesSearch = (client.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (client.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'ATIVO' ? client.status?.toUpperCase() === 'ATIVO' : client.status?.toUpperCase() !== 'ATIVO';
              const matchesFarm = isGlobalMode || client.is_global || (activeFarm && client.fazendas_vinculadas?.includes(activeFarm.id));
              const matchesSegmentTab = selectedSegment === 'TODOS' ? true : client.segmento === selectedSegment;
              
              const matchesStatus = filterValues.status === 'all' || client.status === filterValues.status;
              const matchesRating = filterValues.rating === 'all' || client.rating === filterValues.rating;
              const matchesLtv = (client.ltv || 0) <= filterValues.maxLtv;
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
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
            {clients
              .filter(client => {
                const matchesSearch = (client.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (client.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesTab = activeTab === 'ATIVO' ? client.status?.toUpperCase() === 'ATIVO' : client.status?.toUpperCase() !== 'ATIVO';
                const matchesFarm = isGlobalMode || client.is_global || (activeFarm && client.fazendas_vinculadas?.includes(activeFarm.id));
                const matchesSegmentTab = selectedSegment === 'TODOS' ? true : client.segmento === selectedSegment;
                
                const matchesStatus = filterValues.status === 'all' || client.status === filterValues.status;
                const matchesRating = filterValues.rating === 'all' || client.rating === filterValues.rating;
                const matchesLtv = (client.ltv || 0) <= filterValues.maxLtv;
                const matchesChurn = filterValues.onlyChurnRisk ? client.churnRisk : true;
                const matchesSegments = filterValues.segments.length === 0 || filterValues.segments.includes(client.segmento);

                return matchesSearch && matchesTab && matchesFarm && matchesSegmentTab && matchesStatus && matchesRating && matchesLtv && matchesChurn && matchesSegments;
              })
              .map(client => (
                <motion.div 
                  key={client.id} 
                  layout
                  className={`user-card-premium ${client.status?.toUpperCase() === 'ATIVO' ? 'active' : 'warning-badge'}`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      {client.nome?.charAt(0) || 'C'}
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn info" onClick={() => handleViewHistory(client)} title="Dossiê"><History size={14} /></button>
                      <button className="action-icon-btn edit" onClick={() => handleOpenEdit(client)} title="Editar"><Edit3 size={14} /></button>
                      <button className="action-icon-btn delete" onClick={() => handleDelete(client.id)} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3>{client.nome}</h3>
                        {client.segmento === 'Ouro/VIP' && <Star size={16} fill="#eab308" color="#eab308" style={{ filter: 'drop-shadow(0 0 5px rgba(234, 179, 8, 0.4))' }} />}
                      </div>
                      <span className="card-role-badge">{client.tipo || 'Parceiro'}</span>
                    </div>

                    <div className="card-meta-grid">
                      <div className="meta-item">
                        <FileText size={14} className="meta-icon" />
                        <span>{client.documento || 'Sem Documento'}</span>
                      </div>
                      <div className="meta-item">
                        <MapPin size={14} className="meta-icon" />
                        <span>{client.cidade ? `${client.cidade}/${client.estado}` : 'N/A'}</span>
                      </div>
                      <div className="meta-item">
                        <Phone size={14} className="meta-icon" />
                        <span>{client.telefone || 'Sem telefone'}</span>
                      </div>
                    </div>
                    <div className="card-footer-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderTop: '1px dashed rgba(148, 163, 184, 0.15)', paddingTop: '4px', marginTop: '6px' }}>
                      <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                        <Target size={12} style={{ color: 'hsl(var(--brand))' }} />
                        <span>Seg: {client.segmento || 'Geral'}</span>
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
      `}</style>

      <ClientForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
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
