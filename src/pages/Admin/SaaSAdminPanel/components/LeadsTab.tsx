import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Trash2,
  CheckCircle,
  MessageSquare,
  Archive,
  Inbox,
  Filter,
  FileText,
  User,
  Mail,
  Phone,
  Building,
  TrendingUp,
  List,
  LayoutGrid,
  GripVertical,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ModernTable } from '../../../../components/DataTable/ModernTable';
import { EmptyState } from '../../../../components/Feedback/EmptyState';
import { useConfirm } from '../../../../contexts/ConfirmContext';
import { TauzeStatCard } from '../../../../components/Cards/TauzeStatCard';
import { ExportDropdown } from '../../../../components/UI/ExportDropdown';

const WhatsAppIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 16, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    style={style}
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 1.981 14.119.957 11.49.957c-5.442 0-9.87 4.372-9.874 9.802-.002 1.73.465 3.424 1.353 4.947l-.994 3.634 3.728-.977zm11.306-6.862c-.32-.16-1.89-.932-2.185-1.042-.295-.11-.51-.16-.725.16-.215.32-.832 1.042-1.02 1.262-.188.22-.376.24-.696.08-.32-.16-1.353-.499-2.577-1.59-1.084-.967-1.817-2.161-2.03-2.522-.213-.36-.024-.556.156-.717.162-.145.32-.32.48-.48.16-.16.213-.27.32-.45.106-.18.053-.34-.027-.5-.08-.16-.725-1.748-.993-2.39-.262-.619-.53-.53-.725-.53-.188 0-.403-.02-.618-.02s-.564.08-.86.4c-.295.32-1.127 1.102-1.127 2.688 0 1.587 1.155 3.12 1.316 3.34 1.6 2.213 2.013 2.113 4.12 3.113 1.144.542 2.19.432 3.01.31.914-.137 2.812-1.148 3.208-2.259.396-1.11.396-2.06.277-2.26-.118-.2-.43-.36-.75-.52z"/>
  </svg>
);

const getPrevStatus = (status: string): 'Pendente' | 'Contatado' | 'Convertido' | 'Arquivado' => {
  if (status === 'Contatado') return 'Pendente';
  if (status === 'Convertido') return 'Contatado';
  if (status === 'Arquivado') return 'Convertido';
  return 'Pendente';
};

const getNextStatus = (status: string): 'Pendente' | 'Contatado' | 'Convertido' | 'Arquivado' => {
  if (status === 'Pendente') return 'Contatado';
  if (status === 'Contatado') return 'Convertido';
  if (status === 'Convertido') return 'Arquivado';
  return 'Arquivado';
};

const formatWhatsAppLink = (phone: string, name: string, company: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const finalPhone = cleanPhone.length === 11 || cleanPhone.length === 10 ? `55${cleanPhone}` : cleanPhone;
  const message = encodeURIComponent(`Olá ${name}, agradecemos seu contato no Tauze ERP${company ? ` em nome da empresa ${company}` : ''}. Como posso te ajudar hoje?`);
  return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${message}`;
};

interface LeadsTabProps {
  leadsList: any[];
  leadsLoading: boolean;
  handleDeleteLead: (id: string) => Promise<void>;
  handleUpdateLeadStatus: (id: string, newStatus: string) => Promise<void>;
  handleExport: (format: 'csv' | 'excel' | 'pdf') => void;
  viewMode: 'table' | 'kanban';
  setViewMode: (mode: 'table' | 'kanban') => void;
}

export const LeadsTab: React.FC<LeadsTabProps> = ({
  leadsList,
  leadsLoading,
  handleDeleteLead,
  handleUpdateLeadStatus,
  handleExport,
  viewMode,
  setViewMode,
}) => {
  const { confirm } = useConfirm();
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pendente' | 'Contatado' | 'Convertido' | 'Arquivado'>('all');

  // Stats calculation
  const stats = useMemo(() => {
    const total = leadsList.length;
    const pending = leadsList.filter((l) => l.status === 'Pendente').length;
    const contacted = leadsList.filter((l) => l.status === 'Contatado').length;
    const converted = leadsList.filter((l) => l.status === 'Convertido').length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
    return { total, pending, contacted, converted, conversionRate };
  }, [leadsList]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leadsList.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const lowerSearch = localSearch.toLowerCase();
      const matchesSearch =
        lead.name?.toLowerCase().includes(lowerSearch) ||
        lead.email?.toLowerCase().includes(lowerSearch) ||
        lead.phone?.toLowerCase().includes(lowerSearch) ||
        lead.company_name?.toLowerCase().includes(lowerSearch) ||
        lead.notes?.toLowerCase().includes(lowerSearch);

      return matchesStatus && matchesSearch;
    });
  }, [leadsList, statusFilter, localSearch]);

  const columns = [
    {
      header: 'Nome do Lead',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'hsl(var(--brand) / 0.15)',
                color: 'hsl(var(--brand))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {item.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="main-text" style={{ fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                {item.name}
              </span>
              {item.company_name && (
                <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Building size={12} />
                  <span>{item.company_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Contato',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'hsl(var(--text-main))' }}>
            <Mail size={13} style={{ color: 'hsl(var(--text-muted) / 0.7)' }} />
            <span>{item.email}</span>
          </div>
          {item.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              <Phone size={12} style={{ color: 'hsl(var(--text-muted) / 0.7)' }} />
              <span>{item.phone}</span>
              <a
                href={formatWhatsAppLink(item.phone, item.name, item.company_name || '')}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25d3661c',
                  color: '#25d366',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '9px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  marginLeft: '6px',
                  border: '1px solid #25d36622',
                  transition: 'background 0.2s',
                }}
                title="Conversar no WhatsApp"
              >
                <WhatsAppIcon size={10} style={{ marginRight: '2px' }} /> WA
              </a>
            </div>
          )}
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Mensagem / Observação',
      accessor: (item: any) => (
        <div
          style={{
            maxWidth: '300px',
            fontSize: '12px',
            color: 'hsl(var(--text-main) / 0.85)',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: '1.4',
          }}
        >
          {item.notes || <span style={{ fontStyle: 'italic', color: 'hsl(var(--text-muted) / 0.5)' }}>Sem observações</span>}
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Data de Envio',
      accessor: (item: any) => (
        <span style={{ color: 'hsl(var(--text-main))', fontWeight: 600, fontSize: '13px' }}>
          {new Date(item.created_at).toLocaleString('pt-BR')}
        </span>
      ),
      align: 'center' as const,
    },
    {
      header: 'Status',
      accessor: (item: any) => {
        let pillClass = 'neutral';
        let label = item.status;
        if (item.status === 'Pendente') pillClass = 'warning';
        if (item.status === 'Contatado') pillClass = 'info';
        if (item.status === 'Convertido') pillClass = 'success';
        if (item.status === 'Arquivado') pillClass = 'neutral';

        return (
          <span
            className={`status-pill ${pillClass}`}
            style={{ fontSize: '11px', padding: '4px 10px', fontWeight: 700 }}
          >
            {label?.toUpperCase()}
          </span>
        );
      },
      align: 'center' as const,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Cards de Métricas de Leads */}
      <div className="next-gen-kpi-grid">
        <TauzeStatCard
          label="Total de Leads"
          value={stats.total}
          icon={Inbox}
          color="hsl(var(--brand))"
        />
        <TauzeStatCard
          label="Pendentes"
          value={stats.pending}
          icon={Inbox}
          color="#f59e0b"
        />
        <TauzeStatCard
          label="Contatados"
          value={stats.contacted}
          icon={MessageSquare}
          color="#3b82f6"
        />
        <TauzeStatCard
          label="Taxa de Conversão"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          color="#10b981"
          change={`${stats.converted} convertidos`}
        />
      </div>

      {/* Controles de Busca e Filtros */}
      <div className="tauze-controls-row">
        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Buscar leads por nome, email, fazenda..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        {/* Abas Rápidas de Filtro de Status */}
        <div className="tauze-tab-group">
          {(['all', 'Pendente', 'Contatado', 'Convertido', 'Arquivado'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`tauze-tab-item ${statusFilter === status ? 'active' : ''}`}
            >
              {status === 'all' ? 'Todos' : status}
            </button>
          ))}
        </div>

        <div className="tauze-filter-group">
          <ExportDropdown onExport={handleExport} />
        </div>

        {/* Alternador de Visualização Tabela / Kanban */}
        <div className="view-mode-toggle" style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setViewMode('table')}
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            title="Visualização em Tabela"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            title="Painel Kanban"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Lista de Leads */}
      {viewMode === 'kanban' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {(['Pendente', 'Contatado', 'Convertido', 'Arquivado'] as const).map((status) => {
            const columnLeads = filteredLeads.filter((l) => l.status === status);
            let statusColor = '#f59e0b';
            if (status === 'Contatado') statusColor = '#3b82f6';
            if (status === 'Convertido') statusColor = '#10b981';
            if (status === 'Arquivado') statusColor = '#64748b';

            return (
              <div
                key={status}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  const leadId = e.dataTransfer.getData('leadId');
                  if (leadId) {
                    handleUpdateLeadStatus(leadId, status);
                  }
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid hsl(var(--border) / 0.4)',
                  borderRadius: '16px',
                  padding: '16px',
                  minHeight: '450px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Cabeçalho da Coluna */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                    <span style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: 'hsl(var(--text-muted))', background: 'hsl(var(--bg-main) / 0.1)', padding: '2px 8px', borderRadius: '8px' }}>
                    {columnLeads.length}
                  </span>
                </div>

                {/* Lista de Cartões */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
                  {columnLeads.length === 0 ? (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: '120px', border: '1px dashed hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--text-muted) / 0.5)', fontSize: '11px', textAlign: 'center', padding: '16px' }}>
                      Nenhum lead nesta etapa.<br/>Arraste um lead para cá.
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        layout
                        draggable
                        onDragStart={(e: any) => {
                          e.dataTransfer?.setData('leadId', lead.id);
                        }}
                        style={{
                          background: 'hsl(var(--bg-card))',
                          border: '1px solid hsl(var(--border) / 0.6)',
                          borderRadius: '12px',
                          padding: '14px',
                          cursor: 'grab',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                        whileHover={{ scale: 1.02, borderColor: statusColor }}
                      >
                        {/* Nome do Lead */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div title="Arraste para mover" style={{ display: 'flex' }}>
                              <GripVertical size={14} style={{ color: 'hsl(var(--text-muted) / 0.4)', cursor: 'grab' }} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>{lead.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              const isConfirmed = await confirm({
                                title: 'Excluir Lead',
                                description: 'Tem certeza que deseja excluir permanentemente este lead?',
                                confirmText: 'Excluir',
                                variant: 'danger',
                              });
                              if (isConfirmed) {
                                handleDeleteLead(lead.id);
                              }
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'hsl(var(--danger))', opacity: 0.5, cursor: 'pointer', padding: 0 }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                            title="Excluir Lead"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Empresa/Fazenda */}
                        {lead.company_name && (
                          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building size={12} />
                            <span>{lead.company_name}</span>
                          </div>
                        )}

                        {/* Detalhes de Contato */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: 'hsl(var(--text-muted))', borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: '6px', marginTop: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            <Mail size={11} style={{ flexShrink: 0 }} />
                            <span>{lead.email}</span>
                          </div>
                          {lead.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={11} style={{ flexShrink: 0 }} />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Observações */}
                        {lead.notes && (
                          <p style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', background: 'hsl(var(--bg-main) / 0.1)', padding: '6px 8px', borderRadius: '6px', margin: 0, wordBreak: 'break-all' }}>
                            {lead.notes.length > 80 ? `${lead.notes.substring(0, 80)}...` : lead.notes}
                          </p>
                        )}

                        {/* Ações do Cartão */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: '6px' }}>
                          <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted) / 0.6)', fontWeight: 600 }}>
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {lead.phone && (
                              <a
                                href={formatWhatsAppLink(lead.phone, lead.name, lead.company_name || '')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-btn"
                                style={{
                                  background: '#25d3661c',
                                  color: '#25d366',
                                  border: '1px solid #25d36633',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  textDecoration: 'none',
                                }}
                                title="Falar no WhatsApp"
                              >
                                <MessageCircle size={12} />
                              </a>
                            )}
                            {status !== 'Pendente' && (
                              <button
                                onClick={() => handleUpdateLeadStatus(lead.id, getPrevStatus(status))}
                                style={{ background: 'hsl(var(--bg-main) / 0.1)', border: 'none', borderRadius: '6px', color: 'hsl(var(--text-main))', padding: '2px 6px', fontSize: '9px', cursor: 'pointer' }}
                                title="Mover para coluna anterior"
                              >
                                <ChevronLeft size={10} />
                              </button>
                            )}
                            {status !== 'Arquivado' && (
                              <button
                                onClick={() => handleUpdateLeadStatus(lead.id, getNextStatus(status))}
                                style={{ background: 'hsl(var(--bg-main) / 0.1)', border: 'none', borderRadius: '6px', color: 'hsl(var(--text-main))', padding: '2px 6px', fontSize: '9px', cursor: 'pointer' }}
                                title="Mover para próxima coluna"
                              >
                                <ChevronRight size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="management-content">
          <ModernTable
            data={filteredLeads}
            columns={columns}
            loading={leadsLoading}
            itemsPerPage={10}
            actions={(item: any) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                {item.status === 'Pendente' && (
                  <button
                    className="action-btn"
                    title="Marcar como Contatado"
                    onClick={() => handleUpdateLeadStatus(item.id, 'Contatado')}
                    style={{
                      color: '#3b82f6',
                      background: '#3b82f61a',
                      border: '1px solid #3b82f633',
                      padding: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: '0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3b82f633';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3b82f61a';
                    }}
                  >
                    <MessageSquare size={16} />
                  </button>
                )}

                {(item.status === 'Pendente' || item.status === 'Contatado') && (
                  <button
                    className="action-btn"
                    title="Marcar como Convertido"
                    onClick={() => handleUpdateLeadStatus(item.id, 'Convertido')}
                    style={{
                      color: '#10b981',
                      background: '#10b9811a',
                      border: '1px solid #10b98133',
                      padding: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: '0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#10b98133';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#10b9811a';
                    }}
                  >
                    <CheckCircle size={16} />
                  </button>
                )}

                {item.status !== 'Arquivado' && (
                  <button
                    className="action-btn"
                    title="Arquivar Lead"
                    onClick={() => handleUpdateLeadStatus(item.id, 'Arquivado')}
                    style={{
                      color: 'hsl(var(--text-muted))',
                      background: 'hsl(var(--bg-main) / 0.1)',
                      border: '1px solid hsl(var(--border))',
                      padding: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: '0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--bg-main) / 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--bg-main) / 0.1)';
                    }}
                  >
                    <Archive size={16} />
                  </button>
                )}

                <button
                  className="action-btn danger"
                  title="Excluir Lead"
                  onClick={async () => {
                    const isConfirmed = await confirm({
                      title: 'Excluir Lead',
                      description: 'Tem certeza que deseja excluir permanentemente este lead?',
                      confirmText: 'Excluir',
                      variant: 'danger',
                    });
                    if (isConfirmed) {
                      handleDeleteLead(item.id);
                    }
                  }}
                  style={{
                    color: 'hsl(var(--danger))',
                    background: 'hsl(var(--danger) / 0.1)',
                    border: '1px solid hsl(var(--danger) / 0.2)',
                    padding: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'hsl(var(--danger) / 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'hsl(var(--danger) / 0.1)';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          />
        </div>
      )}
    </motion.div>
  );
};
