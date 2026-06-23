import React, { useState, useEffect, useMemo } from 'react';
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
  FileText,
  Calendar,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { SearchableSelect } from '../../../components/Forms/SearchableSelect';

interface NutritionSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  diets: any[];
}

export const NutritionSimulatorModal: React.FC<NutritionSimulatorModalProps> = ({
  isOpen,
  onClose,
  diets,
}) => {
  const [selectedDietId, setSelectedDietId] = useState('');

  // Parâmetros do Lote
  const [animalCount, setAnimalCount] = useState('100');
  const [pesoMedio, setPesoMedio] = useState('350');
  const [diasTrato, setDiasTrato] = useState('90');

  // Parâmetros Zootécnicos
  const [consumoPV, setConsumoPV] = useState('2.5');
  const [expectedGMD, setExpectedGMD] = useState('1.5');

  // Econômico
  const [precoArroba, setPrecoArroba] = useState('240');

  const selectedDiet = diets.find((d) => d.id === selectedDietId);
  const costPerKg = selectedDiet ? Number(selectedDiet.custo_por_kg) : 0;

  // --- ENGINE DE SIMULAÇÃO ---
  const sim = useMemo(() => {
    const cabecas = Number(animalCount) || 0;
    const peso = Number(pesoMedio) || 0;
    const dias = Number(diasTrato) || 0;
    const gmd = Number(expectedGMD) || 0;
    const percPV = Number(consumoPV) || 0;
    const preco = Number(precoArroba) || 0;

    // Consumo e Custo Diário
    const consumoDiarioCabeca = peso * (percPV / 100);
    const custoDiarioCabeca = consumoDiarioCabeca * costPerKg;
    const consumoDiarioLote = consumoDiarioCabeca * cabecas;
    const custoDiarioLote = custoDiarioCabeca * cabecas;

    // Projeções do Período (Dias de Trato)
    const custoTotalCabecaPeriodo = custoDiarioCabeca * dias;
    const custoTotalLotePeriodo = custoTotalCabecaPeriodo * cabecas;

    // Zootecnia
    const ganhoPesoTotalCabeca = gmd * dias;
    const arrobasProduzidasCabeca = ganhoPesoTotalCabeca / 30; // 30kg vivo = 1@ produzida
    const conversaoAlimentar = gmd > 0 ? consumoDiarioCabeca / gmd : 0;

    // KPIs Financeiros
    const custoArrobaProduzida =
      arrobasProduzidasCabeca > 0 ? custoTotalCabecaPeriodo / arrobasProduzidasCabeca : 0;
    const receitaBrutaCabecaPeriodo = arrobasProduzidasCabeca * preco;
    const lucroLiquidoCabecaPeriodo = receitaBrutaCabecaPeriodo - custoTotalCabecaPeriodo;
    const lucroLiquidoLotePeriodo = lucroLiquidoCabecaPeriodo * cabecas;

    return {
      consumoDiarioCabeca,
      custoDiarioCabeca,
      consumoDiarioLote,
      custoDiarioLote,
      custoTotalLotePeriodo,
      ganhoPesoTotalCabeca,
      arrobasProduzidasCabeca,
      conversaoAlimentar,
      custoArrobaProduzida,
      lucroLiquidoLotePeriodo,
    };
  }, [animalCount, pesoMedio, diasTrato, expectedGMD, consumoPV, precoArroba, costPerKg]);

  return (
    <>
      <SidePanel
        size="large"
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={(e) => {
          e.preventDefault();
          window.print();
        }}
        title="Simulador Nutricional"
        subtitle="Projeção de consumo, custo e ganho de peso"
        icon={Zap}
        submitLabel="Exportar Relatório"
        iconSubmit={FileText}
      >
        <div className="form-grid">
          {/* SEÇÃO 1: CONFIGURAÇÃO DA DIETA */}
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label">Qual dieta será servida no cocho?</label>
            <SearchableSelect
              value={selectedDietId}
              onChange={setSelectedDietId}
              placeholder="Escolha uma formulação..."
              options={[
                { value: '', label: 'Escolha uma formulação...' },
                ...diets
                  .filter((d) => d.tipo !== 'MATERIA_PRIMA')
                  .map((diet) => ({
                    value: diet.id,
                    label: `${diet.nome} (R$ ${Number(diet.custo_por_kg).toFixed(2)} / kg)`,
                  })),
              ]}
            />
          </div>

          {/* SEÇÃO 2: DADOS DO LOTE */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Beef size={14} /> Cabeças
            </label>
            <input
              type="number"
              className="tauze-input"
              value={animalCount}
              onChange={(e) => setAnimalCount(e.target.value)}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Scale size={14} /> Peso Médio Entrada (kg)
            </label>
            <input
              type="number"
              className="tauze-input"
              value={pesoMedio}
              onChange={(e) => setPesoMedio(e.target.value)}
            />
          </div>
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label">
              <Calendar size={14} /> Dias de Trato (Janela de Simulação)
            </label>
            <input
              type="number"
              className="tauze-input"
              value={diasTrato}
              onChange={(e) => setDiasTrato(e.target.value)}
            />
          </div>

          {/* SEÇÃO 3: METAS ZOOTÉCNICAS E ECONÔMICAS */}
          <div
            className="tauze-field-group"
            style={{
              borderTop: '1px solid hsl(var(--border))',
              paddingTop: '16px',
              gridColumn: 'span 2',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <label className="tauze-label">
                <Utensils size={14} /> Consumo (% PV)
              </label>
              <input
                type="number"
                step="0.1"
                className="tauze-input"
                value={consumoPV}
                onChange={(e) => setConsumoPV(e.target.value)}
              />
            </div>
            <div>
              <label className="tauze-label">
                <TrendingUp size={14} /> GMD Alvo (kg/dia)
              </label>
              <input
                type="number"
                step="0.1"
                className="tauze-input"
                value={expectedGMD}
                onChange={(e) => setExpectedGMD(e.target.value)}
              />
            </div>
            <div>
              <label className="tauze-label">
                <DollarSign size={14} /> Venda da @ (R$)
              </label>
              <input
                type="number"
                step="1"
                className="tauze-input"
                value={precoArroba}
                onChange={(e) => setPrecoArroba(e.target.value)}
              />
            </div>
          </div>

          {/* DASHBOARD DE RESULTADOS (O ORÁCULO) */}
          <div className="tauze-field-group" style={{ gridColumn: 'span 2', marginTop: '8px' }}>
            <label className="tauze-label">Resultados da Simulação Zootécnica & Financeira</label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  padding: '16px',
                  background: 'hsl(var(--bg-main)/0.5)',
                  borderRadius: '16px',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Consumo Auto-Calculado
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'hsl(var(--brand))' }}>
                  {sim.consumoDiarioCabeca.toFixed(1)} kg / cab / dia
                </div>
              </div>
              <div
                style={{
                  padding: '16px',
                  background: 'hsl(var(--bg-main)/0.5)',
                  borderRadius: '16px',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Custo Diário Total (Lote)
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'hsl(var(--brand))' }}>
                  R$ {sim.custoDiarioLote.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                style={{
                  padding: '16px',
                  background: 'hsl(38 92% 50% / 0.1)',
                  borderRadius: '16px',
                  border: '1px solid hsl(38 92% 50% / 0.3)',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'hsl(38 92% 40%)',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Custo da @ Produzida
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(38 92% 40%)' }}>
                  R${' '}
                  {sim.custoArrobaProduzida.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '11px', color: 'hsl(38 92% 40%/0.7)', marginTop: '4px' }}>
                  Conversão: {sim.conversaoAlimentar.toFixed(2)} : 1
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  background:
                    sim.lucroLiquidoLotePeriodo >= 0
                      ? 'hsl(var(--brand)/0.1)'
                      : 'hsl(0 84% 60% / 0.1)',
                  borderRadius: '16px',
                  border: `1px solid ${sim.lucroLiquidoLotePeriodo >= 0 ? 'hsl(var(--brand)/0.3)' : 'hsl(0 84% 60% / 0.3)'}`,
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color:
                      sim.lucroLiquidoLotePeriodo >= 0 ? 'hsl(var(--brand))' : 'hsl(0 84% 60%)',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  {sim.lucroLiquidoLotePeriodo >= 0
                    ? 'Lucro Líquido Projetado (Lote)'
                    : 'Prejuízo Projetado (Lote)'}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color:
                      sim.lucroLiquidoLotePeriodo >= 0 ? 'hsl(var(--text-main))' : 'hsl(0 84% 60%)',
                  }}
                >
                  R${' '}
                  {sim.lucroLiquidoLotePeriodo.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div
                  style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}
                >
                  Ao final de {diasTrato} dias.
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidePanel>

      {/* Versão para Impressão Profissional */}
      <div className="print-report-container">
        <div className="print-header">
          <div className="farm-info">
            <div className="print-logo">TAUZE LIVESTOCK v5.0</div>
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
                  <td>Período de Simulação</td>
                  <td>{diasTrato} Dias</td>
                </tr>
                <tr>
                  <td>Consumo Individual Estimado</td>
                  <td>
                    {sim.consumoDiarioCabeca.toFixed(1)} kg/dia ({consumoPV}% PV)
                  </td>
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
                  <td>{sim.conversaoAlimentar.toFixed(2)} : 1</td>
                </tr>
                <tr>
                  <td>Custo da @ Produzida</td>
                  <td>
                    R${' '}
                    {sim.custoArrobaProduzida.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="print-section">
          <h2>Projeção de Performance e Custos Financeiros</h2>
          <div className="print-stats-grid">
            <div className="p-stat">
              <span className="ps-label">Custo Diário Total</span>
              <span className="ps-value">
                R$ {sim.custoDiarioLote.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-stat">
              <span className="ps-label">Arrobas Produzidas (@) / Cab</span>
              <span className="ps-value">{sim.arrobasProduzidasCabeca.toFixed(2)} @</span>
            </div>
            <div className="p-stat">
              <span className="ps-label">Preço @ Venda</span>
              <span className="ps-value">
                R$ {Number(precoArroba).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-stat highlight">
              <span className="ps-label">Lucro Líquido Final do Lote (Projetado)</span>
              <span className="ps-value">
                R${' '}
                {sim.lucroLiquidoLotePeriodo.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="print-footer">
          <p>Relatório gerado pelo módulo de Nutrição de Precisão do Tauze ERP.</p>
          <p>Este documento é uma projeção técnica e pode variar conforme as condições de campo.</p>
        </div>
      </div>

      <style>{`

            .print-report-container { display: none; }

            /* Estilos de Impressão Profissional */
            @media print {
              @page { size: A4; margin: 1.5cm; }
              
              /* Esconder o App e UI do Modal */
              #root, .sidebar, .header, .page-header, .tauze-controls-row, .management-content, .next-gen-kpi-grid,
              .simulator-header, .simulator-body, .simulator-footer, .close-btn { 
                display: none !important; 
              }

              /* Configurar Container do Relatório */
              .modal-overlay {
                position: absolute !important;
                inset: 0 !important;
                background: hsl(var(--bg-card)) !important;
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
                background: hsl(var(--bg-card)) !important;
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
                background: hsl(var(--bg-main)); padding: 20px; border-radius: 12px; border: 1px solid hsl(var(--border));
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
              .p-stat { padding: 16px; border: 1px solid hsl(var(--border)); border-radius: 12px; display: flex !important; flex-direction: column !important; gap: 8px !important; }
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
