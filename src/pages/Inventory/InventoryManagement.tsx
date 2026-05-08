import { useState, useEffect } from 'react';
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
import { formatNumber } from '../../utils/format';

export const InventoryManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'WAREHOUSES'>('PRODUCTS');
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    categoria: 'all',
    status: 'all'
  });
  const [stats, setStats] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    if (!activeFarm) return;
    fetchProducts();
    fetchWarehouses();
  }, [activeFarm]);

  const fetchWarehouses = async () => {
    try {
      const { data } = await supabase
        .from('depositos')
        .select('*')
        .eq('fazenda_id', activeFarm.id)
        .order('nome', { ascending: true });
      if (data) setWarehouses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('produtos')
        .select('*')
        .eq('fazenda_id', activeFarm.id)
        .order('nome', { ascending: true });
      
      if (data) {
        setProducts(data);
        const valorTotal = data.reduce((acc, curr) => {
          const saldo = curr.estoque_atual || 0;
          const custo = curr.custo_medio || 0;
          return acc + (Number(saldo) * Number(custo));
        }, 0);
        const abaixoMinimo = data.filter(p => Number(p.estoque_atual || 0) < Number(p.estoque_minimo)).length;
        
        setStats([
          { 
            label: 'Liquidez em Insumos', 
            value: valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: DollarSign, 
            color: 'hsl(var(--brand))', 
            progress: 85,
            change: 'Valor de Inventário',
            periodLabel: 'Patrimônio Atual',
            sparkline: [
              { value: 60, label: 'R$ 150k' }, { value: 65, label: 'R$ 162k' }, { value: 70, label: 'R$ 175k' }, 
              { value: 68, label: 'R$ 170k' }, { value: 75, label: 'R$ 185k' }, { value: 80, label: 'R$ 195k' }, 
              { value: 90, label: 'R$ 210k' }, { value: 85, label: 'Total: R$ ' + (valorTotal / 1000).toFixed(0) + 'k' }
            ]
          },
          { 
            label: 'Ruptura de Estoque', 
            value: abaixoMinimo, 
            icon: AlertTriangle, 
            color: '#ef4444', 
            progress: data.length > 0 ? (abaixoMinimo / data.length) * 100 : 0, 
            trend: 'down',
            change: 'Crítico/Minimo',
            periodLabel: 'Alertas Reposição',
            sparkline: [
              { value: 10, label: '1' }, { value: 20, label: '3' }, { value: 5, label: '0' }, 
              { value: 30, label: '5' }, { value: 15, label: '2' }, { value: 25, label: '4' }, 
              { value: 10, label: '1' }, { value: data.length > 0 ? (abaixoMinimo / data.length) * 100 : 0, label: abaixoMinimo + ' abaixo do min.' }
            ]
          },
          { 
            label: 'SKUs Ativos', 
            value: data.length, 
            icon: Boxes, 
            color: 'hsl(230 60% 50%)', 
            progress: 100,
            change: 'Catálogo de Itens',
            periodLabel: 'Mix de Produtos',
            sparkline: [
              { value: 80, label: '120' }, { value: 82, label: '124' }, { value: 85, label: '130' }, 
              { value: 88, label: '135' }, { value: 90, label: '140' }, { value: 95, label: '150' }, 
              { value: 100, label: '160' }, { value: 100, label: data.length.toString() }
            ]
          },
          { 
            label: 'Giro Mensal', 
            value: '1.2x', 
            icon: Zap, 
            color: 'hsl(161 64% 25%)', 
            progress: 40,
            periodLabel: 'Evolução Logística',
            sparkline: [
              { value: 30, label: '0.8x' }, { value: 40, label: '1.0x' }, { value: 35, label: '0.9x' }, 
              { value: 50, label: '1.2x' }, { value: 45, label: '1.1x' }, { value: 60, label: '1.4x' }, 
              { value: 55, label: '1.3x' }, { value: 50, label: '1.2x' }
            ]
          },
        ]);
      }
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

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;

    const payload = {
      nome: formData.nome,
      categoria: formData.categoria,
      unidade: formData.unidade,
      estoque_atual: parseFloat(formData.estoque_atual),
      estoque_minimo: parseFloat(formData.estoque_minimo),
      custo_medio: parseFloat(formData.custo_medio),
      descricao: formData.descricao,
      ean: formData.ean,
      ncm: formData.ncm,
      marca: formData.marca,
      localizacao: formData.localizacao
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
      const { error } = await supabase.from('produtos').insert([{
        ...payload,
        fazenda_id: activeFarm.id,
        tenant_id: activeFarm.tenantId
      }]);

      if (!error) {
        setIsModalOpen(false);
        fetchProducts();
      }
    }
  };

  const handleWarehouseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeFarm) return;
    const formData = new FormData(e.currentTarget);
    const payload = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    };

    if (selectedWarehouse) {
      const { error } = await supabase.from('depositos').update(payload).eq('id', selectedWarehouse.id);
      if (!error) {
        setIsWarehouseModalOpen(false);
        fetchWarehouses();
      }
    } else {
      const { error } = await supabase.from('depositos').insert([payload]);
      if (!error) {
        setIsWarehouseModalOpen(false);
        fetchWarehouses();
      }
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este depósito?')) return;
    const { error } = await supabase.from('depositos').delete().eq('id', id);
    if (!error) fetchWarehouses();
  };

  const handleMovementSubmit = async (data: any) => {
    if (!activeFarm) return;
    const { error } = await supabase.from('movimentacoes_estoque').insert([{
      ...data,
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    }]);
    if (!error) {
      setIsMovementModalOpen(false);
      fetchProducts();
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

  const columns = [
    {
      header: 'Insumo',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.categoria}
          </div>
        </div>
      )
    },
    {
      header: 'Estoque Atual',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Package size={14} />
          <span>{item.estoque_atual || 0} {item.unidade || 'un'}</span>
        </div>
      )
    },
    {
      header: 'Custo Médio',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <DollarSign size={14} />
          <span>{Number(item.custo_medio || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${Number(item.estoque_atual || 0) < Number(item.estoque_minimo) ? 'stopped' : 'active'}`}>
          {Number(item.estoque_atual || 0) < Number(item.estoque_minimo) ? 'Crítico' : 'Normal'}
        </span>
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
          <button className="primary-btn" onClick={() => {
            if (activeTab === 'PRODUCTS') handleOpenCreate();
            else {
              setSelectedWarehouse(null);
              setIsWarehouseModalOpen(true);
            }
          }}>
            <Plus size={18} />
            {activeTab === 'PRODUCTS' ? 'NOVO ITEM' : 'NOVO DEPÓSITO'}
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
          <button 
            className={`elite-tab-item ${activeTab === 'PRODUCTS' ? 'active' : ''}`} 
            onClick={() => setActiveTab('PRODUCTS')}
          >
            Insumos & Produtos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'WAREHOUSES' ? 'active' : ''}`} 
            onClick={() => setActiveTab('WAREHOUSES')}
          >
            Depósitos (Almoxarifado)
          </button>
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

      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="advanced-filter-panel"
          >
            <div className="filter-grid">
              <div className="filter-field">
                <label className="elite-label">Categoria de Insumo</label>
                <select 
                  className="elite-input elite-select"
                  value={filterValues.categoria}
                  onChange={(e) => setFilterValues({...filterValues, categoria: e.target.value})}
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="Suplemento">Suplementos</option>
                  <option value="Medicamento">Medicamentos</option>
                  <option value="Semente">Sementes</option>
                  <option value="Combustível">Combustíveis</option>
                </select>
              </div>
              <div className="filter-field">
                <label className="elite-label">Status de Estoque</label>
                <select 
                  className="elite-input elite-select"
                  value={filterValues.status}
                  onChange={(e) => setFilterValues({...filterValues, status: e.target.value})}
                >
                  <option value="all">Todos</option>
                  <option value="critico">Estoque Crítico</option>
                  <option value="normal">Estoque Normal</option>
                </select>
              </div>
              <div className="filter-actions-inline">
                <button className="text-btn" onClick={() => setFilterValues({ categoria: 'all', status: 'all' })}>
                  LIMPAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="management-content">
        {activeTab === 'WAREHOUSES' ? (
          <div className="warehouse-grid animate-fade-in">
            {warehouses.map(w => (
              <div key={w.id} className="warehouse-card">
                <div className="w-icon">
                  <Layout size={24} />
                </div>
                <div className="w-info">
                  <h3>{w.nome}</h3>
                  <p>{w.descricao || 'Sem descrição cadastrada'}</p>
                </div>
                <div className="w-meta">
                  <div className="m-item">
                    <Boxes size={14} />
                    <span>Farm: {activeFarm.nome}</span>
                  </div>
                  <div className="m-item">
                    <div className={`status-dot ${w.status === 'ativo' ? 'active' : ''}`} />
                    <span>{w.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
                <div className="w-actions">
                  <button onClick={() => {
                    setSelectedWarehouse(w);
                    setIsWarehouseModalOpen(true);
                  }}>EDITAR</button>
                  <button className="delete" onClick={() => handleDeleteWarehouse(w.id)}>EXCLUIR</button>
                </div>
              </div>
            ))}
            <button className="add-warehouse-card" onClick={() => {
              setSelectedWarehouse(null);
              setIsWarehouseModalOpen(true);
            }}>
              <Plus size={32} />
              <span>CRIAR DEPÓSITO</span>
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <ModernTable 
            data={products.filter(p => {
              const matchesSearch = (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesCategoria = filterValues.categoria === 'all' || p.categoria === filterValues.categoria;
              const matchesStatus = filterValues.status === 'all' || 
                                   (filterValues.status === 'critico' ? Number(p.estoque_atual) <= Number(p.estoque_minimo) : Number(p.estoque_atual) > Number(p.estoque_minimo));
              return matchesSearch && matchesCategoria && matchesStatus;
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
                const matchesCategoria = filterValues.categoria === 'all' || p.categoria === filterValues.categoria;
                const matchesStatus = filterValues.status === 'all' || 
                                     (filterValues.status === 'critico' ? Number(p.estoque_atual) <= Number(p.estoque_minimo) : Number(p.estoque_atual) > Number(p.estoque_minimo));
                return matchesSearch && matchesCategoria && matchesStatus;
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
          height: 180px;
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

        .warehouse-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .warehouse-card { background: white; border-radius: 24px; padding: 24px; border: 1px solid #e2e8f0; position: relative; transition: 0.3s; }
        .warehouse-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1); border-color: hsl(var(--brand)); }
        .w-icon { width: 50px; height: 50px; background: #f8fafc; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #64748b; margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .w-info h3 { font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; }
        .w-info p { font-size: 12px; color: #64748b; margin: 4px 0 20px; }
        .w-meta { display: flex; gap: 16px; margin-bottom: 20px; padding: 12px; background: #f8fafc; border-radius: 12px; }
        .m-item { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #475569; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
        .status-dot.active { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        .w-actions { display: flex; gap: 10px; }
        .w-actions button { flex: 1; padding: 10px; border-radius: 10px; font-size: 11px; font-weight: 900; cursor: pointer; transition: 0.2s; border: none; }
        .w-actions button:first-child { background: #f1f5f9; color: #475569; }
        .w-actions button:first-child:hover { background: #e2e8f0; }
        .w-actions button.delete { background: #fee2e2; color: #ef4444; }
        .w-actions button.delete:hover { background: #fecaca; }

        .add-warehouse-card { border: 2px dashed #e2e8f0; border-radius: 24px; min-height: 240px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: transparent; cursor: pointer; color: #94a3b8; transition: 0.2s; }
        .add-warehouse-card:hover { border-color: hsl(var(--brand)); color: hsl(var(--brand)); background: #f8fafc; }
        .add-warehouse-card span { font-size: 12px; font-weight: 900; }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px); z-index: 10000; display: flex;
          align-items: center; justify-content: center; padding: 20px;
        }
        .plan-builder-modal {
          background: white; width: 100%; max-width: 600px;
          border-radius: 28px; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5);
          display: flex; flex-direction: column; max-height: 90vh;
        }
        .builder-header { padding: 28px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .icon-badge.brand { background: #eff6ff; color: #3b82f6; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .builder-header h2 { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
        .builder-header p { font-size: 13px; color: #64748b; margin: 2px 0 0; }
        .builder-body { padding: 32px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
        .builder-footer { padding: 24px 32px; border-top: 1px solid #f1f5f9; background: #f8fafc; display: flex; justify-content: flex-end; gap: 16px; }
        
        .input-group-row { display: flex; flex-direction: column; gap: 20px; }
        .elite-label { display: block; font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .elite-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 14px; transition: 0.2s; background: #f8fafc; color: #1e293b; font-weight: 600; }
        .elite-input:focus { border-color: #3b82f6; background: white; outline: none; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .elite-input:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .close-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; transition: 0.2s; color: #94a3b8; background: transparent; border: none; cursor: pointer; }
        .close-btn:hover { background: #fee2e2; color: #ef4444; }
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

      {createPortal(
        <AnimatePresence>
          {isWarehouseModalOpen && (
            <div className="modal-overlay" onClick={() => setIsWarehouseModalOpen(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="plan-builder-modal"
                style={{ maxWidth: '500px' }}
                onClick={e => e.stopPropagation()}
              >
                <form onSubmit={handleWarehouseSubmit}>
                  <header className="builder-header">
                    <div className="title-group">
                      <div className="icon-badge brand">
                        <Layout size={22} />
                      </div>
                      <div>
                        <h2>{selectedWarehouse ? 'Editar Depósito' : 'Novo Depósito'}</h2>
                        <p>Vincule este almoxarifado à fazenda {activeFarm?.nome}</p>
                      </div>
                    </div>
                    <button type="button" className="close-btn" onClick={() => setIsWarehouseModalOpen(false)}>
                      <X size={20} />
                    </button>
                  </header>

                  <div className="builder-body">
                    <div className="builder-section">
                      <div className="input-group-row">
                        <div className="field">
                          <label className="elite-label">Nome do Depósito</label>
                          <input name="nome" type="text" className="elite-input" placeholder="Ex: Almoxarifado Central" defaultValue={selectedWarehouse?.nome} required />
                        </div>
                        <div className="field">
                          <label className="elite-label">Descrição / Observações</label>
                          <textarea name="descricao" className="elite-input" style={{ height: '100px', resize: 'none' }} placeholder="Detalhes sobre a localização ou tipo de itens armazenados..." defaultValue={selectedWarehouse?.descricao}></textarea>
                        </div>
                        <div className="field">
                          <label className="elite-label">Fazenda Vinculada</label>
                          <input type="text" className="elite-input" value={activeFarm?.nome} disabled style={{ opacity: 0.6 }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <footer className="builder-footer">
                    <button type="button" className="text-btn" onClick={() => setIsWarehouseModalOpen(false)}>CANCELAR</button>
                    <button type="submit" className="primary-btn">
                      <CheckCircle2 size={18} />
                      SALVAR DEPÓSITO
                    </button>
                  </footer>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
