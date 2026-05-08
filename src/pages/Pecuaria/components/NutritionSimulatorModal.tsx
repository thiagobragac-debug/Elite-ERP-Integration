import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Scale, 
  TrendingUp, 
  DollarSign, 
  Utensils,
  Target,
  ChevronRight,
  Beef,
  Activity,
  Zap,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NutritionSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  diets: any[];
}

export const NutritionSimulatorModal: React.FC<NutritionSimulatorModalProps> = ({ isOpen, onClose, diets }) => {
  const [selectedDietId, setSelectedDietId] = useState('');
  const [animalCount, setAnimalCount] = useState('100');
  const [dailyConsumption, setDailyConsumption] = useState('12'); // kg per animal
  const [expectedGMD, setExpectedGMD] = useState('1.450'); // kg gain per day

  const selectedDiet = diets.find(d => d.id === selectedDietId);
  const costPerKg = selectedDiet ? Number(selectedDiet.custo_por_kg) : 0;
  
  const totalDailyConsumption = Number(animalCount) * Number(dailyConsumption);
  const totalDailyCost = totalDailyConsumption * costPerKg;
  const costPerAnimalDay = Number(dailyConsumption) * costPerKg;
  const monthlyProjection = totalDailyCost * 30;

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="simulator-modal-container"
          onClick={e => e.stopPropagation()}
        >
          <header className="simulator-header">
            <div className="title-group">
              <div className="icon-badge">
                <Zap size={22} className="text-brand" />
              </div>
              <div>
                <h2>Simulador Nutricional</h2>
                <p>Projeção de consumo, custo e ganho de peso</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </header>

          <div className="simulator-body">
            <div className="simulator-inputs">
              <div className="form-field">
                <label className="elite-label">Selecione a Dieta</label>
                <select 
                  className="elite-select"
                  value={selectedDietId}
                  onChange={e => setSelectedDietId(e.target.value)}
                >
                  <option value="">Escolha uma formulação...</option>
                  {diets.filter(d => d.tipo !== 'MATERIA_PRIMA').map(diet => (
                    <option key={diet.id} value={diet.id}>{diet.nome} (R$ {Number(diet.custo_por_kg).toFixed(2)}/kg)</option>
                  ))}
                </select>
              </div>

              <div className="input-row">
                <div className="form-field">
                  <label className="elite-label"><Beef size={14} /> N° de Animais</label>
                  <input 
                    type="number" 
                    className="elite-input" 
                    value={animalCount}
                    onChange={e => setAnimalCount(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="elite-label"><Utensils size={14} /> Consumo (kg/dia)</label>
                  <input 
                    type="number" 
                    className="elite-input" 
                    value={dailyConsumption}
                    onChange={e => setDailyConsumption(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="elite-label"><Activity size={14} /> GMD Alvo (kg)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    className="elite-input" 
                    value={expectedGMD}
                    onChange={e => setExpectedGMD(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="simulation-results">
              <label className="section-label">Resultados da Simulação</label>
              
              <div className="result-grid">
                <div className="result-card">
                  <span className="res-label">Consumo Total Diário</span>
                  <div className="res-value">
                    <Scale size={18} className="text-brand" />
                    <span>{totalDailyConsumption.toLocaleString()} kg</span>
                  </div>
                </div>
                <div className="result-card">
                  <span className="res-label">Custo Diário Total</span>
                  <div className="res-value">
                    <DollarSign size={18} className="text-brand" />
                    <span>R$ {totalDailyCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="result-card">
                  <span className="res-label">Custo / Cabeça / Dia</span>
                  <div className="res-value">
                    <TrendingUp size={18} className="text-brand" />
                    <span>R$ {costPerAnimalDay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="result-card highlight">
                  <span className="res-label">Projeção 30 Dias</span>
                  <div className="res-value">
                    <Target size={18} />
                    <span>R$ {monthlyProjection.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="performance-box">
                <div className="perf-header">
                  <TrendingUp size={16} />
                  <span>EFICIÊNCIA PROJETADA</span>
                </div>
                <div className="perf-content">
                  <div className="perf-item">
                    <span className="p-label">Conversão Alimentar</span>
                    <span className="p-value">{(Number(dailyConsumption) / Number(expectedGMD)).toFixed(2)} : 1</span>
                  </div>
                  <div className="perf-item">
                    <span className="p-label">Custo kg Produzido</span>
                    <span className="p-value">R$ {(costPerAnimalDay / Number(expectedGMD)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="simulator-footer">
            <button className="text-btn" onClick={onClose}>FECHAR</button>
            <button className="primary-btn" onClick={() => window.print()}>
              <FileText size={18} />
              EXPORTAR RELATÓRIO
            </button>
          </footer>

          {/* Versão para Impressão Profissional */}
          <div className="print-report-container">
            <div className="print-header">
              <div className="farm-info">
                <div className="print-logo">ELITE LIVESTOCK v5.0</div>
                <h1>Relatório de Simulação Nutricional</h1>
              </div>
              <div className="report-date">Emissão: {new Date().toLocaleDateString()}</div>
            </div>

            <div className="print-summary-banner">
              <div className="s-item">
                <span className="s-label">DIETA SELECIONADA</span>
                <span className="s-value">{selectedDiet?.nome || 'Não informada'}</span>
              </div>
              <div className="s-item">
                <span className="s-label">EFETIVO TOTAL</span>
                <span className="s-value">{animalCount} Animais</span>
              </div>
            </div>

            <div className="print-columns-wrapper">
              <div className="print-section">
                <h2>Configuração Técnica</h2>
                <table className="print-table">
                  <tbody>
                    <tr>
                      <td>Consumo Individual</td>
                      <td>{dailyConsumption} kg/dia</td>
                    </tr>
                    <tr>
                      <td>GMD Alvo</td>
                      <td>{expectedGMD} kg/dia</td>
                    </tr>
                    <tr>
                      <td>Custo da Dieta</td>
                      <td>R$ {costPerKg.toFixed(2)} / kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="print-section">
                <h2>Indicadores de Eficiência</h2>
                <table className="print-table">
                  <tbody>
                    <tr>
                      <td>Conversão Alimentar</td>
                      <td>{(Number(dailyConsumption) / Number(expectedGMD)).toFixed(2)} : 1</td>
                    </tr>
                    <tr>
                      <td>Custo kg Produzido</td>
                      <td>R$ {(costPerAnimalDay / Number(expectedGMD)).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="print-section">
              <h2>Projeção de Performance e Custos</h2>
              <div className="print-stats-grid">
                <div className="p-stat">
                  <span className="ps-label">Consumo Diário do Lote</span>
                  <span className="ps-value">{totalDailyConsumption.toLocaleString()} kg</span>
                </div>
                <div className="p-stat">
                  <span className="ps-label">Custo Diário Total</span>
                  <span className="ps-value">R$ {totalDailyCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-stat">
                  <span className="ps-label">Custo por Animal/Dia</span>
                  <span className="ps-value">R$ {costPerAnimalDay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-stat highlight">
                  <span className="ps-label">Custo Total (30 Dias)</span>
                  <span className="ps-value">R$ {monthlyProjection.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="print-footer">
              <p>Relatório gerado pelo módulo de Nutrição de Precisão do Elite ERP.</p>
              <p>Este documento é uma projeção técnica e pode variar conforme as condições de campo.</p>
            </div>
          </div>

          <style>{`
            .modal-overlay {
              position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
              backdrop-filter: blur(8px); z-index: 10000; display: flex;
              align-items: center; justify-content: center; padding: 20px;
            }
            .simulator-modal-container {
              background: hsl(var(--bg-card)); width: 100%; max-width: 650px;
              max-height: 90vh; display: flex; flex-direction: column;
              border-radius: 28px; border: 1px solid hsl(var(--border));
              box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5); overflow: hidden;
            }
            .simulator-header {
              padding: 20px 24px; border-bottom: 1px solid hsl(var(--border));
              display: flex; justify-content: space-between; align-items: center;
              background: linear-gradient(to bottom, hsl(var(--bg-card)), hsl(var(--bg-main)));
              flex-shrink: 0;
            }
            .simulator-body { padding: 24px; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; flex: 1; }
            .simulator-inputs { display: flex; flex-direction: column; gap: 16px; }
            .input-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .form-field { display: flex; flex-direction: column; gap: 8px; }
            .section-label { display: block; font-size: 11px; font-weight: 900; color: hsl(var(--text-muted)); letter-spacing: 0.1em; margin-bottom: 16px; text-transform: uppercase; }
            
            .result-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            .result-card {
              padding: 20px; background: hsl(var(--bg-main) / 0.5); border: 1px solid hsl(var(--border));
              border-radius: 20px; display: flex; flex-direction: column; gap: 8px;
            }
            .result-card.highlight { background: #0f172a; color: white; border-color: #0f172a; }
            .res-label { font-size: 10px; font-weight: 800; color: hsl(var(--text-muted)); text-transform: uppercase; }
            .result-card.highlight .res-label { color: #94a3b8; }
            .res-value { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 900; }
            
            .performance-box {
              background: hsl(var(--brand) / 0.05); border: 1px dashed hsl(var(--brand) / 0.3);
              border-radius: 20px; padding: 20px; margin-top: 8px;
            }
            .perf-header { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 900; color: hsl(var(--brand)); margin-bottom: 16px; }
            .perf-content { display: flex; justify-content: space-between; }
            .perf-item { display: flex; flex-direction: column; gap: 4px; }
            .p-label { font-size: 10px; font-weight: 700; color: hsl(var(--text-muted)); }
            .p-value { font-size: 15px; font-weight: 900; color: hsl(var(--text-main)); }

            .simulator-footer {
              padding: 16px 24px; border-top: 1px solid hsl(var(--border));
              display: flex; justify-content: space-between; align-items: center;
              background: hsl(var(--bg-main) / 0.3);
              flex-shrink: 0;
            }
            .text-brand { color: hsl(var(--brand)); }
            .close-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; transition: 0.2s; color: hsl(var(--text-muted)); }
            .close-btn:hover { background: #fee2e2; color: #ef4444; }

            .print-report-container { display: none; }

            /* Estilos de Impressão Profissional */
            @media print {
              @page { size: A4; margin: 1.5cm; }
              
              /* Esconder o App e UI do Modal */
              #root, .sidebar, .header, .page-header, .elite-controls-row, .management-content, .next-gen-kpi-grid,
              .simulator-header, .simulator-body, .simulator-footer, .close-btn { 
                display: none !important; 
              }

              /* Configurar Container do Relatório */
              .modal-overlay {
                position: absolute !important;
                inset: 0 !important;
                background: white !important;
                display: block !important;
                padding: 0 !important;
                z-index: auto !important;
                backdrop-filter: none !important;
              }

              .simulator-modal-container {
                position: static !important;
                max-width: 100% !important;
                max-height: none !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                display: block !important;
                overflow: visible !important;
              }

              .print-report-container {
                display: block !important;
                visibility: visible !important;
                width: 100%;
                color: black !important;
                font-family: 'Inter', sans-serif !important;
              }

              .print-header {
                display: flex; justify-content: space-between; align-items: flex-end;
                border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 30px;
              }

              .print-logo { font-weight: 900; color: #16a34a; font-size: 14px; text-transform: uppercase; }
              .print-header h1 { font-size: 22px; margin: 0; font-family: 'Outfit', sans-serif; font-weight: 800; color: #0f172a; }
              .report-date { font-size: 11px; color: #64748b; font-weight: 600; }

              .print-summary-banner {
                background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;
                display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 20px;
                margin-bottom: 30px;
              }

              .s-label { display: block; font-size: 9px; font-weight: 900; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
              .s-value { font-size: 15px; font-weight: 800; color: #0f172a; }

              .print-columns-wrapper {
                display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 30px;
                margin-bottom: 30px;
              }

              .print-section { margin-bottom: 30px; }
              .print-section h2 { font-size: 12px; color: #16a34a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; font-weight: 900; }

              .print-table { width: 100%; border-collapse: collapse; }
              .print-table tr { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 8px 0; }
              .print-table td { font-size: 11px; font-weight: 600; }
              .print-table td:first-child { color: #64748b; text-transform: uppercase; font-size: 9px; font-weight: 800; }
              .print-table td:last-child { text-align: right; color: #0f172a; font-weight: 800; }

              .print-stats-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 15px; }
              .p-stat { padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex !important; flex-direction: column !important; gap: 8px !important; }
              .p-stat.highlight { grid-column: span 3; flex-direction: row !important; justify-content: space-between; align-items: center; background: #f0fdf4; border-color: #bbf7d0; }
              .ps-label { display: block; font-size: 9px; color: #64748b; font-weight: 800; text-transform: uppercase; }
              .ps-value { display: block; font-size: 14px; font-weight: 900; color: #0f172a; }
              .p-stat.highlight .ps-value { color: #15803d; font-size: 18px; }

              .print-footer {
                margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;
                font-size: 10px; color: #94a3b8; text-align: center;
              }
            }
          `}</style>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
