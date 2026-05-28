import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { 
  Plus, 
  Tag, 
  Scale, 
  Activity, 
  Beef, 
  TrendingUp, 
  Trash2,
  Search,
  Filter,
  Eye,
  ChevronRight,
  FileText,
  Edit3,
  LayoutGrid,
  List as ListIcon,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { AnimalForm } from '../../components/Forms/AnimalForm';
import { AnimalFilterModal } from './components/AnimalFilterModal';
import { QuickManejoModal } from './components/QuickManejoModal';
import { supabase } from '../../lib/supabase';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useViewMode } from '../../hooks/useViewMode';

export const AnimalManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [isManejoModalOpen, setIsManejoModalOpen] = useState(false);
  const [manejoAnimal, setManejoAnimal] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'TODOS' | 'ATIVO' | 'ABATIDO'>('TODOS');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    sexo: 'all',
    lote: 'all',
    racas: [] as string[],
    minWeight: 0,
    sanidadeOk: true
  });
  
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useViewMode('pecuaria-animal-management', 'grid');

  const { 
    data: animals = [], 
    stats = [], 
    loading = false, 
    error = null, 
    totalCount = 0,
    refresh 
  } = useReportData('animais', { page, pageSize });

  const [searchParams] = useSearchParams();

  // Deep Linking: Abre o animal automaticamente se vier com ?id=
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && animals?.length > 0) {
      const animal = animals.find(a => a.id === id);
      if (animal) {
        handleOpenEdit(animal);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams, animals]);

  const handleOpenCreate = () => {
    setSelectedAnimal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (animal: any) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        brinco: formData.brinco,
        raca: formData.raca,
        sexo: formData.sexo,
        data_nascimento: formData.data_nascimento,
        fazenda_id: formData.fazenda_id || null,
        status: formData.status || 'Ativo',
        peso_inicial: parseFloat(formData.peso_inicial) || 0,
        pelagem: formData.pelagem,
        origem: formData.origem,
        mae_brinco: formData.mae_brinco,
        pai_brinco: formData.pai_brinco,
        valor_compra: parseFloat(formData.valor_compra) || 0,
        categoria: formData.categoria,
        finalidade: formData.finalidade
      };

      if (selectedAnimal) {
        const { error } = await supabase.from('animais').update(payload).eq('id', selectedAnimal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('animais').insert([{ ...insertPayload, ...payload }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      refresh();
    } catch (err: any) {
      alert('❌ Erro ao salvar animal: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = animals.map(item => ({
      Brinco: item.brinco,
      Raca: item.raca,
      Sexo: item.sexo,
      Peso_Atual: item.peso_atual,
      Status: item.status,
      Lote: item.lote || 'N/A'
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_animais');
    else if (format === 'excel') exportToExcel(exportData, 'log_animais');
    else if (format === 'pdf') exportToPDF(exportData, 'log_animais', 'Inventário de Animais');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este animal?')) return;
    try {
      const { error } = await supabase.from('animais').delete().eq('id', id);
      if (error) throw error;
      refresh();
    } catch (err: any) {
      alert('❌ Erro ao excluir animal: ' + err.message);
    }
  };

  const filteredAnimals = (animals || []).filter(a => {
    const matchesSearch = (a.brinco || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (a.raca || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'TODOS' ? true : (activeTab === 'ATIVO' ? a.status === 'Ativo' : a.status === 'Abatido');
    
    const matchesStatus = filterValues.status === 'all' || a.status === filterValues.status;
    const matchesSexo = filterValues.sexo === 'all' || a.sexo === filterValues.sexo;
    const matchesRaca = filterValues.racas.length === 0 || filterValues.racas.includes(a.raca);
    const matchesWeight = (a.peso_atual || a.peso_inicial || 0) >= filterValues.minWeight;

    return matchesSearch && matchesTab && matchesStatus && matchesSexo && matchesRaca && matchesWeight;
  });

  const tableColumns = [
    { 
      header: 'Brinco / Identificação', 
      accessor: (item: any) => {
        const currentWeight = item.peso_atual || item.peso_inicial || 0;
        let ageMonths = 0;
        if (item.data_nascimento) {
          ageMonths = Math.floor((new Date().getTime() - new Date(item.data_nascimento).getTime()) / (1000 * 3600 * 24 * 30.44));
        }
        let category = '';
        if (item.sexo === 'M') {
          if (currentWeight > 500 || ageMonths > 36) category = 'Boi Gordo';
          else if (ageMonths <= 12) category = 'Bezerro';
          else category = 'Garrote';
        } else if (item.sexo === 'F') {
          if (currentWeight > 450 || ageMonths > 36) category = 'Vaca';
          else if (ageMonths <= 12) category = 'Bezerra';
          else category = 'Novilha';
        } else {
          category = 'N/I';
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>#{item.brinco}</span>
              {item.status === 'Ativo' && currentWeight > 500 && (
                <span className="status-chip warning"><div className="dot"></div>PRONTO</span>
              )}
            </div>
            <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
              {item.raca} • {category}
            </span>
          </div>
        );
      },
      align: 'left' as const
    },
    {
      header: 'Lote / Rastreabilidade',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            Lote: {item.lote || 'N/A'}
          </span>
          <span className="sub-meta" style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
            Origem: {item.origem || 'Interna'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Idade & Ciclo',
      accessor: (item: any) => {
        let ageStr = 'N/I';
        if (item.data_nascimento) {
          const months = Math.floor((new Date().getTime() - new Date(item.data_nascimento).getTime()) / (1000 * 3600 * 24 * 30.44));
          ageStr = `${months} meses`;
        }
        let days = 0;
        if (item.created_at) {
          days = Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24));
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{ageStr}</span>
            <span className="sub-meta" style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
              {days} dias na fazenda
            </span>
          </div>
        );
      },
      align: 'left' as const
    },
    { 
      header: 'Peso Atual', 
      accessor: (item: any) => {
        const weight = item.peso_atual || item.peso_inicial || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#1e293b', fontWeight: 800 }}>
            <Scale size={14} color="#6366f1" />
            <span>{weight} kg</span>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Ganho de Peso',
      accessor: (item: any) => {
        const weight = item.peso_atual || item.peso_inicial || 0;
        const gain = weight - (item.peso_inicial || 0);
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span style={{ 
              padding: '2px 8px', 
              borderRadius: '6px', 
              fontSize: '11px', 
              fontWeight: 800,
              background: gain >= 0 ? '#ecfdf5' : '#fef2f2',
              color: gain >= 0 ? '#10b981' : '#ef4444',
              border: `1px solid ${gain >= 0 ? '#a7f3d0' : '#fecaca'}`
            }}>
              {gain >= 0 ? '+' : ''}{gain.toFixed(1)} kg
            </span>
          </div>
        );
      },
      align: 'center' as const
    },
    { 
      header: 'Status Operacional', 
      accessor: (item: any) => {
         return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={`status-pill ${item.status === 'Ativo' ? 'active' : 'neutral'}`}>
              {item.status.toUpperCase()}
            </span>
          </div>
        );
      },
      align: 'center' as const
    }
  ];

  return (
    <div className="animal-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Beef size={14} fill="currentColor" />
            <span>TAUZE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Gestão do Rebanho</h1>
          <p className="page-subtitle">Inventário individualizado e controle de ativos biológicos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => navigate('/pecuaria/lote')}>
            <Tag size={18} />
            Lotes
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            Novo Animal
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats?.map((stat: any, idx: number) => (
          <TauzeStatCard 
            key={idx}
            {...stat}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'TODOS' ? 'active' : ''}`}
            onClick={() => { setActiveTab('TODOS'); setPage(1); }}
          >
            Todos Animais
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'ATIVO' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ATIVO'); setPage(1); }}
          >
            Ativos
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'ABATIDO' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ABATIDO'); setPage(1); }}
          >
            Abatidos
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Filtrar por brinco, raça ou lote..." 
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
                const menu = document.getElementById('export-menu-animals');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-animals" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-animals')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-animals')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-animals')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <AnimalFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {viewMode === 'list' ? (
          <ModernTable 
            emptyState={<EmptyState
              title="Nenhum animal cadastrado"
              description="Não há animais registrados para esta unidade. Inicie o controle do rebanho cadastrando o primeiro animal."
              actionLabel="Novo Animal"
              onAction={handleOpenCreate}
              icon={Beef}
            />}
            data={filteredAnimals}
            columns={tableColumns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            searchPlaceholder="Filtrar por brinco, raça ou lote..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => navigate(`/pecuaria/animal/${item.id}`)} title="Dossiê">
                  <Eye size={18} />
                </button>
                <button className="action-dot success" title="Manejos" onClick={() => { setManejoAnimal(item); setIsManejoModalOpen(true); }}>
                  <Activity size={18} />
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
          <div className="animal-cards-grid animate-fade-in">
            {filteredAnimals.length === 0 ? (
              <div 
                className="animal-card-premium" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '20px', 
                  textAlign: 'center', 
                  gap: '6px',
                  minHeight: '180px',
                  height: '100%',
                  boxShadow: 'none'
                }}
              >
                <div 
                  style={{ 
                    margin: 0, 
                    width: '40px', 
                    height: '40px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Beef size={22} style={{ color: 'hsl(var(--brand))' }} />
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}>
                  Nenhum animal cadastrado
                </h3>
                <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: '1.3', maxWidth: '260px' }}>
                  Não há animais registrados para esta unidade. Inicie o controle do rebanho cadastrando o primeiro animal.
                </p>
                <button 
                  className="primary-btn" 
                  onClick={handleOpenCreate}
                  style={{ fontSize: '10.5px', padding: '6px 12px', height: '30px', marginTop: '4px', minHeight: 'auto' }}
                >
                  <Plus size={12} />
                  <span>NOVO ANIMAL</span>
                </button>
              </div>
            ) : (
              filteredAnimals.map(a => {
              const statusStr = a.status || 'Ativo';
              let badgeClass = 'active'; // green
              let badgeText = statusStr.toUpperCase();
              let borderClass = 'active';
              
              if (a.isSanitaryBlocked) {
                borderClass = 'warning-badge';
              } else if (statusStr.toLowerCase() !== 'ativo') {
                badgeClass = 'stopped';
                badgeText = statusStr.toUpperCase();
                borderClass = 'danger-badge';
              }

              // Calcular idade em meses
              let ageText = 'Idade N/I';
              if (a.data_nascimento) {
                const months = Math.floor((new Date().getTime() - new Date(a.data_nascimento).getTime()) / (1000 * 3600 * 24 * 30.44));
                ageText = `${months}m`;
              }

              // Calcular performance (Ganho de peso)
              const currentWeight = a.peso_atual || a.peso_inicial || 0;
              const weightGain = currentWeight - (a.peso_inicial || 0);
              const performanceText = weightGain >= 0 ? `+${weightGain.toFixed(1)} kg` : `${weightGain.toFixed(1)} kg`;
              const isPositiveGain = weightGain >= 0;

              // Cor da barra de progresso inteligente com base no peso
              let progressGradient = 'linear-gradient(90deg, #f59e0b, #ef4444)'; // Bezerro/Leve (<350kg)
              if (currentWeight >= 350 && currentWeight <= 450) {
                progressGradient = 'linear-gradient(90deg, #6366f1, #3b82f6)'; // Recria
              } else if (currentWeight > 450) {
                progressGradient = 'linear-gradient(90deg, #10b981, #059669)'; // Engorda/Pronto
              }

              return (
                <div 
                  key={a.id} 
                  className={`animal-card-premium ${borderClass}`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      <Beef size={28} />
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn info" onClick={() => navigate(`/pecuaria/animal/${a.id}`)} title="Dossiê"><Eye size={14} /></button>
                      <button className="action-icon-btn success" onClick={() => { setManejoAnimal(a); setIsManejoModalOpen(true); }} title="Manejos" style={{ color: '#10b981' }}><Activity size={14} /></button>
                      <button className="action-icon-btn edit" onClick={() => handleOpenEdit(a)} title="Editar"><Edit3 size={14} /></button>
                      <button className="action-icon-btn delete" onClick={() => handleDelete(a.id)} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <div className="title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            #{a.brinco}
                            <span style={{ 
                              fontSize: '9px', 
                              padding: '2px 6px', 
                              borderRadius: '6px', 
                              background: a.sexo === 'M' ? 'rgba(59, 130, 246, 0.1)' : a.sexo === 'F' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(148, 163, 184, 0.1)', 
                              color: a.sexo === 'M' ? '#3b82f6' : a.sexo === 'F' ? '#ec4899' : '#64748b', 
                              fontWeight: 800 
                            }}>
                              {a.sexo === 'M' ? 'Macho' : a.sexo === 'F' ? 'Fêmea' : 'N/I'}
                            </span>
                          </h3>
                          <div className="card-type-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                            {a.raca || 'Nelore'} • {ageText} • <span style={{ color: 'hsl(var(--brand))' }}>{a.categoria || 'Recria'}</span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span className={`status-pill mini ${badgeClass}`} style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '5px' }}>
                            {badgeText}
                          </span>
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 800, 
                            color: isPositiveGain ? '#10b981' : '#ef4444', 
                            background: isPositiveGain ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            padding: '2px 6px',
                            borderRadius: '5px',
                            border: `1px solid ${isPositiveGain ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                          }}>
                            {performanceText}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card-occupation-section" style={{ margin: '4px 0' }}>
                      <div className="occ-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '2px' }}>
                        <span>PESO ATUAL</span>
                        <span style={{ color: 'hsl(var(--text-main))', fontWeight: 900 }}>{currentWeight} kg</span>
                      </div>
                      <div className="occ-bar-container" style={{ height: '6px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '2px' }}>
                        <div 
                          className="occ-bar-fill"
                          style={{ width: `${Math.min((currentWeight / 700) * 100, 100)}%`, background: progressGradient }}
                        />
                      </div>
                      <div className="occ-footer" style={{ fontSize: '9px', fontWeight: 800, color: a.isSanitaryBlocked ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {a.isSanitaryBlocked ? '⚠️ Carência Sanitária Ativa' : '✅ Sanitário OK'}
                      </div>
                    </div>

                    <div className="card-footer-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderTop: '1px dashed rgba(148, 163, 184, 0.15)', paddingTop: '4px' }}>
                      <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                        <Activity size={12} />
                        <span>Lote: {a.lote || 'N/A'}</span>
                      </div>
                      <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                        <TrendingUp size={12} />
                        <span className="card-farm-meta" style={{ color: '#10b981', fontWeight: 800 }}>{isGlobalMode ? 'Multi-Fazenda' : (activeFarm?.name || 'Fazenda 01')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
             })
            )}
            <button className="add-animal-card-premium" onClick={handleOpenCreate}>
              <Plus size={32} />
              <span>NOVO ANIMAL</span>
            </button>
          </div>
        )}
      </div>

      <AnimalForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedAnimal}
        loading={isSubmitting}
      />

      <QuickManejoModal
        isOpen={isManejoModalOpen}
        onClose={() => { setIsManejoModalOpen(false); setManejoAnimal(null); }}
        animal={manejoAnimal}
        activeTenantId={activeTenantId || ''}
        activeFarmId={activeFarmId || ''}
        insertPayload={insertPayload}
        onSuccess={() => { refresh(); }}
      />
      <style>{`
        .animal-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 8px;
        }

        @media (max-width: 1400px) {
          .animal-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .animal-cards-grid { grid-template-columns: 1fr; }
        }

        .animal-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          min-height: 180px;
          height: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          position: relative;
          text-align: left;
        }

        .animal-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: #94a3b8;
          transition: 0.3s;
        }

        .animal-card-premium.active::before {
          background: #10b981;
          box-shadow: 4px 0 15px rgba(16, 185, 129, 0.3);
        }

        .animal-card-premium.info-badge::before {
          background: #3b82f6;
          box-shadow: 4px 0 15px rgba(59, 130, 246, 0.3);
        }

        .animal-card-premium.warning-badge::before {
          background: #f59e0b;
          box-shadow: 4px 0 15px rgba(245, 158, 11, 0.3);
        }

        .animal-card-premium.danger-badge::before {
          background: #ef4444;
          box-shadow: 4px 0 15px rgba(239, 68, 68, 0.3);
        }

        .animal-card-premium:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.35);
        }

        .add-animal-card-premium {
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

        .add-animal-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-animal-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

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
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          border: 1px solid hsl(var(--border));
          margin-bottom: 8px;
        }

        .card-main-content {
          flex: 1;
          padding: 12px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-header-info .title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .card-header-info h3 {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .status-pill.mini {
          font-size: 9px;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .card-type-meta {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-occupation-section {
          margin: 4px 0;
        }

        .occ-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 2px;
          color: #64748b;
        }

        .occ-bar-container {
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 2px;
        }

        .occ-bar-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 3px;
          transition: 0.5s;
        }

        .occ-footer {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
        }

        .card-footer-meta {
          display: flex;
          gap: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }

        .card-farm-meta {
          color: #10b981;
          font-weight: 800;
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
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: hsl(var(--brand));
          color: white;
          border-color: hsl(var(--brand));
        }

        .action-icon-btn.delete:hover { background: #ef4444; border-color: #ef4444; }

        [data-theme='dark'] .card-left-section {
          background: hsl(var(--bg-card) / 0.3) !important;
          border-color: hsl(var(--border)) !important;
        }

        [data-theme='dark'] .card-avatar,
        [data-theme='dark'] .action-icon-btn {
          background: hsl(var(--bg-card)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }

        [data-theme='dark'] .action-icon-btn:hover {
          background: hsl(var(--brand)) !important;
          color: white !important;
        }

        [data-theme='dark'] .action-icon-btn.delete:hover {
          background: #ef4444 !important;
        }

        [data-theme='dark'] .animal-card-premium,
        [data-theme='dark'] .add-animal-card-premium {
          background: hsl(var(--bg-main)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }
      `}</style>
    </div>
  );
};

export default AnimalManagement;
