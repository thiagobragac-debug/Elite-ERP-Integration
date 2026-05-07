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

interface ReportViewerProps {
  report: any;
  onClose: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose }) => {
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
          { id: '1', data: '05/05/2026', desc: 'Venda de Gado - Lote 42', cat: 'Vendas', valor: 145000, tipo: 'entrada' },
          { id: '2', data: '04/05/2026', desc: 'Compra Nutrição Animal', cat: 'Insumos', valor: 22000, tipo: 'saida' },
          { id: '3', data: '02/05/2026', desc: 'Manutenção Trator JD', cat: 'Maquinas', valor: 4500, tipo: 'saida' },
          { id: '4', data: '01/05/2026', desc: 'Semanário Veterinário', cat: 'Serviços', valor: 1200, tipo: 'saida' },
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
                hideHeader={true}
              />
            </div>
          </div>
        </div>
      </motion.div>      <style>{`
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
          body * { visibility: hidden; }
          .report-viewer-overlay, .report-viewer-overlay * { visibility: visible; }
          .report-viewer-overlay { position: absolute; left: 0; top: 0; background: white !important; padding: 0; }
          .viewer-container { max-width: 100%; max-height: none; box-shadow: none; border-radius: 0; }
          .hide-on-print, .close-btn-premium, .back-btn { display: none !important; }
        }
      `}</style>
      </div>
    </AnimatePresence>,
    document.body
  );
};
