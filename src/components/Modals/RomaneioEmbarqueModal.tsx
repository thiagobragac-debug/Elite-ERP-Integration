import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';
import toast from 'react-hot-toast';
import {
  Truck,
  Scale,
  Beef,
  Plus,
  Trash2,
  Search,
  FileText,
  MapPin,
  User,
  Calendar,
  X,
  CheckCircle2,
  Hash,
  AlertCircle,
  Filter,
  ShieldAlert,
  ArrowRight,
  ChevronLeft,
  Check,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Package,
} from 'lucide-react';
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
  lote_nome?: string;
  em_carencia?: boolean;
}

interface Lote {
  id: string;
  nome: string;
  status: string;
}

interface FormData {
  comprador: string;
  comprador_cnpj: string;
  data_embarque: string;
  destino: string;
  gta_numero: string;
  gta_serie: string;
  nfe_numero: string;
  placa_veiculo: string;
  tipo_veiculo: string;
  motorista: string;
  preco_por_arroba: string;
  observacoes: string;
}

interface RomaneioEmbarqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGerarNF: (romaneioData: any) => void;
  initialData?: any;
}

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const PRECO_ARROBA_DEFAULT = '330.00';

// ─── Animal Card (disponível) ─────────────────────────────────────────────────

const AnimalCard: React.FC<{
  animal: Animal;
  onAdd: (animal: Animal) => void;
}> = ({ animal, onAdd }) => {
  const arrobas = (animal.peso_atual / 30).toFixed(1);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px solid hsl(var(--border))',
        background: 'hsl(var(--bg-card))',
        cursor: 'pointer',
        transition: 'all 0.15s',
        gap: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--brand) / 0.5)';
        e.currentTarget.style.background = 'hsl(var(--brand) / 0.03)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--border))';
        e.currentTarget.style.background = 'hsl(var(--bg-card))';
      }}
      onClick={() => onAdd(animal)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'hsl(var(--brand) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--brand))',
            flexShrink: 0,
          }}
        >
          <Beef size={16} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
              #{animal.brinco}
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                background: animal.sexo === 'M' ? 'hsl(217 91% 60% / 0.12)' : 'hsl(316 73% 69% / 0.12)',
                color: animal.sexo === 'M' ? 'hsl(217 91% 60%)' : 'hsl(316 73% 60%)',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              {animal.sexo === 'M' ? '♂ M' : '♀ F'}
            </span>
            {animal.em_carencia && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#ef4444',
                  background: '#ef444418',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <ShieldAlert size={9} /> CARÊNCIA
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
            {animal.raca} · {animal.categoria}
            {animal.lote_nome && (
              <span style={{ color: 'hsl(var(--brand))', marginLeft: '4px' }}>· {animal.lote_nome}</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 900, fontSize: '13px', color: '#10b981' }}>
            {animal.peso_atual.toLocaleString('pt-BR')} kg
          </div>
          <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{arrobas} @</div>
        </div>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: 'hsl(var(--brand) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--brand))',
          }}
        >
          <Plus size={14} />
        </div>
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

import { SidePanel } from '../Layout/SidePanel';

export const RomaneioEmbarqueModal: React.FC<RomaneioEmbarqueModalProps> = ({
  isOpen,
  onClose,
  onGerarNF,
}) => {
  const { activeFarmId, activeTenantId } = useFarmFilter();
  const queryClient = useQueryClient();

  // ── Fetch Fazenda Settings ───────────────────────────────────────────────
  const { data: fazendaSettings } = useQuery({
    queryKey: ['fazenda_settings', activeFarmId],
    queryFn: async () => {
      if (!activeFarmId) return null;
      const { data, error } = await supabase
        .from('fazendas')
        .select('configuracoes')
        .eq('id', activeFarmId)
        .single();
      if (error) throw error;
      return (data?.configuracoes as any) || {};
    },
    enabled: !!activeFarmId && isOpen,
  });

  // ── Fetch lotes ──────────────────────────────────────────────────────────
  const { data: realLotes = [] } = useQuery<Lote[]>({
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
    enabled: !!activeFarmId && !!activeTenantId && isOpen,
  });

  // ── Fetch animals ────────────────────────────────────────────────────────
  const { data: realAnimais = [], isLoading: loadingAnimais } = useQuery<Animal[]>({
    queryKey: ['animais_embarque', activeFarmId, activeTenantId],
    queryFn: async () => {
      if (!activeFarmId || !activeTenantId) return [];

      // Carência check
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
        if (limitDate >= today) carenciaLotes.add(s.lote_id);
      });

      const { data, error } = await supabase
        .from('animais')
        .select(`
          id, brinco, raca, sexo, status, lote_id, peso_entrada,
          lotes ( nome ),
          pesagens ( peso, data_pesagem )
        `)
        .eq('tenant_id', activeTenantId)
        .eq('fazenda_id', activeFarmId)
        .in('status', ['ATIVO', 'Ativo', 'ativo', 'ATIVO_CONFINAMENTO'])
        .is('romaneio_id', null);

      if (error) throw error;

      return (data || []).map((a: any) => {
        const sortedPesagens =
          a.pesagens && a.pesagens.length > 0
            ? [...a.pesagens].sort(
                (x: any, y: any) =>
                  new Date(y.data_pesagem).getTime() - new Date(x.data_pesagem).getTime()
              )
            : [];
        const peso_atual =
          sortedPesagens.length > 0 ? Number(sortedPesagens[0].peso) : Number(a.peso_entrada || 450);

        let categoria = 'Boi Gordo';
        if (a.sexo === 'M') {
          categoria = peso_atual > 500 ? 'Boi Gordo' : peso_atual > 300 ? 'Garrote' : 'Bezerro';
        } else {
          categoria = peso_atual > 450 ? 'Vaca' : 'Novilha';
        }

        return {
          id: a.id,
          brinco: a.brinco,
          raca: a.raca || 'Nelore',
          sexo: a.sexo,
          status: a.status,
          lote_id: a.lote_id,
          lote_nome: a.lotes?.nome,
          peso_atual,
          categoria,
          em_carencia: a.lote_id ? carenciaLotes.has(a.lote_id) : false,
        };
      });
    },
    enabled: !!activeFarmId && !!activeTenantId && isOpen,
  });

  // ── Step 1 state ─────────────────────────────────────────────────────────
  const [animaisSelecionados, setAnimaisSelecionados] = useState<Animal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroLoteId, setFiltroLoteId] = useState('');
  const [pesoMin, setPesoMin] = useState('');
  const [pesoMax, setPesoMax] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [ocultarCarencia, setOcultarCarencia] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ── Step 2 state ─────────────────────────────────────────────────────────
  const [formData, setFormData] = usePersistentState<FormData>('RomaneioEmbarqueModal_formData_v2', {
    comprador: '',
    comprador_cnpj: '',
    data_embarque: getTodayStr(),
    destino: '',
    gta_numero: '',
    gta_serie: '',
    nfe_numero: '',
    placa_veiculo: '',
    tipo_veiculo: 'TRUCK',
    motorista: '',
    preco_por_arroba: PRECO_ARROBA_DEFAULT,
    observacoes: '',
  });

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedIds = useMemo(() => new Set(animaisSelecionados.map((a) => a.id)), [animaisSelecionados]);
  const pesoTotal = useMemo(
    () => animaisSelecionados.reduce((sum, a) => sum + a.peso_atual, 0),
    [animaisSelecionados]
  );
  const arrobasTotal = (pesoTotal / 30).toFixed(1);
  const valorEstimado = useMemo(() => {
    const preco = parseFloat(formData.preco_por_arroba) || 330;
    return (parseFloat(arrobasTotal) * preco).toFixed(2);
  }, [arrobasTotal, formData.preco_por_arroba]);

  const animaisDisponiveis = useMemo(() => {
    return realAnimais.filter((a) => {
      if (selectedIds.has(a.id)) return false;
      if (filtroLoteId && a.lote_id !== filtroLoteId) return false;
      if (ocultarCarencia && a.em_carencia) return false;
      if (filtroSexo && a.sexo !== filtroSexo) return false;
      if (filtroCategoria && a.categoria !== filtroCategoria) return false;
      if (pesoMin && a.peso_atual < Number(pesoMin)) return false;
      if (pesoMax && a.peso_atual > Number(pesoMax)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.brinco.toLowerCase().includes(q) ||
          a.raca.toLowerCase().includes(q) ||
          a.categoria.toLowerCase().includes(q) ||
          (a.lote_nome || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [realAnimais, selectedIds, filtroLoteId, ocultarCarencia, filtroSexo, filtroCategoria, pesoMin, pesoMax, searchQuery]);

  const isFilterActive = !!(filtroLoteId || pesoMin || pesoMax || filtroSexo || filtroCategoria || ocultarCarencia);
  const carenciaCount = animaisDisponiveis.filter((a) => a.em_carencia).length;

  // ── Reset on close ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setAnimaisSelecionados([]);
      setSearchQuery('');
      setFiltroLoteId('');
      setPesoMin('');
      setPesoMax('');
      setFiltroSexo('');
      setFiltroCategoria('');
      setOcultarCarencia(false);
      setShowFilters(false);
      setCurrentStep(1);
      setFormData({
        comprador: '',
        comprador_cnpj: '',
        data_embarque: getTodayStr(),
        destino: '',
        gta_numero: '',
        gta_serie: '',
        nfe_numero: '',
        placa_veiculo: '',
        tipo_veiculo: 'TRUCK',
        motorista: '',
        preco_por_arroba: PRECO_ARROBA_DEFAULT,
        observacoes: '',
      });
    }
  }, [isOpen, setFormData]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddAnimal = (animal: Animal) => {
    setAnimaisSelecionados((prev) => [...prev, animal]);
  };

  const handleRemoveAnimal = (id: string) => {
    setAnimaisSelecionados((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddAllFiltered = () => {
    setAnimaisSelecionados((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const toAdd = animaisDisponiveis.filter((a) => !existingIds.has(a.id));
      if (toAdd.length === 0) {
        toast('Todos os animais filtrados já foram adicionados.', { icon: 'ℹ️' });
        return prev;
      }
      return [...prev, ...toAdd];
    });
  };

  const handleClearFilters = () => {
    setFiltroLoteId('');
    setPesoMin('');
    setPesoMax('');
    setFiltroSexo('');
    setFiltroCategoria('');
    setOcultarCarencia(false);
    setSearchQuery('');
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const saveRomaneio = async () => {
    if (!activeFarmId || !activeTenantId) {
      toast.error('Fazenda ou Tenant não selecionados.');
      return;
    }
    if (animaisSelecionados.length === 0) {
      toast.error('Selecione ao menos um animal para o embarque.');
      return;
    }
    if (!formData.comprador.trim()) {
      toast.error('Informe o Comprador / Destinatário.');
      return;
    }
    if (!formData.data_embarque) {
      toast.error('Informe a Data do Embarque.');
      return;
    }
    if (!formData.gta_numero.trim()) {
      toast.error('O número da GTA é obrigatório para confirmar o embarque.');
      return;
    }

    // Validações de configuração da fazenda
    if (fazendaSettings) {
      const pesoMinimoConfig = fazendaSettings.peso_minimo_abate_kg;
      if (pesoMinimoConfig && (pesoTotal / animaisSelecionados.length) < pesoMinimoConfig) {
        toast.error(`O peso médio (${(pesoTotal / animaisSelecionados.length).toFixed(1)} kg) está abaixo do mínimo configurado (${pesoMinimoConfig} kg).`);
        return;
      }

      const maxVeiculos: Record<string, number> = {
        'TRUCK': fazendaSettings.capacidade_max_truck || 18,
        'CARRETA': fazendaSettings.capacidade_max_carreta || 25,
        'BI_TREM': fazendaSettings.capacidade_max_bitrem || 32,
        'RODO_TREM': fazendaSettings.capacidade_max_rodotrem || 45,
      };
      const maxPermitido = maxVeiculos[formData.tipo_veiculo];
      if (maxPermitido && animaisSelecionados.length > maxPermitido) {
        toast.error(`A capacidade máxima configurada para o veículo ${formData.tipo_veiculo} é de ${maxPermitido} animais. Foram selecionados ${animaisSelecionados.length}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const preco = parseFloat(formData.preco_por_arroba) || 330;
      const arrobas = pesoTotal / 30;
      const valor_estimado = arrobas * preco;

      // 1. Insert Romaneio
      const { data: romaneio, error: romaneioError } = await supabase
        .from('romaneios')
        .insert({
          tenant_id: activeTenantId,
          fazenda_id: activeFarmId,
          data: formData.data_embarque,
          comprador: formData.comprador.trim(),
          comprador_cnpj: formData.comprador_cnpj.trim() || null,
          destino: formData.destino.trim() || null,
          placa: formData.placa_veiculo.trim() || null,
          tipo_veiculo: formData.tipo_veiculo || 'TRUCK',
          motorista: formData.motorista.trim() || null,
          animais_qtd: animaisSelecionados.length,
          valor_estimado,
          preco_por_arroba: preco,
          status: 'Pendente',
          gta_numero: formData.gta_numero.trim(),
          gta_serie: formData.gta_serie.trim() || null,
          nfe: formData.nfe_numero.trim() || null,
          observacoes: formData.observacoes.trim() || null,
          composicao_carga: animaisSelecionados.map((a) => ({
            animal_id: a.id,
            brinco: a.brinco,
            raca: a.raca,
            sexo: a.sexo,
            categoria: a.categoria,
            peso_kg: a.peso_atual,
            arrobas: (a.peso_atual / 30).toFixed(1),
            lote: a.lote_nome || null,
            em_carencia: a.em_carencia || false,
          })),
        })
        .select()
        .single();

      if (romaneioError) throw romaneioError;

      // 2. Update animals → EM_EMBARQUE (reservado, aguardando trânsito)
      const { error: animalError } = await supabase
        .from('animais')
        .update({ romaneio_id: romaneio.id, status: 'EM_EMBARQUE' })
        .in('id', animaisSelecionados.map((a) => a.id));

      if (animalError) throw animalError;

      toast.success(
        `Romaneio ${romaneio.codigo || ''} criado! ${animaisSelecionados.length} animais reservados para embarque.`
      );

      queryClient.invalidateQueries({ queryKey: ['romaneios_list'] });
      queryClient.invalidateQueries({ queryKey: ['animais_embarque'] });
      queryClient.invalidateQueries({ queryKey: ['animais'] });

      onGerarNF({
        comprador: formData.comprador,
        status: 'Pendente',
        romaneio_id: romaneio.id,
        codigo: romaneio.codigo,
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao salvar romaneio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      size="1024px"
      title="Romaneio & Embarque"
      icon={Truck}
      customFooter={
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, padding: '16px 24px', borderTop: '1px solid hsl(var(--border))', justifyContent: 'flex-end', background: 'hsl(var(--bg-main))' }}>
          <button type="button" onClick={onClose} className="glass-btn" disabled={saving}>CANCELAR</button>
          {currentStep === 1 ? (
            <button type="button" onClick={() => setCurrentStep(2)} className="primary-btn" disabled={animaisSelecionados.length === 0}>
              CONTINUAR <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={saveRomaneio} className="primary-btn" disabled={saving || (!formData.gta_numero || !formData.destino || !formData.comprador)}>
              {saving ? 'SALVANDO...' : 'CONFIRMAR EMBARQUE'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Content Layout */}
        <div style={{ display: 'flex', gap: '0', flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', padding: '24px 16px', borderRight: '1px solid hsl(var(--border))' }}>
            {[
              { num: 1, label: 'Seleção de Animais', icon: Beef, desc: 'Escolha dos bovinos' },
              { num: 2, label: 'Documentação e GTA', icon: FileText, desc: 'Emissão e Destino' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isCompleted = step.num === 1 ? animaisSelecionados.length > 0 : false;
              const Icon = step.icon;
              
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (step.num === 2 && animaisSelecionados.length === 0) return;
                    setCurrentStep(step.num as 1 | 2);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isActive ? `hsl(var(--brand) / 0.15)` : 'transparent',
                    color: isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-secondary))',
                    cursor: (step.num === 2 && animaisSelecionados.length === 0) ? 'not-allowed' : 'pointer',
                    opacity: (step.num === 2 && animaisSelecionados.length === 0) ? 0.4 : 1,
                    textAlign: 'left',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.2s',
                    boxShadow: isActive ? `inset 3px 0 0 hsl(var(--brand))` : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isCompleted && !isActive
                        ? '#10b981'
                        : isActive
                          ? `hsl(var(--brand) / 0.2)`
                          : 'hsl(var(--bg-main))',
                      color: isCompleted && !isActive ? '#fff' : isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted && !isActive ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px' }}>{step.label}</span>
                    {isActive && <span style={{ fontSize: '10px', color: 'inherit', opacity: 0.8, marginTop: '2px', lineHeight: '1.2' }}>{step.desc}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Panel Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', overflow: 'hidden' }}>
            {currentStep === 1 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Title removed, moved to Toolbar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Toolbar */}
              <div
                style={{
                  padding: '12px 24px',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  flexShrink: 0,
                  background: 'hsl(var(--bg-card))',
                  position: 'relative',
                  zIndex: 20,
                }}
              >
                {/* Title inside Toolbar */}
                <div style={{ flexShrink: 0, paddingRight: '16px', borderRight: '1px solid hsl(var(--border))' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0', color: 'hsl(var(--text-main))' }}>
                    1. Seleção de Animais
                  </h3>
                  <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', margin: '2px 0 0 0' }}>Escolha os bovinos</p>
                </div>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search
                    size={15}
                    style={{
                      position: 'absolute',
                      left: '13px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'hsl(var(--text-muted))',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    className="tauze-input"
                    type="text"
                    placeholder="Buscar por brinco, raça, lote..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '38px', height: '40px', fontSize: '13px' }}
                    autoComplete="off"
                  />
                </div>

                {/* Filters toggle */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: '10px',
                    border: `1px solid ${isFilterActive || showFilters ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                    background: showFilters ? 'hsl(var(--brand) / 0.08)' : 'hsl(var(--bg-main))',
                    color: isFilterActive || showFilters ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    position: 'relative',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                >
                  <Filter size={15} />
                  Filtros
                  {isFilterActive && (
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#10b981',
                        position: 'absolute',
                        top: '7px',
                        right: '7px',
                      }}
                    />
                  )}
                </button>

                {/* Add all */}
                {animaisDisponiveis.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddAllFiltered}
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: '1px solid hsl(var(--brand) / 0.3)',
                      background: 'hsl(var(--brand) / 0.08)',
                      color: 'hsl(var(--brand))',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--brand) / 0.14)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--brand) / 0.08)')
                    }
                  >
                    <Plus size={15} /> Adicionar todos ({animaisDisponiveis.length})
                  </button>
                )}
              {/* Filter Panel (overlay absolute) */}
              {showFilters && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    padding: '16px 24px',
                    borderBottom: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--bg-card))',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'flex-end',
                    zIndex: 30,
                  }}
                >
                  {/* Lote */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '5px' }}>
                      Lote
                    </label>
                    <select
                      className="tauze-input"
                      value={filtroLoteId}
                      onChange={(e) => setFiltroLoteId(e.target.value)}
                      style={{ height: '36px', fontSize: '12px', minWidth: '160px' }}
                    >
                      <option value="">Todos os lotes</option>
                      {realLotes.map((l) => (
                        <option key={l.id} value={l.id}>{l.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Peso */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '5px' }}>
                      Peso Mín. (kg)
                    </label>
                    <input
                      type="number"
                      className="tauze-input"
                      style={{ width: '90px', height: '36px', fontSize: '12px' }}
                      placeholder="Ex: 400"
                      value={pesoMin}
                      onChange={(e) => setPesoMin(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '5px' }}>
                      Peso Máx. (kg)
                    </label>
                    <input
                      type="number"
                      className="tauze-input"
                      style={{ width: '90px', height: '36px', fontSize: '12px' }}
                      placeholder="Ex: 650"
                      value={pesoMax}
                      onChange={(e) => setPesoMax(e.target.value)}
                    />
                  </div>

                  {/* Sexo */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '5px' }}>
                      Sexo
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['', 'M', 'F'].map((sex) => (
                        <button
                          key={sex}
                          type="button"
                          onClick={() => setFiltroSexo(sex)}
                          style={{
                            height: '36px',
                            padding: '0 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: filtroSexo === sex ? 'hsl(var(--brand))' : 'hsl(var(--bg-main))',
                            color: filtroSexo === sex ? '#fff' : 'hsl(var(--text-main))',
                            border: `1px solid ${filtroSexo === sex ? 'transparent' : 'hsl(var(--border))'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {sex === '' ? 'Todos' : sex === 'M' ? 'Machos' : 'Fêmeas'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categoria */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '5px' }}>
                      Categoria
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['', 'Boi Gordo', 'Vaca', 'Novilha', 'Garrote'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFiltroCategoria(cat)}
                          style={{
                            height: '36px',
                            padding: '0 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: filtroCategoria === cat ? 'hsl(var(--brand))' : 'hsl(var(--bg-main))',
                            color: filtroCategoria === cat ? '#fff' : 'hsl(var(--text-main))',
                            border: `1px solid ${filtroCategoria === cat ? 'transparent' : 'hsl(var(--border))'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {cat === '' ? 'Todas' : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Carência toggle */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      height: '36px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: `1px solid ${ocultarCarencia ? 'hsl(142 71% 45% / 0.3)' : 'hsl(var(--border))'}`,
                      background: ocultarCarencia ? 'hsl(142 71% 45% / 0.08)' : 'hsl(var(--bg-main))',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: ocultarCarencia ? '#10b981' : 'hsl(var(--text-main))',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={ocultarCarencia}
                      onChange={(e) => setOcultarCarencia(e.target.checked)}
                      style={{ accentColor: '#10b981', width: '13px', height: '13px', cursor: 'pointer' }}
                    />
                    <ShieldAlert size={13} />
                    Ocultar em Carência
                  </label>

                  {/* Clear */}
                  {isFilterActive && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      style={{
                        height: '36px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: 'transparent',
                        color: 'hsl(var(--text-muted))',
                        border: '1px solid hsl(var(--border))',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <X size={13} /> Limpar
                    </button>
                  )}
                </div>
              )}
              </div> {/* End Toolbar */}

              {/* Dual Panel */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* LEFT — Disponíveis */}
                <div
                  style={{
                    flex: '1 1 55%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid hsl(var(--border))',
                    overflow: 'hidden',
                  }}
                >
                  {/* Left header */}
                  <div
                    style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid hsl(var(--border))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'hsl(var(--bg-card))',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Disponíveis
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {carenciaCount > 0 && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#ef4444',
                            background: '#ef444412',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <AlertTriangle size={11} /> {carenciaCount} em carência
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: 'hsl(var(--text-main))',
                          background: 'hsl(var(--bg-main))',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          border: '1px solid hsl(var(--border))',
                        }}
                      >
                        {animaisDisponiveis.length}
                      </span>
                    </div>
                  </div>

                  {/* List */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {loadingAnimais ? (
                      Array(6).fill(0).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            height: '62px',
                            borderRadius: '10px',
                            background: 'hsl(var(--bg-card))',
                            border: '1px solid hsl(var(--border))',
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }}
                        />
                      ))
                    ) : animaisDisponiveis.length === 0 ? (
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '40px 20px',
                          textAlign: 'center',
                          gap: '10px',
                        }}
                      >
                        <AlertCircle size={28} style={{ color: 'hsl(var(--text-muted) / 0.4)' }} />
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                          {isFilterActive || searchQuery
                            ? 'Nenhum animal com estes filtros'
                            : 'Nenhum animal disponível para embarque'}
                        </p>
                        {(isFilterActive || searchQuery) && (
                          <button
                            type="button"
                            onClick={handleClearFilters}
                            style={{
                              padding: '6px 16px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: 'hsl(var(--brand) / 0.1)',
                              color: 'hsl(var(--brand))',
                              border: '1px solid hsl(var(--brand) / 0.2)',
                              cursor: 'pointer',
                            }}
                          >
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {animaisDisponiveis.slice(0, 100).map((animal) => (
                          <AnimalCard key={animal.id} animal={animal} onAdd={handleAddAnimal} />
                        ))}
                        {animaisDisponiveis.length > 100 && (
                          <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))', background: 'hsl(var(--bg-main))', borderRadius: '8px', border: '1px dashed hsl(var(--border))' }}>
                            Mostrando os primeiros 100 de {animaisDisponiveis.length} animais disponíveis. 
                            <br/>
                            Use a busca e os filtros acima para refinar.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* RIGHT — Selecionados */}
                <div
                  style={{
                    flex: '1 1 45%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* Right header */}
                  <div
                    style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid hsl(var(--border))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'hsl(var(--bg-card))',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Selecionados
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {animaisSelecionados.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setAnimaisSelecionados([])}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'hsl(var(--text-muted))',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--text-muted))')}
                        >
                          Limpar tudo
                        </button>
                      )}
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: animaisSelecionados.length > 0 ? '#10b981' : 'hsl(var(--text-muted))',
                          background: animaisSelecionados.length > 0 ? 'hsl(142 71% 45% / 0.1)' : 'hsl(var(--bg-main))',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          border: `1px solid ${animaisSelecionados.length > 0 ? 'hsl(142 71% 45% / 0.2)' : 'hsl(var(--border))'}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {animaisSelecionados.length}
                      </span>
                    </div>
                  </div>

                  {/* Selected list */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {animaisSelecionados.length === 0 ? (
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '40px 20px',
                          textAlign: 'center',
                          gap: '10px',
                          border: '2px dashed hsl(var(--border) / 0.5)',
                          borderRadius: '12px',
                          margin: '8px 0',
                        }}
                      >
                        <Package size={28} style={{ color: 'hsl(var(--text-muted) / 0.3)' }} />
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                          Clique nos animais à esquerda para adicioná-los ao embarque
                        </p>
                      </div>
                    ) : (
                      <>
                        {animaisSelecionados.map((animal, idx) => {
                          const arrobas = (animal.peso_atual / 30).toFixed(1);
                          return (
                            <div
                              key={animal.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '9px',
                                border: '1px solid hsl(var(--border))',
                                background: 'hsl(var(--bg-card))',
                                gap: '8px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <span
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '6px',
                                    background: 'hsl(var(--brand) / 0.1)',
                                    color: 'hsl(var(--brand))',
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {idx + 1}
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 800, fontSize: '12px', color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    #{animal.brinco}
                                    {animal.em_carencia && (
                                      <ShieldAlert size={11} style={{ color: '#ef4444' }} />
                                    )}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                                    {animal.raca} · {animal.categoria}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 900, fontSize: '12px', color: '#10b981' }}>
                                    {animal.peso_atual.toLocaleString('pt-BR')} kg
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{arrobas} @</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAnimal(animal.id)}
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '7px',
                                    background: 'hsl(0 84% 60% / 0.08)',
                                    border: '1px solid hsl(0 84% 60% / 0.15)',
                                    color: 'hsl(0 84% 60%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = 'hsl(0 84% 60% / 0.16)')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = 'hsl(0 84% 60% / 0.08)')
                                  }
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Totals footer */}
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, hsl(var(--brand) / 0.06), hsl(142 71% 45% / 0.06))',
                            border: '1px solid hsl(var(--brand) / 0.12)',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Peso Total
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>
                                {pesoTotal.toLocaleString('pt-BR')} kg
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Total Arrobas
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: 900, color: 'hsl(var(--brand))' }}>
                                {arrobasTotal} @
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Média por Animal
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                                {animaisSelecionados.length > 0
                                  ? (pesoTotal / animaisSelecionados.length).toFixed(0)
                                  : '0'}{' '}
                                kg
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Valor Est. (R$ 330/@)
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                                R${' '}
                                {parseFloat(valorEstimado).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
              </div>
            )}

            {currentStep === 2 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))', flexShrink: 0 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0', color: 'hsl(var(--text-main))' }}>
                    2. Documentação e Destino (GTA)
                  </h3>
                  <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: '4px 0 0 0' }}>Emissão de GTA e NFe</p>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'hsl(var(--bg-main))' }}>
              {/* Summary card */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, hsl(var(--brand) / 0.06), hsl(142 71% 45% / 0.06))',
                  border: '1px solid hsl(var(--brand) / 0.15)',
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                    <strong>{animaisSelecionados.length}</strong> animais selecionados
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                  Peso total: <strong style={{ color: '#10b981' }}>{pesoTotal.toLocaleString('pt-BR')} kg</strong>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                  Arrobas: <strong style={{ color: 'hsl(var(--brand))' }}>{arrobasTotal} @</strong>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                  Valor estimado:{' '}
                  <strong style={{ color: 'hsl(var(--text-main))', fontSize: '15px' }}>
                    R${' '}
                    {parseFloat(valorEstimado).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              </div>

              {/* SEÇÃO: Comprador */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <User size={13} /> Comprador / Destinatário
                </div>
                <div className="tauze-input-grid grid-col-3">
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      Nome do Comprador <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Nome ou razão social"
                      value={formData.comprador}
                      onChange={(e) => setFormData({ ...formData, comprador: e.target.value })}
                      required
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      CPF / CNPJ
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="000.000.000-00 ou 00.000.000/0001-00"
                      value={formData.comprador_cnpj}
                      onChange={(e) => setFormData({ ...formData, comprador_cnpj: e.target.value })}
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <MapPin size={13} /> Destino / Propriedade
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Ex: Frigorífico ABC, Fazenda Boa Vista"
                      value={formData.destino}
                      onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: Documentação Fiscal */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FileText size={13} /> Documentação Fiscal e GTA
                </div>

                {/* GTA obrigatória warning */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'hsl(38 92% 50% / 0.08)',
                    border: '1px solid hsl(38 92% 50% / 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '14px',
                  }}
                >
                  <AlertTriangle size={15} style={{ color: 'hsl(38 92% 50%)', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>
                    A <strong>GTA (Guia de Trânsito Animal)</strong> é exigência legal do MAPA e deve ser emitida no SIGSIF antes do embarque. O campo é obrigatório para confirmar o romaneio.
                  </span>
                </div>

                <div className="tauze-input-grid grid-col-3">
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Hash size={13} /> Nº GTA <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Ex: 2024000123"
                      value={formData.gta_numero}
                      onChange={(e) => setFormData({ ...formData, gta_numero: e.target.value })}
                      style={{ borderColor: !formData.gta_numero ? 'hsl(38 92% 50% / 0.5)' : undefined }}
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      Série GTA
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Ex: A"
                      value={formData.gta_serie}
                      onChange={(e) => setFormData({ ...formData, gta_serie: e.target.value })}
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      Nº NF-e de Saída
                      <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginLeft: '4px' }}>(opcional)</span>
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Nº emitido na SEFAZ"
                      value={formData.nfe_numero}
                      onChange={(e) => setFormData({ ...formData, nfe_numero: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: Transporte */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Truck size={13} /> Transporte
                </div>
                <div className="tauze-input-grid grid-col-3">
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      Placa do Veículo
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="ABC-1D23"
                      value={formData.placa_veiculo}
                      onChange={(e) =>
                        setFormData({ ...formData, placa_veiculo: e.target.value.toUpperCase() })
                      }
                      style={{ fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      Tipo de Veículo
                    </label>
                    <select
                      className="tauze-input"
                      value={formData.tipo_veiculo}
                      onChange={(e) => setFormData({ ...formData, tipo_veiculo: e.target.value })}
                    >
                      <option value="TRUCK">Truck (3 eixos)</option>
                      <option value="CARRETA">Carreta</option>
                      <option value="BITREM">Bitrem</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <User size={13} /> Motorista
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Nome do motorista"
                      value={formData.motorista}
                      onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: Financeiro e Data */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <DollarSign size={13} /> Financeiro e Data
                </div>
                <div className="tauze-input-grid grid-col-3">
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Calendar size={13} /> Data do Embarque <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <DateInput
                      className="tauze-input"
                      type="date"
                      value={formData.data_embarque}
                      onChange={(e: any) => setFormData({ ...formData, data_embarque: e.target.value })}
                      required
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Scale size={13} /> Preço por Arroba (R$/@)
                    </label>
                    <input
                      className="tauze-input"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="330.00"
                      value={formData.preco_por_arroba}
                      onChange={(e) => setFormData({ ...formData, preco_por_arroba: e.target.value })}
                    />
                  </div>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'hsl(var(--bg-card))',
                      border: '1px solid hsl(var(--border))',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                      Valor Total Estimado
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
                      R${' '}
                      {parseFloat(valorEstimado).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                      {arrobasTotal} @ × R$ {parseFloat(formData.preco_por_arroba || '330').toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <FileText size={13} /> Observações
                </label>
                <textarea
                  className="tauze-input tauze-textarea"
                  placeholder="Informações adicionais sobre o embarque..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  style={{ minHeight: '72px', resize: 'vertical' }}
                />
              </div>
            </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer inside SidePanel removed */}
      </div>
    </SidePanel>
  );
};
