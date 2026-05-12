import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  ArrowRight,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormModal } from '../../../components/Forms/FormModal';

interface HedgeSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HedgeSimulationModal: React.FC<HedgeSimulationModalProps> = ({ isOpen, onClose }) => {
  const [params, setParams] = useState({
    quantity: 1000,
    currentPrice: 285.50,
    targetPrice: 310.00,
    costOfHedge: 2.50,
    volatility: 15
  });

  const [results, setResults] = useState({
    exposure: 0,
    protectedValue: 0,
    hedgeEfficiency: 0,
    scenarios: [] as any[]
  });

  useEffect(() => {
    calculateSimulation();
  }, [params]);

  const calculateSimulation = () => {
    const exposure = params.quantity * params.currentPrice;
    const protectedValue = params.quantity * params.targetPrice;
    const costTotal = params.quantity * params.costOfHedge;
    const netResult = protectedValue - costTotal - exposure;
    
    // Simple scenario generation
    const scenarios = [
      { label: 'Queda Drástica (-15%)', price: params.currentPrice * 0.85, result: (params.currentPrice * 0.85 * params.quantity) },
      { label: 'Queda Leve (-5%)', price: params.currentPrice * 0.95, result: (params.currentPrice * 0.95 * params.quantity) },
      { label: 'Estável (0%)', price: params.currentPrice, result: (params.currentPrice * params.quantity) },
      { label: 'Alta Leve (+5%)', price: params.currentPrice * 1.05, result: (params.currentPrice * 1.05 * params.quantity) },
    ];

    setResults({
      exposure,
      protectedValue,
      hedgeEfficiency: (netResult / exposure) * 100,
      scenarios
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); }}
      title="Simulação de Hedge"
      subtitle="Projeção de cenários financeiros e proteção de margem de lucro."
      icon={BarChart2}
      size="large"
      submitLabel="Salvar Simulação"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px', gridColumn: 'span 2' }}>
        {/* Parâmetros */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="elite-input-field">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} color="hsl(var(--brand))" />
              Volume (Arrobas/Ton)
            </label>
            <input 
              type="number" 
              value={params.quantity}
              onChange={(e) => setParams({ ...params, quantity: Number(e.target.value) })}
              placeholder="Ex: 1000"
            />
          </div>

          <div className="elite-input-field">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={14} color="hsl(var(--brand))" />
              Preço Atual (Mercado)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>R$</span>
              <input 
                type="number" 
                style={{ paddingLeft: '36px' }}
                value={params.currentPrice}
                onChange={(e) => setParams({ ...params, currentPrice: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="elite-input-field">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={14} color="hsl(var(--brand))" />
              Preço Alvo (Hedge)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>R$</span>
              <input 
                type="number" 
                style={{ paddingLeft: '36px' }}
                value={params.targetPrice}
                onChange={(e) => setParams({ ...params, targetPrice: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="elite-input-field">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} color="hsl(var(--brand))" />
              Custo da Operação (Unid)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>R$</span>
              <input 
                type="number" 
                style={{ paddingLeft: '36px' }}
                value={params.costOfHedge}
                onChange={(e) => setParams({ ...params, costOfHedge: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '16px', background: 'hsl(var(--brand)/0.05)', border: '1px solid hsl(var(--brand)/0.2)', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--brand))', fontSize: '12px', fontWeight: 800, marginBottom: '8px' }}>
              <Info size={14} />
              DICA ELITE
            </div>
            <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.5', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
              Considere a volatilidade do mercado físico vs B3 para uma simulação mais precisa.
            </p>
          </div>
        </div>

        {/* Resultados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Exposição Atual</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
                {results.exposure.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div style={{ padding: '24px', borderRadius: '24px', background: 'hsl(var(--brand))', border: '1px solid transparent', display: 'flex', flexDirection: 'column', gap: '4px', color: 'white' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, opacity: 0.8, textTransform: 'uppercase' }}>Valor Protegido (Net)</span>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>
                {results.protectedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: '24px', borderRadius: '24px', background: 'hsl(var(--bg-main)/0.2)', border: '1px solid hsl(var(--border))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800 }}>Análise de Stress do Mercado</span>
              <div style={{ padding: '4px 12px', borderRadius: '20px', background: 'hsl(var(--success)/0.1)', color: 'hsl(var(--success))', fontSize: '11px', fontWeight: 900 }}>
                EFICIÊNCIA: {results.hedgeEfficiency.toFixed(1)}%
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.scenarios.map((scenario, idx) => {
                const diff = results.protectedValue - scenario.result;
                const isPositive = diff > 0;
                
                return (
                  <div key={idx} style={{ padding: '16px', borderRadius: '16px', background: 'white', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isPositive ? 'hsl(var(--success)/0.1)' : 'hsl(var(--danger)/0.1)', color: isPositive ? 'hsl(var(--success))' : 'hsl(var(--danger))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800 }}>{scenario.label}</div>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Mercado a R$ {scenario.price.toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: isPositive ? 'hsl(var(--success))' : 'hsl(var(--text-main))' }}>
                        {isPositive ? `+ ${diff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : `Prejuízo Evitado`}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Impacto na Margem</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </FormModal>
  );
};
