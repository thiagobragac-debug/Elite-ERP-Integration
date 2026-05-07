import React, { useState } from 'react';
import { 
  X, 
  PieChart, 
  BarChart3, 
  LineChart, 
  Layout, 
  CheckCircle2, 
  Plus,
  Layers,
  Activity,
  DollarSign,
  TrendingUp,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BIConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BIConfigurationModal: React.FC<BIConfigurationModalProps> = ({ isOpen, onClose }) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Evolução de GMD', 'Fluxo de Caixa']);
  
  const metrics = [
    { id: '1', name: 'Evolução de GMD', category: 'Pecuária', icon: Activity },
    { id: '2', name: 'Taxa de Lotação', category: 'Pastagens', icon: Layers },
    { id: '3', name: 'Fluxo de Caixa', category: 'Financeiro', icon: DollarSign },
    { id: '4', name: 'Giro de Estoque', category: 'Insumos', icon: Layout },
    { id: '5', name: 'EBITDA Projetado', category: 'Estratégico', icon: TrendingUp },
    { id: '6', name: 'Performance de Vendas', category: 'Comercial', icon: PieChart },
  ];

  const toggleMetric = (name: string) => {
    setSelectedMetrics(prev => 
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="elite-modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bi-config-modal"
          onClick={e => e.stopPropagation()}
        >
          <header className="bi-modal-header">
            <div className="header-info">
              <div className="bi-icon-box">
                <Settings size={20} />
              </div>
              <div>
                <h2>Configurador de Canvas BI</h2>
                <p>Personalize seus dashboards com métricas customizadas.</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </header>

          <div className="bi-config-content">
            <div className="metrics-selector">
              <h3>Disponíveis para Combinação</h3>
              <div className="metrics-grid">
                {metrics.map(metric => (
                  <div 
                    key={metric.id} 
                    className={`metric-item ${selectedMetrics.includes(metric.name) ? 'active' : ''}`}
                    onClick={() => toggleMetric(metric.name)}
                  >
                    <div className="m-icon">
                      <metric.icon size={18} />
                    </div>
                    <div className="m-info">
                      <span className="m-name">{metric.name}</span>
                      <span className="m-cat">{metric.category}</span>
                    </div>
                    <div className="m-check">
                      {selectedMetrics.includes(metric.name) && <CheckCircle2 size={16} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="canvas-preview">
              <div className="preview-header">
                <h3>Visualização do Canvas</h3>
                <span className="badge-premium">{selectedMetrics.length} MÉTRICAS ATIVAS</span>
              </div>
              
              <div className="preview-area">
                {selectedMetrics.length > 0 ? (
                  <div className="preview-grid">
                    {selectedMetrics.map((m, i) => (
                      <div key={i} className="preview-widget">
                        <div className="w-header">
                          <span>{m}</span>
                          <BarChart3 size={12} />
                        </div>
                        <div className="w-body">
                          <div className="skeleton-bar" style={{ width: '60%' }}></div>
                          <div className="skeleton-bar" style={{ width: '85%' }}></div>
                          <div className="skeleton-bar" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                    ))}
                    <div className="preview-widget add-more">
                      <Plus size={24} />
                    </div>
                  </div>
                ) : (
                  <div className="empty-preview">
                    <Layout size={48} className="icon-muted" />
                    <p>Selecione métricas ao lado para começar a montar seu BI.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <footer className="bi-modal-footer">
            <button className="text-btn" onClick={onClose}>DESCARTAR</button>
            <button className="primary-btn-green" onClick={onClose}>
              SALVAR CONFIGURAÇÃO DE BI
            </button>
          </footer>
        </motion.div>
      </div>

      <style>{`
        .bi-config-modal {
          width: 900px;
          max-width: 95vw;
          background: white;
          border-radius: 28px;
          box-shadow: 0 30px 60px -12px rgba(0,0,0,0.25);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .bi-modal-header {
          padding: 16px 32px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fafafa;
        }

        .header-info { display: flex; gap: 16px; align-items: center; }
        .bi-icon-box { width: 44px; height: 44px; background: #e6f4ef; color: #27a376; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .bi-modal-header h2 { font-size: 18px; font-weight: 800; color: #1e293b; margin: 0; }
        .bi-modal-header p { font-size: 13px; color: #64748b; margin: 4px 0 0 0; }

        .bi-config-content {
          display: grid;
          grid-template-columns: 350px 1fr;
          height: 500px;
        }

        .metrics-selector { padding: 16px; border-right: 1px solid #f1f5f9; overflow-y: auto; }
        .metrics-selector h3 { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }

        .metrics-grid { display: flex; flex-direction: column; gap: 8px; }
        .metric-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.2s;
        }
        .metric-item:hover { background: #f8fafc; border-color: #e2e8f0; }
        .metric-item.active { background: #f0fdf4; border-color: #27a376; }

        .m-icon { width: 36px; height: 36px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #64748b; border: 1px solid #f1f5f9; }
        .active .m-icon { color: #27a376; border-color: #27a376; }
        .m-info { flex: 1; display: flex; flex-direction: column; }
        .m-name { font-size: 13px; font-weight: 700; color: #1e293b; }
        .m-cat { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
        .m-check { color: #27a376; }

        .canvas-preview { padding: 16px; background: #f8fafc; overflow-y: auto; }
        .preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .preview-header h3 { font-size: 14px; font-weight: 800; color: #1e293b; margin: 0; }
        .badge-premium { font-size: 9px; font-weight: 900; background: #1e293b; color: white; padding: 4px 10px; border-radius: 20px; }

        .preview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .preview-widget { background: white; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .preview-widget.add-more { border: 2px dashed #cbd5e1; background: transparent; display: flex; align-items: center; justify-content: center; color: #94a3b8; height: 100px; cursor: pointer; }
        .w-header { display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 12px; }
        .w-body { display: flex; flex-direction: column; gap: 6px; }
        .skeleton-bar { height: 8px; background: #f1f5f9; border-radius: 4px; }

        .bi-modal-footer { padding: 20px 32px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 16px; align-items: center; }
        .primary-btn-green { padding: 14px 28px; background: #27a376; color: white; border: none; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
        .primary-btn-green:hover { background: #1f8b63; transform: translateY(-1px); }

        .empty-preview { height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center; }
        .icon-muted { margin-bottom: 16px; opacity: 0.3; }
      `}</style>
    </AnimatePresence>
  );
};
