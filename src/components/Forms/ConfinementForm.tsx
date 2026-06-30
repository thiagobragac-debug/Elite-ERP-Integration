import { showValidationAlert } from '../../utils/validationAlert';
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useFormDraft } from '../../hooks/useFormDraft';
import { z } from 'zod';

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
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useFarmFilter } from '../../hooks/useFarmFilter';
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

export const ConfinementForm: React.FC<ConfinementFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  actionId,
}) => {
  const { activeFarm, activeTenantId } = useTenant();
  const { applyFarmFilter } = useFarmFilter();
  const [lots, setLots] = useState<any[]>([]);
  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `confinement_form_${activeTenantId}`,
    initialState: {
      nome_curral: '',
      capacidade_animais: '100',
      dof_alvo: '90',
      data_inicio: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0],
      peso_entrada: '420',
      gmd_projetado: '1.5',
      lote_id: '',
      status: 'active',
      observacoes: '',
      categoria: 'novilho',
    },
    isOpen,
    isEditMode: false,
  });

  const [loading, setLoading] = useState(false);
  const [activeEtapa, setActiveEtapa] = useState('dados');

  const isDadosDone =
    !!formData.nome_curral && !!formData.capacidade_animais && !!formData.peso_entrada;
  const isPlanejamentoDone =
    !!formData.dof_alvo && !!formData.gmd_projetado && !!formData.data_inicio;

  const ETAPAS_CONFIG = [
    { id: 'dados', label: '1. Curral & Capacidade', icon: Building, color: '#3b82f6' },
    { id: 'planejamento', label: '2. Planejamento', icon: TrendingUp, color: '#10b981' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchLots();
    }
  }, [isOpen, activeFarm, activeTenantId]);

  const fetchLots = async () => {
    const { data } = await applyFarmFilter(
      supabase
        .from('lotes')
        .select('id, nome, fazenda_id, fazendas(nome)').eq('tenant_id', activeTenantId)
        .eq('status', 'ATIVO')
    );
    if (data) {
      setLots(data);
    }
  };

  const confinementSchema = z.object({
    nome: z.string().min(3, "O nome do curral deve ter no mínimo 3 caracteres"),
    capacidade_animais: z.coerce.number().min(1, "A capacidade deve ser maior que zero"),
    dof_alvo: z.coerce.number().min(1, "Dias de confinamento (DOF) devem ser maiores que zero"),
    gmd_projetado: z.coerce.number().min(0, "O GMD projetado não pode ser negativo"),
    peso_entrada: z.coerce.number().min(0, "O peso de entrada estimado não pode ser negativo")
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      confinementSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        showValidationAlert(err);
        return;
      }
    }

    setLoading(true);
    try {
      let finalData = { ...formData };
      if (!activeFarm && finalData.lote_id) {
        // Find the farm associated with the selected lote
        const selectedLot = lots.find((l) => String(l.id) === finalData.lote_id);
        if (selectedLot?.fazenda_id) {
          finalData = { ...finalData, fazenda_id: selectedLot.fazenda_id };
        }
      }
      await onSubmit(finalData);
      clearDraft();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  // --- ZOO PREDICTIONS ENGINE ---
  const predicao = useMemo(() => {
    const pesoEntrada = parseFloat(String(formData.peso_entrada).replace(',', '.')) || 0;
    const gmd = parseFloat(String(formData.gmd_projetado).replace(',', '.')) || 0;
    const dof = parseInt(String(formData.dof_alvo)) || 0;
    const capacidade = parseInt(String(formData.capacidade_animais)) || 0;
    const cotacaoArroba = 250; 

    const pesoFinal = pesoEntrada + gmd * dof;
    const rendimentoCarcaca = 0.52;
    
    const arrobas = (pesoFinal * rendimentoCarcaca) / 15; 
    const ganhoArrobasPorAnimal = ((pesoFinal - pesoEntrada) * rendimentoCarcaca) / 15;
    const arrobasGanhosLote = ganhoArrobasPorAnimal * capacidade;
    const receitaBruta = arrobasGanhosLote * cotacaoArroba;

    let dataSaidaStr = '--/--/----';
    if (formData.data_inicio && dof > 0) {
      const dataSaida = new Date(formData.data_inicio + 'T12:00:00');
      dataSaida.setDate(dataSaida.getDate() + dof);
      dataSaidaStr = dataSaida.toLocaleDateString('pt-BR');
    }

    const alertas: string[] = [];
    
    // Retroactive check
    const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const isRetroactive = formData.data_inicio < todayStr;
    if (isRetroactive) {
        alertas.push('Data de início retroativa. Certifique-se de que o check-in está correto.');
    }

    // Category based validation
    let minPeso = 150, maxPeso = 320;
    let minGMD = 0.6, maxGMD = 1.4;
    
    switch (formData.categoria) {
        case 'bezerro': minPeso = 150; maxPeso = 320; minGMD = 0.6; maxGMD = 1.4; break;
        case 'novilho': minPeso = 280; maxPeso = 440; minGMD = 1.0; maxGMD = 2.0; break;
        case 'boi_gordo': minPeso = 380; maxPeso = 560; minGMD = 1.2; maxGMD = 2.2; break;
        case 'vaca_descarte': minPeso = 300; maxPeso = 520; minGMD = 0.8; maxGMD = 1.6; break;
    }

    const catLabel = (formData.categoria || 'novilho').replace('_', ' ');

    if (pesoEntrada > 0 && pesoEntrada < minPeso) {
      alertas.push(`Peso de entrada baixo para ${catLabel}. Risco de estadia prolongada.`);
    }
    if (pesoEntrada > maxPeso) {
        alertas.push(`Peso de entrada muito alto para ${catLabel}.`);
    }

    if (gmd > maxGMD) {
      alertas.push(`GMD projetado muito alto para ${catLabel}. Verifique a viabilidade nutricional.`);
    } else if (gmd > 0 && gmd < minGMD) {
      alertas.push(`GMD projetado muito baixo para ${catLabel} em confinamento intensivo.`);
    }

    return { pesoFinal, arrobas, dataSaidaStr, arrobasGanhosLote, receitaBruta, alertas };
  }, [
    formData.peso_entrada,
    formData.gmd_projetado,
    formData.dof_alvo,
    formData.data_inicio,
    formData.capacidade_animais,
    formData.categoria
  ]);

  return (
    <SidePanel
      size="850px"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title="Novo Curral de Confinamento"
      subtitle="Inicie um novo ciclo de terminação intensiva."
      icon={Building}
      loading={loading}
      submitLabel="Iniciar Ciclo"
      submitDisabled={!isDadosDone || !isPlanejamentoDone}
    >

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Sidebar - Phase Navigation */}
        <div
          style={{
            width: '220px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {ETAPAS_CONFIG.map((et) => {
            let isCompleted = false;
            if (et.id === 'dados') {
              isCompleted = isDadosDone;
            }
            if (et.id === 'planejamento') {
              isCompleted = isPlanejamentoDone;
            }

            const isActive = activeEtapa === et.id;
            const Icon = et.icon;

            return (
              <button
                key={et.id}
                type="button"
                onClick={() => {
                   if (et.id === 'planejamento' && !isDadosDone) {
                       import('react-hot-toast').then(m => m.default.error('Preencha os campos obrigatórios da etapa anterior.'));
                       return;
                   }
                   setActiveEtapa(et.id)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? `${et.color}15` : 'transparent',
                  color: isActive ? et.color : 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `inset 3px 0 0 ${et.color}` : 'none',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isCompleted
                      ? et.color
                      : isActive
                        ? `${et.color}30`
                        : 'hsl(var(--bg-main))',
                    color: isCompleted ? '#fff' : isActive ? et.color : 'hsl(var(--text-muted))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1 }}>{et.label}</span>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            );
          })}
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div
              style={{
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <h3
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {ETAPAS_CONFIG.find((e) => e.id === activeEtapa)?.label}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
                {activeEtapa === 'dados' &&
                  'Informações básicas sobre o curral e capacidade do lote.'}
                {activeEtapa === 'planejamento' &&
                  'Defina as metas zootécnicas e a data de início.'}
                {activeEtapa === 'insumos' &&
                  'Registre os insumos e vacinas utilizados no protocolo de entrada.'}
              </p>
            </div>

            {activeEtapa === 'dados' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="tauze-input-grid grid-col-2">
                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label">
                      <Building size={14} /> Nome do Curral / Piquete
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Ex: CURRAL-01, Terminação A..."
                      value={formData.nome_curral}
                      onChange={(e) => setFormData({ ...formData, nome_curral: e.target.value })}
                      required
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Users size={14} /> Capacidade (Animais)
                    </label>
                    <input
                      className="tauze-input"
                      type="number"
                      placeholder="100"
                      value={formData.capacidade_animais}
                      onChange={(e) =>
                        setFormData({ ...formData, capacidade_animais: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Beef size={14} /> Categoria Animal
                    </label>
                    <select
                      className="tauze-input"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      required
                    >
                      <option value="bezerro">Bezerro (até 12 meses)</option>
                      <option value="novilho">Novilho (18-24 meses)</option>
                      <option value="boi_gordo">Boi Gordo (24+ meses)</option>
                      <option value="vaca_descarte">Vaca de Descarte</option>
                    </select>
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Scale size={14} /> Peso Médio Entrada (kg)
                    </label>
                    <input
                      className="tauze-input"
                      type="number"
                      placeholder="420.0"
                      value={formData.peso_entrada}
                      onChange={(e) => setFormData({ ...formData, peso_entrada: e.target.value })}
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
                    <label className="tauze-label">
                      <Clock size={14} /> DOF Alvo (Dias)
                    </label>
                    <input
                      className="tauze-input"
                      type="number"
                      placeholder="90"
                      value={formData.dof_alvo}
                      onChange={(e) => setFormData({ ...formData, dof_alvo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <TrendingUp size={14} /> GMD Projetado (kg/dia)
                    </label>
                    <input
                      className="tauze-input"
                      type="number"
                      step="0.01"
                      placeholder="1.50"
                      value={formData.gmd_projetado}
                      onChange={(e) => setFormData({ ...formData, gmd_projetado: e.target.value })}
                      required
                    />
                  </div>

                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label">
                      <Calendar size={14} /> Data de Início
                    </label>
                    <input
                      className="tauze-input"
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                      required
                    />
                  </div>

                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label">
                      <Layers size={14} /> Lote Vinculado
                    </label>
                    <SearchableSelect
                      value={formData.lote_id}
                      onChange={(val: any) => setFormData({ ...formData, lote_id: val })}
                      options={[
                        { value: ``, label: `Selecionar Lote...` },
                        ...(lots || []).map((lot) => ({
                          value: String(lot.id),
                          label: String(lot.nome) + (!activeFarm && lot.fazendas?.nome ? ` (${lot.fazendas.nome})` : ''),
                          fazenda_id: lot.fazenda_id, // guardando referencia extra
                        })),
                      ]}
                    />
                  </div>

                  {!activeFarm && !formData.lote_id && (
                    <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                      <label className="tauze-label" style={{ color: '#ef4444' }}>
                        <AlertTriangle size={14} /> Atenção
                      </label>
                      <p style={{ fontSize: '13px', color: '#ef4444', marginTop: 0 }}>
                        No modo Global, você deve selecionar um lote para que o sistema saiba em qual fazenda registrar este ciclo.
                      </p>
                    </div>
                  )}

                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label">
                      <FileText size={14} /> Observações do Check-in
                    </label>
                      <textarea
                      className="tauze-input tauze-textarea"
                      placeholder="Notas sobre o estado dos animais na entrada..."
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  {/* Oráculo de Planejamento */}
                  {predicao.pesoFinal > 0 && (
                    <div
                      style={{
                        gridColumn: 'span 2',
                        marginTop: '12px',
                        padding: '16px',
                        background: 'hsl(var(--brand) / 0.05)',
                        border: '1.5px dashed hsl(var(--brand) / 0.3)',
                        borderRadius: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: 'hsl(var(--brand))',
                          fontWeight: 800,
                          fontSize: '13px',
                          marginBottom: '8px',
                          textTransform: 'uppercase'
                        }}
                      >
                        <Target size={18} /> Projeção do Lote
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          fontSize: '13px',
                          color: 'hsl(var(--text-main))',
                          lineHeight: '1.5',
                        }}
                      >
                        <div>
                           Peso de Saída (Média): <strong>{predicao.pesoFinal.toFixed(1)} kg ({predicao.arrobas.toFixed(1)} @)</strong><br />
                           Previsão de Saída: <strong>{predicao.dataSaidaStr}</strong>
                        </div>
                        <div>
                           Total Ganho Lote: <strong>+{predicao.arrobasGanhosLote.toFixed(1)} @</strong><br />
                           Receita Bruta Est.: <strong style={{ color: '#10b981' }}>R$ {predicao.receitaBruta.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {predicao.alertas.length > 0 && (
                     <div
                      style={{
                        gridColumn: 'span 2',
                        marginTop: '12px',
                        padding: '16px',
                        background: 'hsl(38 92% 50% / 0.1)',
                        border: '1.5px dashed hsl(38 92% 50% / 0.4)',
                        borderRadius: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: 'hsl(38 92% 40%)',
                          fontWeight: 800,
                          fontSize: '13px',
                          marginBottom: '4px',
                        }}
                      >
                        <AlertTriangle size={18} /> ALERTAS DE VIABILIDADE
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                         {predicao.alertas.map((a, i) => (
                            <div key={i}>• {a}</div>
                         ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </SidePanel>
  );
};
