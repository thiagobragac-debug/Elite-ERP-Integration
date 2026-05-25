import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle, 
  ChevronRight, 
  FlaskConical,
  Wheat,
  Layers,
  ArrowRightLeft,
  DollarSign,
  Trash2,
  Edit3,
  Boxes,
  Zap,
  Layout,
  Gauge,
  FileText,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  X,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ProductForm } from '../../components/Forms/ProductForm';
import { MovementForm } from '../../components/Forms/MovementForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useDebounce } from '../../hooks/useDebounce';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { InventoryFilterModal } from './components/InventoryFilterModal';
import { formatNumber } from '../../utils/format';
import { EmptyState } from '../../components/Feedback/EmptyState';

export const InventoryManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, applyTenantFilter, canCreate, insertPayload } = useFarmFilter();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    categoria: 'all', // Corrected singular field
    categorias: [] as string[],
    status: 'all',
    minStock: 0,
    maxStock: 1000000,
    minPrice: 0,
    maxPrice: 1000000
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestedProducts, setRequestedProducts] = useState<Record<string, boolean>>({});
  const [requestLoading, setRequestLoading] = useState<Record<string, boolean>>({});

  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (isReady) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [activeFarmId, activeTenantId, isGlobalMode, page, debouncedSearch, filterValues.categoria]);
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const fetchPromise = (async () => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('produtos')
          .select('id, nome, categoria, unidade, estoque_atual, estoque_minimo, custo_medio, is_purchasable, is_sellable, is_storable, descricao, ean, ncm, marca, localizacao', { count: 'exact' })
          .order('nome', { ascending: true })
          .range(from, to);
        
        query = applyTenantFilter(query);

        if (filterValues.categoria !== 'all') {
          query = query.eq('categoria', filterValues.categoria);
        }

        if (searchTerm) {
          query = query.ilike('nome', `%${searchTerm}%`);
        }

        const { data, count, error } = await query;
        if (error) throw error;
        return { data, count };
      })();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const data = result?.data || [];
      const count = result?.count || 0;
      
      setProducts(data);
      setTotalCount(count);
    } catch (err) {
      console.warn('[Inventory] Resilience Pattern Engaged:', err);
      const mockProducts = [
        { id: 'm1', nome: 'MOCK: Sal Mineral 80', categoria: 'Suplemento', unidade: 'kg', estoque_atual: 500, estoque_minimo: 200, custo_medio: 4.5 }
      ];
      setProducts(mockProducts);
      setTotalCount(1);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    
    // Asynchronously check for history to disable the is_storable toggle
    const { count } = await supabase.from('estoque_movimentacao').select('*', { count: 'exact', head: true }).eq('produto_id', product.id);
    setSelectedProduct((prev: any) => ({ ...prev, hasHistory: count ? count > 0 : false }));
  };

  const handleSubmit = async (data: any) => {
    if (!canCreate && !selectedProduct) {
      alert('âš ï¸ Selecione uma unidade específica para cadastrar um novo produto. No modo Visão Global, a fazenda deve ser definida.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nome: data.nome,
        categoria: data.categoria,
        unidade: data.unidade,
        estoque_minimo: Number(data.estoque_minimo),
        estoque_atual: Number(data.estoque_atual),
        custo_medio: Number(data.custo_medio),
        is_purchasable: data.is_purchasable,
        is_sellable: data.is_sellable,
        is_storable: data.is_storable,
        descricao: data.descricao,
        marca: data.marca,
        localizacao: data.localizacao,
        ean: data.ean,
        ncm: data.ncm,
        is_active: data.is_active,
        ...insertPayload
      };

      if (selectedProduct) {
        const { error } = await supabase
          .from('produtos')
          .update(payload)
          .eq('id', selectedProduct.id);
        
        if (error) throw error;
        
        setIsModalOpen(false);
        fetchProducts();
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert([payload]);
        
        if (error) throw error;
        
        setIsModalOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      console.error('[Inventory] Erro ao salvar produto:', err);
      alert('âŒ Erro ao salvar produto: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMovementSubmit = async (data: any) => {
    if (!activeFarm) return;
    
    setIsSubmitting(true);
    try {
      // Call the FIFO processing RPC
      const { error } = await supabase.rpc('process_fifo_movement', {
        p_produto_id: data.produto_id,
        p_deposito_id: data.deposito_id,
        p_quantidade: Number(data.quantidade),
        p_tipo: data.tipo.toUpperCase(),
        p_valor_unitario: Number(data.valor_unitario || 0),
        p_fazenda_id: activeFarm.id,
        p_tenant_id: activeFarm.tenantId,
        p_responsavel: data.responsavel,
        p_origem_destino: data.origem_destino
      });

      if (error) throw error;

      setIsMovementModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error('[Inventory] Error processing FIFO movement:', err);
      alert('âŒ Erro ao processar movimentação FIFO: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = products.filter(p => {
      const matchesSearch = (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategorias = filterValues.categorias.length === 0 || filterValues.categorias.includes(p.categoria);
      const matchesStatus = filterValues.status === 'all' || 
                           (filterValues.status === 'critico' ? Number(p.estoque_atual) <= Number(p.estoque_minimo) : Number(p.estoque_atual) > Number(p.estoque_minimo));
      
      const stock = Number(p.estoque_atual || 0);
      const matchesStock = stock >= filterValues.minStock && stock <= filterValues.maxStock;
      
      const price = Number(p.custo_medio || 0);
      const matchesPrice = price >= filterValues.minPrice && price <= filterValues.maxPrice;

      return matchesSearch && matchesCategorias && matchesStatus && matchesStock && matchesPrice;
    });

    const exportData = filteredData.map(item => ({
      Nome: item.nome,
      Categoria: item.categoria,
      Marca: item.marca || '-',
      Unidade: item.unidade,
      Estoque_Atual: item.estoque_atual || 0,
      Estoque_Minimo: item.estoque_minimo || 0,
      Custo_Medio: item.custo_medio || 0,
      Valor_Total: (Number(item.estoque_atual || 0) * Number(item.custo_medio || 0)),
      Localizacao: item.localizacao || 'Geral'
    }));

    if (format === 'csv') exportToCSV(exportData, 'inventario_produtos');
    else if (format === 'excel') exportToExcel(exportData, 'inventario_produtos');
    else if (format === 'pdf') exportToPDF(exportData, 'inventario_produtos', 'Relatório de Inventário de Insumos');
  };

  const handleDelete = async (item: any) => {
    try {
      // Check if item has history
      const { count } = await supabase.from('estoque_movimentacao').select('*', { count: 'exact', head: true }).eq('produto_id', item.id);
      const hasHistory = count ? count > 0 : false;

      if (!hasHistory) {
        // Hard delete
        if (!confirm(`Tem certeza que deseja excluir permanentemente o item "${item.nome}"?`)) return;
        const { error } = await supabase.from('produtos').delete().eq('id', item.id);
        if (error) throw error;
        fetchProducts();
      } else {
        // Soft delete
        if (item.is_storable && Number(item.estoque_atual || 0) > 0) {
          alert(`âŒ Não é possível inativar o item "${item.nome}" pois ele possui histórico e saldo em estoque. Zere o estoque antes de inativar.`);
          return;
        }
        if (!confirm(`O item "${item.nome}" possui histórico no sistema e não pode ser excluído. Deseja inativá-lo para que não apareça mais nas rotinas?`)) return;
        
        const { error } = await supabase.from('produtos').update({ is_active: false }).eq('id', item.id);
        if (error) throw error;
        fetchProducts();
      }
    } catch (err: any) {
      alert('âŒ Erro na operação: ' + err.message);
    }
  };

  const handleAutoPurchaseRequest = async (product: any) => {
    const farmId = activeFarmId || activeFarm?.id;
    const tenantId = activeTenantId || activeFarm?.tenantId;

    if (!farmId || !tenantId) {
      alert('âš ï¸ Selecione uma fazenda específica para solicitar a compra.');
      return;
    }

    setRequestLoading(prev => ({ ...prev, [product.id]: true }));

    try {
      const diff = Math.max(1, Number(product.estoque_minimo || 0) - Number(product.estoque_atual || 0));
      const valorEstimado = Math.max(100, diff * Number(product.custo_medio || 0));

      const payload = {
        titulo: `Reposição de Insumo: ${product.nome}`,
        departamento: 'Estoque',
        prioridade: 'high',
        valor_estimado: valorEstimado,
        descricao: `Solicitação automática de reposição gerada pelo Módulo de Estoque devido a nível crítico de saldo físico. Saldo Atual: ${product.estoque_atual} ${product.unidade} | Nível Mínimo Exigido: ${product.estoque_minimo} ${product.unidade}.`,
        status: 'pending',
        solicitante: 'Sistema de Estoque (Auto)',
        fazenda_id: farmId,
        tenant_id: tenantId
      };

      const { error } = await supabase
        .from('solicitacoes_compra')
        .insert([payload]);

      if (error) throw error;

      setRequestedProducts(prev => ({ ...prev, [product.id]: true }));
    } catch (err: any) {
      console.error('[Inventory] Erro ao solicitar compra:', err);
      alert('âŒ Erro ao solicitar compra: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setRequestLoading(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleViewHistory = async (product: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    
    const { data } = await supabase
      .from('estoque_movimentacao')
      .select('*')
      .eq('produto_id', product.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setHistoryItems(data.map(m => ({
        id: m.id,
        date: m.created_at,
        title: m.tipo === 'IN' ? 'Entrada de Estoque' : 'Saída para Consumo',
        subtitle: `Qtd: ${m.quantidade} ${product.unidade}`,
        value: `R$ ${formatNumber(Number(m.quantidade) * Number(product.custo_medio))}`,
        status: m.tipo === 'IN' ? 'success' : 'warning'
      })));
    }
    setHistoryLoading(false);
  };

  const currentProducts = products || [];

  const stats = [
    { 
      label: 'Capital Imobilizado', 
      value: `R$ ${currentProducts.reduce((acc, curr) => acc + (Number(curr.estoque_atual || 0) * Number(curr.custo_medio || 0)), 0).toLocaleString('pt-BR')}`, 
      icon: DollarSign, 
      color: '#10b981', 
      progress: 85,
      trend: 'up' as const,
      change: 'Patrimônio em Insumos',
      periodLabel: 'Atual',
      sparkline: [{ value: 10, label: '10' }, { value: 15, label: '15' }, { value: 20, label: '20' }, { value: 18, label: '18' }, { value: 25, label: '25' }]
    },
    { 
      label: 'Ruptura de Estoque', 
      value: currentProducts.filter(p => Number(p.estoque_atual || 0) < Number(p.estoque_minimo)).length, 
      icon: AlertTriangle, 
      color: '#ef4444', 
      progress: currentProducts.length > 0 ? (currentProducts.filter(p => Number(p.estoque_atual || 0) < Number(p.estoque_minimo)).length / currentProducts.length) * 100 : 0, 
      trend: 'down' as const,
      change: 'Itens abaixo do mínimo',
      periodLabel: 'Ação Necessária',
      sparkline: [{ value: 30, label: '30' }, { value: 15, label: '15' }, { value: 25, label: '25' }, { value: 10, label: '10' }, { value: 5, label: '5' }]
    },
    { 
      label: 'Maturidade (30d)', 
      value: `${currentProducts.filter(p => p.categoria === 'Medicamento' || p.categoria === 'Vacina').length} itens`, 
      icon: FlaskConical, 
      color: '#f59e0b', 
      progress: 32,
      trend: undefined,
      change: 'Risco de Vencimento',
      periodLabel: 'Monitoramento Lot',
      sparkline: [{ value: 5, label: '5' }, { value: 8, label: '8' }, { value: 7, label: '7' }, { value: 10, label: '10' }, { value: 6, label: '6' }]
    },
    { 
      label: 'Giro de Estoque', 
      value: '1.4x', 
      icon: Zap, 
      color: '#3b82f6', 
      progress: 45,
      trend: 'up' as const,
      change: 'Velocidade de Consumo',
      periodLabel: 'Média Mensal',
      sparkline: [{ value: 1.0, label: '1.0' }, { value: 1.2, label: '1.2' }, { value: 1.1, label: '1.1' }, { value: 1.4, label: '1.4' }]
    }
  ];

  const columns = [
    {
      header: 'Insumo / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>{item.nome}</span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Categoria & Marca',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.categoria}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            {item.marca || 'Sem Marca'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Localização / Armazém',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.localizacao || 'Almoxarifado Geral'}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            Estoque Físico
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Saldo & Nível de Estoque',
      accessor: (item: any) => {
        const atual = Number(item.estoque_atual || 0);
        const max = Number(item.estoque_maximo || atual * 2 || 1);
        const min = Number(item.estoque_minimo || 0);
        const isCritical = atual < min;
        const capacityPercent = Math.min(100, (atual / max) * 100);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '135px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 900, color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1e293b' }}>
                <Package size={12} color={isCritical ? '#f43f5e' : '#6366f1'} />
                {atual} {item.unidade || 'un'}
              </span>
              <span style={{ color: isCritical ? '#f43f5e' : '#10b981' }}>{capacityPercent.toFixed(0)}%</span>
            </div>
            <div style={{ height: '6px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  transition: 'width 0.5s', 
                  backgroundColor: isCritical ? '#f43f5e' : capacityPercent > 80 ? '#10b981' : '#6366f1',
                  width: `${capacityPercent}%` 
                }}
              />
            </div>
          </div>
        );
      },
      align: 'left' as const
    },
    {
      header: 'Custo Médio & Total',
      accessor: (item: any) => {
        const totalValue = Number(item.estoque_atual || 0) * Number(item.custo_medio || 0);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span className="sub-meta" style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94a3b8' }}>
              {Number(item.custo_medio || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {item.unidade || 'un'}
            </span>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Status Reposição',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${Number(item.estoque_atual || 0) < Number(item.estoque_minimo || 0) ? 'danger' : 'success'}`}>
            {Number(item.estoque_atual || 0) < Number(item.estoque_minimo || 0) ? 'Reposição' : 'Disponível'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="inventory-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Package size={14} fill="currentColor" />
            <span>TAUZE INVENTORY v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Insumos</h1>
          <p className="page-subtitle">Rastreabilidade de estoque, custo médio e predição de suprimentos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => {
            if (!activeFarmId || isGlobalMode) {
              alert('⚠️ Selecione uma unidade/fazenda específica no menu superior para lançar movimentações. Não é possível movimentar no modo Visão Global.');
              return;
            }
            setIsMovementModalOpen(true);
          }}>
            <ArrowRightLeft size={18} />
            MOVIMENTAÇÃO
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA ITEM
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={Package} color=""  periodLabel="Estoque Atual" />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change}
            periodLabel={stat.periodLabel}
            sparkline={stat.sparkline}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          {['All', 'Suplemento', 'Vacina', 'Combustível', 'Semente'].map((cat) => (
            <button 
              key={cat}
              className={`tauze-tab-item ${filterValues.categoria === (cat === 'All' ? 'all' : cat) ? 'active' : ''}`} 
              onClick={() => {
                setFilterValues({...filterValues, categoria: cat === 'All' ? 'all' : cat});
                setPage(1);
              }}
            >
              {cat === 'All' ? 'Consolidado' : cat}
            </button>
          ))}
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Pesquisar insumos por nome ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
          >
            <ListIcon size={18} />
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Visualização em Cards"
          >
            <LayoutGrid size={18} />
          </button>
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
                const menu = document.getElementById('export-menu-inventory');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-inventory" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-inventory')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-inventory')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-inventory')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <InventoryFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {viewMode === 'list' ? (
          <ModernTable 
            emptyState={<EmptyState
              title="Nenhum insumo cadastrado"
              description="A frota desta unidade ainda não possui insumos registrados. Cadastre o primeiro maquinário para iniciar o monitoramento telemetria."
              actionLabel="Novo Insumo"
              onAction={handleOpenCreate}
              icon={Package}
            />}
            data={products}
            columns={columns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            searchPlaceholder="Filtrar base de insumos..."
            actions={(item) => {
              const isCritical = Number(item.estoque_atual || 0) <= Number(item.estoque_minimo || 0);
              const isRequested = requestedProducts[item.id];
              const isLoading = requestLoading[item.id];

              return (
                <div className="modern-actions">
                  {isCritical && (
                    <button 
                      className={`action-dot ${isRequested ? 'success' : 'warning'}`} 
                      onClick={() => !isRequested && !isLoading && handleAutoPurchaseRequest(item)}
                      title={isRequested ? "Compra Solicitada" : "Solicitar Compra"}
                      disabled={isRequested || isLoading}
                      style={{
                        borderColor: isRequested ? '#10b981' : '#f59e0b',
                        color: isRequested ? '#10b981' : '#f59e0b',
                        background: isRequested ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        cursor: isRequested ? 'default' : 'pointer'
                      }}
                    >
                      {isLoading ? (
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                          style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid currentColor',
                            borderTopColor: 'transparent',
                            borderRadius: '50%'
                          }}
                        />
                      ) : isRequested ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <ShoppingCart size={18} />
                      )}
                    </button>
                  )}
                  <button className="action-dot info" onClick={() => handleViewHistory(item)} title="Logs">
                    <ArrowRightLeft size={18} />
                  </button>
                  <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar">
                    <Edit3 size={18} />
                  </button>
                  <button className="action-dot delete" onClick={() => handleDelete(item)} title="Excluir/Inativar">
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            }}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
            {products
              .map(p => {
                const isCritical = Number(p.estoque_atual) <= Number(p.estoque_minimo);
                
                const getIcon = (cat: string) => {
                  if (cat?.includes('Semente')) return <Wheat size={32} />;
                  if (cat?.includes('Vacina') || cat?.includes('Medicamento')) return <FlaskConical size={32} />;
                  if (cat?.includes('Combustível')) return <Zap size={32} />;
                  return <Package size={32} />;
                };

                return (
                  <motion.div 
                    key={p.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`user-card-premium ${isCritical ? 'stopped-badge' : 'active'}`}
                  >
                    <div className="card-left-section">
                      <div className="card-avatar">
                        {getIcon(p.categoria)}
                      </div>
                      <div className="card-bottom-actions">
                        <button className="action-icon-btn info" onClick={() => handleViewHistory(p)} title="Dossiê"><ArrowRightLeft size={14} /></button>
                        <button className="action-icon-btn edit" onClick={() => handleOpenEdit(p)} title="Editar"><Edit3 size={14} /></button>
                        <button className="action-icon-btn delete" onClick={() => handleDelete(p)} title="Excluir/Inativar"><Trash2 size={14} /></button>
                        {isCritical && (
                          <button 
                            className={`action-icon-btn ${requestedProducts[p.id] ? 'success' : 'warning'}`} 
                            onClick={() => !requestedProducts[p.id] && !requestLoading[p.id] && handleAutoPurchaseRequest(p)}
                            title={requestedProducts[p.id] ? "Compra Solicitada" : "Solicitar Compra"}
                            disabled={requestedProducts[p.id] || requestLoading[p.id]}
                            style={{
                              borderColor: requestedProducts[p.id] ? '#10b981' : '#f59e0b',
                              color: requestedProducts[p.id] ? '#10b981' : '#f59e0b',
                              background: requestedProducts[p.id] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              cursor: requestedProducts[p.id] ? 'default' : 'pointer'
                            }}
                          >
                            {requestLoading[p.id] ? (
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  border: '2px solid currentColor',
                                  borderTopColor: 'transparent',
                                  borderRadius: '50%'
                                }}
                              />
                            ) : requestedProducts[p.id] ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <ShoppingCart size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="card-main-content">
                      <div className="card-header-info">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}>{p.nome}</h3>
                          <span className="card-role-badge" style={{ marginTop: '4px' }}>{p.categoria || 'INSUMO'}</span>
                        </div>
                        <span className={`status-pill mini ${isCritical ? 'stopped' : 'active'}`} style={{ fontSize: '8px', padding: '4px 8px', borderRadius: '6px' }}>
                          {isCritical ? '⚠️ Reposição' : '✓ Disponível'}
                        </span>
                      </div>

                      <div className="card-meta-grid" style={{ gap: '6px', marginTop: '8px' }}>
                        <div className="meta-item">
                          <Package size={12} className="meta-icon" />
                          <span style={{ fontWeight: 800, color: isCritical ? '#ef4444' : '#16a34a' }}>
                            Saldo: {p.estoque_atual || 0} {p.unidade} (Min: {p.estoque_minimo || 0})
                          </span>
                        </div>
                        
                        {/* Dynamic Stock Level Progress Bar */}
                        <div style={{ marginTop: '4px', marginBottom: '4px' }}>
                          <div style={{ height: '6px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                transition: 'width 0.5s', 
                                backgroundColor: isCritical ? '#ef4444' : '#10b981',
                                width: `${Math.min(100, ((p.estoque_atual || 0) / (p.estoque_minimo * 2 || 1)) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>

                        <div className="meta-item">
                          <DollarSign size={12} className="meta-icon" />
                          <span>Custo Médio: {Number(p.custo_medio || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 900, background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '6px' }}>
                            Ativo: {(Number(p.estoque_atual || 0) * Number(p.custo_medio || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>
                      <div className="card-footer-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderTop: '1px dashed rgba(148, 163, 184, 0.15)', paddingTop: '6px', marginTop: '12px' }}>
                        <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                          <Boxes size={12} style={{ color: 'hsl(var(--brand))' }} />
                          <span>Loc: {p.localizacao || 'Almoxarifado Geral'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            <button className="add-product-card-premium" onClick={handleOpenCreate}>
              <Plus size={32} />
              <span>NOVO INSUMO</span>
            </button>
          </motion.div>
        )}
      </div>

      <style>{`
        .view-mode-toggle {
          display: flex;
          background: hsl(var(--bg-main));
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
          margin: 0 16px;
        }

        .view-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: 0.2s;
        }

        .view-btn.active {
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .user-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 8px;
        }

        @media (max-width: 1400px) {
          .user-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .user-cards-grid { grid-template-columns: 1fr; }
        }

        .user-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          min-height: 180px;
          height: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          position: relative;
          text-align: left;
        }

        .user-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: hsl(var(--border-strong));
          transition: 0.3s;
        }

        .user-card-premium.active::before {
          background: #16a34a;
          box-shadow: 4px 0 15px rgba(22, 163, 74, 0.3);
        }

        .user-card-premium.stopped-badge::before {
          background: #ef4444;
          box-shadow: 4px 0 15px rgba(239, 68, 68, 0.3);
        }

        .user-card-premium:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.35);
        }

        .card-left-section {
          width: 130px;
          flex-shrink: 0;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
        }

        .card-avatar {
          width: 56px;
          height: 56px;
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          border: 1px solid hsl(var(--border));
          margin-bottom: 8px;
        }

        .card-main-content {
          flex: 1;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .card-header-info h3 {
          font-size: 16px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin-bottom: 2px;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.1);
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
          margin-top: 6px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: hsl(var(--text-muted));
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta-icon {
          color: hsl(var(--brand));
          flex-shrink: 0;
        }

        .card-bottom-actions {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 8px;
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: hsl(var(--brand));
          color: white;
          transform: scale(1.1);
          border-color: hsl(var(--brand));
        }

        .action-icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }

        .tauze-label { display: block; font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .tauze-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 14px; transition: 0.2s; background: #f8fafc; color: #1e293b; font-weight: 600; }
        .tauze-input:focus { border-color: #3b82f6; background: white; outline: none; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }

        .add-product-card-premium {
          border: 2px dashed #e2e8f0;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: transparent;
          cursor: pointer;
          color: #94a3b8;
          transition: 0.2s;
          min-height: 180px;
          height: 100%;
        }

        .add-product-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-product-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

        [data-theme='dark'] .add-product-card-premium {
          background: hsl(var(--bg-main)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }
      `}</style>

      <ProductForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedProduct}
      />

      <MovementForm 
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSubmit={handleMovementSubmit}
        defaultType="out"
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê de Movimentação"
        subtitle="Rastreabilidade de entradas e saídas de insumos"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
