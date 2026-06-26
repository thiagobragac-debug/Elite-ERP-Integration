import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Eye,
  FileText,
  Truck,
  TrendingUp,
  Activity,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Download,
  Navigation,
  Flag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

import { useFarmFilter } from '../../hooks/useFarmFilter';
import { usePersistentState } from '../../hooks/usePersistentState';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { RomaneioEmbarqueModal } from '../../components/Modals/RomaneioEmbarqueModal';
import { RomaneioFilterModal } from './components/RomaneioFilterModal';
import { RomaneioDetailsModal } from './components/RomaneioDetailsModal';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { useConfirm } from '../../contexts/ConfirmContext';

const getStatusColor = (status: string) => {
  if (status === 'Pendente') return { bg: 'hsl(38 92% 50% / 0.1)', text: 'hsl(38 92% 50%)' };
  if (status === 'Em Trânsito') return { bg: 'hsl(217 91% 60% / 0.1)', text: 'hsl(217 91% 60%)' };
  if (status === 'Concluído') return { bg: 'hsl(142 71% 45% / 0.1)', text: 'hsl(142 71% 45%)' };
  if (status === 'Cancelado') return { bg: 'hsl(348 83% 47% / 0.1)', text: 'hsl(348 83% 47%)' };
  return { bg: 'hsl(var(--text-muted) / 0.1)', text: 'hsl(var(--text-muted))' };
};

// Dead code below kept for backwards compat — replaced by getStatusColor above
const _getStatusColor = (status: string) => {
  switch (status) {
    case 'Concluído':
      return { bg: 'hsl(142 71% 45% / 0.1)', text: 'hsl(142 71% 45%)' };
    case 'Em Trânsito':
      return { bg: 'hsl(217 91% 60% / 0.1)', text: 'hsl(217 91% 60%)' };
    case 'Pendente':
      return { bg: 'hsl(38 92% 50% / 0.1)', text: 'hsl(38 92% 50%)' };
    case 'Cancelado':
      return { bg: 'hsl(348 83% 47% / 0.1)', text: 'hsl(348 83% 47%)' };
    default:
      return { bg: 'hsl(var(--text-muted) / 0.1)', text: 'hsl(var(--text-muted))' };
  }
};

export default function RomaneioManagement() {
  const { confirm } = useConfirm();
  const { activeFarm, activeFarmId, activeTenantId, applyFarmFilter } = useFarmFilter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = usePersistentState('RomaneioManagement_searchTerm', '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = usePersistentState<
    'TODOS' | 'Concluído' | 'Em Trânsito' | 'Pendente'
  >('RomaneioManagement_activeTab', 'TODOS');

  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'RomaneioManagement_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = usePersistentState('RomaneioManagement_filterValues', {
    status: 'all',
    dateStart: '',
    dateEnd: '',
    minAnimais: '',
    maxAnimais: '',
    minValor: '',
    maxValor: '',
  });

  const [selectedRomaneio, setSelectedRomaneio] = usePersistentState<any>(
    'RomaneioManagement_selectedRomaneio',
    null
  );
  const [showDetailsModal, setShowDetailsModal] = usePersistentState(
    'RomaneioManagement_showDetailsModal',
    false
  );

  // Fetch romaneios from database
  const { data: romaneiosList = [], isLoading: loading } = useQuery({
    queryKey: ['romaneios_list', activeFarmId, activeTenantId],
    queryFn: async () => {
      if (!activeFarmId || !activeTenantId) {
        return [];
      }
      let query = supabase.from('romaneios').select('*').order('data', { ascending: false });

      query = applyFarmFilter(query);
      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return data || [];
    },
    enabled: !!activeFarmId && !!activeTenantId,
  });

  // Calculate dynamic stats for KPIs
  const stats = useMemo(() => {
    const totalCount = romaneiosList.length;
    const totalAnimals = romaneiosList.reduce((sum, r) => sum + Number(r.animais_qtd || 0), 0);
    const totalValue = romaneiosList.reduce((sum, r) => sum + Number(r.valor_estimado || 0), 0);
    const pendentesCount = romaneiosList.filter((r) => r.status === 'Pendente').length;

    return {
      totalCount,
      totalAnimals,
      totalValue,
      pendentesCount,
    };
  }, [romaneiosList]);

  const handleShowDetails = (row: any) => {
    setSelectedRomaneio(row);
    setShowDetailsModal(true);
  };

  const handleDownloadPDF = (row: any) => {
    toast.loading(`Gerando documento oficial do Romaneio ${row.codigo || row.id}...`, {
      id: 'pdf-gen',
    });
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // ─── CABEÇALHO DO DOCUMENTO ─────────────────────────────────────────
        doc.setFillColor(16, 185, 129); // #10b981
        doc.rect(0, 0, 210, 8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42); // Navy
        doc.text('TAUZE PECUÁRIA', 14, 24);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('TECNOLOGIA E GESTÃO AGROPECUÁRIA PREMIUM', 14, 29);
        doc.text('CNPJ: 00.000.000/0001-00 | INSCRIÇÃO ESTADUAL: 000.000.000', 14, 33);

        // Caixa de Metadados do Romaneio (Lado Direito)
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(120, 15, 76, 20, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`ROMANEIO Nº ${row.codigo || row.id}`, 125, 21);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Data: ${row.data}`, 125, 26);
        doc.text(`Status: ${row.status.toUpperCase()}`, 125, 31);

        // Linha divisória
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 38, 196, 38);

        // TÍTULO CENTRAL DO DOCUMENTO
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text('DOCUMENTO DE ROMANEIO & EMBARQUE DE ANIMAIS', 14, 46);

        // ─── DADOS DO EMITENTE E DESTINATÁRIO (COMPRADOR) ────────────────────
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.text('1. DADOS DOS ENVOLVIDOS', 14, 55);
        doc.line(14, 57, 196, 57);

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Fazenda Origem:', 14, 63);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(activeFarm?.name || 'Fazenda Modelo Tauze', 42, 63);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Comprador:', 14, 68);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(row.comprador, 42, 68);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Local de Destino:', 14, 73);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(row.destino, 42, 73);

        // ─── DADOS DE TRANSPORTE ─────────────────────────────────────────────
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.text('2. INFORMAÇÕES DE TRANSPORTE', 14, 83);
        doc.line(14, 85, 196, 85);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Motorista:', 14, 91);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(row.motorista || '-', 35, 91);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Placa Veículo:', 110, 91);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(row.placa || '-', 135, 91);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('GTA / NF-e:', 14, 96);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(row.nfe || '-', 35, 96);

        // ─── COMPOSIÇÃO DA CARGA (TABELA) ────────────────────────────────────
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.text('3. COMPOSIÇÃO E DADOS DA CARGA', 14, 106);

        autoTable(doc, {
          head: [
            [
              'Lote/Categoria',
              'Raça',
              'Qtd de Animais',
              'Peso Médio Est.',
              'Valor Est. Unitário',
              'Valor Total Lote',
            ],
          ],
          body: [
            [
              'Lote Confinamento A - Boi Gordo',
              'Nelore',
              `${row.animais_qtd} cbç`,
              '520 kg',
              `R$ ${(row.valor_estimado / (row.animais_qtd || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              `R$ ${Number(row.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ],
          ],
          startY: 110,
          theme: 'striped',
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left',
          },
          styles: {
            fontSize: 8.5,
            cellPadding: 4,
          },
          columnStyles: {
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' },
          },
        });

        // Totais Gerais
        const finalY = (doc as any).lastAutoTable.finalY + 8;
        doc.setFillColor(248, 250, 252);
        doc.rect(14, finalY, 182, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text('RESUMO GERAL:', 18, finalY + 8);
        doc.text(`TOTAL ANIMAIS: ${row.animais_qtd} cbç`, 70, finalY + 8);
        doc.text(
          `VALOR TOTAL ESTIMADO: R$ ${Number(row.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          120,
          finalY + 8
        );

        // ─── ASSINATURAS E RESPONSABILIDADES ─────────────────────────────────
        const signatureY = finalY + 35;
        doc.line(14, signatureY, 64, signatureY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Responsável Fazenda (Emitente)', 14, signatureY + 4);

        doc.line(80, signatureY, 130, signatureY);
        doc.text('Motorista (Transportador)', 80, signatureY + 4);

        doc.line(146, signatureY, 196, signatureY);
        doc.text('Recebedor (Comprador)', 146, signatureY + 4);

        // Rodapé com numeração
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Documento eletrônico gerado pelo Tauze ERP - Página ${i} de ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }

        doc.save(`romaneio_${row.codigo || row.id}_oficial.pdf`);
        toast.success(`PDF Oficial do Romaneio ${row.codigo || row.id} baixado com sucesso!`, {
          id: 'pdf-gen',
        });
      } catch (err: any) {
        console.error(err);
        toast.error(`Erro ao gerar documento PDF: ${err.message}`, { id: 'pdf-gen' });
      }
    }, 800);
  };

  // ── Status Transitions ───────────────────────────────────────────────────
  const transitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('romaneios')
        .update({ status: 'Em Trânsito' })
        .eq('id', id);
      if (error) throw error;
      // Animals stay as EM_EMBARQUE during transit — they're physically in the truck
      const { error: animalError } = await supabase
        .from('animais')
        .update({ status: 'EM_TRANSITO' })
        .eq('romaneio_id', id);
      if (animalError) throw animalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios_list'] });
      queryClient.invalidateQueries({ queryKey: ['animais'] });
      toast.success('Romaneio confirmado como Em Trânsito. Animais marcados como EM_TRANSITO.');
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const concludeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('romaneios')
        .update({ status: 'Concluído', data_chegada: new Date().toISOString().split('T')[0] })
        .eq('id', id);
      if (error) throw error;
      // On conclusion: animals → Abatido (arrived at slaughterhouse)
      const { error: animalError } = await supabase
        .from('animais')
        .update({ status: 'Abatido' })
        .eq('romaneio_id', id);
      if (animalError) throw animalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios_list'] });
      queryClient.invalidateQueries({ queryKey: ['animais'] });
      toast.success('Romaneio concluído! Animais registrados como Abatidos.');
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const handleConfirmTransit = async (row: any) => {
    const ok = await confirm({
      title: 'Confirmar Em Trânsito',
      description: `Confirma que o Romaneio ${row.codigo || row.id} saiu da fazenda? Os animais serão marcados como EM_TRANSITO.`,
      confirmText: 'Confirmar Saída',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (ok) transitMutation.mutate(row.id);
  };

  const handleConclude = async (row: any) => {
    const ok = await confirm({
      title: 'Confirmar Chegada e Concluir',
      description: `Confirma a chegada do Romaneio ${row.codigo || row.id} ao destino? Os animais serão marcados como Abatidos.`,
      confirmText: 'Confirmar Chegada',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (ok) concludeMutation.mutate(row.id);
  };

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('romaneios')
        .update({ status: 'Cancelado' })
        .eq('id', id);
      if (error) {
        throw error;
      }

      // Update linked animals to reset their status to active and romaneio_id to null
      const { error: animalError } = await supabase
        .from('animais')
        .update({ status: 'ATIVO', romaneio_id: null })
        .eq('romaneio_id', id);
      if (animalError) {
        throw animalError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios_list'] });
      toast.success('Romaneio cancelado com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`Erro ao cancelar romaneio: ${err.message}`);
    },
  });

  const handleCancelRomaneio = async (row: any) => {
    if (row.status === 'Cancelado') {
      toast.error('Este romaneio já está cancelado.');
      return;
    }
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: `Deseja realmente cancelar o Romaneio ${row.codigo || row.id}?`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      cancelMutation.mutate(row.id);
    }
  };

  const columns = [
    {
      header: 'ID Romaneio',
      accessor: (row: any) => (
        <strong style={{ color: 'hsl(var(--text-main))' }}>{row.codigo || row.id}</strong>
      ),
    },
    { header: 'Data', accessor: 'data' },
    {
      header: 'Comprador',
      accessor: (row: any) => <span style={{ fontWeight: 600 }}>{row.comprador}</span>,
    },
    {
      header: 'Destino',
      accessor: (row: any) => (
        <span style={{ color: 'hsl(var(--text-muted))' }}>{row.destino}</span>
      ),
    },
    {
      header: 'Transporte',
      accessor: (row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>{row.placa || '-'}</span>
          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
            {row.motorista || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Animais',
      accessor: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              padding: '2px 8px',
              background: 'hsl(var(--brand)/0.1)',
              color: 'hsl(var(--brand))',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            {row.animais_qtd} cbç
          </div>
        </div>
      ),
    },
    {
      header: 'Valor Est.',
      accessor: (row: any) => (
        <span style={{ fontWeight: 700, color: 'hsl(142 71% 45%)' }}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            row.valor_estimado
          )}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: any) => {
        const colors = getStatusColor(row.status);
        return (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: '12px',
              background: colors.bg,
              color: colors.text,
              fontSize: '12px',
              fontWeight: 800,
              gap: '4px',
            }}
          >
            {row.status === 'Concluído' && <CheckCircle2 size={12} />}
            {row.status === 'Em Trânsito' && <Truck size={12} />}
            {row.status === 'Pendente' && <Activity size={12} />}
            {row.status === 'Cancelado' && <XCircle size={12} />}
            {row.status}
          </div>
        );
      },
    },
    {
      header: 'GTA / NF-e',
      accessor: (row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {row.gta_numero && (
            <span className="main-text" style={{ fontSize: '12px', fontWeight: 700 }}>
              GTA: {row.gta_numero}
            </span>
          )}
          {row.nfe && (
            <span className="sub-meta" style={{ fontFamily: 'monospace' }}>{row.nfe}</span>
          )}
          {!row.gta_numero && !row.nfe && (
            <span style={{ color: 'hsl(var(--text-muted))' }}>—</span>
          )}
        </div>
      ),
    },
    {
      header: 'Ações',
      accessor: (row: any) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleShowDetails(row)}
            className="action-dot info"
            title="Visualizar Detalhes"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => handleDownloadPDF(row)}
            className="action-dot"
            title="Baixar PDF"
            style={{ background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))' }}
          >
            <FileText size={14} />
          </button>
          {row.status === 'Pendente' && (
            <button
              onClick={() => handleConfirmTransit(row)}
              className="action-dot"
              title="Confirmar Saída / Em Trânsito"
              style={{ background: 'hsl(217 91% 60% / 0.1)', color: 'hsl(217 91% 60%)' }}
            >
              <Navigation size={14} />
            </button>
          )}
          {row.status === 'Em Trânsito' && (
            <button
              onClick={() => handleConclude(row)}
              className="action-dot"
              title="Confirmar Chegada e Concluir"
              style={{ background: 'hsl(142 71% 45% / 0.1)', color: 'hsl(142 71% 45%)' }}
            >
              <Flag size={14} />
            </button>
          )}
          {row.status !== 'Cancelado' && row.status !== 'Concluído' && (
            <button
              onClick={() => handleCancelRomaneio(row)}
              className="action-dot delete"
              title="Cancelar Romaneio"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filteredData = romaneiosList.filter((r) => {
    const matchesSearch =
      (r.codigo || r.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comprador.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'TODOS' || r.status === activeTab;

    // Advanced Filters
    const matchesStatus = filterValues.status === 'all' || r.status === filterValues.status;
    const matchesDate =
      (!filterValues.dateStart || r.data >= filterValues.dateStart) &&
      (!filterValues.dateEnd || r.data <= filterValues.dateEnd);
    const matchesMinAnimais =
      !filterValues.minAnimais || r.animais_qtd >= parseInt(filterValues.minAnimais);
    const matchesMaxAnimais =
      !filterValues.maxAnimais || r.animais_qtd <= parseInt(filterValues.maxAnimais);
    const matchesMinValor =
      !filterValues.minValor || r.valor_estimado >= parseFloat(filterValues.minValor);
    const matchesMaxValor =
      !filterValues.maxValor || r.valor_estimado <= parseFloat(filterValues.maxValor);

    return (
      matchesSearch &&
      matchesTab &&
      matchesStatus &&
      matchesDate &&
      matchesMinAnimais &&
      matchesMaxAnimais &&
      matchesMinValor &&
      matchesMaxValor
    );
  });

  return (
    <div className="romaneio-mgmt-page animate-slide-up">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Pecuária', href: '/pecuaria/dashboard' },
              { label: 'Embarques & Romaneios' },
            ]}
          />
          <h1 className="page-title">Embarques & Romaneios</h1>
          <p className="page-subtitle">
            Monitore, crie e emita documentos logísticos para o transporte de animais da{' '}
            {activeFarm?.name || 'sua fazenda'}.
          </p>
        </div>

        <div className="page-actions">
          <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
            <Truck size={16} />
            Novo Embarque
          </button>
        </div>
      </header>

      {/* ─── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
          : (
            <>
              <TauzeStatCard
                label="Total de Embarques"
                value={stats.totalCount.toString()}
                subtitle="Romaneios gerados no total"
                icon={Truck}
                color="#3b82f6"
              />
              <TauzeStatCard
                label="Animais Despachados"
                value={`${stats.totalAnimals} cbç`}
                subtitle="Soma de todos os lotes"
                icon={Activity}
                color="hsl(var(--brand))"
              />
              <TauzeStatCard
                label="Custo Estimado (Frete)"
                value={new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                }).format(stats.totalValue)}
                subtitle="Faturamento estimado de vendas"
                icon={TrendingUp}
                color="#10b981"
              />
              <TauzeStatCard
                label="Aproveitamento Lotes"
                value={stats.pendentesCount.toString()}
                subtitle="Aguardando liberação / NF-e"
                icon={Calendar}
                color="#f59e0b"
              />
            </>
          )
        }
      </div>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${activeTab === 'TODOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('TODOS')}
          >
            Todos Romaneios
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'Concluído' ? 'active' : ''}`}
            onClick={() => setActiveTab('Concluído')}
          >
            Concluídos
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'Em Trânsito' ? 'active' : ''}`}
            onClick={() => setActiveTab('Em Trânsito')}
          >
            Em Trânsito
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'Pendente' ? 'active' : ''}`}
            onClick={() => setActiveTab('Pendente')}
          >
            Pendentes
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Buscar romaneio por ID ou Comprador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
          <button
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(true)}
          >
            <Filter size={20} />
          </button>

          <div className="export-dropdown-container">
            <button
              className="icon-btn-secondary"
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-romaneios');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-romaneios" className="export-menu">
              <button onClick={() => exportToCSV(filteredData, 'romaneios')}>Excel (.CSV)</button>
              <button onClick={() => exportToExcel(filteredData, 'romaneios')}>
                Excel (.xlsx)
              </button>
              <button
                onClick={() =>
                  exportToPDF(
                    filteredData.map((r) => ({
                      'ID Romaneio': r.codigo || r.id,
                      Data: r.data,
                      Comprador: r.comprador,
                      Destino: r.destino,
                      Animais: `${r.animais_qtd} cbç`,
                      'Valor Est.': `R$ ${Number(r.valor_estimado).toLocaleString('pt-BR')}`,
                      Status: r.status,
                    })),
                    'romaneios',
                    'Relatório de Embarques & Romaneios'
                  )
                }
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="management-content">
        <ModernTable
          columns={columns}
          data={filteredData}
          loading={loading}
          hideHeader={true}
          totalCount={filteredData.length}
          currentPage={1}
          onPageChange={() => {}}
          itemsPerPage={12}
          emptyState={
            <EmptyState
              icon={Truck}
              title="Nenhum romaneio encontrado"
              description="Não encontramos resultados para a sua busca ou não há embarques registrados."
              actionLabel="Criar Novo Embarque"
              onAction={() => setIsModalOpen(true)}
            />
          }
        />
      </div>

      {/* ─── Modals ────────────────────────────────────────────────────────── */}
      <RomaneioEmbarqueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGerarNF={(romaneioData) => {
          setIsModalOpen(false);
          toast.success(
            `✅ Romaneio de Embarque criado para ${romaneioData.comprador || 'Comprador'}! Nota Fiscal de Saída emitida com sucesso.`
          );
          queryClient.invalidateQueries({ queryKey: ['romaneios_list'] });
        }}
      />

      <RomaneioFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <AnimatePresence>
        {showDetailsModal && (
          <RomaneioDetailsModal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            romaneio={selectedRomaneio}
            onDownloadPDF={handleDownloadPDF}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
