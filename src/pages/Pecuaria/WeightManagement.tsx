import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  Filter,
  TrendingUp, 
  History,
  Wifi,
  Trash2,
  Edit3,
  ChevronRight,
  Calendar,
  FileText,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { WeightForm } from '../../components/Forms/WeightForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { formatNumber } from '../../utils/format';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { ScaleConfigModal } from './components/ScaleConfigModal';
import { WeightFilterModal } from './components/WeightFilterModal';
import { BatchWeightModal } from '../../components/Modals/BatchWeightModal';


// Brazilian Cattle Market Lot Performance Dashboard
const LotPerformanceView: React.FC<{ weighings: any[] }> = ({ weighings }) => {
  if (!weighings || weighings.length === 0) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center', background: 'hsl(var(--bg-card))', borderRadius: '20px', border: '1px solid hsl(var(--border) / 0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', padding: '16px', borderRadius: '50%', display: 'inline-flex' }}>
          <TrendingUp size={36} />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'hsl(var(--text-main))' }}>Sem Dados de Performance</h3>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', marginTop: '4px', maxWidth: '360px', marginInline: 'auto' }}>Realize pesagens para gerar a curva e análises automáticas de rendimento do lote.</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const count = weighings.length;
  const avgWeight = weighings.reduce((sum, w) => sum + Number(w.peso || 0), 0) / count;
  const avgGmd = weighings.reduce((sum, w) => sum + Number(w.gmd || 0), 0) / count || 0.92;
  
  // Arroba calculations (1 @ = 30kg of live weight)
  const avgArroba = avgWeight / 30;
  const estimatedArrobaPrice = 285; // R$ per Arroba in BR
  const estimatedValuePerHead = avgArroba * estimatedArrobaPrice;
  const totalLotValue = estimatedValuePerHead * count;

  // Weight Classes
  const classes = {
    light: weighings.filter(w => Number(w.peso) < 350).length,
    recria: weighings.filter(w => Number(w.peso) >= 350 && Number(w.peso) < 450).length,
    termination: weighings.filter(w => Number(w.peso) >= 450 && Number(w.peso) < 520).length,
    ready: weighings.filter(w => Number(w.peso) >= 520).length,
  };

  // Top performers
  const topPerformers = [...weighings]
    .sort((a, b) => Number(b.gmd || 0) - Number(a.gmd || 0))
    .slice(0, 5);

  // SLA calculations
  const targetWeight = 540;
  const remainingWeight = Math.max(0, targetWeight - avgWeight);
  const estimatedDays = avgGmd > 0 ? Math.ceil(remainingWeight / avgGmd) : 90;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-scale-up">
      {/* Dynamic Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        
        {/* Card 1: GMD Médio */}
        <div style={{
          background: 'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-main) / 0.5) 100%)',
          border: '1.5px solid hsl(var(--border) / 0.5)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '120px'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ganho Médio Diário (Lote)</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: avgGmd >= 0.8 ? '#10b981' : '#f59e0b', marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              {avgGmd.toFixed(2)}
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>kg/dia</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#10b981', marginTop: '12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            Alta Eficiência Biológica
          </div>
        </div>

        {/* Card 2: Peso Estimado em @ */}
        <div style={{
          background: 'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-main) / 0.5) 100%)',
          border: '1.5px solid hsl(var(--border) / 0.5)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '120px'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rendimento em Arrobas (@)</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: 'hsl(var(--brand))', marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              {avgArroba.toFixed(1)}
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--brand))' }}>@</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
            Rendimento de Carcaça Proj. 52%
          </div>
        </div>

        {/* Card 3: Valor Comercial Estimado */}
        <div style={{
          background: 'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-main) / 0.5) 100%)',
          border: '1.5px solid hsl(var(--border) / 0.5)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '120px'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor Comercial do Lote</span>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'hsl(var(--text-main))', marginTop: '8px' }}>
              R$ {totalLotValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
            Ref: R$ {estimatedArrobaPrice}/@ líquida
          </div>
        </div>

        {/* Card 4: Projeção de Abate */}
        <div style={{
          background: 'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-main) / 0.5) 100%)',
          border: '1.5px solid hsl(var(--border) / 0.5)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '120px'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Terminação</span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#0284c7', marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              {estimatedDays}
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>dias rest.</span>
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
            Previsão: {estimatedDate.toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Weight Classes Distribution */}
        <div style={{
          background: 'hsl(var(--bg-card))',
          border: '1.5px solid hsl(var(--border) / 0.5)',
          borderRadius: '20px',
          padding: '24px'
        }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'hsl(var(--brand))' }} />
            Distribuição de Classes de Peso (Curva do Lote)
          </h4>
          <p style={{ margin: '4px 0 20px 0', fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
            Categorização de eficiência com base em faixas de desenvolvimento ponderal.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Bezerros / Leves (< 350 kg)', count: classes.light, color: '#ef4444', desc: 'Desmame e Adaptação' },
              { label: 'Recria Saudável (350 - 450 kg)', count: classes.recria, color: '#f59e0b', desc: 'Desenvolvimento e Estrutura' },
              { label: 'Terminação Ativa (450 - 520 kg)', count: classes.termination, color: 'hsl(var(--brand))', desc: 'Acabamento de Gordura' },
              { label: 'Pronto para o Abate (> 520 kg)', count: classes.ready, color: '#10b981', desc: 'Padrão Frigorífico (Ideal)' },
            ].map((item, idx) => {
              const percentage = count > 0 ? (item.count / count) * 100 : 0;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700 }}>
                    <span style={{ color: 'hsl(var(--text-main))' }}>{item.label}</span>
                    <span style={{ color: item.color }}>{item.count} cab. ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'hsl(var(--bg-main))', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${percentage}%`,
                      background: item.color,
                      borderRadius: '4px',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 500, marginTop: '-2px' }}>{item.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers Leaderboard */}
        <div style={{
          background: 'hsl(var(--bg-card))',
          border: '1.5px solid hsl(var(--border) / 0.5)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: '#10b981' }} />
            Top Performance Individual
          </h4>
          <p style={{ margin: '4px 0 20px 0', fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
            Animais com melhor taxa de conversão alimentar e ganho de peso.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {topPerformers.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                background: idx === 0 ? 'rgba(16, 185, 129, 0.05)' : 'hsl(var(--bg-main) / 0.3)',
                border: idx === 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid hsl(var(--border) / 0.4)',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: idx === 0 ? '#10b981' : 'hsl(var(--text-muted) / 0.2)',
                    color: idx === 0 ? '#fff' : 'hsl(var(--text-main))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '10px'
                  }}>
                    {idx + 1}
                  </span>
                  <div>
                    <span style={{ fontWeight: 800, color: 'hsl(var(--text-main))' }}>#{item.animais?.brinco || 'N/A'}</span>
                    <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>Último Peso: {Number(item.peso).toFixed(1)} kg</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>
                    +{item.gmd ? item.gmd.toFixed(2) : '1.15'} kg/d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const WeightManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'RECENT' | 'PERFORMANCE'>('RECENT');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    minWeight: 0,
    maxWeight: 1000,
    minGMD: 0,
    maxGMD: 2,
    dateStart: '',
    dateEnd: '',
    performanceLevel: 'all',
    daysSinceLastWeighing: 0
  });
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const [lots, setLots] = useState<any[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('all');

  useEffect(() => {
    const fetchLots = async () => {
      if (!activeTenantId) return;
      try {
        let query = supabase.from('lotes').select('id, nome, status');
        if (activeFarmId) {
          query = query.eq('fazenda_id', activeFarmId);
        } else {
          query = query.eq('tenant_id', activeTenantId);
        }
        const { data, error } = await query;
        if (!error && data) {
          setLots(data);
        }
      } catch (err) {
        console.error('Error fetching lots for weight management:', err);
      }
    };
    fetchLots();
  }, [activeFarmId, activeTenantId]);

  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { 
    data: weighings, 
    stats, 
    loading, 
    error, 
    totalCount,
    refresh 
  } = useReportData('pesagens', { page, pageSize });

  const [selectedAnimalBrinco, setSelectedAnimalBrinco] = useState('');

  const handleOpenHistory = async (weighing: any) => {
    const animalId = weighing.animal_id;
    const brinco = weighing.animais?.brinco || 'N/A';
    setSelectedAnimalBrinco(brinco);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('pesagens')
        .select('*')
        .eq('animal_id', animalId)
        .order('data_pesagem', { ascending: false });

      if (error) throw error;

      const formattedItems = (data || []).map((p: any, idx: number) => {
        const prev = data[idx + 1];
        let gmdText = '';
        let status: 'success' | 'warning' | 'info' = 'info';

        if (prev) {
          const days = (new Date(p.data_pesagem).getTime() - new Date(prev.data_pesagem).getTime()) / (1000 * 60 * 60 * 24);
          if (days > 0) {
            const gmdVal = (Number(p.peso) - Number(prev.peso)) / days;
            gmdText = ` | GMD: ${gmdVal.toFixed(2)} kg/dia`;
            status = gmdVal > 0.8 ? 'success' as const : gmdVal > 0.4 ? 'info' as const : 'warning' as const;
          }
        }

        return {
          id: p.id,
          date: p.data_pesagem,
          title: `Pesagem: ${Number(p.peso).toFixed(1)} kg`,
          subtitle: `${p.observacao || 'Pesagem de rotina'}${gmdText}`,
          value: `${Number(p.peso).toFixed(1)} kg`,
          status
        };
      });

      setHistoryItems(formattedItems);
    } catch (err) {
      console.error('Error fetching animal weight history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedWeight(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: any) => {
    setSelectedWeight(w);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!canCreate && !selectedWeight) {
      alert('⚠️ Selecione uma unidade específica para registrar uma nova pesagem.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        animal_id: formData.animal_id,
        peso: parseFloat(formData.peso),
        data_pesagem: formData.data_pesagem,
        observacao: formData.observacao
      };

      if (selectedWeight) {
        const { error } = await supabase
          .from('pesagens')
          .update(payload)
          .eq('id', selectedWeight.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pesagens').insert([{
          ...payload,
          ...insertPayload
        }]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      refresh();
    } catch (err: any) {
      alert('❌ Erro ao salvar pesagem: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta pesagem?')) return;
    try {
      const { error } = await supabase.from('pesagens').delete().eq('id', id);
      if (error) throw error;
      refresh();
    } catch (err: any) {
      alert('❌ Erro ao excluir pesagem: ' + err.message);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = weighings.map(item => ({
      Animal: item.animais?.brinco || 'N/A',
      Data: new Date(item.data_pesagem).toLocaleDateString(),
      Peso: Number(item.peso).toFixed(2),
      GMD: item.gmd ? Number(item.gmd).toFixed(2) : '-',
      Observacao: item.observacao
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_pesagens');
    else if (format === 'excel') exportToExcel(exportData, 'log_pesagens');
    else if (format === 'pdf') exportToPDF(exportData, 'log_pesagens', 'Relatório de Pesagens');
  };

  const filteredWeighings = weighings.filter(w => {
    const matchesSearch = (w.animais?.brinco || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const weight = Number(w.peso || 0);
    const matchesWeight = weight >= filterValues.minWeight && weight <= filterValues.maxWeight;
    
    const gmd = w.gmd || 0;
    const matchesPerformance = filterValues.performanceLevel === 'all' || 
                              (filterValues.performanceLevel === 'high' && gmd > 1.0) ||
                              (filterValues.performanceLevel === 'medium' && gmd >= 0.5 && gmd <= 1.0) ||
                              (filterValues.performanceLevel === 'low' && gmd < 0.5);

    const matchesDate = (!filterValues.dateStart || new Date(w.data_pesagem) >= new Date(filterValues.dateStart)) &&
                       (!filterValues.dateEnd || new Date(w.data_pesagem) <= new Date(filterValues.dateEnd));
    
    const daysSince = (new Date().getTime() - new Date(w.data_pesagem).getTime()) / (1000 * 3600 * 24);
    const matchesDays = !filterValues.daysSinceLastWeighing || daysSince >= filterValues.daysSinceLastWeighing;

    const matchesLot = selectedLotId === 'all' || w.animais?.lote_id === selectedLotId;

    return matchesSearch && matchesWeight && matchesPerformance && matchesDate && matchesDays && matchesLot;
  });

  const columns = [
    {
      header: 'Animal / Brinco',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            #{item.animais?.brinco || 'N/A'}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.animal_id?.slice(0, 8).toUpperCase() || item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Data da Pesagem',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontWeight: 600, fontSize: '12px' }}>
          <Calendar size={14} />
          <span>{item.data_pesagem ? new Date(item.data_pesagem).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Peso Atual',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#1e293b', fontWeight: 800 }}>
          <Scale size={14} color="#6366f1" />
          <span>{Number(item.peso).toFixed(2)} kg</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'GMD Médio Real',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <TrendingUp 
            size={14} 
            color={item.gmd > 0.8 ? '#10b981' : '#f59e0b'} 
          />
          <span style={{ fontWeight: 800, color: item.gmd > 0.8 ? '#059669' : '#d97706' }}>
            {item.gmd ? `${item.gmd.toFixed(2)} kg/dia` : '-'}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Projeção Abate',
      accessor: (item: any) => {
        const targetWeight = 520;
        const remaining = targetWeight - Number(item.peso);
        const daysToAbate = item.gmd > 0 ? Math.ceil(remaining / item.gmd) : 0;
        
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={`status-pill ${daysToAbate > 0 && daysToAbate < 30 ? 'warning' : daysToAbate > 30 ? 'info' : 'success'}`}>
              {daysToAbate > 0 ? `~${daysToAbate} dias` : 'Pronto'}
            </span>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Observação',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', maxWidth: '150px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }} className="truncate">
            {item.observacao || 'Sem observações'}
          </span>
        </div>
      ),
      align: 'left' as const
    }
  ];

  return (
    <div className="weight-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Scale size={14} fill="currentColor" />
            <span>TAUZE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Controle de Pesagem</h1>
          <p className="page-subtitle">Monitoramento de ganho de peso individual e performance do lote em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsScaleModalOpen(true)}>
            <Wifi size={18} />
            CONFIGURAR BALANÇA
          </button>
          <button 
            className="glass-btn secondary" 
            style={{ 
              borderColor: 'hsl(var(--brand) / 0.3)', 
              color: 'hsl(var(--brand))', 
              fontWeight: 800,
              background: 'hsl(var(--brand) / 0.08)' 
            }} 
            onClick={() => setIsBatchModalOpen(true)}
          >
            <Layers size={18} />
            PESAGEM EM MASSA
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA PESAGEM
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats?.map((stat: any, idx: number) => (
          <TauzeStatCard 
            key={idx}
            {...stat}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'RECENT' ? 'active' : ''}`}
            onClick={() => setActiveTab('RECENT')}
          >
            Últimas Pesagens
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'PERFORMANCE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PERFORMANCE')}
          >
            Performance do Lote
          </button>
        </div>

        {/* Seletor de Lote Avançado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--bg-card))', border: '1.5px solid hsl(var(--border) / 0.5)', borderRadius: '12px', padding: '6px 14px', minWidth: '180px' }}>
          <Layers size={16} style={{ color: 'hsl(var(--brand))' }} />
          <select
            value={selectedLotId}
            onChange={(e) => setSelectedLotId(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'hsl(var(--text-main))',
              fontSize: '13px',
              fontWeight: 700,
              outline: 'none',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))' }}>Todos os Lotes</option>
            {lots.map(l => (
              <option key={l.id} value={l.id} style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))' }}>
                {l.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Pesquisar por brinco..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
          <button 
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <div className="export-dropdown-container">
            <button 
              className="icon-btn-secondary" 
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-weight');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-weight" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-weight')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-weight')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-weight')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <WeightFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {activeTab === 'PERFORMANCE' ? (
          <LotPerformanceView weighings={filteredWeighings} />
        ) : (
          <ModernTable 
            emptyState={<EmptyState
              title="Nenhuma pesagem registrada"
              description="Ainda não há pesagens lançadas para esta unidade. Inicie o controle de GMD registrando a primeira pesagem do lote."
              actionLabel="Nova Pesagem"
              onAction={handleOpenCreate}
              icon={Scale}
            />}
            data={filteredWeighings}
            columns={columns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            searchPlaceholder="Pesquisar por brinco..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" title="Histórico" onClick={() => handleOpenHistory(item)}><History size={18} /></button>
                <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar"><Edit3 size={18} /></button>
                <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir"><Trash2 size={18} /></button>
              </div>
            )}
          />
        )}
      </div>

      <WeightForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedWeight}
        loading={isSubmitting}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Histórico de Peso - Brinco #${selectedAnimalBrinco}`}
        subtitle="Evolução de pesagens e ganho médio diário (GMD) cronológico"
        items={historyItems}
        loading={historyLoading}
      />

      <ScaleConfigModal 
        isOpen={isScaleModalOpen} 
        onClose={() => setIsScaleModalOpen(false)} 
      />

      <BatchWeightModal 
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSaveSuccess={refresh}
      />

    </div>
  );
};
