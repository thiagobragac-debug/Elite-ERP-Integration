import React, { useMemo } from 'react';
import { Fuel, TrendingDown, TrendingUp } from 'lucide-react';
import { EmptyState } from '../../../components/Feedback/EmptyState';
import { ModernTable } from '../../../components/DataTable/ModernTable';

export const FuelAnalysisView: React.FC<{ logs: any[] }> = ({ logs }) => {
  const analysisData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const grouped = logs.reduce((acc: any, log: any) => {
      const id = log.maquina_id;
      if (!id) return acc;

      if (!acc[id]) {
        acc[id] = {
          id: log.maquina_id,
          nome: log.maquinas?.nome || 'Desconhecido',
          unidade_medida: log.tipo_combustivel === 'Especial' ? 'km' : 'horas',
          litrosTotais: 0,
          custoTotal: 0,
          medidores: [],
          consumoEsperado: log.maquinas?.consumo_estimado || 0,
        };
      }

      acc[id].litrosTotais += Number(log.litros || 0);
      acc[id].custoTotal += Number(log.valor_total || 0);
      if (log.valor_medidor) {
        acc[id].medidores.push(Number(log.valor_medidor));
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .map((m: any) => {
        let deltaMedidor = 0;
        let consumoReal = 0;

        if (m.medidores.length > 1) {
          const min = Math.min(...m.medidores);
          const max = Math.max(...m.medidores);
          deltaMedidor = max - min;

          if (deltaMedidor > 0) {
            consumoReal = m.litrosTotais / deltaMedidor;
          }
        }

        return {
          ...m,
          deltaMedidor,
          consumoReal,
        };
      })
      .sort((a: any, b: any) => b.custoTotal - a.custoTotal);
  }, [logs]);

  const columns = [
    {
      header: 'Ativo / Equipamento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.nome}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id?.slice(0, 8).toUpperCase() || 'N/A'}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Consumo Total',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 600 }}>
          {item.litrosTotais.toFixed(1)} L
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Custo Acumulado',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 600, color: '#059669' }}>
          {item.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Consumo Médio (L/h)',
      accessor: (item: any) => {
        const hasData = item.consumoReal > 0;
        const diff = item.consumoEsperado > 0 ? ((item.consumoReal - item.consumoEsperado) / item.consumoEsperado) * 100 : 0;
        const isBad = diff > 10;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>
              {hasData ? `${item.consumoReal.toFixed(2)} L/h` : 'N/A'}
            </span>
            {hasData && item.consumoEsperado > 0 && (
              <span style={{ fontSize: '10px', color: isBad ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {isBad ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(diff).toFixed(1)}% vs esperado
              </span>
            )}
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Status de Eficiência',
      accessor: (item: any) => {
        if (item.consumoEsperado === 0 || item.consumoReal === 0) {
          return (
             <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span className="status-pill pending">Sem base p/ cálculo</span>
             </div>
          )
        }
        const diff = ((item.consumoReal - item.consumoEsperado) / item.consumoEsperado) * 100;
        const isEfficient = diff <= 10;
        
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span 
              className={`status-pill ${isEfficient ? 'active' : 'stopped'}`}
              title={`Consumo esperado: ${item.consumoEsperado} L/h | Real: ${item.consumoReal.toFixed(2)} L/h`}
            >
              {isEfficient ? 'Dentro do Padrão' : 'Alto Consumo'}
            </span>
          </div>
        );
      },
      align: 'center' as const,
    }
  ];

  return (
    <ModernTable
      data={analysisData}
      columns={columns}
      loading={false}
      hideHeader={true}
      emptyState={
        <EmptyState
          title="Sem dados de análise"
          description="Não há dados suficientes para realizar análise de autonomia."
          icon={Fuel}
        />
      }
    />
  );
};
