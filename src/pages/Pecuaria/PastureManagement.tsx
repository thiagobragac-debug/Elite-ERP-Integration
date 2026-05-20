import React, { useState, useEffect } from 'react';
import { 
  Trees, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  FileText, 
  Map, 
  LayoutGrid, 
  List as ListIcon,
  Maximize2,
  Edit3,
  Trash2,
  Activity,
  History,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportData } from '../../hooks/useReportData';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { PastureFilterModal } from './components/PastureFilterModal';
import { PastureForm } from '../../components/Forms/PastureForm';
import { supabase } from '../../lib/supabase';

const PastureManagement: React.FC = () => {
  const { activeTenantId, activeFarmId, canCreate, insertPayload, activeFarm, isGlobalMode } = useFarmFilter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPasture, setSelectedPasture] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [activeTab, setActiveTab] = useState<'all' | 'resting' | 'occupied'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    capins: [] as string[],
    minArea: 0,
    maxArea: 500,
    minUA: 0,
    maxUA: 100,
    needsFertilization: false
  });

  const handleOpenCreate = () => {
    setSelectedPasture(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (pasture: any) => {
    setSelectedPasture(pasture);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este pasto?')) return;
    
    // Optimistic delete
    setLocalPastures(prev => prev.filter(p => p.id !== id));

    try {
      const { error } = await supabase.from('pastos').delete().eq('id', id);
      if (error) throw error;
      refresh();
    } catch (err: any) {
      console.warn('DB delete failed, using local fallback state:', err.message);
    }
  };

  const handleSubmit = async (data: any) => {
    const payload = {
      nome: data.nome,
      area: parseFloat(data.area) || 0,
      capacidade_ua: parseFloat(data.capacidade_ua) || 2.5,
      tipo_capim: data.tipo_capim,
      status: data.status || 'free',
      data_ultima_fertilizacao: data.data_ultima_fertilizacao || null,
      topografia: data.topografia,
      tipo_solo: data.tipo_solo,
      agua: data.agua,
      observacoes: data.observacoes,
      estado_cerca: data.estado_cerca || 'Bom',
      sombreamento: data.sombreamento || 'Natural',
      plantas_daninhas: data.plantas_daninhas || 'Baixa',
      fazenda_id: data.fazenda_id || activeFarmId,
      tenant_id: activeTenantId
    };

    if (selectedPasture) {
      // Optimistic update
      setLocalPastures(prev => prev.map(p => p.id === selectedPasture.id ? { 
        ...p, 
        ...payload,
        area: `${payload.area} ha`,
      } : p));
      
      try {
        const { error } = await supabase
          .from('pastos')
          .update(payload)
          .eq('id', selectedPasture.id);
        if (error) throw error;
      } catch (err: any) {
        console.warn('DB update failed, using local fallback state:', err.message);
      }
    } else {
      const mockNewId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11);
      const newPasture = {
        id: mockNewId,
        ...payload,
        area: `${payload.area} ha`,
        lotacao: '0.00 UA',
        created_at: new Date().toISOString()
      };
      // Optimistic insert
      setLocalPastures(prev => [newPasture, ...prev]);

      try {
        const { error } = await supabase.from('pastos').insert([payload]);
        if (error) throw error;
      } catch (err: any) {
        console.warn('DB insert failed, using local fallback state:', err.message);
      }
    }
    setIsFormOpen(false);
    refresh();
  };

  const { 
    data: fetchedPastures = [], 
    stats, 
    loading, 
    error, 
    totalCount,
    refresh 
  } = useReportData('pastagens', { page, pageSize });

  const [localPastures, setLocalPastures] = useState<any[]>([]);

  useEffect(() => {
    if (fetchedPastures && fetchedPastures.length > 0) {
      setLocalPastures(fetchedPastures);
    }
  }, [fetchedPastures]);

  const filteredPastures = localPastures.filter(p => {
    const matchesSearch = p.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Parse values safely
    const lotacaoVal = parseFloat(p.lotacao) || 0;
    const areaVal = parseFloat(p.area) || 0;
    
    // Tab Filter
    let matchesTab = true;
    if (activeTab === 'resting') {
      matchesTab = (p.status || '').toLowerCase() === 'resting' || (p.status || '').toLowerCase() === 'descanso' || lotacaoVal === 0;
    } else if (activeTab === 'occupied') {
      matchesTab = lotacaoVal > 0 && (p.status || '').toLowerCase() !== 'resting' && (p.status || '').toLowerCase() !== 'descanso';
    }

    // Status Filter
    let matchesStatus = true;
    if (filterValues.status !== 'all') {
      const statusValue = (p.status || '').toLowerCase();
      if (filterValues.status === 'occupied') {
        matchesStatus = lotacaoVal > 0 || statusValue === 'occupied' || statusValue === 'grazing';
      } else if (filterValues.status === 'resting') {
        matchesStatus = statusValue === 'resting' || statusValue === 'descanso' || (lotacaoVal === 0 && statusValue !== 'free');
      } else if (filterValues.status === 'free') {
        matchesStatus = statusValue === 'free' || statusValue === 'vazio' || lotacaoVal === 0;
      }
    }

    // Forrageiras/Capim Filter
    const matchesCapim = filterValues.capins.length === 0 || filterValues.capins.includes(p.tipo_capim);

    // Area Filter
    const matchesArea = areaVal >= filterValues.minArea && areaVal <= filterValues.maxArea;

    // UA Filter
    const matchesUA = lotacaoVal >= filterValues.minUA && lotacaoVal <= filterValues.maxUA;

    // Fertilization Filter
    let matchesFertilization = true;
    if (filterValues.needsFertilization) {
      if (p.data_ultima_fertilizacao) {
        const lastFert = new Date(p.data_ultima_fertilizacao);
        const diffDays = (new Date().getTime() - lastFert.getTime()) / (1000 * 60 * 60 * 24);
        matchesFertilization = diffDays > 90 || p.needs_fertilization === true;
      } else {
        matchesFertilization = true;
      }
    }

    return matchesSearch && matchesTab && matchesStatus && matchesCapim && matchesArea && matchesUA && matchesFertilization;
  });

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = localPastures.map(p => ({
      Nome: p.nome,
      Area: p.area,
      Lotacao: p.lotacao
    }));

    if (format === 'csv') exportToCSV(exportData, 'relatorio_pastagens');
    else if (format === 'excel') exportToExcel(exportData, 'relatorio_pastagens');
    else if (format === 'pdf') exportToPDF(exportData, 'relatorio_pastagens', 'Gestão de Pastagens');
  };

  const tableColumns = [
    { 
      header: 'Identificação do Pasto', 
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 700, color: '#1e293b' }}>{item.nome}</span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            Área: {item.area || 0} ha
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Forrageira / Capim',
      accessor: (item: any) => {
        let fertDays = -1;
        if (item.data_ultima_fertilizacao) {
            fertDays = Math.floor((new Date().getTime() - new Date(item.data_ultima_fertilizacao).getTime()) / (1000 * 3600 * 24));
        }
        const needsFert = item.needs_fertilization || (fertDays > 120);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
            <span className="main-text" style={{ fontWeight: 600, color: '#334155' }}>{item.tipo_capim || 'Não informado'}</span>
            <span className="sub-meta" style={{ 
              fontWeight: 700, 
              fontSize: '9px', 
              letterSpacing: '0.05em', 
              textTransform: 'uppercase', 
              color: needsFert ? '#f43f5e' : '#64748b' 
            }}>
              {fertDays >= 0 ? `${fertDays} dias sem adubo` : 'Sem adubação'}
            </span>
          </div>
        );
      },
      align: 'left' as const
    },
    {
      header: 'Solo & Relevo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
            {item.tipo_solo || 'Solo: N/A'}
          </span>
          <span className="sub-meta" style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
            {item.topografia || 'Relevo: N/A'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Água / Acesso',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ 
            padding: '2px 8px', 
            borderRadius: '6px', 
            fontSize: '11px', 
            fontWeight: 800,
            background: item.agua ? '#eff6ff' : '#f8fafc',
            color: item.agua ? '#3b82f6' : '#94a3b8',
            border: `1px solid ${item.agua ? '#bfdbfe' : '#e2e8f0'}`
          }}>
            {item.agua || 'N/A'}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    { 
      header: 'Lotação & Pressão', 
      accessor: (item: any) => {
        const uas = parseFloat(item.lotacao || '0');
        const area = parseFloat(item.area || '1');
        const density = area > 0 ? (uas / area).toFixed(2) : '0';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#0f172a' }}>
              <Activity size={14} color="#6366f1" />
              <span>{uas} UA</span>
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {density} UA/ha
            </span>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Status Pastejo',
      accessor: (item: any) => {
        const uas = parseFloat(item.lotacao || '0');
        const area = parseFloat(item.area || '1');
        const density = parseFloat(area > 0 ? (uas / area).toFixed(2) : '0');
        
        let status = 'Ideal';
        let color = 'success';
        if (uas === 0) {
            status = 'Descanso';
            color = 'info';
        } else if (density > 3.0) {
            status = 'Superlotação';
            color = 'danger';
        } else if (density > 2.0) {
            status = 'Atenção';
            color = 'warning';
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span className={`status-pill ${color === 'danger' ? 'danger' : color === 'warning' ? 'warning' : color === 'info' ? 'info' : 'success'}`}>
              {status}
            </span>
            {item.status && <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.status}</span>}
          </div>
        );
      },
      align: 'center' as const
    }
  ];

  if (error) {
    console.error("[PastureManagement] Error:", error);
  }

  return (
    <div className="pasture-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Trees size={14} fill="currentColor" />
            <span>ELITE AGRO v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Pastagens</h1>
          <p className="page-subtitle">Monitoramento de capacidade de suporte, pressão de pastejo e rotação.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={refresh}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            Novo Pasto
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats?.map((stat: any, idx: number) => (
          <EliteStatCard 
            key={idx} 
            {...stat} 
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Todos Pastos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'resting' ? 'active' : ''}`}
            onClick={() => setActiveTab('resting')}
          >
            Em Descanso
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'occupied' ? 'active' : ''}`}
            onClick={() => setActiveTab('occupied')}
          >
            Em Uso
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por nome do piquete..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <ListIcon size={18} />
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        <div className="elite-filter-group">
          <button 
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="Filtros Avançados"
          >
            <Filter size={20} />
          </button>
          <div className="export-dropdown-container">
            <button 
              className="icon-btn-secondary"
              onClick={() => {
                const menu = document.getElementById('export-menu-pasture');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-pasture" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-pasture')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-pasture')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-pasture')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <div className="management-content">
        {localPastures.length === 0 && !loading ? (
          <EmptyState
            title="Nenhum pasto cadastrado"
            description="Não há áreas de pastagem registradas. Comece cadastrando seus piquetes para monitorar a lotação."
            actionLabel="Novo Pasto"
            onAction={handleOpenCreate}
            icon={Trees}
          />
        ) : viewMode === 'list' ? (
          <ModernTable 
            data={filteredPastures}
            columns={tableColumns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" title="Mapa"><Maximize2 size={18} /></button>
                <button className="action-dot success" title="Histórico"><History size={18} /></button>
                <button className="action-dot edit" title="Editar" onClick={() => handleOpenEdit(item)}><Edit3 size={18} /></button>
                <button className="action-dot delete" title="Excluir" onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
              </div>
            )}
          />
        ) : (
          <div className="pasture-cards-grid animate-fade-in">
            {filteredPastures.map((p) => {
              const uas = parseFloat(p.lotacao || '0');
              const area = parseFloat(p.area || '0');
              const capacityUa = p.capacidade_ua || 2.5;
              const maxUa = area * capacityUa;
              const occupancyPercent = maxUa > 0 ? (uas / maxUa) * 100 : 0;
              
              let badgeClass = 'active'; // green
              let badgeText = 'IDEAL';
              let borderClass = 'active';
              
              if (uas === 0) {
                badgeClass = 'info-badge';
                badgeText = 'DESCANSO';
                borderClass = 'info-badge';
              } else if (occupancyPercent > 100) {
                badgeClass = 'stopped';
                badgeText = 'SUPERLOTAÇÃO';
                borderClass = 'danger-badge';
              } else if (occupancyPercent > 80) {
                badgeClass = 'warning-badge';
                badgeText = 'ATENÇÃO';
                borderClass = 'warning-badge';
              }

              return (
                <div 
                  key={p.id} 
                  className={`pasture-card-premium ${borderClass}`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      <Trees size={28} />
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn" title="Editar" onClick={() => handleOpenEdit(p)}><Edit3 size={14} /></button>
                      <button className="action-icon-btn delete" title="Excluir" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <div className="title-row">
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>{p.nome}</h3>
                        <span className={`status-pill mini ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>
                      <div className="card-type-meta">{p.tipo_capim || 'Capim Padrão'}</div>
                    </div>

                    <div className="card-occupation-section">
                      <div className="occ-header">
                        <span>OCUPAÇÃO ATUAL</span>
                        <span className={occupancyPercent > 100 ? 'critical' : ''}>
                          {Math.round(occupancyPercent)}%
                        </span>
                      </div>
                      <div className="occ-bar-container">
                        <div 
                          className={`occ-bar-fill ${occupancyPercent > 100 ? 'critical' : occupancyPercent > 80 ? 'warning' : ''}`}
                          style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        />
                      </div>
                      <div className="occ-footer">
                        {uas.toFixed(2)} / {maxUa > 0 ? maxUa.toFixed(2) : '∞'} UA
                      </div>
                    </div>

                    <div className="card-footer-meta">
                      <div className="meta-item">
                        <Map size={12} />
                        <span>{area.toFixed(2)} ha</span>
                      </div>
                      <div className="meta-item">
                        <Activity size={12} />
                        <span className="card-farm-meta">{isGlobalMode ? 'Multi-Fazenda' : (activeFarm?.name || 'Fazenda 01')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <button className="add-pasture-card-premium" onClick={handleOpenCreate}>
              <Plus size={32} />
              <span>NOVO PASTO</span>
            </button>
          </div>
        )}
      </div>

      <PastureFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <PastureForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedPasture}
      />
      <style>{`
        .pasture-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 8px;
        }

        @media (max-width: 1400px) {
          .pasture-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .pasture-cards-grid { grid-template-columns: 1fr; }
        }

        .pasture-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          height: 180px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          position: relative;
          text-align: left;
        }

        .pasture-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: #94a3b8;
          transition: 0.3s;
        }

        .pasture-card-premium.active::before {
          background: #10b981;
          box-shadow: 4px 0 15px rgba(16, 185, 129, 0.3);
        }

        .pasture-card-premium.info-badge::before {
          background: #3b82f6;
          box-shadow: 4px 0 15px rgba(59, 130, 246, 0.3);
        }

        .pasture-card-premium.warning-badge::before {
          background: #f59e0b;
          box-shadow: 4px 0 15px rgba(245, 158, 11, 0.3);
        }

        .pasture-card-premium.danger-badge::before {
          background: #ef4444;
          box-shadow: 4px 0 15px rgba(239, 68, 68, 0.3);
        }

        .pasture-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
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
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          border: 1px solid hsl(var(--border));
          margin-bottom: 12px;
        }

        .card-main-content {
          flex: 1;
          padding: 16px 20px;
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
          font-size: 17px;
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
          margin: 10px 0;
        }

        .occ-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 4px;
          color: #64748b;
        }

        .occ-header .critical { color: #ef4444; }

        .occ-bar-container {
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .occ-bar-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 3px;
          transition: 0.5s;
        }

        .occ-bar-fill.warning { background: #f59e0b; }
        .occ-bar-fill.critical { background: #ef4444; }

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
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 12px;
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

        .add-pasture-card-premium {
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
          height: 180px;
        }

        .add-pasture-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-pasture-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

        [data-theme='dark'] .pasture-card-premium,
        [data-theme='dark'] .add-pasture-card-premium {
          background: hsl(var(--bg-main)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }

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
      `}</style>
    </div>
  );
};

export default PastureManagement;
