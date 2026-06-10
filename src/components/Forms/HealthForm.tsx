import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  HeartPulse, 
  Calendar,
  Search,
  FlaskConical,
  Stethoscope,
  Clock,
  Layers,
  Activity,
  FileText,
  Hash,
  AlertCircle,
  ShieldAlert,
  BellRing,
  UserCheck,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface HealthFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  actionId?: number;
}

export const HealthForm: React.FC<HealthFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const { activeFarm, activeTenantId, isGlobalMode } = useTenant();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = usePersistentState('HealthForm_formData', {
    tipo: 'vacina',
    titulo: '',
    animal_id: '',
    lote_id: '',
    data_manejo: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    produto: '',
    dose: '',
    via_aplicacao: 'IM',
    local_aplicacao: '',
    carencia_dias: '',
    reforco_dias: '',
    veterinario: '',
    observacao: '',
    status: 'REALIZADO'
  });

  const [loading, setLoading] = useState(false);

  const [animals, setAnimals] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [animalSearchQuery, setAnimalSearchQuery] = useState('');
  const [loteSearchQuery, setLoteSearchQuery] = useState('');
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [showLoteDropdown, setShowLoteDropdown] = useState(false);
  const [animalSelected, setAnimalSelected] = useState<any>(null);
  const [loteSelected, setLoteSelected] = useState<any>(null);

  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [produtosAplicados, setProdutosAplicados] = usePersistentState<any[]>('HealthForm_produtosAplicados', []);
  
  // Temporary inputs for adding a product
  const [tempProduct, setTempProduct] = useState<any>(null);
  const [tempProductName, setTempProductName] = useState('');
  const [tempDose, setTempDose] = useState('');
  const [tempVia, setTempVia] = useState('IM');
  const [tempLocal, setTempLocal] = useState('');
  const [tempCarencia, setTempCarencia] = useState('');

  const animalSearchRef = React.useRef<HTMLDivElement>(null);
  const loteSearchRef = React.useRef<HTMLDivElement>(null);
  const productSearchRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (animalSearchRef.current && !animalSearchRef.current.contains(e.target as Node)) {
        setShowAnimalDropdown(false);
      }
      if (loteSearchRef.current && !loteSearchRef.current.contains(e.target as Node)) {
        setShowLoteDropdown(false);
      }
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAnimalsAndLots = async () => {
    try {
      if (!activeTenantId) return;
      
      // 1. Fetch Animals
      let animalQuery = supabase
        .from('animais')
        .select('id, brinco, raca, categoria, sexo')
        .eq('tenant_id', activeTenantId)
        .ilike('status', 'ativo');
      if (!isGlobalMode && activeFarm?.id) {
        animalQuery = animalQuery.or(`fazenda_id.eq.${activeFarm.id},fazenda_id.is.null`);
      }
      const { data: animalData } = await animalQuery;
      if (animalData) setAnimals(animalData);

      // 2. Fetch Lots
      let loteQuery = supabase
        .from('lotes')
        .select('id, nome, status')
        .eq('tenant_id', activeTenantId)
        .ilike('status', 'ativo');
      if (!isGlobalMode && activeFarm?.id) {
        loteQuery = loteQuery.eq('fazenda_id', activeFarm.id);
      }
      const { data: loteData } = await loteQuery;
      if (loteData) setLots(loteData);

      // 3. Fetch Categories & Products for Insumos selection
      const { data: catData } = await supabase
        .from('categorias_sistema')
        .select('id, nome')
        .eq('modulo', 'estoque');

      const targetCatIds = catData
        ? catData
            .filter((c: any) => c.nome?.toLowerCase().includes('medicamento') || c.nome?.toLowerCase().includes('vacina'))
            .map((c: any) => c.id)
        : [];

      if (targetCatIds.length > 0) {
        let productQuery = supabase
          .from('produtos')
          .select('id, nome, categoria_id, ean, marca')
          .eq('tenant_id', activeTenantId)
          .in('categoria_id', targetCatIds);
        
        if (!isGlobalMode && activeFarm?.id) {
          productQuery = productQuery.or(`fazenda_id.eq.${activeFarm.id},fazenda_id.is.null`);
        }
        
        const { data: prodData } = await productQuery;
        if (prodData) {
          setAvailableProducts(prodData);
        }
      }
      
    } catch (err) {
      console.error('Error fetching animals or lots or products:', err);
    }
  };

  React.useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchAnimalsAndLots();
    }
  }, [isOpen, activeFarm, activeTenantId]);

  React.useEffect(() => {
    if (!actionId) return; // Ignore on initial mount / refresh
    setCurrentStep(1);
    setAnimalSelected(null);
    setLoteSelected(null);
    setAnimalSearchQuery('');
    setLoteSearchQuery('');
    setProdutosAplicados([]);
    setTempProductName('');
    setTempDose('');
    setTempVia('IM');
    setTempLocal('');
    setTempCarencia('');
    setTempProduct(null);

    if (initialData) { setFormData({
        tipo: initialData.tipo || 'vacina',
        titulo: initialData.titulo || '',
        animal_id: initialData.animal_id || '',
        lote_id: initialData.lote_id || '',
        data_manejo: initialData.data_manejo || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        produto: initialData.produto || '',
        dose: initialData.dose || '',
        via_aplicacao: initialData.via_aplicacao || 'IM',
        local_aplicacao: initialData.local_aplicacao || '',
        carencia_dias: initialData.carencia_dias?.toString() || '',
        reforco_dias: initialData.reforco_dias?.toString() || '',
        veterinario: initialData.veterinario || '',
        observacao: initialData.observacao || '',
        status: initialData.status || 'REALIZADO'
      });
    } else {
      setFormData({
        tipo: 'vacina',
        titulo: '',
        animal_id: '',
        lote_id: '',
        data_manejo: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        produto: '',
        dose: '',
        via_aplicacao: 'IM',
        local_aplicacao: '',
        carencia_dias: '',
        reforco_dias: '',
        veterinario: '',
        observacao: '',
        status: 'REALIZADO'
      });
    }
  }, [initialData, isOpen, actionId]);

  // Set selected objects when list or formData changes
  React.useEffect(() => {
    if (formData.animal_id && animals.length > 0) {
      const animal = animals.find(a => a.id === formData.animal_id);
      if (animal) {
        setAnimalSelected(animal);
        setAnimalSearchQuery(animal.brinco);
      }
    } else {
      setAnimalSelected(null);
      setAnimalSearchQuery('');
    }

    if (formData.lote_id && lots.length > 0) {
      const lote = lots.find(l => l.id === formData.lote_id);
      if (lote) {
        setLoteSelected(lote);
        setLoteSearchQuery(lote.nome);
      }
    } else {
      setLoteSelected(null);
      setLoteSearchQuery('');
    }
  }, [animals, lots, formData.animal_id, formData.lote_id]);

  // Synchronize carencia_dias when multi-product list changes
  React.useEffect(() => {
    if (!initialData && produtosAplicados.length > 0 && formData.tipo !== 'cirurgia') {
      const maxCarencia = Math.max(...produtosAplicados.map(p => parseInt(p.carencia_dias) || 0));
      setFormData(prev => ({ ...prev, carencia_dias: maxCarencia > 0 ? String(maxCarencia) : '' }));
    }
  }, [produtosAplicados, initialData, formData.tipo]);

  const handleAddProduto = () => {
    if (!tempProductName.trim()) return;
    setProdutosAplicados(prev => [
      ...prev,
      {
        produto: tempProductName.trim(),
        dose: tempDose.trim(),
        via_aplicacao: tempVia,
        local_aplicacao: tempLocal.trim(),
        carencia_dias: tempCarencia.trim()
      }
    ]);
    // Reset temp inputs
    setTempProductName('');
    setTempDose('');
    setTempVia('IM');
    setTempLocal('');
    setTempCarencia('');
    setTempProduct(null);
  };

  const handleRemoveProduto = (idx: number) => {
    setProdutosAplicados(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        produtos: (initialData || formData.tipo === 'cirurgia') ? [] : produtosAplicados
      };
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  // --- HEALTH ENGINE ---
  const healthStats = useMemo(() => {
    let bloqueioAbate = null;
    let dataReforco = null;

    if (formData.data_manejo) {
      const baseDate = new Date(formData.data_manejo);
      if (!isNaN(baseDate.getTime())) {
        
        // Regra 1: Carência Abate/Leite
        const carencia = parseInt(formData.carencia_dias);
        if (carencia > 0 && formData.tipo !== 'vacina') {
          const dLiberacao = new Date(baseDate);
          dLiberacao.setDate(dLiberacao.getDate() + carencia);
          bloqueioAbate = dLiberacao.toLocaleDateString('pt-BR');
        }

        // Regra 2: Reforço Vacinal
        const reforco = parseInt(formData.reforco_dias);
        if (reforco > 0 && formData.tipo === 'vacina') {
          const dReforco = new Date(baseDate);
          dReforco.setDate(dReforco.getDate() + reforco);
          dataReforco = dReforco.toLocaleDateString('pt-BR');
        }
      }
    }

    return { bloqueioAbate, dataReforco };
  }, [formData.data_manejo, formData.carencia_dias, formData.reforco_dias, formData.tipo]);

  const handleAnimalChange = (animal: any) => {
    setFormData(prev => ({ ...prev, animal_id: animal.id, lote_id: '' }));
    setAnimalSelected(animal);
    setLoteSelected(null);
    setLoteSearchQuery('');
  };

  const clearAnimal = () => {
    setFormData(prev => ({ ...prev, animal_id: '' }));
    setAnimalSelected(null);
    setAnimalSearchQuery('');
  };

  const handleLoteChange = (lote: any) => {
    setFormData(prev => ({ ...prev, lote_id: lote.id, animal_id: '' }));
    setLoteSelected(lote);
    setAnimalSelected(null);
    setAnimalSearchQuery('');
  };

  const clearLote = () => {
    setFormData(prev => ({ ...prev, lote_id: '' }));
    setLoteSelected(null);
    setLoteSearchQuery('');
  };

  const filteredAnimals = animals.filter(a => 
    a.brinco?.toLowerCase().includes(animalSearchQuery.toLowerCase())
  );

  const filteredLots = lots.filter(l => 
    l.nome?.toLowerCase().includes(loteSearchQuery.toLowerCase())
  );

  const steps = [
    { number: 1, label: 'Contexto' },
    { number: 2, label: 'Aplicação' },
    { number: 3, label: 'Carência & Alertas' },
  ];

  const handleNext = () => {
    if (currentStep === 1 && !formData.titulo.trim()) return;
    if (currentStep === 2 && !initialData && formData.tipo !== 'cirurgia' && produtosAplicados.length === 0) {
      toast.error('⚠️ Adicione pelo menos um fármaco/insumo para prosseguir.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Registro Sanitário" : "Novo Registro Sanitário"}
      subtitle="Registre vacinas, medicamentos ou tratamentos."
      icon={HeartPulse}
      loading={loading}
      customFooter={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {currentStep > 1 && (
              <button type="button" className="glass-btn secondary" onClick={handlePrev}>
                Voltar
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="glass-btn secondary" onClick={onClose}>
              Cancelar
            </button>
            {currentStep < 3 ? (
              <button 
                type="button" 
                className="primary-btn" 
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !formData.titulo.trim()) ||
                  (currentStep === 2 && !initialData && formData.tipo !== 'cirurgia' && produtosAplicados.length === 0)
                }
                style={{ 
                  opacity: (
                    (currentStep === 1 && !formData.titulo.trim()) ||
                    (currentStep === 2 && !initialData && formData.tipo !== 'cirurgia' && produtosAplicados.length === 0)
                  ) ? 0.5 : 1 
                }}
              >
                Avançar
              </button>
            ) : (
              <button 
                type="submit" 
                className="primary-btn" 
                disabled={loading}
              >
                {loading ? 'Processando...' : initialData ? "Salvar Alterações" : "Salvar Registro"}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Wizard Step Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', padding: '0 4px' }}>
        {steps.map((s, idx) => (
          <React.Fragment key={s.number}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: s.number < currentStep ? 'pointer' : 'default' }}
              onClick={() => s.number < currentStep && setCurrentStep(s.number)}
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 900,
                background: currentStep === s.number ? 'hsl(var(--brand))' : currentStep > s.number ? '#10b981' : '#f1f5f9',
                color: currentStep >= s.number ? 'white' : '#64748b',
                border: `2px solid ${currentStep === s.number ? 'hsl(var(--brand))' : currentStep > s.number ? '#10b981' : '#cbd5e1'}`,
                transition: 'all 0.3s'
              }}>
                {currentStep > s.number ? '✓' : s.number}
              </div>
              <span style={{ fontSize: '12px', fontWeight: currentStep === s.number ? 800 : 600, color: currentStep === s.number ? 'hsl(var(--text-main))' : '#94a3b8' }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: currentStep > s.number ? '#10b981' : '#e2e8f0', margin: '0 12px' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {currentStep === 1 && (
        <section className="tauze-form-section animate-slide-up" style={{ margin: 0 }}>
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 01</div>
            <h4 className="tauze-section-title">Dados Gerais</h4>
          </div>
          
          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label"><FileText size={14} /> Título / Descrição</label>
              <input 
                className="tauze-input"
                type="text" 
                placeholder="Ex: Vacinação contra Aftosa" 
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                required 
              />
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label"><Stethoscope size={14} /> Tipo de Manejo</label>
              <SearchableSelect 
                value={formData.tipo}
                onChange={(val: any) => setFormData({...formData, tipo: val})}
                options={[
                  { value: `vacina`, label: `Vacina` },
                  { value: `medicamento`, label: `Medicamento / Vermífugo` },
                  { value: `cirurgia`, label: `Cirurgia / Procedimento` },
                ]}
              />
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label"><Clock size={14} /> Data do Manejo</label>
              <input 
                className="tauze-input"
                type="date" 
                value={formData.data_manejo}
                onChange={(e) => setFormData({...formData, data_manejo: e.target.value})}
                required
              />
            </div>

            {/* Animal Selection Autocomplete */}
            <div className="tauze-field-group" style={{ position: 'relative' }}>
              <label className="tauze-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Search size={14} /> Animal (Foco Individual)
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
                /* SEARCH INPUT */
                <div className="autocomplete-wrapper" style={{ position: 'relative', width: '100%' }} ref={animalSearchRef}>
                  <div className="search-input-container" style={{ position: 'relative', width: '100%' }}>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder={formData.lote_id ? "Bloqueado (Lote selecionado)" : "Digite para filtrar pelo brinco..."}
                      value={animalSearchQuery}
                      onChange={(e) => { setAnimalSearchQuery(e.target.value); setShowAnimalDropdown(true); }}
                      onFocus={() => !formData.lote_id && setShowAnimalDropdown(true)}
                      disabled={!!formData.lote_id}
                      style={{ paddingRight: '36px', width: '100%', boxSizing: 'border-box' }}
                      autoComplete="off"
                    />
                    <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                  </div>

                  {showAnimalDropdown && !formData.lote_id && (
                    <div className="autocomplete-dropdown animate-fade-in" style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                      maxHeight: '220px', overflowY: 'auto',
                      background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))',
                      borderRadius: '14px', zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                      display: 'flex', flexDirection: 'column'
                    }}>
                      {filteredAnimals.length === 0 ? (
                        <div style={{ padding: '16px', color: 'hsl(var(--text-muted))', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                          Nenhum animal ativo encontrado
                        </div>
                      ) : (
                        filteredAnimals.map((a: any, idx: number) => (
                          <div
                            key={a.id}
                            onClick={() => { setAnimalSearchQuery(a.brinco); handleAnimalChange(a); setShowAnimalDropdown(false); }}
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
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lote Selection Autocomplete */}
            <div className="tauze-field-group" style={{ position: 'relative' }}>
              <label className="tauze-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} /> Lote (Foco Coletivo)
              </label>

              {loteSelected ? (
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
                    {loteSelected.nome?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                      {loteSelected.nome}
                    </div>
                    <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                      Lote Ativo
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearLote}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'hsl(var(--text-muted))', padding: '2px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}
                    title="Remover lote"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                /* SEARCH INPUT */
                <div className="autocomplete-wrapper" style={{ position: 'relative', width: '100%' }} ref={loteSearchRef}>
                  <div className="search-input-container" style={{ position: 'relative', width: '100%' }}>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder={formData.animal_id ? "Bloqueado (Animal selecionado)" : "Digite para filtrar pelo lote..."}
                      value={loteSearchQuery}
                      onChange={(e) => { setLoteSearchQuery(e.target.value); setShowLoteDropdown(true); }}
                      onFocus={() => !formData.animal_id && setShowLoteDropdown(true)}
                      disabled={!!formData.animal_id}
                      style={{ paddingRight: '36px', width: '100%', boxSizing: 'border-box' }}
                      autoComplete="off"
                    />
                    <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                  </div>

                  {showLoteDropdown && !formData.animal_id && (
                    <div className="autocomplete-dropdown animate-fade-in" style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                      maxHeight: '220px', overflowY: 'auto',
                      background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))',
                      borderRadius: '14px', zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                      display: 'flex', flexDirection: 'column'
                    }}>
                      {filteredLots.length === 0 ? (
                        <div style={{ padding: '16px', color: 'hsl(var(--text-muted))', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                          Nenhum lote ativo encontrado
                        </div>
                      ) : (
                        filteredLots.map((l: any, idx: number) => (
                          <div
                            key={l.id}
                            onClick={() => { setLoteSearchQuery(l.nome); handleLoteChange(l); setShowLoteDropdown(false); }}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: idx < filteredLots.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
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
                                #{l.nome?.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                                  {l.nome}
                                </div>
                                <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                                  Status: {l.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {currentStep === 2 && (
        <section className="tauze-form-section animate-slide-up" style={{ margin: 0 }}>
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Protocolo e Aplicação</h4>
          </div>
          
          {(initialData || formData.tipo === 'cirurgia') ? (
            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group" style={{ gridColumn: formData.tipo === 'cirurgia' ? 'span 2' : 'span 1' }} ref={productSearchRef}>
                <label className="tauze-label"><FlaskConical size={14} /> {formData.tipo === 'cirurgia' ? 'Descrição do Procedimento' : 'Fármaco / Insumo'}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="tauze-input"
                    type="text" 
                    placeholder={formData.tipo === 'cirurgia' ? "Ex: Castração Inguinal" : "Ex: Aftovax 2ml"} 
                    value={formData.produto}
                    onChange={(e) => {
                      setFormData({...formData, produto: e.target.value});
                      if (formData.tipo !== 'cirurgia') setShowProductDropdown(true);
                    }}
                    onFocus={() => {
                      if (formData.tipo !== 'cirurgia') setShowProductDropdown(true);
                    }}
                  />
                  {showProductDropdown && formData.tipo !== 'cirurgia' && (
                    <div className="autocomplete-dropdown animate-fade-in" style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                      maxHeight: '200px', overflowY: 'auto',
                      background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))',
                      borderRadius: '14px', zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                      display: 'flex', flexDirection: 'column'
                    }}>
                      {availableProducts.filter(p => p.nome?.toLowerCase().includes((formData.produto || '').toLowerCase())).length === 0 ? (
                        <div style={{ padding: '12px', color: 'hsl(var(--text-muted))', fontSize: '12.5px', textAlign: 'center', fontWeight: 600 }}>
                          Usar valor digitado (fármaco não cadastrado no estoque)
                        </div>
                      ) : (
                        availableProducts.filter(p => p.nome?.toLowerCase().includes((formData.produto || '').toLowerCase())).map((p: any) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, produto: p.nome }));
                              setShowProductDropdown(false);
                            }}
                            className="autocomplete-option"
                            style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid hsl(var(--border) / 0.5)', transition: 'background 0.15s' }}
                          >
                            <div style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>{p.nome}</div>
                            {p.marca && <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '2px', fontWeight: 600 }}>Marca: {p.marca}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {formData.tipo !== 'cirurgia' && (
                <div className="tauze-field-group">
                  <label className="tauze-label"><Hash size={14} /> Dose / Quantidade</label>
                  <input 
                    className="tauze-input"
                    type="text" 
                    placeholder="Ex: 2ml" 
                    value={formData.dose}
                    onChange={(e) => setFormData({...formData, dose: e.target.value})}
                  />
                </div>
              )}

              {formData.tipo !== 'cirurgia' && (
                <>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Activity size={14} /> Via de Aplicação</label>
                    <SearchableSelect 
                      value={formData.via_aplicacao}
                      onChange={(val: any) => setFormData({...formData, via_aplicacao: val})}
                      options={[
                        { value: `IM`, label: `Intramuscular (IM)` },
                        { value: `SC`, label: `Subcutânea (SC)` },
                        { value: `ORAL`, label: `Oral` },
                        { value: `TOPICO`, label: `Tópico` },
                        { value: `IV`, label: `Intravenosa (IV)` },
                      ]}
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label"><Hash size={14} /> Local de Aplicação</label>
                    <input 
                      className="tauze-input"
                      type="text" 
                      placeholder="Ex: Tábua do Pescoço, Garupa..." 
                      value={formData.local_aplicacao}
                      onChange={(e) => setFormData({...formData, local_aplicacao: e.target.value})}
                    />
                  </div>
                </>
              )}

              {formData.tipo === 'cirurgia' && (
                <div className="tauze-field-group">
                  <label className="tauze-label"><UserCheck size={14} /> Veterinário Responsável</label>
                  <input 
                    className="tauze-input"
                    type="text" 
                    placeholder="Nome do Médico Veterinário" 
                    value={formData.veterinario}
                    onChange={(e) => setFormData({...formData, veterinario: e.target.value})}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Add Fármaco Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Row 1: Fármaco */}
                <div className="tauze-field-group" style={{ margin: 0 }} ref={productSearchRef}>
                  <label className="tauze-label"><FlaskConical size={14} /> Fármaco / Insumo</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="tauze-input"
                      type="text" 
                      placeholder="Busque ou digite o nome do medicamento/vacina..." 
                      value={tempProductName}
                      onChange={(e) => {
                        setTempProductName(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                    />
                    {showProductDropdown && (
                      <div className="autocomplete-dropdown animate-fade-in" style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                        maxHeight: '180px', overflowY: 'auto',
                        background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))',
                        borderRadius: '14px', zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                        display: 'flex', flexDirection: 'column'
                      }}>
                        {availableProducts.filter(p => p.nome?.toLowerCase().includes((tempProductName || '').toLowerCase())).length === 0 ? (
                          <div style={{ padding: '12px', color: 'hsl(var(--text-muted))', fontSize: '12px', textAlign: 'center', fontWeight: 600 }}>
                            Usar valor digitado (fármaco não cadastrado no estoque)
                          </div>
                        ) : (
                          availableProducts.filter(p => p.nome?.toLowerCase().includes((tempProductName || '').toLowerCase())).map((p: any) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setTempProductName(p.nome);
                                setTempProduct(p);
                                setShowProductDropdown(false);
                              }}
                              className="autocomplete-option"
                              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid hsl(var(--border) / 0.5)', transition: 'background 0.15s' }}
                            >
                              <div style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>{p.nome}</div>
                              {p.marca && <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '2px', fontWeight: 600 }}>Marca: {p.marca}</div>}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Inline grid with Dose, Via, Local, Carência, and Add button */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1.6fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                  <div className="tauze-field-group" style={{ margin: 0 }}>
                    <label className="tauze-label"><Hash size={13} /> Dose</label>
                    <input 
                      className="tauze-input"
                      type="text" 
                      placeholder="Ex: 2ml" 
                      value={tempDose}
                      onChange={(e) => setTempDose(e.target.value)}
                    />
                  </div>

                  <div className="tauze-field-group" style={{ margin: 0 }}>
                    <label className="tauze-label"><Activity size={13} /> Via</label>
                    <SearchableSelect 
                      value={tempVia}
                      onChange={(val: any) => setTempVia(val)}
                      options={[
                        { value: `IM`, label: `Intramuscular (IM)` },
                        { value: `SC`, label: `Subcutânea (SC)` },
                        { value: `ORAL`, label: `Oral` },
                        { value: `TOPICO`, label: `Tópico` },
                        { value: `IV`, label: `Intravenosa (IV)` },
                      ]}
                    />
                  </div>

                  <div className="tauze-field-group" style={{ margin: 0 }}>
                    <label className="tauze-label"><Hash size={13} /> Local</label>
                    <input 
                      className="tauze-input"
                      type="text" 
                      placeholder="Ex: Pescoço" 
                      value={tempLocal}
                      onChange={(e) => setTempLocal(e.target.value)}
                    />
                  </div>

                  <div className="tauze-field-group" style={{ margin: 0 }}>
                    <label className="tauze-label"><AlertCircle size={13} /> Carência</label>
                    <input 
                      className="tauze-input"
                      type="number" 
                      placeholder="Dias" 
                      value={tempCarencia}
                      onChange={(e) => setTempCarencia(e.target.value)}
                    />
                  </div>

                  <button 
                    type="button" 
                    onClick={handleAddProduto}
                    disabled={!tempProductName.trim()}
                    style={{
                      height: '38px',
                      width: '42px',
                      borderRadius: '10px',
                      background: tempProductName.trim() ? 'hsl(var(--brand))' : 'hsl(var(--bg-main))',
                      color: tempProductName.trim() ? 'white' : 'hsl(var(--text-muted))',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: tempProductName.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                      alignSelf: 'end'
                    }}
                    title="Adicionar Fármaco"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Added Fármacos List */}
              <div style={{ marginTop: '8px' }}>
                {produtosAplicados.length > 0 && (
                  <h5 style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                    Fármacos Selecionados ({produtosAplicados.length})
                  </h5>
                )}

                {produtosAplicados.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '12px', padding: '16px', border: '1px dashed hsl(var(--border)/0.5)', borderRadius: '12px' }}>
                    Nenhum fármaco adicionado ainda.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {produtosAplicados.map((item, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '10px 14px', 
                          background: 'hsl(var(--bg-main)/0.4)', 
                          border: '1px solid hsl(var(--border)/0.5)',
                          borderRadius: '12px',
                          fontSize: '12.5px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                          <div style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                            {item.produto}
                          </div>
                          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px', fontWeight: 600 }}>
                            Dose: <strong style={{ color: 'hsl(var(--text-main))' }}>{item.dose || 'N/A'}</strong> · Via: <strong style={{ color: 'hsl(var(--text-main))' }}>{item.via_aplicacao}</strong>
                            {item.local_aplicacao && <> · Local: <strong style={{ color: 'hsl(var(--text-main))' }}>{item.local_aplicacao}</strong></>}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                          {item.carencia_dias ? (
                            <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                              Carência: {item.carencia_dias}d
                            </span>
                          ) : (
                            <span style={{ background: 'hsl(142 72% 95%)', color: 'hsl(142 76% 36%)', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                              Sem carência
                            </span>
                          )}
                          
                          <button 
                            type="button" 
                            onClick={() => handleRemoveProduto(index)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {currentStep === 3 && (
        <section className="tauze-form-section animate-slide-up" style={{ margin: 0 }}>
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 03</div>
            <h4 className="tauze-section-title">Carência & Regras de Controle</h4>
          </div>
          
          <div className="tauze-input-grid grid-col-2">
            {formData.tipo === 'vacina' && (
              <div className="tauze-field-group">
                <label className="tauze-label"><BellRing size={14} /> Reforço Agendado (Dias)</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  placeholder="Ex: 21 (Opcional)" 
                  value={formData.reforco_dias}
                  onChange={(e) => setFormData({...formData, reforco_dias: e.target.value})}
                />
              </div>
            )}

            {formData.tipo === 'medicamento' && (
              <div className="tauze-field-group">
                <label className="tauze-label"><AlertCircle size={14} /> Carência Abate/Leite (Dias)</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  placeholder="Ex: 30" 
                  value={formData.carencia_dias}
                  onChange={(e) => setFormData({...formData, carencia_dias: e.target.value})}
                />
              </div>
            )}

            <div className="tauze-field-group" style={{ gridColumn: (formData.tipo === 'vacina' || formData.tipo === 'medicamento') ? 'span 1' : 'span 2' }}>
              <label className="tauze-label"><Activity size={14} /> Status</label>
              <SearchableSelect 
                value={formData.status}
                onChange={(val: any) => setFormData({...formData, status: val})}
                options={[
                  { value: `REALIZADO`, label: `Realizado` },
                  { value: `PENDENTE`, label: `Pendente` },
                ]}
              />
            </div>

            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label"><FileText size={14} /> Observações</label>
              <textarea 
                className="tauze-input tauze-textarea"
                placeholder="Notas adicionais..." 
                value={formData.observacao}
                onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                rows={2}
              />
            </div>

            {/* PAINÉIS ORÁCULOS DE SANIDADE (RISCO E PREDIÇÃO) */}
            {healthStats.bloqueioAbate && (
              <div style={{ gridColumn: 'span 2', marginTop: '12px', padding: '16px', background: 'hsl(0 84% 60% / 0.1)', border: '1.5px dashed hsl(0 84% 60% / 0.4)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(0 84% 45%)', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
                  <ShieldAlert size={18} /> ANIMAL/LOTE BLOQUEADO PARA ABATE E LEITE
                </div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--text-main))', lineHeight: '1.5', marginTop: '8px' }}>
                  Aviso Legal: Respeitando a carência farmacológica informada, a liberação sanitária oficial só ocorrerá no dia <strong style={{ color: 'hsl(0 84% 45%)', fontWeight: 900 }}>{healthStats.bloqueioAbate}</strong>.
                </div>
              </div>
            )}

            {healthStats.dataReforco && (
              <div style={{ gridColumn: 'span 2', marginTop: '12px', padding: '16px', background: 'hsl(217 91% 60% / 0.1)', border: '1.5px dashed hsl(217 91% 60% / 0.4)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(217 91% 50%)', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
                  <Calendar size={18} /> REFORÇO VACINAL AGENDADO
                </div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--text-main))', lineHeight: '1.5', marginTop: '8px' }}>
                  Uma revacinação será cobrada na agenda sanitária da fazenda para o dia <strong style={{ color: 'hsl(217 91% 50%)', fontWeight: 900 }}>{healthStats.dataReforco}</strong>.
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      <style>{`
        .autocomplete-option:hover {
          background: hsl(var(--brand) / 0.1) !important;
          color: hsl(var(--brand)) !important;
        }
        .autocomplete-dropdown::-webkit-scrollbar { width: 6px; }
        .autocomplete-dropdown::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        @keyframes fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease both; }
        .animal-chip:hover { border-color: hsl(var(--brand) / 0.5) !important; }
      `}</style>
    </SidePanel>
  );
};
