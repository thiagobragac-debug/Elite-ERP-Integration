import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  Building, 
  Users,
  Clock,
  Beef,
  Scale,
  DollarSign,
  Calendar,
  Layers,
  FileText,
  TrendingUp,
  Target,
  CalendarDays,
  AlertTriangle
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

interface ConfinementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export const ConfinementForm: React.FC<ConfinementFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { activeFarm } = useTenant();
  const [lots, setLots] = useState<any[]>([]);
  const [formData, setFormData] = usePersistentState('ConfinementForm_formData', {
    nome_curral: '',
    capacidade_animais: '100',
    dof_alvo: '90',
    data_inicio: new Date().toISOString().split('T')[0],
    peso_entrada: '420',
    gmd_projetado: '1.5',
    lote_id: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchLots();
    }
  }, [isOpen, activeFarm]);

  const fetchLots = async () => {
    const { data } = await supabase
      .from('lotes')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id || '')
      .eq('tenant_id', activeFarm?.tenantId || '')
      .eq('status', 'ATIVO');
    
    if (data) setLots(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);

    } finally {
      setLoading(false);
    }
  };

  // --- ZOO PREDICTIONS ENGINE ---
  const predicao = useMemo(() => {
    const pesoEntrada = parseFloat(formData.peso_entrada) || 0;
    const gmd = parseFloat(formData.gmd_projetado) || 0;
    const dof = parseInt(formData.dof_alvo) || 0;
    const capacidade = parseInt(formData.capacidade_animais) || 0;
    
    const pesoFinal = pesoEntrada + (gmd * dof);
    const arrobas = pesoFinal / 30; // Considerando rendimento de carcaça padrão de 50%
    const arrobasGanhos = ((gmd * dof) * capacidade) / 30;

    let dataSaidaStr = '--/--/----';
    if (formData.data_inicio && dof > 0) {
      const dataSaida = new Date(formData.data_inicio);
      dataSaida.setDate(dataSaida.getDate() + dof);
      dataSaidaStr = dataSaida.toLocaleDateString('pt-BR');
    }

    const alertas = [];
    if (pesoEntrada > 0 && pesoEntrada < 250) {
      alertas.push("Peso de entrada muito baixo. Risco de estadia prolongada.");
    }
    if (gmd > 2.2) {
      alertas.push("GMD projetado muito alto. Verifique a viabilidade nutricional.");
    } else if (gmd > 0 && gmd < 0.8) {
      alertas.push("GMD projetado muito baixo para confinamento intensivo.");
    }

    return { pesoFinal, arrobas, dataSaidaStr, arrobasGanhos, alertas };
  }, [formData.peso_entrada, formData.gmd_projetado, formData.dof_alvo, formData.data_inicio, formData.capacidade_animais]);

  return (
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Novo Curral de Confinamento"
      subtitle="Inicie um novo ciclo de terminação intensiva."
      icon={Building}
      loading={loading}
      submitLabel="Iniciar Ciclo"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados do Curral & Capacidade</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Building size={14} /> Nome do Curral / Piquete</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: CURRAL-01, Terminação A..." 
              value={formData.nome_curral}
              onChange={(e) => setFormData({...formData, nome_curral: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Users size={14} /> Capacidade (Animais)</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="100" 
              value={formData.capacidade_animais}
              onChange={(e) => setFormData({...formData, capacidade_animais: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Scale size={14} /> Peso Médio Entrada (kg)</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="420.0" 
              value={formData.peso_entrada}
              onChange={(e) => setFormData({...formData, peso_entrada: e.target.value})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Planejamento & Observações</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Clock size={14} /> DOF Alvo (Dias)</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="90" 
              value={formData.dof_alvo}
              onChange={(e) => setFormData({...formData, dof_alvo: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><TrendingUp size={14} /> GMD Projetado (kg/dia)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="1.50" 
              value={formData.gmd_projetado}
              onChange={(e) => setFormData({...formData, gmd_projetado: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Calendar size={14} /> Data de Início</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.data_inicio}
              onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Layers size={14} /> Lote Vinculado</label>
            <SearchableSelect 
              value={formData.lote_id}
              onChange={(val: any) => setFormData({...formData, lote_id: val})}
              options={[
                { value: ``, label: `Selecionar Lote...` },
                ...(lots || []).map(lot => ({ value: String(lot.id), label: String(lot.nome) })),
              ]}
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><FileText size={14} /> Observações do Check-in</label>
            <textarea 
              className="tauze-input tauze-textarea"
              placeholder="Notas sobre o estado dos animais na entrada..." 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* DASHBOARD ZOOTÉCNICO (SIMULADOR DE VIABILIDADE) */}
      <section style={{ 
        marginTop: '8px', 
        padding: '24px', 
        borderRadius: '16px', 
        background: 'linear-gradient(145deg, hsl(var(--brand) / 0.08) 0%, hsl(var(--brand) / 0.02) 100%)',
        border: '1.5px dashed hsl(var(--brand) / 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Target size={18} style={{ color: 'hsl(var(--brand))' }} />
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--brand))', letterSpacing: '0.5px' }}>
            Projeção do Ciclo de Terminação
          </h4>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px', background: 'hsl(var(--bg-card))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarDays size={14} /> Previsão de Saída
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
              {predicao.dataSaidaStr}
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '120px', background: 'hsl(var(--bg-card))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={14} /> Peso de Abate
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>
              {predicao.pesoFinal > 0 ? `${predicao.pesoFinal.toFixed(1)} kg` : '--'}
              <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 700, marginLeft: '6px' }}>
                (~{predicao.arrobas > 0 ? predicao.arrobas.toFixed(1) : '--'} @)
              </span>
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '120px', background: 'hsl(var(--bg-card))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} /> Total Ganho (Lote)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'hsl(var(--brand))' }}>
              {predicao.arrobasGanhos > 0 ? `+${predicao.arrobasGanhos.toFixed(1)} @` : '--'}
            </div>
          </div>
        </div>

        {predicao.alertas.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {predicao.alertas.map((alerta, idx) => (
              <div key={idx} style={{ padding: '10px 14px', background: 'hsl(38 92% 50% / 0.1)', border: '1px solid hsl(38 92% 50% / 0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: 'hsl(38 92% 40%)' }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{alerta}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </SidePanel>
  );
};
