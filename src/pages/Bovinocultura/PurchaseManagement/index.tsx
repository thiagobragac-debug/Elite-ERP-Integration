import React, { useState, useMemo, useEffect } from 'react';
import { usePersistentState } from '../../../hooks/usePersistentState';
import { useTenantFarm } from '../../../contexts/TenantContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { Breadcrumb } from '../../../components/Navigation/Breadcrumb';
import {
  Truck,
  Plus,
  FileText,
  Search,
  Filter,
  History,
  Edit3,
  Trash2,
  MapPin,
  TrendingDown,
  CheckCircle,
  Clock,
  ShoppingCart,
} from 'lucide-react';
import { ModernTable } from '../../../components/DataTable/ModernTable';
import { EmptyState } from '../../../components/Feedback/EmptyState';
import { TauzeStatCard } from '../../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../../components/Feedback/Skeleton';
import { PurchaseForm } from './components/PurchaseForm';
import { PurchaseFilterModal } from './components/PurchaseFilterModal';
import { exportToCSV, exportToExcel, exportToPDF } from '../../../utils/export';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

type TabKey = 'TODOS' | 'PENDENTE' | 'EM_TRANSITO' | 'CONCLUIDO' | 'CANCELADO';

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_TRANSITO: 'Em Trânsito',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export const PurchaseManagement: React.FC = () => {
  const { can } = usePermissions();
  const { activeTenantId } = useTenantFarm();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState<any>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [activeTab, setActiveTab] = usePersistentState<TabKey>(
    'PurchaseManagement_activeTab',
    'TODOS'
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'Purchase_showFilters',
    false
  );
  const [filterValues, setFilterValues] = usePersistentState(
    'Purchase_filterValues',
    { fornecedor: 'all', dateStart: '', dateEnd: '' }
  );

  // Reset page when tab/search changes
  useEffect(() => { setPage(1); }, [activeTab, searchTerm, JSON.stringify(filterValues)]);

  const { data: lotes = [], isLoading: loading } = useQuery({
    queryKey: ['lotes_compra', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lotes_compra')
        .select(`
          *,
          parceiro:fornecedor_id (nome_razao, fantasia),
          fazenda_destino:fazenda_destino_id (nome)
        `)
        .eq('tenant_id', activeTenantId)
        .order('data_compra', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Build sparkline from lotes by month
  const sparkline = useMemo(() => {
    const byMonth: Record<string, number> = {};
    lotes.forEach((l: any) => {
      if (!l.data_compra) return;
      const key = l.data_compra.slice(0, 7); // YYYY-MM
      byMonth[key] = (byMonth[key] || 0) + (l.quantidade_cabecas || 0);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, value]) => ({
        value,
        label: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      }));
  }, [lotes]);

  const filteredLotes = useMemo(() => {
    return lotes.filter((lote: any) => {
      const fornecedorNome = Array.isArray(lote.parceiro)
        ? lote.parceiro[0]?.nome_razao
        : lote.parceiro?.nome_razao;

      const searchStr = `${lote.nota_fiscal || ''} ${fornecedorNome || ''} ${lote.id || ''}`.toLowerCase();
      const matchesSearch = !searchTerm || searchStr.includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'TODOS' || lote.status === activeTab;
      const matchesFornecedor =
        filterValues.fornecedor === 'all' || fornecedorNome === filterValues.fornecedor;
      const matchesDateStart =
        !filterValues.dateStart || (lote.data_compra && lote.data_compra >= filterValues.dateStart);
      const matchesDateEnd =
        !filterValues.dateEnd || (lote.data_compra && lote.data_compra <= filterValues.dateEnd);

      return matchesSearch && matchesTab && matchesFornecedor && matchesDateStart && matchesDateEnd;
    });
  }, [lotes, searchTerm, activeTab, filterValues]);

  const paginatedLotes = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredLotes.slice(startIndex, startIndex + pageSize);
  }, [filteredLotes, page, pageSize]);

  const uniqueFornecedores = useMemo(() => {
    const nomes = lotes.map((l: any) => {
      const p = Array.isArray(l.parceiro) ? l.parceiro[0] : l.parceiro;
      return p?.nome_razao || '';
    });
    return Array.from(new Set(nomes)).filter(Boolean) as string[];
  }, [lotes]);

  const isAdvancedFilterActive = useMemo(() => {
    return filterValues.fornecedor !== 'all' || !!filterValues.dateStart || !!filterValues.dateEnd;
  }, [filterValues]);

  const stats = useMemo(() => {
    const totalCabecas = lotes.reduce((acc: number, curr: any) => acc + (curr.quantidade_cabecas || 0), 0);
    const investimentoTotal = lotes.reduce((acc: number, curr: any) => acc + (curr.valor_total || 0), 0);
    const emTransito = lotes.filter((l: any) => l.status === 'EM_TRANSITO').length;
    const concluidos = lotes.filter((l: any) => l.status === 'CONCLUIDO').length;
    const custoMedioCabeca = totalCabecas > 0 ? investimentoTotal / totalCabecas : 0;

    return [
      {
        label: 'Total Comprado',
        value: totalCabecas > 0 ? totalCabecas.toLocaleString('pt-BR') : '0',
        icon: Truck,
        color: '#3b82f6',
        subtitle: 'Cabeças no período',
        change: lotes.length > 0 ? `${lotes.length} lotes` : 'Sem compras',
        trend: lotes.length > 0 ? ('up' as const) : ('down' as const),
        sparkline,
        periodLabel: 'Histórico',
      },
      {
        label: 'Investimento Total',
        value:
          investimentoTotal >= 1_000_000
            ? `R$ ${(investimentoTotal / 1_000_000).toFixed(2)}M`
            : `R$ ${investimentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        icon: FileText,
        color: '#10b981',
        subtitle: 'Valor total registrado',
        change: concluidos > 0 ? `${concluidos} concluídos` : 'Nenhum concluído',
        trend: concluidos > 0 ? ('up' as const) : ('down' as const),
        periodLabel: 'Histórico',
      },
      {
        label: 'Lotes em Trânsito',
        value: String(emTransito),
        icon: MapPin,
        color: '#f59e0b',
        subtitle: 'Aguardando chegada',
        change: emTransito > 0 ? 'Em deslocamento' : 'Nenhum em trânsito',
        trend: emTransito > 0 ? ('up' as const) : ('down' as const),
        periodLabel: 'Histórico',
      },
      {
        label: 'Custo Médio / Cabeça',
        value: custoMedioCabeca > 0
          ? `R$ ${custoMedioCabeca.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : 'R$ 0,00',
        icon: TrendingDown,
        color: '#8b5cf6',
        subtitle: 'Baseado no total investido',
        change: totalCabecas > 0 ? 'Calculado do rebanho' : 'Sem dados',
        trend: 'neutral' as const,
        periodLabel: 'Histórico',
      },
    ];
  }, [lotes, sparkline]);

  const tableColumns = useMemo(
    () => [
      {
        header: 'Lote / NF-e',
        accessor: (item: any) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span className="main-text" style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '13px' }}>
              #{item.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="sub-meta">
              {item.nota_fiscal ? `NF ${item.nota_fiscal}` : 'Sem NF-e'}
              {item.gta_numero && ` · GTA ${item.gta_numero}`}
            </span>
          </div>
        ),
        align: 'left' as const,
      },
      {
        header: 'Fornecedor / Data',
        accessor: (item: any) => {
          const fornecedor = Array.isArray(item.parceiro) ? item.parceiro[0] : item.parceiro;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span className="main-text" style={{ fontWeight: 700 }}>
                {fornecedor?.nome_razao || '---'}
              </span>
              <span className="sub-meta">
                {item.data_compra
                  ? new Date(item.data_compra + 'T00:00:00').toLocaleDateString('pt-BR')
                  : '—'}
                {item.municipio_origem && ` · ${item.municipio_origem}/${item.uf_origem || ''}`}
              </span>
            </div>
          );
        },
        align: 'left' as const,
      },
      {
        header: 'Cabeças / Peso',
        accessor: (item: any) => {
          const arrobas = item.total_arrobas ? Number(item.total_arrobas).toFixed(0) : null;
          const pesoMed = item.peso_medio_kg ? `${Number(item.peso_medio_kg).toFixed(0)}kg` : null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span className="main-text" style={{ fontWeight: 800 }}>
                {item.quantidade_cabecas || 0} cb
                {pesoMed && <span style={{ fontWeight: 500, fontSize: '11px', marginLeft: '6px', color: 'hsl(var(--text-muted))' }}>({pesoMed})</span>}
              </span>
              <span className="sub-meta">
                {arrobas ? `${arrobas} @` : (item.categoria_predominante || '—')}
              </span>
            </div>
          );
        },
        align: 'left' as const,
      },
      {
        header: 'Valor / Custo @',
        accessor: (item: any) => {
          const custoArroba = item.preco_arroba || (item.total_arrobas && item.valor_total ? item.valor_total / item.total_arrobas : null);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span className="main-text" style={{ fontWeight: 700 }}>
                {item.valor_total
                  ? `R$ ${Number(item.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                  : '—'}
              </span>
              <span className="sub-meta">
                {custoArroba ? `R$ ${Number(custoArroba).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/@` : '—'}
              </span>
            </div>
          );
        },
        align: 'left' as const,
      },
      {
        header: 'Destino',
        accessor: (item: any) => {
          const fazenda = Array.isArray(item.fazenda_destino) ? item.fazenda_destino[0] : item.fazenda_destino;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span className="main-text" style={{ fontWeight: 600, fontSize: '12px' }}>
                {fazenda?.nome || '—'}
              </span>
              {item.exige_quarentena && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', background: 'hsl(38 92% 50% / 0.12)', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', width: 'fit-content' }}>
                  ⚠ QUARENTENA
                </span>
              )}
            </div>
          );
        },
        align: 'left' as const,
      },
      {
        header: 'Status',
        accessor: (item: any) => {
          const s = item.status || 'PENDENTE';
          const cls =
            s === 'CONCLUIDO' ? 'success' :
            s === 'EM_TRANSITO' ? 'pending' :
            s === 'CANCELADO' ? 'stopped' : 'info';
          return (
            <span className={`status-pill ${cls}`}>
              {STATUS_LABEL[s] || s}
            </span>
          );
        },
        align: 'center' as const,
      },
    ],
    []
  );

  const handleOpenCreate = () => {
    setSelectedLote(null);
    setIsModalOpen(true);
  };
  const handleOpenEdit = (item: any) => {
    setSelectedLote(item);
    setIsModalOpen(true);
  };
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lotes_compra')
        .delete()
        .eq('id', id)
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['lotes_compra', activeTenantId] });
      toast.success('✅ Lote excluído!');
    } catch (err: any) {
      toast.error(`❌ Erro ao excluir: ${err.message}`);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    toast.loading('Exportando dados...', { id: 'export-toast' });
    const exportData = filteredLotes.map((item: any) => {
      const fornecedor = Array.isArray(item.parceiro) ? item.parceiro[0] : item.parceiro;
      return {
        ID_Lote: item.id,
        Nota_Fiscal: item.nota_fiscal || '',
        Fornecedor: fornecedor?.nome_razao || '',
        Data_Compra: item.data_compra || '',
        Quantidade_Cabecas: item.quantidade_cabecas || 0,
        Valor_Total: item.valor_total || 0,
        Status: item.status || '',
        Destino: item.fazenda_destino || '',
      };
    });
    if (format === 'csv') exportToCSV(exportData, 'compras_entrada');
    else if (format === 'excel') exportToExcel(exportData, 'compras_entrada');
    else exportToPDF(exportData, 'compras_entrada', 'Compras & Entrada');
    toast.success('Exportação concluída!', { id: 'export-toast' });
  };

  return (
    <div className="animal-mgmt-page animate-slide-up">
      {/* 1. PAGE HEADER */}
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Bovinocultura', href: '/bovinocultura/dashboard' },
              { label: 'Compras & Entrada' },
            ]}
          />
          <h1 className="page-title">Compras & Entrada</h1>
          <p className="page-subtitle">
            Gerenciamento de lotes comprados, notas fiscais e recebimento.
          </p>
        </div>
        <div className="page-actions">
          {can('bovinocultura', 'create') && (
            <button className="primary-btn" onClick={handleOpenCreate}>
              <Plus size={18} />
              NOVA COMPRA
            </button>
          )}
        </div>
      </header>

      {/* 2. KPI GRID */}
      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
          : stats.map((stat, idx) => <TauzeStatCard key={idx} {...stat} />)
        }
      </div>

      {/* 3. CONTROLS ROW */}
      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          {([
            { key: 'TODOS', label: 'Todos', icon: ShoppingCart },
            { key: 'PENDENTE', label: 'Pendentes', icon: Clock },
            { key: 'EM_TRANSITO', label: 'Em Trânsito', icon: Truck },
            { key: 'CONCLUIDO', label: 'Concluídos', icon: CheckCircle },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              className={`tauze-tab-item ${activeTab === key ? 'active' : ''}`}
              onClick={() => { setActiveTab(key); setPage(1); }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Filtrar por lote, NF ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
          <button
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{ position: 'relative' }}
          >
            <Filter size={20} />
            {isAdvancedFilterActive && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  border: '2px solid hsl(var(--bg-main))',
                }}
              />
            )}
          </button>
          <div className="export-dropdown-container">
            <button
              className="icon-btn-secondary"
              title="Exportar"
              onClick={() => document.getElementById('export-menu-compras')?.classList.toggle('active')}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-compras" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-compras')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-compras')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-compras')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DATA TABLE */}
      <div className="management-content">
        <ModernTable
          data={paginatedLotes}
          columns={tableColumns}
          loading={loading}
          hideHeader={true}
          totalCount={filteredLotes.length}
          currentPage={page}
          onPageChange={setPage}
          itemsPerPage={pageSize}
          emptyState={
            <EmptyState
              title="Nenhuma compra encontrada"
              description={
                activeTab !== 'TODOS'
                  ? `Não há lotes com status "${STATUS_LABEL[activeTab] || activeTab}" registrados.`
                  : 'Você ainda não registrou nenhum lote de compra. Clique em Nova Compra para começar.'
              }
              actionLabel="NOVA COMPRA"
              onAction={handleOpenCreate}
              icon={Truck}
            />
          }
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" title="Detalhes">
                <History size={18} />
              </button>
              {can('bovinocultura', 'edit') && (
                <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar">
                  <Edit3 size={18} />
                </button>
              )}
              {can('bovinocultura', 'delete') && (
                <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          )}
        />
      </div>

      {/* 6. MODAIS */}
      <PurchaseFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
        fornecedores={uniqueFornecedores}
      />
      <PurchaseForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['lotes_compra', activeTenantId] });
        }}
        onSubmit={() => {
          setIsModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['lotes_compra', activeTenantId] });
          toast.success('✅ Compra registrada com sucesso!');
        }}
        initialData={selectedLote}
      />
    </div>
  );
};
