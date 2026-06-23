/**
 * OrdersKanban Component - Kanban board view for sales orders
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Edit3,
  Trash2,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { EmptyState } from '../../../components/Feedback/EmptyState';
import type { SalesOrder } from './types';

interface OrdersKanbanProps {
  orders: SalesOrder[];
  updatingStatus: string | null;
  onViewHistory: (order: SalesOrder) => void;
  onEdit: (order: SalesOrder) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: 'pending' | 'delivered' | 'canceled') => void;
}

export const OrdersKanban: React.FC<OrdersKanbanProps> = ({
  orders,
  updatingStatus,
  onViewHistory,
  onEdit,
  onDelete,
  onUpdateStatus,
}) => {
  const renderKanbanCard = (order: SalesOrder, index: number) => {
    const isUpdating = updatingStatus === order.id;
    return (
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="premium-card"
        style={{
          padding: '16px',
          background: 'hsl(var(--bg-card))',
          borderRadius: '16px',
          border: order.isHighRisk
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid hsl(var(--border))',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
        }}
      >
        {isUpdating && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(0,0,0,0.1)',
                borderTopColor: 'hsl(var(--brand))',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
              #{order.id?.slice(0, 8).toUpperCase()}
            </span>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
              OS: {order.numero_pedido || 'N/A'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {order.isHighRisk && (
              <span
                className="status-pill danger"
                style={{
                  fontSize: '8px',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  fontWeight: 950,
                }}
              >
                RISCO CRÉDITO
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h4
            style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}
          >
            {order.parceiros?.nome || 'Parceiro Não Informado'}
          </h4>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'hsl(var(--text-muted))',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Calendar size={12} />
            <span>{new Date(order.data_pedido).toLocaleDateString()}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '4px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
              {Number(order.valor_total).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 950,
                color: (order.margin || 0) > 20 ? '#10b981' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <TrendingUp size={10} /> {(order.margin || 0).toFixed(0)}% MARGEM
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderTop: '1px solid hsl(var(--border))',
            paddingTop: '10px',
            marginTop: '4px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="action-dot info"
              onClick={() => onViewHistory(order)}
              title="Dossiê"
              style={{ width: '28px', height: '28px' }}
            >
              <History size={14} />
            </button>
            <button
              className="action-dot edit"
              onClick={() => onEdit(order)}
              title="Editar"
              style={{ width: '28px', height: '28px' }}
            >
              <Edit3 size={14} />
            </button>
            <button
              className="action-dot delete"
              onClick={() => onDelete(order.id)}
              title="Excluir"
              style={{ width: '28px', height: '28px' }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {order.status === 'pending' && (
              <>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => onUpdateStatus(order.id, 'delivered')}
                  title="Faturar e Entregar"
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    borderRadius: '8px',
                    background: '#10b981',
                    border: 'none',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <CheckCircle2 size={12} />
                  Entregar
                </button>
                <button
                  type="button"
                  className="glass-btn secondary"
                  onClick={() => onUpdateStatus(order.id, 'canceled')}
                  title="Cancelar Pedido"
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    borderRadius: '8px',
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    height: '28px',
                  }}
                >
                  Cancelar
                </button>
              </>
            )}

            {order.status === 'delivered' && (
              <span
                className="status-pill active"
                style={{
                  fontSize: '8px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontWeight: 900,
                }}
              >
                ✓ ENTREGUE
              </span>
            )}

            {order.status === 'canceled' && (
              <button
                type="button"
                className="glass-btn secondary"
                onClick={() => onUpdateStatus(order.id, 'pending')}
                title="Reabrir Pedido"
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  borderRadius: '8px',
                  height: '28px',
                }}
              >
                Reabrir
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const canceledOrders = orders.filter((o) => o.status === 'canceled');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        minHeight: '500px',
        width: '100%',
      }}
    >
      {/* Coluna 1: Pendentes */}
      <div
        style={{
          background: 'hsl(var(--bg-main)/0.2)',
          borderRadius: '24px',
          border: '1px solid hsl(var(--border))',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid hsl(var(--border))',
            paddingBottom: '10px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'hsl(var(--warning))',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📌 Pendentes
          </span>
          <span
            className="status-pill warning"
            style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 900 }}
          >
            {pendingOrders.length}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            flex: 1,
            maxHeight: '600px',
          }}
        >
          {pendingOrders.length === 0 ? (
            <div style={{ padding: '20px 0' }}>
              <EmptyState
                title="Nenhum pedido pendente"
                description="Não há pedidos aguardando."
                icon={Clock}
              />
            </div>
          ) : (
            <AnimatePresence>
              {pendingOrders.map((order, idx) => renderKanbanCard(order, idx))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Coluna 2: Entregues */}
      <div
        style={{
          background: 'hsl(var(--bg-main)/0.2)',
          borderRadius: '24px',
          border: '1px solid hsl(var(--border))',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid hsl(var(--border))',
            paddingBottom: '10px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🚚 Entregues
          </span>
          <span
            className="status-pill active"
            style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 900 }}
          >
            {deliveredOrders.length}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            flex: 1,
            maxHeight: '600px',
          }}
        >
          {deliveredOrders.length === 0 ? (
            <div style={{ padding: '20px 0' }}>
              <EmptyState
                title="Nenhum pedido entregue"
                description="Pedidos faturados aparecerão aqui."
                icon={CheckCircle2}
              />
            </div>
          ) : (
            <AnimatePresence>
              {deliveredOrders.map((order, idx) => renderKanbanCard(order, idx))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Coluna 3: Cancelados */}
      <div
        style={{
          background: 'hsl(var(--bg-main)/0.2)',
          borderRadius: '24px',
          border: '1px solid hsl(var(--border))',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid hsl(var(--border))',
            paddingBottom: '10px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ❌ Cancelados
          </span>
          <span
            className="status-pill danger"
            style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 900 }}
          >
            {canceledOrders.length}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            flex: 1,
            maxHeight: '600px',
          }}
        >
          {canceledOrders.length === 0 ? (
            <div style={{ padding: '20px 0' }}>
              <EmptyState
                title="Nenhum cancelamento"
                description="Histórico de cancelamentos vazio."
                icon={AlertTriangle}
              />
            </div>
          ) : (
            <AnimatePresence>
              {canceledOrders.map((order, idx) => renderKanbanCard(order, idx))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
