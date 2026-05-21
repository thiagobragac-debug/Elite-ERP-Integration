import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface QuoteData {
  date: string;
  value: number;
}

export const MarketHistoryChart: React.FC = () => {
  const [data, setData] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        const { data: quotes, error } = await supabase
          .from('market_quotes')
          .select('date, value')
          .eq('indicator', 'boi_gordo_cepea')
          .order('date', { ascending: true })
          .limit(30); // Últimos 30 dias

        if (error) throw error;

        // Formata data para exibir no eixo X
        const formatted = quotes.map(q => ({
          ...q,
          displayDate: new Date(q.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: Number(q.value)
        }));

        setData(formatted);
      } catch (err) {
        console.error('Failed to fetch market quotes:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuotes();
  }, []);

  if (loading) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="cepea-update-time">Carregando histórico...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="cepea-update-time">Sem dados históricos disponíveis.</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 180, marginTop: '16px' }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
            dy={5}
            minTickGap={20}
          />
          <YAxis 
            domain={['dataMin - 5', 'dataMax + 5']} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
            tickFormatter={(value) => `R$${value}`}
            width={45}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--bg-card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'hsl(var(--text-main))'
            }}
            itemStyle={{ color: 'hsl(var(--brand))' }}
            formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Cotação']}
            labelStyle={{ color: 'hsl(var(--text-muted))', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--brand))" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
