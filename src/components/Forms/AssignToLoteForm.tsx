/**
 * AssignToLoteForm.tsx
 * Formulário especializado para associar animais sem lote ao seu primeiro lote.
 *
 * Regras de negócio:
 * - Busca apenas animais com lote_id IS NULL
 * - Valida restrições do lote: sexo_permitido, exige_rastreabilidade
 * - Chama RPC assign_animals (atômica: UPDATE animais + INSERT historico)
 * - Contagem de animais por lote via query batch (sem N+1)
 * - Status normalizado: .eq('status', 'ATIVO') — trigger trg_animal_status_normalize
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Layers, Search, CheckCircle2, Users, AlertCircle,
  AlertTriangle, Calendar, FileText, Filter, ChevronDown,
  X, MapPin, Weight, Clock,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { SearchableSelect } from './SearchableSelect';
import { DateInput } from '../Form/DateInput';
import { AssignConfirmModal } from './AssignConfirmModal';
import './AnimalPicker.css';

// ─── Constantes ──────────────────────────────────────────────────────────────

const MOTIVOS_LOTE = [
  'Desmama',
  'Separação por categoria',
  'Separação por sexo',
  'Transferência de fazenda',
  'Início de confinamento',
  'Início de pastejo rotacionado',
  'Reagrupamento',
  'Outro',
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const diff = Date.now() - new Date(birthDate).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}a ${rem}m` : `${years}a`;
}

function animalLabel(a: { brinco?: string | null; id: string }): string {
  if (a.brinco) return `#${a.brinco}`;
  return `#${a.id.slice(0, 6)}`;
}

function todayIso() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
}

// ─── Sub-componente: Destino Search ──────────────────────────────────────────

interface LoteOption {
  id: string;
  nome: string;
  capacidade?: number;
  descricao?: string;
  sexo_permitido?: string;
  exige_rastreabilidade?: boolean;
  _animalCount: number;
  pasto?: { nome: string } | null;
}

interface DestSearchLoteProps {
  items: LoteOption[];
  value: string;
  onChange: (id: string) => void;
}

function DestSearchLote({ items, value, onChange }: DestSearchLoteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = items.find((i) => i.id === value);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(
      (i) => !q || i.nome.toLowerCase().includes(q) || (i.descricao || '').toLowerCase().includes(q)
    );
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
      <label className="tauze-label"><Layers size={14} /> Lote de Destino</label>
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
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={selected ? selected.nome : 'Buscar lote...'}
            style={{
              border: 'none', outline: 'none', flex: 1,
              fontSize: '14px', fontWeight: 600,
              background: 'transparent', color: 'hsl(var(--text-main))', height: '100%',
            }}
            autoComplete="off"
          />
        ) : (
          <span style={{
            flex: 1, fontSize: '14px',
            color: selected ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
            fontWeight: selected ? 600 : 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {selected ? selected.nome : 'Buscar lote...'}
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
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          zIndex: 1200, background: 'hsl(var(--bg-card))',
          border: '1.5px solid hsl(var(--brand))', borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '240px', overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              Nenhum lote encontrado
            </div>
          ) : (
            filtered.map((item) => {
              const pct = item.capacidade ? Math.round((item._animalCount / item.capacidade) * 100) : null;
              const pctColor = pct !== null ? (pct > 100 ? '#ef4444' : pct > 85 ? '#f59e0b' : '#10b981') : undefined;
              return (
                <div
                  key={item.id}
                  onClick={() => { onChange(item.id); setQuery(''); setOpen(false); }}
                  style={{
                    padding: '10px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                    background: item.id === value ? 'hsl(var(--brand) / 0.08)' : 'hsl(var(--bg-card))',
                    borderBottom: '1px solid hsl(var(--border) / 0.4)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = item.id === value ? 'hsl(var(--brand) / 0.08)' : 'hsl(var(--bg-card))')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <Layers size={13} style={{ color: 'hsl(var(--brand))', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.nome}
                      </div>
                      {item.pasto?.nome && (
                        <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '1px' }}>
                          {item.pasto.nome}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    {pct !== null && (
                      <span style={{ fontSize: '10px', fontWeight: 800, color: pctColor }}>{pct}%</span>
                    )}
                    {item.capacidade && (
                      <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                        {item._animalCount}/{item.capacidade} cab.
                      </span>
                    )}
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

// ─── Sub-componente: CapacityBar ──────────────────────────────────────────────

function CapacityBar({ current, max, adding }: { current: number; max: number; adding: number }) {
  if (!max || max <= 0) return null;
  const beforePct = Math.min((current / max) * 100, 100);
  const totalPct = Math.min(((current + adding) / max) * 100, 100);
  const color = totalPct > 100 ? '#ef4444' : totalPct > 85 ? '#f59e0b' : '#10b981';
  const label = totalPct > 100 ? 'Superlotação!' : totalPct > 85 ? 'Quase no limite' : 'Capacidade OK';

  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Cap. do destino
        </span>
        <span style={{ fontSize: '11px', fontWeight: 800, color }}>
          {Math.round(current + adding)} / {Math.round(max)} Cab. — {label}
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

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UnassignedAnimal {
  id: string;
  brinco?: string | null;
  brinco_eletronico?: string | null;
  raca?: string | null;
  categoria?: string | null;
  sexo?: string | null;
  peso_atual?: number | null;
  data_nascimento?: string | null;
  fazenda_id?: string;
}

export interface AssignToLoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { count: number; lotId: string }) => void;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export const AssignToLoteForm: React.FC<AssignToLoteFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter, activeFarmId, isGlobalMode } = useFarmFilter();
  const { user } = useAuth();

  // Pode buscar quando há fazenda ativa ou está em modo global com tenant
  const canFetch = activeFarmId || (isGlobalMode && activeTenantId);

  // Estado de dados
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [animals, setAnimals] = useState<UnassignedAnimal[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [loadingAnimals, setLoadingAnimals] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Seleção e form
  const [selectedLoteId, setSelectedLoteId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [movDate, setMovDate] = useState(todayIso());
  const [motivo, setMotivo] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSexo, setFilterSexo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Capacidade e confirmação
  const [destCapacity, setDestCapacity] = useState<{ current: number; max: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Disparar fetch com deps corretos (padrão original) ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen && canFetch) {
      fetchLotes();
      fetchAnimals();
    }
    if (!isOpen) {
      setSelectedLoteId(''); setSelectedIds([]); setSearchTerm('');
      setFilterSexo(''); setFilterCategoria(''); setShowConfirm(false);
      setDestCapacity(null); setMotivo(''); setMovDate(todayIso());
    }
  }, [isOpen, activeFarmId, isGlobalMode, activeTenantId]);

  // ── Buscar lotes (batch count — sem N+1) ──
  const fetchLotes = async () => {
    setLoadingLotes(true);
    try {
      const { data: lotesData, error } = await applyFarmFilter(
        supabase.from('lotes').select('id, nome, capacidade, descricao, sexo_permitido, exige_rastreabilidade, pastos(nome)').eq('tenant_id', activeTenantId).order('nome')
      ).neq('status', 'ARQUIVADO');

      if (error || !lotesData) return;

      // Batch count: um único select agrupado
      const loteIds = lotesData.map((l: any) => l.id);
      let countMap: Record<string, number> = {};

      if (loteIds.length > 0) {
        const { data: countData } = await supabase
          .from('animais')
          .select('lote_id').eq('tenant_id', activeTenantId)
          .in('lote_id', loteIds)
          .eq('status', 'ATIVO');

        (countData || []).forEach((row: { lote_id: string }) => {
          countMap[row.lote_id] = (countMap[row.lote_id] || 0) + 1;
        });
      }

      setLotes(lotesData.map((l: any) => ({
        ...l,
        pasto: l.pastos || null,
        _animalCount: countMap[l.id] || 0,
      })));
    } finally {
      setLoadingLotes(false);
    }
  };

  // ── Buscar animais sem lote ──
  const fetchAnimals = async () => {
    setLoadingAnimals(true);
    try {
      const { data, error } = await applyFarmFilter(
        supabase.from('animais')
          .select('id, brinco, brinco_eletronico, raca, categoria, sexo, peso_atual, data_nascimento, fazenda_id').eq('tenant_id', activeTenantId)
          .eq('status', 'ATIVO')
          .is('lote_id', null)
      );
      if (!error && data) setAnimals(data as UnassignedAnimal[]);
    } finally {
      setLoadingAnimals(false);
    }
  };

  // ── Capacidade do lote selecionado ──
  useEffect(() => {
    const lot = lotes.find((l) => l.id === selectedLoteId);
    if (!lot) { setDestCapacity(null); return; }
    const max = parseFloat(String(lot.capacidade)) || 0;
    if (!max) { setDestCapacity(null); return; }
    setDestCapacity({ current: lot._animalCount, max });
  }, [selectedLoteId, lotes]);

  // ── Filtros ──
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

  const categorias = useMemo(() => [...new Set(animals.map((a) => a.categoria).filter(Boolean))], [animals]);

  // ── Restrições do lote ──
  const selectedLot = lotes.find((l) => l.id === selectedLoteId);

  const isAnimalBlocked = useCallback((a: UnassignedAnimal): { blocked: boolean; reason?: string } => {
    if (!selectedLot) return { blocked: false };
    if (selectedLot.sexo_permitido && selectedLot.sexo_permitido !== 'MISTO' && a.sexo && a.sexo !== selectedLot.sexo_permitido)
      return { blocked: true, reason: `Lote permite apenas ${selectedLot.sexo_permitido}S` };
    if (selectedLot.exige_rastreabilidade && !a.brinco_eletronico)
      return { blocked: true, reason: 'Lote exige brinco eletrônico (RFID)' };
    return { blocked: false };
  }, [selectedLot]);

  // ── Toggle individual ──
  const toggleAnimal = useCallback((id: string) => {
    const animal = animals.find((a) => a.id === id);
    if (!animal) return;
    const { blocked, reason } = isAnimalBlocked(animal);
    if (blocked) { toast.error(reason || 'Animal bloqueado.'); return; }
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, [animals, isAnimalBlocked]);

  // ── Selecionar todos (com feedback de bloqueados) ──
  const handleSelectAll = useCallback(() => {
    const allowed = filteredAnimals.filter((a) => !isAnimalBlocked(a).blocked);
    const blockedCount = filteredAnimals.length - allowed.length;

    if (selectedIds.length === allowed.length && allowed.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allowed.map((a) => a.id));
      if (blockedCount > 0)
        toast.error(`${blockedCount} ${blockedCount === 1 ? 'animal ignorado' : 'animais ignorados'} por restrições do lote.`);
    }
  }, [filteredAnimals, selectedIds, isAnimalBlocked]);

  // ── Validação do submit ──
  const canSubmit = selectedIds.length > 0 && !!selectedLoteId && !!motivo;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!selectedLoteId) toast.error('Selecione o lote de destino.');
      else if (!motivo) toast.error('Informe o motivo da associação.');
      else toast.error('Selecione ao menos um animal.');
      return;
    }
    setShowConfirm(true);
  };

  // ── Submissão via RPC ──
  const handleSubmit = async () => {
    if (!activeTenantId) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('assign_animals', {
        p_animal_ids:    selectedIds,
        p_target_lot_id: selectedLoteId,
        p_date:          movDate,
        p_motivo:        motivo,
        p_tenant_id:     activeTenantId,
        p_user_id:       user?.id ?? null,
      });

      if (error) throw error;

      const result = data as { success: boolean; assigned?: number; error?: string };
      if (!result.success) throw new Error(result.error || 'Erro desconhecido.');

      toast.success(`${result.assigned} ${result.assigned === 1 ? 'animal associado' : 'animais associados'} com sucesso!`);
      onSubmit({ count: result.assigned ?? selectedIds.length, lotId: selectedLoteId });
      onClose();
    } catch (err: any) {
      console.error('[AssignToLoteForm] submit error:', err);
      toast.error(err?.message || 'Erro ao associar animais. Tente novamente.');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Labels de preview para modal de confirmação ──
  const selectedAnimalLabels = useMemo(
    () => animals.filter((a) => selectedIds.includes(a.id)).map(animalLabel),
    [animals, selectedIds]
  );

  const isLoading = loadingLotes || loadingAnimals;

  return (
    <>
      <SidePanel
        size="xlarge"
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleReview}
        title="Associar Animais ao Lote"
        subtitle="Vincule animais sem lote a um grupo de manejo."
        icon={Layers}
        loading={isLoading}
        submitLabel={`Revisar Associação (${selectedIds.length})`}
        customFooter={
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}>
            <div style={{ flex: 1, maxWidth: '380px' }}>
              {destCapacity && (
                <CapacityBar
                  current={destCapacity.current}
                  max={destCapacity.max}
                  adding={selectedIds.length}
                />
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
              <button type="button" className="glass-btn secondary" onClick={onClose}>Cancelar</button>
              <button
                type="submit"
                className="primary-btn"
                disabled={isLoading || !canSubmit}
                style={{ boxShadow: canSubmit ? '0 8px 20px hsl(var(--brand) / 0.2)' : 'none', opacity: canSubmit ? 1 : 0.55, transition: 'opacity 0.2s' }}
              >
                <CheckCircle2 size={18} />
                {isLoading ? 'Carregando...' : `Revisar Associação (${selectedIds.length})`}
              </button>
            </div>
          </div>
        }
      >
        {/* ─── PASSO 01 ──────────────────────────────── */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 01</div>
            <h4 className="tauze-section-title">Dados da Associação</h4>
          </div>

          <div className="tauze-input-grid grid-col-2">
            {/* Lote de destino — coluna inteira */}
            <div className="tauze-field-group" style={{ gridColumn: '1 / -1' }}>
              <DestSearchLote items={lotes} value={selectedLoteId} onChange={setSelectedLoteId} />

              {/* Chips de restrições do lote selecionado */}
              {selectedLot && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {selectedLot.pasto?.nome && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                      <MapPin size={10} /> {selectedLot.pasto.nome}
                    </span>
                  )}
                  {selectedLot.sexo_permitido && selectedLot.sexo_permitido !== 'MISTO' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                      Restrito: {selectedLot.sexo_permitido}S
                    </span>
                  )}
                  {selectedLot.exige_rastreabilidade && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                      Exige RFID
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Data */}
            <div className="tauze-field-group">
              <label className="tauze-label"><Calendar size={14} /> Data da Movimentação</label>
              <DateInput
                type="date"
                className="tauze-input"
                value={movDate}
                onChange={(e) => setMovDate(e.target.value)}
                required
                max={todayIso()}
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
                  ...MOTIVOS_LOTE.map((m) => ({ value: m, label: m })),
                ]}
              />
            </div>
          </div>
        </section>

        {/* ─── PASSO 02 ──────────────────────────────── */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Seleção de Animais</h4>
          </div>

          <div className="tauze-field-group full-width">
            {/* Header da seleção */}
            <div className="tauze-selection-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                <Users size={14} />
                Animais Sem Lote
                {animals.length > 0 && (
                  <span style={{ background: 'hsl(var(--border))', borderRadius: '99px', padding: '1px 7px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-main))', marginLeft: '2px' }}>
                    {selectedIds.length}/{filteredAnimals.length} cab.
                  </span>
                )}
              </label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button type="button" className="text-btn-sm" onClick={() => setShowFilters((s) => !s)} disabled={animals.length === 0}>
                  <Filter size={11} />
                  FILTROS{(filterSexo || filterCategoria) ? ' ●' : ''}
                </button>
                <button type="button" className="text-btn-sm" onClick={handleSelectAll} disabled={filteredAnimals.length === 0}>
                  {selectedIds.length === filteredAnimals.filter((a) => !isAnimalBlocked(a).blocked).length && filteredAnimals.length > 0
                    ? 'DESMARCAR TODOS' : 'MARCAR TODOS'}
                </button>
              </div>
            </div>

            {/* Filtros — aparecem apenas quando FILTROS é acionado, todos na mesma linha */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                    {/* Busca */}
                    <div className="search-glass-box small" style={{ flex: 2, marginBottom: 0 }}>
                      <Search size={14} className="s-icon" />
                      <input
                        type="text"
                        placeholder="Buscar por brinco, raça..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 4px' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {/* Sexo */}
                    <div style={{ flex: 1 }}>
                      <SearchableSelect
                        value={filterSexo}
                        onChange={(v: string) => setFilterSexo(v)}
                        options={[
                          { value: '', label: 'Todos os Sexos' },
                          { value: 'MACHO', label: 'Machos' },
                          { value: 'FEMEA', label: 'Fêmeas' },
                        ]}
                      />
                    </div>
                    {/* Categoria */}
                    <div style={{ flex: 1 }}>
                      <SearchableSelect
                        value={filterCategoria}
                        onChange={(v: string) => setFilterCategoria(v)}
                        options={[
                          { value: '', label: 'Todas as Categorias' },
                          ...categorias.map((c) => ({ value: String(c), label: String(c) })),
                        ]}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid de animais */}
            <div className="animal-picker-container">
              {/* Sticky summary */}
              {selectedIds.length > 0 && (
                <div className="picker-sticky-summary">
                  <span>{selectedIds.length} {selectedIds.length === 1 ? 'animal selecionado' : 'animais selecionados'}</span>
                  <button type="button" onClick={() => setSelectedIds([])}>Limpar seleção</button>
                </div>
              )}

              {/* Skeleton */}
              {loadingAnimals ? (
                <div className="picker-skeleton-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="picker-skeleton-item" />
                  ))}
                </div>
              ) : animals.length === 0 ? (
                <div className="picker-empty-state">
                  <AlertCircle size={36} />
                  <h4>Nenhum animal sem lote</h4>
                  <p>Todos os animais ativos desta fazenda já estão vinculados a um lote.</p>
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
                    const { blocked, reason } = isAnimalBlocked(animal);
                    const isSelected = selectedIds.includes(animal.id);
                    return (
                      <div
                        key={animal.id}
                        className={`picker-list-item ${isSelected ? 'active' : ''} ${blocked ? 'picker-blocked' : ''}`}
                        onClick={() => !blocked && toggleAnimal(animal.id)}
                        title={reason}
                      >
                        <div className="p-check-adv">
                          {isSelected
                            ? <CheckCircle2 size={18} />
                            : <div className="p-check-empty" />}
                        </div>
                        <div className="p-info-row">
                          <span className="p-brinco-adv">{animalLabel(animal)}</span>
                          {animal.raca && <span className="p-raca-adv">{animal.raca}</span>}
                          {animal.brinco_eletronico && <span className="p-tag" style={{ background: '#ecfdf5', color: '#10b981' }}>RFID</span>}
                          {animal.categoria && <span className="p-tag">{animal.categoria}</span>}
                          {animal.sexo && (
                            <span className="p-tag" style={{ background: animal.sexo === 'MACHO' ? '#eff6ff' : '#fdf2f8', color: animal.sexo === 'MACHO' ? '#3b82f6' : '#ec4899' }}>
                              {animal.sexo === 'MACHO' ? 'M' : 'F'}
                            </span>
                          )}
                          {blocked && <AlertTriangle size={13} style={{ color: '#ef4444', marginLeft: 'auto', flexShrink: 0 }} />}
                        </div>
                        <div className="p-stats-row">
                          {animal.peso_atual && <span><Weight size={11} /> {animal.peso_atual}kg</span>}
                          {animal.data_nascimento && <span><Clock size={11} /> {calcAge(animal.data_nascimento)}</span>}
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
        entityLabel="Lote de Destino"
        destName={selectedLot?.nome ?? '—'}
        motivo={motivo}
        date={movDate}
        selectedCount={selectedIds.length}
        destCapacity={destCapacity}
        animalLabels={selectedAnimalLabels}
        isPasto={false}
      />
    </>
  );
};
