import React from 'react';
import { DollarSign, Wheat, HeartPulse, FileText, Dna, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SidePanel } from '../Layout/SidePanel';

interface CostStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: any;
  financialData: {
    costs: any[];
    health: any[];
    reproduction: any[];
    miscellaneous: any[];
    lotMovements: any[];
  } | null;
}

export const CostStatementModal: React.FC<CostStatementModalProps> = ({
  isOpen,
  onClose,
  animal,
  financialData
}) => {
  // Calculate totals
  const totalAquisicao = Number(animal?.valor_compra || 0);
  const totalNutricao = financialData?.costs.reduce((acc: number, curr: any) => acc + Number(curr.valor_total_consumido || 0), 0) || 0;
  const totalSanidade = (financialData?.health || []).reduce((acc: number, curr: any) => acc + Number(curr.valor_total_aplicado || 0), 0);
  const totalReproducao = (financialData?.reproduction || []).reduce((acc: number, curr: any) => acc + Number(curr.custo || 0), 0);
  const totalDiversos = (financialData?.miscellaneous || []).reduce((acc: number, curr: any) => acc + Number(curr.custo_calculado || 0), 0);
  const custoTotal = totalAquisicao + totalNutricao + totalSanidade + totalReproducao + totalDiversos;

  const [chartMode, setChartMode] = React.useState<'valor' | 'quantidade'>('valor');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const chartData = React.useMemo(() => {
    if (chartMode === 'valor') {
      return [
        { name: 'Aquisição', value: totalAquisicao, color: '#3b82f6' },
        { name: 'Nutrição', value: totalNutricao, color: '#f59e0b' },
        { name: 'Sanidade', value: totalSanidade, color: '#ef4444' },
        { name: 'Reprodução', value: totalReproducao, color: '#c084fc' },
        { name: 'Diversos', value: totalDiversos, color: '#06b6d4' }
      ].filter(d => d.value > 0);
    } else {
      const qAquisicao = totalAquisicao > 0 ? 1 : 0;
      const qNutricao = financialData?.costs?.length || 0;
      const qSanidade = financialData?.health?.length || 0;
      const qReproducao = financialData?.reproduction?.length || 0;
      const qDiversos = financialData?.miscellaneous?.length || 0;
      return [
        { name: 'Aquisição', value: qAquisicao, color: '#3b82f6' },
        { name: 'Nutrição', value: qNutricao, color: '#f59e0b' },
        { name: 'Sanidade', value: qSanidade, color: '#ef4444' },
        { name: 'Reprodução', value: qReproducao, color: '#c084fc' },
        { name: 'Diversos', value: qDiversos, color: '#06b6d4' }
      ].filter(d => d.value > 0);
    }
  }, [totalAquisicao, totalNutricao, totalSanidade, totalReproducao, totalDiversos, financialData, chartMode]);

  // Combine and sort the data for timeline
  const combinedData = React.useMemo(() => {
    if (!financialData) return [];
    
    const costs = financialData.costs.map((c: any) => ({
      ...c,
      category: 'Nutrição',
      type: 'cost',
      icon: <Wheat size={16} color="#f59e0b" />,
      bgIcon: 'rgba(245, 158, 11, 0.1)',
      date: c.data_consumo || c.created_at,
      productName: c.dietas?.nome || 'Dieta / Insumo',
      cost: Number(c.valor_total_consumido || 0)
    }));

    const health = financialData.health.map((h: any) => ({
      ...h,
      category: 'Sanidade',
      type: 'health',
      icon: <HeartPulse size={16} color="#ef4444" />,
      bgIcon: 'rgba(239, 68, 68, 0.1)',
      date: h.data_aplicacao || h.created_at,
      productName: h.sanidade?.titulo || h.produtos?.nome || 'Fármaco / Vacina',
      cost: Number(h.valor_total_aplicado || 0)
    }));

    const repro = financialData.reproduction.map((r: any) => ({
      ...r,
      category: 'Reprodução',
      type: 'reproduction',
      icon: <Dna size={16} color="#c084fc" />,
      bgIcon: 'rgba(192, 132, 252, 0.1)',
      date: r.data_evento || r.created_at,
      productName: r.tipo_evento || 'Evento Reprodutivo',
      cost: Number(r.custo || 0)
    }));

    const misc = (financialData.miscellaneous || []).map((m: any) => ({
      ...m,
      category: 'Diversos / Rateio',
      type: 'miscellaneous',
      icon: <Package size={16} color="#06b6d4" />,
      bgIcon: 'rgba(6, 182, 212, 0.1)',
      date: m.data_movimentacao,
      productName: m.produtos?.nome || 'Insumo Diverso',
      cost: Number(m.custo_calculado || 0)
    }));

    return [...costs, ...health, ...repro, ...misc].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [financialData]);

  const filteredCombinedData = React.useMemo(() => {
    if (!selectedCategory) return combinedData;
    return combinedData.filter((item: any) => item.category === selectedCategory);
  }, [combinedData, selectedCategory]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: payload[0].payload.color }}>{payload[0].name}</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
            {chartMode === 'valor' ? formatCurrency(payload[0].value) : `${payload[0].value} registro${payload[0].value !== 1 ? 's' : ''}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Dossiê Financeiro"
      subtitle={`Detalhamento analítico de custos do animal #${animal?.brinco || 'N/I'}`}
      icon={DollarSign}
      size="xlarge"
      hideSubmit
      isReadOnly
      contentPadding={0}
    >
      <div style={{ display: 'flex', height: '100%', minHeight: '80vh' }}>
        {/* Left Column: Dashboard Summary */}
        <div style={{ width: '380px', padding: '32px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Main Total */}
          <div style={{ textAlign: 'center', background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Custo Total Investido</span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>
              {formatCurrency(custoTotal)}
            </div>
          </div>

          {/* Composition Chart */}
          {custoTotal > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px', width: '100%', position: 'relative', zIndex: 999 }}>
                <button 
                  type="button"
                  onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); setChartMode('valor'); }}
                  onPointerDown={(e) => { e.stopPropagation(); setChartMode('valor'); }}
                  style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: chartMode === 'valor' ? '#fff' : 'transparent', color: chartMode === 'valor' ? '#0f172a' : '#64748b', boxShadow: chartMode === 'valor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', pointerEvents: 'auto' }}
                >
                  Por Valor (R$)
                </button>
                <button 
                  type="button"
                  onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); setChartMode('quantidade'); }}
                  onPointerDown={(e) => { e.stopPropagation(); setChartMode('quantidade'); }}
                  style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: chartMode === 'quantidade' ? '#fff' : 'transparent', color: chartMode === 'quantidade' ? '#0f172a' : '#64748b', boxShadow: chartMode === 'quantidade' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', pointerEvents: 'auto' }}
                >
                  Por Registros (Qtd)
                </button>
              </div>
              <div style={{ position: 'relative', height: '240px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <PieChart width={280} height={240} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    onClick={(data) => setSelectedCategory(data.name === selectedCategory ? null : data.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        opacity={selectedCategory ? (selectedCategory === entry.name ? 1 : 0.3) : 1}
                        style={{ transition: 'opacity 0.3s' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {chartMode === 'valor' ? 'Categorias' : 'Registros'}
                  </span>
                  <span style={{ display: 'block', fontSize: '24px', fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>
                    {chartMode === 'valor' ? chartData.length : chartData.reduce((acc, curr) => acc + curr.value, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Metric Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div 
              onClick={() => setSelectedCategory('Aquisição' === selectedCategory ? null : 'Aquisição')}
              style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: selectedCategory === 'Aquisição' ? '2px solid #3b82f6' : '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: selectedCategory && selectedCategory !== 'Aquisição' ? 0.5 : 1, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Aquisição</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(totalAquisicao)}</span>
            </div>

            <div 
              onClick={() => setSelectedCategory('Nutrição' === selectedCategory ? null : 'Nutrição')}
              style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: selectedCategory === 'Nutrição' ? '2px solid #f59e0b' : '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: selectedCategory && selectedCategory !== 'Nutrição' ? 0.5 : 1, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Nutrição</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(totalNutricao)}</span>
            </div>

            <div 
              onClick={() => setSelectedCategory('Sanidade' === selectedCategory ? null : 'Sanidade')}
              style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: selectedCategory === 'Sanidade' ? '2px solid #ef4444' : '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: selectedCategory && selectedCategory !== 'Sanidade' ? 0.5 : 1, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Sanidade</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(totalSanidade)}</span>
            </div>

            <div 
              onClick={() => setSelectedCategory('Reprodução' === selectedCategory ? null : 'Reprodução')}
              style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: selectedCategory === 'Reprodução' ? '2px solid #c084fc' : '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: selectedCategory && selectedCategory !== 'Reprodução' ? 0.5 : 1, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c084fc' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Reprodução</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(totalReproducao)}</span>
            </div>

            <div 
              onClick={() => setSelectedCategory('Diversos / Rateio' === selectedCategory ? null : 'Diversos / Rateio')}
              style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: selectedCategory === 'Diversos / Rateio' ? '2px solid #06b6d4' : '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: selectedCategory && selectedCategory !== 'Diversos / Rateio' ? 0.5 : 1, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Diversos</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(totalDiversos)}</span>
            </div>
          </div>

        </div>

        {/* Right Column: Timeline Slip */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              Histórico {selectedCategory ? `de ${selectedCategory}` : 'de Lançamentos'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)}
                  style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Limpar Filtro
                </button>
              )}
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                {filteredCombinedData.length} registros
              </span>
            </div>
          </div>

          {filteredCombinedData.length > 0 ? (
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              {/* Vertical Line */}
              <div style={{ position: 'absolute', left: '11px', top: '16px', bottom: '16px', width: '2px', background: '#e2e8f0', borderRadius: '2px' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {filteredCombinedData.map((item: any, i: number) => (
                  <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    
                    {/* Timeline Node */}
                    <div style={{ 
                      position: 'absolute', left: '-24px', top: '4px', 
                      width: '24px', height: '24px', borderRadius: '50%', 
                      background: '#fff', border: `2px solid ${item.type === 'cost' ? '#f59e0b' : item.type === 'health' ? '#ef4444' : item.type === 'reproduction' ? '#c084fc' : '#06b6d4'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.type === 'cost' ? '#f59e0b' : item.type === 'health' ? '#ef4444' : item.type === 'reproduction' ? '#c084fc' : '#06b6d4' }} />
                    </div>

                    {/* Content Card */}
                    <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
                         onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                         onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: item.bgIcon, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{item.productName}</span>
                            {item.type === 'health' && item.cost === 0 && (
                              <span style={{ fontSize: '10px', background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Sem Custo</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                            <span>{item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'N/I'}</span>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
                            <span>{item.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '16px', fontWeight: 800, color: item.cost > 0 ? '#0f172a' : '#94a3b8' }}>
                          {formatCurrency(item.cost)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '64px 24px', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <FileText size={32} color="#94a3b8" />
              </div>
              <h4 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '16px', fontWeight: 700 }}>Nenhum lançamento no extrato</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', maxWidth: '300px' }}>Este animal ainda não consumiu tratos ou vacinas mapeadas com custo.</p>
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};


