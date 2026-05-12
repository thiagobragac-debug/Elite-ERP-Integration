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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ProductForm } from '../../components/Forms/ProductForm';
import { MovementForm } from '../../components/Forms/MovementForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import { InventoryFilterModal } from './components/InventoryFilterModal';
import { formatNumber } from '../../utils/format';

export const InventoryManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
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
    categorias: [],
    status: 'all',
    minStock: 0,
    maxStock: 5000,
    minPrice: 0,
    maxPrice: 10000
  });

  useEffect(() => {
    if (!activeFarmId && !isGlobalMode) return;
    fetchProducts();
  }, [activeFarmId, isGlobalMode]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('produtos').select('*').order('nome', { ascending: true });
      query = applyFarmFilter(query);
      const { data, error } = await query;
      
      if (data) setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreate && !selectedProduct) {
      alert('⚠️ Selecione uma unidade específica para cadastrar um novo produto. No modo Visão Global, a fazenda deve ser definida.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const payload = {
      nome: formData.get('nome'),
      categoria: formData.get('categoria'),
      unidade: formData.get('unidade'),
      estoque_minimo: Number(formData.get('estoque_minimo')),
      estoque_atual: Number(formData.get('estoque_atual')),
      custo_medio: Number(formData.get('custo_medio')),
      ...insertPayload
    };

    if (selectedProduct) {
      const { error } = await supabase
        .from('produtos')
        .update(payload)
        .eq('id', selectedProduct.id);
      
      if (!error) {
        setIsModalOpen(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase
        .from('produtos')
        .insert([payload]);
      
      if (!error) {
        setIsModalOpen(false);
        fetchProducts();
      }
    }
  };

  const handleMovementSubmit = async (data: any) => {
    if (!activeFarm) return;
    
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

    if (!error) {
      setIsMovementModalOpen(false);
      fetchProducts();
    } else {
      console.error('Error processing FIFO movement:', error);
      alert('Erro ao processar movimentação FIFO: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (!error) fetchProducts();
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

  const stats = [
    { 
      label: 'Capital Imobilizado', 
      value: `R$ ${products.reduce((acc, curr) => acc + (Number(curr.estoque_atual || 0) * Number(curr.custo_medio || 0)), 0).toLocaleString('pt-BR')}`, 
      icon: DollarSign, 
      color: '#10b981', 
      progress: 85,
      trend: 'up',
      change: 'Patrimônio em Insumos',
      periodLabel: 'Valor de Inventário',
      sparkline: [{ value: 10 }, { value: 15 }, { value: 20 }, { value: 18 }, { value: 25 }]
    },
    { 
      label: 'Ruptura de Estoque', 
      value: products.filter(p => Number(p.estoque_atual || 0) < Number(p.estoque_minimo)).length, 
      icon: AlertTriangle, 
      color: '#ef4444', 
      progress: products.length > 0 ? (products.filter(p => Number(p.estoque_atual || 0) < Number(p.estoque_minimo)).length / products.length) * 100 : 0, 
      trend: 'down',
      change: 'Itens abaixo do mínimo',
      periodLabel: 'Ação Necessária',
      sparkline: [{ value: 30 }, { value: 15 }, { value: 25 }, { value: 10 }, { value: 5 }]
    },
    { 
      label: 'Maturidade (30d)', 
      value: `${products.filter(p => p.categoria === 'Medicamento' || p.categoria === 'Vacina').length} itens`, 
      icon: FlaskConical, 
      color: '#f59e0b', 
      progress: 32,
      trend: 'stable',
      change: 'Risco de Vencimento',
      periodLabel: 'Monitoramento Lot',
      sparkline: [{ value: 5 }, { value: 8 }, { value: 7 }, { value: 10 }, { value: 6 }]
    },
    { 
      label: 'Giro de Estoque', 
      value: '1.4x', 
      icon: Zap, 
      color: '#3b82f6', 
      progress: 45,
      trend: 'up',
      change: 'Velocidade de Consumo',
      periodLabel: 'Média Mensal',
      sparkline: [{ value: 1.0 }, { value: 1.2 }, { value: 1.1 }, { value: 1.4 }]
    }
  ];

  const columns = [
    {
      header: 'Insumo',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider flex items-center gap-2">
            <span>{item.categoria}</span>
            {item.marca && <span className="text-slate-400">• {item.marca}</span>}
          </div>
        </div>
      )
    },
    {
      header: 'Saldo / Localização',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 font-bold text-slate-800">
              <Package size={14} />
              <span>{item.estoque_atual || 0} {item.unidade || 'un'}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase">{item.localizacao || 'Geral'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Indicadores',
      accessor: (item: any) => {
        const isCritical = Number(item.estoque_atual || 0) < Number(item.estoque_minimo);
        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold">CUSTO MÉDIO</span>
              <span className="text-xs font-bold">{Number(item.custo_medio || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold">AUTONOMIA</span>
              <span className="text-xs font-medium text-slate-600">~15 dias</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${Number(item.estoque_atual || 0) < Number(item.estoque_minimo) ? 'stopped' : 'active'}`}>
          {Number(item.estoque_atual || 0) < Number(item.estoque_minimo) ? 'Reposição' : 'Disponível'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="inventory-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Package size={14} fill="currentColor" />
            <span>ELITE INVENTORY v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Insumos</h1>
          <p className="page-subtitle">Rastreabilidade de estoque, custo médio e predição de suprimentos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsMovementModalOpen(true)}>
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
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Package} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
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

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          {['All', 'Suplemento', 'Vacina', 'Combustível', 'Semente'].map((cat) => (
            <button 
              key={cat}
              className={`elite-tab-item ${filterValues.categoria === (cat === 'All' ? 'all' : cat) ? 'active' : ''}`} 
              onClick={() => setFilterValues({...filterValues, categoria: cat === 'All' ? 'all' : cat})}
            >
              {cat === 'All' ? 'Consolidado' : cat}
            </button>
          ))}
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
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

        <div className="elite-filter-group">
          <button 
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Inventário">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <InventoryFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {products.length === 0 && !loading ? (
          <EmptyState
            title="Nenhum insumo cadastrado"
            description="A frota desta unidade ainda não possui insumos registrados. Cadastre o primeiro maquinário para iniciar o monitoramento telemetria."
            actionLabel="Novo Insumo"
            onAction={handleOpenCreate}
            icon={Package}
          />
        ) : viewMode === 'list' ? (
          <ModernTable 
            data={products.filter(p => {
              const matchesSearch = (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesCategorias = filterValues.categorias.length === 0 || filterValues.categorias.includes(p.categoria);
              const matchesStatus = filterValues.status === 'all' || 
                                   (filterValues.status === 'critico' ? Number(p.estoque_atual) <= Number(p.estoque_minimo) : Number(p.estoque_atual) > Number(p.estoque_minimo));
              
              const stock = Number(p.estoque_atual || 0);
              const matchesStock = stock >= filterValues.minStock && stock <= filterValues.maxStock;
              
              const price = Number(p.custo_medio || 0);
              const matchesPrice = price >= filterValues.minPrice && price <= filterValues.maxPrice;

              return matchesSearch && matchesCategorias && matchesStatus && matchesStock && matchesPrice;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Filtrar base de insumos..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewHistory(item)} title="Logs">
                  <ArrowRightLeft size={18} />
                </button>
                <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar">
                  <Edit3 size={18} />
                </button>
                <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir">
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
            {products
              .filter(p => {
                const matchesSearch = (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategorias = filterValues.categorias.length === 0 || filterValues.categorias.includes(p.categoria);
                const matchesStatus = filterValues.status === 'all' || 
                                     (filterValues.status === 'critico' ? Number(p.estoque_atual) <= Number(p.estoque_minimo) : Number(p.estoque_atual) > Number(p.estoque_minimo));
                
                const stock = Number(p.estoque_atual || 0);
                const matchesStock = stock >= filterValues.minStock && stock <= filterValues.maxStock;
                
                const price = Number(p.custo_medio || 0);
                const matchesPrice = price >= filterValues.minPrice && price <= filterValues.maxPrice;

                return matchesSearch && matchesCategorias && matchesStatus && matchesStock && matchesPrice;
              })
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
                    layout
                    className={`user-card-premium ${isCritical ? 'stopped-badge' : 'active'}`}
                  >
                    <div className="card-left-section">
                      <div className="card-avatar">
                        {getIcon(p.categoria)}
                      </div>
                      <div className="card-bottom-actions">
                        <button className="action-icon-btn" onClick={() => handleViewHistory(p)} title="Dossiê"><ArrowRightLeft size={16} /></button>
                        <button className="action-icon-btn" onClick={() => handleOpenEdit(p)} title="Editar"><Edit3 size={16} /></button>
                        <button className="action-icon-btn delete" onClick={() => handleDelete(p.id)} title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    <div className="card-main-content">
                      <div className="card-header-info">
                        <h3>{p.nome}</h3>
                        <span className="card-role-badge">{p.categoria || 'INSUMO'}</span>
                      </div>

                      <div className="card-meta-grid">
                        <div className="meta-item">
                          <Package size={14} className="meta-icon" />
                          <span style={{ fontWeight: 800, color: isCritical ? '#ef4444' : '#16a34a' }}>
                            {p.estoque_atual || 0} {p.unidade}
                          </span>
                        </div>
                        <div className="meta-item">
                          <DollarSign size={14} className="meta-icon" />
                          <span>Custo: {Number(p.custo_medio || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="meta-item">
                          <AlertTriangle size={14} className="meta-icon" />
                          <span>Mínimo: {p.estoque_minimo || 0} {p.unidade}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
          padding: 8px;
        }

        .user-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          height: auto;
          min-height: 180px;
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
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.3);
        }

        .card-left-section {
          width: 130px;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
        }

        .card-avatar {
          width: 70px;
          height: 70px;
          background: hsl(var(--bg-main));
          color: hsl(var(--text-main));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 12px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          border: 1px solid hsl(var(--border));
        }

        .card-main-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-header-info h3 {
          font-size: 19px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.1);
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-top: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: hsl(var(--text-muted));
          font-size: 12px;
          font-weight: 600;
        }

        .meta-icon {
          color: hsl(var(--brand));
        }

        .card-bottom-actions {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }

        .action-icon-btn {
          width: 34px;
          height: 34px;
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

        .elite-label { display: block; font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .elite-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 14px; transition: 0.2s; background: #f8fafc; color: #1e293b; font-weight: 600; }
        .elite-input:focus { border-color: #3b82f6; background: white; outline: none; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
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
