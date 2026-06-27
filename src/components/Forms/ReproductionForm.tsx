import React, { useState, useEffect, useMemo } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';
import { motion } from 'framer-motion';

import {
  Heart,
  Baby,
  Thermometer,
  Activity,
  Calendar,
  Layers,
  Beef,
  FileText,
  Hash,
  AlertTriangle,
  CalendarDays,
  Target,
  ChevronDown,
  CheckCircle2,
  Syringe,
  ChevronRight,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { AsyncSearchableSelect, type Option } from './AsyncSearchableSelect';
import { ConsumptionCart } from './ConsumptionCart';
import { toast } from 'react-hot-toast';
import { reproductionEventSchema } from '../../schemas/reproduction';
import { DateInput } from '../../components/Form/DateInput';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useFarmFilter } from '../../hooks/useFarmFilter';

interface ReproductionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  actionId?: number;
}

export const ReproductionForm: React.FC<ReproductionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading: propsLoading,
  actionId,
}) => {
  const { activeFarm, activeTenantId } = useTenant();
  const { applyFarmFilter } = useFarmFilter();
  const [animais, setAnimais] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAnimais = async (inputValue: string): Promise<Option[]> => {
    try {
      let query = supabase
        .from('animais')
        .select('id, brinco, raca, sexo, categoria')
        .neq('status', 'vendido')
        .neq('status', 'morto');
        
      query = applyFarmFilter(query);
      
      if (inputValue) {
        query = query.ilike('brinco', `%${inputValue}%`);
      }
      
      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      if (data) {
        const females = data.filter((a) => {
          if (!a.sexo) return false;
          const s = a.sexo.toLowerCase();
          return (
            s.includes('femea') ||
            s.includes('fêmea') ||
            s === 'f' ||
            s === 'misto' ||
            a.categoria?.toLowerCase() === 'vaca' ||
            a.categoria?.toLowerCase() === 'novilha'
          );
        });
        return females.map((a) => ({
          value: a.id,
          label: `${a.brinco} - ${a.raca || 'Sem Raça Especificada'}`,
        }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching animals:', err);
      return [];
    }
  };

  const loadProtocolos = async (inputValue: string): Promise<Option[]> => {
    try {
      let query = supabase
        .from('protocolos_reprodutivos')
        .select('id, nome, tipo')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active');
        
      if (inputValue) {
        query = query.ilike('nome', `%${inputValue}%`);
      }
      
      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      return (data || []).map(p => ({
        value: p.nome, // using name for compatibility with existing schema/DB or id if we change DB
        label: p.nome,
      }));
    } catch (err) {
      console.error('Error fetching protocols:', err);
      return [];
    }
  };

  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `reproduction_form_${activeTenantId}`,
    initialState: {
      animal_id: '',
      tipo_evento: 'IATF',
      data_evento: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0],
      resultado: '',
      resultado_diagnostico: 'Prenha',
      dias_gestacao: '',
      sexo_cria: 'Macho',
      id_cria: '',
      touro: '',
      ecc: '3',
      observacoes: '',
      status: 'pending',
      tecnico: '',
      partida_semen: '',
      metodo_diagnostico: 'Palpação Retal',
      numero_fetos: 'Simples',
      peso_nascimento: '',
      retencao_placenta: false,
      dificuldade_parto: 1,
      teat_sealant: false,
      periodo_secagem: 60,
    },
    isOpen,
    isEditMode: !!initialData,
  });

  const [produtosAplicados, setProdutosAplicados] = useState<any[]>([]);

  React.useEffect(() => {
    if (!actionId) {
      return;
    } // Ignore on initial mount / refresh

    if (initialData) {
      setFormData({
        animal_id: initialData.animal_id || '',
        tipo_evento: initialData.tipo_evento || 'IATF',
        data_evento:
          initialData.data_evento ||
          new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        resultado: initialData.resultado || '',
        resultado_diagnostico: initialData.resultado_diagnostico || 'Prenha',
        dias_gestacao: initialData.dias_gestacao || '',
        sexo_cria: initialData.sexo_cria || 'Macho',
        id_cria: initialData.id_cria || '',
        touro: initialData.touro || '',
        ecc: initialData.ecc?.toString() || '3',
        observacoes: initialData.observacoes || '',
        status: initialData.status || 'pending',
        tecnico: initialData.tecnico || '',
        partida_semen: initialData.partida_semen || '',
        metodo_diagnostico: initialData.metodo_diagnostico || 'Palpação Retal',
        numero_fetos: initialData.numero_fetos || 'Simples',
        peso_nascimento: initialData.peso_nascimento || '',
        retencao_placenta: initialData.retencao_placenta || false,
        dificuldade_parto: initialData.dificuldade_parto || 1,
        teat_sealant: initialData.teat_sealant || false,
        periodo_secagem: initialData.periodo_secagem || 60,
      });
      setProdutosAplicados(initialData.produtos || []);
    } else {
      setProdutosAplicados([]);
    }
  }, [initialData, isOpen, actionId]);

  const [activeEtapa, setActiveEtapa] = useState('dados');

  const ETAPAS_CONFIG = [
    { id: 'dados', label: '1. Dados do Evento', icon: Calendar, color: '#3b82f6' },
    { id: 'resultados', label: '2. Resultados', icon: Activity, color: '#10b981' },
    { id: 'produtos', label: '3. Fármacos', icon: Syringe, color: '#f59e0b' },
  ];

  const isDadosDone = formData.animal_id.trim().length > 0;
  const isResultadosDone =
    formData.resultado !== '' ||
    formData.resultado_diagnostico !== '' ||
    formData.touro !== '' ||
    formData.ecc !== '3';
  const isProdutosDone = produtosAplicados.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar com Zod
    const result = reproductionEventSchema.safeParse(formData);
    
    if (!result.success) {
      // Exibir o primeiro erro encontrado
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ ...formData, produtos: produtosAplicados });
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  // --- REPRODUCTION ENGINE ---
  const reproductionStats = useMemo(() => {
    // Evita timezone shift criando a data com ano, mes, dia explicitamente
    const [year, month, day] = formData.data_evento.split('-').map(Number);
    const dataEvento = new Date(year, month - 1, day);
    
    let prevDataStr = '';
    let prevLabel = '';
    let warningMsg = '';

    if (formData.tipo_evento === 'IATF' || formData.tipo_evento === 'Monta') {
      const prevToque = new Date(year, month - 1, day);
      prevToque.setDate(prevToque.getDate() + 30);
      prevDataStr = prevToque.toLocaleDateString('pt-BR');
      prevLabel = 'Previsão de Toque';
    } else if (formData.tipo_evento === 'Palpação' && formData.resultado_diagnostico === 'Prenha') {
      const diasG = parseInt(formData.dias_gestacao) || 0;
      if (diasG > 0) {
        const prevParto = new Date(); // Parto é baseado em hoje - dias_gestacao ou no manejo
        const diasFaltantes = 285 - diasG;
        prevParto.setDate(prevParto.getDate() + diasFaltantes);
        prevDataStr = prevParto.toLocaleDateString('pt-BR');
        prevLabel = 'Previsão de Parto';
      }
    }

    const eccNum = parseFloat(formData.ecc);
    if (
      eccNum > 0 &&
      eccNum < 2.5 &&
      (formData.tipo_evento === 'IATF' || formData.tipo_evento === 'Monta')
    ) {
      warningMsg = 'Atenção: Matriz com ECC muito baixo. Alto risco de falha na concepção.';
    } else if (eccNum > 0 && eccNum > 4.5 && formData.tipo_evento === 'Parto') {
      warningMsg =
        'Matriz excessivamente gorda. Fique alerta para possível distocia (dificuldade de parto).';
    }

    return { prevDataStr, prevLabel, warningMsg, eccNum };
  }, [
    formData.data_evento,
    formData.tipo_evento,
    formData.resultado_diagnostico,
    formData.dias_gestacao,
    formData.ecc,
  ]);

  return (
    <SidePanel
      size="xlarge"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Evento Reprodutivo' : 'Novo Evento Reprodutivo'}
      subtitle={
        initialData ? 'Atualize as informações do evento.' : 'Lance inseminações, toques ou partos.'
      }
      icon={Heart}
      loading={propsLoading || loading}
      submitLabel={initialData ? 'Atualizar Evento' : 'Salvar Evento'}
    >
      {/* Dashboard Top */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Status Box */}
        <div
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '16px',
            background: 'hsl(var(--brand) / 0.05)',
            border: '1px solid hsl(var(--brand) / 0.2)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: 'hsl(var(--brand))',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Status Atual
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
              {formData.status === 'completed' && 'Realizado'}
              {formData.status === 'pending' && 'Agendado'}
              {formData.status === 'cancelled' && 'Cancelado'}
              {formData.status === 'draft' && 'Em Andamento'}
            </span>
            <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
              Manejo dia {new Date(formData.data_evento).toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div
            style={{
              background: 'white',
              padding: '12px',
              borderRadius: '50%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Activity size={24} style={{ color: 'hsl(var(--brand))' }} />
          </div>
        </div>

        {/* Prediction Box */}
        <div
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px',
            background: 'hsl(var(--bg-main))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Previsões do Manejo
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {reproductionStats.prevDataStr ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(217 91% 50%)',
                }}
              >
                <CalendarDays size={14} /> {reproductionStats.prevLabel}:{' '}
                {reproductionStats.prevDataStr}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Nenhuma previsão estipulada para este tipo de evento.
              </div>
            )}
          </div>
        </div>
      </div>

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
            if (et.id === 'resultados') {
              isCompleted = isResultadosDone;
            }
            if (et.id === 'produtos') {
              isCompleted = isProdutosDone;
            }

            const isActive = activeEtapa === et.id;
            const Icon = et.icon;

            return (
              <button
                key={et.id}
                type="button"
                onClick={() => setActiveEtapa(et.id)}
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
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1 }}>{et.label}</span>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            );
          })}
        </div>

        {/* Right Content Area */}
        <div
          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
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
                {activeEtapa === 'dados' && 'Informações básicas do manejo reprodutivo.'}
                {activeEtapa === 'resultados' && 'Preencha os resultados deste manejo.'}
                {activeEtapa === 'produtos' &&
                  'Informe os medicamentos ou hormônios aplicados neste manejo.'}
              </p>
            </div>

            {activeEtapa === 'dados' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="tauze-input-grid grid-col-3">
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Activity size={14} /> Tipo de Evento
                    </label>
                    <SearchableSelect
                      value={formData.tipo_evento}
                      onChange={(val: any) => setFormData({ ...formData, tipo_evento: val })}
                      options={[
                        { value: `IATF`, label: `IATF / Inseminação` },
                        { value: `Palpação`, label: `Toque / Palpação` },
                        { value: `Parto`, label: `Parto` },
                        { value: `Monta`, label: `Monta Natural` },
                        { value: `Secagem`, label: `Secagem` },
                      ]}
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Calendar size={14} /> Data do Evento
                    </label>
                    <input
                      className="tauze-input"
                      type="date"
                      value={formData.data_evento}
                      onChange={(e) => setFormData({ ...formData, data_evento: e.target.value })}
                      required
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Activity size={14} /> Status
                    </label>
                    <SearchableSelect
                      value={formData.status}
                      onChange={(val: any) => setFormData({ ...formData, status: val })}
                      options={[
                        { value: `completed`, label: `Concluído` },
                        { value: `pending`, label: `Agendado` },
                        { value: `cancelled`, label: `Cancelado` },
                        { value: `draft`, label: `Em Andamento` },
                      ]}
                    />
                  </div>
                </div>

                <div className="tauze-input-grid grid-col-2">
                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label">
                      <Activity size={14} /> Técnico / Inseminador Responsável
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Nome do profissional..."
                      value={formData.tecnico}
                      onChange={(e) => setFormData({ ...formData, tecnico: e.target.value })}
                    />
                  </div>
                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label">
                      <Beef size={14} /> Animal / Matriz
                    </label>
                    <AsyncSearchableSelect
                      value={formData.animal_id}
                      onChange={(val: any) => setFormData({ ...formData, animal_id: val })}
                      loadOptions={loadAnimais}
                      defaultOptions={true}
                      placeholder="Busque pelo brinco ou ID..."
                    />
                  </div>
                  {formData.tipo_evento !== 'Secagem' && (
                    <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                      <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <Activity size={14} /> ECC (Escore de Condição Corporal)
                        </span>
                        <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                          1 (Magra) a 5 (Obesa)
                        </span>
                      </label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        {[
                          { val: 1, label: 'Caquética', color: '#ef4444' },
                          { val: 2, label: 'Magra', color: '#f97316' },
                          { val: 3, label: 'Ideal', color: '#22c55e' },
                          { val: 4, label: 'Gorda', color: '#f97316' },
                          { val: 5, label: 'Obesa', color: '#ef4444' },
                        ].map((score) => {
                          const isSelected = formData.ecc === score.val.toString();
                          return (
                            <button
                              key={score.val}
                              type="button"
                              onClick={() => setFormData({ ...formData, ecc: score.val.toString() })}
                              style={{
                                flex: 1,
                                padding: '8px 4px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: isSelected ? score.color : 'hsl(var(--bg-main))',
                                color: isSelected ? 'white' : 'hsl(var(--text-main))',
                                border: `1.5px solid ${isSelected ? score.color : 'hsl(var(--border))'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              <span style={{ fontWeight: 800, fontSize: '16px' }}>{score.val}</span>
                              <span style={{ fontSize: '10px', opacity: isSelected ? 1 : 0.6, fontWeight: isSelected ? 700 : 500 }}>
                                {score.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeEtapa === 'resultados' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {reproductionStats.warningMsg && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 14px',
                      background: 'hsl(38 92% 50% / 0.1)',
                      border: '1px solid hsl(38 92% 50% / 0.3)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: 'hsl(38 92% 40%)',
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>
                      {reproductionStats.warningMsg}
                    </span>
                  </div>
                )}

                <div className="tauze-input-grid grid-col-2">
                  {/* ----- FORMULÁRIO MUTANTE: IATF / MONTA ----- */}
                  {(formData.tipo_evento === 'IATF' || formData.tipo_evento === 'Monta') && (
                    <>
                      <div className="tauze-field-group">
                        <label className="tauze-label">
                          <Activity size={14} /> Protocolo Hormonal
                        </label>
                        <AsyncSearchableSelect
                          value={formData.resultado}
                          onChange={(val: any) => setFormData({ ...formData, resultado: val })}
                          loadOptions={loadProtocolos}
                          defaultOptions={true}
                          placeholder="Busque o protocolo..."
                        />
                      </div>
                      <div className="tauze-field-group">
                        <label className="tauze-label">
                          <Hash size={14} /> Nome do Touro (Reprodutor)
                        </label>
                        <input
                          className="tauze-input"
                          type="text"
                          placeholder="Nome ou código do touro..."
                          value={formData.touro}
                          onChange={(e) => setFormData({ ...formData, touro: e.target.value })}
                        />
                      </div>
                      <div className="tauze-field-group">
                        <label className="tauze-label">
                          <Hash size={14} /> Partida de Sêmen (Opcional)
                        </label>
                        <input
                          className="tauze-input"
                          type="text"
                          placeholder="Código do lote/partida..."
                          value={formData.partida_semen}
                          onChange={(e) => setFormData({ ...formData, partida_semen: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {/* ----- FORMULÁRIO MUTANTE: TOQUE / PALPAÇÃO ----- */}
                  {formData.tipo_evento === 'Palpação' && (
                    <>
                      <div className="tauze-field-group">
                        <label className="tauze-label">
                          <Target size={14} /> Diagnóstico
                        </label>
                        <SearchableSelect
                          value={formData.resultado_diagnostico}
                          onChange={(val: any) =>
                            setFormData({ ...formData, resultado_diagnostico: val })
                          }
                          options={[
                            { value: `Prenha`, label: `Prenha (Positivo)` },
                            { value: `Vazia`, label: `Vazia (Negativo)` },
                            { value: `Duvidosa`, label: `Duvidosa (Re-Toque)` },
                          ]}
                        />
                      </div>
                      <div className="tauze-field-group">
                        <label className="tauze-label">
                          <Activity size={14} /> Método de Diagnóstico
                        </label>
                        <SearchableSelect
                          value={formData.metodo_diagnostico}
                          onChange={(val: any) => setFormData({ ...formData, metodo_diagnostico: val })}
                          options={[
                            { value: `Palpação Retal`, label: `Palpação Retal` },
                            { value: `Ultrassonografia`, label: `Ultrassonografia` },
                            { value: `Exame Visual`, label: `Exame Visual` },
                          ]}
                        />
                      </div>
                      {formData.resultado_diagnostico === 'Prenha' && (
                        <>
                          <div className="tauze-field-group">
                          <label className="tauze-label">
                            <CalendarDays size={14} /> Dias de Gestação
                          </label>
                          <input
                            className="tauze-input"
                            type="number"
                            placeholder="Ex: 45"
                            value={formData.dias_gestacao}
                            onChange={(e) =>
                              setFormData({ ...formData, dias_gestacao: e.target.value })
                            }
                          />
                        </div>
                        <div className="tauze-field-group">
                          <label className="tauze-label">
                            <Baby size={14} /> Número de Fetos
                          </label>
                          <SearchableSelect
                            value={formData.numero_fetos}
                            onChange={(val: any) => setFormData({ ...formData, numero_fetos: val })}
                            options={[
                              { value: `Simples`, label: `Único (Simples)` },
                              { value: `Gemelar`, label: `Gemelar` },
                              { value: `Múltiplo`, label: `Múltiplo` },
                            ]}
                          />
                        </div>
                        </>
                      )}
                    </>
                  )}

                  {/* ----- FORMULÁRIO MUTANTE: PARTO ----- */}
                  {formData.tipo_evento === 'Parto' && (
                    <>
                      <div className="tauze-field-group">
                        <label className="tauze-label">
                          <Activity size={14} /> Condição do Parto
                        </label>
                        <SearchableSelect
                          value={formData.resultado}
                          onChange={(val: any) => setFormData({ ...formData, resultado: val })}
                          options={[
                            { value: `Normal`, label: `Normal (Eutócico)` },
                            { value: `Distocia`, label: `Complicado (Distocia)` },
                            { value: `Aborto`, label: `Aborto / Natimorto` },
                          ]}
                        />
                      </div>
                      {formData.resultado !== 'Aborto' && (
                        <div className="tauze-field-group">
                          <label className="tauze-label">
                            <Activity size={14} /> Escore de Dificuldade do Parto
                          </label>
                          <SearchableSelect
                            value={formData.dificuldade_parto.toString()}
                            onChange={(val: any) => setFormData({ ...formData, dificuldade_parto: parseInt(val) })}
                            options={[
                              { value: `1`, label: `1 - Fácil (Sem assistência)` },
                              { value: `2`, label: `2 - Moderado (Assistência leve)` },
                              { value: `3`, label: `3 - Difícil (Força mecânica necessária)` },
                              { value: `4`, label: `4 - Cirúrgico / Cesariana` },
                            ]}
                          />
                        </div>
                      )}
                      {formData.resultado !== 'Aborto' && (
                        <>
                          <div className="tauze-field-group">
                            <label className="tauze-label">
                              <Baby size={14} /> Sexo da Cria
                            </label>
                            <SearchableSelect
                              value={formData.sexo_cria}
                              onChange={(val: any) => setFormData({ ...formData, sexo_cria: val })}
                              options={[
                                { value: `Macho`, label: `Macho` },
                                { value: `Fêmea`, label: `Fêmea` },
                              ]}
                            />
                          </div>
                          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                            <label className="tauze-label">
                              <Hash size={14} /> ID / Brinco da Cria (Opcional)
                            </label>
                            <input
                              className="tauze-input"
                              type="text"
                              placeholder="Identificação do novo bezerro..."
                              value={formData.id_cria}
                              onChange={(e) =>
                                setFormData({ ...formData, id_cria: e.target.value })
                              }
                            />
                          </div>
                          <div className="tauze-field-group">
                            <label className="tauze-label">
                              <Target size={14} /> Peso ao Nascer (kg)
                            </label>
                            <input
                              className="tauze-input"
                              type="number"
                              step="0.1"
                              placeholder="Ex: 35.5"
                              value={formData.peso_nascimento}
                              onChange={(e) => setFormData({ ...formData, peso_nascimento: e.target.value })}
                            />
                          </div>
                          <div className="tauze-field-group" style={{ display: 'flex', alignItems: 'center' }}>
                            <label className="tauze-checkbox-container" style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                              <input
                                type="checkbox"
                                checked={formData.retencao_placenta}
                                onChange={(e) => setFormData({ ...formData, retencao_placenta: e.target.checked })}
                                style={{ accentColor: 'hsl(var(--brand))', width: '16px', height: '16px' }}
                              />
                              Houve Retenção de Placenta?
                            </label>
                          </div>
                        </>
                      )}
                    </>
                  )}

                      {/* ----- FORMULÁRIO MUTANTE: SECAGEM ----- */}
                      {formData.tipo_evento === 'Secagem' && (
                        <>
                          <div className="tauze-field-group">
                            <label className="tauze-label">
                              <CalendarDays size={14} /> Período Esperado de Secagem (dias)
                            </label>
                            <input
                              className="tauze-input"
                              type="number"
                              placeholder="Ex: 60"
                              value={formData.periodo_secagem}
                              onChange={(e) => setFormData({ ...formData, periodo_secagem: e.target.value })}
                            />
                          </div>
                          <div className="tauze-field-group" style={{ display: 'flex', alignItems: 'center' }}>
                            <label className="tauze-checkbox-container" style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                              <input
                                type="checkbox"
                                checked={formData.teat_sealant}
                                onChange={(e) => setFormData({ ...formData, teat_sealant: e.target.checked })}
                                style={{ accentColor: 'hsl(var(--brand))', width: '16px', height: '16px' }}
                              />
                              Utilizou Selante de Teto (Teat Sealant)?
                            </label>
                          </div>
                        </>
                      )}
                      {/* ----- CAMPOS COMPARTILHADOS ----- */}

                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label">
                      <FileText size={14} /> Observações
                    </label>
                    <textarea
                      className="tauze-input tauze-textarea"
                      placeholder="Notas adicionais sobre o procedimento..."
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeEtapa === 'produtos' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ConsumptionCart
                  items={produtosAplicados}
                  onChange={setProdutosAplicados}
                  title="Lista de Produtos"
                  subtitle="Itens serão deduzidos do estoque selecionado."
                  filterModule="pecuaria_sanidade"
                  hideDeposit={false}
                  showHealthFields={true}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </SidePanel>
  );
};
