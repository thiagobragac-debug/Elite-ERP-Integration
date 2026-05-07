import React, { useState } from 'react';
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
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '../../contexts/TenantContext';
import { useNavigate } from 'react-router-dom';
import { ReportViewer } from './components/ReportViewer';

export const Reports: React.FC = () => {
  const { activeFarm } = useTenant();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | 'finance' | 'livestock' | 'fleet'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const reportTypes = [
    { id: '1', title: 'Performance Ponderal (GMD)', category: 'livestock', icon: Activity, desc: 'Análise de conversão alimentar e eficiência de ganho de peso.', color: '#10b981', categoryLabel: 'LIVESTOCK' },
    { id: '2', title: 'DRE & Fluxo Consolidado', category: 'finance', icon: DollarSign, desc: 'Demonstrativo de resultados e saúde financeira do exercício.', color: '#3b82f6', categoryLabel: 'FINANCE' },
    { id: '3', title: 'TCO de Frota Agroindustrial', category: 'fleet', icon: Truck, desc: 'Custo total de propriedade e eficiência mecânica por ativo.', color: '#6366f1', categoryLabel: 'FLEET' },
    { id: '4', title: 'Giro de Estoque & Demanda', category: 'livestock', icon: ClipboardList, desc: 'Predição de ruptura e análise de consumo de insumos.', color: '#f59e0b', categoryLabel: 'LIVESTOCK' },
    { id: '5', title: 'Heatmap de Ocupação de Pasto', category: 'livestock', icon: Layers, desc: 'Distribuição espacial UA/ha e taxa de lotação dinâmica.', color: '#10b981', categoryLabel: 'LIVESTOCK' },
    { id: '6', title: 'Eficiência Energética (Diesel)', category: 'fleet', icon: BarChart3, desc: 'Benchmark de consumo L/h entre operadores e máquinas.', color: '#ef4444', categoryLabel: 'FLEET' },
  ];

  const handleGenerateReport = (report: any) => {
    setSelectedReport(report);
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsViewerOpen(true);
    }, 2000);
  };

  const filteredReports = (activeCategory === 'all' 
    ? reportTypes 
    : reportTypes.filter(r => r.category === activeCategory)
  ).filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="reports-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge-elite">
            <div className="b-icon">
              <Sparkles size={14} fill="currentColor" />
            </div>
            <span>ELITE INTELLIGENCE v5.0</span>
          </div>
          <h1 className="page-title">Ecossistema de BI</h1>
          <p className="page-subtitle">Inteligência preditiva e relatórios industriais da unidade {activeFarm?.name || 'sua fazenda'} em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn-config" onClick={() => navigate('/admin/bi')}>
            <Layout size={18} />
            <span>CONFIGURAÇÕES BI</span>
          </button>
          <button className="primary-btn-green">
            <Download size={18} />
            <span>EXPORTAR DATASET</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isGenerating ? (
          <motion.div 
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="elite-report-generating"
          >
            <div className="generating-glare"></div>
            <div className="g-icon-wrapper">
              <Sparkles size={48} className="animate-pulse-fast" />
            </div>
            <h2>Compilando BI: {selectedReport?.title}</h2>
            <p>Consultando clusters de dados e gerando projeções analíticas...</p>
            <div className="loading-bar-container">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2 }}
                className="loading-bar-fill"
              ></motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="elite-controls-row">
              <div className="elite-tab-group">
                {[
                  { id: 'all', label: 'CONSOLIDADO', icon: Zap },
                  { id: 'livestock', label: 'PRODUÇÃO', icon: Activity },
                  { id: 'finance', label: 'FINANCEIRO', icon: DollarSign },
                  { id: 'fleet', label: 'LOGÍSTICA', icon: Truck },
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    className={`elite-tab-item ${activeCategory === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(tab.id as any)}
                  >
                    <tab.icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="elite-search-wrapper">
                <Search size={18} className="s-icon" />
                <input 
                  type="text" 
                  className="elite-search-input"
                  placeholder="Pesquisar inteligência por palavra-chave..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="elite-filter-group">
                <button className="icon-btn-secondary" title="Filtros Avançados">
                  <Filter size={20} />
                </button>
              </div>
            </div>

            <div className="reports-grid-v5">
              {filteredReports.map((report, idx) => (
                <motion.div 
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="report-card-v5"
                  onClick={() => handleGenerateReport(report)}
                >
                  <div className="card-top">
                    <div className="icon-box" style={{ color: report.color, background: `${report.color}10` }}>
                      <report.icon size={24} />
                    </div>
                    <span className="cat-badge">{report.categoryLabel}</span>
                  </div>
                  
                  <div className="card-mid">
                    <h3>{report.title}</h3>
                    <p>{report.desc}</p>
                  </div>
                  
                  <div className="card-bottom">
                    <span className="last-run">Último disparo: Hoje</span>
                    <button className="view-btn-elite">
                      <span>VISUALIZAR</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="custom-bi-cta">
              <div className="cta-left">
                <div className="cta-icon">
                  <LayoutGrid size={32} />
                </div>
                <div className="cta-text">
                  <h3>Construtor de BI Customizado</h3>
                  <p>Combine diferentes métricas e crie visualizações exclusivas para sua operação.</p>
                </div>
              </div>
              <button className="cta-btn" onClick={() => navigate('/admin/canvas')}>
                Configurar Canvas BI
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isViewerOpen && selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => setIsViewerOpen(false)} 
        />
      )}

      <style>{`
        .reports-page {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .brand-badge-elite {
          display: flex;
          align-items: center;
          gap: 10px;
          background: hsl(var(--brand) / 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid hsl(var(--brand) / 0.2);
          width: fit-content;
          margin-bottom: 12px;
        }

        .brand-badge-elite .b-icon {
          color: hsl(var(--brand));
          display: flex;
          align-items: center;
        }

        .brand-badge-elite span {
          font-size: 11px;
          font-weight: 900;
          color: hsl(var(--brand));
          letter-spacing: 0.02em;
        }

        .glass-btn-config {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 14px;
          font-size: 12px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: all 0.2s;
        }

        .glass-btn-config:hover {
          background: hsl(var(--bg-main));
          border-color: hsl(var(--brand) / 0.5);
          color: hsl(var(--text-main));
        }

        .primary-btn-green {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: #16a34a;
          border: none;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 800;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-btn-green:hover {
          background: #15803d;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.2);
        }

        .reports-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .reports-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .search-glass-container {
          flex: 1;
          max-width: 500px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 12px 20px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .search-glass-container:focus-within {
          border-color: #16a34a;
          box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.05);
        }

        .search-glass-container input {
          border: none;
          background: transparent;
          width: 100%;
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--text-main));
          outline: none;
        }

        .reports-grid-v5 {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .report-card-v5 {
          background: hsl(var(--bg-card));
          border-radius: 28px;
          border: 1px solid hsl(var(--border));
          padding: 28px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .report-card-v5:hover {
          border-color: hsl(var(--brand));
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cat-badge {
          font-size: 10px;
          font-weight: 900;
          color: #94a3b8;
          letter-spacing: 0.05em;
        }

        .card-mid h3 {
          font-size: 18px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin-bottom: 8px;
        }

        .card-mid p {
          font-size: 13px;
          color: hsl(var(--text-muted));
          line-height: 1.5;
        }

        .card-bottom {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .last-run {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
        }

        .view-btn-elite {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 900;
          color: hsl(var(--brand));
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .elite-report-generating {
          background: #16a34a;
          padding: 80px;
          border-radius: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 24px 48px rgba(22, 163, 74, 0.3);
        }

        .generating-glare {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%);
        }

        .g-icon-wrapper {
          width: 80px;
          height: 80px;
          background: rgba(255,255,255,0.2);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .elite-report-generating h2 { font-size: 28px; font-weight: 900; margin-bottom: 12px; }
        .elite-report-generating p { font-size: 16px; opacity: 0.9; font-weight: 500; margin-bottom: 16px; }

        .loading-bar-container {
          width: 320px;
          height: 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          overflow: hidden;
        }

        .loading-bar-fill {
          height: 100%;
          background: white;
          box-shadow: 0 0 20px white;
        }

        .custom-bi-cta {
          margin-top: 40px;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 32px;
          padding: 16px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s;
        }

        .custom-bi-cta:hover {
          border-color: #16a34a;
          box-shadow: 0 12px 32px rgba(0,0,0,0.04);
        }

        .cta-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .cta-icon {
          width: 64px;
          height: 64px;
          background: hsl(var(--brand) / 0.1);
          color: hsl(var(--brand));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cta-text h3 { font-size: 20px; font-weight: 800; color: hsl(var(--text-main)); margin-bottom: 4px; }
        .cta-text p { font-size: 14px; color: hsl(var(--text-muted)); font-weight: 500; }

        .cta-btn {
          padding: 14px 28px;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          font-size: 13px;
          font-weight: 800;
          color: hsl(var(--text-main));
          cursor: pointer;
          transition: all 0.2s;
        }

        .cta-btn:hover {
          background: hsl(var(--brand));
          color: white;
          border-color: hsl(var(--brand));
        }
      `}</style>
    </div>
  );
};
