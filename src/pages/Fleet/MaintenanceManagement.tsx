import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePersistentState } from '../../hooks/usePersistentState';
import {
  Search, Plus, Filter, FileText, List as ListIcon, LayoutGrid, Settings, Wrench, Calendar, Truck
} from 'lucide-react';

import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { MaintenanceFilterModal } from './components/MaintenanceFilterModal';
import { FormModal } from '../../components/Forms/FormModal'; // Assuming generic form modal
import { MaintenanceKanban } from './components/MaintenanceKanban';
import { MaintenanceKPIs } from './components/MaintenanceKPIs';
import { OSClosingPanel } from './components/OSClosingPanel';
import { useMaintenanceData, MaintenanceStatus } from './hooks/useMaintenanceData';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';

export const MaintenanceManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'ACTIVE' | 'HISTORY' | 'PLANS') || 'ACTIVE';
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('MaintenanceManagement_showAdvancedFilters', false);
  const [filterValues, setFilterValues] = useState<any>({
    status: 'all', types: [], dateStart: '', dateEnd: '', maxCost: 1000000,
  });

  const { orders, loading, page, pageSize, totalCount, setPage, saveOrder, isSaving, updateStatus, isUpdatingStatus, deleteOrder } = useMaintenanceData(filterValues, activeTab, searchTerm);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [isClosingPanelOpen, setIsClosingPanelOpen] = useState(false);
  const [closingOrder, setClosingOrder] = useState<any>(null);

  const handleOpenCreate = () => { setSelectedOrder(null); setIsModalOpen(true); };
  const handleOpenEdit = (order: any) => { setSelectedOrder(order); setIsModalOpen(true); };
  const handleDelete = (id: string) => { if (window.confirm('Excluir OS?')) deleteOrder(id); }; // Minimalist for now, ideally useConfirm
  const handleViewDetails = (order: any) => { console.log("View details", order); }; // To be implemented or restored

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = orders.map((item: any) => ({
      Data: item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A',
      Maquina: (item.maquinas as any)?.nome || 'Ativo',
      Tipo: item.tipo,
      Descricao: item.descricao,
      Responsavel: item.responsavel,
      Custo_Total: item.custo || 0,
      Status: item.status,
    }));
    if (format === 'csv') exportToCSV(exportData, 'log_manutencao');
    else if (format === 'excel') exportToExcel(exportData, 'log_manutencao');
    else if (format === 'pdf') exportToPDF(exportData, 'log_manutencao', 'Relatório de Manutenção');
  };

  const handleConfirmCloseOS = async (data: { orderId: string, finalCost: number, closingDate: string, horometroFinal: number, responsavel: string }) => {
    saveOrder({ 
      id: data.orderId, 
      custo: data.finalCost, 
      data_fim: data.closingDate,
      responsavel: data.responsavel,
      status: 'COMPLETED' 
    }, {
      onSuccess: () => {
        setIsClosingPanelOpen(false);
        setClosingOrder(null);
      }
    });
  };

  return (
    <div className="maintenance-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Máquina & Frota', href: '/frota/dashboard' }, { label: 'Manutenções' }]} />
          <h1 className="page-title">Manutenções</h1>
          <p className="page-subtitle">Rastreabilidade completa de intervenções mecânicas, revisões preventivas e custos.</p>
        </div>
        <div className="page-actions">
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} /> NOVA ORDEM
          </button>
        </div>
      </header>

      <MaintenanceKPIs orders={orders} loading={loading} />

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button className={`tauze-tab-item ${activeTab === 'ACTIVE' ? 'active' : ''}`} onClick={() => setActiveTab('ACTIVE')}>OS Ativas</button>
          <button className={`tauze-tab-item ${activeTab === 'HISTORY' ? 'active' : ''}`} onClick={() => setActiveTab('HISTORY')}>Histórico</button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Buscar por máquina, descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle" style={{ display: 'flex', background: 'hsl(var(--bg-main))', padding: '4px', borderRadius: '12px', gap: '4px', margin: '0 16px' }}>
          <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? 'hsl(var(--bg-card))' : 'transparent', color: viewMode === 'list' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))', cursor: 'pointer' }}>
            <ListIcon size={18} />
          </button>
          <button className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: viewMode === 'kanban' ? 'hsl(var(--bg-card))' : 'transparent', color: viewMode === 'kanban' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))', cursor: 'pointer' }}>
            <LayoutGrid size={18} />
          </button>
        </div>

        <div className="tauze-filter-group">
          <button className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`} onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" onClick={() => handleExport('excel')}>
            <FileText size={20} />
          </button>
        </div>
      </div>

      <MaintenanceFilterModal isOpen={showAdvancedFilters} onClose={() => setShowAdvancedFilters(false)} filters={filterValues} setFilters={setFilterValues} />

      <div className="management-content">
        {viewMode === 'kanban' ? (
          <MaintenanceKanban 
            orders={orders} 
            searchTerm={searchTerm} 
            onUpdateStatus={updateStatus}
            onOpenClosingPanel={(o) => { setClosingOrder(o); setIsClosingPanelOpen(true); }}
            onViewDetails={handleViewDetails}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            isUpdatingStatus={isUpdatingStatus}
          />
        ) : (
          <ModernTable
            data={orders}
            columns={[
              { header: 'Máquina', accessor: (item: any) => <span className="main-text">{item.maquinas?.nome}</span>, align: 'left' },
              { header: 'Tipo', accessor: (item: any) => <span className="sub-meta">{item.tipo}</span>, align: 'left' },
              { header: 'Data', accessor: (item: any) => <span className="sub-meta">{item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A'}</span>, align: 'center' },
              { header: 'Custo', accessor: (item: any) => <span className="main-text">{(Number(item.custo) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>, align: 'right' },
            ]}
            loading={loading}
            emptyState={<EmptyState title="Nenhuma OS" description="Não há registros." icon={Wrench} />}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot edit" onClick={() => handleOpenEdit(item)}><Edit3 size={18} /></button>
                <button className="action-dot delete" onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
              </div>
            )}
          />
        )}
      </div>

      <OSClosingPanel 
        isOpen={isClosingPanelOpen} 
        order={closingOrder} 
        onClose={() => { setIsClosingPanelOpen(false); setClosingOrder(null); }}
        onConfirm={handleConfirmCloseOS}
        isSaving={isSaving}
      />
    </div>
  );
};
