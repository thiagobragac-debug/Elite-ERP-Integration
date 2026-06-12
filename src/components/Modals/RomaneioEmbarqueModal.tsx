import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePersistentState } from '../../hooks/usePersistentState';
import toast from 'react-hot-toast';
import { Truck, Scale, Beef, Plus, Trash2, Search, FileText, MapPin, User, Calendar, X, CheckCircle2, Hash, AlertCircle, Filter, ShieldAlert } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { DateInput } from '../../components/Form/DateInput';


// ─── Types ───────────────────────────────────────────────────────────────────

interface Animal {
  id: string;
  brinco: string;
  raca: string;
  peso_atual: number;
  sexo: string;
  categoria: string;
  status: string;
  lote_id?: string;
  em_carencia?: boolean;
}

interface Lote {
  id: string;
  nome: string;
  status: string;
}

interface RomaneioEmbarqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGerarNF: (romaneioData: any) => void;
}

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const RomaneioEmbarqueModal: React.FC<RomaneioEmbarqueModalProps> = ({
  isOpen,
  onClose,
  onGerarNF
}) => {
  const { activeFarmId, activeTenantId } = useFarmFilter();
  const queryClient = useQueryClient();

  // Fetch real lotes
  const { data: realLotes = [] } = useQuery({
    queryKey: ['lotes_embarque', activeFarmId, activeTenantId],
    queryFn: async () => {
      if (!activeFarmId || !activeTenantId) return [];
      const { data, error } = await supabase
        .from('lotes')
        .select('id, nome, status')
        .eq('fazenda_id', activeFarmId)
        .eq('tenant_id', activeTenantId)
        .eq('status', 'ATIVO');
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeFarmId && !!activeTenantId && isOpen
  });

  // Fetch real animals with weight and sanitary carencia check
  const { data: realAnimais = [] } = useQuery({
    queryKey: ['animais_embarque', activeFarmId, activeTenantId],
    queryFn: async () => {
      if (!activeFarmId || !activeTenantId) return [];
      const { data: sanidades } = await supabase
        .from('sanidade')
        .select('lote_id, data_manejo, carencia_dias')
        .eq('tenant_id', activeTenantId)
        .eq('fazenda_id', activeFarmId)
        .gt('carencia_dias', 0);

      const carenciaLotes = new Set<string>();
      const today = new Date();
      sanidades?.forEach((s: any) => {
        if (!s.lote_id || !s.data_manejo || !s.carencia_dias) return;
        const limitDate = new Date(s.data_manejo);
        limitDate.setDate(limitDate.getDate() + s.carencia_dias);
        if (limitDate >= today) {
          carenciaLotes.add(s.lote_id);
        }
      });

      const { data, error } = await supabase
        .from('animais')
        .select(`
          id, brinco, raca, sexo, status, lote_id, peso_entrada,
          pesagens (
            peso,
            data_pesagem
          )
        `)
        .eq('fazenda_id', activeFarmId)
        .eq('tenant_id', activeTenantId)
        .eq('status', 'ATIVO')
        .is('romaneio_id', null);
      
      if (error) throw error;

      return (data || []).map((a: any) => {
        const sortedPesagens = a.pesagens && a.pesagens.length > 0
          ? [...a.pesagens].sort((x: any, y: any) => new Date(y.data_pesagem).getTime() - new Date(x.data_pesagem).getTime())
          : [];
        const peso_atual = sortedPesagens.length > 0 ? Number(sortedPesagens[0].peso) : Number(a.peso_entrada || 500);
        
        let category = 'Boi Gordo';
        if (a.sexo === 'M') {
          if (peso_atual > 500) category = 'Boi Gordo';
          else if (peso_atual > 300) category = 'Garrote';
          else category = 'Bezerro';
        } else {
          if (peso_atual > 450) category = 'Vaca';
          else category = 'Novilha';
        }

        return {
          id: a.id,
          brinco: a.brinco,
          raca: a.raca || 'Nelore',
          sexo: a.sexo,
          status: a.status,
          lote_id: a.lote_id,
          peso_atual,
          categoria: category,
          em_carencia: a.lote_id ? carenciaLotes.has(a.lote_id) : false
        };
      });
    },
    enabled: !!activeFarmId && !!activeTenantId && isOpen
  });

  // Step 1 - Animal selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Animal[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [animaisSelecionados, setAnimaisSelecionados] = useState<Animal[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const [lotSearchQuery, setLotSearchQuery] = useState('');
  const [lotSearchResults, setLotSearchResults] = useState<Lote[]>([]);
  const [showLotDropdown, setShowLotDropdown] = useState(false);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const lotSearchRef = useRef<HTMLDivElement>(null);

  // Advanced Filters
  const [pesoMin, setPesoMin] = useState('');
  const [pesoMax, setPesoMax] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [ocultarCarencia, setOcultarCarencia] = useState(false);
  
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Step 2 - Embarque data
  const [formData, setFormData] = usePersistentState('RomaneioEmbarqueModal_formData', {
    comprador: '',
    data_embarque: getTodayStr(),
    destino: '',
    gta_numero: '',
    placa_veiculo: '',
    motorista: '',
    observacoes: ''
  });

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const isSubmitting = saving;

  // Derived values
  const pesoTotal = animaisSelecionados.reduce((sum, a) => sum + a.peso_atual, 0);
  const custoMedio = animaisSelecionados.length > 0
    ? (pesoTotal / animaisSelecionados.length).toFixed(1)
    : '0';

  const isFilterActive = !!(selectedLote || pesoMin || pesoMax || filtroSexo || filtroCategoria || ocultarCarencia);

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setShowDropdown(false);
      setAnimaisSelecionados([]);
      setFormData({
        comprador: '',
        data_embarque: getTodayStr(),
        destino: '',
        gta_numero: '',
        placa_veiculo: '',
        motorista: '',
        observacoes: ''
      });
      setLotSearchQuery('');
      setLotSearchResults([]);
      setShowLotDropdown(false);
      setSelectedLote(null);
      setPesoMin('');
      setPesoMax('');
      setFiltroSexo('');
      setFiltroCategoria('');
      setOcultarCarencia(false);
      setCurrentStep(1);
    }
  }, [isOpen, setFormData]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (lotSearchRef.current && !lotSearchRef.current.contains(e.target as Node)) {
        setShowLotDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLotSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setLotSearchQuery(q);
    setSelectedLote(null);
    setSearchQuery('');
    
    if (q.trim().length === 0) {
      setLotSearchResults([]);
      setShowLotDropdown(false);
      return;
    }
    const filtered = realLotes.filter(
      (l: any) => l.nome.toLowerCase().includes(q.toLowerCase()) && l.status === 'ATIVO'
    );
    setLotSearchResults(filtered);
    setShowLotDropdown(true);
  };

  const handleSelectLote = (lote: Lote) => {
    setSelectedLote(lote);
    setLotSearchQuery(lote.nome);
    setShowLotDropdown(false);
    setShowDropdown(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleAddAnimal = (animal: Animal) => {
    setAnimaisSelecionados(prev => [...prev, animal]);
  };

  const handleRemoveAnimal = (id: string) => {
    setAnimaisSelecionados(prev => prev.filter(a => a.id !== id));
  };

  const handleAddAllFiltered = () => {
    setAnimaisSelecionados(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const toAdd = searchResults.filter(a => !existingIds.has(a.id));
      return [...prev, ...toAdd];
    });
    setSearchQuery('');
    setShowDropdown(false);
  };

  const applyFilters = () => {
    const selectedIds = new Set(animaisSelecionados.map(a => a.id));
    const filtered = realAnimais.filter((a: Animal) => {
      if (selectedIds.has(a.id)) return false;
      if (selectedLote && a.lote_id !== selectedLote.id) return false;
      if (ocultarCarencia && a.em_carencia) return false;
      if (filtroSexo && a.sexo !== filtroSexo) return false;
      if (filtroCategoria && a.categoria !== filtroCategoria) return false;
      if (pesoMin && a.peso_atual < Number(pesoMin)) return false;
      if (pesoMax && a.peso_atual > Number(pesoMax)) return false;
      
      const q = searchQuery.toLowerCase();
      if (q) {
        return a.brinco.toLowerCase().includes(q) ||
               a.raca.toLowerCase().includes(q) ||
               a.categoria.toLowerCase().includes(q);
      }
      return true;
    });
    setSearchResults(filtered);
  };

  useEffect(() => {
    if (isOpen) {
      applyFilters();
    }
  }, [searchQuery, selectedLote, ocultarCarencia, filtroSexo, filtroCategoria, pesoMin, pesoMax, animaisSelecionados, isOpen, realAnimais]);

  const saveRomaneio = async (status: 'Pendente' | 'Concluído') => {
    if (!activeFarmId || !activeTenantId) {
      toast.error('Fazenda ou Tenant não selecionados.');
      return;
    }
    if (animaisSelecionados.length === 0) {
      toast.error('Selecione ao menos um animal para o embarque.');
      return;
    }
    if (!formData.comprador) {
      toast.error('Informe o Comprador / Destinatário.');
      return;
    }
    if (!formData.data_embarque) {
      toast.error('Informe a Data do Embarque.');
      return;
    }

    setSaving(true);
    try {
      const nfeCode = status === 'Concluído' 
        ? `NFE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        : null;

      // Insert Romaneio
      const { data: romaneio, error: romaneioError } = await supabase
        .from('romaneios')
        .insert({
          tenant_id: activeTenantId,
          fazenda_id: activeFarmId,
          data: formData.data_embarque,
          comprador: formData.comprador,
          destino: formData.destino,
          placa: formData.placa_veiculo,
          motorista: formData.motorista,
          animais_qtd: animaisSelecionados.length,
          valor_estimado: pesoTotal * 11, // Estimativa R$ 11/kg (aprox R$ 330/@)
          status,
          nfe: nfeCode,
          observacoes: formData.observacoes
        })
        .select()
        .single();

      if (romaneioError) throw romaneioError;

      // Update animals' romaneio_id and status
      const animalUpdate: any = { romaneio_id: romaneio.id };
      if (status === 'Concluído') {
        animalUpdate.status = 'Abatido';
      }

      const { error: animalError } = await supabase
        .from('animais')
        .update(animalUpdate)
        .in('id', animaisSelecionados.map(a => a.id));

      if (animalError) throw animalError;

      toast.success(status === 'Concluído' 
        ? 'Romaneio concluído e animais atualizados para Abatido!' 
        : 'Romaneio salvo como Pendente!'
      );

      queryClient.invalidateQueries({ queryKey: ['romaneios_list'] });
      queryClient.invalidateQueries({ queryKey: ['animais_embarque'] });
      
      onGerarNF({
        comprador: formData.comprador,
        status,
        nfe: nfeCode
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao salvar romaneio: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarRomaneio = () => {
    saveRomaneio('Pendente');
  };

  const handleGerarNFe = () => {
    saveRomaneio('Concluído');
  };

  // ─── Footer ──────────────────────────────────────────────────────────────────

  const customFooter = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      {/* Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '10px',
          background: 'hsl(var(--bg-main))',
          border: '1px solid hsl(var(--border))'
        }}>
          <Beef size={14} style={{ color: 'hsl(var(--brand))' }} />
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
            {animaisSelecionados.length} <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 600 }}>animais</span>
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '10px',
          background: 'hsl(var(--bg-main))',
          border: '1px solid hsl(var(--border))'
        }}>
          <Scale size={14} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
            {pesoTotal.toLocaleString('pt-BR')} <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 600 }}>kg total</span>
          </span>
        </div>
        {animaisSelecionados.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '10px',
            background: 'hsl(142 71% 45% / 0.08)',
            border: '1px solid hsl(142 71% 45% / 0.2)'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
              Média: <strong style={{ color: '#10b981' }}>{custoMedio} kg/@</strong>
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={onClose}
          className="glass-btn secondary"
          style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSalvarRomaneio}
          disabled={isSubmitting}
          className="glass-btn"
          style={{
            padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            border: '1px solid hsl(var(--border))',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <FileText size={15} />
          Salvar Romaneio
        </button>

        <button
          type="button"
          onClick={handleGerarNFe}
          disabled={isSubmitting || animaisSelecionados.length === 0}
          style={{
            padding: '10px 22px', borderRadius: '12px', fontSize: '13px', fontWeight: 900,
            cursor: isSubmitting || animaisSelecionados.length === 0 ? 'not-allowed' : 'pointer',
            opacity: animaisSelecionados.length === 0 ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#fff',
            border: 'none',
            boxShadow: animaisSelecionados.length > 0 ? '0 4px 16px rgba(16, 185, 129, 0.4)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Truck size={15} />
          Salvar e Gerar NF-e de Saída
        </button>
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes romaneioSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(8px)' }}>
        <div 
          style={{
            position: 'fixed',
            top: 0, bottom: 0, right: 0,
            width: '900px',
            maxWidth: '100vw',
            background: 'hsl(var(--bg-main))',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'romaneioSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            zIndex: 10001,
            borderLeft: '1px solid hsl(var(--border))'
          }}
        >
          {/* Header */}
          <div style={{ padding: '32px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card))', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Truck size={28} style={{ color: 'hsl(var(--brand))' }} />
                  Romaneio de Embarque
                </h2>
                <p style={{ color: 'hsl(var(--text-muted))', margin: 0, fontSize: '14px' }}>
                  Selecione os animais e preencha os dados para emissão da NF-e de Saída de gado.
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '8px' }}>
                <X size={24} />
              </button>
            </div>

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: currentStep === 1 ? 1 : 0.4, cursor: 'pointer' }} onClick={() => setCurrentStep(1)}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentStep === 1 ? 'hsl(var(--brand))' : 'hsl(var(--bg-main))', color: currentStep === 1 ? '#fff' : 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>1</div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: currentStep === 1 ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))' }}>Seleção de Animais</span>
              </div>
              <div style={{ height: '1px', width: '40px', background: 'hsl(var(--border))' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: currentStep === 2 ? 1 : 0.4, cursor: animaisSelecionados.length > 0 ? 'pointer' : 'not-allowed' }} onClick={() => { if(animaisSelecionados.length > 0) setCurrentStep(2) }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentStep === 2 ? 'hsl(var(--brand))' : 'hsl(var(--bg-main))', color: currentStep === 2 ? '#fff' : 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>2</div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: currentStep === 2 ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))' }}>Dados e Documentação</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Main Toolbar */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', position: 'relative' }}>
                  {/* Main Animal Search Field */}
                  <div style={{ position: 'relative', flex: 1 }} ref={searchRef}>
                    <Search
                      size={16}
                      style={{
                        position: 'absolute', left: '14px', top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'hsl(var(--text-muted))',
                        pointerEvents: 'none'
                      }}
                    />
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder={selectedLote ? `Buscar animal no lote ${selectedLote.nome}...` : "Buscar por brinco, raça ou categoria..."}
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => {
                        if (searchResults.length > 0) setShowDropdown(true);
                        else if (selectedLote) {
                          const selectedIds = new Set(animaisSelecionados.map(a => a.id));
                          const lotAnimals = realAnimais.filter(a => a.lote_id === selectedLote.id && !selectedIds.has(a.id));
                          if (lotAnimals.length > 0) {
                            setSearchResults(lotAnimals);
                            setShowDropdown(true);
                          }
                        }
                      }}
                      style={{ paddingLeft: '42px', paddingRight: '40px' }}
                      autoComplete="off"
                    />
                    
                    {/* Clear Button */}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer',
                          padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}

                    {/* Dropdown */}
                    {showDropdown && searchResults.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0, right: 0,
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '14px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                        zIndex: 1000,
                        overflow: 'hidden',
                        maxHeight: '340px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{ padding: '12px', borderBottom: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--bg-main))' }}>
                          <button
                            type="button"
                            onClick={handleAddAllFiltered}
                            style={{
                              width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 800,
                              background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.2)',
                              cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.15)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.1)')}
                          >
                            <Plus size={16} /> Adicionar Todos os {searchResults.length} Resultados
                          </button>
                        </div>
                        <div style={{ overflowY: 'auto' }}>
                          {searchResults.map((animal, idx) => (
                            <div
                              key={animal.id}
                              onClick={() => handleAddAnimal(animal)}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: idx < searchResults.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.06)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                  width: '36px', height: '36px', borderRadius: '10px',
                                  background: 'hsl(var(--brand) / 0.1)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'hsl(var(--brand))', flexShrink: 0
                                }}>
                                  <Beef size={16} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                                    #{animal.brinco}
                                    <span style={{
                                      marginLeft: '8px', fontSize: '10px', fontWeight: 700,
                                      background: animal.sexo === 'M' ? 'hsl(217 91% 60% / 0.12)' : 'hsl(316 73% 69% / 0.12)',
                                      color: animal.sexo === 'M' ? 'hsl(217 91% 60%)' : 'hsl(316 73% 60%)',
                                      padding: '1px 6px', borderRadius: '4px'
                                    }}>
                                      {animal.sexo === 'M' ? 'Macho' : 'Fêmea'}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {animal.raca} · {animal.categoria}
                                    {animal.em_carencia && (
                                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#ef4444', background: '#ef444420', padding: '2px 6px', borderRadius: '4px' }}>EM CARÊNCIA</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 900, color: '#10b981' }}>
                                  {animal.peso_atual} kg
                                </span>
                                <div style={{
                                  width: '28px', height: '28px', borderRadius: '8px',
                                  background: 'hsl(var(--brand) / 0.1)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'hsl(var(--brand))'
                                }}>
                                  <Plus size={14} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {showDropdown && searchQuery.length > 0 && searchResults.length === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0, right: 0,
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '14px',
                        padding: '20px',
                        textAlign: 'center',
                        zIndex: 1000,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
                      }}>
                        <AlertCircle size={20} style={{ color: 'hsl(var(--text-muted))', marginBottom: '6px' }} />
                        <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0, fontWeight: 600 }}>
                          Nenhum animal encontrado com "{searchQuery}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Filters Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    style={{
                      height: '46px',
                      padding: '0 20px',
                      borderRadius: '12px',
                      border: `1px solid ${isFilterActive || showFiltersPanel ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                      background: showFiltersPanel ? 'hsl(var(--brand) / 0.05)' : 'hsl(var(--bg-card))',
                      color: isFilterActive || showFiltersPanel ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <Filter size={16} />
                    Filtros
                    {isFilterActive && (
                      <div style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: '#10b981', border: '2px solid hsl(var(--bg-card))'
                      }} />
                    )}
                  </button>

                  {/* Collapsible Filters Panel (Now as a Popover) */}
                  {showFiltersPanel && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 900 }} onClick={() => setShowFiltersPanel(false)} />
                      <div style={{ 
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '640px',
                        maxWidth: '100vw',
                        zIndex: 1000,
                        background: 'hsl(var(--bg-card))', 
                        padding: '24px', 
                        borderRadius: '16px', 
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px hsl(var(--brand)/0.1)',
                        animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        transformOrigin: 'top right'
                      }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                          
                          {/* Lot Filter (Moved here) */}
                          <div style={{ flex: '1 1 300px', position: 'relative' }} ref={lotSearchRef}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '6px' }}>Filtrar por Lote</label>
                            <div style={{ position: 'relative' }}>
                              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                              <input
                                className="tauze-input"
                                type="text"
                                placeholder="Buscar lote ativo..."
                                value={lotSearchQuery}
                                onChange={handleLotSearchChange}
                                onFocus={() => { if (lotSearchResults.length > 0) setShowLotDropdown(true); }}
                                style={{ paddingLeft: '36px', height: '38px', fontSize: '13px', borderColor: selectedLote ? 'hsl(var(--brand))' : undefined }}
                                autoComplete="off"
                              />
                              {selectedLote && (
                                <button type="button" onClick={() => { setSelectedLote(null); setLotSearchQuery(''); setSearchQuery(''); setSearchResults([]); }}
                                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                            {/* Lot Dropdown Inside Panel */}
                            {showLotDropdown && lotSearchResults.length > 0 && (
                              <div style={{
                                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'hsl(var(--bg-card))',
                                border: '1px solid hsl(var(--border))', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                zIndex: 1001, maxHeight: '200px', overflowY: 'auto'
                              }}>
                                {lotSearchResults.map((lote) => (
                                  <div key={lote.id} onClick={() => handleSelectLote(lote)}
                                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid hsl(var(--border)/0.5)', fontSize: '12px', fontWeight: 700 }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand)/0.06)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                                    {lote.nome}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Peso Filters */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '6px' }}>Peso Mínimo (kg)</label>
                              <input type="number" className="tauze-input" style={{ width: '100px', height: '38px', fontSize: '13px' }} placeholder="Ex: 400" value={pesoMin} onChange={(e) => setPesoMin(e.target.value)} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '6px' }}>Peso Máximo (kg)</label>
                              <input type="number" className="tauze-input" style={{ width: '100px', height: '38px', fontSize: '13px' }} placeholder="Ex: 600" value={pesoMax} onChange={(e) => setPesoMax(e.target.value)} />
                            </div>
                          </div>

                          {/* Sexo Chips */}
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '6px' }}>Sexo</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {['M', 'F'].map(sex => (
                                <button key={sex} type="button" onClick={() => setFiltroSexo(filtroSexo === sex ? '' : sex)}
                                  style={{ height: '38px', padding: '0 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                    background: filtroSexo === sex ? 'hsl(var(--brand))' : 'hsl(var(--bg-card))',
                                    color: filtroSexo === sex ? '#fff' : 'hsl(var(--text-main))',
                                    border: `1px solid ${filtroSexo === sex ? 'transparent' : 'hsl(var(--border))'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                                  {sex === 'M' ? 'Machos' : 'Fêmeas'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Categoria Chips */}
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '6px' }}>Categoria</label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {['Boi Gordo', 'Vaca', 'Novilha', 'Garrote'].map(cat => (
                                <button key={cat} type="button" onClick={() => setFiltroCategoria(filtroCategoria === cat ? '' : cat)}
                                  style={{ height: '38px', padding: '0 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                    background: filtroCategoria === cat ? 'hsl(var(--brand))' : 'hsl(var(--bg-card))',
                                    color: filtroCategoria === cat ? '#fff' : 'hsl(var(--text-main))',
                                    border: `1px solid ${filtroCategoria === cat ? 'transparent' : 'hsl(var(--border))'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Carencia Toggle */}
                          <div style={{ flex: '1 1 100%', borderTop: '1px dashed hsl(var(--border)/0.8)', marginTop: '4px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', height: '36px', background: ocultarCarencia ? 'hsl(142 71% 45% / 0.1)' : 'transparent', padding: '0 12px', borderRadius: '8px', border: ocultarCarencia ? '1px solid hsl(142 71% 45% / 0.3)' : '1px solid transparent', transition: 'all 0.2s' }}>
                              <ShieldAlert size={16} style={{ color: ocultarCarencia ? '#10b981' : 'hsl(var(--text-muted))' }} />
                              <label style={{ fontSize: '12px', fontWeight: 700, color: ocultarCarencia ? '#10b981' : 'hsl(var(--text-main))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="checkbox" checked={ocultarCarencia} onChange={(e) => setOcultarCarencia(e.target.checked)}
                                  style={{ accentColor: '#10b981', width: '14px', height: '14px', cursor: 'pointer' }} />
                                Ocultar animais em Carência Sanitária
                              </label>
                            </div>

                            {isFilterActive && (
                              <button
                                type="button"
                                onClick={() => { setShowDropdown(true); setShowFiltersPanel(false); }}
                                style={{
                                  padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 800,
                                  background: 'hsl(var(--brand))', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                  boxShadow: '0 4px 14px hsl(var(--brand)/0.3)'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                              >
                                Exibir {searchResults.length} Resultados
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Selected Animals Table */}
                {animaisSelecionados.length === 0 ? (
                  <div style={{
                    border: '2px dashed hsl(var(--border) / 0.6)',
                    borderRadius: '16px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    background: 'hsl(var(--bg-main) / 0.3)'
                  }}>
                    <Beef size={32} style={{ color: 'hsl(var(--text-muted) / 0.4)', marginBottom: '12px' }} />
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                      Nenhum animal selecionado
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'hsl(var(--text-muted) / 0.7)' }}>
                      Use a busca e os filtros acima para adicionar animais ao embarque
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'hsl(var(--bg-card))'
                    }}>
                      {/* Table Header */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.5fr 1.2fr 1.5fr auto',
                        gap: '0',
                        padding: '10px 16px',
                        background: 'hsl(var(--bg-main))',
                        borderBottom: '1px solid hsl(var(--border))'
                      }}>
                        {['# Brinco', 'Raça', 'Peso Atual', 'Categoria', ''].map((h, i) => (
                          <div key={i} style={{
                            fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            textAlign: i === 4 ? 'center' : 'left'
                          }}>
                            {h}
                          </div>
                        ))}
                      </div>

                      {/* Table Rows */}
                      <div>
                        {animaisSelecionados.map((animal, idx) => (
                          <div
                            key={animal.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '2fr 1.5fr 1.2fr 1.5fr auto',
                              gap: '0',
                              padding: '12px 16px',
                              borderBottom: idx < animaisSelecionados.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                              background: idx % 2 === 0 ? 'hsl(var(--bg-card))' : 'hsl(var(--bg-main) / 0.3)',
                              transition: 'background 0.15s',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.04)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'hsl(var(--bg-card))' : 'hsl(var(--bg-main) / 0.3)')}
                          >
                            {/* Brinco */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'hsl(var(--brand) / 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'hsl(var(--brand))', flexShrink: 0, fontSize: '11px', fontWeight: 900
                              }}>
                                {idx + 1}
                              </div>
                              <span style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                                #{animal.brinco}
                              </span>
                              <span style={{
                                fontSize: '9px', fontWeight: 800,
                                background: animal.sexo === 'M' ? 'hsl(217 91% 60% / 0.12)' : 'hsl(316 73% 69% / 0.12)',
                                color: animal.sexo === 'M' ? 'hsl(217 91% 60%)' : 'hsl(316 73% 60%)',
                                padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'
                              }}>
                                {animal.sexo === 'M' ? '♂' : '♀'}
                              </span>
                            </div>

                            {/* Raça */}
                            <div style={{ fontSize: '13px', color: 'hsl(var(--text-main))', fontWeight: 600 }}>
                              {animal.raca}
                            </div>

                            {/* Peso */}
                            <div style={{ fontWeight: 800, fontSize: '13px', color: '#10b981' }}>
                              {animal.peso_atual} kg
                            </div>

                            {/* Categoria */}
                            <div>
                              <span style={{
                                fontSize: '11px', fontWeight: 700,
                                background: 'hsl(var(--brand) / 0.1)',
                                color: 'hsl(var(--brand))',
                                padding: '3px 10px', borderRadius: '6px'
                              }}>
                                {animal.categoria}
                              </span>
                            </div>

                            {/* Remove */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveAnimal(animal.id)}
                                title="Remover animal"
                                style={{
                                  width: '30px', height: '30px', borderRadius: '8px',
                                  background: 'hsl(0 84% 60% / 0.08)',
                                  border: '1px solid hsl(0 84% 60% / 0.2)',
                                  color: 'hsl(0 84% 60%)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'hsl(0 84% 60% / 0.15)';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'hsl(0 84% 60% / 0.08)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary Footer */}
                    <div style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, hsl(var(--brand) / 0.06) 0%, hsl(142 71% 45% / 0.06) 100%)',
                      border: '1px solid hsl(var(--brand) / 0.15)',
                      borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                          {animaisSelecionados.length} {animaisSelecionados.length === 1 ? 'animal selecionado' : 'animais selecionados'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                          Peso total: <strong style={{ color: '#10b981', fontWeight: 900 }}>{pesoTotal.toLocaleString('pt-BR')} kg</strong>
                        </span>
                        <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                          Média: <strong style={{ color: 'hsl(var(--brand))', fontWeight: 900 }}>{custoMedio} kg</strong>
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Row 1: Comprador, Destino, Data */}
                <div className="tauze-input-grid grid-col-3" style={{ marginBottom: '16px' }}>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <User size={14} /> Comprador / Destinatário
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Nome do comprador ou empresa"
                      value={formData.comprador}
                      onChange={(e) => setFormData({ ...formData, comprador: e.target.value })}
                      required
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <MapPin size={14} /> Destino
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Ex: Frigorífico X, Fazenda ABC"
                      value={formData.destino}
                      onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Calendar size={14} /> Data do Embarque
                    </label>
                    <DateInput
                      className="tauze-input"
                      type="date"
                      value={formData.data_embarque}
                      onChange={(e) => setFormData({ ...formData, data_embarque: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Row 2: GTA, Placa, Motorista */}
                <div className="tauze-input-grid grid-col-3" style={{ marginBottom: '16px' }}>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Hash size={14} /> GTA Saída — Número
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Ex: GTA-2024-00123"
                      value={formData.gta_numero}
                      onChange={(e) => setFormData({ ...formData, gta_numero: e.target.value })}
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Truck size={14} /> Placa do Veículo
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Ex: ABC-1234"
                      value={formData.placa_veiculo}
                      onChange={(e) => setFormData({ ...formData, placa_veiculo: e.target.value.toUpperCase() })}
                      style={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <User size={14} /> Motorista
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Nome completo do motorista"
                      value={formData.motorista}
                      onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row 4: Observações */}
                <div className="tauze-input-grid grid-col-1">
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <FileText size={14} /> Observações
                    </label>
                    <textarea
                      className="tauze-input tauze-textarea"
                      placeholder="Informações adicionais sobre o embarque, condições, acordos especiais..."
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      style={{ minHeight: '80px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-muted))', background: 'transparent', border: '1px solid hsl(var(--border))', cursor: 'pointer' }}>
                CANCELAR
              </button>
              {animaisSelecionados.length > 0 && currentStep === 1 && (
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                  <strong style={{ color: '#10b981' }}>{animaisSelecionados.length}</strong> animais selecionados
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              {currentStep === 2 && (
                <button onClick={() => setCurrentStep(1)} style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))', background: 'hsl(var(--bg-main))', border: 'none', cursor: 'pointer' }}>
                  ⬅ Voltar
                </button>
              )}

              {currentStep === 1 ? (
                <button 
                  onClick={() => setCurrentStep(2)}
                  disabled={animaisSelecionados.length === 0}
                  style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, color: '#fff', background: 'hsl(var(--brand))', border: 'none', cursor: 'pointer', opacity: animaisSelecionados.length === 0 ? 0.5 : 1, transition: 'all 0.2s' }}
                >
                  Próximo: Documentação ➔
                </button>
              ) : (
                <button 
                  onClick={handleGerarNFe} 
                  disabled={saving}
                  style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, color: '#fff', background: '#10b981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
                >
                  {saving ? 'SALVANDO...' : '💾 Salvar e Gerar Romaneio'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};