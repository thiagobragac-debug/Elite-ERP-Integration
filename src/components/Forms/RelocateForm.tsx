import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  Beef
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../utils/audit';
import toast from 'react-hot-toast';
import { SearchableSelect } from './SearchableSelect';

interface RelocateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialSourceLotId?: string;
}

const MOTIVOS = [
  'Rotação de pasto',
  'Desmama',
  'Separação por categoria',
  'Separação por sexo',
  'Doença / Quarentena',
  'Preparação para venda',
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

function CapacityBar({ current, max, adding }: { current: number; max: number; adding: number }) {
  if (!max || max <= 0) return null;
  const pct = Math.min(((current + adding) / max) * 100, 100);
  const beforePct = Math.min((current / max) * 100, 100);
  const color = pct > 100 ? '#ef4444' : pct > 85 ? '#f59e0b' : '#10b981';
  const label = pct > 100 ? 'Superlotação!' : pct > 85 ? 'Quase no limite' : 'Capacidade OK';

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Capacidade</span>
        <span style={{ fontSize: '10px', fontWeight: 800, color }}>{current + adding}/{max} — {label}</span>
      </div>
      <div style={{ background: 'hsl(var(--border))', borderRadius: '99px', height: '6px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${beforePct}%`, background: '#10b981', borderRadius: '99px' }} />
        {adding > 0 && (
          <div style={{ position: 'absolute', left: `${beforePct}%`, top: 0, height: '100%', width: `${Math.min((adding / max) * 100, 100 - beforePct)}%`, background: color, opacity: 0.7 }} />
        )}
      </div>
      {pct > 100 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
          <AlertTriangle size={10} color="#ef4444" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>Destino será superlotado</span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 800, color: color || 'hsl(var(--text-main))' }}>{value}</span>
    </div>
  );
}

// ── Smart Lot Search Component ──────────────────────────────────────────────
interface LotSearchProps {
  lots: any[];
  value: string;
  onChange: (id: string, name: string) => void;
  placeholder: string;
  exclude?: string;
  label: React.ReactNode;
  animalCount?: number; // for source lot badge
}

function LotSearch({ lots, value, onChange, placeholder, exclude, label, animalCount }: LotSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLot = lots.find(l => l.id === value);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return lots
      .filter(l => l.id !== exclude)
      .filter(l => !q || l.nome.toLowerCase().includes(q) || (l.descricao || '').toLowerCase().includes(q));
  }, [lots, query, exclude]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (lot: any) => {
    onChange(lot.id, lot.nome);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
    setQuery('');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))', marginBottom: '6px' }}>
        {label}
        {animalCount !== undefined && animalCount > 0 && (
          <span style={{ background: 'hsl(var(--brand))', color: 'white', borderRadius: '99px', padding: '1px 6px', fontSize: '9px', fontWeight: 800, marginLeft: '4px' }}>
            {animalCount} animais
          </span>
        )}
      </label>
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          border: `1.5px solid ${open ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
          borderRadius: '10px', padding: '8px 10px', cursor: 'text', background: 'white',
          transition: 'border-color 0.15s', minHeight: '38px'
        }}
      >
        <Search size={13} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={selectedLot ? selectedLot.nome : placeholder}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: '13px', background: 'transparent', color: 'hsl(var(--text-main))' }}
            autoComplete="off"
          />
        ) : (
          <span style={{ flex: 1, fontSize: '13px', color: selectedLot ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))', fontWeight: selectedLot ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedLot ? selectedLot.nome : placeholder}
          </span>
        )}
        {value ? (
          <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 2px', flexShrink: 0 }}>
            <X size={13} />
          </button>
        ) : (
          <ChevronDown size={13} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
          background: 'white', border: '1.5px solid hsl(var(--brand))', borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: '220px', overflowY: 'auto'
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              Nenhum lote encontrado
            </div>
          ) : (
            filtered.map(lot => (
              <div
                key={lot.id}
                onClick={() => handleSelect(lot)}
                style={{
                  padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: lot.id === value ? 'hsl(var(--brand) / 0.08)' : 'white',
                  borderBottom: '1px solid hsl(var(--border) / 0.5)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = lot.id === value ? 'hsl(var(--brand) / 0.08)' : 'white')}
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

// ── Main Component ──────────────────────────────────────────────────────────
export const RelocateForm: React.FC<RelocateFormProps> = ({ isOpen, onClose, onSubmit, initialSourceLotId }) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter, activeFarmId, isGlobalMode } = useFarmFilter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lots, setLots] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSexo, setFilterSexo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [destCapacity, setDestCapacity] = useState<{ current: number; max: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    sourceLotId: initialSourceLotId || '',
    sourceLotName: '',
    targetLotId: '',
    targetLotName: '',
    date: new Date().toISOString().split('T')[0],
    motivo: ''
  });

  const canFetch = activeFarmId || (isGlobalMode && activeTenantId);

  useEffect(() => {
    if (isOpen && canFetch) {
      fetchLots();
    }
    if (!isOpen) {
      setSelectedAnimals([]);
      setSearchTerm('');
      setFilterSexo('');
      setFilterCategoria('');
      setDestCapacity(null);
      setShowConfirm(false);
      setAnimals([]);
      setFormData({
        sourceLotId: initialSourceLotId || '',
        sourceLotName: '',
        targetLotId: '',
        targetLotName: '',
        date: new Date().toISOString().split('T')[0],
        motivo: ''
      });
    }
  }, [isOpen, activeFarmId, isGlobalMode, activeTenantId]);

  useEffect(() => {
    if (formData.sourceLotId) {
      fetchAnimals(formData.sourceLotId);
    } else {
      setAnimals([]);
      setSelectedAnimals([]);
    }
  }, [formData.sourceLotId]);

  useEffect(() => {
    if (formData.targetLotId) {
      fetchTargetCapacity(formData.targetLotId);
    } else {
      setDestCapacity(null);
    }
  }, [formData.targetLotId]);

  const fetchLots = async () => {
    const baseQuery = supabase
      .from('lotes')
      .select('id, nome, capacidade, descricao, status')
      .order('nome');
    const { data, error } = await applyFarmFilter(baseQuery);
    if (error) console.error('[RelocateForm] fetchLots error:', error);
    if (data) {
      // Enrich each lot with its current animal count
      const enriched = await Promise.all(
        data.map(async (lot: any) => {
          const { count } = await supabase
            .from('animais')
            .select('*', { count: 'exact', head: true })
            .eq('lote_id', lot.id)
            .in('status', ['ATIVO', 'Ativo', 'ativo']);
          return { ...lot, _animalCount: count || 0 };
        })
      );
      setLots(enriched);
      // If initialSourceLotId was passed, resolve the name
      if (initialSourceLotId) {
        const found = enriched.find(l => l.id === initialSourceLotId);
        if (found) setFormData(f => ({ ...f, sourceLotName: found.nome }));
      }
    }
  };

  const fetchAnimals = async (lotId: string) => {
    setLoading(true);
    setSelectedAnimals([]);
    const { data, error } = await supabase
      .from('animais')
      .select('id, brinco, raca, categoria, sexo, peso_atual, data_nascimento')
      .eq('lote_id', lotId)
      .in('status', ['ATIVO', 'Ativo', 'ativo'])
      .order('brinco');
    if (error) console.error('[RelocateForm] fetchAnimals error:', error);
    if (data) setAnimals(data);
    setLoading(false);
  };

  const fetchTargetCapacity = async (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    const max = parseFloat(lot?.capacidade) || 0;
    const { count } = await supabase
      .from('animais')
      .select('*', { count: 'exact', head: true })
      .eq('lote_id', lotId)
      .in('status', ['ATIVO', 'Ativo', 'ativo']);
    setDestCapacity({ current: count || 0, max });
  };

  const toggleAnimal = (id: string) => {
    setSelectedAnimals(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const categorias = useMemo(() => [...new Set(animals.map(a => a.categoria).filter(Boolean))], [animals]);

  const filteredAnimals = useMemo(() => {
    return animals.filter(a => {
      const matchSearch = (a.brinco || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.raca || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchSexo = filterSexo ? a.sexo === filterSexo : true;
      const matchCat = filterCategoria ? a.categoria === filterCategoria : true;
      return matchSearch && matchSexo && matchCat;
    });
  }, [animals, searchTerm, filterSexo, filterCategoria]);

  const selectAll = () => {
    if (selectedAnimals.length === filteredAnimals.length && filteredAnimals.length > 0) {
      setSelectedAnimals([]);
    } else {
      setSelectedAnimals(filteredAnimals.map(a => a.id));
    }
  };

  const selectEntireLot = () => {
    setSelectedAnimals(animals.map(a => a.id));
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnimals.length === 0) { toast.error('Selecione ao menos um animal.'); return; }
    if (!formData.targetLotId) { toast.error('Selecione o lote de destino.'); return; }
    if (!formData.motivo) { toast.error('Informe o motivo do remanejamento.'); return; }
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('animais')
        .update({ lote_id: formData.targetLotId })
        .in('id', selectedAnimals);

      if (!error) {
        if (activeTenantId) {
          await logAudit({
            tenant_id: activeTenantId,
            user_id: user?.id,
            action: 'TRANSFER_BATCH',
            entity: 'Lote',
            entity_id: formData.sourceLotId,
            description: `${selectedAnimals.length} animais transferidos de "${formData.sourceLotName}" → "${formData.targetLotName}" | ${formData.motivo} | ${formData.date}`,
            old_data: { lote_id: formData.sourceLotId },
            new_data: { lote_id: formData.targetLotId, motivo: formData.motivo }
          });
        }
        onSubmit({ count: selectedAnimals.length, source: formData.sourceLotId, target: formData.targetLotId });
        onClose();
      }
    } catch (err) {
      console.error(err);
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmation overlay (portal) ───────────────────────────────────────
  const confirmOverlay = showConfirm ? ReactDOM.createPortal(
    (() => {
      const afterCount = (destCapacity?.current || 0) + selectedAnimals.length;
      const afterPct = destCapacity?.max ? Math.round((afterCount / destCapacity.max) * 100) : null;
      const isFullLot = selectedAnimals.length === animals.length;
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsl(var(--brand) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--brand))' }}>
                <ArrowRightLeft size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Confirmar Remanejamento</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Revise antes de confirmar</p>
              </div>
            </div>

            <div style={{ background: 'hsl(var(--bg-main))', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <Row label="Lote de origem" value={formData.sourceLotName} />
              <Row label="Lote de destino" value={formData.targetLotName} />
              <Row label="Animais" value={`${selectedAnimals.length} ${isFullLot ? '(lote completo)' : 'selecionados'}`} />
              <Row label="Motivo" value={formData.motivo} />
              <Row label="Data" value={new Date(formData.date + 'T12:00:00').toLocaleDateString('pt-BR')} />
              {afterPct !== null && (
                <Row
                  label="Ocupação do destino após mov."
                  value={`${afterCount}/${destCapacity?.max} (${afterPct}%)`}
                  color={afterPct > 100 ? '#ef4444' : afterPct > 85 ? '#f59e0b' : '#10b981'}
                />
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '20px', maxHeight: '72px', overflowY: 'auto' }}>
              {animals.filter(a => selectedAnimals.includes(a.id)).slice(0, 15).map(a => (
                <span key={a.id} style={{ background: 'hsl(var(--brand) / 0.08)', color: 'hsl(var(--brand))', borderRadius: '6px', padding: '2px 7px', fontSize: '11px', fontWeight: 700 }}>
                  #{a.brinco}
                </span>
              ))}
              {selectedAnimals.length > 15 && <span style={{ color: 'hsl(var(--text-muted))', fontSize: '11px' }}>+{selectedAnimals.length - 15} mais</span>}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '12px', border: '1px solid hsl(var(--border))', borderRadius: '10px', background: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ flex: 2, padding: '12px', background: 'hsl(var(--brand))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 800, fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <CheckCircle2 size={16} />
                {submitting ? 'Transferindo...' : `Confirmar ${selectedAnimals.length} Animais`}
              </button>
            </div>
          </div>
        </div>
      );
    })()
  , document.body) : null;

  // ── Form ───────────────────────────────────────────────────────────────
  return (
    <>
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleConfirm}
      title="Remanejamento de Lote"
      subtitle="Transfira animais entre grupos com rastreabilidade total."
      icon={ArrowRightLeft}
      loading={false}
      submitLabel={`Revisar Remanejamento (${selectedAnimals.length})`}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados do Remanejamento</h4>
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <LotSearch
              lots={lots}
              value={formData.sourceLotId}
              onChange={(id, name) => setFormData(f => ({ ...f, sourceLotId: id, sourceLotName: name, targetLotId: f.targetLotId === id ? '' : f.targetLotId }))}
              placeholder="Buscar lote de origem..."
              exclude={formData.targetLotId}
              animalCount={animals.length || lots.find(l => l.id === formData.sourceLotId)?._animalCount}
              label={<><Layers size={12} /> Lote de Origem</>}
            />
          </div>

          <div className="tauze-field-group">
            <LotSearch
              lots={lots}
              value={formData.targetLotId}
              onChange={(id, name) => setFormData(f => ({ ...f, targetLotId: id, targetLotName: name }))}
              placeholder="Buscar lote de destino..."
              exclude={formData.sourceLotId}
              label={<><MapPin size={12} /> Lote de Destino</>}
            />
            {destCapacity && formData.targetLotId && (
              <CapacityBar current={destCapacity.current} max={destCapacity.max} adding={selectedAnimals.length} />
            )}
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data do Remanejamento</label>
            <input 
              type="date" 
              className="tauze-input"
              value={formData.date} 
              onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} 
              required 
              max={new Date().toISOString().split('T')[0]} 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Motivo do Remanejamento</label>
            <SearchableSelect 
              value={formData.motivo}
              onChange={(val: any) => setFormData(f => ({ ...f, motivo: val }))}
              options={[
                { value: ``, label: `Selecione o motivo...` },
                ...(MOTIVOS || []).map(m => ({ value: String(m), label: String(m) })),
              ]}
            />
          </div>
        </div>
      </section>


      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Selecionar Animais</h4>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>
            <Users size={13} />
            Animais no Lote
            {animals.length > 0 && (
              <span style={{ background: 'hsl(var(--border))', borderRadius: '99px', padding: '1px 7px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                {selectedAnimals.length}/{animals.length}
              </span>
            )}
          </label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              className="text-btn-sm"
              onClick={() => setShowFilters(s => !s)}
              disabled={animals.length === 0}
              style={{ opacity: animals.length === 0 ? 0.35 : 1 }}
            >
              <Filter size={11} style={{ marginRight: '3px' }} />
              FILTROS{(filterSexo || filterCategoria) ? ' ●' : ''}
            </button>
            <span style={{ color: 'hsl(var(--border))', fontSize: '12px' }}>|</span>
            <button
              type="button"
              className="text-btn-sm"
              onClick={selectEntireLot}
              disabled={animals.length === 0}
              style={{ opacity: animals.length === 0 ? 0.35 : 1 }}
              title="Selecionar todos os animais do lote"
            >
              <Beef size={11} style={{ marginRight: '3px' }} />
              LOTE TODO
            </button>
            <button
              type="button"
              className="text-btn-sm"
              onClick={selectAll}
              disabled={filteredAnimals.length === 0}
              style={{ opacity: filteredAnimals.length === 0 ? 0.35 : 1 }}
            >
              {selectedAnimals.length === filteredAnimals.length && filteredAnimals.length > 0 ? 'DESMARCAR' : 'MARCAR VISÍVEIS'}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && animals.length > 0 && (
          <div className="search-glass-box small" style={{ marginBottom: '10px' }}>
            <Search size={13} className="s-icon" />
            <input type="text" placeholder="Buscar por brinco, raça, categoria, sexo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 4px' }}>
                <X size={13} />
              </button>
            )}
          </div>
        )}



        {/* Animal grid */}
        <div style={{ maxHeight: '260px', overflowY: 'auto', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: '12px', padding: '10px' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              ⏳ Buscando animais no lote...
            </div>
          ) : !formData.sourceLotId ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              Selecione um lote de origem para ver os animais.
            </div>
          ) : animals.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              Nenhum animal ativo neste lote.
            </div>
          ) : filteredAnimals.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              Nenhum animal com esse filtro.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '8px' }}>
              {filteredAnimals.map(animal => {
                const selected = selectedAnimals.includes(animal.id);
                return (
                  <div
                    key={animal.id}
                    onClick={() => toggleAnimal(animal.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '7px', padding: '9px',
                      background: selected ? 'hsl(var(--brand) / 0.06)' : 'white',
                      border: `1.5px solid ${selected ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                      borderRadius: '9px', cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ width: '16px', height: '16px', flexShrink: 0, color: 'hsl(var(--brand))', marginTop: '1px' }}>
                      {selected
                        ? <CheckCircle2 size={15} />
                        : <div style={{ width: '15px', height: '15px', border: '2px solid hsl(var(--border))', borderRadius: '4px' }} />
                      }
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        #{animal.brinco}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {animal.raca || '—'}
                      </span>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '2px' }}>
                        {animal.categoria && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '4px', background: 'hsl(var(--brand) / 0.08)', color: 'hsl(var(--brand))' }}>
                            {animal.categoria}
                          </span>
                        )}
                        {animal.sexo && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '4px', background: animal.sexo === 'MACHO' ? '#eff6ff' : '#fdf2f8', color: animal.sexo === 'MACHO' ? '#3b82f6' : '#ec4899' }}>
                            {animal.sexo === 'MACHO' ? '♂' : '♀'}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '2px' }}>
                        {animal.peso_atual && (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Weight size={8} /> {animal.peso_atual}kg
                          </span>
                        )}
                        {animal.data_nascimento && (
                          <span style={{ fontSize: '9px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                            {calcAge(animal.data_nascimento)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selection summary bar */}
        {selectedAnimals.length > 0 && (
          <div style={{ marginTop: '8px', padding: '8px 12px', background: 'hsl(var(--brand) / 0.08)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--brand))' }}>
              ✓ {selectedAnimals.length} animal{selectedAnimals.length !== 1 ? 'is' : ''} selecionado{selectedAnimals.length !== 1 ? 's' : ''}
              {selectedAnimals.length === animals.length && ' (lote completo)'}
            </span>
            <button type="button" onClick={() => setSelectedAnimals([])} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
              Limpar
            </button>
          </div>
        )}
      </section>

      <style>{`
        .text-btn-sm { background: none; border: none; font-size: 10px; font-weight: 800; color: hsl(var(--brand)); cursor: pointer; letter-spacing: 0.05em; text-transform: uppercase; display: inline-flex; align-items: center; }
      `}</style>
    </SidePanel>
    {confirmOverlay}
  </>
  );
};
