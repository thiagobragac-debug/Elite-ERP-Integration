import React, { useState, useEffect } from 'react';

function buildSparkline(records: any[], dateField: string, valueField: string | null, buckets = 7): { value: number; label: string }[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].filter(r => r[dateField]).sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) return [];
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter(r => { const t = new Date(r[dateField]).getTime(); return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd; });
    const v = inBucket.length === 0 ? 0 : valueField ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0) : inBucket.length;
    return { value: Number(v.toFixed(2)), label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
  });
}
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, 
  Plus, 
  Search, 
  Filter,
  TrendingDown, 
  TrendingUp,
  CheckCircle2, 
  ChevronRight, 
  MoreVertical,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  ArrowRight,
  Trash2,
  Edit3,
  History,
  Target,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { QuotationForm } from '../../components/Forms/QuotationForm';
import { QuotationMatrixModal } from './components/QuotationMatrixModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { QuotationFilterModal } from './components/QuotationFilterModal';
import { EmptyState } from '../../components/Feedback/EmptyState';

export const QuotationMap: React.FC = () => {
  const { activeTenantId } = useTenant();
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [selectedMatrixQuotation, setSelectedMatrixQuotation] = useState<any>(null);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    minSaving: 0,
    minBids: 0,
    dateStart: '',
    dateEnd: ''
  });
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (isReady) {
      fetchQuotations();
    } else {
      setLoading(false);
      setStats([
        { label: 'Mapas em Análise', value: '---', icon: BarChart2, color: '#10b981', progress: 0, change: 'Aguardando', sparkline: buildSparkline(quotations || [], 'created_at', 'preco') },
        { label: 'Saving Acumulado', value: '---', icon: TrendingDown, color: '#3b82f6', progress: 0, change: 'Aguardando', sparkline: buildSparkline(quotations || [], 'created_at', 'preco') },
        { label: 'Densidade de Rede', value: '---', icon: Building2, color: '#f59e0b', progress: 0, change: 'Aguardando', sparkline: buildSparkline(quotations || [], 'created_at', 'preco') },
        { label: 'Acuracidade Orç.', value: '---', icon: Target, color: '#166534', progress: 0, change: 'Aguardando', sparkline: buildSparkline(quotations || [], 'created_at', 'preco') },
      ]);
    }
  }, [activeFarmId, isGlobalMode, activeTenantId]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      let query = supabase.from('mapas_cotacao').select('id, status, produto_id, quantidade, unidade, dados_fornecedores, fazenda_id, tenant_id, created_at').limit(500).order('created_at', { ascending: false });
      query = applyFarmFilter(query);
      const { data } = await query;
      
      if (data) {
        setQuotations(data);
        const abertas = data.filter(q => q.status === 'analyzing').length;
        
        // Calculate real saving metrics
        let totalSaving = 0;
        let totalBids = 0;
        data.forEach(q => {
          const bids = (q.dados_fornecedores as any) || (q as any).suppliers || [];
          totalBids += bids.length;
          if (bids.length > 1) {
            const prices = bids.map((b: any) => Number(b.price || b.preco || 0)).filter((p: number) => p > 0);
            const max = Math.max(...prices);
            const min = Math.min(...prices);
            totalSaving += (max - min);
          }
        });

        const avgBids = data.length > 0 ? (totalBids / data.length).toFixed(1) : 0;
        
        setStats([
          { label: 'Mapas em Análise', 
            value: abertas > 0 ? abertas : '---', 
            icon: BarChart2, color: '#10b981', 
            progress: data.length > 0 ? (abertas / data.length) * 100 : 0, 
            change: abertas > 0 ? 'Processos Ativos' : 'Nenhum ativo',
            sparkline: buildSparkline(quotations || [], 'created_at', 'preco')
          },
          { label: 'Saving Acumulado', 
            value: totalSaving > 0 ? `R$ ${totalSaving.toLocaleString('pt-BR')}` : '---', 
            icon: TrendingDown, color: '#3b82f6', 
            progress: totalSaving > 0 ? Math.min(100, Math.log10(totalSaving + 1) * 20) : 0, 
            trend: totalSaving > 0 ? 'down' as const : 'neutral' as const, 
            change: totalSaving > 0 ? 'Economia Real' : 'Sem saving',
            sparkline: buildSparkline(quotations || [], 'created_at', 'preco')
          },
          { label: 'Densidade de Rede', 
            value: data.length > 0 && totalBids > 0 ? `${avgBids} propostas` : '---', 
            icon: Building2, color: '#f59e0b', 
            progress: data.length > 0 ? Math.min(100, Number(avgBids) * 20) : 0, 
            change: data.length > 0 ? 'Média por Mapa' : 'Sem cotações',
            sparkline: buildSparkline(quotations || [], 'created_at', 'preco')
          },
          { label: 'Cotações Fechadas', 
            value: (() => { const fechadas = data.filter(q => q.status === 'closed').length; return fechadas > 0 ? fechadas : '---'; })(),
            icon: Target, color: '#166534', 
            progress: data.length > 0 ? (data.filter(q => q.status === 'closed').length / data.length) * 100 : 0, 
            change: data.length > 0 ? 'Contratos firmados' : 'Sem dados',
            sparkline: buildSparkline(quotations || [], 'created_at', 'preco')
          },
        ]);
        if (data.length === 0) {
          setQuotations([]);
          setStats([
            { label: 'Mapas em Análise', value: '---', icon: BarChart2, color: '#10b981', progress: 0, change: 'Sem Processos', sparkline: buildSparkline(quotations || [], 'created_at', 'preco') },
            { label: 'Saving Acumulado', value: '---', icon: TrendingDown, color: '#3b82f6', progress: 0, trend: 'neutral' as const, change: 'Sem Economia', sparkline: buildSparkline(quotations || [], 'created_at', 'preco') },
            { label: 'Densidade de Rede', value: '---', icon: Building2, color: '#f59e0b', progress: 0, change: 'Sem Média', sparkline: buildSparkline(quotations || [], 'created_at', 'preco') },
            { label: 'Cotações Fechadas', value: '---', icon: Target, color: '#166534', progress: 0, change: 'Sem Acuracidade', sparkline: buildSparkline(quotations || [], 'created_at', 'preco') },
          ]);
        }
      }
    } catch (err) {
      console.error('[QuotationMap] Error:', err);
      // Fallback de erro
      console.error('[QuotationMap] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedQuotation(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (quot: any) => {
    setSelectedQuotation(quot);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!canCreate) {
      alert('⚠️ Selecione uma unidade específica para criar um mapa de cotação. No modo Visão Global, a fazenda emitente deve ser definida.');
      return;
    }
    const payload = {
      produto_id: formData.item_id,
      quantidade: parseFloat(formData.quantity),
      unidade: formData.unit,
      dados_fornecedores: formData.suppliers,
      status: selectedQuotation?.status || 'analyzing'
    };

    if (selectedQuotation) {
      const { error } = await supabase.from('mapas_cotacao').update(payload).eq('id', selectedQuotation.id);
      if (!error) { setIsModalOpen(false); fetchQuotations(); }
    } else {
      const { error } = await supabase.from('mapas_cotacao').insert([{ ...payload, ...insertPayload }]);
      if (!error) { setIsModalOpen(false); fetchQuotations(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este mapa de cotação?')) return;
    const { error } = await supabase.from('mapas_cotacao').delete().eq('id', id);
    if (!error) fetchQuotations();
  };

  const handleViewDetails = (quot: any) => {
    setSelectedMatrixQuotation(quot);
    setIsMatrixOpen(true);
  };

  const handleApproveSupplier = async (quotationId: string, chosenSupplier: any) => {
    const quot = quotations.find(q => q.id === quotationId);
    if (!quot) return;

    const rawSuppliers = quot.suppliers || quot.dados_fornecedores || [];
    const updatedSuppliers = rawSuppliers.map((s: any) => {
      const isMatch = (s.supplier_id && s.supplier_id === chosenSupplier.supplier_id) ||
                      (s.name && s.name === chosenSupplier.name) ||
                      (s.parceiro_nome && s.parceiro_nome === chosenSupplier.parceiro_nome) ||
                      (Number(s.price || s.preco) === Number(chosenSupplier.price || chosenSupplier.preco) &&
                       Number(s.delivery_days || s.deliveryDays || s.prazo_entrega) === Number(chosenSupplier.delivery_days || chosenSupplier.deliveryDays || chosenSupplier.prazo_entrega));
      
      return {
        ...s,
        isWinner: isMatch,
        vencedor: isMatch
      };
    });

    const { error } = await supabase
      .from('mapas_cotacao')
      .update({
        status: 'closed',
        dados_fornecedores: updatedSuppliers
      })
      .eq('id', quotationId);

    if (!error) {
      setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: 'closed', dados_fornecedores: updatedSuppliers } : q));
      setIsMatrixOpen(false);
      fetchQuotations();
    } else {
      console.error('[QuotationMap] Error approving supplier:', error);
      alert('❌ Erro ao aprovar parceiro: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = quotations.filter(q => {
      const matchesSearch = (q.titulo || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'OPEN' ? q.status !== 'closed' : q.status === 'closed';
      const suppliers = q.suppliers || q.dados_fornecedores || [];
      const matchesBids = suppliers.length >= filterValues.minBids;
      
      let savingPercent = 0;
      const prices = suppliers.map((s: any) => Number(s.price || s.preco || 0)).filter((p: number) => p > 0);
      if (prices.length >= 2) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        savingPercent = ((maxPrice - minPrice) / (maxPrice || 1)) * 100;
      }
      const matchesSaving = savingPercent >= filterValues.minSaving;
      const matchesStatus = filterValues.status === 'all' || q.status === filterValues.status;
      const matchesDate = (!filterValues.dateStart || new Date(q.created_at) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(q.created_at) <= new Date(filterValues.dateEnd));

      return matchesSearch && matchesTab && matchesBids && matchesSaving && matchesStatus && matchesDate;
    });

    const exportData = filteredData.map(item => {
      const suppliers = item.suppliers || item.dados_fornecedores || [];
      const winner = suppliers.find((s: any) => s.isWinner || s.vencedor);
      const prices = suppliers.map((s: any) => Number(s.price || s.preco || 0)).filter((p: number) => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const saving = maxPrice > 0 ? (((maxPrice - minPrice) / maxPrice) * 100).toFixed(1) + '%' : '0%';

      return {
        Item: item.produto_id || 'N/A',
        Quantidade: item.quantidade + ' ' + item.unidade,
        Propostas: suppliers.length,
        Melhor_Preco: 'R$ ' + minPrice.toLocaleString(),
        Saving: saving,
        Parceiro_Vencedor: winner ? (winner.name || winner.parceiro_nome) : '---',
        Status: item.status === 'closed' ? 'Contratado' : 'Em Análise'
      };
    });

    if (format === 'csv') exportToCSV(exportData, 'mapas_cotacao');
    else if (format === 'excel') exportToExcel(exportData, 'mapas_cotacao');
    else if (format === 'pdf') exportToPDF(exportData, 'mapas_cotacao', 'Relatório de Mapas de Cotação e Saving');
  };

  const tableColumns = [
    {
      header: 'Item / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.produto_id || 'N/A'}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Quantidade Demandada',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#475569', fontWeight: 700, fontSize: '12px' }}>
          <span>{item.quantidade} {item.unidade}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Participantes',
      accessor: (item: any) => {
        const bids = item.suppliers || item.dados_fornecedores || [];
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span className="status-pill info" style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 800 }}>
              {bids.length} Propostas
            </span>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Sugestão Vencedora',
      accessor: (item: any) => {
        const suppliers = item.suppliers || item.dados_fornecedores || [];
        const winner = suppliers.find((s: any) => s.isWinner || s.vencedor);
        return winner ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} color="#059669"/> {winner.name || winner.parceiro_nome}
            </span>
            <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
              Prazo: {winner.deliveryDays || winner.prazo_entrega || 0} dias
            </span>
          </div>
        ) : (
          <span className="sub-meta italic text-amber-600">Aguardando definição</span>
        );
      },
      align: 'left' as const
    },
    {
      header: 'Saving Real (%)',
      accessor: (item: any) => {
        const suppliers = item.suppliers || item.dados_fornecedores || [];
        const prices = suppliers.map((s: any) => Number(s.price || s.preco || 0)).filter((p: number) => p > 0);
        if (prices.length < 2) return <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Sem Histórico</span>;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const savingPercent = ((maxPrice - minPrice) / (maxPrice || 1)) * 100;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="status-pill active" style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 900, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
              SAVING: {savingPercent.toFixed(1)}%
            </span>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Melhor Preço / Status',
      accessor: (item: any) => {
        const suppliers = item.suppliers || item.dados_fornecedores || [];
        const prices = suppliers.map((s: any) => Number(s.price || s.preco || 0)).filter((p: number) => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>
              {minPrice > 0 ? minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
            </span>
            <span className={`status-pill ${item.status === 'closed' ? 'active' : 'warning'}`} style={{ fontSize: '8px', padding: '1px 5px' }}>
              {item.status === 'closed' ? 'Contratado' : 'Em Análise'}
            </span>
          </div>
        );
      },
      align: 'center' as const
    }
  ];

  return (
    <div className="quotation-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <BarChart2 size={14} fill="currentColor" />
            <span>TAUZE PROCUREMENT v5.0</span>
          </div>
          <h1 className="page-title">Mapa de Cotação</h1>
          <p className="page-subtitle">Análise comparativa de mercado, saving de suprimentos e tomada de decisão estratégica em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => navigate('/compras/mapa')}>
            <TrendingUp size={18} />
            ANÁLISE DE PREÇO
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA COTAÇÃO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={BarChart2} color=""  periodLabel="Mês Atual" />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change}
            trend={stat.trend}
            sparkline={stat.sparkline}
           periodLabel="Mês Atual" />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'OPEN' ? 'active' : ''}`}
            onClick={() => setActiveTab('OPEN')}
          >
            Mapas Ativos
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'CLOSED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CLOSED')}
          >
            Encerrados
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar por item ou parceiro..." 
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
                const menu = document.getElementById('export-menu-quotation');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-quotation" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-quotation')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-quotation')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-quotation')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <QuotationFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable 
          emptyState={
            quotations.filter(q => (activeTab === 'OPEN' ? q.status !== 'closed' : q.status === 'closed')).length === 0 ? (
              <EmptyState
                title={activeTab === 'OPEN' ? "Nenhum mapa de cotação ativo" : "Nenhum mapa de cotação encerrado"}
                description={activeTab === 'OPEN' ? "Não há processos de cotação de mercado ativos no momento." : "Não há históricos de cotações encerradas nesta unidade."}
                actionLabel="Nova Cotação"
                onAction={handleOpenCreate}
                icon={BarChart2}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          }
          data={quotations.filter(q => {
            const matchesSearch = (q.titulo || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'OPEN' ? q.status !== 'closed' : q.status === 'closed';
            
            const suppliers = q.suppliers || q.dados_fornecedores || [];
            const matchesBids = suppliers.length >= filterValues.minBids;
            
            let savingPercent = 0;
            const prices = suppliers.map((s: any) => Number(s.price || s.preco || 0)).filter((p: number) => p > 0);
            if (prices.length >= 2) {
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              savingPercent = ((maxPrice - minPrice) / (maxPrice || 1)) * 100;
            }
            const matchesSaving = savingPercent >= filterValues.minSaving;
            
            const matchesStatus = filterValues.status === 'all' || q.status === filterValues.status;
            const matchesDate = (!filterValues.dateStart || new Date(q.created_at) >= new Date(filterValues.dateStart)) &&
                               (!filterValues.dateEnd || new Date(q.created_at) <= new Date(filterValues.dateEnd));

            return matchesSearch && matchesTab && matchesBids && matchesSaving && matchesStatus && matchesDate;
          })}
          columns={tableColumns}
          loading={loading}
          hideHeader={true}
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Comparativo">
                <History size={18} />
              </button>
              <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar">
                <Edit3 size={18} />
              </button>
              <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir">
                <Trash2 size={18} />
              </button>
            </div>
          )}
        />
      </div>

      <QuotationForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedQuotation}
      />

      <QuotationMatrixModal 
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        quotation={selectedMatrixQuotation}
        onApprove={handleApproveSupplier}
      />

    </div>
  );
};
