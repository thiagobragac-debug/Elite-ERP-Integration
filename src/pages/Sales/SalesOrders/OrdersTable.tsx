/**
 * OrdersTable Component - Table view for sales orders
 */

import React from 'react';
import { History, Edit3, Trash2, Calendar, TrendingUp, FileText } from 'lucide-react';
import { ModernTable } from '../../../components/DataTable/ModernTable';
import { EmptyState } from '../../../components/Feedback/EmptyState';
import type { SalesOrder } from './types';

interface OrdersTableProps {
  orders: SalesOrder[];
  loading: boolean;
  onViewHistory: (order: SalesOrder) => void;
  onEdit: (order: SalesOrder) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  loading,
  onViewHistory,
  onEdit,
  onDelete,
  onCreateNew,
}) => {
  const columns = [
    {
      header: 'Pedido / Código',
      accessor: (item: SalesOrder) => {
        const missingLogistics = !item.transportadora || !item.placa_veiculo || !item.numero_gta;
        return (
          <div
            className="table-cell-title text-left"
            style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
          >
            <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
              #{item.id?.slice(0, 8).toUpperCase()}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '2px' }}>
              {item.isHighRisk && (
                <span
                  className="status-pill danger"
                  style={{
                    fontSize: '8px',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    fontWeight: 900,
                  }}
                >
                  RISCO CRÉDITO
                </span>
              )}
              {missingLogistics && item.status !== 'delivered' && (
                <span
                  className="status-pill warning"
                  style={{
                    fontSize: '8px',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    fontWeight: 900,
                  }}
                >
                  DOCS PENDENTES
                </span>
              )}
            </div>
          </div>
        );
      },
      align: 'left' as const,
    },
    {
      header: 'Parceiro / Comprador',
      accessor: (item: SalesOrder) => (
        <div
          className="table-cell-title text-left"
          style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
        >
          <span className="main-text" style={{ fontWeight: 700, color: '#334155' }}>
            {item.parceiros?.nome || 'Não Informado'}
          </span>
          <span className="sub-meta uppercase font-bold text-[9px] tracking-wider text-slate-400">
            Classificação: {item.clientRating || 'B'}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Data da Ordem',
      accessor: (item: SalesOrder) => (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            color: '#475569',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <Calendar size={13} color="#94a3b8" />
            <span>{new Date(item.data_emissao).toLocaleDateString()}</span>
          </div>
          <span className="sub-meta" style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>
            Nº OS: {item.numero_pedido || 'N/A'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Transporte / GTA',
      accessor: (item: SalesOrder) => (
        <div
          className="table-cell-title"
          style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px' }}
        >
          {item.transportadora || item.numero_gta ? (
            <>
              <span
                className="main-text"
                style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}
              >
                {item.transportadora || 'Remessa Própria'}
              </span>
              <span
                className="sub-meta"
                style={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: '9px',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                }}
              >
                Placa: {item.placa_veiculo || 'N/A'} • GTA: {item.numero_gta || 'N/A'}
              </span>
            </>
          ) : (
            <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '11px' }}>
              Não Informado
            </span>
          )}
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Financeiro / Margem',
      accessor: (item: SalesOrder) => (
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}
        >
          <span
            className="main-text"
            style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}
          >
            {Number(item.valor_total).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              color: (item.margin || 0) > 20 ? '#059669' : '#d97706',
            }}
          >
            <TrendingUp size={10} /> {(item.margin || 0).toFixed(1)}% MARGEM
          </span>
        </div>
      ),
      align: 'right' as const,
    },
    {
      header: 'Status Operacional',
      accessor: (item: SalesOrder) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            className={`status-pill ${item.status === 'delivered' ? 'active' : item.status === 'pending' ? 'warning' : 'info'}`}
          >
            {item.status === 'delivered'
              ? 'Entregue'
              : item.status === 'pending'
                ? 'Pendente'
                : 'Processando'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <ModernTable
      emptyState={
        <EmptyState
          title="Nenhum pedido de venda"
          description="Nenhuma ordem comercial registrada para esta unidade. Inicie criando um novo pedido de venda."
          actionLabel="Novo Pedido"
          onAction={onCreateNew}
          icon={FileText}
        />
      }
      data={orders}
      columns={columns}
      loading={loading}
      hideHeader={true}
      actions={(item) => (
        <div className="modern-actions">
          <button className="action-dot info" onClick={() => onViewHistory(item)} title="Dossiê">
            <History size={18} />
          </button>
          <button className="action-dot edit" onClick={() => onEdit(item)} title="Editar">
            <Edit3 size={18} />
          </button>
          <button className="action-dot delete" onClick={() => onDelete(item.id)} title="Excluir">
            <Trash2 size={18} />
          </button>
        </div>
      )}
    />
  );
};
