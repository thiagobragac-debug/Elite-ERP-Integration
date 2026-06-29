import { showValidationAlert } from '../../utils/validationAlert';
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormDraft } from '../../hooks/useFormDraft';
import './WeightForm.css';

import {
  Scale,
  Calendar,
  Search,
  FileText,
  Hash,
  Activity,
  AlertTriangle,
  Award,
  X,
  CheckCircle2,
  TrendingUp,
  SkipForward,
  Clock,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import toast from 'react-hot-toast';
import { DateInput } from '../../components/Form/DateInput';

interface WeightFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  actionId?: number;
}

// ECC Labels
const eccLabels: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Emaciado', color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.1)' },
  2: { label: 'Magro', color: 'hsl(25 95% 55%)', bg: 'hsl(25 95% 55% / 0.1)' },
  3: { label: 'Moderado', color: 'hsl(38 92% 50%)', bg: 'hsl(38 92% 50% / 0.1)' },
  4: { label: 'Bom Estado', color: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.1)' },
  5: { label: 'Gordo', color: 'hsl(210 100% 50%)', bg: 'hsl(210 100% 50% / 0.1)' },
};

// ── Lookup tables por raça ──────────────────────────────────────────────────
// Target de abate (peso vivo em kg): diferente por raça e sexo
const SLAUGHTER_TARGET_BY_BREED: Record<string, { macho: number; femea: number }> = {
  nelore:     { macho: 480, femea: 420 },
  brangus:    { macho: 510, femea: 450 },
  angus:      { macho: 520, femea: 460 },
  brahman:    { macho: 500, femea: 430 },
  simental:   { macho: 540, femea: 470 },
  limousin:   { macho: 530, femea: 460 },
  hereford:   { macho: 510, femea: 450 },
  gir:        { macho: 470, femea: 400 },
  guzera:     { macho: 480, femea: 410 },
  girolando:  { macho: 450, femea: 380 },
  default:    { macho: 500, femea: 440 },
};

// Rendimento de carcaça estimado por raça (%)
const CARCASS_YIELD_BY_BREED: Record<string, number> = {
  nelore: 50,
  brangus: 54,
  angus: 58,
  brahman: 50,
  simental: 56,
  limousin: 57,
  hereford: 55,
  gir: 49,
  guzera: 50,
  girolando: 48,
  default: 52,
};

/** Retorna o target de abate em kg com base na raça e sexo do animal. */
const getSlaughterTarget = (raca?: string, sexo?: string): number => {
  const key = (raca || '').toLowerCase().replace(/[^a-z]/g, '');
  const lookup = SLAUGHTER_TARGET_BY_BREED[key] ?? SLAUGHTER_TARGET_BY_BREED['default'];
  const isFemea = sexo === 'FEMEA' || sexo === 'F' || sexo === 'f';
  return isFemea ? lookup.femea : lookup.macho;
};

/** Retorna o rendimento de carcaça estimado (%) com base na raça. */
const getCarcassYield = (raca?: string): number => {
  const key = (raca || '').toLowerCase().replace(/[^a-z]/g, '');
  return CARCASS_YIELD_BY_BREED[key] ?? CARCASS_YIELD_BY_BREED['default'];
};

// ── Limites de peso por categoria ──────────────────────────────────────────
const WEIGHT_LIMITS: Record<string, { min: number; max: number }> = {
  BEZERRO:    { min: 20,  max: 300 },
  BEZERRA:    { min: 20,  max: 280 },
  GARROTE:    { min: 80,  max: 480 },
  NOVILHA:    { min: 80,  max: 420 },
  NOVILHO:    { min: 150, max: 550 },
  TOURO:      { min: 200, max: 900 },
  VACA:       { min: 200, max: 750 },
  BOI:        { min: 200, max: 900 },
  default:    { min: 20,  max: 900 },
};

// #4 — simple sparkline SVG
const SparklineChart = ({ weightHistory }: { weightHistory: any[] }) => {
  if (weightHistory.length < 2) {
    return null;
  }
  const values = weightHistory.map((w) => Number(w.peso));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 120,
    H = 32,
    pad = 4;
  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (W - pad * 2);
      const y = H - pad - ((v - min) / range) * (H - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const lastVal = values[values.length - 1];
  const prevVal = values[values.length - 2];
  const trend = lastVal >= prevVal ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={trend}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {values.map((v, i) => {
          const x = pad + (i / (values.length - 1)) * (W - pad * 2);
          const y = H - pad - ((v - min) / range) * (H - pad * 2);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i === values.length - 1 ? 4 : 2.5}
              fill={i === values.length - 1 ? trend : 'hsl(var(--bg-card))'}
              stroke={trend}
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
      <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
        Últimas {values.length} pesagens
      </span>
    </div>
  );
};

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const WeightForm: React.FC<WeightFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  actionId,
}) => {
  const { activeFarm, activeTenantId, isGlobalMode } = useTenant();
  const [animals, setAnimals] = useState<any[]>([]);
  const [lastWeighing, setLastWeighing] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [animalSelected, setAnimalSelected] = useState<any>(null);
  // Smart Session History: animais pesados nesta sessão de trabalho (hoje)
  const [todayWeighedAnimals, setTodayWeighedAnimals] = useState<any[]>([]);
  // Confirmação obrigatória quando variação de peso é extrema (>30%)
  const [weightConfirmed, setWeightConfirmed] = useState(false);
  // Rect do input de busca para posicionar o dropdown via portal
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `weight_form_${activeTenantId}`,
    initialState: {
      animal_id: '',
      data_pesagem: getTodayStr(),
      peso: '',
      ecc: null,
      observacao: '',
    },
    isOpen,
    isEditMode: !!initialData,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animalsLoading, setAnimalsLoading] = useState(false);
  const pesoInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click — ignora cliques dentro do portal do dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideSearch = searchRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideSearch && !insideDropdown) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = (keepDate = false) => {
    setFormData({
      animal_id: '',
      data_pesagem: keepDate ? formData.data_pesagem : getTodayStr(),
      peso: '',
      ecc: null,
      observacao: '',
    });
    setSearchQuery('');
    setLastWeighing(null);
    setWeightHistory([]);
    setAnimalSelected(null);
    setWeightConfirmed(false);
  };

  const fetchAnimals = async () => {
    try {
      if (!activeTenantId) {
        toast.error('Sessão sem tenant ativo. Faça login novamente.');
        return;
      }
      setAnimalsLoading(true);
      let query = supabase
        .from('animais')
        .select('id, brinco, peso_inicial, created_at, raca, categoria, sexo, data_nascimento')
        .eq('tenant_id', activeTenantId)
        .neq('status', 'vendido')
        .neq('status', 'morto')
        .neq('status', 'ARQUIVADO')
        .order('brinco', { ascending: true });
      if (!isGlobalMode && activeFarm?.id) {
        query = query.or(`fazenda_id.eq.${activeFarm.id},fazenda_id.is.null`);
      }
      const { data, error } = await query;
      if (error) {
        toast.error(`Erro ao carregar animais: ${error.message}`);
        return;
      }
      setAnimals(data ?? []);
      if (data && formData.animal_id) {
        const animal = data.find((a) => a.id === formData.animal_id);
        if (animal) {
          setSearchQuery(animal.brinco);
          setAnimalSelected(animal);
        }
      }
    } catch (err: any) {
      toast.error(`Erro inesperado: ${err?.message ?? String(err)}`);
    } finally {
      setAnimalsLoading(false);
    }
  };

  const fetchTodayCount = async () => {

    try {
      if (!activeTenantId) return;
      const today = getTodayStr();

      // Contador total
      const { count } = await supabase
        .from('pesagens')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', activeTenantId)
        .eq('data_pesagem', today);
      setTodayCount(count || 0);

      // Smart Session History: últimos 8 animais pesados hoje com dados do animal
      const { data: sessionData } = await supabase
        .from('pesagens')
        .select('animal_id, peso, animais(brinco, raca, categoria, sexo)')
        .eq('tenant_id', activeTenantId)
        .eq('data_pesagem', today)
        .order('created_at', { ascending: false })
        .limit(8);

      if (sessionData) {
        // Deduplica por animal_id, mantendo o mais recente
        const seen = new Set<string>();
        const unique = sessionData.filter((p: any) => {
          if (seen.has(p.animal_id)) return false;
          seen.add(p.animal_id);
          return true;
        });
        setTodayWeighedAnimals(unique);
      }
    } catch {
      /* noop */
    }
  };

  const fetchLastWeight = async (animalId: string) => {
    try {
      const { data } = await supabase
        .from('pesagens')
        .select('*').eq('tenant_id', activeTenantId)
        .eq('animal_id', animalId)
        .order('data_pesagem', { ascending: false })
        .limit(5);

      if (data && data[0]) {
        setLastWeighing(data[0]);
        setWeightHistory([...data].reverse());
      } else {
        const animal = animals.find((a) => a.id === animalId);
        if (animal) {
          setLastWeighing({
            peso: animal.peso_inicial,
            data_pesagem: animal.created_at || null,
            isInitial: true,
          });
          setWeightHistory([]);
        }
      }
    } catch (err) {
      console.error('Error fetching last weight:', err);
    }
  };

  useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchAnimals();
      fetchTodayCount();
    }
  }, [isOpen, activeFarm, activeTenantId]);

  // reset or populate form
  useEffect(() => {
    if (!isOpen || !initialData) return;
    setFormData({
      animal_id: initialData.animal_id || '',
      data_pesagem: initialData.data_pesagem || getTodayStr(),
      peso: initialData.peso?.toString() || '',
      ecc: initialData.ecc ?? null,
      observacao: initialData.observacao || '',
    });
    if (initialData.animal_id && animals.length > 0) {
      const animal = animals.find((a) => a.id === initialData.animal_id);
      if (animal) {
        setSearchQuery(animal.brinco);
        setAnimalSelected(animal);
      }
    }
  }, [initialData, isOpen, animals, actionId]);

  // #8 — Ctrl+Enter shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const form = document.getElementById('weight-form-el') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleAnimalChange = (animal: any) => {
    setFormData({ ...formData, animal_id: animal.id });
    setAnimalSelected(animal);
    fetchLastWeight(animal.id);
    // #8 — focus peso after picking animal
    setTimeout(() => pesoInputRef.current?.focus(), 100);
  };

  const clearAnimal = () => {
    setFormData({ ...formData, animal_id: '' });
    setAnimalSelected(null);
    setSearchQuery('');
    setLastWeighing(null);
    setWeightHistory([]);
  };

  const minDate = useMemo(() => {
    let min = '';
    if (animalSelected?.data_nascimento) {
      min = animalSelected.data_nascimento.split('T')[0];
    }
    if (lastWeighing?.data_pesagem && !lastWeighing.isInitial) {
      const lwDate = lastWeighing.data_pesagem.split('T')[0];
      if (lwDate > min) {
        min = lwDate;
      }
    }
    return min;
  }, [animalSelected, lastWeighing]);

  const handleSubmit = async (e: React.FormEvent, saveAndNext = false) => {
    e.preventDefault();

    // Validação 1: animal obrigatório
    if (!formData.animal_id) {
      showValidationAlert('⚠️ Por favor, selecione um animal válido usando o campo de busca.');
      return;
    }

    // Validação 2: data mínima
    if (minDate && formData.data_pesagem < minDate) {
      toast.error(
        '⚠️ A data da pesagem não pode ser anterior à data de nascimento ou à última pesagem registrada.'
      );
      return;
    }

    // Validação 3: limites de peso por categoria
    const pesoNum = Number(formData.peso);
    const categoria = (animalSelected?.categoria || 'default').toUpperCase();
    const limits = WEIGHT_LIMITS[categoria] ?? WEIGHT_LIMITS['default'];
    if (pesoNum < limits.min || pesoNum > limits.max) {
      toast.error(
        `⚠️ Peso ${pesoNum} kg fora do intervalo esperado para esta categoria (${limits.min}–${limits.max} kg). Verifique o valor.`
      );
      return;
    }

    // Validação 4: confirmação obrigatória para variação extrema
    if (isTypoWarning && !weightConfirmed) {
      showValidationAlert('⚠️ Confirme que o peso está correto antes de salvar.');
      return;
    }

    // Validação 5: pesagem duplicada no mesmo dia
    try {
      let dupQuery = supabase
        .from('pesagens')
        .select('id', { count: 'exact', head: true }).eq('tenant_id', activeTenantId)
        .eq('animal_id', formData.animal_id)
        .eq('data_pesagem', formData.data_pesagem);
      if (initialData?.id) {
        dupQuery = dupQuery.neq('id', initialData.id);
      }
      const { count: dupCount } = await dupQuery;

      if (dupCount && dupCount > 0) {
        // Oferece confirmação via toast custom com ação
        toast(
          (t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px' }}>
                Já existe uma pesagem para este animal em{' '}
                {new Date(formData.data_pesagem).toLocaleDateString('pt-BR')}.
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Deseja substituir o registro existente?
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    // Busca o id existente e re-submete como edição
                    supabase
                      .from('pesagens')
                      .select('id').eq('tenant_id', activeTenantId)
                      .eq('animal_id', formData.animal_id)
                      .eq('data_pesagem', formData.data_pesagem)
                      .limit(1)
                      .then(({ data: existingRows }) => {
                        if (existingRows && existingRows[0]) {
                          const existingId = existingRows[0].id;
                          setLoading(true);
                          onSubmit({ ...formData, _replaceId: existingId })
                            .then(() => { clearDraft(); resetForm(saveAndNext); })
                            .finally(() => setLoading(false));
                        }
                      });
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'hsl(0 84% 60%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Substituir
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ),
          {
            duration: 8000,
            style: { background: '#0f172a', color: '#f1f5f9', maxWidth: '340px' },
          }
        );
        return;
      }
    } catch {
      /* noop — não bloqueia o save por falha de verificação */
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      clearDraft();
      // Atualiza o session history após salvar
      fetchTodayCount();
      if (saveAndNext) {
        resetForm(true); // mantém a data
      } else {
        resetForm();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  /** Handler específico do botão "Salvar e Próximo" */
  const handleSaveAndNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(syntheticEvent, true);
    },
    [handleSubmit]
  );

  const filteredAnimals = animals.filter((a) =>
    a.brinco?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // derived weight metrics
  const lastWeightVal = Number(lastWeighing?.peso) || 0;
  const newWeightVal = Number(formData.peso) || 0;
  const hasWeight = !!formData.peso && !isNaN(newWeightVal) && newWeightVal > 0;
  const diff = hasWeight ? newWeightVal - lastWeightVal : 0;
  const percentChange = hasWeight && lastWeightVal > 0 ? (diff / lastWeightVal) * 100 : 0;
  const isTypoWarning = hasWeight && Math.abs(percentChange) > 30;
  const isMildWarning = hasWeight && Math.abs(percentChange) > 15 && Math.abs(percentChange) <= 30;

  // Arrobas: peso vivo / 30 (convenção de mercado brasileiro)
  const slaughterTarget = getSlaughterTarget(animalSelected?.raca, animalSelected?.sexo);
  const carcassYield = getCarcassYield(animalSelected?.raca);
  const isSlaughterTargetReached = hasWeight && newWeightVal >= slaughterTarget;
  // Arrobas de peso vivo: pesoVivo / 30
  const arrobasVivo = hasWeight ? newWeightVal / 30 : 0;
  // Arrobas de carcaça (para negócio): pesoVivo * (rendimento%) / 15
  const arrobasCarcaca = hasWeight ? (newWeightVal * (carcassYield / 100)) / 15 : 0;

  const lastDateStr = lastWeighing?.data_pesagem || lastWeighing?.created_at;
  const lastDateObj = lastDateStr ? new Date(lastDateStr) : null;
  const currDateObj = new Date(formData.data_pesagem);

  let gmd = 0;
  if (hasWeight && lastDateObj && !isNaN(lastDateObj.getTime()) && !isNaN(currDateObj.getTime())) {
    const dDays = Math.max(
      1,
      Math.ceil((currDateObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))
    );
    gmd = diff / dDays;
  }

  let daysToSlaughter = 0;
  let slaughterDateStr = '';
  if (hasWeight && !isSlaughterTargetReached && gmd > 0.1) {
    const weightNeeded = slaughterTarget - newWeightVal;
    daysToSlaughter = Math.ceil(weightNeeded / gmd);

    if (daysToSlaughter < 1000) {
      const predDate = new Date(currDateObj);
      predDate.setDate(predDate.getDate() + daysToSlaughter);
      slaughterDateStr = predDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    }
  }

  // #3 — border color based on weight validation
  const getWeightBorderColor = () => {
    if (!hasWeight) {
      return 'hsl(var(--border))';
    }
    if (isTypoWarning) {
      return 'hsl(0 84% 60%)';
    }
    if (isMildWarning) {
      return 'hsl(38 92% 50%)';
    }
    return 'hsl(142 71% 45%)';
  };

  const getWeightGlow = () => {
    if (!hasWeight) {
      return 'none';
    }
    if (isTypoWarning) {
      return '0 0 0 3px hsl(0 84% 60% / 0.15)';
    }
    if (isMildWarning) {
      return '0 0 0 3px hsl(38 92% 50% / 0.15)';
    }
    return '0 0 0 3px hsl(142 71% 45% / 0.15)';
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Pesagem' : 'Nova Pesagem'}
      size="large"
      subtitle={
        initialData
          ? `Editando pesagem de ${new Date(initialData.data_pesagem || '').toLocaleDateString('pt-BR')} — Animal #${initialData.animais?.brinco ?? ''}`
          : todayCount > 0
            ? `Registre o peso individual de um animal — ${todayCount} pesagem${todayCount !== 1 ? 's' : ''} hoje`
            : 'Registre o peso individual de um animal.'
      }
      icon={Scale}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Salvar Pesagem'}
      customFooter={
        <>
          <button type="button" className="glass-btn secondary" onClick={() => { clearDraft(); onClose(); }}>
            Cancelar
          </button>
          {/* Botão "Salvar e Próximo" — apenas em modo criação */}
          {!initialData && (
            <button
              type="button"
              className="btn-save-next"
              onClick={handleSaveAndNext}
              disabled={loading}
              title="Salva e abre próximo animal (Shift+Enter)"
            >
              <SkipForward size={16} />
              Salvar e Próximo
            </button>
          )}
          <button
            type="submit"
            className="primary-btn"
            disabled={loading || (isTypoWarning && !weightConfirmed)}
            style={{ opacity: loading || (isTypoWarning && !weightConfirmed) ? 0.6 : 1, cursor: loading || (isTypoWarning && !weightConfirmed) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Salvar Pesagem')}
          </button>
        </>
      }
    >
      <>
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">SEÇÃO 01</div>
            <h4 className="tauze-section-title">Dados da Pesagem</h4>
          </div>

          <div className="tauze-input-grid" style={{ gridTemplateColumns: '3fr 2fr 1.5fr' }}>
            {/* #1 — Chip + Search */}
            <div className="tauze-field-group" style={{ position: 'relative' }}>
              <label
                className="tauze-label"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Hash size={14} /> Selecionar Animal (Brinco)
              </label>

              {animalSelected ? (
                /* CHIP */
                <div
                  className="animal-chip animate-fade-in"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'hsl(var(--brand) / 0.08)',
                    border: '1.5px solid hsl(var(--brand) / 0.3)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    cursor: 'default',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'hsl(var(--brand))',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {animalSelected.brinco?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}
                    >
                      #{animalSelected.brinco}
                    </div>
                    {animalSelected.raca && (
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'hsl(var(--text-muted))',
                          fontWeight: 600,
                        }}
                      >
                        {animalSelected.raca}
                        {animalSelected.categoria ? ` · ${animalSelected.categoria}` : ''}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearAnimal}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'hsl(var(--text-muted))',
                      padding: '2px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    title="Remover animal"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                /* SEARCH com Smart Session History + Portal dropdown */
                <div
                  className="autocomplete-wrapper"
                  style={{ position: 'relative', width: '100%' }}
                  ref={searchRef}
                >
                  <div
                    className="search-input-container"
                    style={{ position: 'relative', width: '100%' }}
                  >
                    <input
                      className="tauze-input"
                      id="animal-search-input"
                      ref={searchInputRef}
                      type="text"
                      placeholder={
                        animalsLoading
                          ? 'Carregando animais...'
                          : animals.length > 0
                            ? `Buscar por brinco... (${animals.length} disponíveis)`
                            : activeTenantId
                              ? 'Nenhum animal ativo nesta fazenda'
                              : 'Aguardando sessão...'
                      }
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                        if (searchInputRef.current) {
                          setDropdownRect(searchInputRef.current.getBoundingClientRect());
                        }
                      }}
                      onFocus={() => {
                        setShowDropdown(true);
                        if (searchInputRef.current) {
                          setDropdownRect(searchInputRef.current.getBoundingClientRect());
                        }
                        // Re-fetch se ainda estiver vazio (contexto pode ter chegado depois)
                        if (animals.length === 0 && activeTenantId && !animalsLoading) {
                          fetchAnimals();
                        }
                      }}
                      required={!formData.animal_id}
                      style={{ paddingRight: '36px', width: '100%', boxSizing: 'border-box' }}
                      autoComplete="off"
                    />
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'hsl(var(--text-muted))',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  {/* Dropdown via portal para evitar clipping pelo SidePanel */}
                  {showDropdown && dropdownRect && createPortal(
                    <motion.div
                      ref={dropdownRef}
                      key="autocomplete-portal"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="autocomplete-dropdown"
                        style={{
                          position: 'fixed',
                          top: dropdownRect.bottom + 4,
                          left: dropdownRect.left,
                          width: dropdownRect.width,
                          maxHeight: '320px',
                          overflowY: 'auto',
                          background: 'hsl(var(--bg-card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '14px',
                          zIndex: 100000,
                          boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {/* Smart Session History: exibido quando campo está vazio */}
                        {!searchQuery && todayWeighedAnimals.length > 0 && (
                          <div className="session-history-section">
                            <div className="session-history-label">
                              <Clock size={11} />
                              Pesados hoje nesta sessão
                            </div>
                            {todayWeighedAnimals.map((p: any) => {
                              const brinco = p.animais?.brinco ?? '—';
                              const pesoReg = Number(p.peso).toFixed(1);
                              const animalFromList = animals.find((a: any) => a.id === p.animal_id);
                              return (
                                <div
                                  key={p.animal_id}
                                  className="session-history-item"
                                  onClick={() => {
                                    if (animalFromList) {
                                      setSearchQuery(brinco);
                                      handleAnimalChange(animalFromList);
                                      setShowDropdown(false);
                                    }
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                      style={{
                                        width: '28px', height: '28px', borderRadius: '8px',
                                        background: 'hsl(var(--brand) / 0.12)',
                                        color: 'hsl(var(--brand))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', fontWeight: 900,
                                      }}
                                    >
                                      #{brinco?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                                        #{brinco}
                                      </div>
                                      <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                                        {p.animais?.raca ?? ''}{p.animais?.categoria ? ` · ${p.animais.categoria}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#10b981' }}>
                                      {pesoReg} kg
                                    </div>
                                    <span className="session-history-badge">Pesado hoje</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Lista de animais disponíveis */}
                        {(() => {
                          // Quando campo está vazio: exibir todos os animais não pesados hoje
                          // Quando campo tem texto: filtrar por brinco
                          const todayIds = new Set(todayWeighedAnimals.map((p: any) => p.animal_id));
                          const listToShow = searchQuery.length > 0
                            ? filteredAnimals
                            : animals.filter((a: any) => !todayIds.has(a.id));

                          if (listToShow.length === 0 && searchQuery.length > 0) {
                            return (
                              <div
                                style={{
                                  padding: '16px',
                                  color: 'hsl(var(--text-muted))',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  textAlign: 'center',
                                }}
                              >
                                Nenhum animal ativo com este brinco
                              </div>
                            );
                          }

                          if (listToShow.length === 0 && animals.length === 0) {
                            return (
                              <div
                                style={{
                                  padding: '16px',
                                  color: 'hsl(var(--text-muted))',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  textAlign: 'center',
                                }}
                              >
                                Nenhum animal ativo encontrado nesta fazenda
                              </div>
                            );
                          }

                          return (
                            <>
                              {!searchQuery && listToShow.length > 0 && (
                                <div
                                  style={{
                                    padding: '6px 16px 4px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: 'hsl(var(--text-muted))',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderTop: todayWeighedAnimals.length > 0 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                                  }}
                                >
                                  Todos os animais
                                </div>
                              )}
                              {listToShow.map((a: any, idx: number) => (
                                <div
                                  key={a.id}
                                  onClick={() => {
                                    setSearchQuery(a.brinco);
                                    handleAnimalChange(a);
                                    setShowDropdown(false);
                                  }}
                                  style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderBottom:
                                      idx < listToShow.length - 1
                                        ? '1px solid hsl(var(--border) / 0.5)'
                                        : 'none',
                                    transition: 'background 0.15s',
                                  }}
                                  className="autocomplete-option"
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: 'hsl(var(--brand) / 0.1)',
                                        color: 'hsl(var(--brand))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 900,
                                      }}
                                    >
                                      #{a.brinco?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <div
                                        style={{
                                          fontWeight: 800,
                                          fontSize: '13px',
                                          color: 'hsl(var(--text-main))',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                        }}
                                      >
                                        #{a.brinco}
                                        {a.sexo && (
                                          <span
                                            style={{
                                              fontSize: '9px',
                                              fontWeight: 800,
                                              background:
                                                a.sexo === 'M' || a.sexo === 'MACHO' || a.sexo === 'm'
                                                  ? 'hsl(217 91% 60% / 0.12)'
                                                  : 'hsl(316 73% 69% / 0.12)',
                                              color:
                                                a.sexo === 'M' || a.sexo === 'MACHO' || a.sexo === 'm'
                                                  ? 'hsl(217 91% 60%)'
                                                  : 'hsl(316 73% 60%)',
                                              padding: '1px 5px',
                                              borderRadius: '4px',
                                            }}
                                          >
                                            {a.sexo === 'M' || a.sexo === 'MACHO' || a.sexo === 'm'
                                              ? '♂ Macho'
                                              : '♀ Fêmea'}
                                          </span>
                                        )}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: '11px',
                                          color: 'hsl(var(--text-muted))',
                                          marginTop: '2px',
                                        }}
                                      >
                                        {a.raca || 'Nelore'}
                                        {a.categoria ? ` · ${a.categoria}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  {a.peso_inicial && (
                                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#10b981' }}>
                                      {Number(a.peso_inicial).toFixed(0)} kg
                                    </span>
                                  )}
                                </div>
                              ))}
                            </>
                          );
                        })()}



                    </motion.div>,
                    document.body
                  )}
                </div>
              )}
            </div>

            {/* #3 — Peso com validação visual e Arroba */}
            <div className="tauze-field-group">
              <label
                className="tauze-label"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Scale size={14} /> Novo Peso (kg)
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  className="tauze-input no-spin"
                  ref={pesoInputRef}
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  required
                  style={{
                    paddingRight: '64px',
                    borderColor: getWeightBorderColor(),
                    boxShadow: getWeightGlow(),
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
                {hasWeight && (
                  <div
                    className="animate-fade-in"
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: 'hsl(var(--brand))',
                      background: 'hsl(var(--brand)/0.1)',
                      padding: '3px 6px',
                      borderRadius: '6px',
                      pointerEvents: 'none',
                    }}
                  >
                    ~ {arrobasVivo.toFixed(1)} @PV
                  </div>
                )}
              </div>
              {hasWeight && !isTypoWarning && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'hsl(142 71% 45%)',
                  }}
                >
                  <CheckCircle2 size={11} />
                  Peso válido
                </div>
              )}
            </div>

            {/* Data */}
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Calendar size={14} /> Data da Pesagem
                {/* #5 — contador today */}
                {todayCount > 0 && (
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '9px',
                      fontWeight: 800,
                      background: 'hsl(var(--brand) / 0.1)',
                      color: 'hsl(var(--brand))',
                      padding: '1px 7px',
                      borderRadius: '20px',
                      border: '1px solid hsl(var(--brand) / 0.2)',
                    }}
                  >
                    {todayCount} hoje
                  </span>
                )}
              </label>
              <DateInput
                className="tauze-input"
                type="date"
                value={formData.data_pesagem}
                onChange={(e) => setFormData({ ...formData, data_pesagem: e.target.value })}
                min={minDate}
                max={getTodayStr()}
                required
              />
            </div>
          </div>
        </section>

        {/* ── #6 — Performance Panel (animated slide-in) ── */}
        {lastWeighing && (
          <div
            className="performance-preview-card full-width animate-slide-panel"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--brand) / 0.08) 0%, hsl(var(--brand) / 0.02) 100%)',
              border: isTypoWarning
                ? '1.5px dashed hsl(0 84% 60%)'
                : isMildWarning
                  ? '1.5px dashed hsl(38 92% 50%)'
                  : '1.5px dashed hsl(var(--brand) / 0.3)',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '4px',
              gridColumn: 'span 4',
              boxShadow: 'inset 0 0 12px hsl(var(--brand) / 0.05)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid hsl(var(--border) / 0.5)',
                paddingBottom: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isTypoWarning ? 'hsl(0 84% 60%)' : 'hsl(var(--brand))',
                  fontWeight: 800,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <Activity size={16} style={{ animation: 'pulse 2s infinite' }} />
                <span>Painel de Performance Individual</span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  color: 'hsl(var(--text-muted))',
                  fontWeight: 700,
                  background: 'hsl(var(--bg-main))',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                Intervalo:{' '}
                {(() => {
                  const lastDateStr = lastWeighing.data_pesagem || lastWeighing.created_at;
                  if (!lastDateStr) {
                    return '--';
                  }
                  const lastDate = new Date(lastDateStr);
                  const currDate = new Date(formData.data_pesagem);
                  if (isNaN(lastDate.getTime()) || isNaN(currDate.getTime())) {
                    return '--';
                  }
                  const diffDays = Math.max(
                    0,
                    Math.ceil((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
                  );
                  return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
                })()}
              </span>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {/* Peso Anterior */}
              <div
                className="preview-stat"
                style={{ borderRight: '1px solid hsl(var(--border) / 0.5)', paddingRight: '12px' }}
              >
                <span
                  className="p-label"
                  style={{
                    fontSize: '11px',
                    color: 'hsl(var(--text-muted))',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Peso Anterior
                </span>
                <span
                  className="p-value"
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: 'hsl(var(--text-main))',
                    margin: '4px 0',
                    display: 'block',
                  }}
                >
                  {Number(lastWeighing.peso || 0).toFixed(2)} kg
                </span>
                <span
                  className="p-meta"
                  style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}
                >
                  {lastWeighing.isInitial
                    ? 'Peso Inicial'
                    : lastWeighing.data_pesagem
                      ? new Date(lastWeighing.data_pesagem).toLocaleDateString('pt-BR')
                      : 'Sem data'}
                </span>
                {/* #4 — sparkline */}
                <SparklineChart weightHistory={weightHistory} />
              </div>

              {/* Evolução */}
              <div
                className="preview-stat"
                style={{ borderRight: '1px solid hsl(var(--border) / 0.5)', paddingRight: '12px' }}
              >
                <span
                  className="p-label"
                  style={{
                    fontSize: '11px',
                    color: 'hsl(var(--text-muted))',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Evolução
                </span>
                {hasWeight ? (
                  (() => {
                    const isPositive = diff >= 0;
                    return (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            className="p-value"
                            style={{
                              fontSize: '24px',
                              fontWeight: 900,
                              color: isPositive ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)',
                              margin: '4px 0',
                            }}
                          >
                            {isPositive ? `+${diff.toFixed(2)}` : diff.toFixed(2)} kg
                          </span>
                          {isSlaughterTargetReached && (
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 900,
                                color: 'hsl(142 71% 45%)',
                                background: 'hsl(142 71% 45% / 0.1)',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Award size={10} /> 🏆 Abate
                            </span>
                          )}
                        </div>
                        <span
                          className="p-meta"
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: isPositive ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)',
                          }}
                        >
                          {isPositive ? 'Ganho de Peso' : 'Perda de Peso'}
                          {percentChange !== 0 && (
                            <span style={{ marginLeft: '4px', opacity: 0.8 }}>
                              ({isPositive ? '+' : ''}
                              {percentChange.toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <span
                      className="p-value"
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: 'hsl(var(--text-muted) / 0.6)',
                        margin: '6px 0',
                        display: 'block',
                      }}
                    >
                      -- kg
                    </span>
                    <span
                      className="p-meta"
                      style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}
                    >
                      Aguardando peso...
                    </span>
                  </>
                )}
              </div>

              {/* GMD */}
              <div className="preview-stat">
                <span
                  className="p-label"
                  style={{
                    fontSize: '11px',
                    color: 'hsl(var(--text-muted))',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  GMD Projetado
                </span>
                {hasWeight ? (
                  (() => {
                    if (!lastDateStr || isNaN(lastDateObj?.getTime() || NaN)) {
                      return (
                        <>
                          <span
                            className="p-value"
                            style={{
                              fontSize: '24px',
                              fontWeight: 900,
                              color: 'hsl(var(--text-main))',
                              margin: '4px 0',
                              display: 'block',
                            }}
                          >
                            --
                          </span>
                          <span
                            className="p-meta"
                            style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}
                          >
                            Sem data anterior
                          </span>
                        </>
                      );
                    }
                    if (isNaN(currDateObj.getTime())) {
                      return (
                        <span
                          className="p-meta"
                          style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}
                        >
                          Data inválida
                        </span>
                      );
                    }

                    let badgeColor = 'hsl(38 92% 50%)',
                      badgeBg = 'hsl(38 92% 50% / 0.1)',
                      rating = 'Regular';
                    if (gmd >= 0.8) {
                      badgeColor = 'hsl(142 71% 45%)';
                      badgeBg = 'hsl(142 71% 45% / 0.1)';
                      rating = 'Excelente';
                    } else if (gmd < 0) {
                      badgeColor = 'hsl(0 84% 60%)';
                      badgeBg = 'hsl(0 84% 60% / 0.1)';
                      rating = 'Perda Crítica';
                    } else if (gmd < 0.3) {
                      badgeColor = 'hsl(38 92% 50%)';
                      badgeBg = 'hsl(38 92% 50% / 0.1)';
                      rating = 'Baixo Ganho';
                    }
                    return (
                      <>
                        <span
                          className="p-value"
                          style={{
                            fontSize: '24px',
                            fontWeight: 900,
                            color: 'hsl(var(--text-main))',
                            margin: '4px 0',
                            display: 'block',
                          }}
                        >
                          {gmd.toFixed(2)}{' '}
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'hsl(var(--text-muted))',
                            }}
                          >
                            kg/dia
                          </span>
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            color: badgeColor,
                            background: badgeBg,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          {rating}
                        </span>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <span
                      className="p-value"
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: 'hsl(var(--text-muted) / 0.6)',
                        margin: '6px 0',
                        display: 'block',
                      }}
                    >
                      -- kg/dia
                    </span>
                    <span
                      className="p-meta"
                      style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}
                    >
                      Informe o peso acima
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Predição de Abate (Smart Card) */}
            {slaughterDateStr && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  background:
                    'linear-gradient(135deg, hsl(142 71% 45% / 0.1) 0%, hsl(142 71% 45% / 0.02) 100%)',
                  border: '1px solid hsl(142 71% 45% / 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'hsl(142 71% 45%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'white',
                  }}
                >
                  <Award size={18} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'hsl(142 71% 45%)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '4px',
                    }}
                  >
                    Predição de Abate ({slaughterTarget}kg)
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'hsl(var(--text-main))',
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    Neste ritmo ({gmd.toFixed(2)} kg/dia), o animal estará pronto para o frigorífico
                    em{' '}
                    <strong style={{ color: 'hsl(142 71% 45%)' }}>~{daysToSlaughter} dias</strong>.
                    (Previsto: {slaughterDateStr})
                  </div>
                </div>
              </div>
            )}

            {/* Warning + confirmação obrigatória para variação extrema */}
            <AnimatePresence>
              {(isTypoWarning || isMildWarning) && (
                <motion.div
                  key="weight-warning"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '10px 14px',
                      background: isTypoWarning ? 'hsl(0 84% 60% / 0.08)' : 'hsl(38 92% 50% / 0.1)',
                      border: `1.5px solid ${isTypoWarning ? 'hsl(0 84% 60% / 0.3)' : 'hsl(38 92% 50% / 0.3)'}`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: isTypoWarning ? 'hsl(0 84% 60%)' : 'hsl(38 92% 50%)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Atenção:</strong>{' '}
                      {isTypoWarning ? 'Variação muito acentuada' : 'Variação moderada'} (
                      {percentChange > 0 ? '+' : ''}
                      {percentChange.toFixed(1)}%).{' '}
                      {isTypoWarning
                        ? 'Verifique se houve erro de digitação antes de salvar.'
                        : 'Confirme o peso antes de salvar.'}
                    </span>
                  </div>
                  {/* Checkbox de confirmação obrigatória — apenas para variação extrema (>30%) */}
                  {isTypoWarning && (
                    <label
                      className="weight-confirm-row"
                      htmlFor="weight-extreme-confirm"
                    >
                      <input
                        id="weight-extreme-confirm"
                        type="checkbox"
                        checked={weightConfirmed}
                        onChange={(e) => setWeightConfirmed(e.target.checked)}
                      />
                      <span>
                        Confirmo que o peso de{' '}
                        <strong>{newWeightVal.toFixed(1)} kg</strong>{' '}
                        está correto e não é um erro de digitação.
                      </span>
                    </label>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">SEÇÃO 02</div>
            <h4 className="tauze-section-title">Condição e Observações</h4>
          </div>

          <div className="tauze-input-grid grid-col-2">
            {/* ── #7 — ECC Slider ── */}
            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label
                className="tauze-label"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <TrendingUp size={14} />
                Escore de Condição Corporal (ECC)
                {formData.ecc != null && formData.ecc > 0 && (
                  <span
                    style={{
                      marginLeft: '4px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: eccLabels[formData.ecc]?.color,
                      background: eccLabels[formData.ecc]?.bg,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      border: `1px solid ${eccLabels[formData.ecc]?.color}40`,
                    }}
                  >
                    {formData.ecc} — {eccLabels[formData.ecc]?.label}
                  </span>
                )}
                {(formData.ecc == null || formData.ecc === 0) && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'hsl(var(--text-muted))',
                      fontWeight: 600,
                      marginLeft: '4px',
                    }}
                  >
                    (Opcional)
                  </span>
                )}
              </label>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}
              >
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, ecc: formData.ecc === score ? null : score })
                    }
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: '12px',
                      border: '1.5px solid',
                      borderColor:
                        formData.ecc === score ? eccLabels[score].color : 'hsl(var(--border))',
                      background: formData.ecc === score ? eccLabels[score].bg : 'transparent',
                      color:
                        formData.ecc === score ? eccLabels[score].color : 'hsl(var(--text-muted))',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{score}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {eccLabels[score].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Observações + toggle ── */}
            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label">
                <FileText size={14} /> Observações
              </label>
              <textarea
                className="tauze-input tauze-textarea"
                placeholder="Notas sobre a condição do animal... (Ctrl+Enter para salvar)"
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </section>


      </>
    </SidePanel>
  );
};
