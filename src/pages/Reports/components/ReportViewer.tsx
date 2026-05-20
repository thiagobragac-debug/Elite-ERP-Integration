import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  Maximize2, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernTable } from '../../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../../components/Cards/EliteStatCard';
import { useTenant } from '../../../contexts/TenantContext';
import { supabase } from '../../../lib/supabase';
import { useReportData } from '../../../hooks/useReportData';
import { exportToExcel } from '../../../utils/exportUtils';

interface ReportViewerProps {
  report: any;
  onClose: () => void;
}

// Sub-componente para o Layout de Impressão/PDF para evitar duplicação
const ReportPrintLayout: React.FC<{
  report: any;
  data: any[];
  stats: any[];
  columns: any[];
  activeFarm: any;
}> = ({ report, data, stats, columns, activeFarm }) => (
  <div className="pdf-print-root">
    <div className="print-watermark">ELITE ERP</div>
    
    <div className="print-modern-header">
      <div className="header-top-bar"></div>
      <div className="header-content">
        <div className="print-logo-section">
          <div className="print-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="print-brand-info">
            <span className="print-brand-name">ELITE INTELLIGENCE v5.0</span>
            <span className="print-brand-tag">Relatório Analítico de Precisão</span>
          </div>
        </div>
        <div className="print-report-meta">
          <div className="meta-badge">CONFIDENCIAL</div>
          <div className="meta-text"><strong>Gerado em:</strong> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    </div>

    <div className="print-report-title-section">
      <div className="title-left">
        <h2>{report.title}</h2>
        <p>{report.desc}</p>
      </div>
      <div className="title-right">
        <div className="unit-badge">
          <span>UNIDADE</span>
          <strong>{activeFarm?.name || 'Fazenda Elite Agro'}</strong>
        </div>
      </div>
    </div>

    <div className="viewer-content print-viewer-content">
      <div className="next-gen-kpi-grid">
        {(stats || []).map((s, idx) => {
           const Icon = s.icon || (s.trend === 'down' ? TrendingDown : TrendingUp);
           return (
           <div key={idx} className="print-stat-card">
             <div className="stat-header">
               <span className="stat-label">{s.label}</span>
               <Icon size={16} color={s.trend === 'down' ? "#ef4444" : "#10b981"} />
             </div>
             <div className="stat-value" style={{ color: '#0f172a' }}>{s.value}</div>
             <div className={`stat-trend ${s.trend}`}>
               {s.change} vs mês ant.
             </div>
           </div>
        )})}
      </div>

      <div className="print-data-full export-visible">
        <div className="table-wrapper">
          <table className="full-print-table">
            <thead>
              <tr>
                {(columns || []).map((col: any, i: number) => <th key={i}>{col.header}</th>)}
              </tr>
            </thead>
            <tbody>
              {(data || []).map((item: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'even-row' : 'odd-row'}>
                  {(columns || []).map((col: any, j: number) => {
                    const isNumeric = col.header.toLowerCase().includes('valor') || 
                                     col.header.toLowerCase().includes('gmd') || 
                                     col.header.toLowerCase().includes('total') ||
                                     col.header.toLowerCase().includes('peso');
                    return (
                      <td key={j} style={{ textAlign: isNumeric ? 'right' : 'left' }}>
                        {typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="print-signature-section">
        <div className="signature-box">
          <div className="sig-line"></div>
          <span>Responsável Técnico / Emissor</span>
          <span className="sig-date">Assinado em ___/___/20___</span>
        </div>
        <div className="signature-box">
          <div className="sig-line"></div>
          <span>Gestor da Unidade</span>
          <span className="sig-date">Assinado em ___/___/20___</span>
        </div>
      </div>

      <div className="print-only-footer">
        <div className="footer-left">
          <strong>Elite Intelligence Engine</strong> • Documento gerado eletronicamente
        </div>
        <div className="footer-right">
          Protocolo: {Math.random().toString(36).substring(7).toUpperCase()} • Página 1 de 1
        </div>
      </div>
    </div>
  </div>
);

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose }) => {
  const { activeFarm, userProfile, refreshProfile } = useTenant();
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 15;
  
  const { data, stats, columns, totalCount, loading, error } = useReportData(
    report?.id || null, 
    currentPage, 
    itemsPerPage
  );
  
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [fullData, setFullData] = React.useState<any[] | null>(null);
  const [isSharing, setIsSharing] = React.useState(false);

  const handleShare = async () => {
    const shareText = `Confira o relatório Analítico de Precisão: "${report.title}" - ${activeFarm?.name || 'Fazenda'}.`;
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Elite ERP: ${report.title}`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\nAcesse pelo Elite ERP: ${shareUrl}`);
        setIsSharing(true);
        setTimeout(() => setIsSharing(false), 2000);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', err);
      }
    }
  };
  
  const updateGenerationHistory = async () => {
    if (!userProfile?.id) return;
    
    try {
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
    } catch (error) {
      console.error("Erro ao atualizar histórico de geração:", error);
    }
  };

  const loadFullData = async () => {
    if (fullData) return fullData;
    const result = await import('../../../hooks/useReportData').then(m => 
      m.fetchReportDataById(report.id, userProfile?.tenant_id || '', activeFarm?.id || undefined, 1, 10000)
    );
    setFullData(result.data);
    return result.data;
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    const exportData = await loadFullData();
    if (!exportData || exportData.length === 0) {
      setIsExporting(false);
      return;
    }
    exportToExcel(exportData, columns, report.title);
    updateGenerationHistory();
    setIsExporting(false);
  };

  const handlePrint = async () => {
    setIsExporting(true);
    await loadFullData();
    setTimeout(() => {
      window.print();
      setIsExporting(false);
      updateGenerationHistory();
    }, 500);
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    await loadFullData();
    
    setTimeout(() => {
      const element = pdfRef.current;
      
      if (!element) {
        console.error('Erro: Container de exportação não encontrado no DOM.');
        setIsExporting(false);
        return;
      }

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `RELATORIO_${report.title.replace(/\s+/g, '_').toUpperCase()}_${activeFarm?.name?.replace(/\s+/g, '_').toUpperCase() || 'ELITE'}.pdf`,
        image: { type: 'jpeg' as const, quality: 1.0 },
        html2canvas: { 
          scale: 3, 
          useCORS: true, 
          letterRendering: true,
          width: 1120,
          windowWidth: 1120,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: '#ffffff',
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const, compress: true },
        pagebreak: { mode: ['css', 'legacy'], avoid: '.elite-stat-card' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setIsExporting(false);
        updateGenerationHistory();
      }).catch((err: any) => {
        console.error('Erro ao gerar PDF:', err);
        setIsExporting(false);
      });
    }, 500);
  };

  if (!report) return null;

  return createPortal(
    <AnimatePresence>
      <div className="report-viewer-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="viewer-container"
          onClick={e => e.stopPropagation()}
        >
        <header className="viewer-header">
          <div className="left-side">
            <button className="back-btn" onClick={onClose}>
              <ChevronLeft size={20} />
            </button>
            <div className="report-title">
              <div className="title-row">
                <report.icon size={20} style={{ color: report.color }} />
                <h2>{report.title}</h2>
              </div>
              <p>{report.desc}</p>
            </div>
          </div>
          
          <div className="viewer-actions">
            <button 
              className={`icon-btn ${isExporting ? 'loading' : ''}`} 
              title="Baixar Layout PDF" 
              onClick={handleDownloadPDF}
              disabled={isExporting}
            >
              {isExporting ? <div className="mini-spinner" /> : <Download size={18} />}
            </button>
            <button 
              className={`icon-btn ${isExporting ? 'loading' : ''}`} 
              title="Imprimir / PDF" 
              onClick={handlePrint}
              disabled={isExporting}
            >
              {isExporting ? <div className="mini-spinner" /> : <Printer size={18} />}
            </button>
            <button className="icon-btn" title={isSharing ? "Copiado!" : "Compartilhar"} onClick={handleShare}>
              {isSharing ? <CheckCircle2 size={18} color="#10b981" /> : <Share2 size={18} />}
            </button>
            <div className="v-sep"></div>
            <button className="close-btn-premium" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="viewer-content">
          <div className="next-gen-kpi-grid">
            {stats && stats.length > 0 ? stats.map((s, idx) => (
               <EliteStatCard 
               key={idx}
               label={s.label}
               value={s.value}
               icon={s.trend === 'down' ? TrendingDown : TrendingUp}
               color={s.trend === 'down' ? "#ef4444" : "#10b981"}
               progress={100}
               change={s.change}
               trend={s.trend === 'down' ? 'down' : 'up'}
             />
            )) : (
              <>
                <EliteStatCard label="Volume Processado" value="1.420" icon={Activity} color="#10b981" progress={100} change="+4.2%" trend="up" />
                <EliteStatCard label="Performance Global" value="92.4%" icon={TrendingUp} color="#3b82f6" progress={92} change="+1.5%" trend="up" />
                <EliteStatCard label="Custo Médio / Un" value="R$ 12.40" icon={DollarSign} color="#f59e0b" progress={60} change="-0.8%" trend="down" />
              </>
            )}
          </div>

          <div className="viewer-main-analytics">
            <div className="analytics-card">
              <div className="card-header">
                <h3>Detalhamento de Registros</h3>
                <span className="subtitle">Dados paginados em tempo real • Escala Comercial</span>
              </div>
            {error ? (
              <div className="report-error">
                <span>Ocorreu um erro ao carregar os dados reais: {error}</span>
                <button onClick={() => window.location.reload()}>Tentar Novamente</button>
              </div>
            ) : (
              <ModernTable 
                data={data || []}
                columns={columns || []}
                hideHeader={false}
                onExport={handleExportExcel}
                loading={loading}
                totalCount={totalCount}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
              />
            )}
            </div>
          </div>
        </div>
        </motion.div>

        {/* CONTAINER OCULTO PARA GERAÇÃO DE PDF - Evita flicker na UI mas permite renderização correta pelo html2canvas */}
        <div 
          className="pdf-export-engine-container" 
          style={{ position: 'absolute', top: 0, left: 0, width: '1120px', zIndex: -100, opacity: 0, pointerEvents: 'none' }}
        >
          {isExporting && (
            <div ref={pdfRef} className="is-exporting-pdf">
              <ReportPrintLayout 
                report={report} 
                data={fullData || data} 
                stats={stats} 
                columns={columns} 
                activeFarm={activeFarm} 
              />
            </div>
          )}
        </div>

        {/* Versão para Impressão do Navegador (Oculta na Tela) */}
        <div className="browser-print-only-container">
           <ReportPrintLayout 
              report={report} 
              data={fullData || data} 
              stats={stats} 
              columns={columns} 
              activeFarm={activeFarm} 
            />
        </div>

        <style>{`
          .report-viewer-overlay {
            position: fixed; inset: 0;
            background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px);
            z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 40px;
          }

          .viewer-container {
            width: 100%; max-width: 1200px; height: 100%; max-height: 85vh;
            background: hsl(var(--bg-main)); display: flex; flex-direction: column;
            overflow: hidden; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }

          /* ESTILOS DE EXPORTAÇÃO PDF */
          .is-exporting-pdf {
            width: 1120px !important; background: white !important; padding: 0 !important;
            font-family: 'Inter', sans-serif !important; color: #0f172a !important;
            position: relative; overflow: hidden;
          }
          
          .is-exporting-pdf .print-watermark {
            position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 140px; font-weight: 900; color: rgba(0,0,0,0.02); z-index: 0; pointer-events: none;
            white-space: nowrap;
          }

          .is-exporting-pdf .print-modern-header {
            background: #f8fafc !important; position: relative; z-index: 1;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          
          .is-exporting-pdf .header-top-bar {
            height: 6px; background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%) !important; width: 100%;
          }

          .is-exporting-pdf .header-content {
            display: flex !important; justify-content: space-between; align-items: center;
            padding: 30px 50px !important; width: 100%;
          }

          .is-exporting-pdf .print-logo-section { display: flex; align-items: center; gap: 16px; }
          .is-exporting-pdf .print-logo {
            width: 48px; height: 48px; background: #0f172a !important; color: #10b981 !important;
            border-radius: 12px; display: flex; align-items: center; justify-content: center;
          }
          .is-exporting-pdf .print-logo svg { width: 28px; height: 28px; }

          .is-exporting-pdf .print-brand-name { font-size: 20px; color: #0f172a !important; font-weight: 900; letter-spacing: -0.03em; display: block; }
          .is-exporting-pdf .print-brand-tag { font-size: 12px; color: #64748b !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
          
          .is-exporting-pdf .print-report-meta { text-align: right; }
          .is-exporting-pdf .meta-badge { 
            display: inline-block; background: #fee2e2 !important; color: #ef4444 !important;
            padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 8px;
          }
          .is-exporting-pdf .meta-text { font-size: 12px; color: #475569 !important; }

          .is-exporting-pdf .print-report-title-section {
            padding: 40px 50px 20px 50px !important; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1;
          }
          .is-exporting-pdf .title-left h2 { font-size: 28px; font-weight: 900; color: #0f172a !important; margin: 0 0 8px 0; letter-spacing: -0.03em; }
          .is-exporting-pdf .title-left p { font-size: 14px; color: #64748b !important; margin: 0; max-width: 600px; }
          
          .is-exporting-pdf .unit-badge {
            background: #f1f5f9 !important; padding: 12px 20px; border-radius: 12px; border: 1px solid #e2e8f0 !important;
            display: flex; flex-direction: column; align-items: flex-end;
          }
          .is-exporting-pdf .unit-badge span { font-size: 10px; color: #64748b !important; font-weight: 800; letter-spacing: 0.1em; }
          .is-exporting-pdf .unit-badge strong { font-size: 16px; color: #0f172a !important; font-weight: 900; }

          .is-exporting-pdf .print-viewer-content { padding: 20px 50px 50px 50px !important; position: relative; z-index: 1; }

          .is-exporting-pdf .next-gen-kpi-grid {
            display: flex !important; flex-wrap: nowrap !important;
            gap: 24px !important; margin-bottom: 40px !important; width: 100% !important;
          }

          .is-exporting-pdf .print-stat-card {
            flex: 1; min-width: 0; box-sizing: border-box !important;
            border: 1px solid #e2e8f0 !important; background: #fff !important; padding: 24px !important; 
            border-radius: 16px !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
          }
          .is-exporting-pdf .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
          .is-exporting-pdf .stat-label { font-size: 12px; color: #64748b !important; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .is-exporting-pdf .stat-value { font-size: 32px !important; font-weight: 900 !important; letter-spacing: -0.03em; margin-bottom: 8px; }
          .is-exporting-pdf .stat-trend { font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
          .is-exporting-pdf .stat-trend.up { color: #10b981 !important; }
          .is-exporting-pdf .stat-trend.down { color: #ef4444 !important; }

          .is-exporting-pdf .print-data-full { display: block !important; width: 100% !important; }
          .is-exporting-pdf .table-wrapper { border-radius: 16px; border: 1px solid #e2e8f0 !important; overflow: hidden; }

          .is-exporting-pdf .full-print-table { 
            width: 100% !important; border-collapse: collapse !important; 
            font-size: 13px !important; background: white !important;
          }

          .is-exporting-pdf .full-print-table th { 
            background: #f8fafc !important; border-bottom: 1px solid #e2e8f0 !important; 
            padding: 16px 20px !important; color: #475569 !important; font-weight: 800 !important;
            text-transform: uppercase !important; text-align: left; font-size: 11px !important; letter-spacing: 0.05em;
          }

          .is-exporting-pdf .full-print-table td { 
            border-bottom: 1px solid #f1f5f9 !important; padding: 14px 20px !important; color: #334155 !important; font-weight: 500;
          }
          .is-exporting-pdf .full-print-table .even-row td { background: #fafafa !important; }

          .is-exporting-pdf .print-signature-section {
            display: flex !important; justify-content: space-around; margin-top: 80px !important;
            padding-top: 40px !important; page-break-inside: avoid !important;
          }

          .is-exporting-pdf .signature-box { display: flex; flex-direction: column; align-items: center; width: 300px; }
          .is-exporting-pdf .sig-line { width: 100% !important; border-top: 1px solid #0f172a !important; margin-bottom: 12px !important; }
          .is-exporting-pdf .signature-box span { font-size: 12px; font-weight: 800; color: #0f172a !important; }
          .is-exporting-pdf .signature-box .sig-date { font-size: 10px; font-weight: 500; color: #64748b !important; margin-top: 4px; }

          .is-exporting-pdf .print-only-footer {
            display: flex !important; justify-content: space-between; margin-top: 60px;
            border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8 !important;
          }

          /* INTERFACE PADRÃO */
          .viewer-header {
            padding: 20px 40px; border-bottom: 1px solid hsl(var(--border));
            display: flex; justify-content: space-between; align-items: center;
            background: hsl(var(--bg-card)); height: 80px;
          }

          .left-side { display: flex; align-items: center; gap: 20px; }
          .back-btn {
            width: 40px; height: 40px; border-radius: 12px;
            border: 1px solid hsl(var(--border)); background: hsl(var(--bg-card));
            display: flex; align-items: center; justify-content: center;
            color: hsl(var(--text-muted)); cursor: pointer; transition: all 0.2s;
          }
          .back-btn:hover { background: hsla(var(--brand) / 0.1); color: hsl(var(--brand)); border-color: hsl(var(--brand)); }

          .report-title h2 { font-size: 20px; font-weight: 800; color: hsl(var(--text-main)); margin: 0; }
          .report-title p { 
            font-size: 13px; 
            color: hsl(var(--text-muted)); 
            margin: 2px 0 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 600px;
          }
          .title-row { display: flex; align-items: center; gap: 10px; }

          .viewer-actions { display: flex; align-items: center; gap: 8px; }
          .icon-btn {
            width: 36px; height: 36px; border-radius: 10px;
            border: 1px solid hsl(var(--border)); background: hsl(var(--bg-card));
            display: flex; align-items: center; justify-content: center;
            color: hsl(var(--text-muted)); cursor: pointer; transition: 0.2s;
          }
          .icon-btn:hover { background: hsla(var(--brand) / 0.1); color: hsl(var(--brand)); border-color: hsl(var(--brand)); }
          .icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }

          .mini-spinner {
            width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1);
            border-top-color: hsl(var(--brand)); border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          .v-sep { width: 1px; height: 24px; background: hsl(var(--border)); margin: 0 8px; }

          .close-btn-premium {
            width: 40px; height: 40px; border-radius: 50%; border: none;
            background: hsla(var(--text-muted) / 0.1); color: hsl(var(--text-muted));
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s;
          }
          .close-btn-premium:hover { background: #fee2e2; color: #ef4444; }

          .viewer-content {
            flex: 1; padding: 24px 80px; overflow-y: auto;
            background: hsl(var(--bg-main)); display: flex;
            flex-direction: column; gap: 16px;
          }

          .analytics-card {
            background: hsl(var(--bg-card)); border-radius: 24px;
            border: 1px solid hsl(var(--border)); padding: 16px;
          }

          .card-header { margin-bottom: 16px; }
          .card-header h3 { font-size: 18px; font-weight: 800; color: hsl(var(--text-main)); margin: 0; }
          .card-header .subtitle { font-size: 13px; color: hsl(var(--text-muted)); }

          .report-loading, .report-error {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; padding: 60px; gap: 20px;
            color: hsl(var(--text-muted));
          }

          .spinner {
            width: 40px; height: 40px; border: 3px solid rgba(0,0,0,0.1);
            border-top-color: #10b981; border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin { to { transform: rotate(360deg); } }

          /* IMPRESSÃO DO NAVEGADOR */
          @media print {
            @page { margin: 1cm; size: A4 portrait; }
            html, body { height: auto !important; width: 100% !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: white !important; -webkit-print-color-adjust: exact; font-family: 'Inter', sans-serif !important; color: #0f172a !important; }
            body > *:not(.report-viewer-overlay) { display: none !important; }
            .report-viewer-overlay { position: static !important; display: block !important; background: white !important; padding: 0 !important; margin: 0 !important; opacity: 1 !important; visibility: visible !important; }
            .viewer-container { display: none !important; }
            .pdf-export-engine-container { display: none !important; }
            .browser-print-only-container { display: block !important; width: 100% !important; position: relative; overflow: hidden; }
            
            .print-watermark { position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; font-weight: 900; color: rgba(0,0,0,0.02); z-index: 0; pointer-events: none; white-space: nowrap; }

            .print-modern-header { background: #f8fafc !important; position: relative; z-index: 1; border-bottom: 1px solid #e2e8f0 !important; }
            .header-top-bar { height: 4px; background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%) !important; width: 100%; }
            .header-content { display: flex !important; justify-content: space-between; align-items: center; padding: 20px 30px !important; width: 100%; box-sizing: border-box; }

            .print-logo-section { display: flex; align-items: center; gap: 12px; }
            .print-logo { width: 36px; height: 36px; background: #0f172a !important; color: #10b981 !important; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
            .print-logo svg { width: 20px; height: 20px; }

            .print-brand-name { font-size: 16px; color: #0f172a !important; font-weight: 900; letter-spacing: -0.03em; display: block; }
            .print-brand-tag { font-size: 10px; color: #64748b !important; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
            
            .print-report-meta { text-align: right; }
            .meta-badge { display: inline-block; background: #fee2e2 !important; color: #ef4444 !important; padding: 2px 10px; border-radius: 20px; font-size: 8px; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 4px; }
            .meta-text { font-size: 10px; color: #475569 !important; }

            .print-report-title-section { padding: 30px 30px 15px 30px !important; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; }
            .title-left h2 { font-size: 22px; font-weight: 900; color: #0f172a !important; margin: 0 0 6px 0; letter-spacing: -0.03em; }
            .title-left p { font-size: 12px; color: #64748b !important; margin: 0; max-width: 500px; }
            
            .unit-badge { background: #f1f5f9 !important; padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0 !important; display: flex; flex-direction: column; align-items: flex-end; }
            .unit-badge span { font-size: 8px; color: #64748b !important; font-weight: 800; letter-spacing: 0.1em; }
            .unit-badge strong { font-size: 14px; color: #0f172a !important; font-weight: 900; }

            .print-viewer-content { padding: 15px 30px 30px 30px !important; position: relative; z-index: 1; display: block !important; }

            .next-gen-kpi-grid { display: flex !important; flex-wrap: nowrap !important; gap: 15px !important; margin-bottom: 30px !important; width: 100% !important; }
            .print-stat-card { flex: 1; min-width: 0; box-sizing: border-box !important; border: 1px solid #e2e8f0 !important; background: #fff !important; padding: 15px !important; border-radius: 12px !important; box-shadow: none !important; }
            .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .stat-label { font-size: 10px; color: #64748b !important; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
            .stat-value { font-size: 20px !important; font-weight: 900 !important; letter-spacing: -0.03em; margin-bottom: 4px; color: #0f172a !important; }
            .stat-trend { font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
            .stat-trend.up { color: #10b981 !important; }
            .stat-trend.down { color: #ef4444 !important; }

            .print-data-full { display: block !important; width: 100% !important; }
            .table-wrapper { border-radius: 12px; border: 1px solid #e2e8f0 !important; overflow: hidden; page-break-inside: auto; }
            
            .full-print-table { width: 100% !important; border-collapse: collapse !important; font-size: 11px !important; background: white !important; }
            .full-print-table th { background: #f8fafc !important; border-bottom: 1px solid #e2e8f0 !important; padding: 12px 14px !important; color: #475569 !important; font-weight: 800 !important; text-transform: uppercase !important; text-align: left; font-size: 9px !important; letter-spacing: 0.05em; }
            .full-print-table td { border-bottom: 1px solid #f1f5f9 !important; padding: 10px 14px !important; color: #334155 !important; font-weight: 500; }
            .full-print-table .even-row td { background: #fafafa !important; }
            .full-print-table tr { page-break-inside: avoid !important; }

            .print-signature-section { display: flex !important; justify-content: space-around; margin-top: 60px !important; padding-top: 20px !important; page-break-inside: avoid !important; }
            .signature-box { display: flex; flex-direction: column; align-items: center; width: 250px; }
            .sig-line { width: 100% !important; border-top: 1px solid #0f172a !important; margin-bottom: 8px !important; }
            .signature-box span { font-size: 10px; font-weight: 800; color: #0f172a !important; }
            .signature-box .sig-date { font-size: 8px; font-weight: 500; color: #64748b !important; margin-top: 2px; }

            .print-only-footer { display: flex !important; justify-content: space-between; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 9px; color: #94a3b8 !important; }
          }

          .print-modern-header, .print-watermark, .print-report-title-section, .browser-print-only-container, .print-signature-section, .print-only-footer, .print-data-full { display: none; }
        `}</style>
      </div>
    </AnimatePresence>,
    document.body
  );
};
