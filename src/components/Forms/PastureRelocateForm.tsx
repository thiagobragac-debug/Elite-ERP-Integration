import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  Save
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../utils/audit';
import toast from 'react-hot-toast';
import { SearchableSelect } from './SearchableSelect';

interface PastureRelocateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialSourcePastureId?: string;
  actionId?: number;
}

const MOTIVOS = [
  'Rotação de pasto',
  'Início de descanso (vazio sanitário)',
  'Separação por categoria',
  'Separação por sexo',
  'Tratamento de capim',
  'Superlotação do piquete',
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

interface PastureCapacity {
  current: number;
  max: number;
  area: number;
}

// â”€â”€ Smart Pasture Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PastureSearch({
  items, value, onChange, placeholder, label, exclude
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

  const available = exclude ? items.filter(i => i.id !== exclude) : items;
  const selected = available.find(i => i.id === value);
  const filtered = query
    ? available.filter(i => (i.nome || '').toLowerCase().includes(query.toLowerCase()))
    : available;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
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
      <label className="tauze-label">
        {label}
      </label>
      <div
        onClick={() => { setOpen(o => !o); }}
        className={`tauze-input ${open ? 'focus' : ''}`}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '0 16px', outline: open ? 'none' : '', borderColor: open ? 'hsl(var(--brand))' : '', boxShadow: open ? '0 0 0 4px hsl(var(--brand) / 0.1)' : '' }}
      >
        <Trees size={14} style={{ color: 'hsl(var(--brand))', flexShrink: 0 }} />
        {open ? (
          <input
            autoFocus
            value={query}
            onChange={e => { e.stopPropagation(); setQuery(e.target.value); }}
            onClick={e => e.stopPropagation()}
            placeholder={placeholder}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontWeight: 600, background: 'transparent', color: 'hsl(var(--text-main))', height: '100%' }}
          />
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
                <Trees size={12} style={{ color: 'hsl(var(--brand))', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nome}</div>
                  {item.area && <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{item.area} ha</div>}
                </div>
              </div>
              {item.capacidade_ua && (
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--text-muted))', flexShrink: 0, marginLeft: '8px' }}>cap. {item.capacidade_ua} UA</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PressureMeter({ cap, adding }: { cap: PastureCapacity; adding: number }) {
  const total = cap.current + adding;
  const uaHa = cap.area > 0 ? (total / cap.area).toFixed(2) : 'â€”';
  const pct = cap.max > 0 ? Math.min((total / cap.max) * 100, 100) : 0;
  const beforePct = cap.max > 0 ? Math.min((cap.current / cap.max) * 100, 100) : 0;
  const color = pct > 100 ? '#ef4444' : pct > 85 ? '#f59e0b' : '#10b981';
  const status = pct > 100 ? 'Superlotação!' : pct > 85 ? 'Pressão Alta' : pct > 50 ? 'Pressão Moderada' : 'Pressão Ideal';

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Activity size={11} /> Pressão de Pastejo
        </span>
        <span style={{ fontSize: '11px', fontWeight: 800, color }}>
          {uaHa} UA/ha â€” {status}
        </span>
      </div>
      <div style={{ background: 'hsl(var(--border))', borderRadius: '99px', height: '8px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${beforePct}%`, background: '#10b981', borderRadius: '99px' }} />
        {adding > 0 && (
          <div style={{ position: 'absolute', left: `${beforePct}%`, top: 0, height: '100%', width: `${Math.min(((adding) / (cap.max || 1)) * 100, 100 - beforePct)}%`, background: color, opacity: 0.7, borderRadius: '0 99px 99px 0' }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{total.toFixed(1)} UA total / {cap.area} ha</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Capacidade: {cap.max} UA</span>
      </div>
      {pct > 100 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '6px 10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
          <AlertTriangle size={12} color="#ef4444" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>Atenção: transferência ultrapassará a capacidade de suporte do pasto</span>
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

export const PastureRelocateForm: React.FC<PastureRelocateFormProps> = ({isOpen,
  onClose,
  onSubmit,
  initialSourcePastureId, actionId }) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter, activeFarmId, isGlobalMode } = useFarmFilter();
  const { user } = useAuth();
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
  const [showConfirm, setShowConfirm] = useState(false);

  const [sourcePastureId, setSourcePastureId] = useState(initialSourcePastureId || '');
  const [sourcePastureName, setSourcePastureName] = useState('');
  const [targetPastureId, setTargetPastureId] = useState('');
  const [targetPastureName, setTargetPastureName] = useState('');
  const [date, setDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');

  const canFetch = activeFarmId || (isGlobalMode && activeTenantId);

  useEffect(() => {
    if (isOpen && canFetch) fetchPastures();
    if (!isOpen) {
      setSelectedAnimals([]);
      setSearchTerm('');
      setFilterSexo('');
      setFilterCategoria('');
      setDestCap(null);
      setShowConfirm(false);
      setShowFilters(false);
      setSourcePastureId(initialSourcePastureId || '');
      setSourcePastureName('');
      setTargetPastureId('');
      setTargetPastureName('');
      setDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
      setMotivo('');
    }
  }, [isOpen, activeFarmId, isGlobalMode, activeTenantId]);

  useEffect(() => {
    if (sourcePastureId) fetchAnimals(sourcePastureId);
    else { setAnimals([]); setSelectedAnimals([]); }
  }, [sourcePastureId]);

  useEffect(() => {
    if (targetPastureId) fetchTargetCapacity(targetPastureId);
    else setDestCap(null);
  }, [targetPastureId]);

  const fetchPastures = async () => {
    const { data, error } = await applyFarmFilter(
      supabase.from('pastos').select('id, nome, area, capacidade_ua, status').order('nome')
    );
    if (error) console.error('[PastureRelocateForm] fetchPastures error:', error);
    if (data) setPastures(data);
  };

  const fetchAnimals = async (pastureId: string) => {
    setLoading(true);
    setSelectedAnimals([]);
    const { data } = await supabase
      .from('animais')
      .select('id, brinco, raca, categoria, sexo, peso_atual, data_nascimento')
      .eq('pasto_id', pastureId)
      .in('status', ['ATIVO', 'Ativo', 'ativo']);
    if (data) setAnimals(data);
    setLoading(false);
  };

  const fetchTargetCapacity = async (pastureId: string) => {
    const pasture = pastures.find(p => p.id === pastureId);
    const area = parseFloat(pasture?.area) || 0;
    const capUa = parseFloat(pasture?.capacidade_ua) || (area * 2.5);
    
    // Fetch all animals in the target pasture to calculate accurate current UA
    const { data } = await supabase
      .from('animais')
      .select('peso_atual')
      .eq('pasto_id', pastureId)
      .in('status', ['ATIVO', 'Ativo', 'ativo']);
      
    let currentUa = 0;
    if (data) {
      currentUa = data.reduce((acc, a) => {
         const p = parseFloat(a.peso_atual);
         return acc + (!isNaN(p) && p > 0 ? p / 450 : 1);
      }, 0);
    }
    setDestCap({ current: currentUa, max: capUa, area });
  };

  const toggleAnimal = (id: string) => {
    setSelectedAnimals(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const filteredAnimals = useMemo(() => {
    return animals.filter(a => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
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

  const selectedUaTotal = useMemo(() => {
    return selectedAnimals.reduce((acc, id) => {
      const animal = animals.find(a => a.id === id);
      return acc + (animal ? getAnimalUa(animal) : 0);
    }, 0);
  }, [selectedAnimals, animals]);

  const selectAll = () => {
    if (selectedAnimals.length === filteredAnimals.length && filteredAnimals.length > 0) {
      setSelectedAnimals([]);
    } else {
      setSelectedAnimals(filteredAnimals.map(a => a.id));
    }
  };

  const sourceName = sourcePastureName || pastures.find(p => p.id === sourcePastureId)?.nome || '';
  const targetName = targetPastureName || pastures.find(p => p.id === targetPastureId)?.nome || '';

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnimals.length === 0) { toast.error('Selecione ao menos um animal.'); return; }
    if (!targetPastureId) { toast.error('Selecione o pasto de destino.'); return; }
    if (!motivo) { toast.error('Informe o motivo do remanejamento.'); return; }
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('animais')
        .update({ pasto_id: targetPastureId })
        .in('id', selectedAnimals);

      if (!error) {
        if (activeTenantId) {
          const afterUaHa = destCap && destCap.area > 0
            ? ((destCap.current + selectedUaTotal) / destCap.area).toFixed(2)
            : 'â€”';

          await logAudit({
            tenant_id: activeTenantId,
            user_id: user?.id,
            action: 'TRANSFER_BATCH',
            entity: 'Pasto',
            entity_id: sourcePastureId,
            description: `Transferência de ${selectedAnimals.length} animais (${selectedUaTotal.toFixed(1)} UA) do pasto "${sourceName}" para "${targetName}" | Motivo: ${motivo} | Data: ${date} | Pressão pós: ${afterUaHa} UA/ha`,
            old_data: { pasto_id: sourcePastureId, animals_count: selectedAnimals.length },
            new_data: { pasto_id: targetPastureId, motivo, data: date }
          });

          await Promise.all(
            selectedAnimals.map(animalId => {
              const animal = animals.find(a => a.id === animalId);
              return logAudit({
                tenant_id: activeTenantId,
                user_id: user?.id,
                action: 'TRANSFER',
                entity: 'Animal',
                entity_id: animalId,
                description: `Animal #${animal?.brinco || animalId} transferido do pasto "${sourceName}" para "${targetName}" | Motivo: ${motivo}`,
                old_data: { pasto_id: sourcePastureId },
                new_data: { pasto_id: targetPastureId, motivo, data: date }
              });
            })
          );
        }
        onSubmit({ count: selectedAnimals.length, source: sourcePastureId, target: targetPastureId });
        onClose();
      }
    } catch (err) {
      console.error(err);
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };


  // Confirmation overlay (portal â†’ covers entire screen)
  const confirmOverlay = showConfirm ? ReactDOM.createPortal(
    (() => {
      const afterUa = (destCap?.current || 0) + selectedUaTotal;
      const afterUaHa = destCap && destCap.area > 0 ? (afterUa / destCap.area).toFixed(2) : null;
      const afterPct = destCap?.max ? Math.round((afterUa / destCap.max) * 100) : null;
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'hsl(var(--bg-card))', borderRadius: '20px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <Trees size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Confirmar Remanejamento de Pasto</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Revise os dados antes de confirmar</p>
              </div>
            </div>
            <div style={{ background: 'hsl(var(--bg-main))', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <Row label="Pasto de Origem" value={sourceName} />
              <Row label="Pasto de Destino" value={targetName} />
              <Row label="Animais" value={`${selectedAnimals.length} cab. (${selectedUaTotal.toFixed(1)} UA)`} />
              <Row label="Motivo" value={motivo} />
              <Row label="Data" value={new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')} />
              {afterUaHa && (
                <Row label="Pressão de pastejo pós-mov." value={`${afterUaHa} UA/ha (${afterPct}% cap.)`} color={afterPct && afterPct > 100 ? '#ef4444' : afterPct && afterPct > 85 ? '#f59e0b' : '#10b981'} />
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px', maxHeight: '80px', overflowY: 'auto' }}>
              {animals.filter(a => selectedAnimals.includes(a.id)).slice(0, 12).map(a => (
                <span key={a.id} style={{ background: '#f0fdf4', color: '#10b981', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>#{a.brinco}</span>
              ))}
              {selectedAnimals.length > 12 && <span style={{ color: 'hsl(var(--text-muted))', fontSize: '11px', fontWeight: 600 }}>+{selectedAnimals.length - 12} mais</span>}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '12px', border: '1px solid hsl(var(--border))', borderRadius: '10px', background: 'hsl(var(--bg-card))', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>Voltar</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: '12px', background: '#10b981', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 800, fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                {submitting ? 'Remanejando...' : `Confirmar ${selectedAnimals.length} Animais`}
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
      title="Remanejamento de Pasto"
      subtitle="Transfira animais entre piquetes e pastagens com rastreabilidade total."
      icon={ArrowRightLeft}
      loading={loading}
      submitLabel={`Revisar Remanejamento (${selectedAnimals.length})`}
      customFooter={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '16px' }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            {destCap && <PressureMeter cap={destCap} adding={selectedUaTotal} />}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button type="button" className="glass-btn secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-btn" disabled={loading} style={{ boxShadow: '0 8px 20px hsl(var(--brand) / 0.2)' }}>
              <Save size={18} />
              {loading ? 'Processando...' : `Revisar Remanejamento (${selectedAnimals.length})`}
            </button>
          </div>
        </div>
      }
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Origem e Destino</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-4">
          <div className="tauze-field-group">
            <PastureSearch
              items={pastures}
              value={sourcePastureId}
              onChange={(id, name) => { setSourcePastureId(id); setSourcePastureName(name); }}
              placeholder="Buscar pasto de origem..."
              label={<><Trees size={14} /> Pasto de Origem</>}
            />
          </div>
          
          <div className="tauze-field-group">
            <PastureSearch
              items={pastures}
              value={targetPastureId}
              onChange={(id, name) => { setTargetPastureId(id); setTargetPastureName(name); }}
              placeholder="Buscar pasto de destino..."
              label={<><Trees size={14} /> Pasto de Destino</>}
              exclude={sourcePastureId}
            />
            {(() => {
              const target = pastures.find(p => p.id === targetPastureId);
              if (target && (target.status === 'resting' || target.status === 'renovation')) {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7', borderRadius: '8px', fontSize: '11px', fontWeight: 600, marginTop: '8px' }}>
                    <AlertTriangle size={14} /> Atenção: Área de destino está em {target.status === 'resting' ? 'Descanso' : 'Reforma'}. A transferência pode prejudicar o pasto.
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data do Remanejamento</label>
            <input 
              className="tauze-input"
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
              max={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Motivo do Remanejamento</label>
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

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Selecionar Animais</h4>
        </div>
        
        <div className="tauze-field-group">
          {/* Header â€” always visible */}
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
                type="button" className="text-btn-sm"
                onClick={() => setShowFilters(s => !s)}
                disabled={animals.length === 0}
                style={{ opacity: animals.length === 0 ? 0.35 : 1 }}
              >
                <Filter size={12} style={{ display: 'inline', marginRight: '3px' }} />
                FILTROS{searchTerm ? ' â—' : ''}
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

          {showFilters && animals.length > 0 && (
            <div style={{ marginBottom: '12px', display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
              <div className="search-glass-box small" style={{ margin: 0, flex: 2 }}>
                <Search size={14} className="s-icon" />
                <input
                  type="text"
                  placeholder="Buscar por brinco, raça..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: '0 4px' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                <select 
                  style={{ flex: 1, fontSize: '12px', padding: '8px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-main))', outline: 'none' }}
                  value={filterSexo}
                  onChange={e => setFilterSexo(e.target.value)}
                >
                  <option value="">Qualquer Sexo</option>
                  <option value="MACHO">Machos</option>
                  <option value="FEMEA">Fêmeas</option>
                </select>
                <select 
                  style={{ flex: 1, fontSize: '12px', padding: '8px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-main))', outline: 'none' }}
                  value={filterCategoria}
                  onChange={e => setFilterCategoria(e.target.value)}
                >
                  <option value="">Qualquer Categoria</option>
                  <option value="Bezerro(a)">Bezerro(a)</option>
                  <option value="Novilha">Novilha</option>
                  <option value="Garrote">Garrote</option>
                  <option value="Vaca">Vaca</option>
                  <option value="Touro">Touro</option>
                </select>
              </div>
            </div>
          )}

          <div className="tauze-animal-picker">
            {loading ? (
              <div className="picker-loading">Buscando animais no pasto...</div>
            ) : !sourcePastureId ? (
              <div className="picker-empty">Selecione um pasto de origem para ver os animais.</div>
            ) : animals.length === 0 ? (
              <div className="picker-empty">Nenhum animal ativo neste pasto.</div>
            ) : filteredAnimals.length === 0 ? (
              <div className="picker-empty">Nenhum animal encontrado com esse filtro.</div>
            ) : (
              <div className="picker-list-adv">
                {filteredAnimals.map(animal => (
                  <div
                    key={animal.id}
                    className={`picker-list-item ${selectedAnimals.includes(animal.id) ? 'active' : ''}`}
                    onClick={() => toggleAnimal(animal.id)}
                  >
                    <div className="p-check-adv" style={{ marginTop: 0 }}>
                      {selectedAnimals.includes(animal.id) ? <CheckCircle2 size={18} /> : <div className="p-check-empty" style={{ width: '18px', height: '18px' }} />}
                    </div>
                    <div className="p-info-row">
                      <span className="p-brinco-adv" style={{ minWidth: '70px', fontSize: '13px' }}>#{animal.brinco}</span>
                      <span className="p-raca-adv" style={{ minWidth: '90px', fontSize: '11px' }}>{animal.raca || 'â€”'}</span>
                      {animal.categoria && <span className="p-tag">{animal.categoria}</span>}
                      {animal.sexo && <span className="p-tag" style={{ background: animal.sexo === 'MACHO' ? '#eff6ff' : '#fdf2f8', color: animal.sexo === 'MACHO' ? '#3b82f6' : '#ec4899' }}>{animal.sexo === 'MACHO' ? 'M' : 'F'}</span>}
                    </div>
                    <div className="p-stats-row">
                      {animal.peso_atual && <span><Weight size={12} /> {animal.peso_atual}kg</span>}
                      {animal.data_nascimento && <span style={{ minWidth: '70px' }}>ðŸŽ‚ {calcAge(animal.data_nascimento)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
      `}</style>
    </SidePanel>
    {confirmOverlay}
  </>
  );
};
