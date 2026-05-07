import { useState, useEffect } from 'react';
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
  FileText
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
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    categoria: 'all',
    status: 'all'
  });
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchProducts();
  }, [activeFarm]);

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
            progress: (abaixoMinimo / data.length) * 100, 
            trend: 'down',
            change: 'Crítico/Minimo',
            periodLabel: 'Alertas Reposição',
            sparkline: [
              { value: 10, label: '1' }, { value: 20, label: '3' }, { value: 5, label: '0' }, 
              { value: 30, label: '5' }, { value: 15, label: '2' }, { value: 25, label: '4' }, 
              { value: 10, label: '1' }, { value: (abaixoMinimo / data.length) * 100, label: abaixoMinimo + ' abaixo do min.' }
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
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO ITEM
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
              className={`elite-tab-item ${activeCategory === cat ? 'active' : ''}`} 
              onClick={() => setActiveCategory(cat)}
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
        <ModernTable 
          data={products.filter(p => {
            const matchesSearch = (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategoryTab = activeCategory === 'All' || p.categoria === activeCategory;
            
            // Advanced Filters
            const matchesCategoria = filterValues.categoria === 'all' || p.categoria === filterValues.categoria;
            const matchesStatus = filterValues.status === 'all' || 
                                 (filterValues.status === 'critico' ? Number(p.quantidade_atual) <= Number(p.quantidade_minima) : Number(p.quantidade_atual) > Number(p.quantidade_minima));

            return matchesSearch && matchesCategoryTab && matchesCategoria && matchesStatus;
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
      </div>

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
