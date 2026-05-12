import React, { useState, useEffect } from 'react';
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
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import { QuotationFilterModal } from './components/QuotationFilterModal';

export const QuotationMap: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
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
    if (!activeFarmId && !isGlobalMode) return;
    fetchQuotations();
  }, [activeFarmId, isGlobalMode]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      let query = supabase.from('mapas_cotacao').select('*').order('created_at', { ascending: false });
      query = applyFarmFilter(query);
      const { data } = await query;
      
      if (data) {
        setQuotations(data);
        const abertas = data.filter(q => q.status === 'analyzing').length;
        
        // Calculate real saving metrics
        let totalSaving = 0;
        let totalBids = 0;
        data.forEach(q => {
          const bids = q.dados_fornecedores || q.suppliers || [];
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
          { label: 'Mapas em Análise', value: abertas, icon: BarChart2, color: '#10b981', progress: 100, change: 'Processos Ativos' },
          { label: 'Saving Acumulado', value: `R$ ${totalSaving.toLocaleString('pt-BR')}`, icon: TrendingDown, color: '#3b82f6', progress: 85, trend: 'down', change: 'Economia Real' },
          { label: 'Densidade de Rede', value: `${avgBids} propostas`, icon: Building2, color: '#f59e0b', progress: 100, change: 'Média por Mapa' },
          { label: 'Acuracidade Orç.', value: '98%', icon: Target, color: '#166534', progress: 98, change: 'Precisão Lead' },
        ]);
      }
    } catch (err) {
      console.error(err);
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
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    const suppliers = quot.suppliers || quot.dados_fornecedores || [];
    setHistoryItems(suppliers.map((s: any, idx: number) => ({
      id: idx.toString(),
      date: quot.created_at || new Date().toISOString(),
      title: s.name || s.fornecedor_nome || `Fornecedor ${idx+1}`,
      subtitle: `Prazo: ${s.deliveryDays || s.prazo_entrega || 0} dias`,
      value: Number(s.price || s.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      status: (s.isWinner || s.vencedor) ? 'success' : 'info'
    })));
    setHistoryLoading(false);
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
        Fornecedor_Vencedor: winner ? (winner.name || winner.fornecedor_nome) : '---',
        Status: item.status === 'closed' ? 'Contratado' : 'Em Análise'
      };
    });

    if (format === 'csv') exportToCSV(exportData, 'mapas_cotacao');
    else if (format === 'excel') exportToExcel(exportData, 'mapas_cotacao');
    else if (format === 'pdf') exportToPDF(exportData, 'mapas_cotacao', 'Relatório de Mapas de Cotação e Saving');
  };

  const tableColumns = [
    {
      header: 'Item / Volume de Propostas',
      accessor: (item: any) => {
        const bids = item.suppliers || item.dados_fornecedores || [];
        return (
          <div className="table-cell-title">
            <span className="main-text">{item.produto_id || `Cotação #${item.id?.slice(0,5) || 'N/A'}`}</span>
            <div className="sub-meta uppercase font-bold text-[10px] tracking-wider flex items-center gap-2">
              <span>{item.quantidade} {item.unidade}</span>
              <span className="text-slate-400">|</span>
              <span className="text-blue-600">{bids.length} FORNECEDORES</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Sugestão Vencedora',
      accessor: (item: any) => {
        const suppliers = item.suppliers || item.dados_fornecedores || [];
        const winner = suppliers.find((s: any) => s.isWinner || s.vencedor);
        return winner ? (
          <div className="flex flex-col">
            <div className="table-cell-meta text-emerald-600 font-bold">
              <CheckCircle2 size={14} />
              <span>{winner.name || winner.fornecedor_nome}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              Entrega: {winner.deliveryDays || winner.prazo_entrega || 0} dias
            </span>
          </div>
        ) : (
          <span className="sub-meta italic text-amber-600">Aguardando definição</span>
        );
      }
    },
    {
      header: 'Economia / Melhor Preço',
      accessor: (item: any) => {
        const suppliers = item.suppliers || item.dados_fornecedores || [];
        const prices = suppliers.map((s: any) => Number(s.price || s.preco || 0)).filter((p: number) => p > 0);
        if (prices.length < 2) return (
          <span className="main-text font-bold">
            {prices.length > 0 ? prices[0].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
          </span>
        );
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const savingPercent = ((maxPrice - minPrice) / (maxPrice || 1)) * 100;

        return (
          <div className="flex flex-col items-end">
            <span className="main-text font-bold text-emerald-600">
              {minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1 rounded">
              SAVING: {savingPercent.toFixed(1)}%
            </span>
          </div>
        );
      },
      align: 'right' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'closed' ? 'active' : 'warning'}`}>
          {item.status === 'closed' ? 'Contratado' : 'Em Análise'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="quotation-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <BarChart2 size={14} fill="currentColor" />
            <span>ELITE PROCUREMENT v5.0</span>
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
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={BarChart2} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+5.4%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'OPEN' ? 'active' : ''}`}
            onClick={() => setActiveTab('OPEN')}
          >
            Mapas Ativos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'CLOSED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CLOSED')}
          >
            Encerrados
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por item ou fornecedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
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
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-quotation')?.classList.remove('active'); }}>CSV</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-quotation')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-quotation')?.classList.remove('active'); }}>PDF Profissional</button>
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

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Quadro Comparativo"
        subtitle="Análise detalhada de ofertas e condições comerciais"
        items={historyItems}
        loading={historyLoading}
      />

    </div>
  );
};
