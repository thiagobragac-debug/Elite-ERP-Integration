import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ArrowRightLeft,
  Trees,
  Search,
  CheckCircle2,
  Users,
  Calendar,
  FileText,
  Weight,
  Filter,
  X,
  AlertTriangle,
  Activity,
  ChevronDown,
  Save,
  XCircle,
  Info,
  Ban,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { logAudit } from '../../utils/audit';
import toast from 'react-hot-toast';
import { SearchableSelect } from './SearchableSelect';
import { DateInput } from '../../components/Form/DateInput';
import {
  MOTIVOS_REMANEJAMENTO,
  ANIMAL_STATUS_ATIVO,
  CARENCIA_QUIMICA_DIAS,
  PASTURE_STATUS,
  normalizePastureStatus,
} from '../../constants/livestock';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAge(birthDate: string | null): string {
  if (!birthDate) return '\u2014';
  const diff = Date.now() - new Date(birthDate).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}a ${rem}m` : `${years}a`;
}

interface PastureCapacity {
  current: number;
  max: number;
  area: number;
  capacidadeInformada: boolean; // flag: false = usou fallback estimado
}

// ─── PastureSearch ────────────────────────────────────────────────────────────
function PastureSearch({
  items,
  value,
  onChange,
  placeholder,
  label,
  exclude,
}: {
  items: any[];
  value: string;
  onChange: (id: string, name: string) => void;
  placeholder: string;
  label: React.ReactNode;
  exclude?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const available = exclude ? items.filter((i) => i.id !== exclude) : items;
  const selected = available.find((i) => i.id === value);
  const filtered = query
    ? available.filter((i) => (i.nome || '').toLowerCase().includes(query.toLowerCase()))
    : available;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (item: any) => {
    onChange(item.id, item.nome);
    setQuery('');
    setOpen(false);
  };
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label className="tauze-label">{label}</label>
      <div
        onClick={() => setOpen((o) => !o)}
        className={`tauze-input ${open ? 'focus' : ''}`}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
          padding: '0 16px', outline: open ? 'none' : '',
          borderColor: open ? 'hsl(var(--brand))' : '',
          boxShadow: open ? '0 0 0 4px hsl(var(--brand) / 0.1)' : '',
        }}
      >
        <Trees size={14} style={{ color: 'hsl(var(--brand))', flexShrink: 0 }} />
        {open ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => { e.stopPropagation(); setQuery(e.target.value); }}
            onClick={(e) => e.stopPropagation()}
            placeholder={placeholder}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontWeight: 600, background: 'transparent', color: 'hsl(var(--text-main))', height: '100%' }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: '14px', color: selected ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))', fontWeight: selected ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selected ? selected.nome : placeholder}
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
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000, background: 'hsl(var(--bg-card))', border: '1.5px solid hsl(var(--brand))', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '220px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Nenhum resultado</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: item.id === value ? 'hsl(var(--brand) / 0.08)' : 'transparent', borderBottom: '1px solid hsl(var(--border) / 0.5)', transition: 'background 0.1s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = item.id === value ? 'hsl(var(--brand) / 0.08)' : 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <Trees size={12} style={{ color: 'hsl(var(--brand))', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nome}</div>
                    {item.area && <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{item.area} ha</div>}
                  </div>
                </div>
                {item.capacidade_ua && (
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--text-muted))', flexShrink: 0, marginLeft: '8px' }}>
                    cap. {item.capacidade_ua} UA
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── PressureMeter ────────────────────────────────────────────────────────────
function PressureMeter({ cap, adding }: { cap: PastureCapacity; adding: number }) {
  const total = cap.current + adding;
  const uaHa = cap.area > 0 ? (total / cap.area).toFixed(2) : '—';
  const pct = cap.max > 0 ? Math.min((total / cap.max) * 100, 100) : 0;
  const beforePct = cap.max > 0 ? Math.min((cap.current / cap.max) * 100, 100) : 0;
  const color = pct > 100 ? '#ef4444' : pct > 85 ? '#f59e0b' : '#10b981';
  const status = pct > 100 ? 'Superlotação!' : pct > 85 ? 'Pressão Alta' : pct > 50 ? 'Pressão Moderada' : 'Pressão Ideal';

  return (
    <div style={{ padding: '14px 16px', background: 'hsl(var(--bg-main))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
      {!cap.capacidadeInformada && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '6px 10px', background: 'hsl(var(--warning)/0.08)', borderRadius: '8px', border: '1px solid hsl(var(--warning)/0.2)' }}>
          <Info size={12} style={{ color: 'hsl(var(--warning))', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--warning))' }}>
            Capacidade do pasto não configurada — usando estimativa de 2,5 UA/ha.
          </span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Activity size={11} /> Pressão de Pastejo Pós-Transferência
        </span>
        <span style={{ fontSize: '12px', fontWeight: 800, color }}>{uaHa} UA/ha — {status}</span>
      </div>
      <div style={{ background: 'hsl(var(--border))', borderRadius: '99px', height: '8px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${beforePct}%`, background: '#10b981', borderRadius: '99px' }} />
        {adding > 0 && (
          <div style={{ position: 'absolute', left: `${beforePct}%`, top: 0, height: '100%', width: `${Math.min((adding / (cap.max || 1)) * 100, 100 - beforePct)}%`, background: color, opacity: 0.75, borderRadius: '0 99px 99px 0' }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{total.toFixed(1)} UA total / {cap.area} ha</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Capacidade: {cap.max.toFixed(1)} UA</span>
      </div>
      {pct > 100 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '8px 10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
          <AlertTriangle size={12} color="#ef4444" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>Atenção: transferência ultrapassará a capacidade de suporte do pasto de destino.</span>
        </div>
      )}
    </div>
  );
}

// ─── Row helper ──────────────────────────────────────────────────────────────
function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 800, color: color || 'hsl(var(--text-main))' }}>{value}</span>
    </div>
  );
}

// ─── Tipos de destino bloqueado ────────────────────────────────────────────────
type DestBloqueio = 'renovation' | 'carencia' | null;

// ─── Props ────────────────────────────────────────────────────────────────────
interface PastureRelocateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialSourcePastureId?: string;
  actionId?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
export const PastureRelocateForm: React.FC<PastureRelocateFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialSourcePastureId,
}) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter, activeFarmId, isGlobalMode } = useFarmFilter();
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pastures, setPastures] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSexo, setFilterSexo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [destCap, setDestCap] = useState<PastureCapacity | null>(null);
  const [destBloqueio, setDestBloqueio] = useState<DestBloqueio>(null);
  const [destBloqueioMsg, setDestBloqueioMsg] = useState('');

  const [sourcePastureId, setSourcePastureId] = useState(initialSourcePastureId || '');
  const [sourcePastureName, setSourcePastureName] = useState('');
  const [targetPastureId, setTargetPastureId] = useState('');
  const [targetPastureName, setTargetPastureName] = useState('');
  const [date, setDate] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [motivo, setMotivo] = useState('');

  const canFetch = activeFarmId || (isGlobalMode && activeTenantId);

  // ── Reset ao fechar ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setSelectedAnimals([]);
      setSearchTerm('');
      setFilterSexo('');
      setFilterCategoria('');
      setDestCap(null);
      setDestBloqueio(null);
      setDestBloqueioMsg('');
      setShowFilters(false);
      setSourcePastureId(initialSourcePastureId || '');
      setSourcePastureName('');
      setTargetPastureId('');
      setTargetPastureName('');
      setDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
      setMotivo('');
    }
  }, [isOpen, initialSourcePastureId]);

  useEffect(() => {
    if (isOpen && canFetch) fetchPastures();
  }, [isOpen, activeFarmId, isGlobalMode, activeTenantId]);

  useEffect(() => {
    if (sourcePastureId) {
      fetchAnimals(sourcePastureId);
    } else {
      setAnimals([]);
      setSelectedAnimals([]);
    }
  }, [sourcePastureId]);

  useEffect(() => {
    if (targetPastureId) {
      evaluateDestination(targetPastureId);
    } else {
      setDestCap(null);
      setDestBloqueio(null);
      setDestBloqueioMsg('');
    }
  }, [targetPastureId, pastures]);

  // ── Fetchers ─────────────────────────────────────────────────────────────
  const fetchPastures = useCallback(async () => {
    const { data, error } = await applyFarmFilter(
      supabase.from('pastos').select('id, nome, area, capacidade_ua, status, data_ultima_fertilizacao').eq('tenant_id', activeTenantId).order('nome')
    );
    if (error) console.error('[PastureRelocateForm] fetchPastures error:', error);
    if (data) setPastures(data);
  }, [applyFarmFilter]);

  const fetchAnimals = async (pastureId: string) => {
    setLoading(true);
    setSelectedAnimals([]);
    const { data } = await supabase
      .from('animais')
      .select('id, brinco, raca, categoria, sexo, peso_atual, data_nascimento').eq('tenant_id', activeTenantId)
      .eq('pasto_id', pastureId)
      .eq('tenant_id', activeTenantId)
      .in('status', ANIMAL_STATUS_ATIVO as unknown as string[]);
    if (data) setAnimals(data);
    setLoading(false);
  };

  // ── Avaliar pasto de destino: capacidade + bloqueios ─────────────────────
  const evaluateDestination = useCallback(async (pastureId: string) => {
    const pasture = pastures.find((p) => p.id === pastureId);
    if (!pasture) return;

    const area = parseFloat(pasture.area) || 0;
    const capUaInformada = parseFloat(pasture.capacidade_ua);
    const capacidadeInformada = !isNaN(capUaInformada) && capUaInformada > 0;
    const capUa = capacidadeInformada ? capUaInformada : area * 2.5;

    // Buscar UA atual do destino
    const { data } = await supabase
      .from('animais')
      .select('peso_atual').eq('tenant_id', activeTenantId)
      .eq('pasto_id', pastureId)
      .eq('tenant_id', activeTenantId)
      .in('status', ANIMAL_STATUS_ATIVO as unknown as string[]);

    let currentUa = 0;
    if (data) {
      currentUa = data.reduce((acc, a) => {
        const p = parseFloat(a.peso_atual);
        return acc + (!isNaN(p) && p > 0 ? p / 450 : 1);
      }, 0);
    }

    setDestCap({ current: currentUa, max: capUa, area, capacidadeInformada });

    // ── Verificar bloqueios ──────────────────────────────────────────────
    const normalizedStatus = normalizePastureStatus(pasture.status || '');

    // Bloqueio total: pasto em reforma
    if (normalizedStatus === PASTURE_STATUS.RENOVATION) {
      setDestBloqueio('renovation');
      setDestBloqueioMsg('Pasto de destino está em processo de Reforma. Transferências são proibidas até a conclusão.');
      return;
    }

    // Bloqueio de carência química
    if (pasture.data_ultima_fertilizacao) {
      const diasDesdeFert = Math.floor(
        (Date.now() - new Date(pasture.data_ultima_fertilizacao).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasDesdeFert >= 0 && diasDesdeFert < CARENCIA_QUIMICA_DIAS) {
        setDestBloqueio('carencia');
        setDestBloqueioMsg(`Pasto em carência química (${diasDesdeFert} dias desde última fertilização). Aguardar ${CARENCIA_QUIMICA_DIAS - diasDesdeFert} dia(s) para liberação segura.`);
        return;
      }
    }

    setDestBloqueio(null);
    setDestBloqueioMsg('');
  }, [pastures]);

  // ── Seleção de animais ────────────────────────────────────────────────────
  const toggleAnimal = (id: string) => {
    setSelectedAnimals((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  // Categorias dinâmicas geradas a partir dos animais carregados
  const categoriasDinamicas = useMemo(
    () => [...new Set(animals.map((a) => a.categoria).filter(Boolean))] as string[],
    [animals]
  );

  const filteredAnimals = useMemo(() => {
    return animals.filter((a) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (a.brinco || '').toLowerCase().includes(q) ||
        (a.raca || '').toLowerCase().includes(q) ||
        (a.categoria || '').toLowerCase().includes(q) ||
        (a.sexo || '').toLowerCase().includes(q);
      const matchSexo = !filterSexo || a.sexo === filterSexo;
      const matchCategoria = !filterCategoria || a.categoria === filterCategoria;
      return matchSearch && matchSexo && matchCategoria;
    });
  }, [animals, searchTerm, filterSexo, filterCategoria]);

  const getAnimalUa = (animal: any) => {
    const peso = parseFloat(animal.peso_atual);
    return !isNaN(peso) && peso > 0 ? peso / 450 : 1;
  };

  const selectedUaTotal = useMemo(
    () => selectedAnimals.reduce((acc, id) => acc + (animals.find((a) => a.id === id) ? getAnimalUa(animals.find((a) => a.id === id)) : 0), 0),
    [selectedAnimals, animals]
  );

  const selectAll = () => {
    if (selectedAnimals.length === filteredAnimals.length && filteredAnimals.length > 0) {
      setSelectedAnimals([]);
    } else {
      setSelectedAnimals(filteredAnimals.map((a) => a.id));
    }
  };

  const sourceName = sourcePastureName || pastures.find((p) => p.id === sourcePastureId)?.nome || '';
  const targetName = targetPastureName || pastures.find((p) => p.id === targetPastureId)?.nome || '';

  // ── Validação do pasto de destino em "Descanso" — exige confirmação ──────
  const targetIsResting = useMemo(() => {
    const t = pastures.find((p) => p.id === targetPastureId);
    if (!t) return false;
    return normalizePastureStatus(t.status || '') === PASTURE_STATUS.RESTING;
  }, [targetPastureId, pastures]);

  // ── Submit com validações ─────────────────────────────────────────────────
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAnimals.length === 0) { toast.error('Selecione ao menos um animal.'); return; }
    if (!targetPastureId) { toast.error('Selecione o pasto de destino.'); return; }
    if (!motivo) { toast.error('Informe o motivo do remanejamento.'); return; }
    if (destBloqueio === 'renovation') {
      toast.error('Transferência bloqueada: pasto de destino em Reforma.');
      return;
    }
    if (destBloqueio === 'carencia') {
      toast.error('Transferência bloqueada: pasto de destino em carência química.');
      return;
    }

    // Exige confirmação explícita se destino estiver em Descanso
    if (targetIsResting) {
      const ok = await confirm({
        title: 'Pasto em Descanso',
        description: `O pasto "${targetName}" está em período de descanso. A introdução de animais pode prejudicar a recuperação da pastagem. Confirma a transferência mesmo assim?`,
        confirmText: 'Sim, transferir mesmo assim',
        cancelText: 'Cancelar',
        variant: 'warning',
      });
      if (!ok) return;
    }

    // Exibe modal de revisão via useConfirm
    const afterUa = (destCap?.current || 0) + selectedUaTotal;
    const afterUaHa = destCap && destCap.area > 0 ? (afterUa / destCap.area).toFixed(2) : null;
    const afterPct = destCap?.max ? Math.round((afterUa / destCap.max) * 100) : null;

    const pressaoStr = afterUaHa
      ? `\nPressão pós-mov.: ${afterUaHa} UA/ha (${afterPct}% capacidade)`
      : '';

    const ok = await confirm({
      title: 'Confirmar Remanejamento',
      description: `${selectedAnimals.length} animais (${selectedUaTotal.toFixed(1)} UA) serão transferidos de "${sourceName}" para "${targetName}".\nMotivo: ${motivo}\nData: ${new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')}${pressaoStr}`,
      confirmText: `Transferir ${selectedAnimals.length} animais`,
      cancelText: 'Voltar e revisar',
      variant: afterPct && afterPct > 100 ? 'warning' : 'primary',
    });
    if (!ok) return;

    await handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('animais')
        .update({ pasto_id: targetPastureId })
        .eq('tenant_id', activeTenantId)
        .in('id', selectedAnimals);

      if (!error) {
        if (activeTenantId) {
          const afterUa = (destCap?.current || 0) + selectedUaTotal;
          const afterUaHa =
            destCap && destCap.area > 0
              ? ((afterUa) / destCap.area).toFixed(2)
              : '—';

          await logAudit({
            tenant_id: activeTenantId,
            user_id: user?.id,
            action: 'TRANSFER_BATCH',
            entity: 'Pasto',
            entity_id: sourcePastureId,
            description: `Transferência de ${selectedAnimals.length} animais (${selectedUaTotal.toFixed(1)} UA) do pasto "${sourceName}" para "${targetName}" | Motivo: ${motivo} | Data: ${date} | Pressão pós: ${afterUaHa} UA/ha`,
            old_data: { pasto_id: sourcePastureId, animals_count: selectedAnimals.length },
            new_data: { pasto_id: targetPastureId, motivo, data: date },
          });

          await Promise.all(
            selectedAnimals.map((animalId) => {
              const animal = animals.find((a) => a.id === animalId);
              return logAudit({
                tenant_id: activeTenantId,
                user_id: user?.id,
                action: 'TRANSFER',
                entity: 'Animal',
                entity_id: animalId,
                description: `Animal #${animal?.brinco || animalId} transferido de "${sourceName}" para "${targetName}" | Motivo: ${motivo}`,
                old_data: { pasto_id: sourcePastureId },
                new_data: { pasto_id: targetPastureId, motivo, data: date },
              });
            })
          );
        }

        toast.success(`✅ ${selectedAnimals.length} animais remanejados com sucesso!`);
        onSubmit({ count: selectedAnimals.length, source: sourcePastureId, target: targetPastureId });
        onClose();
      } else {
        toast.error('Erro ao salvar remanejamento. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro inesperado ao processar remanejamento.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Botão de revisão desabilitado quando incompleto ───────────────────────
  const canSubmit =
    selectedAnimals.length > 0 &&
    !!targetPastureId &&
    !!motivo &&
    !destBloqueio;

  const submitDisabledReason = !targetPastureId
    ? 'Selecione o pasto de destino'
    : !motivo
    ? 'Informe o motivo'
    : selectedAnimals.length === 0
    ? 'Selecione ao menos um animal'
    : destBloqueio === 'renovation'
    ? 'Pasto de destino em Reforma — bloqueado'
    : destBloqueio === 'carencia'
    ? 'Pasto de destino em carência química'
    : '';

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SidePanel
      size="xlarge"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleConfirm}
      title="Remanejamento de Pasto"
      subtitle="Transfira animais entre piquetes e pastagens com rastreabilidade total."
      icon={ArrowRightLeft}
      loading={submitting}
      submitLabel={`Revisar Remanejamento (${selectedAnimals.length})`}
      submitDisabled={!canSubmit}
      customFooter={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: '16px' }}>
          <button type="button" className="glass-btn secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="primary-btn"
            disabled={!canSubmit || submitting}
            title={submitDisabledReason || undefined}
            style={{
              boxShadow: canSubmit ? '0 8px 20px hsl(var(--brand) / 0.2)' : 'none',
              opacity: !canSubmit ? 0.5 : 1,
              cursor: !canSubmit ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={18} />
            {submitting ? 'Processando...' : `Revisar Remanejamento (${selectedAnimals.length})`}
          </button>
        </div>
      }
    >
      {/* ══════════════════════════════════════════════════
          PASSO 01 — ORIGEM E DESTINO
      ══════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Origem e Destino</h4>
        </div>

        <div className="tauze-input-grid grid-col-4">
          {/* Pasto de Origem */}
          <div className="tauze-field-group">
            <PastureSearch
              items={pastures}
              value={sourcePastureId}
              onChange={(id, name) => { setSourcePastureId(id); setSourcePastureName(name); }}
              placeholder="Buscar pasto de origem..."
              label={<><Trees size={14} /> Pasto de Origem</>}
            />
          </div>

          {/* Pasto de Destino */}
          <div className="tauze-field-group">
            <PastureSearch
              items={pastures}
              value={targetPastureId}
              onChange={(id, name) => { setTargetPastureId(id); setTargetPastureName(name); }}
              placeholder="Buscar pasto de destino..."
              label={<><Trees size={14} /> Pasto de Destino</>}
              exclude={sourcePastureId}
            />

            {/* Bloqueio — Reforma */}
            {destBloqueio === 'renovation' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>
                <Ban size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Transferência bloqueada.</strong> {destBloqueioMsg}</span>
              </div>
            )}

            {/* Bloqueio — Carência Química */}
            {destBloqueio === 'carencia' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>
                <XCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Carência química ativa.</strong> {destBloqueioMsg}</span>
              </div>
            )}

            {/* Aviso — Descanso (não bloqueia, mas alerta) */}
            {!destBloqueio && targetIsResting && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Área em <strong>Descanso</strong>. A transferência exigirá confirmação explícita.</span>
              </div>
            )}
          </div>

          {/* Data do Remanejamento */}
          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data do Remanejamento</label>
            <DateInput
              className="tauze-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
            />
          </div>

          {/* Motivo */}
          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Motivo do Remanejamento</label>
            <SearchableSelect
              value={motivo}
              onChange={(val: any) => setMotivo(val)}
              options={[
                { value: '', label: 'Selecione o motivo...' },
                ...MOTIVOS_REMANEJAMENTO.map((m) => ({ value: m, label: m })),
              ]}
            />
          </div>
        </div>

        {/* PressureMeter — dentro do conteúdo, não no footer */}
        {destCap && !destBloqueio && (
          <div style={{ marginTop: '16px' }}>
            <PressureMeter cap={destCap} adding={selectedUaTotal} />
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════
          PASSO 02 — SELECIONAR ANIMAIS
      ══════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Selecionar Animais</h4>
        </div>

        <div className="tauze-field-group">
          {/* Header com contagem e ações */}
          <div className="tauze-selection-header">
            <label>
              <Users size={14} /> Selecionar Animais
              {animals.length > 0 && (
                <span style={{ background: 'hsl(var(--border))', borderRadius: '99px', padding: '1px 7px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-main))', marginLeft: '6px' }}>
                  {selectedAnimals.length}/{filteredAnimals.length} cab. ({selectedUaTotal.toFixed(1)} UA)
                </span>
              )}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="text-btn-sm"
                onClick={() => setShowFilters((s) => !s)}
                disabled={animals.length === 0}
                style={{ opacity: animals.length === 0 ? 0.35 : 1 }}
              >
                <Filter size={12} style={{ display: 'inline', marginRight: '3px' }} />
                FILTROS{(filterSexo || filterCategoria || searchTerm) ? ' ●' : ''}
              </button>
              <button
                type="button"
                className="text-btn-sm"
                onClick={selectAll}
                disabled={filteredAnimals.length === 0}
                style={{ opacity: filteredAnimals.length === 0 ? 0.35 : 1 }}
              >
                {selectedAnimals.length === filteredAnimals.length && filteredAnimals.length > 0 ? 'DESMARCAR TODOS' : 'MARCAR TODOS'}
              </button>
            </div>
          </div>

          {/* Painel de filtros — mantém o toggle conforme solicitado */}
          {showFilters && animals.length > 0 && (
            <div style={{ marginBottom: '12px', display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
              <div className="search-glass-box small" style={{ margin: 0, flex: 2 }}>
                <Search size={14} className="s-icon" />
                <input
                  type="text"
                  placeholder="Buscar por brinco, raça..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 4px' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                {/* Sexo */}
                <select
                  style={{ flex: 1, fontSize: '12px', padding: '8px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-main))', outline: 'none' }}
                  value={filterSexo}
                  onChange={(e) => setFilterSexo(e.target.value)}
                >
                  <option value="">Qualquer Sexo</option>
                  <option value="MACHO">Machos</option>
                  <option value="FEMEA">Fêmeas</option>
                </select>
                {/* Categoria — dinâmica */}
                <select
                  style={{ flex: 1, fontSize: '12px', padding: '8px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-main))', outline: 'none' }}
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                >
                  <option value="">Qualquer Categoria</option>
                  {categoriasDinamicas.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Lista de animais */}
          <div className="tauze-animal-picker">
            {loading ? (
              // Skeleton de loading — cards no grid
              <div className="picker-list-adv">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} style={{ padding: '14px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '4px', background: 'hsl(var(--border))', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ height: 12, width: '40%', borderRadius: '4px', background: 'hsl(var(--border))', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      <div style={{ height: 10, width: '60%', borderRadius: '4px', background: 'hsl(var(--border))', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : !sourcePastureId ? (
              <div className="picker-empty">Selecione um pasto de origem para ver os animais.</div>
            ) : animals.length === 0 ? (
              <div className="picker-empty">Nenhum animal ativo neste pasto.</div>
            ) : filteredAnimals.length === 0 ? (
              <div className="picker-empty">Nenhum animal encontrado com esse filtro.</div>
            ) : (
              <div className="picker-list-adv">
                {filteredAnimals.map((animal) => (
                  <div
                    key={animal.id}
                    className={`picker-list-item ${selectedAnimals.includes(animal.id) ? 'active' : ''}`}
                    onClick={() => toggleAnimal(animal.id)}
                  >
                    <div className="p-check-adv" style={{ marginTop: 0 }}>
                      {selectedAnimals.includes(animal.id) ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <div className="p-check-empty" style={{ width: '18px', height: '18px' }} />
                      )}
                    </div>
                    <div className="p-info-row">
                      <span className="p-brinco-adv" style={{ minWidth: '70px', fontSize: '13px' }}>#{animal.brinco}</span>
                      <span className="p-raca-adv" style={{ minWidth: '90px', fontSize: '11px' }}>{animal.raca || '\u2014'}</span>
                      {animal.categoria && <span className="p-tag">{animal.categoria}</span>}
                      {animal.sexo && (
                        <span className="p-tag" style={{ background: animal.sexo === 'MACHO' ? '#eff6ff' : '#fdf2f8', color: animal.sexo === 'MACHO' ? '#3b82f6' : '#ec4899' }}>
                          {animal.sexo === 'MACHO' ? 'M' : 'F'}
                        </span>
                      )}
                    </div>
                    <div className="p-stats-row">
                      {animal.peso_atual && <span><Weight size={12} /> {animal.peso_atual}kg</span>}
                      {animal.data_nascimento && <span style={{ minWidth: '70px' }}>🎂 {calcAge(animal.data_nascimento)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .tauze-selection-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .text-btn-sm { background: none; border: none; font-size: 10px; font-weight: 800; color: hsl(var(--brand)); cursor: pointer; letter-spacing: 0.05em; text-transform: uppercase; display: inline-flex; align-items: center; }
        .tauze-animal-picker { max-height: 400px; overflow-y: auto; background: hsl(var(--bg-main)); border: 1px solid hsl(var(--border)); border-radius: 12px; padding: 12px; }
        .picker-list-adv { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .picker-list-item { display: flex; align-items: center; padding: 10px 14px; background: hsl(var(--bg-card)); border: 1px solid hsl(var(--border)); border-radius: 12px; cursor: pointer; transition: all 0.15s; }
        .picker-list-item:hover { border-color: hsl(var(--brand)); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .picker-list-item.active { border-color: hsl(var(--brand)); background: hsl(var(--brand) / 0.05); }
        .p-info-row { display: flex; align-items: center; gap: 12px; flex: 1; margin-left: 12px; }
        .p-stats-row { display: flex; align-items: center; gap: 16px; margin-left: auto; }
        .p-stats-row span { font-size: 11px; font-weight: 700; color: hsl(var(--text-muted)); display: flex; align-items: center; gap: 4px; }
        .p-check-adv { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex-shrink: 0; color: hsl(var(--brand)); }
        .p-check-empty { width: 18px; height: 18px; border: 2px solid hsl(var(--border)); border-radius: 4px; }
        .p-brinco-adv { font-size: 13px; font-weight: 800; color: hsl(var(--text-main)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .p-raca-adv { font-size: 11px; font-weight: 600; color: hsl(var(--text-muted)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .p-tag { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: hsl(var(--brand) / 0.08); color: hsl(var(--brand)); text-transform: uppercase; letter-spacing: 0.04em; }
        .picker-loading, .picker-empty { padding: 24px; text-align: center; font-size: 12px; font-weight: 600; color: hsl(var(--text-muted)); }
      `}</style>
    </SidePanel>
  );
};
