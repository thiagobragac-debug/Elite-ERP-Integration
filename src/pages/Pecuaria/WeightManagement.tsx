import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useSearchParams } from 'react-router-dom';
import {
  Scale,
  Plus,
  Search,
  Filter,
  TrendingUp,
  History,
  Trash2,
  Edit3,
  ChevronRight,
  Calendar,
  FileText,
  Layers,
  Bluetooth,
  Wifi,
  Link,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { WeightForm } from '../../components/Forms/WeightForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { formatNumber } from '../../utils/format';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { ScaleConfigModal } from './components/ScaleConfigModal';
import { WeightFilterModal } from './components/WeightFilterModal';
import { BatchWeightModal } from '../../components/Modals/BatchWeightModal';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useConfirm } from '../../contexts/ConfirmContext';
import { hasDraftForKey } from '../../hooks/useFormDraft';
import { useScale } from '../../contexts/ScaleContext';
import { usePermissions } from '../../hooks/usePermissions';

interface WeightRecord {
  id: string;
  brinco?: string;
  animal_id?: string;
  peso?: number;
  peso_atual?: number;
  peso_inicial?: number;
  data_pesagem?: string;
  gmd?: number;
  status?: string;
  animais?: { brinco?: string; lote_id?: string; [key: string]: unknown };
  observacao?: string;
  [key: string]: unknown;
}

// ── Lookup tables (espelhadas do WeightForm para uso no dashboard de lote) ──
const LOT_SLAUGHTER_TARGET_BREED: Record<string, number> = {
  nelore: 480, brangus: 510, angus: 520, brahman: 500,
  simental: 540, limousin: 530, hereford: 510, gir: 470,
  guzera: 480, girolando: 450, default: 500,
};
const LOT_CARCASS_YIELD_BREED: Record<string, number> = {
  nelore: 50, brangus: 54, angus: 58, brahman: 50,
  simental: 56, limousin: 57, hereford: 55, gir: 49,
  guzera: 50, girolando: 48, default: 52,
};
const getLotBreedKey = (raca?: string) =>
  (raca || '').toLowerCase().replace(/[^a-z]/g, '');

// Brazilian Cattle Market Lot Performance Dashboard
const LotPerformanceView: React.FC<{ tenantId: string; lotId: string }> = ({ tenantId, lotId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['lot-performance', tenantId, lotId],
    queryFn: async () => {
      const p_lote_id = lotId === 'all' ? null : lotId;
      const { data: result, error: err } = await supabase.rpc('get_lot_weight_performance', {
        p_tenant_id: tenantId,
        p_lote_id,
      });
      if (err) throw err;
      return result;
    },
    enabled: !!tenantId,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)}
      </div>
    );
  }

  if (error || !data || data.totalCount === 0) {
    return (
      <div
        style={{
          padding: '60px 40px',
          textAlign: 'center',
          background: 'hsl(var(--bg-card))',
          borderRadius: '20px',
          border: '1px solid hsl(var(--border) / 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            background: 'hsl(var(--brand) / 0.1)',
            color: 'hsl(var(--brand))',
            padding: '16px',
            borderRadius: '50%',
            display: 'inline-flex',
          }}
        >
          <TrendingUp size={36} />
        </div>
        <div>
          <h3
            style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'hsl(var(--text-main))' }}
          >
            Sem Dados de Performance
          </h3>
          <p
            style={{
              color: 'hsl(var(--text-muted))',
              fontSize: '13px',
              marginTop: '4px',
              maxWidth: '360px',
              marginInline: 'auto',
            }}
          >
            Realize pesagens para gerar a curva e análises automáticas de rendimento do lote.
          </p>
        </div>
      </div>
    );
  }

  const { avgWeight, avgGmd, totalCount: count, dominantBreed: rawDominantBreed, classes, topPerformers = [] } = data;

  // ── Preço de arroba configurável (persiste por sessão via localStorage) ──
  const [arrobaPrice, setArrobaPrice] = React.useState<number | null>(() => {
    const stored = localStorage.getItem('tauze_arroba_price');
    return stored ? Number(stored) : null;
  });
  const [editingPrice, setEditingPrice] = React.useState(false);
  const [priceInput, setPriceInput] = React.useState(String(arrobaPrice ?? ''));

  const handlePriceConfirm = () => {
    const val = Number(priceInput);
    if (val > 0) {
      setArrobaPrice(val);
      localStorage.setItem('tauze_arroba_price', String(val));
    }
    setEditingPrice(false);
  };

  const dominantBreedKey = getLotBreedKey(rawDominantBreed);
  const carcassYield = LOT_CARCASS_YIELD_BREED[dominantBreedKey] ?? LOT_CARCASS_YIELD_BREED['default'];
  const targetWeight = LOT_SLAUGHTER_TARGET_BREED[dominantBreedKey] ?? LOT_SLAUGHTER_TARGET_BREED['default'];

  // Arroba calculations: pesoVivo / 30 (conv. mercado)
  const avgArroba = avgWeight / 30;
  // Valor comercial: apenas se preço configurado
  const estimatedValuePerHead = arrobaPrice ? avgArroba * arrobaPrice : null;
  const totalLotValue = estimatedValuePerHead ? estimatedValuePerHead * count : null;

  // SLA calculations
  const remainingWeight = Math.max(0, targetWeight - avgWeight);
  const estimatedDays = avgGmd > 0 ? Math.ceil(remainingWeight / avgGmd) : 90;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      className="animate-scale-up"
    >
      {/* Dynamic Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {/* Card 1: GMD Médio */}
        <div
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-main) / 0.5) 100%)',
            border: '1.5px solid hsl(var(--border) / 0.5)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '120px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Ganho Médio Diário (Lote)
            </span>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 900,
                color: avgGmd >= 0.8 ? '#10b981' : '#f59e0b',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px',
              }}
            >
              {avgGmd > 0 ? avgGmd.toFixed(2) : '—'}
              {avgGmd > 0 && (
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                  kg/dia
                </span>
              )}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#10b981',
              marginTop: '12px',
            }}
          >
            <span
              style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}
            />
            Alta Eficiência Biológica
          </div>
        </div>

        {/* Card 2: Peso Estimado em @ */}
        <div
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-main) / 0.5) 100%)',
            border: '1.5px solid hsl(var(--border) / 0.5)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '120px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Rendimento em Arrobas (@)
            </span>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 900,
                color: 'hsl(var(--brand))',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px',
              }}
            >
              {avgArroba.toFixed(1)}
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--brand))' }}>
                @
              </span>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
            Rendimento de Carcaça ({carcassYield}% — {dominantBreedKey !== 'default' ? dominantBreedKey.charAt(0).toUpperCase() + dominantBreedKey.slice(1) : 'Raça padrão'})
          </div>
        </div>

        {/* Card 3: Valor Comercial Estimado */}
        <div
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-main) / 0.5) 100%)',
            border: '1.5px solid hsl(var(--border) / 0.5)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '120px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Valor Comercial do Lote
            </span>
          <div
            style={{
              fontSize: totalLotValue ? '22px' : '15px',
              fontWeight: 900,
              color: totalLotValue ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
              marginTop: '8px',
            }}
          >
            {totalLotValue
              ? `R$ ${totalLotValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'Preço não configurado'}
          </div>
        </div>
        {/* Editor de preço da arroba */}
        <div className="arroba-price-editor">
          {editingPrice ? (
            <>
              <span>R$/@ =</span>
              <input
                className="arroba-price-input"
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePriceConfirm(); if (e.key === 'Escape') setEditingPrice(false); }}
                autoFocus
                min={1}
                placeholder="ex: 290"
              />
              <button
                onClick={handlePriceConfirm}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(142 71% 45%)', fontWeight: 800, fontSize: '12px' }}
              >OK</button>
            </>
          ) : (
            <button
              onClick={() => { setEditingPrice(true); setPriceInput(String(arrobaPrice ?? '')); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--brand))', fontWeight: 700, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {arrobaPrice ? `Ref: R$ ${arrobaPrice}/@` : 'Definir preço da @'}
            </button>
          )}
        </div>
      </div>

        {/* Card 4: Projeção de Abate */}
        <div
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-main) / 0.5) 100%)',
            border: '1.5px solid hsl(var(--border) / 0.5)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '120px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Target Terminação
            </span>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 900,
                color: '#0284c7',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px',
              }}
            >
              {estimatedDays}
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                dias rest.
              </span>
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
            Previsão: {estimatedDate.toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Weight Classes Distribution */}
        <div
          style={{
            background: 'hsl(var(--bg-card))',
            border: '1.5px solid hsl(var(--border) / 0.5)',
            borderRadius: '20px',
            padding: '24px',
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 800,
              color: 'hsl(var(--text-main))',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Layers size={18} style={{ color: 'hsl(var(--brand))' }} />
            Distribuição de Classes de Peso (Curva do Lote)
          </h4>
          <p
            style={{
              margin: '4px 0 20px 0',
              fontSize: '12px',
              color: 'hsl(var(--text-muted))',
              fontWeight: 500,
            }}
          >
            Categorização de eficiência com base em faixas de desenvolvimento ponderal.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                label: 'Bezerros / Leves (< 350 kg)',
                count: classes.light,
                color: '#ef4444',
                desc: 'Desmame e Adaptação',
              },
              {
                label: 'Recria Saudável (350 - 450 kg)',
                count: classes.recria,
                color: '#f59e0b',
                desc: 'Desenvolvimento e Estrutura',
              },
              {
                label: 'Terminação Ativa (450 - 520 kg)',
                count: classes.termination,
                color: 'hsl(var(--brand))',
                desc: 'Acabamento de Gordura',
              },
              {
                label: 'Pronto para o Abate (> 520 kg)',
                count: classes.ready,
                color: '#10b981',
                desc: 'Padrão Frigorífico (Ideal)',
              },
            ].map((item, idx) => {
              const percentage = count > 0 ? (item.count / count) * 100 : 0;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ color: 'hsl(var(--text-main))' }}>{item.label}</span>
                    <span style={{ color: item.color }}>
                      {item.count} cab. ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: 'hsl(var(--bg-main))',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${percentage}%`,
                        background: item.color,
                        borderRadius: '4px',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'hsl(var(--text-muted))',
                      fontWeight: 500,
                      marginTop: '-2px',
                    }}
                  >
                    {item.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers Leaderboard */}
        <div
          style={{
            background: 'hsl(var(--bg-card))',
            border: '1.5px solid hsl(var(--border) / 0.5)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 800,
              color: 'hsl(var(--text-main))',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <TrendingUp size={18} style={{ color: '#10b981' }} />
            Top Performance Individual
          </h4>
          <p
            style={{
              margin: '4px 0 20px 0',
              fontSize: '12px',
              color: 'hsl(var(--text-muted))',
              fontWeight: 500,
            }}
          >
            Animais com melhor taxa de conversão alimentar e ganho de peso.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {topPerformers.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: idx === 0 ? 'rgba(16, 185, 129, 0.05)' : 'hsl(var(--bg-main) / 0.3)',
                  border:
                    idx === 0
                      ? '1px solid rgba(16, 185, 129, 0.2)'
                      : '1px solid hsl(var(--border) / 0.4)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#10b981' : 'hsl(var(--text-muted) / 0.2)',
                      color: idx === 0 ? '#fff' : 'hsl(var(--text-main))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '10px',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <span style={{ fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                      Brinco #{item.brinco || 'N/A'}
                    </span>
                    <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
                      {item.raca || 'Mestiço'} • Último Peso: {Number(item.peso).toFixed(1)} kg
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>
                    {item.gmd && item.gmd > 0 ? `+${item.gmd.toFixed(2)} kg/d` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const WeightManagement: React.FC = () => {
  const { confirm } = useConfirm();
  const { can } = usePermissions();
  const {
    activeFarm,
    isGlobalMode,
    activeFarmId,
    activeTenantId,
    applyFarmFilter,
    canCreate,
    insertPayload,
  } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<any>(null);
  // Modais: useState simples — estado de abertura não deve ser persistido entre sessões
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [selectedAnimalBrinco, setSelectedAnimalBrinco] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'RECENT' | 'PERFORMANCE') || 'RECENT';
  const setActiveTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tab);
        return n;
      },
      { replace: true }
    );
  };
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'WeightManagement_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    minWeight: 0,
    maxWeight: 1000,
    minGMD: 0,
    maxGMD: 2,
    dateStart: '',
    dateEnd: '',
    performanceLevel: 'all',
    daysSinceLastWeighing: 0,
  });
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const { state: scaleState } = useScale();

  const [selectedLotId, setSelectedLotId] = useState<string>('all');

  // Auto-reabrir: restaura formulário se existe rascunho (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isModalOpen) return;
    if (hasDraftForKey(`weight_form_${activeTenantId}`)) setIsModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  const { data: lots = [] } = useQuery({
    queryKey: ['lotes', activeTenantId, activeFarmId],
    queryFn: async () => {
      if (!activeTenantId) {
        return [];
      }
      let query = supabase.from('lotes').select('id, nome, status');
      const { data, error } = await applyFarmFilter(query);
      if (error) {
        throw error;
      }
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const { data: rawHistoryItems = [], isLoading: historyLoading } = useQuery({
    queryKey: ['pesagens', 'history', selectedAnimalId],
    queryFn: async () => {
      if (!selectedAnimalId) {
        return [];
      }
      const { data, error } = await supabase
        .from('pesagens')
        .select('*')
        .eq('animal_id', selectedAnimalId)
        .eq('tenant_id', activeTenantId)
        .order('data_pesagem', { ascending: false });
      if (error) {
        throw error;
      }
      return data || [];
    },
    enabled: !!selectedAnimalId,
  });

  const historyItems = React.useMemo(() => {
    return rawHistoryItems.map((p: any, idx: number) => {
      const prev = rawHistoryItems[idx + 1];
      let gmdText = '';
      let status: 'success' | 'warning' | 'info' = 'info';

      if (prev) {
        const days =
          (new Date(p.data_pesagem).getTime() - new Date(prev.data_pesagem).getTime()) /
          (1000 * 60 * 60 * 24);
        if (days > 0) {
          const gmdVal = (Number(p.peso) - Number(prev.peso)) / days;
          gmdText = ` | GMD: ${gmdVal.toFixed(2)} kg/dia`;
          status =
            gmdVal > 0.8
              ? ('success' as const)
              : gmdVal > 0.4
                ? ('info' as const)
                : ('warning' as const);
        }
      }

      return {
        id: p.id,
        date: p.data_pesagem,
        title: `Pesagem: ${Number(p.peso).toFixed(1)} kg`,
        subtitle: `${p.observacao || 'Pesagem de rotina'}${gmdText}`,
        value: `${Number(p.peso).toFixed(1)} kg`,
        status,
      };
    });
  }, [rawHistoryItems]);

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const {
    data: rawWeighings,
    stats,
    loading,
    error,
    totalCount,
    refresh,
  } = useReportData('pesagens', { page, pageSize });
  const weighings = (rawWeighings || []) as unknown as WeightRecord[];

  const handleOpenHistory = (weighing: any) => {
    const animalId = weighing.animal_id;
    const brinco = weighing.animais?.brinco || 'N/A';
    setSelectedAnimalBrinco(brinco);
    setSelectedAnimalId(animalId);
    setIsHistoryModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedWeight(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: any) => {
    setSelectedWeight(w);
    setIsModalOpen(true);
  };

  const queryClient = useQueryClient();

  const saveWeightMutation = useMutation({
    mutationFn: async ({ payload, id }: { payload: any; id?: string }) => {
      if (id) {
        const { data, error } = await supabase
          .from('pesagens')
          .update(payload)
          .eq('id', id)
          .eq('tenant_id', activeTenantId)
          .select();
        if (error) {
          throw error;
        }
        return { data: data?.[0], isEdit: true, id };
      }
      const { data, error } = await supabase.from('pesagens').insert([payload]).select();
      if (error) {
        throw error;
      }
      return { data: data?.[0], isEdit: false };
    },
    onMutate: async ({ payload, id }) => {
      const queryKey = [
        'report',
        'pesagens',
        activeTenantId,
        activeFarmId,
        page,
        pageSize,
        JSON.stringify({}),
      ];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<any>(queryKey);

      if (previousData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) {
            return old;
          }
          let newDataList = [...old.data];
          if (id) {
            newDataList = newDataList.map((item: any) =>
              item.id === id ? { ...item, ...payload } : item
            );
          } else {
            const optimisticId = `optimistic-${Date.now()}`;
            newDataList = [
              {
                id: optimisticId,
                ...payload,
                animais: { brinco: payload.brinco || '...' },
              },
              ...newDataList,
            ];
          }
          return {
            ...old,
            data: newDataList,
            totalCount: id ? old.totalCount : old.totalCount + 1,
          };
        });
      }

      return { previousData, queryKey };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error(`❌ Erro ao salvar pesagem: ${err.message}`);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: context?.queryKey });
      refresh();
    },
  });

  const deleteWeightMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pesagens')
        .delete()
        .eq('id', id)
        .eq('tenant_id', activeTenantId);
      if (error) {
        throw error;
      }
      return id;
    },
    onMutate: async (id) => {
      const queryKey = [
        'report',
        'pesagens',
        activeTenantId,
        activeFarmId,
        page,
        pageSize,
        JSON.stringify({}),
      ];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<any>(queryKey);

      if (previousData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            data: old.data.filter((item: any) => item.id !== id),
            totalCount: Math.max(0, old.totalCount - 1),
          };
        });
      }

      return { previousData, queryKey };
    },
    onError: (err: any, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error(`❌ Erro ao excluir pesagem: ${err.message}`);
    },
    onSettled: (data, error, id, context) => {
      queryClient.invalidateQueries({ queryKey: context?.queryKey });
      refresh();
    },
  });

  const handleSubmit = async (formData: any) => {
    if (!canCreate && !selectedWeight) {
      toast.error('⚠️ Selecione uma unidade específica para registrar uma nova pesagem.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        animal_id: formData.animal_id,
        peso: parseFloat(formData.peso),
        data_pesagem: formData.data_pesagem,
        observacao: formData.observacao,
      };

      if (selectedWeight) {
        await saveWeightMutation.mutateAsync({ payload, id: selectedWeight.id });
      } else {
        await saveWeightMutation.mutateAsync({
          payload: {
            ...payload,
            ...insertPayload,
          },
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      // Handled by mutation onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: 'Deseja excluir esta pesagem?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) {
      return;
    }
    try {
      await deleteWeightMutation.mutateAsync(id);
    } catch (err: any) {
      // Handled by mutation onError
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = weighings.map((item) => ({
      Animal: item.animais?.brinco || 'N/A',
      Data: new Date(item.data_pesagem ?? '').toLocaleDateString(),
      Peso: Number(item.peso).toFixed(2),
      GMD: item.gmd ? Number(item.gmd).toFixed(2) : '-',
      Observacao: item.observacao,
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'log_pesagens');
    } else if (format === 'excel') {
      exportToExcel(exportData, 'log_pesagens');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'log_pesagens', 'Relatório de Pesagens');
    }
  };

  const filteredWeighings = useMemo(() => {
    return weighings.filter((w) => {
      const matchesSearch = (w.animais?.brinco || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const weight = Number(w.peso || 0);
      const matchesWeight =
        filterValues.maxWeight >= 1000 ||
        (weight >= filterValues.minWeight && weight <= filterValues.maxWeight);

      const gmd = w.gmd || 0;
      const matchesPerformance =
        filterValues.performanceLevel === 'all' ||
        (filterValues.performanceLevel === 'high' && gmd > 1.0) ||
        (filterValues.performanceLevel === 'medium' && gmd >= 0.5 && gmd <= 1.0) ||
        (filterValues.performanceLevel === 'low' && gmd < 0.5);

      const matchesDate =
        (!filterValues.dateStart || new Date(w.data_pesagem ?? '') >= new Date(filterValues.dateStart)) &&
        (!filterValues.dateEnd || new Date(w.data_pesagem ?? '') <= new Date(filterValues.dateEnd));

      const daysSince =
        (new Date().getTime() - new Date(w.data_pesagem ?? '').getTime()) / (1000 * 3600 * 24);
      const matchesDays =
        !filterValues.daysSinceLastWeighing || daysSince >= filterValues.daysSinceLastWeighing;

      const matchesLot = selectedLotId === 'all' || w.animais?.lote_id === selectedLotId;

      return (
        matchesSearch &&
        matchesWeight &&
        matchesPerformance &&
        matchesDate &&
        matchesDays &&
        matchesLot
      );
    });
  }, [weighings, searchTerm, filterValues, selectedLotId]);

  // Helper: parse de data seguro com timezone (evita deslocamento UTC→local)
  const formatDate = (raw?: string) => {
    if (!raw) return 'N/A';
    // Adiciona T12:00:00 para que o parse não sofra offset de fuso horário
    const d = new Date(`${raw}T12:00:00`);
    if (isNaN(d.getTime())) return 'Data inválida';
    // Alerta visual para datas biologicamente impossíveis
    const year = d.getFullYear();
    const isAnomaly = year < 2000 || year > new Date().getFullYear() + 1;
    const formatted = d.toLocaleDateString('pt-BR');
    return isAnomaly ? `⚠ ${formatted}` : formatted;
  };

  const columns = useMemo(() => [
    {
      header: 'Animal / Brinco',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: 'hsl(var(--text-main))' }}>
            #{item.animais?.brinco || 'N/A'}
          </span>
          <span className="sub-meta" style={{ color: 'hsl(var(--text-muted))', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.animal_id?.slice(0, 8).toUpperCase() || item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Data da Pesagem',
      accessor: (item: any) => {
        const label = formatDate(item.data_pesagem);
        const isAnomaly = label.startsWith('⚠');
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, fontSize: '12px', color: isAnomaly ? 'hsl(38 92% 50%)' : 'hsl(var(--text-muted))' }}>
            <Calendar size={14} />
            <span title={isAnomaly ? 'Data possivelmente incorreta — verifique o registro' : undefined}>{label}</span>
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Peso Atual',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'hsl(var(--text-main))', fontWeight: 800 }}>
          <Scale size={14} color="hsl(var(--brand))" />
          <span>{Number(item.peso).toFixed(1)} kg</span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'GMD Médio Real',
      accessor: (item: any) => {
        const gmd = item.gmd;
        const hasGmd = gmd !== null && gmd !== undefined && gmd > 0;
        const color = !hasGmd
          ? 'hsl(var(--text-muted))'
          : gmd >= 0.8 ? 'hsl(142 71% 45%)'
          : gmd >= 0.4 ? 'hsl(38 92% 50%)'
          : 'hsl(0 84% 60%)';
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <TrendingUp size={14} color={color} />
            <span style={{ fontWeight: 800, color }}>
              {hasGmd ? `${gmd.toFixed(2)} kg/dia` : '—'}
            </span>
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Projeção Abate',
      accessor: (item: any) => {
        const peso = Number(item.peso);
        const gmd = item.gmd;
        // Target por raça do animal (fallback 500 kg quando raça desconhecida)
        const racaKey = getLotBreedKey(item.animais?.raca);
        const targetWeight = LOT_SLAUGHTER_TARGET_BREED[racaKey] || LOT_SLAUGHTER_TARGET_BREED.default;
        const remaining = targetWeight - peso;

        // Sem GMD real: não é possível calcular projeção
        if (!gmd || gmd <= 0) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span className="status-pill stopped" title="Sem GMD calculado — registre ao menos 2 pesagens">
                Sem GMD
              </span>
            </div>
          );
        }

        // Animal já atingiu ou ultrapassou o peso alvo
        if (remaining <= 0) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span className="status-pill success">Pronto ✓</span>
            </div>
          );
        }

        const daysToAbate = Math.ceil(remaining / gmd);
        const pillClass = daysToAbate <= 30 ? 'warning' : 'active';
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={`status-pill ${pillClass}`}>
              ~{daysToAbate} dias
            </span>
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Observação',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', maxWidth: '150px' }}>
          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 500 }} className="truncate">
            {item.observacao || '—'}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
  ], []);

  return (
    <div className="weight-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Pecuária', href: '/pecuaria/dashboard' },
              { label: 'Pesagens & GMD' },
            ]}
          />
          <h1 className="page-title">Pesagens & GMD</h1>
          <p className="page-subtitle">
            Monitoramento de ganho de peso individual e performance do lote em tempo real.
          </p>
        </div>
        <div className="page-actions">
          <button
            className={`icon-btn-secondary ${scaleState.status === 'CONNECTED' ? 'active' : ''}`}
            title={scaleState.status === 'CONNECTED' ? `Balança ${scaleState.brand} conectada` : 'Configurar Balança'}
            onClick={() => setIsScaleModalOpen(true)}
          >
            <Wifi size={20} />
          </button>
          {can('pecuaria', 'create') && (
            <>
              <button
                className="glass-btn secondary"
                style={{
                  borderColor: 'hsl(var(--brand) / 0.3)',
                  color: 'hsl(var(--brand))',
                  fontWeight: 800,
                  background: 'hsl(var(--brand) / 0.08)',
                }}
                onClick={() => setIsBatchModalOpen(true)}
              >
                <Layers size={18} />
                PESAGEM EM MASSA
              </button>
              <button className="primary-btn" onClick={handleOpenCreate}>
                <Plus size={18} />
                NOVO REGISTRO
              </button>
            </>
          )}
        </div>

      </header>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : stats?.map((stat: any, idx: number) => <TauzeStatCard key={idx} {...stat} />)}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${activeTab === 'RECENT' ? 'active' : ''}`}
            onClick={() => setActiveTab('RECENT')}
          >
            Últimas Pesagens
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'PERFORMANCE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PERFORMANCE')}
          >
            Performance do Lote
          </button>
        </div>

        {/* Seletor de Lote Avançado */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'hsl(var(--bg-card))',
            border: '1.5px solid hsl(var(--border) / 0.5)',
            borderRadius: '12px',
            padding: '6px 14px',
            minWidth: '180px',
          }}
        >
          <Layers size={16} style={{ color: 'hsl(var(--brand))' }} />
          <select
            value={selectedLotId}
            onChange={(e) => setSelectedLotId(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'hsl(var(--text-main))',
              fontSize: '13px',
              fontWeight: 700,
              outline: 'none',
              width: '100%',
              cursor: 'pointer',
            }}
          >
            <option
              value="all"
              style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))' }}
            >
              Todos os Lotes
            </option>
            {lots.map((l) => (
              <option
                key={l.id}
                value={l.id}
                style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-main))' }}
              >
                {l.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Pesquisar por brinco..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
          <button
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <div className="export-dropdown-container">
            <button
              className="icon-btn-secondary"
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-weight');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-weight" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-weight')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-weight')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-weight')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <WeightFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {activeTab === 'PERFORMANCE' ? (
          <LotPerformanceView tenantId={activeTenantId || ''} lotId={selectedLotId} />
        ) : (
          <ModernTable
            emptyState={
              <EmptyState
                title="Nenhuma pesagem registrada"
                description="Ainda não há pesagens lançadas para esta unidade. Inicie o controle de GMD registrando a primeira pesagem do lote."
                actionLabel="Nova Pesagem"
                onAction={handleOpenCreate}
                icon={Scale}
              />
            }
            data={filteredWeighings}
            columns={columns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            searchPlaceholder="Pesquisar por brinco..."
            actions={(item) => (
              <div className="modern-actions">
                <button
                  className="action-dot info"
                  title="Histórico"
                  onClick={() => handleOpenHistory(item)}
                >
                  <History size={18} />
                </button>
                {can('pecuaria', 'edit') && (
                  <button
                    className="action-dot edit"
                    onClick={() => handleOpenEdit(item)}
                    title="Editar"
                  >
                    <Edit3 size={18} />
                  </button>
                )}
                {can('pecuaria', 'delete') && (
                  <button
                    className="action-dot delete"
                    onClick={() => handleDelete(item.id)}
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
          />
        )}
      </div>

      <WeightForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedWeight}
        loading={isSubmitting}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedAnimalId(null);
        }}
        title={`Histórico de Peso - Brinco #${selectedAnimalBrinco}`}
        subtitle="Evolução de pesagens e ganho médio diário (GMD) cronológico"
        items={historyItems}
        loading={historyLoading}
      />

      <ScaleConfigModal isOpen={isScaleModalOpen} onClose={() => setIsScaleModalOpen(false)} />

      <BatchWeightModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSaveSuccess={refresh}
      />
    </div>
  );
};
