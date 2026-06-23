import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { Lock, Unlock, Calendar, AlertTriangle } from 'lucide-react';
import { ModernTable } from '../../components/DataTable/ModernTable';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { DateInput } from '../../components/Form/DateInput';

const AutoBlockDateCell: React.FC<{ row: any; updateMutation: any }> = ({
  row,
  updateMutation,
}) => {
  const [value, setValue] = useState(row.data_bloqueio_automatico || '');

  React.useEffect(() => {
    setValue(row.data_bloqueio_automatico || '');
  }, [row.data_bloqueio_automatico]);

  const isLocked = value && new Date() >= new Date(`${value}T00:00:00`);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <DateInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value !== (row.data_bloqueio_automatico || '')) {
            updateMutation.mutate({ mes: row.mes, dateStr: value, id: row.id });
          }
        }}
        className="tauze-input"
        style={{
          height: '32px',
          minHeight: '32px',
          width: '140px',
          fontSize: '12px',
          borderColor: isLocked && row.status !== 'FECHADO' ? 'hsl(var(--warning))' : undefined,
          background: isLocked && row.status !== 'FECHADO' ? 'hsl(var(--warning)/0.1)' : undefined,
        }}
        disabled={row.status === 'FECHADO'}
      />
      {isLocked && row.status !== 'FECHADO' && (
        <span title="Bloqueado por prazo" style={{ color: 'hsl(var(--warning))', display: 'flex' }}>
          <Lock size={14} />
        </span>
      )}
    </div>
  );
};

export const PeriodManagementTab: React.FC<any> = () => {
  const { tenant } = useTenant();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['periodos_contabeis', tenant?.id, selectedYear],
    queryFn: async () => {
      if (!tenant?.id) {
        return [];
      }
      const { data, error } = await supabase
        .from('periodos_contabeis')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('ano', selectedYear);
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: !!tenant?.id,
  });

  const togglePeriodMutation = useMutation({
    mutationFn: async ({
      mes,
      status,
      id,
    }: {
      mes: number;
      status: 'ABERTO' | 'FECHADO';
      id?: string;
    }) => {
      if (id) {
        const { error } = await supabase
          .from('periodos_contabeis')
          .update({
            status,
            fechado_em: status === 'FECHADO' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('periodos_contabeis').insert([
          {
            tenant_id: tenant!.id,
            ano: selectedYear,
            mes,
            status,
            fechado_em: status === 'FECHADO' ? new Date().toISOString() : null,
          },
        ]);
        if (error) {
          throw error;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['periodos_contabeis'] });
      toast.success(
        variables.status === 'FECHADO'
          ? 'Período Fechado com sucesso!'
          : 'Período Reaberto com sucesso!'
      );
    },
    onError: (err: any) => {
      console.error('Erro no togglePeriodMutation:', err);
      toast.error(`Erro ao alterar o status do período: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updateAutoBlockDateMutation = useMutation({
    mutationFn: async ({ mes, dateStr, id }: { mes: number; dateStr: string; id?: string }) => {
      if (id) {
        const { error } = await supabase
          .from('periodos_contabeis')
          .update({
            data_bloqueio_automatico: dateStr || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('periodos_contabeis').insert([
          {
            tenant_id: tenant!.id,
            ano: selectedYear,
            mes,
            status: 'ABERTO',
            data_bloqueio_automatico: dateStr || null,
          },
        ]);
        if (error) {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos_contabeis'] });
      toast.success('Data de bloqueio atualizada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro no updateAutoBlockDateMutation:', err);
      toast.error(`Erro ao salvar data de bloqueio: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const handleToggle = async (mes: number, currentStatus: 'ABERTO' | 'FECHADO', id?: string) => {
    const newStatus = currentStatus === 'ABERTO' ? 'FECHADO' : 'ABERTO';
    if (newStatus === 'FECHADO') {
      const isConfirmed = await confirm({
        title: 'Fechar Período Contábil',
        description: `Deseja realmente FECHAR o mês ${mes}/${selectedYear}? Nenhuma movimentação financeira ou de estoque poderá ser criada, alterada ou excluída neste período.`,
        confirmText: 'Sim, Fechar Mês',
        cancelText: 'Cancelar',
        variant: 'danger',
      });
      if (!isConfirmed) {
        return;
      }
    } else {
      const isConfirmed = await confirm({
        title: 'Atenção: Reabrir Período',
        description: `CUIDADO! Deseja realmente REABRIR o mês ${mes}/${selectedYear}? Isso permitirá edições que podem alterar relatórios contábeis passados.`,
        confirmText: 'Sim, Reabrir',
        cancelText: 'Cancelar',
        variant: 'danger',
      });
      if (!isConfirmed) {
        return;
      }
    }
    togglePeriodMutation.mutate({ mes, status: newStatus, id });
  };

  const gridData = months.map((m) => {
    const period = periods.find((p) => p.mes === m.value);
    return {
      mes: m.value,
      label: m.label,
      id: period?.id,
      status: period?.status || 'ABERTO',
      fechado_em: period?.fechado_em,
      data_bloqueio_automatico: period?.data_bloqueio_automatico || '',
    };
  });

  const columns = [
    {
      header: 'Mês',
      accessor: (row: any) => <span style={{ fontWeight: 600 }}>{row.label}</span>,
      width: '150px',
    },
    {
      header: 'Status Contábil',
      accessor: (row: any) => {
        const isAutoLocked =
          row.data_bloqueio_automatico &&
          new Date() >= new Date(`${row.data_bloqueio_automatico}T00:00:00`);
        const isManualClosed = row.status === 'FECHADO';
        const effectiveStatus = isManualClosed ? 'FECHADO' : isAutoLocked ? 'BLOQUEADO' : 'ABERTO';

        return (
          <span
            className={`status-chip ${effectiveStatus !== 'ABERTO' ? 'danger' : 'success'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}
          >
            {effectiveStatus !== 'ABERTO' ? <Lock size={14} /> : <Unlock size={14} />}
            {effectiveStatus}
          </span>
        );
      },
      width: '180px',
    },
    {
      header: 'Data de Fechamento',
      accessor: (row: any) => {
        const isAutoLocked =
          row.data_bloqueio_automatico &&
          new Date() >= new Date(`${row.data_bloqueio_automatico}T00:00:00`);
        const isManualClosed = row.status === 'FECHADO';

        let dateStr = '-';
        if (isManualClosed && row.fechado_em) {
          dateStr = new Date(row.fechado_em).toLocaleDateString('pt-BR');
        } else if (isAutoLocked && row.data_bloqueio_automatico) {
          dateStr = new Date(`${row.data_bloqueio_automatico}T00:00:00`).toLocaleDateString(
            'pt-BR'
          );
        }

        return (
          <span style={{ color: 'hsl(var(--text-muted))' }}>
            {dateStr}{' '}
            {isAutoLocked && !isManualClosed && (
              <span
                style={{
                  fontSize: '10px',
                  color: 'hsl(var(--warning))',
                  marginLeft: '4px',
                  fontWeight: 600,
                }}
              >
                (SISTEMA)
              </span>
            )}
          </span>
        );
      },
    },
    {
      header: 'Bloqueio Automático',
      accessor: (row: any) => (
        <AutoBlockDateCell row={row} updateMutation={updateAutoBlockDateMutation} />
      ),
    },
  ];

  return (
    <div className="tab-content-wrapper animate-slide-up">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>
          Gestão de Períodos Contábeis
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
            Ano Base:
          </span>
          <select
            className="tauze-input"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ width: '120px' }}
          >
            {[...Array(14)].map((_, i) => {
              const year = new Date().getFullYear() - 10 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <main className="hub-content" style={{ padding: 0 }}>
        <ModernTable
          data={gridData}
          columns={columns}
          loading={isLoading}
          itemsPerPage={12}
          actions={(row: any) => {
            const isAutoLocked =
              row.data_bloqueio_automatico &&
              new Date() >= new Date(`${row.data_bloqueio_automatico}T00:00:00`);
            const isManualClosed = row.status === 'FECHADO';
            const effectiveStatus = isManualClosed
              ? 'FECHADO'
              : isAutoLocked
                ? 'BLOQUEADO'
                : 'ABERTO';

            return (
              <button
                className={`icon-btn-secondary ${effectiveStatus !== 'ABERTO' ? '' : 'danger-hover'}`}
                onClick={() => {
                  if (isAutoLocked && !isManualClosed) {
                    updateAutoBlockDateMutation.mutate({ mes: row.mes, dateStr: '', id: row.id });
                  } else {
                    handleToggle(row.mes, row.status, row.id);
                  }
                }}
                style={{
                  color: effectiveStatus !== 'ABERTO' ? 'hsl(var(--brand))' : '#ef4444',
                  borderColor: effectiveStatus !== 'ABERTO' ? 'hsl(var(--border))' : '#fee2e2',
                  background: effectiveStatus !== 'ABERTO' ? 'white' : '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  width: '120px',
                  justifyContent: 'center',
                }}
              >
                {effectiveStatus !== 'ABERTO' ? (
                  <>
                    <Unlock size={14} /> Reabrir
                  </>
                ) : (
                  <>
                    <Lock size={14} /> Fechar
                  </>
                )}
              </button>
            );
          }}
        />
      </main>
    </div>
  );
};
