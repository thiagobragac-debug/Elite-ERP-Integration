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
import { useReportData } from '../../../hooks/useReportData';
import { exportToExcel } from '../../../utils/exportUtils';

interface ReportViewerProps {
  report: any;
  onClose: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose }) => {
  const { activeFarm } = useTenant();
  const { data, stats, columns, loading, error } = useReportData(report?.id || null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const handleExportExcel = () => {
    if (!data || data.length === 0) return;
    exportToExcel(data, columns, report.title);
  };

  const handleDownloadPDF = () => {
    if (!reportRef.current) return;

    const element = reportRef.current;
    const opt = {
      margin: [10, 10],
      filename: `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Temporariamente ajustar estilos para captura (forçar visibilidade de elementos de impressão se necessário)
    // Mas o html2pdf captura o estado atual do DOM. 
    // Podemos usar uma classe temporária para forçar o layout de impressão durante a captura.
    element.classList.add('is-exporting-pdf');
    
    html2pdf().set(opt).from(element).save().then(() => {
      element.classList.remove('is-exporting-pdf');
    });
  };

  if (!report) return null;

  return createPortal(
    <AnimatePresence>
      <div className="report-viewer-overlay" onClick={onClose}>
        <motion.div 
          ref={reportRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="viewer-container"
          onClick={e => e.stopPropagation()}
        >
        <header className="viewer-header">
          {/* Cabeçalho Exclusivo para Impressão */}
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
              <div className="meta-item"><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          <div className="left-side hide-on-print">
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
          
          <div className="viewer-actions hide-on-print">
            <button className="icon-btn" title="Baixar Layout PDF" onClick={handleDownloadPDF}><Download size={18} /></button>
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
            <EliteStatCard 
              label="Volume Processado"
              value="1.420"
              icon={Activity}
              color="#10b981"
              progress={100}
              change="+4.2%"
              trend="up"
            />
            <EliteStatCard 
              label="Performance Global"
              value="92.4%"
              icon={TrendingUp}
              color="#3b82f6"
              progress={92}
              change="+1.5%"
              trend="up"
            />
            <EliteStatCard 
              label="Custo Médio / Un"
              value="R$ 12.40"
              icon={DollarSign}
              color="#f59e0b"
              progress={60}
              change="-0.8%"
              trend="down"
            />
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

          {/* Tabela Integral para Impressão (Sem Paginação) */}
          <div className="print-data-full">
            <table className="full-print-table">
              <thead>
                <tr>
                  {columns.map((col: any, i: number) => <th key={i}>{col.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((item: any, i: number) => (
                  <tr key={i} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    {columns.map((col: any, j: number) => {
                      const isNumeric = col.header.toLowerCase().includes('valor') || 
                                      col.header.toLowerCase().includes('gmd') || 
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

          {/* Rodapé Exclusivo para Impressão */}
          <div className="print-only-footer">
            <div className="footer-left">Documento gerado eletronicamente por Elite Intelligence</div>
            <div className="footer-right"></div>
          </div>
        </div>
      </motion.div>
      <style>{`
        .report-viewer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .viewer-container {
          width: 100%;
          max-width: 1200px;
          height: 100%;
          max-height: 85vh;
          background: hsl(var(--bg-main));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .viewer-container.is-exporting-pdf {
          max-height: none !important;
          height: auto !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
        }

        .is-exporting-pdf .hide-on-print {
          display: none !important;
        }

        .is-exporting-pdf .print-only-header,
        .is-exporting-pdf .print-only-footer,
        .is-exporting-pdf .print-signature-section,
        .is-exporting-pdf .print-data-full {
          display: block !important;
        }
        
        .is-exporting-pdf .viewer-main-analytics {
          display: none !important;
        }

        .viewer-header {
          padding: 20px 40px;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: hsl(var(--bg-card));
          height: 80px;
        }

        .left-side {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover { background: hsla(var(--brand) / 0.1); color: hsl(var(--brand)); border-color: hsl(var(--brand)); }

        .report-title h2 { font-size: 20px; font-weight: 800; color: hsl(var(--text-main)); margin: 0; }
        .report-title p { font-size: 13px; color: hsl(var(--text-muted)); margin: 2px 0 0; }
        .title-row { display: flex; align-items: center; gap: 10px; }

        .viewer-actions { display: flex; align-items: center; gap: 8px; }
        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: 0.2s;
        }
        .icon-btn:hover { background: hsla(var(--brand) / 0.1); color: hsl(var(--brand)); border-color: hsl(var(--brand)); }

        .v-sep { width: 1px; height: 24px; background: hsl(var(--border)); margin: 0 8px; }

        .close-btn-premium {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: hsla(var(--text-muted) / 0.1);
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .close-btn-premium:hover { background: #fee2e2; color: #ef4444; }

        .viewer-content {
          flex: 1;
          padding: 24px 80px;
          overflow-y: auto;
          background: hsl(var(--bg-main));
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Custom KPI CSS Removido em favor do padrão next-gen-kpi-grid */

        .analytics-card {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          padding: 16px;
        }

        .card-header { margin-bottom: 16px; }
        .card-header h3 { font-size: 18px; font-weight: 800; color: hsl(var(--text-main)); margin: 0; }
        .card-header .subtitle { font-size: 13px; color: hsl(var(--text-muted)); }

        .status-pill {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .status-pill.success { background: hsla(160, 84%, 39%, 0.1); color: #10b981; }
        .status-pill.warning { background: hsla(38, 92%, 50%, 0.1); color: #f59e0b; }
        .status-pill.active { background: hsla(217, 91%, 60%, 0.1); color: #3b82f6; }
        
        .report-loading, .report-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          gap: 20px;
          color: hsl(var(--text-muted));
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0,0,0,0.1);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media print {
          @page { margin: 1cm; size: A4; }
          
          /* Esconder absolutamente tudo que não seja o visualizador */
          html, body { 
            height: auto !important; 
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important; 
            background: white !important;
            -webkit-print-color-adjust: exact;
          }

          body > *:not(.report-viewer-overlay) {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          .report-viewer-overlay { 
            position: static !important; 
            display: block !important;
            background: white !important; 
            padding: 0 !important;
            margin: 0 !important;
            opacity: 1 !important;
            visibility: visible !important;
            zoom: 0.93 !important;
          }

          .viewer-container { 
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: none !important; 
            height: auto !important;
            max-height: none !important; 
            min-height: auto !important;
            box-shadow: none !important; 
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }

          .viewer-header { 
            border-bottom: 2px solid #000; 
            height: auto; 
            padding: 10px 0; 
            margin-bottom: 20px;
            background: white !important;
          }

          .print-only-header {
            display: flex !important;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
          }

          .print-logo-section { display: flex; align-items: center; gap: 10px; }
          .print-logo {
            width: 40px;
            height: 40px;
            background: #000;
            color: #fff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 24px;
          }
          .print-brand-name { display: block; font-weight: 900; font-size: 16px; color: #000; }
          .print-brand-tag { display: block; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
          
          .print-report-meta { text-align: right; font-size: 11px; line-height: 1.5; color: #333; }

          .viewer-content { padding: 0 !important; overflow: visible !important; gap: 0 !important; }
          
          .next-gen-kpi-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 5px !important;
          }

          /* Forçar cores e formato compacto na impressão */
          .elite-stat-card {
            border: 1px solid #eee !important;
            box-shadow: none !important;
            background: #fafafa !important;
            -webkit-print-color-adjust: exact;
            padding: 10px !important;
            min-height: auto !important;
            height: auto !important;
          }

          .elite-stat-card .chart-container, 
          .elite-stat-card .progress-bar-container { display: none !important; }
          .elite-stat-card .card-value { font-size: 18px !important; margin: 4px 0 !important; }
          .elite-stat-card .card-label { font-size: 10px !important; }

          .analytics-card { 
            border: 1px solid #eee !important; 
            border-radius: 0 !important;
            padding: 0 !important;
          }

          .viewer-main-analytics { display: none !important; }
          .print-data-full { display: block !important; width: 100% !important; margin-top: 0 !important; overflow: visible !important; }
          .full-print-table { 
            width: 100% !important; 
            max-width: 100% !important;
            border-collapse: collapse !important; 
            font-size: 9px !important; 
            table-layout: auto !important;
          }
          .full-print-table th { 
            background: #f1f5f9 !important; 
            border: 1px solid #cbd5e1 !important; 
            padding: 8px 6px !important; 
            text-align: left !important; 
            text-transform: uppercase !important; 
            font-weight: 900 !important;
            color: #000 !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          .full-print-table td { 
            border: 1px solid #e2e8f0 !important; 
            padding: 6px 4px !important; 
            color: #1e293b !important;
            white-space: normal !important;
            word-break: break-word !important;
            line-height: 1.2 !important;
          }
          .full-print-table tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          
          .print-signature-section {
            display: flex !important;
            justify-content: space-around;
            margin-top: 120px !important;
            padding-top: 40px !important;
            padding-bottom: 60px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: 100% !important;
          }
          .signature-box {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 250px !important;
          }
          .sig-line {
            width: 100% !important;
            border-top: 1px solid #000 !important;
            margin-bottom: 12px !important;
          }
          .signature-box span {
            font-size: 10px !important;
            text-transform: uppercase !important;
            font-weight: 700 !important;
            color: #000 !important;
          }
          .table-header-row, .table-pagination { display: none !important; }

          .print-only-footer {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            margin-top: 40px;
            padding-top: 10px;
            border-top: 1px solid #eee;
            font-size: 10px;
            color: #999;
          }

          .hide-on-print, .close-btn-premium, .back-btn, .viewer-actions { display: none !important; }
          
          h2, h3 { color: #000 !important; }
          .title { color: #000 !important; font-weight: 900 !important; }
          .status-pill { border: 1px solid #ccc !important; background: transparent !important; color: #000 !important; }
        }

        .print-only-header, .print-only-footer, .print-data-full, .print-signature-section { display: none; }
      `}</style>
      </div>
    </AnimatePresence>,
    document.body
  );
};
