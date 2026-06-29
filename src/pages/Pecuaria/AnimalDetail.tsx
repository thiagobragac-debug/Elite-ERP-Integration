import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Beef,
  Calendar,
  Scale,
  Activity,
  Tag,
  TrendingUp,
  ShieldCheck,
  History,
  Edit3,
  Trash2,
  FileText,
  QrCode,
  MapPin,
  Info,
  DollarSign,
} from 'lucide-react';
import { calculateGMD, calculateDiasParaAbate, calculateCustoArrobaProduzida } from '../../utils/animalUtils';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { TauzeMainChart } from '../../components/Charts/TauzeMainChart';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { formatNumber, formatCurrency } from '../../utils/format';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { RastreabilidadeModal } from '../../components/Modals/RastreabilidadeModal';
import { AnimalForm } from '../../components/Forms/AnimalForm';
import { QuickManejoModal } from './components/QuickManejoModal';
import { CostStatementModal } from '../../components/Modals/CostStatementModal';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { exportToPDF } from '../../utils/export';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import './AnimalDetail.css';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePersistentState } from '../../hooks/usePersistentState';

const AnimatedNumber = ({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 1200; // 1.2s para dar um efeito mais "premium"

    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
      }
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart

      setDisplayValue(value * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value); // ensure exact final value
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  if (isCurrency) {
    return <>{formatCurrency(displayValue)}</>;
  }
  return <>{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(displayValue)}</>;
};

export const AnimalDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeFarmId, activeTenantId, insertPayload } = useFarmFilter();
  const [showRastreabilidade, setShowRastreabilidade] = usePersistentState(
    'AnimalDetail_showRastreabilidade',
    false
  );
  const [isEditModalOpen, setIsEditModalOpen] = usePersistentState(
    'AnimalDetail_isEditModalOpen',
    false
  );
  const [isManejoModalOpen, setIsManejoModalOpen] = usePersistentState(
    'AnimalDetail_isManejoModalOpen',
    false
  );
  const [isExtratoModalOpen, setIsExtratoModalOpen] = usePersistentState(
    'AnimalDetail_isExtratoModalOpen',
    false
  );

  // Fetch animal info
  const { data: animal, isLoading: animalLoading } = useQuery({
    queryKey: ['animal', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animais')
        .select('*, lotes(nome)')
        .eq('id', id)
        .eq('tenant_id', activeTenantId)
        .single();
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: !!id,
  });

  // Fetch weight history
  const { data: weights = [], isLoading: weightsLoading } = useQuery({
    queryKey: ['animal_weights', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pesagens')
        .select('*').eq('tenant_id', activeTenantId)
        .limit(500)
        .eq('animal_id', id)
        .order('data_pesagem', { ascending: true });
      if (error) {
        throw error;
      }
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch all historical data for the dossier
  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ['animal_costs', id],
    queryFn: async () => {
      // 1) Nutrição
      const costsRes = await supabase
        .from('nutricao_animais')
        .select('valor_total_consumido, data_consumo, quantidade_kg, dietas(nome)').eq('tenant_id', activeTenantId)
        .eq('animal_id', id)
        .order('data_consumo', { ascending: false });
      if (costsRes.error) {
        console.error('nutricao_animais erro:', costsRes.error);
      }

      // 2) Sanidade - busca sanidade_animais e depois sanidade separadamente para evitar falha no join
      const saRes = await supabase
        .from('sanidade_animais')
        .select(
          'id, valor_total_aplicado, produto_id, data_aplicacao, quantidade_dose, sanidade_id, produtos(nome)'
        ).eq('tenant_id', activeTenantId)
        .eq('animal_id', id);
      if (saRes.error) {
        console.error('sanidade_animais erro:', saRes.error);
      }

      // busca dados de sanidade (titulo, tipo, carencia, status) para cada sanidade_id único
      let healthData: any[] = [];
      if (saRes.data && saRes.data.length > 0) {
        const sanidadeIds = [...new Set(saRes.data.map((r: any) => r.sanidade_id).filter(Boolean))];
        const { data: sanidadeRows, error: sanErr } = await supabase
          .from('sanidade')
          .select('id, titulo, tipo, carencia_dias, status').eq('tenant_id', activeTenantId)
          .in('id', sanidadeIds);
        if (sanErr) {
          console.error('sanidade erro:', sanErr);
        }

        const sanidadeMap: Record<string, any> = {};
        (sanidadeRows || []).forEach((s: any) => {
          sanidadeMap[s.id] = s;
        });

        healthData = saRes.data.map((sa: any) => ({
          ...sa,
          sanidade: sanidadeMap[sa.sanidade_id] || null,
        }));
      }

      // 3) Reprodução
      const reproRes = await supabase
        .from('eventos_reprodutivos')
        .select('id, tipo_evento, data_evento, resultado, observacoes, status, custo').eq('tenant_id', activeTenantId)
        .eq('animal_id', id)
        .order('data_evento', { ascending: false });
      if (reproRes.error) {
        console.error('eventos_reprodutivos erro:', reproRes.error);
      }

      // 4) Movimentações de lote
      const moveRes = await supabase
        .from('historico_movimentacao_animal')
        .select(
          'id, data_movimentacao, motivo, lote_origem_id, lote_destino_id, lotes_origem:lote_origem_id(nome), lotes_destino:lote_destino_id(nome)'
        ).eq('tenant_id', activeTenantId)
        .eq('animal_id', id)
        .order('data_movimentacao', { ascending: false });
      if (moveRes.error) {
        console.error('historico_movimentacao erro:', moveRes.error);
      }

      // 5) Custos Diversos (Estoque)
      const loteId = moveRes.data?.[0]?.lote_destino_id || ''; // Get current lot if possible, but actually we need all lotes the animal has been in, or just query if animal_id matches or lote_pecuario_id matches. Since Supabase might complain about complex ORs with relations, let's just query direct animal_ids for now, and lotes the animal currently belongs to (from animal fetch).
      // Let's get the animal's current lote_id if any, or we can just fetch direct animal_id costs.
      // We will do a generic OR: animal_id = id OR lote_pecuario_id in (list of all lotes the animal was in).
      const lotesEnvolvidos = [
        ...new Set(
          moveRes.data?.flatMap((m: any) => [m.lote_origem_id, m.lote_destino_id]).filter(Boolean)
        ),
      ];

      let divRes: any = { data: [] };
      if (lotesEnvolvidos.length > 0) {
        divRes = await supabase
          .from('movimentacoes_estoque')
          .select(
            'id, data_movimentacao, quantidade, custo_unitario, origem_destino, produtos(nome), animal_id, lote_pecuario_id'
          ).eq('tenant_id', activeTenantId)
          .eq('tipo', 'SAIDA')
          .or(`animal_id.eq.${id},lote_pecuario_id.in.(${lotesEnvolvidos.join(',')})`);
      } else {
        divRes = await supabase
          .from('movimentacoes_estoque')
          .select(
            'id, data_movimentacao, quantidade, custo_unitario, origem_destino, produtos(nome), animal_id, lote_pecuario_id'
          ).eq('tenant_id', activeTenantId)
          .eq('tipo', 'SAIDA')
          .eq('animal_id', id);
      }
      if (divRes.error) {
        console.error('movimentacoes_estoque erro:', divRes.error);
      }

      // Now we need the count of animals in each lot to divide the cost.
      // We can fetch the current count of animals in these lotes
      const loteCounts: Record<string, number> = {};
      if (lotesEnvolvidos.length > 0) {
        const { data: countData } = await supabase
          .from('animais')
          .select('lote_id').eq('tenant_id', activeTenantId)
          .in('lote_id', lotesEnvolvidos)
          .neq('status', 'morto')
          .neq('status', 'vendido');

        if (countData) {
          countData.forEach((row) => {
            if (row.lote_id) {
              loteCounts[row.lote_id] = (loteCounts[row.lote_id] || 0) + 1;
            }
          });
        }
      }

      const miscellaneous = (divRes.data || []).map((m: any) => {
        let custoFinal = Number(m.quantidade) * Number(m.custo_unitario);
        if (m.lote_pecuario_id && !m.animal_id) {
          // It's a lot cost, divide by lot size
          const heads = loteCounts[m.lote_pecuario_id] || 1;
          custoFinal = custoFinal / heads;
        }
        return {
          ...m,
          custo_calculado: custoFinal,
        };
      });

      return {
        costs: costsRes.data || [],
        health: healthData,
        reproduction: reproRes.data || [],
        lotMovements: moveRes.data || [],
        miscellaneous: miscellaneous || [],
      };
    },
    enabled: !!id,
  });

  const loading = animalLoading || weightsLoading || financialLoading;

  const weightHistory = React.useMemo(() => {
    return weights.map((w: any) => ({
      label: new Date(w.data_pesagem).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      value: w.peso,
      date: w.data_pesagem,
    }));
  }, [weights]);

  const gmdHistory = React.useMemo(() => {
    const gmdHistoryData: any[] = [];
    for (let i = 1; i < weights.length; i++) {
      const prev = weights[i - 1];
      const curr = weights[i];
      const wDiff = curr.peso - prev.peso;
      const tDiff =
        (new Date(curr.data_pesagem).getTime() - new Date(prev.data_pesagem).getTime()) /
        (1000 * 3600 * 24);
      const days = Math.max(1, Math.floor(tDiff));
      const gmdVal = wDiff / days;
      gmdHistoryData.push({
        value: Number(gmdVal.toFixed(3)),
        label: new Date(curr.data_pesagem).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
      });
    }
    return gmdHistoryData;
  }, [weights]);

  const { data: timelineData = [], isLoading: timelineLoading } = useQuery({
    queryKey: ['animal_timeline', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_animal_timeline', { p_animal_id: id, p_limit: 50 });
      if (error) {
        throw error;
      }
      return data || [];
    },
    enabled: !!id,
  });

  const events = React.useMemo(() => {
    if (!timelineData || timelineData.length === 0) {
      if (animal) {
        return [
          {
            date: animal.created_at,
            type: 'ENTRADA',
            category: 'entrada',
            desc: 'Entrada na fazenda (Compra/Nascimento)',
          }
        ];
      }
      return [];
    }
    
    // Convert the database RPC format to the frontend format
    const mappedEvents = timelineData.map((ev: any) => {
      let category = 'misc';
      if (ev.event_type === 'PESAGEM') category = 'weight';
      else if (ev.event_type === 'SANIDADE') category = 'sanidade';
      else if (ev.event_type === 'NUTRIÇÃO' || ev.event_type === 'NUTRICAO') category = 'nutricao';
      else if (ev.event_type === 'REPRODUCAO') category = 'reproducao';
      
      return {
        date: ev.event_date,
        type: ev.event_type,
        category: category,
        desc: ev.description ? `${ev.title} — ${ev.description}` : ev.title,
      };
    });
    
    if (animal) {
      mappedEvents.push({
        date: animal.created_at,
        type: 'ENTRADA',
        category: 'entrada',
        desc: 'Entrada na fazenda (Compra/Nascimento)',
      });
    }

    return mappedEvents.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [animal, timelineData]);

  const editAnimalMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('animais').update(payload).eq('id', id).eq('tenant_id', activeTenantId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animal', id] });
      setIsEditModalOpen(false);
      toast.success('✅ Animal atualizado com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao salvar animal: ${err.message}`);
    },
  });

  const handleEditSubmit = async (formData: any) => {
    const payload = {
      brinco: formData.brinco,
      raca: formData.raca,
      sexo: formData.sexo,
      data_nascimento: formData.data_nascimento,
      fazenda_id: formData.fazenda_id || null,
      status: formData.status || 'Ativo',
      peso_inicial: parseFloat(formData.peso_inicial) || 0,
      pelagem: formData.pelagem,
      origem: formData.origem,
      mae_brinco: formData.mae_brinco,
      pai_brinco: formData.pai_brinco,
      valor_compra: parseFloat(formData.valor_compra) || 0,
      categoria: formData.categoria,
      finalidade: formData.finalidade,
    };

    editAnimalMutation.mutate(payload);
  };

  const isSubmitting = editAnimalMutation.isPending;

  const carenciaStatus = React.useMemo(() => {
    if (!financialData?.health || financialData.health.length === 0) {
      return {
        status: 'liberado',
        text: 'Pronto p/ Abate',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)',
      };
    }

    const hoje = new Date();
    let maxVencimento = new Date(0);
    let temCarencia = false;

    financialData.health.forEach((h: any) => {
      if (h.sanidade?.carencia_dias > 0 && h.data_aplicacao) {
        const dataApl = new Date(h.data_aplicacao);
        const vencimento = new Date(
          dataApl.getTime() + h.sanidade.carencia_dias * 24 * 60 * 60 * 1000
        );
        if (vencimento > hoje) {
          temCarencia = true;
          if (vencimento > maxVencimento) {
            maxVencimento = vencimento;
          }
        }
      }
    });

    if (temCarencia) {
      return {
        status: 'carencia',
        text: `Em Carência (até ${maxVencimento.toLocaleDateString('pt-BR')})`,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
      };
    }

    return {
      status: 'liberado',
      text: 'Pronto p/ Abate',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
    };
  }, [financialData]);

  if (loading) {
    return (
      <div className="animal-detail-page animate-slide-up" style={{ padding: '24px' }}>
        <header className="page-header" style={{ marginBottom: '24px' }}>
          <div
            style={{
              width: '200px',
              height: '16px',
              background: 'var(--skeleton-base, #1e293b)',
              borderRadius: '4px',
              marginBottom: '16px',
            }}
            className="skeleton-pulse"
          />
          <div
            style={{
              width: '150px',
              height: '36px',
              background: 'var(--skeleton-base, #1e293b)',
              borderRadius: '8px',
            }}
            className="skeleton-pulse"
          />
        </header>

        <div
          className="kpi-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            className="kpi-card skeleton-pulse"
            style={{ height: '110px', borderRadius: '16px' }}
          />
          <div
            className="kpi-card skeleton-pulse"
            style={{ height: '110px', borderRadius: '16px' }}
          />
          <div
            className="kpi-card skeleton-pulse"
            style={{ height: '110px', borderRadius: '16px' }}
          />
          <div
            className="kpi-card skeleton-pulse"
            style={{ height: '110px', borderRadius: '16px' }}
          />
        </div>

        <div
          className="detail-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              className="skeleton-pulse"
              style={{
                height: '380px',
                borderRadius: '24px',
                background: 'var(--skeleton-base, #1e293b)',
              }}
            />
            <div
              className="skeleton-pulse"
              style={{
                height: '220px',
                borderRadius: '24px',
                background: 'var(--skeleton-base, #1e293b)',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              className="skeleton-pulse"
              style={{
                height: '320px',
                borderRadius: '24px',
                background: 'var(--skeleton-base, #1e293b)',
              }}
            />
            <div
              className="skeleton-pulse"
              style={{
                height: '400px',
                borderRadius: '24px',
                background: 'var(--skeleton-base, #1e293b)',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!animal) {
    return <div>Animal não encontrado.</div>;
  }

  const currentWeight = animal.peso_atual || animal.peso_inicial || 0;

  // Cálculo Real de GMD: baseado na diferença entre a primeira e a última pesagem
  const calculateRealGMD = () => {
    if (weightHistory.length < 2) {
      return 0;
    }
    const first = weightHistory[0];
    const last = weightHistory[weightHistory.length - 1];

    const d1 = new Date(first.date);
    const d2 = new Date(last.date);
    const dayDiff = Math.max(1, Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

    return calculateGMD(first.value, last.value, dayDiff);
  };

  const realGmd = calculateRealGMD();

  const targetWeight = 600;
  const remainingWeight = Math.max(0, targetWeight - currentWeight);
  const daysToTarget = calculateDiasParaAbate(currentWeight, targetWeight, realGmd);
  const estimatedDate =
    daysToTarget > 0 ? new Date(Date.now() + daysToTarget * 24 * 60 * 60 * 1000) : null;

  const getProjectionSparkline = () => {
    if (realGmd <= 0 || currentWeight >= targetWeight) {
      return [];
    }
    const projection: any[] = [];
    const steps = 6;
    const weightStep = remainingWeight / (steps - 1);
    for (let i = 0; i < steps; i++) {
      const projectedWeight = currentWeight + weightStep * i;
      const days = realGmd > 0 ? Math.ceil((projectedWeight - currentWeight) / realGmd) : 0;
      const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      projection.push({
        value: Number(projectedWeight.toFixed(1)),
        label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      });
    }
    return projection;
  };

  const projectionSparkline = getProjectionSparkline();

  // Regra de Negócio: Carência Sanitária (Simulando verificação em registros de manejo)
  const isUnderGracePeriod = events.some(
    (e: any) => e.type === 'MEDICAMENTO' && e.expiryDate && new Date(e.expiryDate) > new Date()
  );

  const handleRelatorio = () => {
    if (!animal) {
      toast.error('Dados do animal não carregados.');
      return;
    }

    const publicLink = `https://rastreio.fazenda.app/animal/${animal.id}`;

    toast.promise(
      new Promise<void>(async (resolve, reject) => {
        try {
          let qrBase64 = '';
          try {
            const qrRes = await fetch(
              `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicLink)}`
            );
            const qrBlob = await qrRes.blob();
            qrBase64 = await new Promise<string>((res) => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result as string);
              reader.readAsDataURL(qrBlob);
            });
          } catch (qrErr) {
            console.warn('Falha ao obter imagem do QR Code:', qrErr);
          }

          setTimeout(() => {
            try {
              const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
              });

              const wGain = currentWeight - (animal.peso_inicial || 0);
              let ageStr = 'Não Informada';
              if (animal.data_nascimento) {
                const months = Math.floor(
                  (new Date().getTime() - new Date(animal.data_nascimento).getTime()) /
                    (1000 * 3600 * 24 * 30.44)
                );
                ageStr = `${months} meses`;
              }

              // ─── HEADER ───
              // Slate Background
              doc.setFillColor(15, 23, 42);
              doc.rect(0, 0, 210, 42, 'F');

              // Accent Emerald Bar
              doc.setFillColor(16, 185, 129);
              doc.rect(0, 42, 210, 3, 'F');

              // Brand Label
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(16);
              doc.text('TAUZE PECUÁRIA', 15, 18);

              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              doc.setTextColor(148, 163, 184);
              doc.text('REGISTRO DE RASTREABILIDADE INDIVIDUAL', 15, 25);
              doc.text(`Fazenda: ${animal.fazendas?.name || 'Visão Geral'}`, 15, 30);

              // Big ID Pill Badge on the Right
              doc.setFillColor(16, 185, 129);
              doc.roundedRect(145, 13, 50, 16, 4, 4, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(14);
              doc.text(`#${animal.brinco}`, 170, 23, { align: 'center' });
              doc.setFontSize(8);
              doc.text('BRINCO ATIVO', 170, 27, { align: 'center' });

              // ─── GRID DE DADOS (DADOS CADASTRAIS vs MÉTRICAS) ───
              // Left Box - Cadastro
              doc.setDrawColor(226, 232, 240);
              doc.setFillColor(255, 255, 255);
              doc.roundedRect(15, 53, 85, 102, 4, 4, 'FD');

              doc.setTextColor(15, 23, 42);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.text('DADOS CADASTRAIS', 22, 62);
              doc.setDrawColor(241, 245, 249);
              doc.line(22, 65, 92, 65);

              const drawField = (label: string, val: string, x: number, y: number) => {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);
                doc.text(label.toUpperCase(), x, y);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9.5);
                doc.setTextColor(15, 23, 42);
                doc.text(val || '-', x, y + 4.5);
              };

              drawField('Raça / Genética', animal.raca, 22, 73);
              drawField('Sexo', animal.sexo === 'M' ? 'Macho' : 'Fêmea', 22, 87);
              drawField('Idade Cronológica', ageStr, 22, 101);
              drawField('Pelagem', animal.pelagem || 'Não Informada', 22, 115);
              drawField('Pai (Genealogia)', animal.pai_brinco || 'Não Informado', 22, 129);
              drawField('Mãe (Genealogia)', animal.mae_brinco || 'Não Informada', 22, 143);

              // Right Box - Metricas
              doc.roundedRect(110, 53, 85, 102, 4, 4, 'FD');

              doc.setTextColor(15, 23, 42);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.text('DESEMPENHO OPERACIONAL', 117, 62);
              doc.line(117, 65, 187, 65);

              drawField('Peso de Entrada', `${animal.peso_inicial || 0} kg`, 117, 73);
              drawField('Peso Atual (Último)', `${currentWeight || 0} kg`, 117, 87);

              // Ganho de peso com cor verde se positivo
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7.5);
              doc.setTextColor(100, 116, 139);
              doc.text('GANHO DE PESO ACUMULADO', 117, 101);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9.5);
              doc.setTextColor(wGain >= 0 ? 16 : 220, wGain >= 0 ? 185 : 38, wGain >= 0 ? 129 : 38);
              doc.text(`${wGain >= 0 ? '+' : ''}${wGain.toFixed(1)} kg`, 117, 105.5);

              drawField('GMD Médio Diário', `${realGmd.toFixed(3)} kg/dia`, 117, 115);
              drawField('Lote de Manejo', animal.lotes?.nome || 'Sem Lote', 117, 129);
              drawField('Origem do Animal', animal.origem || 'Nascimento', 117, 143);

              // ─── TIMELINE (HISTÓRICO E MANEJOS) ───
              doc.setDrawColor(226, 232, 240);
              doc.setFillColor(255, 255, 255);
              doc.roundedRect(15, 163, 180, 95, 4, 4, 'FD');

              doc.setTextColor(15, 23, 42);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.text('HISTÓRICO DE MANEJOS E EVENTOS', 22, 172);
              doc.line(22, 175, 188, 175);

              // Vertical timeline line
              doc.setDrawColor(16, 185, 129);
              doc.line(30, 184, 30, 242);

              const listEvents = events.slice(0, 4); // Limit to last 4 events to fit nicely
              listEvents.forEach((ev, idx) => {
                const evY = 188 + idx * 14;

                // Draw bullet point
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(16, 185, 129);
                doc.circle(30, evY - 1, 1.8, 'FD');

                // Date
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(new Date(ev.date).toLocaleDateString('pt-BR'), 36, evY - 1.5);

                // Event description text
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(15, 23, 42);
                doc.text(`${ev.type}: ${ev.desc}`, 36, evY + 2.5);
              });

              if (listEvents.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(148, 163, 184);
                doc.text('Nenhum evento registrado na linha do tempo.', 36, 190);
              }

              // ─── FOOTER CONTEÚDO (QR CODE / SEGURANÇA) ───
              // Draw fake QR Code / Verification card in bottom footer
              doc.setDrawColor(241, 245, 249);
              doc.setFillColor(248, 250, 252);
              doc.roundedRect(15, 264, 180, 20, 3, 3, 'FD');

              // Define and draw a mathematically valid Code 39 barcode
              const drawCode39 = (
                x: number,
                y: number,
                textStr: string,
                barHeight: number = 10,
                barWidth: number = 0.28
              ) => {
                const code39Map: Record<string, string> = {
                  '0': '101001101101',
                  '1': '110100101011',
                  '2': '101100101011',
                  '3': '110110010101',
                  '4': '101001101011',
                  '5': '110100110101',
                  '6': '101100110101',
                  '7': '101001011011',
                  '8': '110100101101',
                  '9': '101100101101',
                  A: '110101001011',
                  B: '101101001011',
                  C: '110110100101',
                  D: '101011001011',
                  E: '110101100101',
                  F: '101101100101',
                  G: '101010011011',
                  H: '110101001101',
                  I: '101101001101',
                  J: '101011001101',
                  K: '110101010011',
                  L: '101101010011',
                  M: '110110101001',
                  N: '101011010011',
                  O: '110101101001',
                  P: '101101101001',
                  Q: '101010110011',
                  R: '110101011001',
                  S: '101101011001',
                  T: '101011011001',
                  U: '110010101011',
                  V: '100110101011',
                  W: '110011010101',
                  X: '100101101011',
                  Y: '110010110101',
                  Z: '100110110101',
                  '-': '100101011011',
                  '.': '110010101101',
                  ' ': '100110101101',
                  '*': '100101101101',
                };

                const cleanText = `*${textStr.toUpperCase().replace(/[^A-Z0-9\-\.\s]/g, '')}*`;
                let currentX = x;
                doc.setFillColor(15, 23, 42);

                for (let i = 0; i < cleanText.length; i++) {
                  const char = cleanText[i];
                  const pattern = code39Map[char] || code39Map['*'];

                  for (let p = 0; p < pattern.length; p++) {
                    if (pattern[p] === '1') {
                      doc.rect(currentX, y, barWidth, barHeight, 'F');
                    }
                    currentX += barWidth;
                  }
                  currentX += barWidth;
                }
              };

              drawCode39(22, 269, animal.brinco || '00000');

              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7);
              doc.setTextColor(100, 116, 139);
              doc.text('ID DE VERIFICAÇÃO INTEGRADO', 62, 273);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7.5);
              doc.setTextColor(15, 23, 42);
              doc.text(`Código Único: ${animal.id?.slice(0, 18).toUpperCase()}`, 62, 277);
              doc.text(
                'Certificado emitido digitalmente pelo módulo Tauze Rastreabilidade.',
                62,
                281
              );

              // Embed real scannable QR Code image if successfully fetched
              if (qrBase64) {
                doc.addImage(qrBase64, 'PNG', 177, 266, 16, 16);
              }

              // Page numbers and metadata
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7.5);
              doc.setTextColor(148, 163, 184);
              doc.text(`Página 1 de 1`, 195, 290, { align: 'right' });

              const blob = doc.output('blob');
              const blobUrl = URL.createObjectURL(blob);
              window.open(blobUrl, '_blank');
              resolve();
            } catch (err) {
              reject(err);
            }
          }, 1200);
        } catch (outerErr) {
          reject(outerErr);
        }
      }),
      {
        loading: 'Gerando dossiê de identidade do animal…',
        success: '📊 Visualização do relatório aberta em nova guia!',
        error: 'Erro ao gerar dossiê.',
      }
    );
  };

  return (
    <div className="animal-detail-page animate-slide-up">
      <header style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '8px' }}>
          <Breadcrumb
            paths={[
              { label: 'Pecuária', href: '/pecuaria/dashboard' },
              { label: 'Animais', href: '/pecuaria/animal' },
              { label: 'Detalhes' },
            ]}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                color: 'hsl(var(--text-main))',
                margin: 0,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              #{animal.brinco}
            </h1>
            <div className="status-pill active" style={{ flexShrink: 0 }}>
              {animal.status}
            </div>
            <div
              className="status-pill"
              style={{
                flexShrink: 0,
                background: carenciaStatus.bg,
                color: carenciaStatus.color,
                border: `1px solid ${carenciaStatus.color}40`,
                fontWeight: 700,
              }}
            >
              {carenciaStatus.text}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            <button
              className="glass-btn secondary"
              title="Editar Animal"
              onClick={() => setIsEditModalOpen(true)}
              style={{ padding: '8px 12px' }}
            >
              <Edit3 size={18} />
            </button>
            <button
              className="glass-btn secondary"
              title="Visualizar Rastreabilidade e Genealogia"
              onClick={() => setShowRastreabilidade(true)}
              style={{ padding: '8px 12px' }}
            >
              <QrCode size={18} />
            </button>
            <button
              className="glass-btn secondary"
              title="Exportar Relatório em PDF"
              onClick={handleRelatorio}
              style={{ padding: '8px 12px' }}
            >
              <FileText size={18} />
            </button>
            <button className="primary-btn" onClick={() => setIsManejoModalOpen(true)}>
              <Activity size={18} /> NOVO MANEJO
            </button>
          </div>
        </div>

        <p
          style={{
            color: 'hsl(var(--text-muted))',
            fontSize: '1rem',
            margin: 0,
            fontWeight: 600,
            marginTop: '8px',
          }}
        >
          {animal.raca} | {animal.sexo === 'M' ? 'Macho' : 'Fêmea'} | Lote:{' '}
          {animal.lotes?.nome || 'Sem Lote'}
        </p>
      </header>

      <div className="next-gen-kpi-grid">
        <TauzeStatCard
          label="Peso Atual"
          value={`${currentWeight} kg`}
          icon={Scale}
          color="#3b82f6"
          progress={(currentWeight / 600) * 100}
          change={`${formatNumber(currentWeight - animal.peso_inicial)}kg total`}
          trend="up"
          periodLabel="Última Pesagem"
          sparkline={weightHistory}
          interpolate={false}
        />
        <TauzeStatCard
          label="GMD Médio Real"
          value={`${realGmd.toFixed(3)} kg`}
          icon={TrendingUp}
          color={realGmd > 0.8 ? '#10b981' : '#f59e0b'}
          progress={realGmd * 100}
          change={realGmd > 0.8 ? 'Meta Atingida' : 'Abaixo da Meta'}
          trend={realGmd > 0.7 ? 'up' : 'down'}
          periodLabel="Desde a Entrada"
          sparkline={gmdHistory}
          interpolate={false}
        />
        <TauzeStatCard
          label="Previsão de Abate"
          value={
            currentWeight >= targetWeight
              ? 'Meta Atingida'
              : estimatedDate
                ? estimatedDate.toLocaleDateString()
                : 'Sem Dados'
          }
          icon={Calendar}
          color="#8b5cf6"
          progress={
            currentWeight >= targetWeight
              ? 100
              : daysToTarget > 0
                ? Math.max(10, Math.min(95, 100 - daysToTarget / 15))
                : 0
          }
          change={
            currentWeight >= targetWeight
              ? 'Pronto para Abate'
              : daysToTarget > 0
                ? `${daysToTarget} dias restantes`
                : 'Requer min. 2 pesagens'
          }
          trend="up"
          periodLabel="Meta: 600kg (20@)"
          sparkline={projectionSparkline}
          interpolate={false}
        />
        <TauzeStatCard
          label="Segurança Sanitária"
          value={isUnderGracePeriod ? 'BLOQUEADO' : 'LIBERADO'}
          icon={ShieldCheck}
          color={isUnderGracePeriod ? '#ef4444' : '#166534'}
          progress={isUnderGracePeriod ? 40 : 100}
          change={isUnderGracePeriod ? 'Carência Ativa' : 'Sem Restrições'}
          periodLabel="Manejo Sanitário"
          sparkline={
            isUnderGracePeriod
              ? []
              : [
                  { value: 100, label: 'Livre' },
                  { value: 100, label: 'Livre' },
                  { value: 100, label: 'Livre' },
                  { value: 100, label: 'Livre' },
                  { value: 100, label: 'Livre' },
                ]
          }
          interpolate={false}
        />
      </div>

      <div
        className="detail-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '16px',
          alignItems: 'start',
          marginTop: '16px',
        }}
      >
        {/* COLUNA ESQUERDA: Gráfico e Extrato */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <section
            className="analytics-canvas"
            style={{
              background: 'hsl(var(--bg-card))',
              borderRadius: '24px',
              border: '1px solid hsl(var(--border))',
              display: 'flex',
              flexDirection: 'column',
              height: '380px',
            }}
          >
            <div className="panel-header">
              <h3>Histórico de Peso (Curva de Crescimento)</h3>
              <div className="panel-actions">
                <button className="text-btn">Ciclo Completo</button>
              </div>
            </div>
            <div className="chart-container-tauze">
              {weightHistory.length > 0 ? (
                <TauzeMainChart data={weightHistory} color="#3b82f6" height="100%" unit="kg" />
              ) : (
                <div className="empty-chart-placeholder">
                  <p>Nenhuma pesagem registrada para este animal.</p>
                </div>
              )}
            </div>
          </section>

          <section
            className="info-panel"
            style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)' }}
          >
            <div
              className="panel-header"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              <h3 style={{ color: '#fff' }}>Extrato Financeiro (Custeio Diário)</h3>
              <DollarSign size={18} color="#10b981" />
            </div>
            <div
              className="info-list"
              style={{
                marginTop: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
              }}
            >
              <div
                className="info-item"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <label
                  style={{
                    color: '#94a3b8',
                    fontSize: '10px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Custo Aquisição
                </label>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>
                  <AnimatedNumber value={animal.valor_compra || 0} isCurrency={true} />
                </span>
              </div>
              <div
                className="info-item"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <label
                  style={{
                    color: '#94a3b8',
                    fontSize: '10px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Custo Nutrição
                </label>
                <span style={{ color: '#fbbf24', fontSize: '15px', fontWeight: 700 }}>
                  <AnimatedNumber
                    value={
                      financialData?.costs?.reduce(
                        (acc: number, curr: any) => acc + Number(curr.valor_total_consumido || 0),
                        0
                      ) || 0
                    }
                    isCurrency={true}
                  />
                </span>
              </div>
              <div
                className="info-item"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <label
                  style={{
                    color: '#94a3b8',
                    fontSize: '10px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Custo Sanidade
                </label>
                <span style={{ color: '#f87171', fontSize: '15px', fontWeight: 700 }}>
                  <AnimatedNumber
                    value={(financialData?.health || []).reduce(
                      (acc: number, curr: any) => acc + Number(curr.valor_total_aplicado || 0),
                      0
                    )}
                    isCurrency={true}
                  />
                </span>
                {(financialData?.health || []).some(
                  (h: any) => Number(h.valor_total_aplicado || 0) === 0
                ) && (
                  <div
                    style={{ fontSize: '9px', color: '#f59e0b', marginTop: '2px', fontWeight: 700 }}
                  >
                    ⚠️ Custeio pendente
                  </div>
                )}
              </div>

              <div
                className="info-item"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <label
                  style={{
                    color: '#94a3b8',
                    fontSize: '10px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Custo Reprodução
                </label>
                <span style={{ color: '#c084fc', fontSize: '15px', fontWeight: 700 }}>
                  <AnimatedNumber
                    value={(financialData?.reproduction || []).reduce(
                      (acc: number, curr: any) => acc + Number(curr.custo || 0),
                      0
                    )}
                    isCurrency={true}
                  />
                </span>
              </div>

              <div
                className="info-item"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <label
                  style={{
                    color: '#94a3b8',
                    fontSize: '10px',
                    display: 'block',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Custo Diversos
                </label>
                <span style={{ color: '#06b6d4', fontSize: '15px', fontWeight: 700 }}>
                  <AnimatedNumber
                    value={(financialData?.miscellaneous || []).reduce(
                      (acc: number, curr: any) => acc + Number(curr.custo_calculado || 0),
                      0
                    )}
                    isCurrency={true}
                  />
                </span>
              </div>

              <div
                className="info-item"
                style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                }}
              >
                <label
                  style={{
                    color: '#fca5a5',
                    fontWeight: 800,
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Custo Total (Saída)
                </label>
                <span
                  style={{
                    color: '#ef4444',
                    fontSize: '16px',
                    fontWeight: 900,
                    textShadow: '0 2px 10px rgba(239,68,68,0.2)',
                  }}
                >
                  <AnimatedNumber
                    value={(() => {
                      const custoNutricao = (financialData?.costs || []).reduce(
                        (acc: number, curr: any) => acc + Number(curr.valor_total_consumido || 0),
                        0
                      );
                      const custoSanidade = (financialData?.health || []).reduce(
                        (acc: number, curr: any) => acc + Number(curr.valor_total_aplicado || 0),
                        0
                      );
                      const custoReproducao = (financialData?.reproduction || []).reduce(
                        (acc: number, curr: any) => acc + Number(curr.custo || 0),
                        0
                      );
                      const custoDiversos = (financialData?.miscellaneous || []).reduce(
                        (acc: number, curr: any) => acc + Number(curr.custo_calculado || 0),
                        0
                      );
                      return (
                        (animal.valor_compra || 0) +
                        custoNutricao +
                        custoSanidade +
                        custoReproducao +
                        custoDiversos
                      );
                    })()}
                    isCurrency={true}
                  />
                </span>
              </div>

              <div
                className="info-item"
                style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                }}
              >
                <label
                  style={{
                    color: '#93c5fd',
                    fontWeight: 800,
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Receita / Venda
                </label>
                <span style={{ color: '#60a5fa', fontSize: '16px', fontWeight: 900 }}>
                  <AnimatedNumber value={animal.valor_venda || 0} isCurrency={true} />
                </span>
              </div>

              <div
                className="info-item"
                style={{
                  background: 'rgba(245, 158, 11, 0.05)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.1)',
                }}
              >
                <label
                  style={{
                    color: '#fcd34d',
                    fontWeight: 800,
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Custo / @ Produzida
                </label>
                <span style={{ color: '#fbbf24', fontSize: '16px', fontWeight: 900 }}>
                  <AnimatedNumber
                    value={(() => {
                      const custoNutricao = (financialData?.costs || []).reduce(
                        (acc: number, curr: any) => acc + Number(curr.valor_total_consumido || 0),
                        0
                      );
                      const custoSanidade = (financialData?.health || []).reduce(
                        (acc: number, curr: any) => acc + Number(curr.valor_total_aplicado || 0),
                        0
                      );
                      const custoReproducao = (financialData?.reproduction || []).reduce(
                        (acc: number, curr: any) => acc + Number(curr.custo || 0),
                        0
                      );
                      const custoDiversos = (financialData?.miscellaneous || []).reduce(
                        (acc: number, curr: any) => acc + Number(curr.custo_calculado || 0),
                        0
                      );
                      const totalManejoCustos = custoNutricao + custoSanidade + custoReproducao + custoDiversos;
                      const pesoGanho = (animal.peso_atual || 0) - (animal.peso_inicial || 0);
                      return calculateCustoArrobaProduzida(totalManejoCustos, pesoGanho);
                    })()}
                    isCurrency={true}
                  />
                </span>
              </div>

              <div
                className="info-item"
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                }}
              >
                <label
                  style={{
                    color: '#6ee7b7',
                    fontWeight: 800,
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Resultado (Lucro)
                </label>
                {(() => {
                  const custoNutricao = (financialData?.costs || []).reduce(
                    (acc: number, curr: any) => acc + Number(curr.valor_total_consumido || 0),
                    0
                  );
                  const custoSanidade = (financialData?.health || []).reduce(
                    (acc: number, curr: any) => acc + Number(curr.valor_total_aplicado || 0),
                    0
                  );
                  const custoReproducao = (financialData?.reproduction || []).reduce(
                    (acc: number, curr: any) => acc + Number(curr.custo || 0),
                    0
                  );
                  const custoDiversos = (financialData?.miscellaneous || []).reduce(
                    (acc: number, curr: any) => acc + Number(curr.custo_calculado || 0),
                    0
                  );
                  const custoTotal =
                    (animal.valor_compra || 0) +
                    custoNutricao +
                    custoSanidade +
                    custoReproducao +
                    custoDiversos;
                  const receita = animal.valor_venda || 0;
                  const lucro = receita - custoTotal;
                  const isLucro = lucro >= 0;
                  return (
                    <span
                      style={{
                        color: isLucro ? '#10b981' : '#ef4444',
                        fontSize: '18px',
                        fontWeight: 900,
                        textShadow: isLucro
                          ? '0 2px 10px rgba(16,185,129,0.3)'
                          : '0 2px 10px rgba(239,68,68,0.3)',
                      }}
                    >
                      {isLucro ? '+' : ''}
                      <AnimatedNumber value={lucro} isCurrency={true} />
                    </span>
                  );
                })()}
              </div>

              <div style={{ gridColumn: 'span 4' }}>
                <button
                  className="glass-btn secondary"
                  onClick={() => setIsExtratoModalOpen(true)}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <FileText size={16} /> Ver Detalhamento Completo
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: Dados e Timeline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: 'calc(380px + 300px)',
          }}
        >
          <section className="info-panel">
            <div className="panel-header">
              <h3>Dados Cadastrais</h3>
              <Tag size={18} />
            </div>
            <div className="info-list">
              <div className="info-item">
                <label>Data de Nascimento</label>
                <span>{new Date(animal.data_nascimento).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <label>Raça</label>
                <span>{animal.raca}</span>
              </div>
              <div className="info-item">
                <label>Origem</label>
                <span>{animal.origem || 'Própria'}</span>
              </div>
              <div className="info-item">
                <label>Pai (Brinco)</label>
                <span>{animal.pai_brinco || '-'}</span>
              </div>
              <div className="info-item">
                <label>Mãe (Brinco)</label>
                <span>{animal.mae_brinco || '-'}</span>
              </div>
            </div>
          </section>

          <section
            className="timeline-panel"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}
          >
            <div className="panel-header" style={{ flexShrink: 0 }}>
              <h3>Linha do Tempo (Manejos)</h3>
              <History size={18} />
            </div>
            <div
              className="timeline-list"
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '12px',
                margin: '16px 0 0 0',
                paddingBottom: '16px',
                maxHeight: 'none',
              }}
            >
              {events.length === 0 && (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'hsl(var(--text-muted))',
                    fontSize: '13px',
                  }}
                >
                  Nenhum evento registrado.
                </div>
              )}
              {events.map((event: any, i) => {
                const categoryColors: Record<string, string> = {
                  entrada: '#10b981',
                  weight: '#3b82f6',
                  sanidade: '#8b5cf6',
                  nutricao: '#f59e0b',
                  reproducao: '#ec4899',
                  lote: '#64748b',
                };
                const color = categoryColors[event.category || 'entrada'] || '#64748b';
                return (
                  <div key={i} className="timeline-event">
                    <div
                      className="event-dot"
                      style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                    />
                    <div className="event-content">
                      <div className="event-header">
                        <span
                          className="event-type"
                          style={{
                            background: `${color}20`,
                            color,
                            border: `1px solid ${color}40`,
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            fontWeight: 800,
                          }}
                        >
                          {event.type}
                        </span>
                        <span className="event-date">
                          {event.date ? new Date(event.date).toLocaleDateString('pt-BR') : '—'}
                        </span>
                      </div>
                      <p className="event-desc">{event.desc}</p>
                      {event.custo > 0 && (
                        <span
                          style={{
                            fontSize: '10px',
                            color,
                            fontWeight: 700,
                            marginTop: '2px',
                            display: 'inline-block',
                          }}
                        >
                          Custo:{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(event.custo)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
      <RastreabilidadeModal
        isOpen={showRastreabilidade}
        onClose={() => setShowRastreabilidade(false)}
        animal={animal}
        events={events}
      />
      <AnimalForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={animal}
        loading={isSubmitting}
      />
      <QuickManejoModal
        isOpen={isManejoModalOpen}
        onClose={() => setIsManejoModalOpen(false)}
        animal={animal}
        activeTenantId={activeTenantId || ''}
        activeFarmId={activeFarmId || ''}
        insertPayload={insertPayload}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['animal', id] });
          queryClient.invalidateQueries({ queryKey: ['animal_weights', id] });
          queryClient.invalidateQueries({ queryKey: ['animal_costs', id] });
        }}
      />
      <CostStatementModal
        isOpen={isExtratoModalOpen}
        onClose={() => setIsExtratoModalOpen(false)}
        animal={animal}
        financialData={financialData || null}
      />
    </div>
  );
};
