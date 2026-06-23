import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  ArrowRight,
  Shield,
  Zap,
  Info,
  Layers,
  Banknote,
  Package,
} from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { SearchableSelect } from '../../../components/Forms/SearchableSelect';

interface HedgeSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HedgeSimulationModal: React.FC<HedgeSimulationModalProps> = ({ isOpen, onClose }) => {
  const [params, setParams] = useState({
    asset: 'soja',
    instrument: 'put',
    exchangeRate: 5.2,
    quantity: 1000,
    currentPrice: 120.0, // Preço Base
    targetPrice: 130.0, // Strike da Opção / Trava do Futuro
    costOfHedge: 2.5, // Prêmio da Put ou Corretagem
  });

  const [results, setResults] = useState({
    exposureBase: 0,
    exposureBRL: 0,
    protectedValueBase: 0,
    protectedValueBRL: 0,
    totalCostBRL: 0,
    hedgeEfficiency: 0,
    scenarios: [] as any[],
  });

  const calculateSimulation = useCallback(() => {
    // Valores na Moeda Base (Ex: Dólar se commodity exportada, ou BRL se mercado interno. Aqui simplificamos assumindo o input como Base)
    const exposureBase = params.quantity * params.currentPrice;
    const protectedValueBase = params.quantity * params.targetPrice;
    const costTotalBase = params.quantity * params.costOfHedge;

    // Convertido para BRL pelo câmbio projetado
    const exposureBRL = exposureBase * params.exchangeRate;
    const protectedValueBRL = protectedValueBase * params.exchangeRate;
    const costTotalBRL = costTotalBase * params.exchangeRate;

    // Geração de Cenários de Stress (Variações na cotação do ativo base)
    const variations = [
      { label: 'Queda Drástica', pct: -0.2 },
      { label: 'Queda Leve', pct: -0.05 },
      { label: 'Estabilidade', pct: 0.0 },
      { label: 'Alta Leve', pct: 0.05 },
      { label: 'Alta Expressiva', pct: 0.2 },
    ];

    const scenarios = variations.map((v) => {
      const simulatedPriceBase = params.currentPrice * (1 + v.pct);

      // 1. RESULTADO NO MERCADO FÍSICO (Venda da Safra)
      const physicalResultBRL = simulatedPriceBase * params.quantity * params.exchangeRate;
      const physicalDiff = physicalResultBRL - exposureBRL;

      // 2. RESULTADO NO MERCADO FINANCEIRO (Bolsa - Ajuste do Derivativo)
      let financialGainBRL = 0;

      if (params.instrument === 'put') {
        // Opção de Venda: Só ganha se o preço cair abaixo do Strike (Target)
        if (simulatedPriceBase < params.targetPrice) {
          financialGainBRL =
            (params.targetPrice - simulatedPriceBase) * params.quantity * params.exchangeRate;
        }
      } else if (params.instrument === 'future' || params.instrument === 'ndf') {
        // Mercado Futuro/Termo: Compensa exatamente a diferença (ganha na queda, perde na alta do físico)
        financialGainBRL =
          (params.targetPrice - simulatedPriceBase) * params.quantity * params.exchangeRate;
      }

      // 3. RESULTADO LÍQUIDO FINAL (Hedge Accounting)
      // Caixa Físico + Ajuste Bolsa - Custo do Prêmio
      const netResultBRL = physicalResultBRL + financialGainBRL - costTotalBRL;

      return {
        label: v.label,
        simulatedPriceBase,
        physicalResultBRL,
        financialGainBRL,
        costTotalBRL,
        netResultBRL,
        // Diferença final contra a exposição original (se não fizesse hedge)
        diffVsUnhedged: netResultBRL - exposureBRL,
      };
    });

    // Calcula a eficiência media de proteção nas quedas
    const downScenarios = scenarios.filter((s) => s.simulatedPriceBase < params.currentPrice);
    let efficiency = 0;
    if (downScenarios.length > 0) {
      // O quanto a margem líquida ficou próxima da exposição original, ou até melhor, ignorando o custo puro
      const avgNet =
        downScenarios.reduce((acc, s) => acc + s.netResultBRL, 0) / downScenarios.length;
      efficiency = (avgNet / exposureBRL) * 100;
    }

    setResults({
      exposureBase,
      exposureBRL,
      protectedValueBase,
      protectedValueBRL,
      totalCostBRL: costTotalBRL,
      hedgeEfficiency: efficiency > 100 ? 100 : efficiency,
      scenarios,
    });
  }, [params]);

  useEffect(() => {
    calculateSimulation();
  }, [calculateSimulation]);

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
      }}
      title="Simulação de Hedge (Trading Desk)"
      subtitle="Proteja sua margem de lucro com análise de stress de derivativos (Casamento Físico x Financeiro)."
      icon={BarChart2}
      size="xxlarge"
      submitLabel="Aprovar Estratégia de Hedge"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '380px 1fr',
          gap: '32px',
          gridColumn: 'span 2',
        }}
      >
        {/* LADO ESQUERDO: PARÂMETROS DA OPERAÇÃO */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            background: 'hsl(var(--bg-card))',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: 'hsl(var(--text-main))',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid hsl(var(--border))',
              paddingBottom: '12px',
            }}
          >
            <Layers size={16} color="hsl(var(--brand))" />
            Configuração do Derivativo
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="tauze-input-field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                <Package size={12} color="hsl(var(--text-muted))" /> Ativo
              </label>
              <SearchableSelect
                value={params.asset}
                onChange={(val: any) => setParams({ ...params, asset: val })}
                options={[
                  { value: 'soja', label: 'Soja em Grãos' },
                  { value: 'milho', label: 'Milho em Grãos' },
                  { value: 'boi', label: 'Boi Gordo (@)' },
                  { value: 'dolar', label: 'Dólar (USD/BRL)' },
                ]}
              />
            </div>

            <div className="tauze-input-field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                <Shield size={12} color="hsl(var(--text-muted))" /> Instrumento
              </label>
              <SearchableSelect
                value={params.instrument}
                onChange={(val: any) => setParams({ ...params, instrument: val })}
                options={[
                  { value: 'put', label: 'Opção de Venda (Put)' },
                  { value: 'future', label: 'Mercado Futuro (B3/CBOT)' },
                  { value: 'ndf', label: 'Termo de Moeda (NDF)' },
                ]}
              />
            </div>
          </div>

          <div className="tauze-input-field">
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <Zap size={12} color="hsl(var(--text-muted))" /> Volume do Contrato (Qtd)
            </label>
            <input
              className="tauze-input"
              type="number"
              value={params.quantity}
              onChange={(e) => setParams({ ...params, quantity: Number(e.target.value) })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="tauze-input-field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                <DollarSign size={12} color="hsl(var(--text-muted))" /> Cotação Atual
              </label>
              <input
                className="tauze-input"
                type="number"
                step="0.01"
                value={params.currentPrice}
                onChange={(e) => setParams({ ...params, currentPrice: Number(e.target.value) })}
              />
            </div>

            <div className="tauze-input-field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'hsl(var(--success))',
                }}
              >
                <Target size={12} /> Strike / Alvo de Trava
              </label>
              <input
                className="tauze-input"
                type="number"
                step="0.01"
                value={params.targetPrice}
                onChange={(e) => setParams({ ...params, targetPrice: Number(e.target.value) })}
                style={{ borderColor: 'hsl(var(--success)/0.5)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="tauze-input-field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'hsl(var(--danger))',
                }}
              >
                <Banknote size={12} /> Custo Op. (Unid)
              </label>
              <input
                className="tauze-input"
                type="number"
                step="0.01"
                value={params.costOfHedge}
                onChange={(e) => setParams({ ...params, costOfHedge: Number(e.target.value) })}
              />
            </div>
            <div className="tauze-input-field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                <DollarSign size={12} color="hsl(var(--text-muted))" /> Taxa de Câmbio (R$)
              </label>
              <input
                className="tauze-input"
                type="number"
                step="0.01"
                value={params.exchangeRate}
                onChange={(e) => setParams({ ...params, exchangeRate: Number(e.target.value) })}
              />
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'hsl(var(--brand)/0.05)',
              border: '1px solid hsl(var(--brand)/0.2)',
              marginTop: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'hsl(var(--brand))',
                fontSize: '11px',
                fontWeight: 800,
                marginBottom: '8px',
              }}
            >
              <Info size={14} /> DICA TAUZE
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                lineHeight: '1.5',
                color: 'hsl(var(--text-muted))',
                fontWeight: 500,
              }}
            >
              Use a opção <strong>"Opção de Venda (Put)"</strong> para proteção contra quedas sem
              limitar ganhos de alta (seguro de safra). Use <strong>"Mercado Futuro"</strong> para
              travar o preço estático.
            </p>
          </div>
        </div>

        {/* LADO DIREITO: RESULTADOS E STRESS TEST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Cards Resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div
              style={{
                padding: '24px',
                borderRadius: '16px',
                background: 'hsl(var(--bg-main))',
                border: '1px dashed hsl(var(--border))',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                }}
              >
                Valor Físico (S/ Hedge)
              </span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
                {results.exposureBRL.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
            </div>
            <div
              style={{
                padding: '24px',
                borderRadius: '16px',
                background:
                  'linear-gradient(135deg, hsl(var(--success)) 0%, hsl(var(--success-dark, 142 71% 25%)) 100%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                color: 'white',
                boxShadow: '0 10px 25px -5px hsl(var(--success)/0.3)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  opacity: 0.9,
                  textTransform: 'uppercase',
                }}
              >
                Piso Protegido (C/ Hedge)
              </span>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>
                {results.protectedValueBRL.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
              <span style={{ fontSize: '10px', opacity: 0.8 }}>
                Custo total:{' '}
                {results.totalCostBRL.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>

          {/* Análise de Stress: Hedge Accounting */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              borderRadius: '16px',
              background: 'hsl(var(--bg-main)/0.2)',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div>
                <span style={{ fontSize: '14px', fontWeight: 800, display: 'block' }}>
                  Análise de Stress (Hedge Accounting)
                </span>
                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                  Composição: Físico + Financeiro
                </span>
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'hsl(var(--success)/0.1)',
                  color: 'hsl(var(--success))',
                  fontSize: '11px',
                  fontWeight: 900,
                }}
              >
                EFICIÊNCIA DE PROTEÇÃO: {results.hedgeEfficiency.toFixed(1)}%
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {results.scenarios.map((scenario, idx) => {
                // Determine se a variação no cenário foi boa ou ruim em relação à exposição original
                const isNetPositive = scenario.diffVsUnhedged >= -0.01; // margem de flutuação de precisão
                const isPriceDown = scenario.simulatedPriceBase < params.currentPrice;

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'hsl(var(--bg-card))',
                      border: `1px solid ${isPriceDown ? 'hsl(var(--danger)/0.3)' : 'hsl(var(--border))'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      position: 'relative',
                    }}
                  >
                    {/* Header do Cenário */}
                    <div style={{ width: '130px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: isPriceDown ? 'hsl(var(--danger))' : 'hsl(var(--text-main))',
                        }}
                      >
                        {scenario.label}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'hsl(var(--text-muted))',
                          fontWeight: 600,
                        }}
                      >
                        Cotação a {scenario.simulatedPriceBase.toFixed(2)}
                      </div>
                    </div>

                    {/* Matemática do Hedge Accounting */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center',
                        borderLeft: '1px dashed hsl(var(--border))',
                        paddingLeft: '20px',
                      }}
                    >
                      {/* Venda Física */}
                      <div>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'hsl(var(--text-muted))',
                            textTransform: 'uppercase',
                          }}
                        >
                          Físico
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'hsl(var(--text-main))',
                          }}
                        >
                          {scenario.physicalResultBRL.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>+</div>

                      {/* Ajuste Financeiro (Bolsa) */}
                      <div>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'hsl(var(--text-muted))',
                            textTransform: 'uppercase',
                          }}
                        >
                          Bolsa/Opção
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color:
                              scenario.financialGainBRL > 0
                                ? 'hsl(var(--success))'
                                : 'hsl(var(--danger))',
                          }}
                        >
                          {scenario.financialGainBRL.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      </div>

                      <ArrowRight
                        size={14}
                        color="hsl(var(--text-muted))"
                        style={{ marginLeft: 'auto' }}
                      />

                      {/* Resultado Líquido Final */}
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: 'hsl(var(--brand))',
                            textTransform: 'uppercase',
                            marginBottom: '2px',
                          }}
                        >
                          Caixa Líquido
                        </div>
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 900,
                            color: 'hsl(var(--text-main))',
                          }}
                        >
                          {scenario.netResultBRL.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: '20px',
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                textAlign: 'center',
              }}
            >
              * Os cálculos incluem o desconto do Custo da Operação (Prêmio/Corretagem) de{' '}
              {results.totalCostBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              .
            </div>
          </div>
        </div>
      </div>
    </SidePanel>
  );
};
