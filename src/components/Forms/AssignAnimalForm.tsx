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
import { Save } from 'lucide-react';
import { DateInput } from '../../components/Form/DateInput';


type AssignMode = 'lote' | 'pasto';

interface AssignAnimalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  mode: AssignMode;
  actionId?: number;
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
  if (!birthDate) return 'â€”';
  const diff = Date.now() - new Date(birthDate).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}a ${rem}m` : `${years}a`;
}

// â”€â”€ Smart Search Component (reusable for Lote or Pasto) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label className="tauze-label">
        {label}
      </label>
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className={`tauze-input ${open ? 'focus' : ''}`}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'text', padding: '0 16px', outline: open ? 'none' : '', borderColor: open ? 'hsl(var(--brand))' : '', boxShadow: open ? '0 0 0 4px hsl(var(--brand) / 0.1)' : '' }}
      >
        <Search size={14} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
        {open ? (
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={selected ? selected.nome : placeholder}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', fontWeight: 600, background: 'transparent', color: 'hsl(var(--text-main))', height: '100%' }} autoComplete="off" />
        ) : (
          <span style={{ flex: 1, fontSize: '14px', color: selected ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))', fontWeight: selected ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selected ? selected.nome : placeholder}
          </span>
        )}
        {value
          ? <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 2px', flexShrink: 0 }}><X size={14} /></button>
          : <ChevronDown size={14} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />}
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

function CapacityBar({ current, max, adding, unit }: { current: number; max: number; adding: number; unit: string }) {
  if (!max || max <= 0) return null;
  const pct = Math.min(((current + adding) / max) * 100, 100);
  const beforePct = Math.min((current / max) * 100, 100);
  const color = pct > 100 ? '#ef4444' : pct > 85 ? '#f59e0b' : '#10b981';
  const label = pct > 100 ? 'Superlotação!' : pct > 85 ? 'Quase no limite' : 'Capacidade OK';

  const formatNumber = (num: number) => unit === 'UA' ? num.toFixed(1) : Math.round(num).toString();

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Capacidade do Destino
        </span>
        <span style={{ fontSize: '11px', fontWeight: 800, color }}>
          {formatNumber(current + adding)} / {formatNumber(max)} {unit} â€” {label}
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

export const AssignAnimalForm: React.FC<AssignAnimalFormProps> = ({isOpen, onClose, onSubmit, mode, actionId }) => {
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
  const [movDate, setMovDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const isLoteMode = mode === 'lote';
  const entityLabel = isLoteMode ? 'Lote' : 'Pasto';
  const entityIcon = isLoteMode ? Layers : Trees;
  const tableName = isLoteMode ? 'lotes' : 'pastos';
  const fieldName = isLoteMode ? 'lote_id' : 'pasto_id';
  const destName = selectedDestName || destinations.find(d => d.id === selectedDestination)?.nome || 'â€”';

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
      setMovDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
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
      ? 'id, nome, capacidade, descricao, sexo_permitido, exige_rastreabilidade, pastos(nome)'
      : 'id, nome, area, capacidade_ua, status';
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

    if (isLoteMode) {
      const { count } = await supabase
        .from('animais')
        .select('*', { count: 'exact', head: true })
        .eq(fieldName, destId)
        .in('status', ['ATIVO', 'Ativo', 'ativo']);
      setDestCapacity({ current: count || 0, max: maxCap });
    } else {
      const { data } = await supabase
        .from('animais')
        .select('peso_atual')
        .eq(fieldName, destId)
        .in('status', ['ATIVO', 'Ativo', 'ativo']);
      let currentUa = 0;
      if (data) {
        currentUa = data.reduce((acc, a) => {
           const p = parseFloat(a.peso_atual);
           return acc + (!isNaN(p) && p > 0 ? p / 450 : 1);
        }, 0);
      }
      setDestCapacity({ current: currentUa, max: maxCap });
    }
  };

  const fetchUnassignedAnimals = async () => {
    setLoading(true);
    try {
      const baseQuery = supabase
        .from('animais')
        .select('id, brinco, brinco_eletronico, raca, categoria, sexo, peso_atual, data_nascimento, fazenda_id')
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

  const toggleAnimal = (id: string, animalSexo?: string, hasRFID?: boolean) => {
    if (isLoteMode) {
      const targetLot = destinations.find(d => d.id === selectedDestination);
      if (targetLot?.sexo_permitido && targetLot.sexo_permitido !== 'MISTO' && animalSexo && animalSexo !== targetLot.sexo_permitido) {
        toast.error(`O lote selecionado permite apenas ${targetLot.sexo_permitido}S.`);
        return;
      }
      if (targetLot?.exige_rastreabilidade && !hasRFID) {
        toast.error(`Este lote exige que o animal tenha um Brinco Eletrônico cadastrado.`);
        return;
      }
    }
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

  const getAnimalUa = (animal: any) => {
    const peso = parseFloat(animal.peso_atual);
    return !isNaN(peso) && peso > 0 ? peso / 450 : 1;
  };

  const selectedAddingValue = useMemo(() => {
    if (isLoteMode) return selectedAnimals.length;
    return selectedAnimals.reduce((acc, id) => {
      const animal = unassignedAnimals.find(a => a.id === id);
      return acc + (animal ? getAnimalUa(animal) : 0);
    }, 0);
  }, [selectedAnimals, unassignedAnimals, isLoteMode]);

  const selectAll = () => {
    let allowedFiltered = filteredAnimals;
    if (isLoteMode && selectedDestination) {
      const targetLot = destinations.find(d => d.id === selectedDestination);
      let blockedCount = 0;
      
      allowedFiltered = filteredAnimals.filter(a => {
        let isAllowed = true;
        if (targetLot?.sexo_permitido && targetLot.sexo_permitido !== 'MISTO') {
          if (a.sexo && a.sexo !== targetLot.sexo_permitido) isAllowed = false;
        }
        if (targetLot?.exige_rastreabilidade && !a.brinco_eletronico) {
          isAllowed = false;
        }
        if (!isAllowed) blockedCount++;
        return isAllowed;
      });
      
      if (selectedAnimals.length === allowedFiltered.length && allowedFiltered.length > 0) {
        setSelectedAnimals([]);
      } else {
        setSelectedAnimals(allowedFiltered.map(a => a.id));
        if (blockedCount > 0) {
          toast.error(`${blockedCount} animais ignorados por restrições do lote (sexo ou falta de RFID).`);
        }
      }
    } else {
      if (selectedAnimals.length === allowedFiltered.length && allowedFiltered.length > 0) {
        setSelectedAnimals([]);
      } else {
        setSelectedAnimals(allowedFiltered.map(a => a.id));
      }
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
      const afterCount = (destCapacity?.current || 0) + selectedAddingValue;
      const afterPct = destCapacity?.max ? Math.round((afterCount / destCapacity.max) * 100) : null;
      const formatVal = (n: number) => isLoteMode ? Math.round(n).toString() : n.toFixed(1);
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
              <Row label="Animais" value={`${selectedAnimals.length} animais selecionados${!isLoteMode && selectedAnimals.length > 0 ? ` (${selectedAddingValue.toFixed(1)} UA)` : ''}`} />
              <Row label="Motivo" value={motivo} />
              <Row label="Data" value={new Date(movDate + 'T12:00:00').toLocaleDateString('pt-BR')} />
              {afterPct !== null && (
                <Row
                  label="Ocupação pós-associação"
                  value={`${formatVal(afterCount)} / ${formatVal(destCapacity?.max || 0)} ${isLoteMode ? 'Cab.' : 'UA'} (${afterPct}%)`}
                  color={afterPct > 100 ? '#ef4444' : afterPct > 85 ? '#f59e0b' : '#10b981'}
                />
              )}
              {afterPct !== null && afterPct > 100 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '8px', fontSize: '11px', fontWeight: 700, marginTop: '4px' }}>
                  <AlertTriangle size={14} /> Aviso: Esta associação causará superlotação.
                </div>
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
    <SidePanel size="xlarge"

      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleConfirm}
      title={`Associar Animais ao ${entityLabel}`}
      subtitle={`Vincule animais sem ${isLoteMode ? 'lote' : 'pasto'} a um grupo de manejo.`}
      icon={entityIcon}
      loading={loading}
      submitLabel={`Revisar Associação (${selectedAnimals.length})`}
      customFooter={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '16px' }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            {destCapacity && (
              <CapacityBar current={destCapacity.current} max={destCapacity.max} adding={selectedAddingValue} unit={isLoteMode ? 'Cab.' : 'UA'} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button type="button" className="glass-btn secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-btn" disabled={loading} style={{ boxShadow: '0 8px 20px hsl(var(--brand) / 0.2)' }}>
              <Save size={18} />
              {loading ? 'Processando...' : `Revisar Associação (${selectedAnimals.length})`}
            </button>
          </div>
        </div>
      }
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
              label={<>{isLoteMode ? <Layers size={14} /> : <Trees size={14} />} {entityLabel} de Destino</>}
            />
            {(() => {
              const dest = destinations.find(d => d.id === selectedDestination);
              if (!dest) return null;
              return (
                <div style={{ marginTop: '8px' }}>
                  {isLoteMode && dest.pastos?.nome && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginBottom: '6px' }}>
                      📍 Indo para: {dest.pastos.nome}
                    </div>
                  )}
                  {isLoteMode && dest.sexo_permitido && dest.sexo_permitido !== 'MISTO' && (
                     <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginBottom: '6px', marginLeft: '6px' }}>
                        Restrito: {dest.sexo_permitido}S
                     </div>
                  )}
                  {isLoteMode && dest.exige_rastreabilidade && (
                     <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginBottom: '6px', marginLeft: '6px' }}>
                        Exige RFID
                     </div>
                  )}
                  {!isLoteMode && (dest.status === 'resting' || dest.status === 'renovation') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7', borderRadius: '8px', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
                      <AlertTriangle size={14} /> Atenção: Área de destino está em {dest.status === 'resting' ? 'Descanso' : 'Reforma'}.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Calendar size={14} /> Data da Movimentação
            </label>
            <DateInput type="date" className="tauze-input" value={movDate} onChange={e => setMovDate(e.target.value)} required max={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} />
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
                {selectedAnimals.length}/{filteredAnimals.length} cab.{!isLoteMode && selectedAnimals.length > 0 ? ` (${selectedAddingValue.toFixed(1)} UA)` : ''}
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
              FILTROS{(filterSexo || filterCategoria) ? ' ● ' : ''}
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
              <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                <div className="search-glass-box small" style={{ margin: 0, flex: 2 }}>
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
                  <div style={{ flex: 1 }}>
                    <SearchableSelect 
                      value={filterSexo}
                      onChange={(v: any) => setFilterSexo(v)}
                      options={[
                        { value: '', label: 'Todos os Sexos' },
                        { value: 'MACHO', label: 'Apenas Machos' },
                        { value: 'FEMEA', label: 'Apenas Fêmeas' }
                      ]}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <SearchableSelect 
                      value={filterCategoria}
                      onChange={(v: any) => setFilterCategoria(v)}
                      options={[
                        { value: '', label: 'Todas as Categorias' },
                        ...categorias.map(c => ({ value: String(c), label: String(c) }))
                      ]}
                    />
                  </div>
              </div>
            )}


            <div className="tauze-animal-picker">
              {loading ? (
                <div className="picker-loading">Buscando animais sem {entityLabel.toLowerCase()}...</div>
              ) : filteredAnimals.length === 0 ? (
                <div className="picker-empty">Nenhum animal encontrado com esse filtro.</div>
              ) : (
                <div className="picker-list-adv">
                  {filteredAnimals.map(animal => {
                    const targetLot = destinations.find(d => d.id === selectedDestination);
                    const isSexBlocked = isLoteMode && targetLot?.sexo_permitido && targetLot.sexo_permitido !== 'MISTO' && animal.sexo && animal.sexo !== targetLot.sexo_permitido;
                    const isRFIDBlocked = isLoteMode && targetLot?.exige_rastreabilidade && !animal.brinco_eletronico;
                    const isBlocked = isSexBlocked || isRFIDBlocked;
                    return (
                      <div
                        key={animal.id}
                        className={`picker-list-item ${selectedAnimals.includes(animal.id) ? 'active' : ''}`}
                        onClick={() => !isBlocked && toggleAnimal(animal.id, animal.sexo, !!animal.brinco_eletronico)}
                        style={isBlocked ? { opacity: 0.6, cursor: 'not-allowed', background: 'hsl(var(--danger)/0.05)', borderColor: 'hsl(var(--danger)/0.2)' } : {}}
                        title={isSexBlocked ? `Lote permite apenas ${targetLot?.sexo_permitido}S` : isRFIDBlocked ? 'Lote exige brinco eletrônico (SISBOV)' : ''}
                      >
                        <div className="p-check-adv" style={{ marginTop: 0 }}>
                          {selectedAnimals.includes(animal.id) ? <CheckCircle2 size={18} /> : <div className="p-check-empty" style={{ width: '18px', height: '18px' }} />}
                        </div>
                        <div className="p-info-row">
                          <span className="p-brinco-adv" style={{ minWidth: '70px', fontSize: '13px' }}>#{animal.brinco}</span>
                          <span className="p-raca-adv" style={{ minWidth: '90px', fontSize: '11px' }}>{animal.raca || '—'}</span>
                          {animal.brinco_eletronico && <span className="p-tag" style={{ background: '#ecfdf5', color: '#10b981' }}>RFID</span>}
                          {animal.categoria && <span className="p-tag">{animal.categoria}</span>}
                          {animal.sexo && <span className="p-tag" style={{ background: animal.sexo === 'MACHO' ? '#eff6ff' : '#fdf2f8', color: animal.sexo === 'MACHO' ? '#3b82f6' : '#ec4899' }}>{animal.sexo === 'MACHO' ? 'M' : 'F'}</span>}
                        </div>
                        <div className="p-stats-row">
                          {animal.peso_atual && <span><Weight size={12} /> {animal.peso_atual}kg</span>}
                          {animal.data_nascimento && <span style={{ minWidth: '70px' }}>🎂 {calcAge(animal.data_nascimento)}</span>}
                        </div>
                      </div>
                  )})}
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
