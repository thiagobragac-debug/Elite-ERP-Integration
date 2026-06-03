import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  UserPlus,
  Layers,
  Trees,
  Search,
  CheckCircle2,
  Users,
  AlertCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Weight,
  Filter,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../utils/audit';
import toast from 'react-hot-toast';
import { SearchableSelect } from './SearchableSelect';

type AssignMode = 'lote' | 'pasto';

interface AssignAnimalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  mode: AssignMode;
}

const MOTIVOS = [
  'Desmama',
  'Separação por categoria',
  'Separação por sexo',
  'Transferência de fazenda',
  'Início de confinamento',
  'Início de pastejo rotacionado',
  'Reagrupamento',
  'Outro'
];

function calcAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const diff = Date.now() - new Date(birthDate).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}a ${rem}m` : `${years}a`;
}

// ── Smart Search Component (reusable for Lote or Pasto) ────────────────────
interface DestSearchProps {
  items: any[];
  value: string;
  onChange: (id: string, name: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  label: React.ReactNode;
}

function DestSearch({ items, value, onChange, placeholder, icon, label }: DestSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = items.find(i => i.id === value);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(i => !q || (i.nome || '').toLowerCase().includes(q) || (i.descricao || '').toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSelect = (item: any) => { onChange(item.id, item.nome); setQuery(''); setOpen(false); };
  const handleClear = (e: React.MouseEvent) => { e.stopPropagation(); onChange('', ''); setQuery(''); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))', marginBottom: '6px' }}>
        {label}
      </label>
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1.5px solid ${open ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`, borderRadius: '10px', padding: '8px 10px', cursor: 'text', background: 'hsl(var(--bg-card))', transition: 'border-color 0.15s', minHeight: '38px' }}
      >
        <Search size={13} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
        {open ? (
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={selected ? selected.nome : placeholder}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '13px', background: 'transparent', color: 'hsl(var(--text-main))' }} autoComplete="off" />
        ) : (
          <span style={{ flex: 1, fontSize: '13px', color: selected ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))', fontWeight: selected ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selected ? selected.nome : placeholder}
          </span>
        )}
        {value
          ? <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 2px', flexShrink: 0 }}><X size={13} /></button>
          : <ChevronDown size={13} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000, background: 'hsl(var(--bg-card))', border: '1.5px solid hsl(var(--brand))', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '220px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Nenhum resultado</div>
          ) : filtered.map(item => (
            <div key={item.id} onClick={() => handleSelect(item)}
              style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: item.id === value ? 'hsl(var(--brand) / 0.08)' : 'white', borderBottom: '1px solid hsl(var(--border) / 0.5)', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = item.id === value ? 'hsl(var(--brand) / 0.08)' : 'white')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ color: 'hsl(var(--brand))', flexShrink: 0 }}>{icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nome}</div>
                  {item.descricao && <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '1px' }}>{item.descricao}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '5px', flexShrink: 0, marginLeft: '8px' }}>
                {item._animalCount !== undefined && (
                  <span style={{ fontSize: '10px', fontWeight: 700, background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', borderRadius: '6px', padding: '2px 6px' }}>{item._animalCount} animais</span>
                )}
                {(item.capacidade || item.capacidade_ua) && (
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>cap. {item.capacidade || item.capacidade_ua}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CapacityBar({ current, max, adding }: { current: number; max: number; adding: number }) {
  if (!max || max <= 0) return null;
  const pct = Math.min(((current + adding) / max) * 100, 100);
  const beforePct = Math.min((current / max) * 100, 100);
  const color = pct > 100 ? '#ef4444' : pct > 85 ? '#f59e0b' : '#10b981';
  const label = pct > 100 ? 'Superlotação!' : pct > 85 ? 'Quase no limite' : 'Capacidade OK';

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Capacidade do Destino
        </span>
        <span style={{ fontSize: '11px', fontWeight: 800, color }}>
          {current + adding} / {max} UA — {label}
        </span>
      </div>
      <div style={{ background: 'hsl(var(--border))', borderRadius: '99px', height: '8px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${beforePct}%`, background: '#10b981', borderRadius: '99px' }} />
        {adding > 0 && (
          <div style={{ position: 'absolute', left: `${beforePct}%`, top: 0, height: '100%', width: `${Math.min(((adding) / max) * 100, 100 - beforePct)}%`, background: color, opacity: 0.7, borderRadius: '0 99px 99px 0' }} />
        )}
      </div>
    </div>
  );
}

export const AssignAnimalForm: React.FC<AssignAnimalFormProps> = ({ isOpen, onClose, onSubmit, mode }) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter, activeFarmId, isGlobalMode } = useFarmFilter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [unassignedAnimals, setUnassignedAnimals] = useState<any[]>([]);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedDestName, setSelectedDestName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSexo, setFilterSexo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [destCapacity, setDestCapacity] = useState<{ current: number; max: number } | null>(null);
  const [movDate, setMovDate] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const isLoteMode = mode === 'lote';
  const entityLabel = isLoteMode ? 'Lote' : 'Pasto';
  const entityIcon = isLoteMode ? Layers : Trees;
  const tableName = isLoteMode ? 'lotes' : 'pastos';
  const fieldName = isLoteMode ? 'lote_id' : 'pasto_id';
  const destName = selectedDestName || destinations.find(d => d.id === selectedDestination)?.nome || '—';

  // Whether we have enough context to fetch
  const canFetch = activeFarmId || (isGlobalMode && activeTenantId);

  useEffect(() => {
    if (isOpen && canFetch) {
      fetchDestinations();
      fetchUnassignedAnimals();
    }
    if (!isOpen) {
      setSelectedDestination('');
      setSelectedDestName('');
      setSelectedAnimals([]);
      setSearchTerm('');
      setFilterSexo('');
      setFilterCategoria('');
      setDestCapacity(null);
      setShowConfirm(false);
      setShowFilters(false);
      setMovDate(new Date().toISOString().split('T')[0]);
      setMotivo('');
    }
  }, [isOpen, activeFarmId, isGlobalMode, activeTenantId]);

  useEffect(() => {
    if (selectedDestination) {
      fetchDestCapacity(selectedDestination);
    } else {
      setDestCapacity(null);
    }
  }, [selectedDestination]);

  const fetchDestinations = async () => {
    const fields = isLoteMode
      ? 'id, nome, capacidade, descricao'
      : 'id, nome, area, capacidade_ua';
    const baseQuery = supabase.from(tableName).select(fields).order('nome');
    const filtered = applyFarmFilter(baseQuery);
    const { data, error } = isLoteMode
      ? await filtered.neq('status', 'ARQUIVADO')
      : await filtered;
    if (error) console.error('[AssignAnimalForm] fetchDestinations error:', error);
    if (data) {
      // Enrich with animal count
      const enriched = await Promise.all(
        data.map(async (d: any) => {
          const { count } = await supabase.from('animais').select('*', { count: 'exact', head: true })
            .eq(fieldName, d.id).in('status', ['ATIVO', 'Ativo', 'ativo']);
          return { ...d, _animalCount: count || 0 };
        })
      );
      setDestinations(enriched);
    }
  };


  const fetchDestCapacity = async (destId: string) => {
    const dest = destinations.find(d => d.id === destId);
    if (!dest) return;

    const maxCap = isLoteMode
      ? parseFloat(dest.capacidade) || 0
      : parseFloat(dest.capacidade_ua) || (parseFloat(dest.area) * 2.5);

    const { count } = await supabase
      .from('animais')
      .select('*', { count: 'exact', head: true })
      .eq(fieldName, destId)
      .in('status', ['ATIVO', 'Ativo', 'ativo']);

    setDestCapacity({ current: count || 0, max: maxCap });
  };

  const fetchUnassignedAnimals = async () => {
    setLoading(true);
    try {
      const baseQuery = supabase
        .from('animais')
        .select('id, brinco, raca, categoria, sexo, peso_atual, data_nascimento, fazenda_id')
        .in('status', ['ATIVO', 'Ativo', 'ativo']);

      const { data, error } = isLoteMode
        ? await applyFarmFilter(baseQuery).is('lote_id', null)
        : await applyFarmFilter(baseQuery).is('pasto_id', null);

      if (error) console.error('[AssignAnimalForm] fetchUnassignedAnimals error:', error);
      if (data) setUnassignedAnimals(data);
    } catch (err) {
      console.error('[AssignAnimalForm] Erro ao buscar animais:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAnimal = (id: string) => {
    setSelectedAnimals(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const filteredAnimals = useMemo(() => {
    return unassignedAnimals.filter(a => {
      const matchSearch =
        (a.brinco || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.raca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchSexo = filterSexo ? a.sexo === filterSexo : true;
      const matchCat = filterCategoria ? a.categoria === filterCategoria : true;
      return matchSearch && matchSexo && matchCat;
    });
  }, [unassignedAnimals, searchTerm, filterSexo, filterCategoria]);

  const selectAll = () => {
    if (selectedAnimals.length === filteredAnimals.length && filteredAnimals.length > 0) {
      setSelectedAnimals([]);
    } else {
      setSelectedAnimals(filteredAnimals.map(a => a.id));
    }
  };

  const categorias = useMemo(() => [...new Set(unassignedAnimals.map(a => a.categoria).filter(Boolean))], [unassignedAnimals]);




  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnimals.length === 0) { toast.error('Selecione ao menos um animal.'); return; }
    if (!selectedDestination) { toast.error(`Selecione o ${entityLabel} de destino.`); return; }
    if (!motivo) { toast.error('Informe o motivo da movimentação.'); return; }
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('animais')
        .update({ [fieldName]: selectedDestination })
        .in('id', selectedAnimals);

      if (!error) {
        if (activeTenantId) {
          await logAudit({
            tenant_id: activeTenantId,
            user_id: user?.id,
            action: 'ASSIGN_BATCH',
            entity: isLoteMode ? 'Lote' : 'Pasto',
            entity_id: selectedDestination,
            description: `${selectedAnimals.length} animais associados ao ${isLoteMode ? 'lote' : 'pasto'} "${destName}" | Motivo: ${motivo} | Data: ${movDate}`,
            old_data: { [fieldName]: null },
            new_data: { [fieldName]: selectedDestination, motivo, data: movDate }
          });

          await Promise.all(
            selectedAnimals.map(animalId => {
              const animal = unassignedAnimals.find(a => a.id === animalId);
              return logAudit({
                tenant_id: activeTenantId,
                user_id: user?.id,
                action: 'ASSIGN',
                entity: 'Animal',
                entity_id: animalId,
                description: `Animal #${animal?.brinco || animalId} associado ao ${isLoteMode ? 'lote' : 'pasto'} "${destName}" | Motivo: ${motivo}`,
                old_data: { [fieldName]: null },
                new_data: { [fieldName]: selectedDestination, motivo, data: movDate }
              });
            })
          );
        }

        onSubmit({ count: selectedAnimals.length, destination: selectedDestination });
        onClose();
      } else {
        toast.error('Erro ao associar animais. Tente novamente.');
        setShowConfirm(false);
      }
    } catch (err) {
      console.error(err);
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // — Confirmation overlay (portal → covers entire screen) —
  const confirmOverlay = showConfirm ? ReactDOM.createPortal(
    (() => {
      const selAnimals = unassignedAnimals.filter(a => selectedAnimals.includes(a.id));
      const afterCount = (destCapacity?.current || 0) + selectedAnimals.length;
      const afterPct = destCapacity?.max ? Math.round((afterCount / destCapacity.max) * 100) : null;
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'hsl(var(--bg-card))', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsl(var(--brand) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--brand))' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>Confirmar Associação</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Revise os dados antes de confirmar</p>
              </div>
            </div>

            <div style={{ background: 'hsl(var(--bg-main))', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <Row label="Destino" value={destName} />
              <Row label="Animais" value={`${selectedAnimals.length} animais selecionados`} />
              <Row label="Motivo" value={motivo} />
              <Row label="Data" value={new Date(movDate + 'T12:00:00').toLocaleDateString('pt-BR')} />
              {afterPct !== null && (
                <Row
                  label="Ocupação pós-associação"
                  value={`${afterCount} / ${destCapacity?.max} UA (${afterPct}%)`}
                  color={afterPct > 100 ? '#ef4444' : afterPct > 85 ? '#f59e0b' : '#10b981'}
                />
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px', maxHeight: '80px', overflowY: 'auto' }}>
              {selAnimals.slice(0, 12).map(a => (
                <span key={a.id} style={{ background: 'hsl(var(--brand) / 0.08)', color: 'hsl(var(--brand))', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                  #{a.brinco}
                </span>
              ))}
              {selAnimals.length > 12 && (
                <span style={{ color: 'hsl(var(--text-muted))', fontSize: '11px', fontWeight: 600 }}>+{selAnimals.length - 12} mais</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '12px', border: '1px solid hsl(var(--border))', borderRadius: '10px', background: 'hsl(var(--bg-card))', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ flex: 2, padding: '12px', background: 'hsl(var(--brand))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 800, fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <CheckCircle2 size={16} />
                {submitting ? 'Associando...' : `Confirmar ${selectedAnimals.length} Animais`}
              </button>
            </div>
          </div>
        </div>
      );
    })()
  , document.body) : null;

  return (
    <>
    <SidePanel size="medium"

      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleConfirm}
      title={`Associar Animais ao ${entityLabel}`}
      subtitle={`Vincule animais sem ${isLoteMode ? 'lote' : 'pasto'} a um grupo de manejo.`}
      icon={entityIcon}
      loading={loading}
      submitLabel={`Revisar Associação (${selectedAnimals.length})`}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados da Associação</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <DestSearch
              items={destinations}
              value={selectedDestination}
              onChange={(id, name) => { setSelectedDestination(id); setSelectedDestName(name); }}
              placeholder={`Buscar ${entityLabel.toLowerCase()}...`}
              icon={isLoteMode ? <Layers size={13} /> : <Trees size={13} />}
              label={<>{isLoteMode ? <Layers size={12} /> : <Trees size={12} />} {entityLabel} de Destino</>}
            />
            {destCapacity && (
              <CapacityBar current={destCapacity.current} max={destCapacity.max} adding={selectedAnimals.length} />
            )}
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Calendar size={14} /> Data da Movimentação
            </label>
            <input type="date" className="tauze-input" value={movDate} onChange={e => setMovDate(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Motivo da Associação
            </label>
            <SearchableSelect 
              value={motivo}
              onChange={(val: any) => setMotivo(val)}
              options={[
                { value: ``, label: `Selecione o motivo...` },
                ...(MOTIVOS || []).map(m => ({ value: String(m), label: String(m) })),
              ]}
            />
          </div>
        </div>
      </section>

      {/* Animal picker */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Seleção de Animais</h4>
        </div>
        <div className="tauze-field-group full-width">
        {/* Header — always visible */}
        <div className="tauze-selection-header">
          <label>
            <Users size={14} /> Animais Sem {entityLabel}
            {unassignedAnimals.length > 0 && (
              <span style={{ background: 'hsl(var(--border))', borderRadius: '99px', padding: '1px 7px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-main))', marginLeft: '6px' }}>
                {selectedAnimals.length}/{filteredAnimals.length}
              </span>
            )}
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button" className="text-btn-sm"
              onClick={() => setShowFilters(s => !s)}
              disabled={unassignedAnimals.length === 0}
              style={{ opacity: unassignedAnimals.length === 0 ? 0.35 : 1 }}
            >
              <Filter size={12} style={{ display: 'inline', marginRight: '3px' }} />
              FILTROS{(filterSexo || filterCategoria) ? ' ●' : ''}
            </button>
            <button
              type="button" className="text-btn-sm"
              onClick={selectAll}
              disabled={filteredAnimals.length === 0}
              style={{ opacity: filteredAnimals.length === 0 ? 0.35 : 1 }}
            >
              {selectedAnimals.length === filteredAnimals.length && filteredAnimals.length > 0 ? 'DESMARCAR TODOS' : 'MARCAR TODOS'}
            </button>
          </div>
        </div>

        {unassignedAnimals.length === 0 && !loading ? (
          <div className="assign-empty-state">
            <AlertCircle size={32} />
            <h4>Nenhum animal sem {entityLabel}</h4>
            <p>Todos os animais ativos desta fazenda já estão vinculados a um {entityLabel.toLowerCase()}.</p>
          </div>
        ) : (
          <>

            {showFilters && (
              <div className="search-glass-box small" style={{ marginBottom: '4px' }}>
                <Search size={14} className="s-icon" />
                <input
                  type="text"
                  placeholder="Buscar por brinco, raça, categoria, sexo..."
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
            )}


            <div className="tauze-animal-picker">
              {loading ? (
                <div className="picker-loading">Buscando animais sem {entityLabel.toLowerCase()}...</div>
              ) : filteredAnimals.length === 0 ? (
                <div className="picker-empty">Nenhum animal encontrado com esse filtro.</div>
              ) : (
                <div className="picker-grid-adv">
                  {filteredAnimals.map(animal => (
                    <div
                      key={animal.id}
                      className={`picker-item-adv ${selectedAnimals.includes(animal.id) ? 'active' : ''}`}
                      onClick={() => toggleAnimal(animal.id)}
                    >
                      <div className="p-check-adv">
                        {selectedAnimals.includes(animal.id) ? <CheckCircle2 size={15} /> : <div className="p-check-empty" />}
                      </div>
                      <div className="p-info-adv">
                        <span className="p-brinco-adv">#{animal.brinco}</span>
                        <span className="p-raca-adv">{animal.raca || '—'}</span>
                        <div className="p-tags-adv">
                          {animal.categoria && <span className="p-tag">{animal.categoria}</span>}
                          {animal.sexo && <span className="p-tag" style={{ background: animal.sexo === 'MACHO' ? '#eff6ff' : '#fdf2f8', color: animal.sexo === 'MACHO' ? '#3b82f6' : '#ec4899' }}>{animal.sexo === 'MACHO' ? '♂' : '♀'}</span>}
                        </div>
                        <div className="p-stats-adv">
                          {animal.peso_atual && <span><Weight size={9} style={{ display: 'inline', verticalAlign: 'middle' }} /> {animal.peso_atual}kg</span>}
                          {animal.data_nascimento && <span>🎂 {calcAge(animal.data_nascimento)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </section>

      <style>{`
        .tauze-selection-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .text-btn-sm { background: none; border: none; font-size: 10px; font-weight: 800; color: hsl(var(--brand)); cursor: pointer; letter-spacing: 0.05em; text-transform: uppercase; display: inline-flex; align-items: center; }
        .tauze-animal-picker { max-height: 280px; overflow-y: auto; background: hsl(var(--bg-main)); border: 1px solid hsl(var(--border)); border-radius: 12px; padding: 12px; }
        .picker-grid-adv { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
        .picker-item-adv { display: flex; align-items: flex-start; gap: 8px; padding: 10px; background: hsl(var(--bg-card)); border: 1.5px solid hsl(var(--border)); border-radius: 10px; cursor: pointer; transition: all 0.18s; }
        .picker-item-adv:hover { border-color: hsl(var(--brand)); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .picker-item-adv.active { border-color: hsl(var(--brand)); background: hsl(var(--brand) / 0.05); }
        .p-check-adv { width: 18px; height: 18px; flex-shrink: 0; color: hsl(var(--brand)); margin-top: 1px; }
        .p-check-empty { width: 16px; height: 16px; border: 2px solid hsl(var(--border)); border-radius: 4px; }
        .p-info-adv { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
        .p-brinco-adv { font-size: 12px; font-weight: 800; color: hsl(var(--text-main)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .p-raca-adv { font-size: 10px; font-weight: 600; color: hsl(var(--text-muted)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .p-tags-adv { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 3px; }
        .p-tag { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 5px; background: hsl(var(--brand) / 0.08); color: hsl(var(--brand)); text-transform: uppercase; letter-spacing: 0.04em; }
        .p-stats-adv { display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
        .p-stats-adv span { font-size: 9px; font-weight: 700; color: hsl(var(--text-muted)); display: flex; align-items: center; gap: 2px; }
        .picker-loading, .picker-empty { padding: 24px; text-align: center; font-size: 12px; font-weight: 600; color: hsl(var(--text-muted)); }
        .assign-empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; text-align: center; background: hsl(var(--bg-main)); border: 1px solid hsl(var(--border)); border-radius: 12px; color: hsl(var(--text-muted)); }
        .assign-empty-state h4 { font-size: 14px; font-weight: 800; color: hsl(var(--text-main)); margin: 0; }
        .assign-empty-state p { font-size: 11px; margin: 0; line-height: 1.4; max-width: 260px; }
        .mb-4 { margin-bottom: 12px; }
      `}</style>
    </SidePanel>
    {confirmOverlay}
  </>
  );
};

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 800, color: color || 'hsl(var(--text-main))' }}>{value}</span>
    </div>
  );
}
