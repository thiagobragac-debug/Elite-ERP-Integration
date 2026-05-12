import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  ChevronRight,
  PieChart,
  BarChart3,
  ClipboardList,
  Activity,
  DollarSign,
  Truck,
  Search,
  Zap,
  Layout,
  Layers,
  Sparkles,
  LayoutGrid,
  FileSpreadsheet,
  Star,
  Settings,
  Package,
  ShoppingCart,
  TrendingUp,
  Shield,
  Target,
  Brain,
  Globe,
  BarChart4,
  Leaf,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '../../contexts/TenantContext';
import { useNavigate } from 'react-router-dom';
import { ReportViewer } from './components/ReportViewer';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import { fetchReportDataById } from '../../hooks/useReportData';
import { exportToExcel } from '../../utils/exportUtils';
import { ScheduleModal } from './components/ScheduleModal';
import { PeriodSelectorModal } from './components/PeriodSelectorModal';
import { ReportFilterModal } from './components/ReportFilterModal';


export const Reports: React.FC = () => {
  const { activeFarm, tenant, userProfile, refreshProfile, isGlobalMode, activeFarmId } = useFarmFilter();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | 'finance' | 'livestock' | 'fleet' | 'supply' | 'sales' | 'gov'>('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [reportToSchedule, setReportToSchedule] = useState<any>(null);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('safra_atual');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    tags: [],
    complexity: 'all',
    onlyFavorites: false,
    minIntegrity: 0
  });


  // Carregar favoritos iniciais do perfil
  useEffect(() => {
    if (userProfile?.settings?.reportFavorites) {
      setFavorites(userProfile.settings.reportFavorites);
    }
  }, [userProfile]);

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!userProfile?.id) return;

    const newFavorites = favorites.includes(id) 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    
    // Atualização otimista
    setFavorites(newFavorites);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          settings: { 
            ...(userProfile.settings || {}), 
            reportFavorites: newFavorites 
          } 
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      // Opcional: atualizar o perfil no contexto para manter consistência
      await refreshProfile();
    } catch (error) {
      console.error('Erro ao salvar favorito:', error);
      // Reverter em caso de erro
      setFavorites(favorites);
    }
  };

  const reportTypes = [
    { id: '1', title: 'Performance Ponderal (GMD)', category: 'livestock', icon: Activity, desc: 'Análise de conversão alimentar e eficiência de ganho de peso.', color: '#10b981', categoryLabel: 'PECUÁRIA', tags: ['Zootécnico', 'Operacional'], complexity: 'Médio', integrity: 100 },
    { id: '2', title: 'Heatmap de Ocupação de Pasto', category: 'livestock', icon: Layers, desc: 'Distribuição espacial UA/ha e taxa de lotação dinâmica.', color: '#10b981', categoryLabel: 'PECUÁRIA', tags: ['Zootécnico', 'Auditoria'], complexity: 'Pesado', integrity: 100 },
    { id: '3', title: 'Inventário Geral de Rebanho', category: 'livestock', icon: ClipboardList, desc: 'Contagem oficial por lote, categoria e fase produtiva.', color: '#10b981', categoryLabel: 'PECUÁRIA', tags: ['Auditoria', 'Fiscal'], complexity: 'Médio', integrity: 100 },
    { id: '4', title: 'Rastreabilidade e Sanidade', category: 'livestock', icon: Activity, desc: 'Histórico sanitário completo e certificação de origem.', color: '#10b981', categoryLabel: 'PECUÁRIA', tags: ['Operacional', 'Auditoria'], complexity: 'Leve', integrity: 75 },
    { id: '5', title: 'Projeção de Abate (Predição)', category: 'livestock', icon: Zap, desc: 'Estimativa de peso e data de saída baseada em IA.', color: '#10b981', categoryLabel: 'PECUÁRIA', tags: ['Zootécnico', 'Operacional'], complexity: 'Pesado', integrity: 100 },

    // FINANCEIRO
    { id: '6', title: 'DRE & Fluxo Consolidado', category: 'finance', icon: DollarSign, desc: 'Demonstrativo de resultados e saúde financeira do exercício.', color: '#3b82f6', categoryLabel: 'FINANCEIRO', tags: ['Financeiro', 'Fiscal'], complexity: 'Médio', integrity: 100 },
    { id: '7', title: 'Balanço Patrimonial Agro', category: 'finance', icon: BarChart3, desc: 'Visão contábil de ativos biológicos e imobilizados.', color: '#3b82f6', categoryLabel: 'FINANCEIRO', tags: ['Financeiro', 'Fiscal', 'Auditoria'], complexity: 'Médio', integrity: 100 },
    { id: '8', title: 'Custo p/ @ Produzida', category: 'finance', icon: Target, desc: 'Break-even e eficiência econômica por arroba.', color: '#3b82f6', categoryLabel: 'FINANCEIRO', tags: ['Financeiro', 'Operacional'], complexity: 'Pesado', integrity: 100 },
    { id: '9', title: 'Fluxo de Caixa Projetado', category: 'finance', icon: DollarSign, desc: 'Análise de liquidez e compromissos futuros.', color: '#3b82f6', categoryLabel: 'FINANCEIRO', tags: ['Financeiro'], complexity: 'Médio', integrity: 100 },

    // FROTA
    { id: '10', title: 'TCO de Frota Agroindustrial', category: 'fleet', icon: Truck, desc: 'Custo total de propriedade e eficiência mecânica por ativo.', color: '#6366f1', categoryLabel: 'FROTA', tags: ['Logística', 'Operacional'], complexity: 'Médio', integrity: 100 },
    { id: '11', title: 'Eficiência Energética (Diesel)', category: 'fleet', icon: BarChart3, desc: 'Benchmark de consumo L/h entre operadores e máquinas.', color: '#6366f1', categoryLabel: 'FROTA', tags: ['Operacional', 'RH'], complexity: 'Leve', integrity: 100 },
    { id: '12', title: 'Plano de Manutenção Preventiva', category: 'fleet', icon: Settings, desc: 'Cronograma de revisões e disponibilidade de frota.', color: '#6366f1', categoryLabel: 'FROTA', tags: ['Operacional'], complexity: 'Leve', integrity: 100 },

    // SUPRIMENTOS
    { id: '13', title: 'Giro de Estoque & Insumos', category: 'supply', icon: Package, desc: 'Predição de ruptura e análise de consumo de insumos.', color: '#f59e0b', categoryLabel: 'SUPRIMENTOS', tags: ['Logística', 'Financeiro'], complexity: 'Médio', integrity: 100 },
    { id: '14', title: 'ABC de Compras Agro', category: 'supply', icon: ShoppingCart, desc: 'Curva de criticidade e concentração de fornecedores.', color: '#f59e0b', categoryLabel: 'SUPRIMENTOS', tags: ['Operacional', 'Financeiro'], complexity: 'Leve', integrity: 100 },
    { id: '15', title: 'Acuracidade de Inventário', category: 'supply', icon: Target, desc: 'Auditoria de estoque físico vs. contábil.', color: '#f59e0b', categoryLabel: 'SUPRIMENTOS', tags: ['Auditoria', 'Operacional'], complexity: 'Médio', integrity: 100 },

    // COMERCIAL
    { id: '16', title: 'Análise de Ticket Médio Venda', category: 'sales', icon: TrendingUp, desc: 'Performance de comercialização e praças de destino.', color: '#db2777', categoryLabel: 'COMERCIAL', tags: ['Financeiro'], complexity: 'Leve', integrity: 100 },
    { id: '17', title: 'Pipeline de Contratos Futuros', category: 'sales', icon: ClipboardList, desc: 'Gestão de exposição e contratos de termo.', color: '#db2777', categoryLabel: 'COMERCIAL', tags: ['Financeiro', 'Fiscal'], complexity: 'Médio', integrity: 100 },

    // GOVERNANÇA
    { id: '18', title: 'Relatório de Auditoria (Logs)', category: 'gov', icon: Shield, desc: 'Rastreabilidade de ações e conformidade de acesso.', color: '#94a3b8', categoryLabel: 'GOVERNANÇA', tags: ['Auditoria', 'RH'], complexity: 'Leve', integrity: 100 },
    { id: '19', title: 'KPIs de Sustentabilidade', category: 'gov', icon: Activity, desc: 'Métricas ESG e eficiência socioambiental.', color: '#94a3b8', categoryLabel: 'GOVERNANÇA', tags: ['Auditoria', 'Operacional'], complexity: 'Médio', integrity: 50 },
    { id: '20', title: 'Consolidado de Unidades (Multi-fazenda)', category: 'gov', icon: LayoutGrid, desc: 'Visão agregada de performance corporativa.', color: '#94a3b8', categoryLabel: 'GOVERNANÇA', tags: ['Financeiro', 'Operacional'], complexity: 'Pesado', integrity: 100 },

    // INTELIGÊNCIA AVANÇADA (NEW)
    { id: '21', title: 'Simulação de Monte Carlo (Risco)', category: 'finance', icon: Brain, desc: 'Análise probabilística de rentabilidade e estresse financeiro.', color: '#8b5cf6', categoryLabel: 'IA PREDITIVA', tags: ['Financeiro', 'Auditoria'], complexity: 'Pesado', integrity: 100 },
    { id: '22', title: 'Predição de Suporte de Pasto (IA)', category: 'livestock', icon: Globe, desc: 'Estimativa de suporte biológico via NDVI e dados climáticos.', color: '#8b5cf6', categoryLabel: 'IA PREDITIVA', tags: ['Zootécnico', 'Operacional'], complexity: 'Pesado', integrity: 75 },
    { id: '23', title: 'Análise de Sensibilidade (@ vs Dólar)', category: 'finance', icon: BarChart4, desc: 'Matriz de impacto cambial na margem líquida direta.', color: '#3b82f6', categoryLabel: 'ESTRATÉGICO', tags: ['Financeiro'], complexity: 'Médio', integrity: 100 },
    { id: '24', title: 'IPB (Índice Produtividade Biológica)', category: 'livestock', icon: Target, desc: 'Score consolidado de eficiência produtiva do plantel.', color: '#10b981', categoryLabel: 'CIÊNCIA DE DADOS', tags: ['Zootécnico'], complexity: 'Médio', integrity: 100 },
    { id: '25', title: 'Benchmarking Best Practices', category: 'gov', icon: TrendingUp, desc: 'Comparativo inter-unidades para identificação de Gold Standards.', color: '#94a3b8', categoryLabel: 'GOVERNANÇA', tags: ['Auditoria', 'Operacional'], complexity: 'Pesado', integrity: 100 },
    { id: '26', title: 'Balanço de Carbono (ESG)', category: 'gov', icon: Leaf, desc: 'Monitoramento de sequestro vs. emissão entérica certificada.', color: '#10b981', categoryLabel: 'SUSTENTABILIDADE', tags: ['Auditoria', 'Fiscal'], complexity: 'Médio', integrity: 100 },
    { id: '27', title: 'Conformidade Socioambiental', category: 'gov', icon: Shield, desc: 'Auditoria de áreas embargadas e compliance de parceiros.', color: '#ef4444', categoryLabel: 'RISCO & COMPLIANCE', tags: ['Auditoria', 'Fiscal'], complexity: 'Médio', integrity: 100 },
    { id: '28', title: 'Análise de Variância (Plan x Real)', category: 'finance', icon: BarChart3, desc: 'Decomposição de desvios por preço, volume e eficiência.', color: '#3b82f6', categoryLabel: 'CONTROLADORIA', tags: ['Financeiro', 'Fiscal'], complexity: 'Pesado', integrity: 100 },
  ];

  const handleGenerateReport = (report: any) => {
    setSelectedReport(report);
    setIsViewerOpen(true);
  };

  const handleDirectDownload = async (e: React.MouseEvent, report: any) => {
    e.stopPropagation();
    if (!tenant?.id) return;

    try {
      // Feedback visual: mudar cursor para 'wait'
      document.body.style.cursor = 'wait';
      
      const { data, columns } = await fetchReportDataById(report.id, tenant.id);
      
      if (data && data.length > 0) {
        exportToExcel(data, columns, report.title);
        
        // Atualizar timestamp de geração
        if (userProfile?.id) {
          const now = new Date().toISOString();
          const newHistory = { 
            ...(userProfile.settings?.generationHistory || {}),
            [report.id]: now
          };
          
          await supabase
            .from('profiles')
            .update({ 
              settings: { 
                ...(userProfile.settings || {}), 
                generationHistory: newHistory 
              } 
            })
            .eq('id', userProfile.id);
            
          await refreshProfile();
        }
      } else {
        alert("Este relatório não possui dados para exportação no momento.");
      }
    } catch (error) {
      console.error("Erro ao baixar relatório:", error);
      alert("Erro ao processar exportação. Tente novamente.");
    } finally {
      document.body.style.cursor = 'default';
    }
  };

  const handleOpenSchedule = (e: React.MouseEvent, report: any) => {
    e.stopPropagation();
    setReportToSchedule(report);
    setIsScheduleModalOpen(true);
  };


  const getGenerationTime = (reportId: string) => {
    const timestamp = userProfile?.settings?.generationHistory?.[reportId];
    if (!timestamp) return { date: 'Nunca', time: '--:--:--' };
    
    const d = new Date(timestamp);
    return {
      date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const filteredReports = reportTypes
    .filter(r => (activeCategory === 'all' || r.category === activeCategory))
    .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(r => {
      // Advanced Filters
      const matchesTags = advancedFilters.tags.length === 0 || 
        advancedFilters.tags.every(tag => 
          r.tags?.some(rTag => rTag.toLowerCase() === tag.toLowerCase())
        );
      
      const matchesComplexity = advancedFilters.complexity === 'all' || 
        r.complexity === advancedFilters.complexity;
      
      const matchesFavorites = !advancedFilters.onlyFavorites || 
        favorites.includes(r.id);
      
      const matchesIntegrity = (r.integrity || 0) >= advancedFilters.minIntegrity;

      return matchesTags && matchesComplexity && matchesFavorites && matchesIntegrity;
    });

  return (
    <div className="admin-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <Sparkles size={14} fill="currentColor" />
            <span>ELITE INTELLIGENCE v5.0</span>
          </div>
          <h1 className="page-title">Relatórios Operacionais</h1>
          <p className="page-subtitle">
            {isGlobalMode 
              ? 'Visão consolidada de todas as unidades produtivas do grupo.' 
              : `Listagem técnica e exportação de documentos da unidade ${activeFarm?.name || 'sua fazenda'}.`}
          </p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => navigate('/bi')}>
            <PieChart size={18} />
            CENTRAL DE BI
          </button>
          <button className="primary-btn" onClick={() => alert('Dossier Mode: Selecione múltiplos relatórios para compilar um dossiê executivo.')}>
            <Layers size={18} />
            GERAR DOSSIÊ
          </button>
        </div>
      </header>

      {/* Engine Status Bar */}
      <div className="reporting-engine-bar">
        <div className="engine-status">
          <div className="status-indicator online"></div>
          <span className="status-text">REPORTING ENGINE ACTIVE</span>
        </div>
        <div className="engine-metrics">
          <div className="e-metric">
            <span className="m-label">DATA FRESHNESS</span>
            <span className="m-val">Tempo Real (Sync: 2m)</span>
          </div>
          <div className="e-metric">
            <span className="m-label">LATÊNCIA MÉDIA</span>
            <span className="m-val">840ms / geração</span>
          </div>
          <div className="e-metric">
            <span className="m-label">ACURACIDADE</span>
            <span className="m-val">99.98% Audited</span>
          </div>
        </div>
      </div>

      <motion.div 
        key="main-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
      <div className="elite-controls-row" style={{ marginTop: '24px' }}>
        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Pesquisar relatórios por nome ou tag técnica..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
          >
            <ClipboardList size={18} />
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Visualização em Grade"
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        <div className="elite-filter-group">
          <button 
            className={`icon-btn-secondary ${selectedPeriod !== 'safra_atual' ? 'active' : ''}`} 
            title="Filtrar por Período"
            onClick={() => setIsPeriodModalOpen(true)}
          >
            <Calendar size={18} />
          </button>
          <button 
            className={`icon-btn-secondary ${
              advancedFilters.tags.length > 0 || 
              advancedFilters.complexity !== 'all' || 
              advancedFilters.onlyFavorites || 
              advancedFilters.minIntegrity > 0 ? 'active' : ''
            }`}
            onClick={() => setIsFilterModalOpen(true)}
            title="Filtros Avançados"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ai-insight-strip"
      >
        <div className="ai-icon">
          <Brain size={20} />
        </div>
        <div className="ai-content">
          <span className="ai-tag">COPILOT INSIGHT</span>
          {activeCategory === 'finance' ? (
            <p>O relatório <strong>"Custo p/ @ Produzida"</strong> teve um aumento de 12% na geração esta semana. Recomendamos revisar as margens de fechamento.</p>
          ) : activeCategory === 'livestock' ? (
            <p>A taxa de lotação no <strong>"Heatmap de Ocupação"</strong> indica sobrecarga em 3 piquetes. Considere remanejar o lote 42.</p>
          ) : (
            <p>Seus relatórios de <strong>{activeCategory === 'all' ? 'Performance' : activeCategory.toUpperCase()}</strong> estão sincronizados. Deseja gerar um resumo executivo?</p>
          )}
        </div>
        <button className="ai-action-btn" onClick={() => navigate('/bi')}>ANALISAR AGORA</button>
      </motion.div>


            <div className="report-hub-layout">
              {/* Sidebar de Navegação */}
              <aside className="report-sidebar-nav">
                <div className="nav-section">
                  <span className="section-label">CATEGORIAS</span>
                  <div className="nav-items">
                    <button 
                      className={`nav-item-btn ${activeCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveCategory('all')}
                    >
                      <Layers size={16} />
                      <span>Todos os Relatórios</span>
                      <span className="count">{reportTypes.length}</span>
                    </button>
                    <button 
                      className={`nav-item-btn ${activeCategory === 'livestock' ? 'active' : ''}`}
                      onClick={() => setActiveCategory('livestock')}
                    >
                      <Activity size={16} />
                      <span>Pecuária & Manejo</span>
                      <span className="count">{reportTypes.filter(r => r.category === 'livestock').length}</span>
                    </button>
                    <button 
                      className={`nav-item-btn ${activeCategory === 'finance' ? 'active' : ''}`}
                      onClick={() => setActiveCategory('finance')}
                    >
                      <DollarSign size={16} />
                      <span>Financeiro & DRE</span>
                      <span className="count">{reportTypes.filter(r => r.category === 'finance').length}</span>
                    </button>
                    <button 
                      className={`nav-item-btn ${activeCategory === 'fleet' ? 'active' : ''}`}
                      onClick={() => setActiveCategory('fleet')}
                    >
                      <Truck size={16} />
                      <span>Frota & Logística</span>
                      <span className="count">{reportTypes.filter(r => r.category === 'fleet').length}</span>
                    </button>
                    <button 
                      className={`nav-item-btn ${activeCategory === 'supply' ? 'active' : ''}`}
                      onClick={() => setActiveCategory('supply')}
                    >
                      <Package size={16} />
                      <span>Suprimentos & Estoque</span>
                      <span className="count">{reportTypes.filter(r => r.category === 'supply').length}</span>
                    </button>
                    <button 
                      className={`nav-item-btn ${activeCategory === 'sales' ? 'active' : ''}`}
                      onClick={() => setActiveCategory('sales')}
                    >
                      <ShoppingCart size={16} />
                      <span>Vendas & CRM</span>
                      <span className="count">{reportTypes.filter(r => r.category === 'sales').length}</span>
                    </button>
                    <button 
                      className={`nav-item-btn ${activeCategory === 'gov' ? 'active' : ''}`}
                      onClick={() => setActiveCategory('gov')}
                    >
                      <Shield size={16} />
                      <span>Governança & ESG</span>
                      <span className="count">{reportTypes.filter(r => r.category === 'gov').length}</span>
                    </button>
                  </div>
                </div>

                <div className="nav-section" style={{ marginTop: '32px' }}>
                  <span className="section-label">PREFERIDOS</span>
                  <div className="nav-items">
                    {favorites.length > 0 ? (
                      reportTypes.filter(r => favorites.includes(r.id)).map(fav => (
                        <button 
                          key={`fav-${fav.id}`}
                          className="nav-item-btn fav-item"
                          onClick={() => handleGenerateReport(fav)}
                        >
                          <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                          <span>{fav.title}</span>
                        </button>
                      ))
                    ) : (
                      <div className="empty-favorites">
                        Nenhum favorito selecionado
                      </div>
                    )}
                  </div>
                </div>
              </aside>

              {/* Lista Principal de Documentos */}
              <main className="report-document-list">
                <div className={`list-header-meta ${viewMode === 'grid' ? 'hidden' : ''}`}>
                  <div className="col-name">NOME DO DOCUMENTO</div>
                  <div className="col-meta">METADADOS TÉCNICOS</div>
                  <div className="col-last">ÚLTIMA GERAÇÃO</div>
                  <div className="col-actions"></div>
                </div>

                <div className={`document-rows ${viewMode}`}>
                    {filteredReports.map((report, idx) => (
                      <motion.div 
                        key={report.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="report-document-row"
                        onClick={() => handleGenerateReport(report)}
                      >
                        <div className="doc-main-col">
                          <button 
                            className={`favorite-star ${favorites.includes(report.id) ? 'active' : ''}`} 
                            onClick={(e) => toggleFavorite(e, report.id)}
                          >
                            <Star 
                              size={14} 
                              fill={favorites.includes(report.id) ? "#f59e0b" : "none"} 
                              stroke={favorites.includes(report.id) ? "#f59e0b" : "currentColor"} 
                            />
                          </button>
                          <div className="doc-info">
                            <div className="doc-icon-wrapper" style={{ background: `${report.color}15`, color: report.color }}>
                              <FileText size={20} />
                            </div>
                            <div className="doc-text">
                              <span className="title">{report.title}</span>
                              <p className="doc-row-desc">{report.desc}</p>
                              <div className="category-badge-wrapper">
                                <span className="cat-dot" style={{ backgroundColor: report.color }}></span>
                                <span className="category">{report.categoryLabel}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="doc-metadata">
                          {report.tags?.slice(0, 2).map((tag: string) => (
                            <div key={tag} className="meta-tag">
                              <Layers size={12} />
                              <span>{tag.toUpperCase()}</span>
                            </div>
                          ))}
                          <div className={`meta-tag complexity ${report.complexity?.toLowerCase()}`}>
                            <Zap size={12} />
                            <span>{report.complexity}</span>
                          </div>
                          <div 
                            className="meta-tag integrity" 
                            style={{ 
                              background: report.integrity >= 90 ? '#f0fdf4' : '#fff7ed', 
                              color: report.integrity >= 90 ? '#16a34a' : '#c2410c',
                              border: `1px solid ${report.integrity >= 90 ? '#dcfce7' : '#ffedd5'}`
                            }}
                          >
                            <Shield size={12} />
                            <span>INTEGRIDADE: {report.integrity}%</span>
                          </div>
                        </div>

                      <div className="doc-timestamp">
                        <span className="date">{getGenerationTime(report.id).date}</span>
                        <span className="time">{getGenerationTime(report.id).time}</span>
                      </div>

                        <div className="doc-actions">
                          <button 
                            className="action-btn-doc" 
                            title="Agendar Relatório Automático" 
                            onClick={(e) => handleOpenSchedule(e, report)}
                          >
                            <Clock size={16} />
                          </button>

                          <button 
                            className="action-btn-doc" 
                            title="Download Direto Excel" 
                            onClick={(e) => handleDirectDownload(e, report)}
                          >
                            <Download size={16} />
                          </button>
                        </div>
                    </motion.div>
                  ))}
                </div>
              </main>
            </div>

      </motion.div>

      {isViewerOpen && selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => setIsViewerOpen(false)} 
        />
      )}

      {isScheduleModalOpen && reportToSchedule && (
        <ScheduleModal 
          report={reportToSchedule}
          onClose={() => setIsScheduleModalOpen(false)}
        />
      )}

      {isPeriodModalOpen && (
        <PeriodSelectorModal 
        isOpen={isPeriodModalOpen} 
        onClose={() => setIsPeriodModalOpen(false)}
        selectedPeriod={selectedPeriod}
        onSelect={setSelectedPeriod}
      />
      )}

      <ReportFilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={advancedFilters}
        setFilters={setAdvancedFilters}
      />


      <style>{`
        .reporting-engine-bar {
          background: #0f172a;
          padding: 8px 24px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }

        .engine-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-indicator.online {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 10px #10b981;
        }

        .status-text {
          font-size: 10px;
          font-weight: 900;
          color: white;
          letter-spacing: 0.1em;
        }

        .engine-metrics {
          display: flex;
          gap: 32px;
        }

        .e-metric {
          display: flex;
          flex-direction: column;
        }

        .m-label {
          font-size: 8px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        .m-val {
          font-size: 11px;
          font-weight: 700;
          color: #e2e8f0;
        }

        .ai-insight-strip {
          background: linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%);
          border: 1px solid #dcfce7;
          border-radius: 16px;
          padding: 12px 20px;
          margin: 24px 0;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ai-icon {
          width: 40px;
          height: 40px;
          background: #10b981;
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .ai-content {
          flex: 1;
        }

        .ai-tag {
          font-size: 9px;
          font-weight: 900;
          color: #10b981;
          letter-spacing: 0.1em;
        }

        .ai-content p {
          font-size: 13px;
          color: #1e293b;
          margin: 2px 0 0;
          font-weight: 500;
        }

        .icon-btn-secondary {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: transparent;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: 0.2s;
        }

        .icon-btn-secondary:hover {
          background: hsl(var(--bg-main));
          color: hsl(var(--brand));
          border-color: hsl(var(--brand) / 0.3);
        }

        .icon-btn-secondary.active {
          background: hsl(var(--brand) / 0.1);
          color: hsl(var(--brand));
          border-color: hsl(var(--brand) / 0.5);
          box-shadow: 0 0 10px hsl(var(--brand) / 0.1);
        }

        .ai-action-btn {
          padding: 8px 16px;
          background: white;
          border: 1px solid #dcfce7;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 800;
          color: #10b981;
          cursor: pointer;
          transition: 0.2s;
        }

        .ai-action-btn:hover {
          background: #10b981;
          color: white;
        }

        .view-mode-toggle {
          display: flex;
          background: hsl(var(--bg-main));
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
          margin: 0 8px;
          border: 1px solid hsl(var(--border));
        }

        .view-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: 0.2s;
        }

        .view-btn.active {
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .report-hub-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          margin-top: 0;
          align-items: start;
        }

        .report-sidebar-nav {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          padding: 24px;
          position: sticky;
          top: 24px;
        }

        .nav-section .section-label {
          display: block;
          font-size: 11px;
          font-weight: 900;
          color: hsl(var(--text-muted));
          letter-spacing: 0.1em;
          margin-bottom: 16px;
          padding-left: 12px;
        }

        .nav-items { display: flex; flex-direction: column; gap: 4px; }
        
        .nav-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: hsl(var(--text-muted));
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .nav-item-btn span:not(.count) {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
        }

        .nav-item-btn:hover { background: hsl(var(--bg-main)); color: hsl(var(--text-main)); }
        .nav-item-btn.active { background: hsl(var(--brand) / 0.1); color: hsl(var(--brand)); }
        
        .nav-item-btn .count {
          margin-left: auto;
          font-size: 11px;
          font-weight: 800;
          background: hsl(var(--border));
          color: hsl(var(--text-muted));
          padding: 2px 8px;
          border-radius: 6px;
        }

        .nav-item-btn.active .count { background: hsl(var(--brand)); color: white; }

        .list-header-meta.hidden {
          display: none;
        }

        .document-rows.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .document-rows.grid .report-document-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
          height: 100%;
          padding: 24px;
        }

        .document-rows.grid .doc-main-col {
          width: 100%;
        }

        .document-rows.grid .doc-metadata {
          flex-wrap: wrap;
          margin-top: auto;
          width: 100%;
        }

        .document-rows.grid .doc-timestamp {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid hsl(var(--border));
          width: 100%;
        }

        .document-rows.grid .doc-actions {
          width: 100%;
          justify-content: flex-start;
          margin-top: 12px;
        }

        /* List Mode Overrides */
        .document-rows.list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .document-rows.list .report-document-row {
          display: grid;
          grid-template-columns: 3fr 1.2fr 1fr 120px;
        }

        .report-document-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .list-header-meta {
          display: grid;
          grid-template-columns: 3fr 1.2fr 1fr 120px;
          padding: 0 24px 12px;
          font-size: 11px;
          font-weight: 900;
          color: hsl(var(--text-muted));
          letter-spacing: 0.05em;
          border-bottom: 1px solid hsl(var(--border));
        }

        .report-document-row {
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          padding: 16px 24px;
          display: grid;
          grid-template-columns: 3fr 1.2fr 1fr 120px;
          align-items: center;
          transition: all 0.2s;
          cursor: pointer;
        }

        .report-document-row:hover {
          border-color: hsl(var(--brand) / 0.4);
          background: hsl(var(--bg-main) / 0.5);
          transform: translateX(4px);
          box-shadow: var(--shadow-sm);
        }

        .doc-main-col { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
        
        .doc-info { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          flex: 1; 
          min-width: 0; 
        }

        .doc-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 20px;
        }

        .doc-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .doc-row-desc {
          font-size: 11px;
          color: hsl(var(--text-muted));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 500px;
          margin: 1px 0 3px 0;
          font-weight: 500;
        }
        
        .favorite-star {
          background: transparent;
          border: none;
          color: #cbd5e1;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 50%;
        }
        .favorite-star:hover { background: hsl(var(--bg-main)); transform: scale(1.1); }
        .favorite-star.active { color: #f59e0b; }

        .fav-item {
          padding: 8px 12px;
          font-size: 12px;
        }
        .fav-item span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .empty-favorites {
          padding: 12px;
          font-size: 11px;
          color: hsl(var(--text-muted));
          font-style: italic;
          text-align: center;
          background: hsl(var(--bg-main) / 0.5);
          border-radius: 12px;
          border: 1px dashed hsl(var(--border));
        }

        .category-badge-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .cat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .doc-metadata { display: flex; gap: 12px; }
        .meta-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: hsl(var(--bg-main));
          border-radius: 8px;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
        }

        .doc-timestamp { display: flex; flex-direction: column; }
        .doc-timestamp .date { font-size: 12px; font-weight: 800; color: hsl(var(--text-main)); }
        .doc-timestamp .time { font-size: 11px; color: hsl(var(--text-muted)); font-weight: 500; }

        .doc-actions { display: flex; align-items: center; gap: 12px; justify-content: flex-end; }
        
        .action-btn-doc {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: transparent;
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        .action-btn-doc:hover { color: hsl(var(--brand)); border-color: hsl(var(--brand)); background: hsl(var(--brand) / 0.1); }

        
      `}</style>
    </div>
  );
};
