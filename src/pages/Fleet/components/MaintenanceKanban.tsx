import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Wrench, CheckCircle2, Calendar, History, Edit3, Trash2, ArrowRight } from 'lucide-react';
import { EmptyState } from '../../../components/Feedback/EmptyState';
import { MaintenanceStatus } from '../hooks/useMaintenanceData';

interface MaintenanceKanbanProps {
  orders: any[];
  searchTerm: string;
  onUpdateStatus: (orderId: string, status: MaintenanceStatus) => void;
  onOpenClosingPanel: (order: any) => void;
  onViewDetails: (order: any) => void;
  onEdit: (order: any) => void;
  onDelete: (id: string) => void;
  isUpdatingStatus: boolean;
}

export const MaintenanceKanban: React.FC<MaintenanceKanbanProps> = ({
  orders,
  searchTerm,
  onUpdateStatus,
  onOpenClosingPanel,
  onViewDetails,
  onEdit,
  onDelete,
  isUpdatingStatus
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const columns = [
    {
      title: '📌 Pendente',
      statusKeys: ['PENDING', 'open', 'ABERTA', 'pending'],
      nextStatus: 'IN_PROGRESS' as MaintenanceStatus,
      btnText: 'Iniciar Trabalho',
      color: '#f59e0b',
      emptyTitle: 'Nenhuma OS Pendente',
      emptyDesc: 'Não há ordens aguardando.',
      emptyIcon: Clock,
    },
    {
      title: '🛠️ Em Oficina',
      statusKeys: ['IN_PROGRESS', 'oficina', 'in_progress'],
      nextStatus: 'COMPLETED' as MaintenanceStatus,
      btnText: 'Finalizar OS',
      color: '#3b82f6',
      emptyTitle: 'Oficina Vazia',
      emptyDesc: 'Nenhum ativo em manutenção.',
      emptyIcon: Wrench,
    },
    {
      title: '✅ Concluída',
      statusKeys: ['COMPLETED', 'completed', 'CONCLUIDA', 'finalizada'],
      nextStatus: null,
      btnText: null,
      color: '#10b981',
      emptyTitle: 'Nenhuma OS Concluída',
      emptyDesc: 'As finalizadas aparecerão aqui.',
      emptyIcon: CheckCircle2,
    },
  ];

  const handleStatusTransition = (order: any, nextStatus: MaintenanceStatus) => {
    if (nextStatus === 'COMPLETED') {
      onOpenClosingPanel(order);
    } else {
      setUpdatingId(order.id);
      onUpdateStatus(order.id, nextStatus);
    }
  };

  return (
    <div className="kanban-board animate-fade-in tauze-kanban-grid">
      {columns.map((col) => {
        const colOrders = orders.filter((o) => {
          const currentStatus = o.status?.toUpperCase() || 'PENDING';
          return col.statusKeys.map((k) => k.toUpperCase()).includes(currentStatus);
        });

        return (
          <div key={col.title} className="kanban-column tauze-kanban-column">
            <div className="kanban-column-header" style={{ borderBottomColor: col.color }}>
              <h3>{col.title}</h3>
              <span className="kanban-badge" style={{ backgroundColor: col.color }}>
                {colOrders.length}
              </span>
            </div>

            <div className="kanban-column-body">
              <AnimatePresence>
                {colOrders.length === 0 ? (
                  <div className="kanban-empty">
                    <EmptyState
                      title={col.emptyTitle}
                      description={col.emptyDesc}
                      icon={col.emptyIcon}
                    />
                  </div>
                ) : (
                  colOrders.map((o) => {
                    const totalCost = Number(o.custo || 0);
                    const isUpdating = isUpdatingStatus && updatingId === o.id;

                    return (
                      <motion.div
                        key={o.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="kanban-card tauze-kanban-card"
                      >
                        <div className="kanban-card-header">
                          <span className="kanban-asset-name">
                            {o.maquinas?.nome || 'Equipamento'}
                          </span>
                          <span className={`kanban-type-badge ${o.tipo === 'preventiva' ? 'preventiva' : 'corretiva'}`}>
                            {o.tipo}
                          </span>
                        </div>

                        <p className="kanban-desc">
                          {o.descricao || 'Sem descrição'}
                        </p>

                        <div className="kanban-meta">
                          <span className="kanban-date">
                            <Calendar size={12} />
                            {o.data_inicio ? new Date(o.data_inicio).toLocaleDateString() : 'N/A'}
                          </span>
                          <span className="kanban-cost">
                            {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>

                        <div className="kanban-footer">
                          <div className="kanban-actions">
                            <button className="action-icon-btn info" onClick={() => onViewDetails(o)} title="Dossiê">
                              <History size={12} />
                            </button>
                            <button className="action-icon-btn edit" onClick={() => onEdit(o)} title="Editar">
                              <Edit3 size={12} />
                            </button>
                            <button className="action-icon-btn delete" onClick={() => onDelete(o.id)} title="Excluir">
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {col.nextStatus && (
                            <button
                              className="kanban-btn-next"
                              style={{ backgroundColor: col.title.includes('Pendente') ? '#f59e0b' : '#3b82f6' }}
                              disabled={isUpdating}
                              onClick={() => handleStatusTransition(o, col.nextStatus!)}
                            >
                              {isUpdating ? (
                                <div className="kanban-spinner" />
                              ) : (
                                <>
                                  <span>{col.btnText}</span>
                                  <ArrowRight size={10} />
                                </>
                              )}
                            </button>
                          )}

                          {!col.nextStatus && (
                            <span className="kanban-status-done">
                              <CheckCircle2 size={12} /> Pronto
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
};
