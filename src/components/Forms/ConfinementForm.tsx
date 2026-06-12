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
  AlertTriangle,
  Syringe,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';
import { ConsumptionCart } from './ConsumptionCart';
import { DateInput } from '../../components/Form/DateInput';

interface ConfinementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  actionId?: number;
}

export const ConfinementForm: React.FC<ConfinementFormProps> = ({isOpen, onClose, onSubmit, actionId }) => {
  const { activeFarm } = useTenant();
  const [lots, setLots] = useState<any[]>([]);
  const [formData, setFormData] = usePersistentState('ConfinementForm_formData', {
    nome_curral: '',
    capacidade_animais: '100',
    dof_alvo: '90',
    data_inicio: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    peso_entrada: '420',
    gmd_projetado: '1.5',
    lote_id: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [activeEtapa, setActiveEtapa] = useState('dados');

  const isDadosDone = !!formData.nome_curral && !!formData.capacidade_animais && !!formData.peso_entrada;
  const isPlanejamentoDone = !!formData.dof_alvo && !!formData.gmd_projetado && !!formData.data_inicio;

  const ETAPAS_CONFIG = [
    { id: 'dados', label: '1. Curral & Capacidade', icon: Building, color: '#3b82f6' },
    { id: 'planejamento', label: '2. Planejamento', icon: TrendingUp, color: '#10b981' }
  ];

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
      await onSubmit({ ...formData });

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
    <SidePanel size="850px"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Novo Curral de Confinamento"
      subtitle="Inicie um novo ciclo de terminação intensiva."
      icon={Building}
      loading={loading}
      submitLabel="Iniciar Ciclo"
    >
      {/* Dashboard Top */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        
        {/* Projeção / Peso */}
        <div style={{ flex: 1, minWidth: '250px', padding: '16px', background: 'hsl(var(--brand) / 0.05)', border: '1px solid hsl(var(--brand) / 0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--brand))', textTransform: 'uppercase', marginBottom: '4px' }}>Peso de Saída Projetado</span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
              {predicao.pesoFinal > 0 ? `${predicao.pesoFinal.toFixed(1)} kg` : '--'}
            </span>
            <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
              Total Ganho: {predicao.arrobasGanhos > 0 ? `+${predicao.arrobasGanhos.toFixed(1)} @` : '--'}
            </div>
          </div>
          <div style={{ background: 'white', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Target size={24} style={{ color: 'hsl(var(--brand))' }} />
          </div>
        </div>

        {/* Alertas Box */}
        <div style={{ flex: 1, minWidth: '200px', padding: '16px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>Previsões & Alertas</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#10b981' }}>
              <CalendarDays size={14} /> Data de Saída: {predicao.dataSaidaStr}
            </div>
            {predicao.alertas.map((alerta, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: 'hsl(38 92% 50%)' }}>
                <AlertTriangle size={14} /> {alerta}
              </div>
            ))}
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Sidebar - Phase Navigation */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ETAPAS_CONFIG.map((et) => {
            let isCompleted = false;
            if (et.id === 'dados') isCompleted = isDadosDone;
            if (et.id === 'planejamento') isCompleted = isPlanejamentoDone;

            const isActive = activeEtapa === et.id;
            const Icon = et.icon;
            
            return (
              <button
                key={et.id}
                type="button"
                onClick={() => setActiveEtapa(et.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  borderRadius: '12px', border: 'none',
                  background: isActive ? `${et.color}15` : 'transparent',
                  color: isActive ? et.color : 'hsl(var(--text-secondary))',
                  cursor: 'pointer', textAlign: 'left', fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `inset 3px 0 0 ${et.color}` : 'none'
                }}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  background: isCompleted ? et.color : isActive ? `${et.color}30` : 'hsl(var(--bg-main))',
                  color: isCompleted ? '#fff' : isActive ? et.color : 'hsl(var(--text-muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1 }}>{et.label}</span>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            )
          })}
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', padding: '24px' }}>
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ETAPAS_CONFIG.find(e => e.id === activeEtapa)?.label}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
                {activeEtapa === 'dados' && "Informações básicas sobre o curral e capacidade do lote."}
                {activeEtapa === 'planejamento' && "Defina as metas zootécnicas e a data de início."}
                {activeEtapa === 'insumos' && "Registre os insumos e vacinas utilizados no protocolo de entrada."}
              </p>
            </div>

            {activeEtapa === 'dados' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
              </motion.div>
            )}

            {activeEtapa === 'planejamento' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
              </motion.div>
            )}

          </div>
        </div>
      </div>

    </SidePanel>
  );
};
