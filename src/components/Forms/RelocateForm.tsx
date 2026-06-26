import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowRightLeft,
  Layers,
  MapPin,
  Search,
  CheckCircle2,
  Users,
  Calendar,
  FileText,
  Weight,
  Filter,
  X,
  AlertTriangle,
  ChevronDown,
  Beef,
  Save,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../utils/audit';
import toast from 'react-hot-toast';
import { SearchableSelect } from './SearchableSelect';
import { DateInput } from '../../components/Form/DateInput';
import { useFormDraft } from '../../hooks/useFormDraft';
import { RelocateConfirmModal } from './RelocateConfirmModal';
import './RelocateForm.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getToday = () => new Date().toLocaleDateString('en-CA');

const INITIAL_RELOCATE_FORM = {
  sourceLotId: '',
  sourceLotName: '',
  targetLotId: '',
  targetLotName: '',
  date: getToday(),
  motivo: '',
  motivoLivre: '',
};

const MOTIVOS = [
  'Rotação de pasto',
  'Desmama',
  'Separação por categoria',
  'Separação por sexo',
  'Doença / Quarentena',
  'Preparação para venda',
  'Reagrupamento',
  'Outro',
];

// ── Interfaces ────────────────────────────────────────────────────────────────
interface RelocateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialSourceLotId?: string;
  actionId?: number;
}

interface AnimalCarencia {
  animal_id: string;
  dias_restantes: number;
  produto_nome: string;
}

// ── Funções auxiliares ────────────────────────────────────────────────────────
function calcAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const diff = Date.now() - new Date(birthDate).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}a ${rem}m` : `${years}a`;
}

// ── CapacityBar ───────────────────────────────────────────────────────────────
function CapacityBar({ current, max, adding }: { current: number; max: number; adding: number }) {
  if (!max || max <= 0) return null;
  const totalAfter = current + adding;
  const pct = Math.min((totalAfter / max) * 100, 100);
  const beforePct = Math.min((current / max) * 100, 100);
  const color = totalAfter > max ? '#ef4444' : totalAfter / max > 0.85 ? '#f59e0b' : '#10b981';
  const label = totalAfter > max ? 'Superlotação!' : totalAfter / max > 0.85 ? 'Quase no limite' : 'OK';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
          Cap. do destino
        </span>
        <span style={{ fontSize: '10px', fontWeight: 800, color }}>
          {totalAfter}/{max} — {label}
        </span>
      </div>
      <div style={{ background: 'hsl(var(--border))', borderRadius: '99px', height: '6px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${beforePct}%`, background: '#10b981', borderRadius: '99px' }} />
        {adding > 0 && (
          <div style={{
            position: 'absolute', left: `${beforePct}%`, top: 0, height: '100%',
            width: `${Math.min((adding / max) * 100, 100 - beforePct)}%`,
            background: color, opacity: 0.75,
          }} />
        )}
      </div>
      {totalAfter > max && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={10} color="#ef4444" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>Destino ficará superlotado</span>
        </div>
      )}
    </div>
  );
}

// ── LotSearch ─────────────────────────────────────────────────────────────────
interface LotSearchProps {
  lots: any[];
  value: string;
  onChange: (id: string, name: string) => void;
  placeholder: string;
  exclude?: string;
  label: React.ReactNode;
  animalCount?: number;
  filterStatus?: string;
}

function LotSearch({ lots, value, onChange, placeholder, exclude, label, animalCount, filterStatus }: LotSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLot = lots.find((l) => l.id === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return lots
      .filter((l) => l.id !== exclude)
      .filter((l) => !filterStatus || l.status === filterStatus)
      .filter((l) => !q || l.nome.toLowerCase().includes(q) || (l.descricao || '').toLowerCase().includes(q));
  }, [lots, query, exclude, filterStatus]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (lot: any) => { onChange(lot.id, lot.nome); setQuery(''); setOpen(false); };
  const handleClear = (e: React.MouseEvent) => { e.stopPropagation(); onChange('', ''); setQuery(''); };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label className="tauze-label">
        {label}
        {animalCount !== undefined && animalCount > 0 && (
          <span style={{ background: 'hsl(var(--brand))', color: 'white', borderRadius: '99px', padding: '1px 7px', fontSize: '9px', fontWeight: 800, marginLeft: '6px' }}>
            {animalCount} animais
          </span>
        )}
      </label>
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="tauze-input"
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          cursor: 'text', padding: '0 16px',
          borderColor: open ? 'hsl(var(--brand))' : undefined,
          boxShadow: open ? '0 0 0 4px hsl(var(--brand) / 0.1)' : undefined,
        }}
      >
        <Search size={14} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={selectedLot ? selectedLot.nome : placeholder}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', fontWeight: 600, background: 'transparent', color: 'hsl(var(--text-main))', height: '100%' }}
            autoComplete="off"
          />
        ) : (
          <span style={{
            flex: 1, fontSize: '14px',
            color: selectedLot ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
            fontWeight: selectedLot ? 600 : 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {selectedLot ? selectedLot.nome : placeholder}
          </span>
        )}
        {value ? (
          <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 2px', flexShrink: 0 }}>
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={14} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
          // P10: Corrigido — usa token de tema em vez de 'white' hardcoded
          background: 'hsl(var(--bg-card))',
          border: '1.5px solid hsl(var(--brand))',
          borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          maxHeight: '220px', overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              Nenhum lote encontrado
            </div>
          ) : (
            filtered.map((lot) => (
              <div
                key={lot.id}
                onClick={() => handleSelect(lot)}
                style={{
                  padding: '10px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  // P10: usa token em vez de 'white'
                  background: lot.id === value ? 'hsl(var(--brand) / 0.1)' : 'hsl(var(--bg-card))',
                  borderBottom: '1px solid hsl(var(--border) / 0.5)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.07)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = lot.id === value ? 'hsl(var(--brand) / 0.1)' : 'hsl(var(--bg-card))')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <Layers size={13} style={{ color: 'hsl(var(--brand))', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lot.nome}
                    </div>
                    {lot.descricao && (
                      <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '1px' }}>{lot.descricao}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                  {lot._animalCount !== undefined && (
                    <span style={{ fontSize: '10px', fontWeight: 700, background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', borderRadius: '6px', padding: '2px 6px' }}>
                      {lot._animalCount} animais
                    </span>
                  )}
                  {lot.capacidade && (
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                      cap. {lot.capacidade}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Skeleton de animais ───────────────────────────────────────────────────────
function AnimalGridSkeleton() {
  return (
    <div className="relocate-animal-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="relocate-animal-skeleton-item" />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export const RelocateForm: React.FC<RelocateFormProps> = ({ isOpen, onClose, onSubmit, initialSourceLotId }) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter, activeFarmId, isGlobalMode } = useFarmFilter();
  const { user } = useAuth();

  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `relocate_form_${activeTenantId}`,
    initialState: INITIAL_RELOCATE_FORM,
    isOpen,
    isEditMode: false,
    enabled: !initialSourceLotId,
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lots, setLots] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSexo, setFilterSexo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [destCapacity, setDestCapacity] = useState<{ current: number; max: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // P4 — Estado de GTA
  const [requerGTA, setRequerGTA] = useState(false);
  const [gtaConfirmada, setGtaConfirmada] = useState(false);

  // P14 — Carências sanitárias
  const [carencias, setCarencias] = useState<AnimalCarencia[]>([]);

  const canFetch = activeFarmId || (isGlobalMode && activeTenantId);

  // ── Reset ao fechar ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setSelectedAnimals([]);
      setSearchTerm('');
      setFilterSexo('');
      setFilterCategoria('');
      setDestCapacity(null);
      setShowConfirm(false);
      setAnimals([]);
      setShowAdvancedFilters(false);
      setRequerGTA(false);
      setGtaConfirmada(false);
      setCarencias([]);
    } else if (canFetch) {
      fetchLots();
    }
  }, [isOpen, activeFarmId, isGlobalMode, activeTenantId]);

  useEffect(() => {
    if (formData.sourceLotId) {
      fetchAnimals(formData.sourceLotId);
    } else {
      setAnimals([]);
      setSelectedAnimals([]);
      setCarencias([]);
    }
  }, [formData.sourceLotId]);

  useEffect(() => {
    if (formData.targetLotId) {
      fetchTargetCapacity(formData.targetLotId);
      checkInterFazendaTransfer(formData.sourceLotId, formData.targetLotId);
    } else {
      setDestCapacity(null);
      setRequerGTA(false);
      setGtaConfirmada(false);
    }
  }, [formData.targetLotId]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const fetchLots = async () => {
    const baseQuery = supabase
      .from('lotes')
      .select('id, nome, capacidade, descricao, status, sexo_permitido, exige_rastreabilidade, fazenda_id, pastos ( nome )')
      .order('nome');
    const { data, error } = await applyFarmFilter(baseQuery);
    if (error) { console.error('[RelocateForm] fetchLots error:', error); return; }
    if (!data) return;

    // Contagem de animais por lote (N+1 evitado — query única)
    const { data: counts } = await supabase
      .from('animais')
      .select('lote_id')
      .eq('tenant_id', activeTenantId)
      .eq('status', 'ATIVO') // P2: uma única variação — o trigger normaliza para uppercase
      .in('lote_id', data.map((l: any) => l.id));

    const countMap: Record<string, number> = {};
    (counts || []).forEach((a: any) => {
      countMap[a.lote_id] = (countMap[a.lote_id] || 0) + 1;
    });

    const enriched = data.map((lot: any) => ({ ...lot, _animalCount: countMap[lot.id] || 0 }));
    setLots(enriched);

    if (initialSourceLotId) {
      const found = enriched.find((l: any) => l.id === initialSourceLotId);
      if (found) setFormData((f) => ({ ...f, sourceLotId: initialSourceLotId, sourceLotName: found.nome }));
    }
  };

  const fetchAnimals = async (lotId: string) => {
    setLoading(true);
    setSelectedAnimals([]);
    setCarencias([]);
    const { data, error } = await supabase
      .from('animais')
      .select('id, nome, brinco, brinco_eletronico, raca, categoria, sexo, peso_atual, data_nascimento')
      .eq('tenant_id', activeTenantId)
      .eq('lote_id', lotId)
      .eq('status', 'ATIVO') // P2: normalizado pelo trigger
      .order('brinco');

    if (error) console.error('[RelocateForm] fetchAnimals error:', error);
    const animaisData = data || [];
    setAnimals(animaisData);

    // P14 — Buscar carências sanitárias dos animais do lote
    if (animaisData.length > 0) {
      fetchCarencias(animaisData.map((a: any) => a.id));
    }

    setLoading(false);
  };

  // P14 — Busca carências: animais com aplicação dentro do prazo de carência do produto
  const fetchCarencias = async (animalIds: string[]) => {
    const { data } = await supabase
      .from('sanidade_animais')
      .select(`
        animal_id,
        data_aplicacao,
        produtos ( nome, carencia_dias )
      `)
      .in('animal_id', animalIds)
      .eq('tenant_id', activeTenantId)
      .not('produtos', 'is', null);

    if (!data) return;
    const hoje = new Date();
    const emCarencia: AnimalCarencia[] = [];

    data.forEach((registro: any) => {
      const produto = registro.produtos;
      if (!produto || !produto.carencia_dias || produto.carencia_dias <= 0) return;
      const dataAplicacao = new Date(registro.data_aplicacao);
      const dataFimCarencia = new Date(dataAplicacao.getTime() + produto.carencia_dias * 86400000);
      if (dataFimCarencia > hoje) {
        const diasRestantes = Math.ceil((dataFimCarencia.getTime() - hoje.getTime()) / 86400000);
        // Evita duplicatas por animal_id
        const jaExiste = emCarencia.findIndex((c) => c.animal_id === registro.animal_id);
        if (jaExiste === -1) {
          emCarencia.push({
            animal_id: registro.animal_id,
            dias_restantes: diasRestantes,
            produto_nome: produto.nome,
          });
        } else if (emCarencia[jaExiste].dias_restantes < diasRestantes) {
          // Manter a carência mais longa
          emCarencia[jaExiste] = { animal_id: registro.animal_id, dias_restantes: diasRestantes, produto_nome: produto.nome };
        }
      }
    });

    setCarencias(emCarencia);
  };

  const fetchTargetCapacity = async (lotId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    const max = parseFloat(lot?.capacidade) || 0;
    const { count } = await supabase
      .from('animais')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', activeTenantId)
      .eq('lote_id', lotId)
      .eq('status', 'ATIVO');
    setDestCapacity({ current: count || 0, max });
  };

  // P4 — Verificar se a transferência é entre fazendas diferentes (flag GTA)
  const checkInterFazendaTransfer = (sourceLotId: string, targetLotId: string) => {
    if (!sourceLotId || !targetLotId) { setRequerGTA(false); return; }
    const sourceLot = lots.find((l) => l.id === sourceLotId);
    const targetLot = lots.find((l) => l.id === targetLotId);
    const isDifferentFarm =
      sourceLot?.fazenda_id &&
      targetLot?.fazenda_id &&
      sourceLot.fazenda_id !== targetLot.fazenda_id;
    setRequerGTA(!!isDifferentFarm);
    if (!isDifferentFarm) setGtaConfirmada(false);
  };

  // ── Seleção de animais ────────────────────────────────────────────────────
  const toggleAnimal = (id: string, animalSexo?: string, hasRFID?: boolean) => {
    const targetLot = lots.find((l) => l.id === formData.targetLotId);
    if (targetLot?.sexo_permitido && targetLot.sexo_permitido !== 'MISTO' && animalSexo && animalSexo !== targetLot.sexo_permitido) {
      toast.error(`O lote de destino permite apenas ${targetLot.sexo_permitido}S.`);
      return;
    }
    if (targetLot?.exige_rastreabilidade && !hasRFID) {
      toast.error('O lote de destino exige Brinco Eletrônico (RFID) cadastrado.');
      return;
    }
    setSelectedAnimals((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const filterAllowedAnimals = (list: any[]) => {
    const targetLot = lots.find((l) => l.id === formData.targetLotId);
    let blocked = 0;
    const allowed = list.filter((a) => {
      let ok = true;
      if (targetLot?.sexo_permitido && targetLot.sexo_permitido !== 'MISTO' && a.sexo && a.sexo !== targetLot.sexo_permitido) ok = false;
      if (targetLot?.exige_rastreabilidade && !a.brinco_eletronico) ok = false;
      if (!ok) blocked++;
      return ok;
    });
    if (blocked > 0) toast.error(`${blocked} animais ignorados por restrições do lote (sexo ou falta de RFID).`);
    return allowed;
  };

  const selectAll = () => {
    const allowed = filterAllowedAnimals(filteredAnimals);
    if (selectedAnimals.length === allowed.length && allowed.length > 0) setSelectedAnimals([]);
    else setSelectedAnimals(allowed.map((a) => a.id));
  };

  const selectEntireLot = () => {
    const allowed = filterAllowedAnimals(animals);
    setSelectedAnimals(allowed.map((a) => a.id));
  };

  // ── Memos ─────────────────────────────────────────────────────────────────
  const categorias = useMemo(() => [...new Set(animals.map((a) => a.categoria).filter(Boolean))], [animals]);

  const filteredAnimals = useMemo(() => {
    return animals.filter((a) => {
      const matchSearch =
        (a.brinco || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.raca || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchSexo = filterSexo ? a.sexo === filterSexo : true;
      const matchCat = filterCategoria ? a.categoria === filterCategoria : true;
      return matchSearch && matchSexo && matchCat;
    });
  }, [animals, searchTerm, filterSexo, filterCategoria]);

  const carenciaMap = useMemo(() => {
    const map: Record<string, AnimalCarencia> = {};
    carencias.forEach((c) => { map[c.animal_id] = c; });
    return map;
  }, [carencias]);

  const motivoEfetivo = formData.motivo === 'Outro' && formData.motivoLivre.trim()
    ? formData.motivoLivre.trim()
    : formData.motivo;

  // P5 — GTA bloqueia submissão se não confirmada
  const canSubmit =
    selectedAnimals.length > 0 &&
    !!formData.targetLotId &&
    !!motivoEfetivo &&
    !(formData.motivo === 'Outro' && !formData.motivoLivre.trim()) &&
    (!requerGTA || gtaConfirmada);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnimals.length === 0) { toast.error('Selecione ao menos um animal.'); return; }
    if (!formData.targetLotId) { toast.error('Selecione o lote de destino.'); return; }
    if (!motivoEfetivo || (formData.motivo === 'Outro' && !formData.motivoLivre.trim())) {
      toast.error('Informe o motivo do remanejamento.'); return;
    }
    if (requerGTA && !gtaConfirmada) {
      toast.error('Confirme que possui a GTA emitida para prosseguir.'); return;
    }
    setShowConfirm(true);
  };

  // P1 — Transação atômica via RPC
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('relocate_animals', {
        p_animal_ids:     selectedAnimals,
        p_source_lot_id:  formData.sourceLotId,
        p_target_lot_id:  formData.targetLotId,
        p_date:           formData.date,
        p_motivo:         motivoEfetivo,
        p_tenant_id:      activeTenantId,
        p_user_id:        user?.id,
        p_gta_confirmada: gtaConfirmada,
      });

      if (error) throw error;

      if (!data?.success) {
        toast.error(data?.error || 'Erro ao transferir animais.');
        setShowConfirm(false);
        return;
      }

      // Audit log
      if (activeTenantId) {
        await logAudit({
          tenant_id:   activeTenantId,
          user_id:     user?.id,
          action:      'TRANSFER_BATCH',
          entity:      'Lote',
          entity_id:   formData.sourceLotId,
          description: `${selectedAnimals.length} animais transferidos de "${formData.sourceLotName}" → "${formData.targetLotName}" | ${motivoEfetivo} | ${formData.date}${requerGTA ? ' | GTA confirmada' : ''}`,
          old_data:    { lote_id: formData.sourceLotId },
          new_data:    { lote_id: formData.targetLotId, motivo: motivoEfetivo },
        });
      }

      toast.success(`${data.transferred} ${data.transferred === 1 ? 'animal transferido' : 'animais transferidos'} com sucesso!`);
      onSubmit({ count: data.transferred, source: formData.sourceLotId, target: formData.targetLotId });
      clearDraft();
      onClose();
    } catch (err: any) {
      console.error('[RelocateForm] handleSubmit error:', err);
      toast.error('Erro ao transferir animais. Nenhum dado foi alterado.');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Labels dos animais para o modal de confirmação ────────────────────────
  const selectedAnimalLabels = useMemo(() =>
    animals
      .filter((a) => selectedAnimals.includes(a.id))
      .map((a) => a.nome || (a.brinco ? `#${a.brinco}` : `#${a.id.slice(0, 6)}`)),
    [animals, selectedAnimals]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <SidePanel
        size="xlarge"
        isOpen={isOpen}
        onClose={onClose}
        onCancel={() => { clearDraft(); onClose(); }}
        onSubmit={handleOpenConfirm}
        title="Remanejamento de Lote"
        subtitle="Transfira animais entre grupos com rastreabilidade total."
        icon={ArrowRightLeft}
        loading={false}
        submitLabel={`Revisar Remanejamento (${selectedAnimals.length})`}
        customFooter={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '16px' }}>
            {/* Capacidade do destino — contextualizada no footer */}
            <div style={{ flex: 1, maxWidth: '380px' }}>
              {destCapacity && (
                <CapacityBar current={destCapacity.current} max={destCapacity.max} adding={selectedAnimals.length} />
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              <button type="button" className="glass-btn secondary" onClick={() => { clearDraft(); onClose(); }}>
                Cancelar
              </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={!canSubmit}
                title={
                  !canSubmit
                    ? requerGTA && !gtaConfirmada
                      ? 'Confirme a GTA para prosseguir'
                      : 'Selecione animais, lote de destino e motivo'
                    : undefined
                }
                style={{
                  boxShadow: canSubmit ? '0 8px 20px hsl(var(--brand) / 0.2)' : 'none',
                  opacity: canSubmit ? 1 : 0.5,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                <Save size={18} />
                {`Revisar Remanejamento (${selectedAnimals.length})`}
              </button>
            </div>
          </div>
        }
      >
        {/* ── PASSO 01 — DADOS DO REMANEJAMENTO ──────────────────────────── */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 01</div>
            <h4 className="tauze-section-title">Dados do Remanejamento</h4>
          </div>

          {/* P5: Grid 2x2 — Origem e Destino têm espaço adequado */}
          <div className="tauze-input-grid grid-col-2">
            {/* Lote de Origem */}
            <div className="tauze-field-group">
              <LotSearch
                lots={lots}
                value={formData.sourceLotId}
                onChange={(id, name) => {
                  setFormData((f) => ({
                    ...f,
                    sourceLotId: id,
                    sourceLotName: name,
                    targetLotId: f.targetLotId === id ? '' : f.targetLotId,
                  }));
                  checkInterFazendaTransfer(id, formData.targetLotId);
                }}
                placeholder="Buscar lote de origem..."
                exclude={formData.targetLotId}
                animalCount={animals.length || lots.find((l) => l.id === formData.sourceLotId)?._animalCount}
                label={<><Layers size={14} /> Lote de Origem</>}
              />
            </div>

            {/* Lote de Destino — apenas ATIVOS */}
            <div className="tauze-field-group">
              <LotSearch
                lots={lots}
                value={formData.targetLotId}
                onChange={(id, name) => {
                  setFormData((f) => ({ ...f, targetLotId: id, targetLotName: name }));
                  checkInterFazendaTransfer(formData.sourceLotId, id);
                }}
                placeholder="Buscar lote de destino..."
                exclude={formData.sourceLotId}
                filterStatus="ATIVO"
                label={<><MapPin size={14} /> Lote de Destino</>}
              />
              {/* Tags de restrições do lote de destino */}
              {(() => {
                const tl = lots.find((l) => l.id === formData.targetLotId);
                if (!tl) return null;
                return (
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {tl.pastos?.nome && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                        <MapPin size={10} /> {tl.pastos.nome}
                      </div>
                    )}
                    {tl.sexo_permitido && tl.sexo_permitido !== 'MISTO' && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                        Restrito: {tl.sexo_permitido}S
                      </div>
                    )}
                    {tl.exige_rastreabilidade && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                        Exige RFID
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Data */}
            <div className="tauze-field-group">
              <label className="tauze-label"><Calendar size={14} /> Data do Remanejamento</label>
              <DateInput
                type="date"
                className="tauze-input"
                value={formData.date}
                onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                required
                max={getToday()}
              />
            </div>

            {/* Motivo */}
            <div className="tauze-field-group">
              <label className="tauze-label"><FileText size={14} /> Motivo do Remanejamento</label>
              <SearchableSelect
                value={formData.motivo}
                onChange={(val: any) => setFormData((f) => ({ ...f, motivo: val, motivoLivre: '' }))}
                options={[
                  { value: '', label: 'Selecione o motivo...' },
                  ...MOTIVOS.map((m) => ({ value: m, label: m })),
                ]}
              />
              {formData.motivo === 'Outro' && (
                <>
                  <input
                    type="text"
                    className="tauze-input"
                    style={{ marginTop: '8px' }}
                    placeholder="Descreva o motivo..."
                    value={formData.motivoLivre}
                    onChange={(e) => setFormData((f) => ({ ...f, motivoLivre: e.target.value }))}
                    maxLength={200}
                    autoFocus
                  />
                  {/* P13 — Contador de chars */}
                  <span className={`relocate-char-counter ${formData.motivoLivre.length >= 180 ? 'at-limit' : formData.motivoLivre.length >= 150 ? 'near-limit' : ''}`}>
                    {formData.motivoLivre.length}/200
                  </span>
                </>
              )}
            </div>
          </div>

          {/* P4 — Alerta de GTA (movimentação entre fazendas) */}
          {requerGTA && (
            <div className="gta-alert" style={{ marginTop: '16px' }}>
              <div className="gta-alert-header">
                <ShieldAlert size={16} />
                Movimentação entre fazendas — Verificação de GTA
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-muted))', lineHeight: 1.5 }}>
                A legislação federal (Portaria MAPA) exige <strong>Guia de Trânsito Animal (GTA)</strong> para movimentação entre propriedades distintas. O não cumprimento pode resultar em autuações e interdição do rebanho.
              </p>
              <label className="gta-alert-check">
                <input
                  type="checkbox"
                  checked={gtaConfirmada}
                  onChange={(e) => setGtaConfirmada(e.target.checked)}
                />
                Confirmo que a GTA foi emitida e está disponível para fiscalização
              </label>
            </div>
          )}
        </section>

        {/* ── PASSO 02 — SELECIONAR ANIMAIS ──────────────────────────────── */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Selecionar Animais</h4>
          </div>

          {/* Header da lista de animais */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>
              <Users size={13} />
              Animais no Lote
              {animals.length > 0 && (
                <span style={{ background: 'hsl(var(--border))', borderRadius: '99px', padding: '1px 8px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                  {selectedAnimals.length}/{animals.length}
                </span>
              )}
              {carencias.length > 0 && (
                <span style={{ background: '#fef3c7', color: '#b45309', borderRadius: '99px', padding: '1px 8px', fontSize: '10px', fontWeight: 800 }}>
                  {carencias.length} em carência
                </span>
              )}
            </label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button type="button" className="text-btn-sm" onClick={() => setShowAdvancedFilters((s) => !s)} disabled={animals.length === 0}>
                <Filter size={11} />
                FILTROS{filterSexo || filterCategoria ? ' ●' : ''}
              </button>
              <span style={{ color: 'hsl(var(--border))', fontSize: '12px' }}>|</span>
              <button type="button" className="text-btn-sm" onClick={selectEntireLot} disabled={animals.length === 0} title="Selecionar todos os animais do lote">
                <Beef size={11} /> LOTE TODO
              </button>
              <button type="button" className="text-btn-sm" onClick={selectAll} disabled={filteredAnimals.length === 0}>
                {selectedAnimals.length === filteredAnimals.length && filteredAnimals.length > 0 ? 'DESMARCAR' : 'MARCAR VISÍVEIS'}
              </button>
            </div>
          </div>

          {/* Busca rápida */}
          {animals.length > 0 && (
            <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="search-glass-box small" style={{ margin: 0, flex: 1 }}>
                <Search size={13} className="s-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome, brinco, raça..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 4px' }}>
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filtros avançados */}
          {showAdvancedFilters && animals.length > 0 && (
            <div style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <SearchableSelect
                  value={filterSexo}
                  onChange={(v: any) => setFilterSexo(v)}
                  options={[{ value: '', label: 'Todos os Sexos' }, { value: 'MACHO', label: 'Apenas Machos' }, { value: 'FEMEA', label: 'Apenas Fêmeas' }]}
                />
              </div>
              <div style={{ flex: 1 }}>
                <SearchableSelect
                  value={filterCategoria}
                  onChange={(v: any) => setFilterCategoria(v)}
                  options={[{ value: '', label: 'Todas as Categorias' }, ...categorias.map((c) => ({ value: String(c), label: String(c) }))]}
                />
              </div>
            </div>
          )}

          {/* Grid de animais */}
          <div style={{ maxHeight: '400px', overflowY: 'auto', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
            {/* P6 — Sticky summary bar */}
            {selectedAnimals.length > 0 && (
              <div className="relocate-sticky-summary">
                <span>
                  ✓ {selectedAnimals.length} {selectedAnimals.length === 1 ? 'animal selecionado' : 'animais selecionados'}
                  {selectedAnimals.length === animals.length && ' · lote completo'}
                </span>
                <button type="button" onClick={() => setSelectedAnimals([])}>Limpar</button>
              </div>
            )}

            <div style={{ padding: '12px' }}>
              {/* P7 — Loading com skeleton em vez de texto */}
              {loading ? (
                <AnimalGridSkeleton />
              ) : !formData.sourceLotId ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <AlertCircle size={28} style={{ color: 'hsl(var(--text-muted))', marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0 }}>
                    Selecione um lote de origem para ver os animais.
                  </p>
                </div>
              ) : animals.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <Users size={28} style={{ color: 'hsl(var(--text-muted))', marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0 }}>
                    Nenhum animal ativo neste lote.
                  </p>
                </div>
              ) : filteredAnimals.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <Search size={28} style={{ color: 'hsl(var(--text-muted))', marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0 }}>
                    Nenhum animal com esse filtro.
                  </p>
                </div>
              ) : (
                <div className="picker-list-adv">
                  {filteredAnimals.map((animal) => {
                    const selected = selectedAnimals.includes(animal.id);
                    const targetLot = lots.find((l) => l.id === formData.targetLotId);
                    const isSexBlocked = targetLot?.sexo_permitido && targetLot.sexo_permitido !== 'MISTO' && animal.sexo && animal.sexo !== targetLot.sexo_permitido;
                    const isRFIDBlocked = targetLot?.exige_rastreabilidade && !animal.brinco_eletronico;
                    const isBlocked = isSexBlocked || isRFIDBlocked;
                    const animalLabel = animal.nome || (animal.brinco ? `#${animal.brinco}` : `#${animal.id.slice(0, 6)}`);
                    // P14
                    const carencia = carenciaMap[animal.id];

                    return (
                      <div
                        key={animal.id}
                        onClick={() => !isBlocked && toggleAnimal(animal.id, animal.sexo, !!animal.brinco_eletronico)}
                        className={`picker-list-item ${selected ? 'active' : ''} ${isBlocked ? 'picker-blocked' : ''}`}
                        title={
                          isSexBlocked ? `Lote permite apenas ${targetLot?.sexo_permitido}S`
                            : isRFIDBlocked ? 'Lote exige brinco eletrônico (SISBOV)'
                            : carencia ? `Em carência: ${carencia.produto_nome} (${carencia.dias_restantes}d restantes)`
                            : ''
                        }
                      >
                        <div className="p-check-adv" style={{ marginTop: 0 }}>
                          {selected ? <CheckCircle2 size={18} /> : <div className="p-check-empty" />}
                        </div>
                        <div className="p-info-row">
                          <span className="p-brinco-adv">{animalLabel}</span>
                          <span className="p-raca-adv">{animal.raca || '—'}</span>
                          {animal.brinco_eletronico && <span className="p-tag" style={{ background: '#ecfdf5', color: '#10b981' }}>RFID</span>}
                          {animal.categoria && <span className="p-tag">{animal.categoria}</span>}
                          {animal.sexo && (
                            <span className="p-tag" style={{
                              background: animal.sexo === 'MACHO' ? '#eff6ff' : '#fdf2f8',
                              color: animal.sexo === 'MACHO' ? '#3b82f6' : '#ec4899',
                            }}>
                              {animal.sexo === 'MACHO' ? 'M' : 'F'}
                            </span>
                          )}
                          {/* P14 — Badge de carência */}
                          {carencia && (
                            <span className="p-tag-carencia">
                              <AlertTriangle size={9} />
                              {carencia.dias_restantes}d
                            </span>
                          )}
                        </div>
                        <div className="p-stats-row">
                          {animal.peso_atual && <span><Weight size={12} /> {animal.peso_atual}kg</span>}
                          {animal.data_nascimento && (
                            <span>
                              <Calendar size={11} /> {calcAge(animal.data_nascimento)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </SidePanel>

      {/* P12 — Modal de confirmação extraído como componente isolado */}
      <RelocateConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        submitting={submitting}
        sourceLotName={formData.sourceLotName}
        targetLotName={formData.targetLotName}
        motivo={motivoEfetivo}
        date={formData.date}
        selectedCount={selectedAnimals.length}
        totalCount={animals.length}
        destCapacity={destCapacity}
        animalLabels={selectedAnimalLabels}
      />
    </>
  );
};
