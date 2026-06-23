/**
 * Accounts Payable Table Component
 * Displays the list of accounts with actions
 */

import React from 'react';
import { Check, FileText, Edit3, Trash2, Building2, CreditCard } from 'lucide-react';
import { ModernTable } from '../../../components/DataTable/ModernTable';
import { EmptyState } from '../../../components/Feedback/EmptyState';
import type { Account } from './types';

interface AccountsTableProps {
  bills: Account[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  selectedItems: (string | number)[];
  onSelectionChange: (ids: (string | number)[]) => void;
  onMarkAsPaid: (id: string) => void;
  onViewDetails: (bill: Account) => void;
  onEdit: (bill: Account) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export const AccountsTable: React.FC<AccountsTableProps> = ({
  bills,
  loading,
  totalCount,
  currentPage,
  onPageChange,
  itemsPerPage,
  selectedItems,
  onSelectionChange,
  onMarkAsPaid,
  onViewDetails,
  onEdit,
  onDelete,
  onCreateNew,
}) => {
  const columns = [
    {
      header: 'Vencimento',
      accessor: (item: Account) => {
        const dueDate = new Date(item.data_vencimento);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = diffDays < 0 && item.status === 'PENDENTE';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
            <span
              style={{
                color: isOverdue ? '#e11d48' : '#1e293b',
                fontWeight: 800,
                fontSize: '12px',
              }}
            >
              {dueDate.toLocaleDateString()}
            </span>
            {item.status === 'PENDENTE' && (
              <span
                className={`status-pill ${diffDays <= 0 ? 'danger' : 'info'}`}
                style={{ fontSize: '9px', padding: '2px 4px', width: 'fit-content' }}
              >
                {diffDays === 0
                  ? 'HOJE'
                  : diffDays < 0
                    ? `${Math.abs(diffDays)}d ATRASO`
                    : `${diffDays}d REST`}
              </span>
            )}
          </div>
        );
      },
      align: 'left' as const,
    },
    {
      header: 'Identificação Título',
      accessor: (item: Account) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 700, color: '#1e293b' }}>
            {item.descricao || 'Sem descrição'}
          </span>
          <span
            className="sub-meta"
            style={{
              color: '#94a3b8',
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            DOC: {item.id?.slice(0, 8).toUpperCase() || 'N/A'}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Parceiro / Credor',
      accessor: (item: Account) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#334155',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          <Building2 size={14} color="#94a3b8" />
          <span>{item.parceiros?.nome || item.parceiro || 'Geral'}</span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Categoria & Método',
      accessor: (item: Account) => (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              textTransform: 'uppercase',
            }}
          >
            {item.categoria || 'Geral'}
          </span>
          <span
            className="sub-meta"
            style={{
              color: '#94a3b8',
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {item.metodo_pagamento || 'Boleto'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Valor Bruto BRL',
      accessor: (item: Account) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>
            {Number(item.valor_total).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Situação',
      accessor: (item: Account) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            className={`status-pill ${item.status === 'PAGO' ? 'active' : item.status === 'ATRASADO' ? 'danger' : 'warning'}`}
          >
            {item.status}
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
          title="Nenhuma conta a pagar"
          description="Não há obrigações financeiras registradas para esta unidade. Registre uma nova conta para iniciar o controle de pagamentos."
          actionLabel="Nova Conta"
          onAction={onCreateNew}
          icon={CreditCard}
        />
      }
      data={bills}
      columns={columns}
      loading={loading}
      hideHeader={true}
      totalCount={totalCount}
      currentPage={currentPage}
      onPageChange={onPageChange}
      itemsPerPage={itemsPerPage}
      selectable={true}
      isSelectable={(item) => item.status !== 'PAGO'}
      selectedItems={selectedItems}
      onSelectionChange={(ids) => {
        const selectableIds = bills.filter((b) => b.status !== 'PAGO').map((b) => b.id);
        const onlySelectableSelected = ids.filter((id) => selectableIds.includes(id as string));
        onSelectionChange(onlySelectableSelected);
      }}
      actions={(item) => (
        <div className="modern-actions">
          {item.status === 'PENDENTE' && (
            <button
              className="action-dot success"
              onClick={() => onMarkAsPaid(item.id)}
              title="Liquidar"
            >
              <Check size={18} />
            </button>
          )}
          <button className="action-dot info" onClick={() => onViewDetails(item)} title="Dossiê">
            <FileText size={18} />
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
