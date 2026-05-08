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
    <div className="print-only-header">
      <div className="print-logo-section">
        <div className="print-logo">E</div>
        <div className="print-brand-info">
          <span className="print-brand-name">ELITE ERP v5.0</span>
          <span className="print-brand-tag">Inteligência Operacional de Precisão</span>
        </div>
      </div>
      <div className="print-report-meta">
        <div className="meta-item"><strong>Documento:</strong> {report.title}</div>
        <div className="meta-item"><strong>Unidade:</strong> {activeFarm?.name || 'Fazenda Elite'}</div>
        <div className="meta-item"><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>

    <div className="viewer-content">
      <div className="next-gen-kpi-grid">
        {stats.map((s, idx) => (
           <EliteStatCard 
           key={idx}
           label={s.label}
           value={s.value}
           icon={s.trend === 'up' ? TrendingUp : s.trend === 'down' ? TrendingDown : Activity}
           color={s.trend === 'up' ? "#10b981" : s.trend === 'down' ? "#ef4444" : "#3b82f6"}
           progress={100}
           change={s.change}
           trend={s.trend}
         />
        ))}
      </div>

      <div className="print-data-full export-visible">
        <table className="full-print-table">
          <thead>
            <tr>
              {columns.map((col: any, i: number) => <th key={i}>{col.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((item: any, i: number) => (
              <tr key={i}>
                {columns.map((col: any, j: number) => {
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

      <div className="print-signature-section">
        <div className="signature-box">
          <div className="sig-line"></div>
          <span>Responsável Técnico / Emissor</span>
        </div>
        <div className="signature-box">
          <div className="sig-line"></div>
          <span>Gestor da Unidade</span>
        </div>
      </div>

      <div className="print-only-footer">
        <div className="footer-left">Documento gerado eletronicamente por Elite Intelligence • Protocolo: {Math.random().toString(36).substring(7).toUpperCase()}</div>
        <div className="footer-right">Página 1 de 1</div>
      </div>
    </div>
  </div>
);

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose }) => {
  const { activeFarm, userProfile, refreshProfile } = useTenant();
  const { data, stats, columns, loading, error } = useReportData(report?.id || null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  
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

  const handleExportExcel = () => {
    if (!data || data.length === 0) return;
    exportToExcel(data, columns, report.title);
    updateGenerationHistory();
  };

  const handleDownloadPDF = async () => {
    // Primeiro ativamos o estado de exportação para que o container oculto seja montado
    setIsExporting(true);
    
    // Pequeno delay (500ms) para garantir que o React montou o ReportPrintLayout no DOM e as fontes/estilos carregaram
    setTimeout(() => {
      const element = pdfRef.current;
      
      if (!element) {
        console.error('Erro: Container de exportação não encontrado no DOM.');
        setIsExporting(false);
        return;
      }

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `RELATORIO_${report.title.replace(/\s+/g, '_').toUpperCase()}_${activeFarm?.name?.replace(/\s+/g, '_').toUpperCase() || 'ELITE'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
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
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
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
            <button className="icon-btn" title="Imprimir / PDF" onClick={() => window.print()}><Printer size={18} /></button>
            <button className="icon-btn" title="Compartilhar"><Share2 size={18} /></button>
            <div className="v-sep"></div>
            <button className="close-btn-premium" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="viewer-content">
          <div className="next-gen-kpi-grid">
            {stats.length > 0 ? stats.map((s, idx) => (
               <EliteStatCard 
               key={idx}
               label={s.label}
               value={s.value}
               icon={s.trend === 'up' ? TrendingUp : s.trend === 'down' ? TrendingDown : Activity}
               color={s.trend === 'up' ? "#10b981" : s.trend === 'down' ? "#ef4444" : "#3b82f6"}
               progress={100}
               change={s.change}
               trend={s.trend}
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
                <span className="subtitle">Últimos dados sincronizados em tempo real</span>
              </div>
            {loading ? (
              <div className="report-loading">
                <div className="spinner"></div>
                <span>Processando Inteligência de Dados...</span>
              </div>
            ) : error ? (
              <div className="report-error">
                <span>Ocorreu um erro ao carregar os dados reais: {error}</span>
                <button onClick={() => window.location.reload()}>Tentar Novamente</button>
              </div>
            ) : (
              <ModernTable 
                data={data}
                columns={columns}
                hideHeader={false}
                onExport={handleExportExcel}
              />
            )}
            </div>
          </div>
        </div>
        </motion.div>

        {/* CONTAINER OCULTO PARA GERAÇÃO DE PDF - Evita flicker na UI */}
        <div 
          className="pdf-export-engine-container" 
          style={{ position: 'absolute', left: '-9999px', top: 0, width: '1120px' }}
        >
          {isExporting && (
            <div ref={pdfRef} className="is-exporting-pdf">
              <ReportPrintLayout 
                report={report} 
                data={data} 
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
              data={data} 
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
            width: 1120px !important; background: white !important; padding: 40px !important;
          }

          .is-exporting-pdf .print-only-header {
            display: flex !important; justify-content: space-between; align-items: flex-start;
            width: 100%; border-bottom: 3px solid #000 !important; padding: 0 0 20px 0;
            background: white !important; color: #000 !important; margin-bottom: 30px;
          }

          .is-exporting-pdf .print-logo {
            width: 48px; height: 48px; background: #000 !important; color: #fff !important;
            border-radius: 8px; display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: 28px;
          }

          .is-exporting-pdf .next-gen-kpi-grid {
            display: grid !important; grid-template-columns: repeat(3, 1fr) !important;
            gap: 20px !important; margin-bottom: 30px !important; width: 100% !important;
          }

          .is-exporting-pdf .elite-stat-card {
            border: 1px solid #ddd !important; box-shadow: none !important;
            background: #fff !important; padding: 20px !important; color: #000 !important;
            border-radius: 12px !important;
          }

          .is-exporting-pdf .elite-stat-card .chart-container, 
          .is-exporting-pdf .elite-stat-card .progress-bar-container { display: none !important; }

          .is-exporting-pdf .print-data-full {
            display: block !important; width: 100% !important; background: white !important;
          }

          .is-exporting-pdf .full-print-table { 
            width: 100% !important; border-collapse: collapse !important; 
            font-size: 12px !important; background: white !important;
          }

          .is-exporting-pdf .full-print-table th { 
            background: #f1f5f9 !important; border: 1px solid #94a3b8 !important; 
            padding: 12px 10px !important; color: #000 !important; font-weight: 900 !important;
            text-transform: uppercase !important; text-align: left;
          }

          .is-exporting-pdf .full-print-table td { border: 1px solid #e2e8f0 !important; padding: 10px !important; color: #1e293b !important; }

          .is-exporting-pdf .print-signature-section {
            display: flex !important; justify-content: space-around; margin-top: 60px !important;
            padding-top: 20px !important; page-break-inside: avoid !important;
          }

          .is-exporting-pdf .sig-line { width: 100% !important; border-top: 2px solid #000 !important; margin-bottom: 10px !important; }

          .is-exporting-pdf .print-only-footer {
            display: flex !important; justify-content: space-between; margin-top: 40px;
            border-top: 1px solid #eee; padding-top: 15px; font-size: 11px; color: #666 !important;
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
          .report-title p { font-size: 13px; color: hsl(var(--text-muted)); margin: 2px 0 0; }
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
            @page { margin: 1cm; size: A4; }
            html, body { height: auto !important; width: 100% !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: white !important; -webkit-print-color-adjust: exact; }
            body > *:not(.report-viewer-overlay) { display: none !important; }
            .report-viewer-overlay { position: static !important; display: block !important; background: white !important; padding: 0 !important; margin: 0 !important; opacity: 1 !important; visibility: visible !important; }
            .viewer-container { display: none !important; }
            .browser-print-only-container { display: block !important; width: 100% !important; }
            
            .print-only-header { display: flex !important; justify-content: space-between; align-items: flex-start; width: 100%; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .print-logo { width: 44px; height: 44px; background: #000 !important; color: #fff !important; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; }
            .print-brand-name { font-size: 18px; color: #000 !important; font-weight: 900; }
            .print-brand-tag { font-size: 10px; color: #666 !important; }
            .print-report-meta { text-align: right; font-size: 12px; color: #000 !important; }

            .next-gen-kpi-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 15px !important; margin-bottom: 20px !important; }
            .elite-stat-card { border: 1px solid #eee !important; background: #fff !important; padding: 15px !important; color: #000 !important; border-radius: 8px !important; }
            .elite-stat-card .chart-container, .elite-stat-card .progress-bar-container { display: none !important; }
            .elite-stat-card .card-value { font-size: 22px !important; font-weight: 900 !important; }

            .full-print-table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; }
            .full-print-table th { background: #f1f5f9 !important; border: 1px solid #94a3b8 !important; padding: 10px 8px !important; color: #000 !important; font-weight: 900 !important; }
            .full-print-table td { border: 1px solid #e2e8f0 !important; padding: 8px 6px !important; color: #000 !important; }
            .full-print-table tr { page-break-inside: avoid !important; }

            .print-signature-section { display: flex !important; justify-content: space-around; margin-top: 80px !important; padding-top: 20px !important; page-break-inside: avoid !important; }
            .sig-line { width: 100% !important; border-top: 2px solid #000 !important; }
            .signature-box span { font-size: 10px !important; font-weight: 700 !important; color: #000 !important; }

            .print-only-footer { display: flex !important; justify-content: space-between; margin-top: 40px; padding-top: 10px; border-top: 1px solid #eee; font-size: 10px; color: #666 !important; }
          }

          .print-only-header, .browser-print-only-container, .print-signature-section, .print-only-footer, .print-data-full { display: none; }
        `}</style>
      </div>
    </AnimatePresence>,
    document.body
  );
};
