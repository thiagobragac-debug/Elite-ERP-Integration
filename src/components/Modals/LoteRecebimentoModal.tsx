import React, { useState, useEffect } from 'react';
import { SidePanel } from '../Layout/SidePanel';
import {
  Truck,
  Link,
  Package,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  FileText,
  Users,
  Scale,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from '../Forms/SearchableSelect';
import { DateInput } from '../../components/Form/DateInput';

// ─── Props ────────────────────────────────────────────────────────────────────
interface LoteRecebimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  notaFiscalId?: string;
  fornecedor?: string;
  quantidadeCabecas: number;
  valorTotal: number;
  onSuccess: (loteId: string, tipo: 'pendente' | 'vinculado') => void;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const mockAvulsoLots = [
  {
    id: 'lot-av-1',
    nome: 'Chegada 04/06 - Curral A',
    data_chegada: '2026-06-04',
    quantidade_animais: 48,
    fazenda: 'Fazenda São Bento',
  },
  {
    id: 'lot-av-2',
    nome: 'Chegada 03/06 - Curral B',
    data_chegada: '2026-06-03',
    quantidade_animais: 25,
    fazenda: 'Fazenda Santa Cruz',
  },
];

// ─── Helper ────────────────────────────────────────────────────────────────────
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getDefaultSlaDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toISOString().split('T')[0];
}

function formatDateBR(iso: string): string {
  if (!iso) {
    return '';
  }
  const [y, m, day] = iso.split('-');
  return `${day}/${m}/${y}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export const LoteRecebimentoModal: React.FC<LoteRecebimentoModalProps> = ({
  isOpen,
  onClose,
  notaFiscalId,
  fornecedor,
  quantidadeCabecas,
  valorTotal,
  onSuccess,
}) => {
  const { activeFarm, activeTenantId } = useTenant();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'pendente' | 'vincular'>('pendente');

  // ── Aba 1 — Criar Lote Pendente ───────────────────────────────────────────
  const [fazendaDestino, setFazendaDestino] = useState<string>('');
  const [fazendas, setFazendas] = useState<{ value: string; label: string }[]>([]);
  const [curral, setCurral] = useState<string>('');
  const [dataLimite, setDataLimite] = useState<string>(getDefaultSlaDate());
  const [gtaNumero, setGtaNumero] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [submittingPendente, setSubmittingPendente] = useState(false);

  // ── Aba 2 — Vincular Lote ─────────────────────────────────────────────────
  const [selectedLoteId, setSelectedLoteId] = useState<string>('');
  const [submittingVincular, setSubmittingVincular] = useState(false);

  // ── Derived: match summary ─────────────────────────────────────────────────
  const selectedLote = mockAvulsoLots.find((l) => l.id === selectedLoteId);
  const diferenca = selectedLote ? selectedLote.quantidade_animais - quantidadeCabecas : 0;
  const hasDivergencia = selectedLote && diferenca !== 0;

  // ── Fetch fazendas ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !activeTenantId) {
      return;
    }
    fetchFazendas();
  }, [isOpen, activeTenantId]);

  const fetchFazendas = async () => {
    try {
      const { data, error } = await supabase
        .from('fazendas')
        .select('id, nome')
        .eq('tenant_id', activeTenantId);
      if (error) {
        throw error;
      }
      setFazendas((data || []).map((f: any) => ({ value: f.id, label: f.nome })));
      if (activeFarm?.id && !fazendaDestino) {
        setFazendaDestino(activeFarm.id);
      }
    } catch {
      // silently ignore — farm list is optional
    }
  };

  // ── Reset on close ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('pendente');
      setFazendaDestino(activeFarm?.id || '');
      setCurral('');
      setDataLimite(getDefaultSlaDate());
      setGtaNumero('');
      setObservacoes('');
      setSelectedLoteId('');
    }
  }, [isOpen]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCriarLotePendente = () => {
    const newId = generateUUID();
    setSubmittingPendente(true);
    toast.promise(new Promise<void>((resolve) => setTimeout(resolve, 1500)), {
      loading: 'Criando lote pendente…',
      success: () => {
        setSubmittingPendente(false);
        onSuccess(newId, 'pendente');
        onClose();
        return 'Lote pendente criado com sucesso!';
      },
      error: () => {
        setSubmittingPendente(false);
        return 'Erro ao criar lote.';
      },
    });
  };

  const handleVincularLote = () => {
    if (!selectedLoteId) {
      return;
    }
    setSubmittingVincular(true);
    toast.promise(new Promise<void>((resolve) => setTimeout(resolve, 1200)), {
      loading: 'Vinculando lote e calculando custo/cabeça…',
      success: () => {
        setSubmittingVincular(false);
        onSuccess(selectedLoteId, 'vinculado');
        onClose();
        return 'Lote vinculado! Custo/cabeça calculado.';
      },
      error: () => {
        setSubmittingVincular(false);
        return 'Erro ao vincular lote.';
      },
    });
  };

  const custoPorCabeca =
    quantidadeCabecas > 0
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
          valorTotal / quantidadeCabecas
        )
      : '—';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => e.preventDefault()}
      title="Recebimento de Gado"
      subtitle={
        fornecedor
          ? `Nota Fiscal de ${fornecedor} · ${quantidadeCabecas} cabeças`
          : `${quantidadeCabecas} cabeças · Aguardando processamento`
      }
      icon={Truck}
      size="large"
      hideSubmit={true}
      customFooter={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
            Custo estimado/cabeça:{' '}
            <strong style={{ color: 'hsl(var(--text-main))' }}>{custoPorCabeca}</strong>
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="glass-btn secondary"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            {activeTab === 'pendente' ? (
              <button
                type="button"
                className="primary-btn"
                disabled={submittingPendente}
                onClick={handleCriarLotePendente}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: submittingPendente ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px hsl(var(--brand) / 0.3)',
                  opacity: submittingPendente ? 0.7 : 1,
                }}
              >
                <Package size={16} />
                Criar Lote Pendente
              </button>
            ) : (
              <button
                type="button"
                className="primary-btn"
                disabled={!selectedLoteId || submittingVincular}
                onClick={handleVincularLote}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: !selectedLoteId || submittingVincular ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: selectedLoteId ? '0 4px 14px hsl(var(--brand) / 0.3)' : 'none',
                  opacity: !selectedLoteId || submittingVincular ? 0.5 : 1,
                  background: hasDivergencia
                    ? 'linear-gradient(135deg, hsl(38 92% 45%), hsl(38 92% 58%))'
                    : undefined,
                }}
              >
                <Link size={16} />
                Vincular e Calcular Custo/Cabeça
              </button>
            )}
          </div>
        </div>
      }
    >
      <style>{`
        /* ── Tab navigation ────────────────────────────────────────────────── */
        .lrm-tabs {
          display: flex;
          gap: 2px;
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 4px;
        }
        .lrm-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: hsl(var(--text-muted));
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: center;
          line-height: 1.3;
        }
        .lrm-tab.active {
          background: hsl(var(--bg-card));
          color: hsl(var(--text-main));
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .lrm-tab.active svg {
          color: hsl(var(--brand));
        }
        .lrm-tab:hover:not(.active) {
          background: hsl(var(--bg-card) / 0.5);
          color: hsl(var(--text-main));
        }

        /* ── NF summary card ───────────────────────────────────────────────── */
        .lrm-nf-card {
          background: linear-gradient(135deg, hsl(var(--brand) / 0.06) 0%, hsl(var(--bg-main)) 100%);
          border: 1px solid hsl(var(--brand) / 0.2);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 4px;
        }
        .lrm-nf-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: hsl(var(--brand) / 0.12);
          border: 1px solid hsl(var(--brand) / 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--brand));
          flex-shrink: 0;
        }
        .lrm-nf-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
        }
        .lrm-nf-label {
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .lrm-nf-value {
          font-size: 14px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }
        .lrm-nf-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .lrm-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          color: hsl(var(--text-muted));
        }
        .lrm-chip.brand {
          background: hsl(var(--brand) / 0.1);
          border-color: hsl(var(--brand) / 0.3);
          color: hsl(var(--brand));
        }

        /* ── Tab content ───────────────────────────────────────────────────── */
        .lrm-tab-content {
          animation: lrmFadeIn 0.22s ease;
        }
        @keyframes lrmFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Section header ────────────────────────────────────────────────── */
        .lrm-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid hsl(var(--border) / 0.6);
        }
        .lrm-section-title-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: hsl(var(--brand) / 0.1);
          border: 1px solid hsl(var(--brand) / 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--brand));
          flex-shrink: 0;
        }
        .lrm-section-title h4 {
          font-size: 14px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin: 0;
        }
        .lrm-section-title p {
          font-size: 11px;
          color: hsl(var(--text-muted));
          margin: 2px 0 0;
          font-weight: 500;
        }

        /* ── Form field groups ─────────────────────────────────────────────── */
        .lrm-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 18px;
        }
        .lrm-label {
          font-size: 11px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .lrm-label .optional {
          font-size: 10px;
          font-weight: 600;
          color: hsl(var(--text-muted) / 0.6);
          text-transform: none;
          letter-spacing: 0;
        }
        .lrm-input {
          width: 100%;
          padding: 10px 14px;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          color: hsl(var(--text-main));
          font-size: 13px;
          font-weight: 600;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .lrm-input:focus {
          border-color: hsl(var(--brand));
          box-shadow: 0 0 0 3px hsl(var(--brand) / 0.1);
        }
        .lrm-input::placeholder {
          color: hsl(var(--text-muted) / 0.5);
          font-weight: 500;
        }
        textarea.lrm-input {
          resize: vertical;
          min-height: 88px;
        }
        .lrm-input-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* ── SLA indicator ─────────────────────────────────────────────────── */
        .lrm-sla-hint {
          font-size: 11px;
          color: hsl(38 92% 50%);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 4px;
        }

        /* ── Lote list (Aba 2) ──────────────────────────────────────────────── */
        .lrm-lot-card {
          border: 1.5px solid hsl(var(--border));
          border-radius: 14px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          background: hsl(var(--bg-card));
          margin-bottom: 10px;
          position: relative;
          overflow: hidden;
        }
        .lrm-lot-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: transparent;
          transition: background 0.2s;
          border-radius: 2px 0 0 2px;
        }
        .lrm-lot-card:hover {
          border-color: hsl(var(--brand) / 0.4);
          background: hsl(var(--brand) / 0.02);
        }
        .lrm-lot-card:hover::before {
          background: hsl(var(--brand) / 0.4);
        }
        .lrm-lot-card.selected {
          border-color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.05);
          box-shadow: 0 0 0 1px hsl(var(--brand) / 0.2), 0 4px 16px hsl(var(--brand) / 0.1);
        }
        .lrm-lot-card.selected::before {
          background: hsl(var(--brand));
        }
        .lrm-lot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .lrm-lot-name {
          font-size: 13.5px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }
        .lrm-lot-check {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid hsl(var(--border));
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
          background: hsl(var(--bg-main));
        }
        .lrm-lot-card.selected .lrm-lot-check {
          border-color: hsl(var(--brand));
          background: hsl(var(--brand));
          color: white;
        }
        .lrm-lot-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .lrm-lot-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          font-weight: 600;
        }

        /* ── Match summary ─────────────────────────────────────────────────── */
        .lrm-match-summary {
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          border-radius: 14px;
          padding: 16px 18px;
          margin-top: 16px;
          animation: lrmFadeIn 0.22s ease;
        }
        .lrm-match-title {
          font-size: 11px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .lrm-match-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .lrm-match-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 10px;
          padding: 10px 12px;
          text-align: center;
        }
        .lrm-match-stat-label {
          font-size: 9.5px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }
        .lrm-match-stat-value {
          font-size: 18px;
          font-weight: 900;
          color: hsl(var(--text-main));
        }
        .lrm-match-stat-value.positive { color: #10b981; }
        .lrm-match-stat-value.negative { color: #ef4444; }
        .lrm-match-stat-value.neutral  { color: hsl(var(--text-muted)); }

        /* ── Divergence warning ─────────────────────────────────────────────── */
        .lrm-divergence-warning {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: hsl(38 92% 50% / 0.08);
          border: 1px solid hsl(38 92% 50% / 0.35);
          border-radius: 12px;
          padding: 12px 14px;
          margin-top: 2px;
        }
        .lrm-divergence-warning p {
          font-size: 12px;
          font-weight: 600;
          color: hsl(38 60% 40%);
          margin: 0;
          line-height: 1.5;
        }

        /* ── Empty state ───────────────────────────────────────────────────── */
        .lrm-empty-state {
          text-align: center;
          padding: 40px 20px;
          color: hsl(var(--text-muted));
          font-size: 13px;
          font-weight: 600;
        }
        .lrm-empty-state svg {
          margin: 0 auto 12px;
          display: block;
          opacity: 0.35;
        }
      `}</style>

      {/* ── NF Summary Card ────────────────────────────────────────────────── */}
      <div className="lrm-nf-card">
        <div className="lrm-nf-icon">
          <FileText size={20} />
        </div>
        <div className="lrm-nf-meta">
          <span className="lrm-nf-label">
            {notaFiscalId ? `Nota Fiscal #${notaFiscalId}` : 'Nota Fiscal de Entrada'}
          </span>
          <span className="lrm-nf-value">{fornecedor || 'Fornecedor não informado'}</span>
          <div className="lrm-nf-chips">
            <span className="lrm-chip brand">
              <Users size={11} />
              {quantidadeCabecas} cabeças
            </span>
            <span className="lrm-chip">
              <Scale size={11} />
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                valorTotal
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div className="lrm-tabs">
        <button
          type="button"
          className={`lrm-tab${activeTab === 'pendente' ? ' active' : ''}`}
          onClick={() => setActiveTab('pendente')}
        >
          <Package size={15} />
          Fiscal Primeiro
        </button>
        <button
          type="button"
          className={`lrm-tab${activeTab === 'vincular' ? ' active' : ''}`}
          onClick={() => setActiveTab('vincular')}
        >
          <Link size={15} />
          Gado já chegou?
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ABA 1 — Criar Lote Pendente
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pendente' && (
        <div className="lrm-tab-content">
          <div className="lrm-section-title">
            <div className="lrm-section-title-icon">
              <Truck size={16} />
            </div>
            <div>
              <h4>Aguardando chegada do gado</h4>
              <p>O gado ainda está a caminho. Crie um lote pendente com SLA de rastreio.</p>
            </div>
          </div>

          {/* Fazenda destino */}
          <div className="lrm-field-group">
            <label className="lrm-label">
              <MapPin size={11} /> Fazenda Destino
            </label>
            <SearchableSelect
              value={fazendaDestino}
              onChange={setFazendaDestino}
              placeholder="Selecione a fazenda de destino…"
              options={
                fazendas.length > 0
                  ? fazendas
                  : [
                      { value: 'mock-faz-1', label: 'Fazenda São Bento' },
                      { value: 'mock-faz-2', label: 'Fazenda Santa Cruz' },
                    ]
              }
            />
          </div>

          {/* Curral / Piquete + Data limite */}
          <div className="lrm-input-grid-2">
            <div className="lrm-field-group" style={{ marginBottom: 0 }}>
              <label className="lrm-label">
                <MapPin size={11} /> Curral / Piquete
              </label>
              <input
                type="text"
                className="lrm-input"
                placeholder="Ex: Curral A, Piquete 3…"
                value={curral}
                onChange={(e) => setCurral(e.target.value)}
              />
            </div>

            <div className="lrm-field-group" style={{ marginBottom: 0 }}>
              <label className="lrm-label">
                <Calendar size={11} /> Data Limite (SLA)
              </label>
              <DateInput
                type="date"
                className="lrm-input"
                value={dataLimite}
                onChange={(e) => setDataLimite(e.target.value)}
              />
              <span className="lrm-sla-hint">
                <AlertCircle size={11} />
                Prazo para processar o lote
              </span>
            </div>
          </div>

          {/* GTA Número */}
          <div className="lrm-field-group" style={{ marginTop: '16px' }}>
            <label className="lrm-label">
              <FileText size={11} /> GTA Número <span className="optional">(opcional)</span>
            </label>
            <input
              type="text"
              className="lrm-input"
              placeholder="Ex: GTA-SP-2026-00042…"
              value={gtaNumero}
              onChange={(e) => setGtaNumero(e.target.value)}
            />
          </div>

          {/* Observações */}
          <div className="lrm-field-group">
            <label className="lrm-label">
              <FileText size={11} /> Observações <span className="optional">(opcional)</span>
            </label>
            <textarea
              className="lrm-input"
              placeholder="Informações adicionais sobre o lote, condições de transporte, etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA 2 — Vincular Lote Existente
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'vincular' && (
        <div className="lrm-tab-content">
          <div className="lrm-section-title">
            <div className="lrm-section-title-icon">
              <Link size={16} />
            </div>
            <div>
              <h4>O gado já chegou?</h4>
              <p>Selecione um lote avulso já cadastrado para vincular a esta nota fiscal.</p>
            </div>
          </div>

          {/* Lote list */}
          {mockAvulsoLots.length === 0 ? (
            <div className="lrm-empty-state">
              <Package size={40} />
              <p>Nenhum lote avulso encontrado.</p>
            </div>
          ) : (
            mockAvulsoLots.map((lote) => {
              const isSelected = selectedLoteId === lote.id;
              return (
                <div
                  key={lote.id}
                  className={`lrm-lot-card${isSelected ? ' selected' : ''}`}
                  onClick={() => setSelectedLoteId(isSelected ? '' : lote.id)}
                >
                  <div className="lrm-lot-header">
                    <span className="lrm-lot-name">{lote.nome}</span>
                    <div className="lrm-lot-check">{isSelected && <CheckCircle2 size={14} />}</div>
                  </div>
                  <div className="lrm-lot-meta">
                    <span className="lrm-lot-meta-item">
                      <Calendar size={12} />
                      Chegada: {formatDateBR(lote.data_chegada)}
                    </span>
                    <span className="lrm-lot-meta-item">
                      <Users size={12} />
                      {lote.quantidade_animais} animais
                    </span>
                    <span className="lrm-lot-meta-item">
                      <MapPin size={12} />
                      {lote.fazenda}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Match summary */}
          {selectedLote && (
            <div className="lrm-match-summary">
              <div className="lrm-match-title">
                <Scale size={13} />
                Resumo do Match
              </div>
              <div className="lrm-match-row">
                <div className="lrm-match-stat">
                  <span className="lrm-match-stat-label">NF (cabeças)</span>
                  <span className="lrm-match-stat-value">{quantidadeCabecas}</span>
                </div>
                <div className="lrm-match-stat">
                  <span className="lrm-match-stat-label">Lote (animais)</span>
                  <span className="lrm-match-stat-value">{selectedLote.quantidade_animais}</span>
                </div>
                <div className="lrm-match-stat">
                  <span className="lrm-match-stat-label">Diferença</span>
                  <span
                    className={`lrm-match-stat-value ${
                      diferenca === 0 ? 'positive' : diferenca > 0 ? 'negative' : 'negative'
                    }`}
                  >
                    {diferenca > 0 ? `+${diferenca}` : diferenca}
                  </span>
                </div>
              </div>

              {hasDivergencia && (
                <div className="lrm-divergence-warning">
                  <AlertCircle
                    size={16}
                    color="hsl(38 92% 45%)"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <p>
                    <strong>Divergência detectada.</strong> Será possível resolver no próximo passo,
                    após o vínculo.
                  </p>
                </div>
              )}

              {!hasDivergencia && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'hsl(142 71% 45% / 0.08)',
                    border: '1px solid hsl(142 71% 45% / 0.3)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    marginTop: '2px',
                  }}
                >
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#059669', margin: 0 }}>
                    Quantidade confere! O vínculo pode ser feito sem ajustes.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </SidePanel>
  );
};
