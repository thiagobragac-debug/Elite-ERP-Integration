/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

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
  TrendingUp
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import toast from 'react-hot-toast';

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

// #4 — simple sparkline SVG
const SparklineChart = ({ weightHistory }: { weightHistory: any[] }) => {
  if (weightHistory.length < 2) return null;
  const values = weightHistory.map(w => Number(w.peso));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 120, H = 32, pad = 4;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');

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
              cx={x} cy={y} r={i === values.length - 1 ? 4 : 2.5}
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

export const WeightForm: React.FC<WeightFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const { activeFarm, activeTenantId, isGlobalMode } = useTenant();
  const [animals, setAnimals] = useState<any[]>([]);
  const [lastWeighing, setLastWeighing] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [animalSelected, setAnimalSelected] = useState<any>(null);
  const [formData, setFormData] = usePersistentState('WeightForm_formData', {
    animal_id: '',
    data_pesagem: getTodayStr(),
    peso: '',
    ecc: 0,
    observacao: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const pesoInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
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
      ecc: 0,
      observacao: ''
    });
    setSearchQuery('');
    setLastWeighing(null);
    setWeightHistory([]);
    setAnimalSelected(null);
  };

  const fetchAnimals = async () => {
    try {
      if (!activeTenantId) return;
      let query = supabase
        .from('animais')
        .select('id, brinco, peso_inicial, created_at, raca, categoria, sexo, data_nascimento')
        .eq('tenant_id', activeTenantId)
        .ilike('status', 'ativo');
      if (!isGlobalMode && activeFarm?.id) {
        query = query.or(`fazenda_id.eq.${activeFarm.id},fazenda_id.is.null`);
      }
      const { data } = await query;
      if (data) {
        setAnimals(data);
        if (formData.animal_id) {
          const animal = data.find(a => a.id === formData.animal_id);
          if (animal) { setSearchQuery(animal.brinco); setAnimalSelected(animal); }
        }
      }
    } catch (err) {
      console.error('Error fetching animals:', err);
    }
  };

  const fetchTodayCount = async () => {
    try {
      if (!activeTenantId) return;
      const today = getTodayStr();
      const { count } = await supabase
        .from('pesagens')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', activeTenantId)
        .eq('data_pesagem', today);
      setTodayCount(count || 0);
    } catch { /* noop */ }
  };

  const fetchLastWeight = async (animalId: string) => {
    try {
      const { data } = await supabase
        .from('pesagens')
        .select('*')
        .eq('animal_id', animalId)
        .order('data_pesagem', { ascending: false })
        .limit(5);
      
      if (data && data[0]) {
        setLastWeighing(data[0]);
        setWeightHistory([...data].reverse());
      } else {
        const animal = animals.find(a => a.id === animalId);
        if (animal) {
          setLastWeighing({ peso: animal.peso_inicial, data_pesagem: animal.created_at || null, isInitial: true });
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
    if (initialData) { setFormData({
        animal_id: initialData.animal_id || '',
        data_pesagem: initialData.data_pesagem || getTodayStr(),
        peso: initialData.peso?.toString() || '',
        ecc: initialData.ecc || 0,
        observacao: initialData.observacao || ''
      });
      if (initialData.animal_id && animals.length > 0) {
        const animal = animals.find(a => a.id === initialData.animal_id);
        if (animal) { setSearchQuery(animal.brinco); setAnimalSelected(animal); }
      }
    } else {
      resetForm();
    }
  }, [initialData, isOpen, animals, actionId]);

  // #8 — Ctrl+Enter shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const form = document.getElementById('weight-form-el') as HTMLFormElement;
        if (form) form.requestSubmit();
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
      if (lwDate > min) min = lwDate;
    }
    return min;
  }, [animalSelected, lastWeighing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.animal_id) {
      toast.error('⚠️ Por favor, selecione um animal válido usando o campo de busca.');
      return;
    }
    if (minDate && formData.data_pesagem < minDate) {
      toast.error('⚠️ A data da pesagem não pode ser anterior à data de nascimento ou à última pesagem registrada.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const filteredAnimals = animals.filter(a => 
    a.brinco?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // derived weight metrics
  const lastWeightVal = Number(lastWeighing?.peso) || 0;
  const newWeightVal = Number(formData.peso) || 0;
  const hasWeight = !!formData.peso && !isNaN(newWeightVal) && newWeightVal > 0;
  const diff = hasWeight ? newWeightVal - lastWeightVal : 0;
  const percentChange = (hasWeight && lastWeightVal > 0) ? (diff / lastWeightVal) * 100 : 0;
  const isTypoWarning = hasWeight && Math.abs(percentChange) > 30;
  const isMildWarning = hasWeight && Math.abs(percentChange) > 15 && Math.abs(percentChange) <= 30;
  
  const slaughterTarget = animalSelected?.sexo === 'FEMEA' ? 450 : 500;
  const isSlaughterTargetReached = hasWeight && newWeightVal >= slaughterTarget;
  const arrobas = hasWeight ? (newWeightVal * 0.5) / 15 : 0;

  const lastDateStr = lastWeighing?.data_pesagem || lastWeighing?.created_at;
  const lastDateObj = lastDateStr ? new Date(lastDateStr) : null;
  const currDateObj = new Date(formData.data_pesagem);
  
  let gmd = 0;
  if (hasWeight && lastDateObj && !isNaN(lastDateObj.getTime()) && !isNaN(currDateObj.getTime())) {
      const dDays = Math.max(1, Math.ceil((currDateObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)));
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
    if (!hasWeight) return 'hsl(var(--border))';
    if (isTypoWarning) return 'hsl(0 84% 60%)';
    if (isMildWarning) return 'hsl(38 92% 50%)';
    return 'hsl(142 71% 45%)';
  };

  const getWeightGlow = () => {
    if (!hasWeight) return 'none';
    if (isTypoWarning) return '0 0 0 3px hsl(0 84% 60% / 0.15)';
    if (isMildWarning) return '0 0 0 3px hsl(38 92% 50% / 0.15)';
    return '0 0 0 3px hsl(142 71% 45% / 0.15)';
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Pesagem" : "Nova Pesagem"}
      size="large"
      subtitle="Registre o peso individual de um animal."
      icon={Scale}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Pesagem"}
    >
      <form id="weight-form-el" onSubmit={handleSubmit} style={{ display: 'contents' }}>
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 01</div>
            <h4 className="tauze-section-title">Dados da Pesagem</h4>
          </div>

          <div className="tauze-input-grid" style={{ gridTemplateColumns: '3fr 1fr 1fr' }}>
            {/* #1 — Chip + Search */}
            <div className="tauze-field-group" style={{ position: 'relative' }}>
              <label className="tauze-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={14} /> Selecionar Animal (Brinco)
              </label>

              {animalSelected ? (
                /* CHIP */
                <div className="animal-chip animate-fade-in" style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'hsl(var(--brand) / 0.08)',
                  border: '1.5px solid hsl(var(--brand) / 0.3)',
                  borderRadius: '12px', padding: '10px 14px',
                  cursor: 'default'
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'hsl(var(--brand))', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 900, flexShrink: 0
                  }}>
                    {animalSelected.brinco?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                      #{animalSelected.brinco}
                    </div>
                    {animalSelected.raca && (
                      <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                        {animalSelected.raca}{animalSelected.categoria ? ` · ${animalSelected.categoria}` : ''}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearAnimal}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'hsl(var(--text-muted))', padding: '2px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}
                    title="Remover animal"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                /* SEARCH */
                <div className="autocomplete-wrapper" style={{ position: 'relative', width: '100%' }} ref={searchRef}>
                  <div className="search-input-container" style={{ position: 'relative', width: '100%' }}>
                    <input
                      className="tauze-input"
                      id="animal-search-input"
                      type="text"
                      placeholder="Digite para filtrar pelo brinco..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      required={!formData.animal_id}
                      style={{ paddingRight: '36px', width: '100%', boxSizing: 'border-box' }}
                      autoComplete="off"
                    />
                    <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                  </div>

                  {showDropdown && (
                    <div className="autocomplete-dropdown animate-fade-in" style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                      maxHeight: '280px', overflowY: 'auto',
                      background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))',
                      borderRadius: '14px', zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                      display: 'flex', flexDirection: 'column'
                    }}>
                      {filteredAnimals.length === 0 ? (
                        <div style={{ padding: '16px', color: 'hsl(var(--text-muted))', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                          Nenhum animal ativo com este brinco
                        </div>
                      ) : (
                        filteredAnimals.map((a: any, idx: number) => (
                          <div
                            key={a.id}
                            onClick={() => { setSearchQuery(a.brinco); handleAnimalChange(a); setShowDropdown(false); }}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: idx < filteredAnimals.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                              transition: 'background 0.15s'
                            }}
                            className="autocomplete-option"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'hsl(var(--brand) / 0.1)',
                                color: 'hsl(var(--brand))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 900
                              }}>
                                #{a.brinco?.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  #{a.brinco}
                                  {a.sexo && (
                                    <span style={{
                                      fontSize: '9px', fontWeight: 800,
                                      background: a.sexo === 'M' || a.sexo === 'MACHO' || a.sexo === 'm' ? 'hsl(217 91% 60% / 0.12)' : 'hsl(316 73% 69% / 0.12)',
                                      color: a.sexo === 'M' || a.sexo === 'MACHO' || a.sexo === 'm' ? 'hsl(217 91% 60%)' : 'hsl(316 73% 60%)',
                                      padding: '1px 5px', borderRadius: '4px'
                                    }}>
                                      {a.sexo === 'M' || a.sexo === 'MACHO' || a.sexo === 'm' ? '♂ Macho' : '♀ Fêmea'}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                                  {a.raca || 'Nelore'}{a.categoria ? ` · ${a.categoria}` : ''}
                                </div>
                              </div>
                            </div>
                            {a.peso_inicial && (
                              <span style={{ fontSize: '13px', fontWeight: 900, color: '#10b981' }}>
                                {Number(a.peso_inicial).toFixed(0)} kg
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* #3 — Peso com validação visual e Arroba */}
            <div className="tauze-field-group">
              <label className="tauze-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                />
                {hasWeight && (
                  <div className="animate-fade-in" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--brand))', background: 'hsl(var(--brand)/0.1)', padding: '3px 6px', borderRadius: '6px', pointerEvents: 'none' }}>
                    ~ {arrobas.toFixed(1)} @
                  </div>
                )}
              </div>
              {hasWeight && !isTypoWarning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '10px', fontWeight: 700, color: 'hsl(142 71% 45%)' }}>
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
                  <span style={{
                    marginLeft: '8px', fontSize: '9px', fontWeight: 800,
                    background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))',
                    padding: '1px 7px', borderRadius: '20px', border: '1px solid hsl(var(--brand) / 0.2)'
                  }}>
                    {todayCount} hoje
                  </span>
                )}
              </label>
              <input
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
          <div className="performance-preview-card full-width animate-slide-panel" style={{
            background: 'linear-gradient(135deg, hsl(var(--brand) / 0.08) 0%, hsl(var(--brand) / 0.02) 100%)',
            border: isTypoWarning ? '1.5px dashed hsl(0 84% 60%)' : isMildWarning ? '1.5px dashed hsl(38 92% 50%)' : '1.5px dashed hsl(var(--brand) / 0.3)',
            borderRadius: '20px', padding: '20px', marginBottom: '4px',
            gridColumn: 'span 4',
            boxShadow: 'inset 0 0 12px hsl(var(--brand) / 0.05)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid hsl(var(--border) / 0.5)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isTypoWarning ? 'hsl(0 84% 60%)' : 'hsl(var(--brand))', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Activity size={16} style={{ animation: 'pulse 2s infinite' }} />
                <span>Painel de Performance Individual</span>
              </div>
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 700, background: 'hsl(var(--bg-main))', padding: '4px 10px', borderRadius: '20px', border: '1px solid hsl(var(--border))' }}>
                Intervalo: {(() => {
                  const lastDateStr = lastWeighing.data_pesagem || lastWeighing.created_at;
                  if (!lastDateStr) return '--';
                  const lastDate = new Date(lastDateStr);
                  const currDate = new Date(formData.data_pesagem);
                  if (isNaN(lastDate.getTime()) || isNaN(currDate.getTime())) return '--';
                  const diffDays = Math.max(0, Math.ceil((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
                  return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
                })()}
              </span>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {/* Peso Anterior */}
              <div className="preview-stat" style={{ borderRight: '1px solid hsl(var(--border) / 0.5)', paddingRight: '12px' }}>
                <span className="p-label" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Peso Anterior</span>
                <span className="p-value" style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))', margin: '4px 0', display: 'block' }}>
                  {Number(lastWeighing.peso || 0).toFixed(2)} kg
                </span>
                <span className="p-meta" style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                  {lastWeighing.isInitial ? 'Peso Inicial' : (lastWeighing.data_pesagem ? new Date(lastWeighing.data_pesagem).toLocaleDateString('pt-BR') : 'Sem data')}
                </span>
                {/* #4 — sparkline */}
                <SparklineChart weightHistory={weightHistory} />
              </div>

              {/* Evolução */}
              <div className="preview-stat" style={{ borderRight: '1px solid hsl(var(--border) / 0.5)', paddingRight: '12px' }}>
                <span className="p-label" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Evolução</span>
                {hasWeight ? (() => {
                  const isPositive = diff >= 0;
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="p-value" style={{ fontSize: '24px', fontWeight: 900, color: isPositive ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)', margin: '4px 0' }}>
                          {isPositive ? `+${diff.toFixed(2)}` : diff.toFixed(2)} kg
                        </span>
                        {isSlaughterTargetReached && (
                          <span style={{ fontSize: '9px', fontWeight: 900, color: 'hsl(142 71% 45%)', background: 'hsl(142 71% 45% / 0.1)', padding: '2px 6px', borderRadius: '6px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Award size={10} /> 🏆 Abate
                          </span>
                        )}
                      </div>
                      <span className="p-meta" style={{ fontSize: '11px', fontWeight: 700, color: isPositive ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)' }}>
                        {isPositive ? 'Ganho de Peso' : 'Perda de Peso'}
                        {percentChange !== 0 && <span style={{ marginLeft: '4px', opacity: 0.8 }}>({isPositive ? '+' : ''}{percentChange.toFixed(1)}%)</span>}
                      </span>
                    </>
                  );
                })() : (
                  <>
                    <span className="p-value" style={{ fontSize: '22px', fontWeight: 800, color: 'hsl(var(--text-muted) / 0.6)', margin: '6px 0', display: 'block' }}>-- kg</span>
                    <span className="p-meta" style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Aguardando peso...</span>
                  </>
                )}
              </div>

              {/* GMD */}
              <div className="preview-stat">
                <span className="p-label" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>GMD Projetado</span>
                {hasWeight ? (() => {
                  if (!lastDateStr || isNaN(lastDateObj?.getTime() || NaN)) return (
                    <>
                      <span className="p-value" style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))', margin: '4px 0', display: 'block' }}>--</span>
                      <span className="p-meta" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Sem data anterior</span>
                    </>
                  );
                  if (isNaN(currDateObj.getTime())) return (
                    <span className="p-meta" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Data inválida</span>
                  );
                  
                  let badgeColor = 'hsl(38 92% 50%)', badgeBg = 'hsl(38 92% 50% / 0.1)', rating = 'Regular';
                  if (gmd >= 0.8) { badgeColor = 'hsl(142 71% 45%)'; badgeBg = 'hsl(142 71% 45% / 0.1)'; rating = 'Excelente'; }
                  else if (gmd < 0) { badgeColor = 'hsl(0 84% 60%)'; badgeBg = 'hsl(0 84% 60% / 0.1)'; rating = 'Perda Crítica'; }
                  else if (gmd < 0.3) { badgeColor = 'hsl(38 92% 50%)'; badgeBg = 'hsl(38 92% 50% / 0.1)'; rating = 'Baixo Ganho'; }
                  return (
                    <>
                      <span className="p-value" style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))', margin: '4px 0', display: 'block' }}>
                        {gmd.toFixed(2)} <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>kg/dia</span>
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 900, color: badgeColor, background: badgeBg, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', display: 'inline-block', marginTop: '2px' }}>
                        {rating}
                      </span>
                    </>
                  );
                })() : (
                  <>
                    <span className="p-value" style={{ fontSize: '22px', fontWeight: 800, color: 'hsl(var(--text-muted) / 0.6)', margin: '6px 0', display: 'block' }}>-- kg/dia</span>
                    <span className="p-meta" style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Informe o peso acima</span>
                  </>
                )}
              </div>
            </div>

            {/* Predição de Abate (Smart Card) */}
            {slaughterDateStr && (
              <div className="animate-fade-in" style={{
                marginTop: '16px', padding: '12px 14px',
                background: 'linear-gradient(135deg, hsl(142 71% 45% / 0.1) 0%, hsl(142 71% 45% / 0.02) 100%)',
                border: '1px solid hsl(142 71% 45% / 0.2)',
                borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px'
              }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsl(142 71% 45%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white' }}>
                  <Award size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(142 71% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Predição de Abate ({slaughterTarget}kg)
                  </div>
                  <div style={{ fontSize: '12px', color: 'hsl(var(--text-main))', fontWeight: 600, lineHeight: 1.4 }}>
                    Neste ritmo ({gmd.toFixed(2)} kg/dia), o animal estará pronto para o frigorífico em <strong style={{ color: 'hsl(142 71% 45%)' }}>~{daysToSlaughter} dias</strong>. (Previsto: {slaughterDateStr})
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            {(isTypoWarning || isMildWarning) && (
              <div className="animate-fade-in" style={{
                marginTop: '16px', padding: '10px 14px',
                background: isTypoWarning ? 'hsl(0 84% 60% / 0.08)' : 'hsl(38 92% 50% / 0.1)',
                border: `1.5px solid ${isTypoWarning ? 'hsl(0 84% 60% / 0.3)' : 'hsl(38 92% 50% / 0.3)'}`,
                borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                color: isTypoWarning ? 'hsl(0 84% 60%)' : 'hsl(38 92% 50%)',
                fontSize: '11.5px', fontWeight: 700, lineHeight: 1.4
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Atenção:</strong> {isTypoWarning ? 'Variação muito acentuada' : 'Variação moderada'} ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%). {isTypoWarning ? 'Verifique se houve erro de digitação antes de salvar.' : 'Confirme o peso antes de salvar.'}
                </span>
              </div>
            )}
          </div>
        )}

        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Condição e Observações</h4>
          </div>
          
          <div className="tauze-input-grid grid-col-2">
            {/* ── #7 — ECC Slider ── */}
            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={14} />
                Escore de Condição Corporal (ECC)
                {formData.ecc > 0 && (
                  <span style={{
                    marginLeft: '4px', fontSize: '10px', fontWeight: 800,
                    color: eccLabels[formData.ecc]?.color,
                    background: eccLabels[formData.ecc]?.bg,
                    padding: '2px 8px', borderRadius: '20px',
                    border: `1px solid ${eccLabels[formData.ecc]?.color}40`
                  }}>
                    {formData.ecc} — {eccLabels[formData.ecc]?.label}
                  </span>
                )}
                {formData.ecc === 0 && (
                  <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600, marginLeft: '4px' }}>
                    (Opcional)
                  </span>
                )}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
                {[1, 2, 3, 4, 5].map(score => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setFormData({ ...formData, ecc: formData.ecc === score ? 0 : score })}
                    style={{
                      flex: 1, padding: '10px 4px', borderRadius: '12px', border: '1.5px solid',
                      borderColor: formData.ecc === score ? eccLabels[score].color : 'hsl(var(--border))',
                      background: formData.ecc === score ? eccLabels[score].bg : 'transparent',
                      color: formData.ecc === score ? eccLabels[score].color : 'hsl(var(--text-muted))',
                      cursor: 'pointer', fontSize: '11px', fontWeight: 800,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{score}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {eccLabels[score].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Observações + toggle ── */}
            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label"><FileText size={14} /> Observações</label>
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

        <style>{`
          .autocomplete-option:hover {
            background: hsl(var(--brand) / 0.1) !important;
            color: hsl(var(--brand)) !important;
          }
          .autocomplete-dropdown::-webkit-scrollbar { width: 6px; }
          .autocomplete-dropdown::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
          .performance-preview-card { background: hsl(var(--brand) / 0.05); border: 1px solid hsl(var(--brand) / 0.2); border-radius: 16px; padding: 16px; margin-bottom: 20px; grid-column: span 4; }
          .preview-stat { display: flex; flex-direction: column; }
          .p-label { font-size: 11px; color: hsl(var(--text-muted)); font-weight: 600; }
          .p-value { font-size: 18px; font-weight: 900; color: hsl(var(--text-main)); }
          .p-meta { font-size: 10px; font-weight: 700; color: hsl(var(--text-muted)); }
          @keyframes slide-panel {
            from { opacity: 0; transform: translateY(-8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-panel { animation: slide-panel 0.25s ease-out both; }
          @keyframes fade-in {
            from { opacity: 0; } to { opacity: 1; }
          }
          .animate-fade-in { animation: fade-in 0.2s ease both; }
          .animal-chip:hover { border-color: hsl(var(--brand) / 0.5) !important; }
        `}</style>
      </form>
    </SidePanel>
  );
};
