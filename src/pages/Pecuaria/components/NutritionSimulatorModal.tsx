import React, { useState, useEffect } from 'react';
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
import { FormModal } from '../../../components/Forms/FormModal';

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

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={(e) => { e.preventDefault(); window.print(); }}
        title="Simulador Nutricional"
        subtitle="Projeção de consumo, custo e ganho de peso"
        icon={Zap}
        submitLabel="Exportar Relatório"
        iconSubmit={FileText}
      >
        <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="elite-label">Configuração da Dieta</label>
          <select 
            className="elite-input elite-select"
            value={selectedDietId}
            onChange={e => setSelectedDietId(e.target.value)}
          >
            <option value="">Escolha uma formulação...</option>
            {diets.filter(d => d.tipo !== 'MATERIA_PRIMA').map(diet => (
              <option key={diet.id} value={diet.id}>{diet.nome} (R$ {Number(diet.custo_por_kg).toFixed(2)}/kg)</option>
            ))}
          </select>
        </div>

        <div className="elite-field-group">
          <label className="elite-label">N° de Animais</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Beef size={14} style={{ color: 'hsl(var(--text-muted))' }} />
            <input 
              type="number" 
              className="elite-input" 
              value={animalCount}
              onChange={e => setAnimalCount(e.target.value)}
            />
          </div>
        </div>

        <div className="elite-field-group">
          <label className="elite-label">Consumo (kg/dia)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={14} style={{ color: 'hsl(var(--text-muted))' }} />
            <input 
              type="number" 
              className="elite-input" 
              value={dailyConsumption}
              onChange={e => setDailyConsumption(e.target.value)}
            />
          </div>
        </div>

        <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="elite-label">Resultados da Simulação</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '16px', background: 'hsl(var(--bg-main)/0.5)', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>Consumo Total Diário</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'hsl(var(--brand))' }}>{totalDailyConsumption.toLocaleString()} kg</div>
            </div>
            <div style={{ padding: '16px', background: 'hsl(var(--bg-main)/0.5)', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>Custo Diário Total</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'hsl(var(--brand))' }}>R$ {totalDailyCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div style={{ padding: '16px', background: 'hsl(var(--bg-main)/0.5)', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>Custo / Cabeça / Dia</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'hsl(var(--brand))' }}>R$ {costPerAnimalDay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div style={{ padding: '16px', background: 'hsl(var(--text-main))', borderRadius: '16px', color: 'white' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '8px' }}>Projeção 30 Dias</div>
              <div style={{ fontSize: '18px', fontWeight: 900 }}>R$ {monthlyProjection.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        <div className="elite-field-group" style={{ gridColumn: 'span 2', background: 'hsl(var(--brand)/0.05)', padding: '16px', borderRadius: '16px', border: '1px dashed hsl(var(--brand)/0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Conversão Alimentar</div>
              <div style={{ fontSize: '15px', fontWeight: 900 }}>{(Number(dailyConsumption) / Number(expectedGMD)).toFixed(2)} : 1</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Custo kg Produzido</div>
              <div style={{ fontSize: '15px', fontWeight: 900 }}>R$ {(costPerAnimalDay / Number(expectedGMD)).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </FormModal>

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
    </>
  );
};
