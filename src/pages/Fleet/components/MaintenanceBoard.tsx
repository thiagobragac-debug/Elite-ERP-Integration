import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Clock, CheckCircle, Package, User } from 'lucide-react';
import { useFarmFilter } from '../../../hooks/useFarmFilter';

interface MaintenanceOrder {
  id: string;
  maquina_id: string;
  tipo: string;
  descricao: string;
  status: string;
  custo: number;
  responsavel: string;
  data_inicio: string;
  maquinas?: {
    nome: string;
    placa: string;
  };
}

export const MaintenanceBoard: React.FC = () => {
  const { activeTenantId, activeFarmId, isGlobalMode, applyFarmFilter } = useFarmFilter();
  const queryClient = useQueryClient();
  const [draggedItem, setDraggedItem] = useState<MaintenanceOrder | null>(null);
  const [boardData, setBoardData] = useState<{ [key: string]: MaintenanceOrder[] }>({
    AGENDADA: [],
    'EM ANDAMENTO': [],
    'AGUARDANDO PEÇAS': [],
    CONCLUIDO: [],
  });

  const columns = [
    { id: 'AGENDADA', label: 'Em Aberto', icon: Clock, color: '#3b82f6', bg: '#eff6ff' },
    { id: 'EM ANDAMENTO', label: 'Na Oficina', icon: Wrench, color: '#f59e0b', bg: '#fffbeb' },
    { id: 'AGUARDANDO PEÇAS', label: 'Aguardando Peças', icon: Package, color: '#f97316', bg: '#fff7ed' },
    { id: 'CONCLUIDO', label: 'Concluída', icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
  ];

  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ['maintenance_board', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      let q = supabase
        .from('manutencao_frota')
        .select(`
          *,
          maquinas(nome, placa)
        `)
        .eq('tenant_id', activeTenantId)
        .order('data_inicio', { ascending: false });
      
      q = applyFarmFilter(q);
      const { data, error } = await q;

      if (error) throw error;
      return data || [];
    },
    enabled: isGlobalMode ? !!activeTenantId : !!activeFarmId,
  });

  useEffect(() => {
    if (maintenanceData) {
      const grouped: { [key: string]: MaintenanceOrder[] } = {
        AGENDADA: [],
        'EM ANDAMENTO': [],
        'AGUARDANDO PEÇAS': [],
        CONCLUIDO: [],
      };

      maintenanceData.forEach((item: any) => {
        const s = (item.status || 'AGENDADA').toUpperCase();
        if (grouped[s]) {
          grouped[s].push(item);
        } else {
          // fallback
          grouped['AGENDADA'].push(item);
        }
      });

      setBoardData(grouped);
    }
  }, [maintenanceData]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('manutencao_frota')
        .update({ status })
        .eq('id', id)
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['maintenance_board', activeFarmId, activeTenantId, isGlobalMode] });
      // Optimistic update done via drag drop handler
    },
    onSuccess: () => {
      toast.success('Status da OS atualizado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['maintenance_board', activeFarmId, activeTenantId, isGlobalMode] });
    },
    onError: (err: any) => {
      toast.error(`Erro ao atualizar status: ${err.message}`);
      queryClient.invalidateQueries({ queryKey: ['maintenance_board', activeFarmId, activeTenantId, isGlobalMode] });
    },
  });

  const handleDragStart = (e: React.DragEvent, item: MaintenanceOrder) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    // set data to circumvent firefox issues
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const sourceStatus = (draggedItem.status || 'AGENDADA').toUpperCase();
    
    // Normalize target status
    let tStatus = targetStatus;
    if (targetStatus === 'AGUARDANDO PEÇAS') {
      tStatus = 'waiting_parts';
    } else if (targetStatus === 'CONCLUIDO') {
      tStatus = 'CONCLUIDO';
    } else if (targetStatus === 'EM ANDAMENTO') {
      tStatus = 'EM ANDAMENTO';
    } else {
      tStatus = 'AGENDADA';
    }

    if (sourceStatus !== targetStatus) {
      // Optimistic UI update
      setBoardData(prev => {
        const newSourceList = prev[sourceStatus].filter(i => i.id !== draggedItem.id);
        const newItem = { ...draggedItem, status: tStatus };
        const newTargetList = [newItem, ...prev[targetStatus]];
        return {
          ...prev,
          [sourceStatus]: newSourceList,
          [targetStatus]: newTargetList
        };
      });

      updateStatusMutation.mutate({ id: draggedItem.id, status: tStatus });
    }
    
    setDraggedItem(null);
  };

  if (isLoading) {
    return (
      <div className="maintenance-board loading" style={{ display: 'flex', gap: '24px', padding: '16px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, minWidth: '280px', height: '600px', background: 'hsl(var(--bg-main))', borderRadius: '16px', opacity: 0.5 }} className="skeleton-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="maintenance-board">
      {columns.map(col => (
        <div
          key={col.id}
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div className="kanban-column-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="col-icon" style={{ backgroundColor: col.bg, color: col.color }}>
                <col.icon size={16} />
              </div>
              <h3>{col.label}</h3>
            </div>
            <span className="count-badge">{boardData[col.id]?.length || 0}</span>
          </div>

          <div className="kanban-column-body">
            <AnimatePresence>
              {boardData[col.id]?.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="kanban-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, item)}
                >
                  <div className="card-top">
                    <span className="card-type" style={{ color: col.color, backgroundColor: col.bg }}>
                      {item.tipo || 'Geral'}
                    </span>
                    <span className="card-date">
                      {new Date(item.data_inicio).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <h4 className="card-title">{item.maquinas?.nome || 'Máquina Desconhecida'}</h4>
                  <p className="card-desc">{item.descricao || 'Sem descrição'}</p>
                  
                  <div className="card-footer">
                    <div className="user-info">
                      <User size={14} />
                      <span>{item.responsavel || 'Não def.'}</span>
                    </div>
                    {item.custo > 0 && (
                      <span className="cost-info">
                        {item.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {boardData[col.id]?.length === 0 && (
              <div className="kanban-empty">Arraste uma OS para cá</div>
            )}
          </div>
        </div>
      ))}

      <style>{`
        .maintenance-board {
          display: flex;
          gap: 24px;
          padding: 8px 16px;
          overflow-x: auto;
          min-height: calc(100vh - 280px);
          padding-bottom: 32px;
        }

        .kanban-column {
          flex: 1;
          min-width: 300px;
          display: flex;
          flex-direction: column;
          background: hsl(var(--bg-main));
          border-radius: 16px;
          border: 1px solid hsl(var(--border));
          overflow: hidden;
        }

        .kanban-column-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
        }

        .kanban-column-header h3 {
          font-size: 14px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin: 0;
        }

        .col-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .count-badge {
          background: hsl(var(--bg-main));
          color: hsl(var(--text-muted));
          font-size: 12px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
        }

        .kanban-column-body {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
        }

        .kanban-empty {
          text-align: center;
          color: hsl(var(--text-muted));
          font-size: 13px;
          font-weight: 600;
          border: 2px dashed hsl(var(--border));
          border-radius: 12px;
          padding: 32px 16px;
          margin-top: 8px;
        }

        .kanban-card {
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          padding: 16px;
          cursor: grab;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
        }

        .kanban-card:active {
          cursor: grabbing;
          transform: scale(0.98);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }

        .kanban-card:hover {
          border-color: hsl(var(--brand) / 0.5);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .card-type {
          font-size: 10px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .card-date {
          font-size: 11px;
          color: hsl(var(--text-muted));
          font-weight: 600;
        }

        .card-title {
          font-size: 14px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin: 0 0 6px 0;
        }

        .card-desc {
          font-size: 12px;
          color: hsl(var(--text-muted));
          margin: 0 0 16px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px dashed hsl(var(--border));
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: hsl(var(--text-muted));
        }

        .cost-info {
          font-size: 12px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }
      `}</style>
    </div>
  );
};
