import React from 'react';
import { createPortal } from 'react-dom';
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

interface ReportViewerProps {
  report: any;
  onClose: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose }) => {
  const { activeFarm } = useTenant();
  
  // Mock data for different report types
  const getMockData = () => {
    if (report.category === 'livestock') {
      return {
        columns: [
          { 
            header: 'Animal / Lote', 
            accessor: (item: any) => (
              <div className="table-cell-title">
                <span className="main-text">{item.id_animal}</span>
                <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
                  {item.lote}
                </div>
              </div>
            )
          },
          { 
            header: 'Evolução de Peso', 
            accessor: (item: any) => (
              <div className="table-cell-meta">
                <Activity size={14} />
                <span>{item.peso_ini}kg → {item.peso_atual}kg</span>
              </div>
            )
          },
          { 
            header: 'GMD (kg)', 
            accessor: (item: any) => (
              <span className="font-bold text-slate-900">{item.gmd}</span>
            )
          },
          { 
            header: 'Eficiência', 
            accessor: (item: any) => (
              <span className={`status-pill ${item.gmd > 0.8 ? 'success' : 'warning'}`}>
                {item.gmd > 0.8 ? 'Alta Performance' : 'Atenção Necessária'}
              </span>
            )
          }
        ],
        data: [
          { id: '1', id_animal: 'ELITE-001', lote: 'CONFINAMENTO A', peso_ini: 350, peso_atual: 420, gmd: 0.95 },
          { id: '2', id_animal: 'ELITE-002', lote: 'CONFINAMENTO A', peso_ini: 342, peso_atual: 405, gmd: 0.88 },
          { id: '3', id_animal: 'ELITE-003', lote: 'CONFINAMENTO B', peso_ini: 360, peso_atual: 410, gmd: 0.75 },
          { id: '4', id_animal: 'ELITE-004', lote: 'PASTO 12', peso_ini: 320, peso_atual: 380, gmd: 0.82 },
          { id: '5', id_animal: 'ELITE-005', lote: 'PASTO 12', peso_ini: 335, peso_atual: 395, gmd: 0.85 },
          { id: '6', id_animal: 'ELITE-006', lote: 'CONFINAMENTO A', peso_ini: 348, peso_atual: 415, gmd: 0.92 },
          { id: '7', id_animal: 'ELITE-007', lote: 'CONFINAMENTO B', peso_ini: 355, peso_atual: 408, gmd: 0.78 },
          { id: '8', id_animal: 'ELITE-008', lote: 'PASTO 10', peso_ini: 315, peso_atual: 372, gmd: 0.81 },
          { id: '9', id_animal: 'ELITE-009', lote: 'CONFINAMENTO A', peso_ini: 352, peso_atual: 425, gmd: 0.96 },
          { id: '10', id_animal: 'ELITE-010', lote: 'PASTO 05', peso_ini: 330, peso_atual: 390, gmd: 0.84 },
          { id: '11', id_animal: 'ELITE-011', lote: 'CONFINAMENTO B', peso_ini: 358, peso_atual: 412, gmd: 0.76 },
          { id: '12', id_animal: 'ELITE-012', lote: 'CONFINAMENTO A', peso_ini: 345, peso_atual: 410, gmd: 0.90 },
          { id: '13', id_animal: 'ELITE-013', lote: 'PASTO 12', peso_ini: 325, peso_atual: 385, gmd: 0.83 },
          { id: '14', id_animal: 'ELITE-014', lote: 'CONFINAMENTO B', peso_ini: 362, peso_atual: 418, gmd: 0.79 },
          { id: '15', id_animal: 'ELITE-015', lote: 'CONFINAMENTO A', peso_ini: 350, peso_atual: 422, gmd: 0.94 },
        ]
      };
    }
    
    if (report.category === 'finance') {
      return {
        columns: [
          { 
            header: 'Lançamento / Data', 
            accessor: (item: any) => (
              <div className="table-cell-title">
                <span className="main-text">{item.desc}</span>
                <div className="sub-meta uppercase font-bold text-[10px] tracking-wider text-slate-500">
                  {item.data}
                </div>
              </div>
            )
          },
          { 
            header: 'Categoria', 
            accessor: (item: any) => (
              <div className="table-cell-meta">
                <span>{item.cat}</span>
              </div>
            )
          },
          { 
            header: 'Valor', 
            accessor: (item: any) => (
              <span className={`font-bold ${item.tipo === 'entrada' ? 'text-emerald-500' : 'text-slate-900'}`}>
                {item.tipo === 'entrada' ? '+' : '-'} {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )
          },
          { 
            header: 'Status', 
            accessor: (item: any) => (
              <span className="status-pill active">EFETIVADO</span>
            )
          }
        ],
        data: [
          { id: '1', desc: 'Venda de Gado - Lote 45', data: '12/05/2026', cat: 'Receita Operacional', valor: 145200.00 },
          { id: '2', desc: 'Compra de Sal Mineral', data: '10/05/2026', cat: 'Insumos', valor: -12400.00 },
          { id: '3', desc: 'Manutenção Trator JD 750', data: '08/05/2026', cat: 'Manutenção', valor: -4500.00 },
          { id: '4', desc: 'Folha de Pagamento', data: '05/05/2026', cat: 'Pessoal', valor: -28400.00 },
          { id: '5', desc: 'Venda de Bezerros - Desmama', data: '02/05/2026', cat: 'Receita Operacional', valor: 88500.00 },
          { id: '6', desc: 'Diesel S10 - 5000L', data: '15/05/2026', cat: 'Combustível', valor: -32500.00 },
          { id: '7', desc: 'Energia Elétrica - Sede', data: '14/05/2026', cat: 'Utilidades', valor: -1250.00 },
          { id: '8', desc: 'Venda Couro e Subprodutos', data: '13/05/2026', cat: 'Outras Receitas', valor: 4500.00 },
          { id: '9', desc: 'Seguro Rebanho Anual', data: '11/05/2026', cat: 'Seguros', valor: -15600.00 },
          { id: '10', desc: 'Serviço de Agronomia', data: '09/05/2026', cat: 'Consultoria', valor: -8200.00 },
          { id: '11', desc: 'Vacinas Febre Aftosa', data: '07/05/2026', cat: 'Sanidade', valor: -18400.00 },
          { id: '12', desc: 'Venda Milho Safrinha', data: '06/05/2026', cat: 'Receita Agrícola', valor: 125000.00 },
          { id: '13', desc: 'Frete Terceirizado Gado', data: '04/05/2026', cat: 'Logística', valor: -6500.00 },
          { id: '14', desc: 'Arrendamento Pastagem', data: '03/05/2026', cat: 'Aluguel', valor: -12000.00 },
          { id: '15', desc: 'Venda Vacas de Descarte', data: '01/05/2026', cat: 'Receita Operacional', valor: 64200.00 },
        ]
      };
    }

    return { columns: [], data: [] };
  };

  const { columns, data } = getMockData();

  return createPortal(
    <AnimatePresence>
      <div className="report-viewer-overlay" onClick={onClose}>
        <motion.div 
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
            <button className="icon-btn" title="Download PDF" onClick={() => window.print()}><Download size={18} /></button>
            <button className="icon-btn" title="Imprimir" onClick={() => window.print()}><Printer size={18} /></button>
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
              <ModernTable 
                data={data}
                columns={columns}
                hideHeader={false}
              />
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
