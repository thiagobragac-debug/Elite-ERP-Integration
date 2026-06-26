/**
 * AssignToPastoForm.tsx
 * Formulário para associar animais sem pasto a uma área de manejo.
 *
 * Regras de negócio:
 * - Busca apenas animais com pasto_id IS NULL + status ATIVO (via ANIMAL_STATUS_ATIVO)
 * - Capacidade em UA (Unidade Animal): peso_atual / 450
 * - BLOQUEIO total para pastos em status Reforma (renovation)
 * - AVISO + confirmação explícita para pastos em Descanso (resting)
 * - BLOQUEIO para pastos em carência química (< CARENCIA_QUIMICA_DIAS)
 * - Contagem de animais por pasto via query batch (sem N+1)
 * - Status normalizado via normalizePastureStatus() (sem strings hardcoded)
 * - UPDATE seguro: filtra apenas por IDs selecionados + pasto_id IS NULL
 * - logAudit em lote + por animal individual (rastreabilidade completa)
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Trees, Search, CheckCircle2, Users, AlertCircle,
  AlertTriangle, Calendar, FileText, Filter, ChevronDown,
  X, Weight, Clock, Ban, XCircle, Info, Activity, ArrowRightLeft,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { logAudit } from '../../utils/audit';
import toast from 'react-hot-toast';
import { SearchableSelect } from './SearchableSelect';
import { DateInput } from '../Form/DateInput';
import { AssignConfirmModal } from './AssignConfirmModal';
import {
  MOTIVOS_REMANEJAMENTO,
  ANIMAL_STATUS_ATIVO,
  PASTURE_STATUS,
  normalizePastureStatus,
  CARENCIA_QUIMICA_DIAS,
} from '../../constants/livestock';
import './AnimalPicker.css';

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

/** Retorna label legível: brinco ou "Sem brinco" (nunca UUID truncado) */
function animalLabel(a: { brinco?: string | null; id: string }): string {
  if (a.brinco && a.brinco.trim()) return `#${a.brinco}`;
  return 'Sem brinco';
}

function getUa(pesoAtual: number | null | undefined): number {
  const p = parseFloat(String(pesoAtual));
  return !isNaN(p) && p > 0 ? p / 450 : 1;
}

function todayIso() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface PastoOption {
  id: string;
  nome: string;
  area?: number;
  capacidade_ua?: number;
  status?: string;
  data_ultima_fertilizacao?: string | null;
  _currentUa: number;
  _maxUa: number;
  _cabecas: number; // nº de animais já alocados
  _capacidadeInformada: boolean;
}

interface UnassignedAnimal {
  id: string;
  brinco?: string | null;
  raca?: string | null;
  categoria?: string | null;
  sexo?: string | null;
  peso_atual?: number | null;
  data_nascimento?: string | null;
}

export interface AssignToPastoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { count: number; pastoId: string }) => void;
}

// ─── Sub-componente: Destino Search ──────────────────────────────────────────

function DestSearchPasto({
  items, value, onChange,
}: { items: PastoOption[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = items.find((i) => i.id === value);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((i) => !q || i.nome.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label className="tauze-label"><Trees size={14} /> Pasto de Destino</label>
      <div
        className={`tauze-input ${open ? 'focus' : ''}`}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          cursor: 'text', padding: '0 14px',
          borderColor: open ? 'hsl(var(--brand))' : '',
          boxShadow: open ? '0 0 0 4px hsl(var(--brand) / 0.1)' : '',
        }}
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        <Search size={14} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
        {open ? (
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={selected ? selected.nome : 'Buscar pasto...'}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', fontWeight: 600, background: 'transparent', color: 'hsl(var(--text-main))', height: '100%' }}
            autoComplete="off" />
        ) : (
          <span style={{ flex: 1, fontSize: '14px', color: selected ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))', fontWeight: selected ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selected ? selected.nome : 'Buscar pasto...'}
          </span>
        )}
        {value ? (
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); setQuery(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 2px' }}>
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={14} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1200,
          background: 'hsl(var(--bg-card))', border: '1.5px solid hsl(var(--brand))',
          borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '240px', overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Nenhum pasto encontrado</div>
          ) : (
            filtered.map((item) => {
              const pct = item._maxUa ? Math.round((item._currentUa / item._maxUa) * 100) : null;
              const pctColor = pct !== null ? (pct > 100 ? '#ef4444' : pct > 85 ? '#f59e0b' : '#10b981') : undefined;
              const normalizedSt = normalizePastureStatus(item.status || '');
              const isResting = normalizedSt === PASTURE_STATUS.RESTING;
              const isRenovation = normalizedSt === PASTURE_STATUS.RENOVATION;
              const isDegraded = normalizedSt === PASTURE_STATUS.DEGRADED;
              const statusBadge = isRenovation ? '⛔ Reforma' : isResting ? '⏸ Descanso' : isDegraded ? '⚠ Degradado' : null;

              return (
                <div key={item.id}
                  onClick={() => { onChange(item.id); setQuery(''); setOpen(false); }}
                  style={{
                    padding: '10px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                    background: item.id === value ? 'hsl(var(--brand) / 0.08)' : 'transparent',
                    borderBottom: '1px solid hsl(var(--border) / 0.4)', transition: 'background 0.1s',
                    opacity: isRenovation ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = item.id === value ? 'hsl(var(--brand) / 0.08)' : 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <Trees size={13} style={{ color: 'hsl(var(--brand))', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.nome}
                        {statusBadge && <span style={{ marginLeft: '6px', fontSize: '10px', color: isRenovation ? '#dc2626' : '#d97706', fontWeight: 600 }}>{statusBadge}</span>}
                      </div>
                      <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '1px', display: 'flex', gap: '8px' }}>
                        {item.area && <span>{item.area} ha</span>}
                        {item._cabecas > 0 && <span>{item._cabecas} cab.</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    {pct !== null && <span style={{ fontSize: '10px', fontWeight: 800, color: pctColor }}>{pct}%</span>}
                    {item._maxUa > 0 && <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>{item._currentUa.toFixed(1)}/{item._maxUa.toFixed(1)} UA</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente: CapacityBar UA ──────────────────────────────────────────

function CapacityBarUa({
  current, max, adding, capacidadeInformada,
}: { current: number; max: number; adding: number; capacidadeInformada: boolean }) {
  if (!max || max <= 0) return null;
  const beforePct = Math.min((current / max) * 100, 100);
  const totalPct = Math.min(((current + adding) / max) * 100, 100);
  const color = totalPct > 100 ? '#ef4444' : totalPct > 85 ? '#f59e0b' : '#10b981';
  const label = totalPct > 100 ? 'Superlotação!' : totalPct > 85 ? 'Quase no limite' : 'Capacidade OK';

  return (
    <div style={{ padding: '14px 16px', background: 'hsl(var(--bg-main))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
      {!capacidadeInformada && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '6px 10px', background: 'hsl(var(--warning)/0.08)', borderRadius: '8px', border: '1px solid hsl(var(--warning)/0.2)' }}>
          <Info size={12} style={{ color: 'hsl(var(--warning))', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--warning))' }}>
            Capacidade do pasto não configurada — pressão calculada com estimativa de 2,5 UA/ha.
          </span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Activity size={11} /> Pressão pós-associação
        </span>
        <span style={{ fontSize: '11px', fontWeight: 800, color }}>
          {(current + adding).toFixed(1)} / {max.toFixed(1)} UA &mdash; {label}
        </span>
      </div>
      <div style={{ background: 'hsl(var(--border))', borderRadius: '99px', height: '7px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${beforePct}%`, background: '#10b981', borderRadius: '99px' }} />
        {adding > 0 && (
          <div style={{ position: 'absolute', left: `${beforePct}%`, top: 0, height: '100%', width: `${Math.min((adding / max) * 100, 100 - beforePct)}%`, background: color, opacity: 0.75, borderRadius: '0 99px 99px 0' }} />
        )}
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export const AssignToPastoForm: React.FC<AssignToPastoFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter, activeFarmId, isGlobalMode } = useFarmFilter();
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const canFetch = activeFarmId || (isGlobalMode && activeTenantId);

  const [pastos, setPastos] = useState<PastoOption[]>([]);
  const [animals, setAnimals] = useState<UnassignedAnimal[]>([]);
  const [loadingPastos, setLoadingPastos] = useState(false);
  const [loadingAnimals, setLoadingAnimals] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedPastoId, setSelectedPastoId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [movDate, setMovDate] = useState(todayIso());
  const [motivo, setMotivo] = useState('');

  // Bloqueio de destino
  const [destBloqueio, setDestBloqueio] = useState<'renovation' | 'carencia' | null>(null);
  const [destBloqueioMsg, setDestBloqueioMsg] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSexo, setFilterSexo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Buscar pastos (batch count UA + cabeças, sem N+1) ───────────────────
  const fetchPastos = async () => {
    setLoadingPastos(true);
    try {
      const { data: pastosData, error } = await applyFarmFilter(
        supabase
          .from('pastos')
          .select('id, nome, area, capacidade_ua, status, data_ultima_fertilizacao')
          .order('nome')
      );
      if (error || !pastosData) return;

      const pastoIds = pastosData.map((p: any) => p.id);
      let uaMap: Record<string, number> = {};
      let cabMap: Record<string, number> = {};

      if (pastoIds.length > 0) {
        const { data: animalData } = await supabase
          .from('animais')
          .select('pasto_id, peso_atual')
          .in('pasto_id', pastoIds)
          .in('status', ANIMAL_STATUS_ATIVO as unknown as string[]);

        (animalData || []).forEach((row: { pasto_id: string; peso_atual: number | null }) => {
          uaMap[row.pasto_id] = (uaMap[row.pasto_id] || 0) + getUa(row.peso_atual);
          cabMap[row.pasto_id] = (cabMap[row.pasto_id] || 0) + 1;
        });
      }

      setPastos(pastosData.map((p: any) => {
        const capUaInformada = parseFloat(p.capacidade_ua);
        const capacidadeInformada = !isNaN(capUaInformada) && capUaInformada > 0;
        const maxUa = capacidadeInformada ? capUaInformada : (parseFloat(p.area) || 0) * 2.5;
        return {
          ...p,
          _currentUa: uaMap[p.id] || 0,
          _maxUa: maxUa,
          _cabecas: cabMap[p.id] || 0,
          _capacidadeInformada: capacidadeInformada,
        };
      }));
    } finally {
      setLoadingPastos(false);
    }
  };

  const fetchAnimals = async () => {
    setLoadingAnimals(true);
    try {
      const { data, error } = await applyFarmFilter(
        supabase.from('animais')
          .select('id, brinco, raca, categoria, sexo, peso_atual, data_nascimento')
          .in('status', ANIMAL_STATUS_ATIVO as unknown as string[])
          .is('pasto_id', null)
      );
      if (!error && data) setAnimals(data as UnassignedAnimal[]);
    } finally {
      setLoadingAnimals(false);
    }
  };

  // ── Reset e fetch ao abrir/fechar ────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen && canFetch) {
      fetchPastos();
      fetchAnimals();
    }
    if (!isOpen) {
      setSelectedPastoId(''); setSelectedIds([]); setSearchTerm('');
      setFilterSexo(''); setFilterCategoria(''); setShowConfirm(false);
      setMotivo(''); setMovDate(todayIso());
      setDestBloqueio(null); setDestBloqueioMsg('');
    }
  }, [isOpen, activeFarmId, isGlobalMode, activeTenantId]);

  // ── Pré-selecionar pasto quando há apenas um disponível (P2) ────────────
  useEffect(() => {
    if (isOpen && pastos.length === 1 && !selectedPastoId) {
      setSelectedPastoId(pastos[0].id);
    }
  }, [isOpen, pastos, selectedPastoId]);

  // ── Avaliar bloqueios ao mudar o pasto de destino ────────────────────────
  useEffect(() => {
    if (!selectedPastoId) {
      setDestBloqueio(null);
      setDestBloqueioMsg('');
      return;
    }
    const pasto = pastos.find((p) => p.id === selectedPastoId);
    if (!pasto) return;

    const normalizedStatus = normalizePastureStatus(pasto.status || '');

    // Bloqueio total: reforma
    if (normalizedStatus === PASTURE_STATUS.RENOVATION) {
      setDestBloqueio('renovation');
      setDestBloqueioMsg('Pasto em processo de Reforma. Associações são bloqueadas até a conclusão da reforma.');
      return;
    }

    // Bloqueio: carência química
    if (pasto.data_ultima_fertilizacao) {
      const diasDesdeFert = Math.floor(
        (Date.now() - new Date(pasto.data_ultima_fertilizacao).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasDesdeFert >= 0 && diasDesdeFert < CARENCIA_QUIMICA_DIAS) {
        setDestBloqueio('carencia');
        setDestBloqueioMsg(
          `Pasto em carência química (${diasDesdeFert} dia${diasDesdeFert !== 1 ? 's' : ''} desde a última fertilização). Aguardar ${CARENCIA_QUIMICA_DIAS - diasDesdeFert} dia(s) para liberação.`
        );
        return;
      }
    }

    setDestBloqueio(null);
    setDestBloqueioMsg('');
  }, [selectedPastoId, pastos]);

  // ── Seleção de animais ────────────────────────────────────────────────────
  const selectedPasto = pastos.find((p) => p.id === selectedPastoId);
  const destCapacity = selectedPasto && selectedPasto._maxUa > 0
    ? { current: selectedPasto._currentUa, max: selectedPasto._maxUa }
    : null;

  const selectedAddingUa = useMemo(() => {
    return selectedIds.reduce((acc, id) => {
      const a = animals.find((x) => x.id === id);
      return acc + (a ? getUa(a.peso_atual) : 1);
    }, 0);
  }, [selectedIds, animals]);

  const filteredAnimals = useMemo(() => {
    return animals.filter((a) => {
      const label = animalLabel(a).toLowerCase();
      const matchSearch = !searchTerm
        || label.includes(searchTerm.toLowerCase())
        || (a.raca || '').toLowerCase().includes(searchTerm.toLowerCase())
        || (a.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch
        && (!filterSexo || a.sexo === filterSexo)
        && (!filterCategoria || a.categoria === filterCategoria);
    });
  }, [animals, searchTerm, filterSexo, filterCategoria]);

  const categorias = useMemo(
    () => [...new Set(animals.map((a) => a.categoria).filter(Boolean))] as string[],
    [animals]
  );

  const normalizedDestStatus = selectedPasto
    ? normalizePastureStatus(selectedPasto.status || '')
    : null;

  const destIsResting = normalizedDestStatus === PASTURE_STATUS.RESTING;

  const toggleAnimal = useCallback((id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredAnimals.length && filteredAnimals.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAnimals.map((a) => a.id));
    }
  }, [filteredAnimals, selectedIds]);

  const canSubmit = selectedIds.length > 0 && !!selectedPastoId && !!motivo && !destBloqueio;

  const submitDisabledReason = !selectedPastoId
    ? 'Selecione o pasto de destino'
    : destBloqueio === 'renovation'
    ? 'Pasto em Reforma — bloqueado'
    : destBloqueio === 'carencia'
    ? 'Pasto em carência química — bloqueado'
    : !motivo
    ? 'Informe o motivo da associação'
    : selectedIds.length === 0
    ? 'Selecione ao menos um animal'
    : '';

  // ── Validações + abertura do modal de revisão ─────────────────────────────
  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPastoId) { toast.error('Selecione o pasto de destino.'); return; }
    if (destBloqueio === 'renovation') { toast.error('Transferência bloqueada: pasto em Reforma.'); return; }
    if (destBloqueio === 'carencia') { toast.error('Transferência bloqueada: pasto em carência química.'); return; }
    if (!motivo) { toast.error('Informe o motivo da associação.'); return; }
    if (selectedIds.length === 0) { toast.error('Selecione ao menos um animal.'); return; }

    // Confirmação explícita para pasto em Descanso
    if (destIsResting) {
      const ok = await confirm({
        title: 'Pasto em Descanso',
        description: `O pasto "${selectedPasto?.nome}" está em período de descanso. Associar animais pode prejudicar a recuperação da pastagem. Confirma mesmo assim?`,
        confirmText: 'Sim, associar mesmo assim',
        cancelText: 'Cancelar',
        variant: 'warning',
      });
      if (!ok) return;
    }

    setShowConfirm(true);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!activeTenantId) return;
    setSubmitting(true);
    try {
      // UPDATE seguro: apenas IDs selecionados que ainda estejam sem pasto
      const { error } = await supabase
        .from('animais')
        .update({ pasto_id: selectedPastoId, updated_at: new Date().toISOString() })
        .in('id', selectedIds)
        .is('pasto_id', null);

      if (error) throw error;

      // Auditoria em lote
      await logAudit({
        tenant_id: activeTenantId,
        user_id: user?.id,
        action: 'ASSIGN_BATCH',
        entity: 'Pasto',
        entity_id: selectedPastoId,
        description: `${selectedIds.length} animais associados ao pasto "${selectedPasto?.nome}" | Motivo: ${motivo} | Data: ${movDate} | UA adicionada: ${selectedAddingUa.toFixed(1)}`,
        old_data: { pasto_id: null },
        new_data: { pasto_id: selectedPastoId, motivo, data: movDate },
      });

      // Auditoria individual por animal (rastreabilidade completa)
      await Promise.all(
        selectedIds.map((animalId) => {
          const animal = animals.find((a) => a.id === animalId);
          return logAudit({
            tenant_id: activeTenantId,
            user_id: user?.id,
            action: 'ASSIGN',
            entity: 'Animal',
            entity_id: animalId,
            description: `Animal ${animalLabel(animal || { id: animalId })} associado ao pasto "${selectedPasto?.nome}" | Motivo: ${motivo} | UA: ${getUa(animal?.peso_atual).toFixed(2)}`,
            old_data: { pasto_id: null },
            new_data: { pasto_id: selectedPastoId, motivo, data: movDate },
          });
        })
      );

      toast.success(`✅ ${selectedIds.length} ${selectedIds.length === 1 ? 'animal associado' : 'animais associados'} com sucesso!`);
      onSubmit({ count: selectedIds.length, pastoId: selectedPastoId });
      onClose();
    } catch (err: any) {
      console.error('[AssignToPastoForm] submit error:', err);
      toast.error(err?.message || 'Erro ao associar animais. Tente novamente.');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAnimalLabels = useMemo(
    () => animals.filter((a) => selectedIds.includes(a.id)).map(animalLabel),
    [animals, selectedIds]
  );

  const isLoading = loadingPastos || loadingAnimals;

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <SidePanel
        size="xlarge"
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleReview}
        title="Associar Animais ao Pasto"
        subtitle="Vincule animais sem pasto a uma área de manejo."
        icon={Trees}
        loading={isLoading}
        submitLabel={`Revisar Associação (${selectedIds.length})`}
        customFooter={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: '12px' }}>
            <button type="button" className="glass-btn secondary" onClick={onClose}>Cancelar</button>
            <button
              type="submit"
              className="primary-btn"
              disabled={isLoading || !canSubmit}
              title={submitDisabledReason || undefined}
              style={{
                boxShadow: canSubmit ? '0 8px 20px hsl(var(--brand) / 0.2)' : 'none',
                opacity: canSubmit ? 1 : 0.5,
                cursor: !canSubmit ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              <CheckCircle2 size={18} />
              {isLoading ? 'Carregando...' : `Revisar Associação (${selectedIds.length})`}
            </button>
          </div>
        }
      >
        {/* ══════════════════════════════════════
            PASSO 01 — DADOS DA ASSOCIAÇÃO
        ══════════════════════════════════════ */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 01</div>
            <h4 className="tauze-section-title">Dados da Associação</h4>
          </div>

          <div className="tauze-input-grid grid-col-2">
            {/* Pasto — coluna inteira */}
            <div className="tauze-field-group" style={{ gridColumn: '1 / -1' }}>
              <DestSearchPasto items={pastos} value={selectedPastoId} onChange={setSelectedPastoId} />

              {/* Bloqueio — Reforma */}
              {destBloqueio === 'renovation' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', marginTop: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: '#dc2626' }}>
                  <Ban size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span><strong>Associação bloqueada.</strong> {destBloqueioMsg}</span>
                </div>
              )}

              {/* Bloqueio — Carência Química */}
              {destBloqueio === 'carencia' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', marginTop: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: '#dc2626' }}>
                  <XCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span><strong>Carência química ativa.</strong> {destBloqueioMsg}</span>
                </div>
              )}

              {/* Aviso — Descanso (não bloqueia, mas alerta) */}
              {!destBloqueio && destIsResting && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', marginTop: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: '#d97706' }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Pasto em <strong>Descanso</strong>. A associação exigirá confirmação explícita antes de salvar.</span>
                </div>
              )}

              {/* Aviso — Degradado */}
              {!destBloqueio && normalizedDestStatus === PASTURE_STATUS.DEGRADED && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', marginTop: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: '#d97706' }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Pasto com condição <strong>Degradada</strong>. Verifique a aptidão da área antes de alocar animais.</span>
                </div>
              )}

              {/* Barra de capacidade — dentro do conteúdo, não no footer */}
              {destCapacity && !destBloqueio && selectedPasto && (
                <div style={{ marginTop: '12px' }}>
                  <CapacityBarUa
                    current={destCapacity.current}
                    max={destCapacity.max}
                    adding={selectedAddingUa}
                    capacidadeInformada={selectedPasto._capacidadeInformada}
                  />
                </div>
              )}
            </div>

            {/* Data */}
            <div className="tauze-field-group">
              <label className="tauze-label"><Calendar size={14} /> Data da Movimentação</label>
              <DateInput
                type="date" className="tauze-input"
                value={movDate} onChange={(e) => setMovDate(e.target.value)}
                required max={todayIso()}
              />
            </div>

            {/* Motivo */}
            <div className="tauze-field-group">
              <label className="tauze-label"><FileText size={14} /> Motivo da Associação</label>
              <SearchableSelect
                value={motivo}
                onChange={(val: string) => setMotivo(val)}
                options={[
                  { value: '', label: 'Selecione o motivo...' },
                  ...MOTIVOS_REMANEJAMENTO.map((m) => ({ value: m, label: m })),
                ]}
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            PASSO 02 — SELEÇÃO DE ANIMAIS
        ══════════════════════════════════════ */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Seleção de Animais</h4>
          </div>

          <div className="tauze-field-group full-width">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                <Users size={14} />
                Animais Sem Pasto
                {animals.length > 0 && (
                  <span style={{ background: 'hsl(var(--border))', borderRadius: '99px', padding: '1px 7px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-main))', marginLeft: '2px' }}>
                    {selectedIds.length}/{filteredAnimals.length} cab.
                    {selectedIds.length > 0 ? ` (${selectedAddingUa.toFixed(1)} UA)` : ''}
                  </span>
                )}
              </label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button type="button" className="text-btn-sm" onClick={() => setShowFilters((s) => !s)} disabled={animals.length === 0}>
                  <Filter size={11} /> FILTROS{(filterSexo || filterCategoria || searchTerm) ? ' \u25cf' : ''}
                </button>
                <button type="button" className="text-btn-sm" onClick={handleSelectAll} disabled={filteredAnimals.length === 0}>
                  {selectedIds.length === filteredAnimals.length && filteredAnimals.length > 0 ? 'DESMARCAR TODOS' : 'MARCAR TODOS'}
                </button>
              </div>
            </div>

            {/* Filtros — toggle mantido (padrão do sistema) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                    <div className="search-glass-box small" style={{ flex: 2, marginBottom: 0 }}>
                      <Search size={14} className="s-icon" />
                      <input
                        type="text" placeholder="Buscar por brinco, raça..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 4px' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <SearchableSelect value={filterSexo} onChange={(v: string) => setFilterSexo(v)}
                        options={[{ value: '', label: 'Todos os Sexos' }, { value: 'MACHO', label: 'Machos' }, { value: 'FEMEA', label: 'Fêmeas' }]} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <SearchableSelect value={filterCategoria} onChange={(v: string) => setFilterCategoria(v)}
                        options={[{ value: '', label: 'Todas as Categorias' }, ...categorias.map((c) => ({ value: c, label: c }))]} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid de animais */}
            <div className="animal-picker-container">
              {selectedIds.length > 0 && (
                <div className="picker-sticky-summary">
                  <span>{selectedIds.length} {selectedIds.length === 1 ? 'animal selecionado' : 'animais selecionados'} \u00b7 {selectedAddingUa.toFixed(1)} UA</span>
                  <button type="button" onClick={() => setSelectedIds([])}>Limpar seleção</button>
                </div>
              )}

              {loadingAnimals ? (
                <div className="picker-skeleton-grid">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="picker-skeleton-item" />)}
                </div>
              ) : animals.length === 0 ? (
                <div className="picker-empty-state">
                  <AlertCircle size={36} />
                  <h4>Nenhum animal sem pasto</h4>
                  <p>Todos os animais ativos desta fazenda já estão vinculados a um pasto.</p>
                  <button
                    type="button"
                    className="glass-btn secondary"
                    style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                    onClick={onClose}
                  >
                    <ArrowRightLeft size={14} />
                    Usar Remanejamento para mover animais entre pastos
                  </button>
                </div>
              ) : filteredAnimals.length === 0 ? (
                <div className="picker-empty-state" style={{ padding: '24px' }}>
                  <AlertCircle size={28} />
                  <h4>Sem resultados</h4>
                  <p>Nenhum animal encontrado com esses filtros.</p>
                </div>
              ) : (
                <div className="picker-list-adv">
                  {filteredAnimals.map((animal) => {
                    const isSelected = selectedIds.includes(animal.id);
                    const ua = getUa(animal.peso_atual);
                    const semBrinco = !animal.brinco || !animal.brinco.trim();
                    return (
                      <div
                        key={animal.id}
                        className={`picker-list-item ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleAnimal(animal.id)}
                      >
                        <div className="p-check-adv">
                          {isSelected ? <CheckCircle2 size={18} /> : <div className="p-check-empty" />}
                        </div>
                        <div className="p-info-row">
                          <span className={`p-brinco-adv${semBrinco ? ' sem-brinco' : ''}`}>
                            {animalLabel(animal)}
                          </span>
                          {animal.raca && <span className="p-raca-adv">{animal.raca}</span>}
                          {animal.categoria && <span className="p-tag">{animal.categoria}</span>}
                          {animal.sexo && (
                            <span className="p-tag" style={{ background: animal.sexo === 'MACHO' ? '#eff6ff' : '#fdf2f8', color: animal.sexo === 'MACHO' ? '#3b82f6' : '#ec4899' }}>
                              {animal.sexo === 'MACHO' ? 'M' : 'F'}
                            </span>
                          )}
                        </div>
                        <div className="p-stats-row">
                          {animal.peso_atual && <span><Weight size={11} /> {animal.peso_atual}kg</span>}
                          {animal.data_nascimento && <span><Clock size={11} /> {calcAge(animal.data_nascimento)}</span>}
                          <span style={{ color: 'hsl(var(--brand))', fontWeight: 800 }}>{ua.toFixed(2)} UA</span>
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

      <AssignConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        submitting={submitting}
        entityLabel="Pasto de Destino"
        destName={selectedPasto?.nome ?? '\u2014'}
        motivo={motivo}
        date={movDate}
        selectedCount={selectedIds.length}
        selectedUa={selectedAddingUa}
        destCapacity={destCapacity}
        animalLabels={selectedAnimalLabels}
        isPasto={true}
      />
    </>
  );
};
