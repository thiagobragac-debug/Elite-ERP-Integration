import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Scale,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Utensils,
  Target,
  Beef,
  Activity,
  Zap,
  FileText,
  Calendar,
  AlertTriangle,
  Award,
  Info,
  ChevronDown,
  Layers,
  GitCompare,
  CheckCircle2,
  XCircle,
  Users,
  Wheat,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { SearchableSelect } from '../../../components/Forms/SearchableSelect';
import { usePersistentState } from '../../../hooks/usePersistentState';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NutritionSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  diets: any[];
  lotes?: any[]; // optional: enriched lot list from parent
}

// ─── Helpers & Constants ─────────────────────────────────────────────────────

const fmtBrl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtNum = (v: number, dec = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

/** Avalia CA e retorna badge textual + cor */
function avaliarCA(ca: number): { label: string; color: string; bg: string } {
  if (ca === 0) {return { label: '—', color: 'hsl(var(--text-muted))', bg: 'hsl(var(--bg-main))' };}
  if (ca <= 5)  {return { label: '✓ Excelente', color: '#15803d', bg: '#f0fdf4' };}
  if (ca <= 7)  {return { label: '⚠ Adequado', color: '#b45309', bg: '#fffbeb' };}
  if (ca <= 9)  {return { label: '⚑ Alto', color: '#b91c1c', bg: '#fef2f2' };}
  return           { label: '✕ Revisar Dieta', color: '#7c3aed', bg: '#f5f3ff' };
}

/** Label de base de arroba com tooltip */
const ARROBA_BASES = [
  { value: 'viva',   label: '@ Peso Vivo (15 kg/@)'   },
  { value: 'carcaca', label: '@ Carcaça (30 kg/@)'     },
];

// ─── Motor de Simulação ───────────────────────────────────────────────────────

function calcSimulation(params: {
  cabecas: number;
  pesoEntrada: number;
  diasTrato: number;
  gmd: number;
  percPV: number;
  preco: number;
  custoAquisicaoArroba: number;
  outrosCustosCabeca: number;
  costPerKg: number;
  percentualMS: number;
  arrobaBase: 'viva' | 'carcaca';
}) {
  const {
    cabecas, pesoEntrada, diasTrato, gmd, percPV,
    preco, custoAquisicaoArroba, outrosCustosCabeca,
    costPerKg, percentualMS, arrobaBase,
  } = params;

  // ─── Projeção de peso com GMD progressivo ──────────────────────────────
  // Usa o peso médio do período para consumo mais preciso
  const pesoFinal    = pesoEntrada + gmd * diasTrato;
  const pesoMedioPeriodo = (pesoEntrada + pesoFinal) / 2;

  // ─── Consumo (Matéria Natural) ─────────────────────────────────────────
  const consumoMNDia     = pesoMedioPeriodo * (percPV / 100);  // kg MN/cab/dia
  const consumoMSDia     = consumoMNDia * (percentualMS / 100); // kg MS/cab/dia
  const consumoMNLoteDia = consumoMNDia * cabecas;
  const consumoMSTotalCab = consumoMSDia * diasTrato;           // total MS no período

  // ─── Custos ───────────────────────────────────────────────────────────
  const custoDiarioCab  = consumoMNDia * costPerKg;
  const custoDiarioLote = custoDiarioCab * cabecas;
  const custoAlimCabPeriodo = custoDiarioCab * diasTrato;
  const custoAlimLotePeriodo = custoAlimCabPeriodo * cabecas;

  // ─── Zootecnia ────────────────────────────────────────────────────────
  const ganhoPesoCabPeriodo = gmd * diasTrato;           // kg ganho total
  const divisorArroba       = arrobaBase === 'viva' ? 15 : 30;
  const arrobasProduzidasCab = ganhoPesoCabPeriodo / divisorArroba;
  const arrobasProduzidasLote = arrobasProduzidasCab * cabecas;

  // ─── Conversão Alimentar (base MS — padrão técnico) ───────────────────
  const conversaoAlimentar = gmd > 0 ? consumoMSDia / gmd : 0;
  const caAvaliacao = avaliarCA(conversaoAlimentar);

  // ─── Custo por @ produzida ────────────────────────────────────────────
  const custoArrobaProduzida =
    arrobasProduzidasCab > 0 ? custoAlimCabPeriodo / arrobasProduzidasCab : 0;

  // ─── Margem de Alimentação (não é lucro líquido) ──────────────────────
  const receitaVendaArroba      = arrobasProduzidasCab * preco;
  const margemAlimentacaoCab    = receitaVendaArroba - custoAlimCabPeriodo;
  const margemAlimentacaoLote   = margemAlimentacaoCab * cabecas;

  // ─── Lucro Real (se custo de aquisição informado) ────────────────────
  const pesoEntradaArrobas    = pesoEntrada / divisorArroba;
  const custoCompraAnimal     = pesoEntradaArrobas * custoAquisicaoArroba;
  const totalCustosCab        = custoAlimCabPeriodo + custoCompraAnimal + outrosCustosCabeca;
  const receitaBrutaCab       = (pesoFinal / divisorArroba) * preco; // vende o animal inteiro na saída
  const lucroRealCab          = receitaBrutaCab - totalCustosCab;
  const lucroRealLote         = lucroRealCab * cabecas;
  const temLucroReal          = custoAquisicaoArroba > 0;

  return {
    pesoFinal, pesoMedioPeriodo,
    consumoMNDia, consumoMSDia, consumoMNLoteDia, consumoMSTotalCab,
    custoDiarioCab, custoDiarioLote, custoAlimCabPeriodo, custoAlimLotePeriodo,
    ganhoPesoCabPeriodo, arrobasProduzidasCab, arrobasProduzidasLote,
    conversaoAlimentar, caAvaliacao,
    custoArrobaProduzida,
    margemAlimentacaoCab, margemAlimentacaoLote,
    lucroRealCab, lucroRealLote, temLucroReal,
    divisorArroba,
  };
}

// ─── Componente de Tooltip ────────────────────────────────────────────────────

const InfoTip: React.FC<{ text: string }> = ({ text }) => (
  <span
    title={text}
    style={{
      marginLeft: '4px', cursor: 'help',
      color: 'hsl(var(--text-muted))', verticalAlign: 'middle',
      display: 'inline-flex', alignItems: 'center',
    }}
  >
    <Info size={12} />
  </span>
);

// ─── Componente de KPI ────────────────────────────────────────────────────────

const SimKPI: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color?: string;
  bg?: string;
  border?: string;
  size?: 'sm' | 'lg';
}> = ({ label, value, sub, color = 'hsl(var(--text-main))', bg = 'hsl(var(--bg-main))', border = 'hsl(var(--border))', size = 'sm' }) => (
  <div style={{ padding: '14px 16px', background: bg, border: `1px solid ${border}`, borderRadius: '12px' }}>
    <div style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
      {label}
    </div>
    <div style={{ fontSize: size === 'lg' ? '22px' : '16px', fontWeight: 900, color, lineHeight: 1.1 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px', fontWeight: 600 }}>{sub}</div>}
  </div>
);

// ─── Componente Principal ─────────────────────────────────────────────────────

export const NutritionSimulatorModal: React.FC<NutritionSimulatorModalProps> = ({
  isOpen, onClose, diets, lotes = [],
}) => {
  // ─── Parâmetros persistentes ──────────────────────────────────────────
  const [selectedDietId,   setSelectedDietId]   = usePersistentState('sim_dietId',    '');
  const [selectedDiet2Id,  setSelectedDiet2Id]  = usePersistentState('sim_diet2Id',   '');
  const [loteId,           setLoteId]           = usePersistentState('sim_loteId',    '');
  const [animalCount,      setAnimalCount]      = usePersistentState('sim_cabecas',   '100');
  const [pesoEntrada,      setPesoEntrada]      = usePersistentState('sim_peso',      '350');
  const [diasTrato,        setDiasTrato]        = usePersistentState('sim_dias',      '90');
  const [percPV,           setPercPV]           = usePersistentState('sim_percPV',    '2.5');
  const [gmd,              setGmd]              = usePersistentState('sim_gmd',       '1.5');
  const [preco,            setPreco]            = usePersistentState('sim_preco',     '240');
  const [custoAquis,       setCustoAquis]       = usePersistentState('sim_custoAq',   '');
  const [outrosCustos,     setOutrosCustos]     = usePersistentState('sim_outros',    '');
  const [arrobaBase,       setArrobaBase]       = usePersistentState<'viva'|'carcaca'>('sim_arroba', 'viva');
  const [modoComparacao,   setModoComparacao]   = usePersistentState('sim_compare',   false);
  const [exportando,       setExportando]       = useState(false);

  // ─── Dietas derivadas ─────────────────────────────────────────────────
  const diet1 = diets.find(d => String(d.id) === String(selectedDietId));
  const diet2 = diets.find(d => String(d.id) === String(selectedDiet2Id));

  const costPerKg1 = diet1 ? Number(diet1.custo_por_kg) || 0 : 0;
  const costPerKg2 = diet2 ? Number(diet2.custo_por_kg) || 0 : 0;
  const pms1 = diet1 ? Number(diet1.percentual_ms) || 88 : 88;
  const pms2 = diet2 ? Number(diet2.percentual_ms) || 88 : 88;

  const baseParams = {
    cabecas:             Number(animalCount) || 0,
    pesoEntrada:         Number(pesoEntrada) || 0,
    diasTrato:           Number(diasTrato)   || 0,
    gmd:                 Number(gmd)         || 0,
    percPV:              Number(percPV)      || 0,
    preco:               Number(preco)       || 0,
    custoAquisicaoArroba: Number(custoAquis) || 0,
    outrosCustosCabeca:  Number(outrosCustos)|| 0,
    arrobaBase,
  };

  // ─── Engine ───────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sim1 = useMemo(() => calcSimulation({ ...baseParams, costPerKg: costPerKg1, percentualMS: pms1 }), [JSON.stringify(baseParams), costPerKg1, pms1]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sim2 = useMemo(() => calcSimulation({ ...baseParams, costPerKg: costPerKg2, percentualMS: pms2 }), [JSON.stringify(baseParams), costPerKg2, pms2]);


  // ─── Preencher com lote real ──────────────────────────────────────────
  const handleSelectLote = (id: string) => {
    setLoteId(id);
    const lote = lotes.find((l: any) => String(l.id) === String(id));
    if (!lote) {return;}
    if (lote.num_animais) {setAnimalCount(String(lote.num_animais));}
    if (lote.peso_medio)  {setPesoEntrada(String(Math.round(lote.peso_medio)));}
  };

  // ─── Export PDF ───────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    if (!diet1) { toast.error('Selecione uma dieta antes de exportar.'); return; }
    setExportando(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const GREEN = [22, 163, 74] as [number, number, number];
      const NAVY  = [15, 23, 42]  as [number, number, number];
      const MUTED = [100, 116, 139] as [number, number, number];

      // ── Cabeçalho ────────────────────────────────────────────────────
      doc.setFillColor(...GREEN);
      doc.rect(0, 0, 210, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...NAVY);
      doc.text('TAUZE PECUÁRIA', 14, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text('Simulação Nutricional — Relatório Técnico', 14, 28);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 148, 22);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 33, 196, 33);

      // ── Parâmetros de Entrada ────────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...GREEN);
      doc.text('1. PARÂMETROS DA SIMULAÇÃO', 14, 42);

      autoTable(doc, {
        startY: 46,
        head: [['Parâmetro', 'Valor']],
        body: [
          ['Dieta Selecionada', diet1.nome],
          ['Custo da Dieta (R$/kg)', `R$ ${costPerKg1.toFixed(2)}`],
          ['Matéria Seca da Dieta', `${pms1}%`],
          ['Efetivo (Cabeças)', animalCount],
          ['Peso de Entrada Médio', `${pesoEntrada} kg`],
          ['Peso Final Projetado', `${fmtNum(sim1.pesoFinal, 1)} kg`],
          ['Peso Médio do Período', `${fmtNum(sim1.pesoMedioPeriodo, 1)} kg`],
          ['Janela de Simulação', `${diasTrato} dias`],
          ['Consumo (% PV)', `${percPV}%`],
          ['GMD Alvo', `${gmd} kg/dia`],
          ['Preço de Venda da @', `R$ ${preco}`],
          ['Base da Arroba', arrobaBase === 'viva' ? 'Peso Vivo (15 kg/@)' : 'Carcaça (30 kg/@)'],
        ],
        theme: 'striped',
        headStyles: { fillColor: GREEN, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { textColor: [...MUTED] as [number,number,number], fontStyle: 'bold' }, 1: { fontStyle: 'bold', textColor: [...NAVY] as [number,number,number] } },
        margin: { left: 14, right: 14 },
      });

      // ── Indicadores Zootécnicos ──────────────────────────────────────
      const finalY1 = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...GREEN);
      doc.text('2. INDICADORES ZOOTÉCNICOS', 14, finalY1);

      autoTable(doc, {
        startY: finalY1 + 4,
        head: [['Indicador', 'Por Cabeça', 'Lote Total']],
        body: [
          ['Consumo MN/dia', `${fmtNum(sim1.consumoMNDia, 1)} kg`, `${fmtNum(sim1.consumoMNLoteDia, 1)} kg`],
          ['Consumo MS/dia (corrigido)', `${fmtNum(sim1.consumoMSDia, 2)} kg MS`, '—'],
          ['Ganho de Peso no Período', `${fmtNum(sim1.ganhoPesoCabPeriodo, 1)} kg`, '—'],
          ['Arrobas Produzidas', `${fmtNum(sim1.arrobasProduzidasCab, 2)} @`, `${fmtNum(sim1.arrobasProduzidasLote, 1)} @`],
          [`Conversão Alimentar (MS)`, `${fmtNum(sim1.conversaoAlimentar, 2)} : 1`, sim1.caAvaliacao.label],
        ],
        theme: 'striped',
        headStyles: { fillColor: GREEN, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });

      // ── Resultados Financeiros ───────────────────────────────────────
      const finalY2 = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...GREEN);
      doc.text('3. RESULTADOS FINANCEIROS', 14, finalY2);

      autoTable(doc, {
        startY: finalY2 + 4,
        head: [['Indicador', 'Por Cabeça', 'Lote Total']],
        body: [
          ['Custo Alimentar/dia', fmtBrl(sim1.custoDiarioCab), fmtBrl(sim1.custoDiarioLote)],
          ['Custo Alimentar no Período', fmtBrl(sim1.custoAlimCabPeriodo), fmtBrl(sim1.custoAlimLotePeriodo)],
          ['Custo da @ Produzida', fmtBrl(sim1.custoArrobaProduzida), '—'],
          ['Margem de Alimentação', fmtBrl(sim1.margemAlimentacaoCab), fmtBrl(sim1.margemAlimentacaoLote)],
          ...(sim1.temLucroReal ? [
            ['Lucro Real Projetado', fmtBrl(sim1.lucroRealCab), fmtBrl(sim1.lucroRealLote)],
          ] : []),
        ],
        theme: 'striped',
        headStyles: { fillColor: GREEN, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });

      // ── Rodapé ────────────────────────────────────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text('Relatório gerado pelo Tauze ERP — Nutrição de Precisão. Este documento é uma projeção técnica e pode variar conforme as condições de campo.', 14, 288, { maxWidth: 182 });
      }

      doc.save(`simulacao-nutricional-${diet1.nome.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (err: any) {
      toast.error(`Erro ao gerar PDF: ${err.message}`);
    } finally {
      setExportando(false);
    }
  }, [diet1, sim1, animalCount, pesoEntrada, diasTrato, percPV, gmd, preco, arrobaBase, costPerKg1, pms1, custoAquis, outrosCustos]);

  // ─── Render ───────────────────────────────────────────────────────────
  const caEval1 = sim1.caAvaliacao;
  const caEval2 = sim2.caAvaliacao;

  const melhorDieta: 'dieta1' | 'dieta2' | null = modoComparacao && diet1 && diet2
    ? (sim1.margemAlimentacaoLote >= sim2.margemAlimentacaoLote ? 'dieta1' : 'dieta2')
    : null;

  return (
    <SidePanel
      size="xlarge"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); handleExportPDF(); }}
      title="Simulador Nutricional"
      subtitle="Projeção de consumo, custo e ganho de peso com cálculos corrigidos de MS"
      icon={Zap}
      submitLabel={exportando ? 'Gerando PDF...' : 'Exportar Relatório PDF'}
      iconSubmit={FileText}
      loading={exportando}
    >
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* ── Painel Esquerdo: Parâmetros ─────────────────────────────── */}
        <div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Seleção de Dieta(s) */}
          <div style={{ padding: '16px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Dieta(s)</span>
              <button
                type="button"
                onClick={() => setModoComparacao(!modoComparacao)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', border: '1px solid', borderColor: modoComparacao ? 'hsl(217 91% 50%)' : 'hsl(var(--border))', background: modoComparacao ? 'hsl(217 91% 50% / 0.1)' : 'transparent', color: modoComparacao ? 'hsl(217 91% 50%)' : 'hsl(var(--text-muted))', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                <GitCompare size={12} /> Comparar Dietas
              </button>
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label"><Layers size={13} /> {modoComparacao ? 'Dieta A' : 'Dieta'}</label>
              <SearchableSelect
                value={selectedDietId}
                onChange={setSelectedDietId}
                placeholder="Escolha uma formulação..."
                options={diets.filter(d => d.tipo !== 'MATERIA_PRIMA').map(d => ({
                  value: d.id,
                  label: `${d.nome} (R$ ${Number(d.custo_por_kg).toFixed(2)}/kg · ${Number(d.percentual_ms) || 88}% MS)`,
                }))}
              />
              {diet1 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'hsl(217 91% 50% / 0.1)', color: 'hsl(217 91% 50%)' }}>{diet1.tipo}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'hsl(161 64% 39% / 0.1)', color: 'hsl(161 64% 39%)' }}>R$ {costPerKg1.toFixed(2)}/kg</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'hsl(38 92% 50% / 0.1)', color: 'hsl(38 92% 40%)' }}>{pms1}% MS</span>
                </div>
              )}
            </div>

            {modoComparacao && (
              <div className="tauze-field-group">
                <label className="tauze-label"><Layers size={13} /> Dieta B</label>
                <SearchableSelect
                  value={selectedDiet2Id}
                  onChange={setSelectedDiet2Id}
                  placeholder="Escolha para comparar..."
                  options={diets.filter(d => d.tipo !== 'MATERIA_PRIMA').map(d => ({
                    value: d.id,
                    label: `${d.nome} (R$ ${Number(d.custo_por_kg).toFixed(2)}/kg · ${Number(d.percentual_ms) || 88}% MS)`,
                  }))}
                />
                {diet2 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'hsl(217 91% 50% / 0.1)', color: 'hsl(217 91% 50%)' }}>{diet2.tipo}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'hsl(161 64% 39% / 0.1)', color: 'hsl(161 64% 39%)' }}>R$ {costPerKg2.toFixed(2)}/kg</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'hsl(38 92% 50% / 0.1)', color: 'hsl(38 92% 40%)' }}>{pms2}% MS</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lote Real (opcional) */}
          {lotes.length > 0 && (
            <div style={{ padding: '14px 16px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                <Users size={12} style={{ display: 'inline', marginRight: 5 }} />Simular com Lote Real
              </span>
              <SearchableSelect
                value={loteId}
                onChange={handleSelectLote}
                placeholder="Selecione um lote (preenche campos automaticamente)..."
                options={lotes.map((l: any) => ({ value: l.id, label: `${l.nome} — ${l.num_animais ?? '?'} cab · ${l.peso_medio ? `${Math.round(l.peso_medio)  } kg médio` : 'sem pesagem'}` }))}
              />
            </div>
          )}

          {/* Parâmetros do Lote */}
          <div style={{ padding: '16px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Parâmetros do Lote</span>
            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group">
                <label className="tauze-label"><Beef size={13} /> Cabeças</label>
                <input type="number" min="1" className="tauze-input" value={animalCount} onChange={e => setAnimalCount(e.target.value)} />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Scale size={13} /> Peso Entrada (kg)
                  <InfoTip text="Peso médio de entrada do lote. O simulador calcula o consumo sobre o peso médio do período (entrada + saída) / 2 — metodologia correta para projeções." />
                </label>
                <input type="number" min="0" className="tauze-input" value={pesoEntrada} onChange={e => setPesoEntrada(e.target.value)} />
              </div>
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label"><Calendar size={13} /> Dias de Trato (janela)</label>
              <input type="number" min="1" className="tauze-input" value={diasTrato} onChange={e => setDiasTrato(e.target.value)} />
            </div>
          </div>

          {/* Metas Zootécnicas */}
          <div style={{ padding: '16px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Metas Zootécnicas & Econômicas</span>
            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Utensils size={13} /> Consumo (% PV)
                  <InfoTip text="Percentual do Peso Vivo consumido diariamente em Matéria Natural. Bovinos em confinamento: 2,0–3,0% PV. Zebuínos tendem ao limite inferior." />
                </label>
                <input type="number" step="0.1" className="tauze-input" value={percPV} onChange={e => setPercPV(e.target.value)} />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <TrendingUp size={13} /> GMD Alvo (kg/dia)
                  <InfoTip text="Ganho Médio Diário esperado. Confinamento padrão: 1,2–1,8 kg/dia. Touros de raça taurina podem atingir 2,0+ kg/dia com dietas de alto grão." />
                </label>
                <input type="number" step="0.1" className="tauze-input" value={gmd} onChange={e => setGmd(e.target.value)} />
              </div>
            </div>
            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <DollarSign size={13} /> Venda da @ (R$)
                </label>
                <input type="number" step="1" className="tauze-input" value={preco} onChange={e => setPreco(e.target.value)} />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Award size={13} /> Base da @
                  <InfoTip text="Arroba viva (15 kg) = padrão de mercado para cálculo de arrobas produzidas. Arroba carcaça (30 kg) é usada em negociações frigorífico-produtor." />
                </label>
                <select className="tauze-input" value={arrobaBase} onChange={e => setArrobaBase(e.target.value as 'viva' | 'carcaca')} style={{ cursor: 'pointer' }}>
                  {ARROBA_BASES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Custos Opcionais (Lucro Real) */}
          <div style={{ padding: '16px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Custo de Aquisição</span>
              <span style={{ marginLeft: '6px', fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>(opcional — para calcular lucro real)</span>
            </div>
            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <DollarSign size={13} /> Compra do animal (R$/@)
                  <InfoTip text="Preço pago na compra do animal em R$ por arroba. Se informado, o simulador calculará o Lucro Real além da Margem de Alimentação." />
                </label>
                <input type="number" step="1" className="tauze-input" placeholder="Ex: 220 — deixe vazio para omitir" value={custoAquis} onChange={e => setCustoAquis(e.target.value)} />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Activity size={13} /> Outros custos (R$/cab)
                  <InfoTip text="Custo fixo por cabeça no período: sanidade, frete, rastreabilidade, etc. Soma ao custo de aquisição no cálculo de Lucro Real." />
                </label>
                <input type="number" step="1" className="tauze-input" placeholder="Ex: 150 — deixe vazio para omitir" value={outrosCustos} onChange={e => setOutrosCustos(e.target.value)} />
              </div>
            </div>
          </div>

        </div>

        {/* ── Painel Direito: Resultados (fixo, sempre visível) ──────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: 0 }}>

          {/* Header de resultados */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Resultados em Tempo Real
            </span>
            {!diet1 && (
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                Selecione uma dieta →
              </span>
            )}
          </div>

          {/* Peso projetado */}
          <div style={{ padding: '12px 14px', background: 'hsl(217 91% 50% / 0.08)', border: '1px solid hsl(217 91% 50% / 0.2)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: 'hsl(217 91% 50%)', fontWeight: 700 }}>
              📈 Peso Projetado na Saída
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'hsl(217 91% 50%)' }}>
              {fmtNum(sim1.pesoFinal, 1)} kg
            </div>
            <div style={{ fontSize: '10px', color: 'hsl(217 91% 50% / 0.7)', fontWeight: 600 }}>
              Peso médio do período: {fmtNum(sim1.pesoMedioPeriodo, 1)} kg
            </div>
          </div>

          {/* Layout: 1 dieta ou 2 dietas em comparação */}
          {!modoComparacao ? (
            <>
              {/* ── Consumo ─────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <SimKPI label="Consumo MN / cab / dia" value={`${fmtNum(sim1.consumoMNDia, 1)} kg`} sub={`${fmtNum(sim1.consumoMSDia, 2)} kg MS corrigido`} />
                <SimKPI label="Consumo Total do Lote / dia" value={`${fmtNum(sim1.consumoMNLoteDia, 1)} kg`} />
              </div>

              {/* ── Custo ─────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <SimKPI label="Custo Alimentar / cab / dia" value={fmtBrl(sim1.custoDiarioCab)} />
                <SimKPI label="Custo Alimentar Total / dia" value={fmtBrl(sim1.custoDiarioLote)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <SimKPI label={`Custo Alimentar em ${diasTrato} dias`} value={fmtBrl(sim1.custoAlimLotePeriodo)} sub={`${fmtBrl(sim1.custoAlimCabPeriodo)}/cab`} />
                <div style={{ padding: '14px 16px', background: caEval1.bg, border: `1px solid ${caEval1.color}40`, borderRadius: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Conversão Alimentar (MS)
                    <InfoTip text="Calculado sobre a Matéria Seca, que é o padrão técnico correto. CA = kg MS consumido / kg de ganho de peso." />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: caEval1.color }}>
                    {fmtNum(sim1.conversaoAlimentar, 2)} : 1
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: caEval1.color, marginTop: '4px' }}>
                    {caEval1.label}
                  </div>
                </div>
              </div>

              {/* ── Zootecnia ─────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <SimKPI label="Ganho de Peso / cab" value={`+${fmtNum(sim1.ganhoPesoCabPeriodo, 1)} kg`} sub={`em ${diasTrato} dias`} color="hsl(217 91% 50%)" />
                <SimKPI label={`Arrobas produzidas / cab (${arrobaBase === 'viva' ? '15 kg/@' : '30 kg/@'})`} value={`${fmtNum(sim1.arrobasProduzidasCab, 2)} @`} sub={`${fmtNum(sim1.arrobasProduzidasLote, 1)} @ no lote`} color="hsl(38 92% 40%)" bg="hsl(38 92% 50% / 0.08)" border="hsl(38 92% 50% / 0.25)" />
              </div>

              {/* ── Custo @ produzida ─────────────────── */}
              <SimKPI label="Custo da @ Produzida (alimentação)" value={fmtBrl(sim1.custoArrobaProduzida)} sub="Custo de alimentação ÷ arrobas ganhas no período" color="hsl(38 92% 40%)" bg="hsl(38 92% 50% / 0.08)" border="hsl(38 92% 50% / 0.25)" size="lg" />

              {/* ── Margem / Lucro ─────────────────────── */}
              <div style={{ padding: '16px', background: sim1.margemAlimentacaoLote >= 0 ? 'hsl(161 64% 39% / 0.08)' : 'hsl(0 84% 60% / 0.08)', border: `1px solid ${sim1.margemAlimentacaoLote >= 0 ? 'hsl(161 64% 39% / 0.3)' : 'hsl(0 84% 60% / 0.3)'}`, borderRadius: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Margem de Alimentação
                  <InfoTip text="Receita de venda das arrobas ganhas minus o custo de alimentação. NÃO inclui o custo de aquisição do animal. Para lucro real, informe o custo de aquisição no painel esquerdo." />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: sim1.margemAlimentacaoLote >= 0 ? 'hsl(161 64% 35%)' : 'hsl(0 84% 45%)' }}>
                      {fmtBrl(sim1.margemAlimentacaoLote)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '3px' }}>
                      {fmtBrl(sim1.margemAlimentacaoCab)} / cabeça · ao final de {diasTrato} dias
                    </div>
                  </div>
                  {sim1.margemAlimentacaoLote >= 0 ? <CheckCircle2 size={28} color="hsl(161 64% 39%)" /> : <XCircle size={28} color="hsl(0 84% 55%)" />}
                </div>
              </div>

              {/* ── Lucro Real (se custo de aquisição informado) ── */}
              {sim1.temLucroReal && (
                <div style={{ padding: '16px', background: sim1.lucroRealLote >= 0 ? 'hsl(217 91% 50% / 0.08)' : 'hsl(0 84% 60% / 0.08)', border: `1.5px solid ${sim1.lucroRealLote >= 0 ? 'hsl(217 91% 50% / 0.4)' : 'hsl(0 84% 60% / 0.4)'}`, borderRadius: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Lucro Real Projetado (inclui compra + outros custos)
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: sim1.lucroRealLote >= 0 ? 'hsl(217 91% 50%)' : 'hsl(0 84% 50%)' }}>
                    {fmtBrl(sim1.lucroRealLote)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '3px' }}>
                    {fmtBrl(sim1.lucroRealCab)} / cabeça · receita na venda do animal completo
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── Modo Comparação ──────────────────────── */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {([
                { label: diet1?.nome || 'Dieta A', sim: sim1, cost: costPerKg1, ms: pms1, id: 'dieta1', caEval: caEval1 },
                { label: diet2?.nome || 'Dieta B', sim: sim2, cost: costPerKg2, ms: pms2, id: 'dieta2', caEval: caEval2 },
              ] as const).map(col => (
                <div
                  key={col.id}
                  style={{
                    padding: '16px', borderRadius: '14px',
                    border: `2px solid ${melhorDieta === col.id ? 'hsl(161 64% 39%)' : 'hsl(var(--border))'}`,
                    background: melhorDieta === col.id ? 'hsl(161 64% 39% / 0.06)' : 'hsl(var(--bg-card))',
                    display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative',
                  }}
                >
                  {melhorDieta === col.id && (
                    <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: 'hsl(161 64% 39%)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                      ✓ MELHOR OPÇÃO
                    </div>
                  )}
                  <div style={{ fontSize: '13px', fontWeight: 800, textAlign: 'center', color: 'hsl(var(--text-main))' }}>{col.label}</div>
                  <div style={{ fontSize: '10px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                    R$ {col.cost.toFixed(2)}/kg · {col.ms}% MS
                  </div>
                  {[
                    { l: 'Consumo MN/dia/cab', v: `${fmtNum(col.sim.consumoMNDia, 1)} kg` },
                    { l: 'Consumo MS/dia/cab', v: `${fmtNum(col.sim.consumoMSDia, 2)} kg MS` },
                    { l: 'Custo Alim./dia/lote', v: fmtBrl(col.sim.custoDiarioLote) },
                    { l: `Custo ${diasTrato}d/lote`, v: fmtBrl(col.sim.custoAlimLotePeriodo) },
                    { l: 'Custo @ produzida', v: fmtBrl(col.sim.custoArrobaProduzida) },
                    { l: 'CA (MS)', v: `${fmtNum(col.sim.conversaoAlimentar, 2)} : 1` },
                  ].map(row => (
                    <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '6px' }}>
                      <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 600 }}>{row.l}</span>
                      <span style={{ fontWeight: 900, color: 'hsl(var(--text-main))' }}>{row.v}</span>
                    </div>
                  ))}
                  <div style={{ padding: '10px', background: col.sim.margemAlimentacaoLote >= 0 ? 'hsl(161 64% 39% / 0.08)' : 'hsl(0 84% 60% / 0.08)', borderRadius: '8px', textAlign: 'center', border: `1px solid ${col.sim.margemAlimentacaoLote >= 0 ? 'hsl(161 64% 39% / 0.3)' : 'hsl(0 84% 60% / 0.3)'}` }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '4px' }}>Margem de Alimentação</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: col.sim.margemAlimentacaoLote >= 0 ? 'hsl(161 64% 35%)' : 'hsl(0 84% 50%)' }}>
                      {fmtBrl(col.sim.margemAlimentacaoLote)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nota de rodapé técnica */}
          <div style={{ padding: '10px 12px', background: 'hsl(var(--bg-main))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
            <p style={{ margin: 0, fontSize: '10px', color: 'hsl(var(--text-muted))', lineHeight: '1.5', fontWeight: 600 }}>
              ⚠ Este simulador usa <strong>peso médio do período</strong> para o consumo, <strong>CA corrigida por MS</strong> ({pms1}% MS), e <strong>Margem de Alimentação</strong> (não Lucro Líquido). Resultados são projeções técnicas sujeitas às condições de campo.
            </p>
          </div>

        </div>
      </div>
    </SidePanel>
  );
};
