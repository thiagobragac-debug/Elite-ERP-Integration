import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  CheckCircle,
  Tag,
  Filter,
  Edit3,
  Edit2,
  Calendar,
  Megaphone,
  Percent,
  Ticket,
} from 'lucide-react';
import { EmptyState } from '../../../../components/Feedback/EmptyState';
import { ModernTable } from '../../../../components/DataTable/ModernTable';
import { filterCampaigns } from '../utils/saasFilters';
import { ExportDropdown } from '../../../../components/UI/ExportDropdown';
import { TauzeStatCard } from '../../../../components/Cards/TauzeStatCard';

interface CampaignsTabProps {
  campaignsList: any[];
  campaignsLoading: boolean;
  campaignsViewMode: 'grid' | 'list';
  setCampaignsViewMode: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSelectedCampaign: (campaign: any) => void;
  setIsCampaignModalOpen: (open: boolean) => void;
  filterValues: any;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  handleExport: (format: 'csv' | 'excel' | 'pdf') => void;
  totalCount: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
}

export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  campaignsList,
  campaignsLoading,
  campaignsViewMode,
  setCampaignsViewMode,
  searchQuery,
  setSearchQuery,
  setSelectedCampaign,
  setIsCampaignModalOpen,
  filterValues,
  showAdvancedFilters,
  setShowAdvancedFilters,
  handleExport,
  totalCount,
  page,
  setPage,
  pageSize,
}) => {
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filterValues.status && filterValues.status !== 'all') count++;
    if (filterValues.minDiscount > 0 || filterValues.maxDiscount < 100) count++;
    if (filterValues.dateStart || filterValues.dateEnd) count++;
    return count;
  }, [filterValues]);

  const filteredCampaigns = filterCampaigns(campaignsList, searchQuery, filterValues);

  // --- STATS CALCULATION ---
  const activeCampaignsCount = campaignsList.filter(c => c.is_active && new Date(c.end_date) >= new Date()).length;
  const averageDiscount = campaignsList.length > 0 
    ? campaignsList.reduce((sum, c) => sum + (Number(c.discount_percentage) || 0), 0) / campaignsList.length
    : 0;
  const totalUses = campaignsList.reduce((sum, c) => sum + (Number(c.current_uses) || 0), 0);
  // -------------------------

  const [localStatusFilter, setLocalStatusFilter] = React.useState<'all' | 'active' | 'paused' | 'expired'>('all');

  const filteredCampaignsFinal = React.useMemo(() => {
    let list = filteredCampaigns;
    if (localStatusFilter !== 'all') {
      list = list.filter((camp: any) => {
        const isExpired = new Date(camp.end_date) < new Date();
        const isActive = camp.is_active && !isExpired;
        if (localStatusFilter === 'active') return isActive;
        if (localStatusFilter === 'expired') return isExpired;
        if (localStatusFilter === 'paused') return !camp.is_active && !isExpired;
        return true;
      });
    }
    return list;
    // Dependência em filteredCampaigns garante que filtros externos + localStatusFilter são aplicados
  }, [filteredCampaigns, localStatusFilter]);

  const campaignColumns = [
    {
      header: 'Campanha',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={16} color="#f59e0b" />
          <span className="main-text" style={{ fontWeight: 800, color: 'hsl(var(--text-main))' }}>
            {item.name}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Desconto',
      accessor: (item: any) => (
        <span style={{ color: '#00b865', fontWeight: 800 }}>
          {item.discount_percentage}% OFF
        </span>
      ),
      align: 'left' as const,
    },
    {
      header: 'Status',
      accessor: (item: any) => {
        const isExpired = new Date(item.end_date) < new Date();
        const isActive = item.is_active && !isExpired;
        return (
          <span
            className={`status-pill ${isActive ? 'active' : 'neutral'}`}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            {isActive ? 'ATIVA' : isExpired ? 'EXPIRADA' : 'PAUSADA'}
          </span>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Início',
      accessor: (item: any) => (
        <span style={{ color: 'hsl(var(--text-main))', fontWeight: 600 }}>
          {new Date(item.start_date).toLocaleDateString('pt-BR')}
        </span>
      ),
      align: 'center' as const,
    },
    {
      header: 'Fim',
      accessor: (item: any) => (
        <span style={{ color: 'hsl(var(--text-main))', fontWeight: 600 }}>
          {new Date(item.end_date).toLocaleDateString('pt-BR')}
        </span>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ width: '100%' }}
    >
      <div
        className="dashboard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        <TauzeStatCard
          label="Total de Campanhas"
          value={campaignsList.length.toString()}
          icon={Megaphone}
          color="hsl(var(--brand))"
        />
        <TauzeStatCard
          label="Campanhas Ativas"
          value={activeCampaignsCount.toString()}
          icon={CheckCircle}
          color="#10b981"
        />
        <TauzeStatCard
          label="Desconto Médio"
          value={`${averageDiscount.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
          icon={Percent}
          color="#f59e0b"
        />
        <TauzeStatCard
          label="Total de Utilizações"
          value={totalUses.toString()}
          icon={Ticket}
          color="#3b82f6"
        />
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          {(['all', 'active', 'paused', 'expired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setLocalStatusFilter(status)}
              className={`tauze-tab-item ${localStatusFilter === status ? 'active' : ''}`}
            >
              {status === 'all' ? 'Todas' : status === 'active' ? 'Ativas' : status === 'paused' ? 'Pausadas' : 'Expiradas'}
            </button>
          ))}
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Buscar por nome da campanha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle">
          <button
            className={`view-btn ${campaignsViewMode === 'list' ? 'active' : ''}`}
            onClick={() => setCampaignsViewMode('list')}
            title="Visualização em Lista"
          >
            <ListIcon size={18} />
          </button>
          <button
            className={`view-btn ${campaignsViewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setCampaignsViewMode('grid')}
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
            style={{ position: 'relative' }}
          >
            <Filter size={20} />
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                background: 'hsl(var(--brand))',
                color: 'white',
                fontSize: '10px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                lineHeight: '1',
                pointerEvents: 'none',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <ExportDropdown onExport={handleExport} />
        </div>
      </div>

      <div className="management-content">
        {campaignsViewMode === 'list' ? (
          <ModernTable
            data={filteredCampaignsFinal}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            columns={campaignColumns}
            loading={campaignsLoading}
            emptyState={
              <EmptyState
                title="Nenhuma campanha encontrada"
                description="Não há campanhas que correspondam aos filtros atuais."
                icon={Search}
              />
            }
            onRowClick={(item: any) => {
              setSelectedCampaign(item);
              setIsCampaignModalOpen(true);
            }}
            actions={(item: any) => (
              <div className="modern-actions">
                <button
                  className="action-dot edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCampaign(item);
                    setIsCampaignModalOpen(true);
                  }}
                  title="Editar"
                >
                  <Edit3 size={18} />
                </button>
              </div>
            )}
          />
        ) : (
          <div className="user-cards-grid">
            {filteredCampaignsFinal.map((camp) => {
              const isExpired = new Date(camp.end_date) < new Date();
              const isActive = camp.is_active && !isExpired;

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={camp.id}
                  className={`tenant-card-premium ${isActive ? 'active' : 'stopped'}`}
                  onClick={() => {
                    setSelectedCampaign(camp);
                    setIsCampaignModalOpen(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="tenant-card-left-section">
                    <div
                      className="tenant-card-avatar"
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                      }}
                    >
                      <Tag size={24} />
                    </div>
                    <div className="tenant-card-bottom-actions">
                      <button
                        className="tenant-action-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCampaign(camp);
                          setIsCampaignModalOpen(true);
                        }}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="tenant-card-main-content">
                    <div className="tenant-card-header-info">
                      <h3>{camp.name}</h3>
                      <span
                        className={`status-pill ${isActive ? 'active' : 'neutral'}`}
                        style={{
                          fontSize: '10px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {isActive ? 'ATIVA' : isExpired ? 'EXPIRADA' : 'PAUSADA'}
                      </span>
                    </div>

                    <div style={{ margin: '12px 0' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: '#00b865',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Desconto: {camp.discount_percentage}% OFF
                      </span>
                    </div>

                    <div
                      className="tenant-card-meta-grid"
                      style={{
                        marginTop: 'auto',
                        paddingTop: '12px',
                        borderTop: '1px dashed hsl(var(--border))',
                        display: 'flex',
                        gap: '16px',
                      }}
                    >
                      <div
                        className="tenant-meta-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-muted))',
                        }}
                      >
                        <Calendar size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                        Início: {new Date(camp.start_date).toLocaleDateString('pt-BR')}
                      </div>
                      <div
                        className="tenant-meta-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'hsl(var(--text-muted))',
                        }}
                      >
                        <Calendar size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                        Fim: {new Date(camp.end_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      {filteredCampaignsFinal.length === 0 && campaignsViewMode === 'grid' && (
        <EmptyState
          title="Nenhuma campanha encontrada"
          description="Não há campanhas que correspondam aos filtros atuais."
          actionLabel="Nova Campanha"
          onAction={() => {
            setSelectedCampaign(null);
            setIsCampaignModalOpen(true);
          }}
          icon={Tag}
        />
      )}
    </motion.div>
  );
};
