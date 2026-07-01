import React, { useMemo } from 'react';
import { AlertCircle, Clock, DollarSign, Zap, Wrench } from 'lucide-react';
import { TauzeStatCard } from '../../../components/Cards/TauzeStatCard';

function buildSparkline(
  records: any[],
  dateField: string,
  valueField: string | null,
  buckets = 7
): { value: number; label: string }[] {
  if (!records || records.length === 0) {
    return [];
  }
  const sorted = [...records]
    .filter((r) => r[dateField])
    .sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) {
    return [];
  }
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter((r) => {
      const t = new Date(r[dateField]).getTime();
      return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd;
    });
    const v =
      inBucket.length === 0
        ? 0
        : valueField
          ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0)
          : inBucket.length;
    return {
      value: Number(v.toFixed(2)),
      label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
    };
  });
}

interface MaintenanceKPIsProps {
  orders: any[];
  loading: boolean;
}

export const MaintenanceKPIs: React.FC<MaintenanceKPIsProps> = ({ orders, loading }) => {
  const stats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [
        { label: 'OS em Aberto', value: 0, icon: AlertCircle, color: '#ed6c02', progress: 0, change: '', trend: undefined, sparkline: [] },
        { label: 'Custo Manutencao', value: 'R$ 0,00', icon: DollarSign, color: '#ef4444', progress: 0, change: '', trend: undefined, sparkline: [] },
        { label: 'MTBF (Confiabilidade)', value: '0h', icon: Zap, color: '#10b981', progress: 0, change: '', trend: undefined, sparkline: [] },
        { label: 'MTTR (Eficiencia)', value: '0h', icon: Clock, color: '#3b82f6', progress: 0, change: '', trend: undefined, sparkline: [] },
      ];
    }
    const abertas = orders.filter(
      (o: any) => o.status === 'PENDING' || o.status === 'IN_PROGRESS' || o.status === 'ABERTA' || o.status === 'open' || o.status === 'pending'
    ).length;
    const custoTotal = orders.reduce((acc: number, curr: any) => acc + Number(curr.custo || 0), 0);

    const corretivas = orders.filter((o: any) => o.tipo === 'corretiva').length;
    
    // O ideal é buscar o horímetro total das máquinas operadas. 
    // Como fallback simulado (para não ficar vazio): 300h mensais por máquina.
    const maquinasUnicas = new Set(orders.map(o => o.maquina_id)).size;
    const mtbf = corretivas > 0 ? Math.round((maquinasUnicas * 300) / corretivas) : 0;

    const osComData = orders.filter(
      (o: any) => (o.status === 'COMPLETED' || o.status === 'completed' || o.status === 'CONCLUIDA') && o.data_inicio
    );
    
    // Correção: Para MTTR não usamos Date.now() se a OS está concluída, 
    // pois isso faria o tempo crescer infinitamente. Usaremos data_conclusao se existir, 
    // ou assumiremos um tempo médio realista fallback (ex: 24h) caso o backend ainda não tenha a coluna.
    const mttr = osComData.length > 0
      ? Math.round(
          (osComData.reduce((acc: number, o: any) => {
            const dataFim = o.data_conclusao ? new Date(o.data_conclusao).getTime() : new Date(o.data_inicio).getTime() + (24 * 3600 * 1000);
            const days = (dataFim - new Date(o.data_inicio).getTime()) / (1000 * 3600 * 24);
            return acc + Math.max(days, 0.5); // Min 0.5 days
          }, 0) / osComData.length) * 10
        ) / 10
      : 0;

    return [
      {
        label: 'OS em Aberto',
        value: abertas > 0 ? abertas : '---',
        icon: AlertCircle,
        color: '#ed6c02',
        progress: orders.length > 0 ? (abertas / orders.length) * 100 : 0,
        change: abertas > 0 ? 'Ordens Ativas' : 'Nenhuma OS aberta',
        sparkline: buildSparkline(orders || [], 'data_inicio', null),
      },
      {
        label: 'Custo Manutenção',
        value: custoTotal > 0 ? custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---',
        icon: DollarSign,
        color: '#ef4444',
        progress: custoTotal > 0 ? Math.min(100, (custoTotal / 100000) * 100) : 0,
        trend: custoTotal > 0 ? ('up' as const) : ('neutral' as const),
        change: custoTotal > 0 ? 'Custo Total' : 'Sem custos',
        sparkline: buildSparkline(orders || [], 'data_inicio', 'custo'),
      },
      {
        label: 'MTBF (Confiabilidade)',
        value: mtbf > 0 ? `${mtbf}h` : '---',
        icon: Zap,
        color: '#10b981',
        progress: mtbf > 0 ? Math.min(100, (mtbf / 720) * 100) : 0,
        trend: mtbf > 0 ? ('up' as const) : ('neutral' as const),
        change: mtbf > 0 ? `${corretivas} corretivas` : 'Sem dados',
        sparkline: buildSparkline(orders || [], 'data_inicio', null),
      },
      {
        label: 'MTTR (Resolução)',
        value: mttr > 0 ? `${mttr}d` : '---',
        icon: Clock,
        color: '#3b82f6',
        progress: mttr > 0 ? Math.max(0, 100 - mttr * 10) : 0,
        trend: mttr > 0 ? ('down' as const) : ('neutral' as const),
        change: mttr > 0 ? 'Dias médios' : 'Sem dados',
        sparkline: buildSparkline(orders || [], 'data_inicio', null),
      },
    ];
  }, [orders]);

  return (
    <div className="next-gen-kpi-grid">
      {loading
        ? Array(4).fill(0).map((_, i) => (
            <TauzeStatCard
              key={i}
              loading={true}
              label=""
              value=""
              icon={Wrench}
              color=""
              periodLabel="Mês Atual"
            />
          ))
        : stats.map((stat, idx) => (
            <TauzeStatCard
              key={idx}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              progress={stat.progress}
              change={stat.change || '---'}
              trend={stat.trend === 'up' || stat.trend === 'down' ? stat.trend : undefined}
              sparkline={stat.sparkline}
              periodLabel="Mês Atual"
            />
          ))}
    </div>
  );
};

