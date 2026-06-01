import React, { useState, useEffect, useRef } from 'react';
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
}

// ECC Labels
const eccLabels: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Emaciado', color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.1)' },
  2: { label: 'Magro', color: 'hsl(25 95% 55%)', bg: 'hsl(25 95% 55% / 0.1)' },
  3: { label: 'Moderado', color: 'hsl(38 92% 50%)', bg: 'hsl(38 92% 50% / 0.1)' },
  4: { label: 'Bom Estado', color: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.1)' },
  5: { label: 'Gordo', color: 'hsl(210 100% 50%)', bg: 'hsl(210 100% 50% / 0.1)' },
};

export const WeightForm: React.FC<WeightFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm, activeTenantId, isGlobalMode } = useTenant();
  const [animals, setAnimals] = useState<any[]>([]);
  const [lastWeighing, setLastWeighing] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [animalSelected, setAnimalSelected] = useState<any>(null);
  const [formData, setFormData] = useState({
    animal_id: '',
    data_pesagem: new Date().toISOString().split('T')[0],
    peso: '',
    ecc: 0,
    observacao: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const pesoInputRef = useRef<HTMLInputElement>(null);

  // #1 — fetch animals and today count
  useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchAnimals();
      fetchTodayCount();
    }
  }, [isOpen, activeFarm, activeTenantId]);

  // reset or populate form
  useEffect(() => {
    if (initialData) {
      setFormData({
        animal_id: initialData.animal_id || '',
        data_pesagem: initialData.data_pesagem || new Date().toISOString().split('T')[0],
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
  }, [initialData, isOpen, animals]);

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

  const resetForm = (keepDate = false) => {
    setFormData({
      animal_id: '',
      data_pesagem: keepDate ? formData.data_pesagem : new Date().toISOString().split('T')[0],
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
        .select('id, brinco, peso_inicial, created_at, raca, categoria, sexo')
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

  // #5 — today count
  const fetchTodayCount = async () => {
    try {
      if (!activeTenantId) return;
      const today = new Date().toISOString().split('T')[0];
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
      // #4 — fetch last 5 for sparkline
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.animal_id) {
      toast.error('⚠️ Por favor, selecione um animal válido usando o campo de busca.');
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
  const isSlaughterTargetReached = hasWeight && newWeightVal >= 450;

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

  // #4 — simple sparkline SVG
  const SparklineChart = () => {
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

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Pesagem" : "Nova Pesagem"}
      subtitle="Registre o peso individual de um animal."
      icon={Scale}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Pesagem"}
    >
      <form id="weight-form-el" onSubmit={handleSubmit} style={{ display: 'contents' }}>

        {/* ── Row: Animal + Peso + Data ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', gridColumn: 'span 4', width: '100%', alignItems: 'start' }}>

          {/* #1 — Chip + Search */}
          <div className="form-group" style={{ position: 'relative', margin: 0, gridColumn: 'unset' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              <div className="autocomplete-wrapper" style={{ position: 'relative', width: '100%' }}>
                <div className="search-input-container" style={{ position: 'relative', width: '100%' }}>
                  <input
                    id="animal-search-input"
                    type="text"
                    placeholder="Digite para filtrar pelo brinco..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    required={!formData.animal_id}
                    style={{ paddingRight: '36px', width: '100%', boxSizing: 'border-box' }}
                    autoComplete="off"
                  />
                  <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>

                {showDropdown && (
                  <div className="autocomplete-dropdown animate-fade-in" style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                    maxHeight: '200px', overflowY: 'auto',
                    background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))',
                    borderRadius: '12px', zIndex: 999, boxShadow: 'var(--shadow-lg)'
                  }}>
                    {filteredAnimals.length === 0 ? (
                      <div style={{ padding: '12px', color: 'hsl(var(--text-muted))', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                        Nenhum animal ativo com este brinco
                      </div>
                    ) : (
                      filteredAnimals.map(a => (
                        <div
                          key={a.id}
                          className="autocomplete-option"
                          onMouseDown={() => { setSearchQuery(a.brinco); handleAnimalChange(a); setShowDropdown(false); }}
                          style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-main))', borderBottom: '1px solid hsl(var(--border))' }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Hash size={12} color="hsl(var(--brand))" />
                            Brinco {a.brinco}
                            {a.raca && <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>· {a.raca}</span>}
                          </span>
                          {a.peso_inicial && (
                            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
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

          {/* #3 — Peso com validação visual */}
          <div className="form-group" style={{ margin: 0, gridColumn: 'unset' }}>
            <label><Scale size={14} /> Novo Peso (kg)</label>
            <input
              ref={pesoInputRef}
              type="number"
              step="0.1"
              placeholder="0.0"
              value={formData.peso}
              onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
              required
              style={{
                borderColor: getWeightBorderColor(),
                boxShadow: getWeightGlow(),
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            />
            {hasWeight && !isTypoWarning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '10px', fontWeight: 700, color: 'hsl(142 71% 45%)' }}>
                <CheckCircle2 size={11} />
                Peso válido
              </div>
            )}
          </div>

          {/* Data */}
          <div className="form-group" style={{ margin: 0, gridColumn: 'unset' }}>
            <label>
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
              type="date"
              value={formData.data_pesagem}
              onChange={(e) => setFormData({ ...formData, data_pesagem: e.target.value })}
              required
            />
          </div>
        </div>

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
                <SparklineChart />
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
                  const lastDateStr = lastWeighing.data_pesagem || lastWeighing.created_at;
                  if (!lastDateStr) return (
                    <>
                      <span className="p-value" style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))', margin: '4px 0', display: 'block' }}>--</span>
                      <span className="p-meta" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Sem data anterior</span>
                    </>
                  );
                  const lastDate = new Date(lastDateStr);
                  const currDate = new Date(formData.data_pesagem);
                  if (isNaN(lastDate.getTime()) || isNaN(currDate.getTime())) return (
                    <span className="p-meta" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Data inválida</span>
                  );
                  const diffDays = Math.max(1, Math.ceil((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
                  const gmd = diff / diffDays;
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

        {/* ── #7 — ECC Slider ── */}
        <div className="form-group full-width" style={{ gridColumn: 'span 4' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <div className="form-group full-width">
          <label><FileText size={14} /> Observações</label>
          <textarea
            placeholder="Notas sobre a condição do animal... (Ctrl+Enter para salvar)"
            value={formData.observacao}
            onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
            rows={2}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
          />
        </div>

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
