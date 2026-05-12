import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Layout, 
  Boxes, 
  CheckCircle2, 
  X,
  Edit3,
  Trash2,
  AlertTriangle,
  LayoutGrid,
  List as ListIcon,
  Filter,
  FileText,
  Package,
  Scale,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { FormModal } from '../../components/Forms/FormModal';
<<<<<<< HEAD
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';

export const WarehouseManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, applyTenantFilter, canCreate, insertPayload } = useFarmFilter();
=======
import { WarehouseFilterModal } from './components/WarehouseFilterModal';

export const WarehouseManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeTenantId, activeFarmId } = useTenant();
>>>>>>> 1fbbc88 (Elite ERP: Diamond Precision 5.0 - Sincronizacao Consolidada)
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
   const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('Todos');
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    occupation: 'all',
    types: []
  });

  const [farms, setFarms] = useState<any[]>([]);

  useEffect(() => {
<<<<<<< HEAD
    if (!activeFarmId && !isGlobalMode) return;
    fetchWarehouses();
    fetchFarms();
  }, [activeFarmId, isGlobalMode]);

  const fetchFarms = async () => {
    let query = supabase.from('fazendas').select('id, nome');
    query = applyTenantFilter(query);
    const { data } = await query;
=======
    if (!activeTenantId) return;
    fetchWarehouses();
    fetchFarms();
  }, [activeFarmId, activeTenantId, isGlobalMode]);

  const fetchFarms = async () => {
    if (!activeTenantId) return;
    const { data } = await supabase
      .from('fazendas')
      .select('id, nome')
      .eq('tenant_id', activeTenantId);
>>>>>>> 1fbbc88 (Elite ERP: Diamond Precision 5.0 - Sincronizacao Consolidada)
    if (data) setFarms(data);
  };

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
<<<<<<< HEAD
      let query = supabase.from('depositos').select(`
=======
      // Fetch warehouses, their movements AND the products involved to calculate value
      let query = supabase
        .from('depositos')
        .select(`
>>>>>>> 1fbbc88 (Elite ERP: Diamond Precision 5.0 - Sincronizacao Consolidada)
          *,
          movimentacoes_estoque (
            quantidade,
            tipo,
            produto_id,
            produtos (
              custo_medio
            )
          )
<<<<<<< HEAD
        `).order('nome', { ascending: true });
      query = applyFarmFilter(query);
      const { data, error } = await query;
=======
        `);

      if (isGlobalMode) {
        query = query.eq('tenant_id', activeTenantId);
      } else {
        query = query.eq('fazenda_id', activeFarmId).eq('tenant_id', activeTenantId);
      }

      const { data, error } = await query.order('nome', { ascending: true });
>>>>>>> 1fbbc88 (Elite ERP: Diamond Precision 5.0 - Sincronizacao Consolidada)

      if (data) {
        const processed = data.map((w: any) => {
          let valorTotal = 0;
          const saldo = w.movimentacoes_estoque?.reduce((acc: number, curr: any) => {
            const qty = Number(curr.quantidade);
            const isEntry = curr.tipo === 'IN' || curr.tipo === 'in';
            const prodValue = (curr.produtos?.custo_medio || 0) * qty;
            
            if (isEntry) {
              valorTotal += prodValue;
              return acc + qty;
            } else {
              valorTotal -= prodValue;
              return acc - qty;
            }
          }, 0) || 0;

          return { 
            ...w, 
            saldo_atual: saldo,
            valor_total: Math.max(0, valorTotal)
          };
        });
        setWarehouses(processed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreate && !selectedWarehouse) {
      alert('⚠️ Selecione uma unidade específica para criar um novo depósito. No modo Visão Global, o cadastro requer uma fazenda definida.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const payload = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
      status: formData.get('status'),
      fazenda_id: formData.get('fazenda_id') || activeFarmId,
      capacidade_maxima: Number(formData.get('capacidade_maxima') || 0),
      unidade_capacidade: formData.get('unidade_capacidade') || 'un',
      tipo: formData.get('tipo'),
      localizacao_tecnica: formData.get('localizacao_tecnica'),
      tenant_id: activeTenantId
    };

    // Check if inactivating and verify balance
    if (selectedWarehouse && payload.status === 'inativo' && selectedWarehouse.status === 'ativo') {
      const { data: balanceData, error: balanceError } = await supabase
        .from('movimentacoes_estoque')
        .select('quantidade, tipo')
        .eq('deposito_id', selectedWarehouse.id);

      if (!balanceError && balanceData) {
        const totalBalance = balanceData.reduce((acc, curr) => {
          return acc + (curr.tipo === 'IN' || curr.tipo === 'in' ? Number(curr.quantidade) : -Number(curr.quantidade));
        }, 0);

        if (totalBalance > 0) {
          alert(`Não é possível inativar o depósito "${selectedWarehouse.nome}" pois ele possui um saldo atual de ${totalBalance} itens em estoque. Zere o estoque antes de inativar.`);
          return;
        }
      }
    }

    if (selectedWarehouse) {
      const { error } = await supabase.from('depositos').update(payload).eq('id', selectedWarehouse.id);
      if (!error) {
        setIsModalOpen(false);
        fetchWarehouses();
      }
    } else {
      const { error } = await supabase.from('depositos').insert([{ ...payload, ...insertPayload }]);
      if (!error) {
        setIsModalOpen(false);
        fetchWarehouses();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este depósito?')) return;
    const { error } = await supabase.from('depositos').delete().eq('id', id);
    if (!error) fetchWarehouses();
  };

   const filteredWarehouses = warehouses.filter(w => {
    const matchesSearch = (w.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (w.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'Todos' || (w.tipo === activeTab);
    
    const matchesStatus = filterValues.status === 'all' || w.status === filterValues.status;
    
    const perc = w.capacidade_maxima > 0 ? (w.saldo_atual / w.capacidade_maxima) * 100 : 0;
    let matchesOccupation = true;
    if (filterValues.occupation === 'critical') matchesOccupation = perc > 90;
    else if (filterValues.occupation === 'high') matchesOccupation = perc > 70;
    else if (filterValues.occupation === 'low') matchesOccupation = perc < 20;

    const matchesTypes = filterValues.types.length === 0 || filterValues.types.includes(w.tipo);

    return matchesSearch && matchesTab && matchesStatus && matchesOccupation && matchesTypes;
  });

  const columns = [
    {
      header: 'Depósito / Estrutura',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider flex items-center gap-2">
            <span>{item.tipo}</span>
            <span className="text-slate-400">• {item.localizacao_tecnica || 'Sede'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Ocupação',
      accessor: (item: any) => {
        const perc = item.capacidade_maxima > 0 ? (item.saldo_atual / item.capacidade_maxima) * 100 : 0;
        return (
          <div className="flex flex-col gap-1 w-32">
            <div className="flex justify-between text-[10px] font-bold">
              <span>{Math.round(perc)}%</span>
              <span className="text-slate-400">{item.saldo_atual} {item.unidade_capacidade}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${perc > 90 ? 'bg-red-500' : perc > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(perc, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Patrimônio Armazenado',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <DollarSign size={14} className="text-emerald-500" />
          <span className="font-bold">R$ {Number(item.valor_total || 0).toLocaleString('pt-BR')}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'ativo' ? 'active' : ''}`}>
          {item.status === 'ativo' ? 'Operacional' : 'Inativo'}
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
            <Layout size={14} fill="currentColor" />
            <span>ELITE WAREHOUSE v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Depósitos</h1>
          <p className="page-subtitle">Configuração de almoxarifados, silos e centros de distribuição vinculados à unidade.</p>
        </div>
        <div className="page-actions">
          <button className="primary-btn" onClick={() => {
            setSelectedWarehouse(null);
            setIsModalOpen(true);
          }}>
            <Plus size={18} />
            NOVO DEPÓSITO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        <EliteStatCard 
          label="Depósitos Ativos" 
          value={warehouses.length} 
          icon={Layout} 
          color="hsl(var(--brand))"
          progress={100}
          change="Unidades de Armazenagem"
          periodLabel="Estrutura Atual"
        />
        <EliteStatCard 
          label="Capacidade Utilizada" 
          value={`${warehouses.reduce((acc, w) => acc + (w.capacidade_maxima > 0 ? (w.saldo_atual / w.capacidade_maxima) : 0), 0) / (warehouses.filter(w => w.capacidade_maxima > 0).length || 1) * 100 > 0 ? Math.round(warehouses.reduce((acc, w) => acc + (w.capacidade_maxima > 0 ? (w.saldo_atual / w.capacidade_maxima) : 0), 0) / (warehouses.filter(w => w.capacidade_maxima > 0).length || 1) * 100) : 0}%`} 
          icon={Boxes} 
          color="#3b82f6"
          progress={warehouses.reduce((acc, w) => acc + (w.capacidade_maxima > 0 ? (w.saldo_atual / w.capacidade_maxima) : 0), 0) / (warehouses.filter(w => w.capacidade_maxima > 0).length || 1) * 100}
          change="Média Global"
          periodLabel="Ocupação Real"
        />
        <EliteStatCard 
          label="Alertas de Manutenção" 
          value="2" 
          icon={AlertTriangle} 
          color="#f59e0b"
          progress={30}
          change="Estrutura Física"
          periodLabel="Checklists Pendentes"
        />
        <EliteStatCard 
          label="Valor Total em Estoque" 
          value="R$ 1.2M" 
          icon={Package} 
          color="#10b981"
          progress={85}
          change="Patrimônio Armazenado"
          periodLabel="Avaliação em Tempo Real"
        />
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          {['Todos', 'Galpão', 'Silo', 'Tanque', 'Outros'].map((type) => (
            <button 
              key={type}
              className={`elite-tab-item ${activeTab === type ? 'active' : ''}`} 
              onClick={() => setActiveTab(type)}
            >
              {type === 'Todos' ? 'Consolidado' : type}
            </button>
          ))}
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Pesquisar depósitos por nome ou descrição..." 
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
          <button className="icon-btn-secondary" title="Exportar Log">
            <FileText size={20} />
          </button>
          <WarehouseFilterModal 
            isOpen={showAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
            filters={filterValues}
            setFilters={setFilterValues}
          />
        </div>
      </div>

      <div className="management-content">
        {viewMode === 'list' ? (
          <ModernTable 
            data={filteredWarehouses}
            columns={columns}
            loading={loading}
            hideHeader={true}
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot edit" onClick={() => {
                  setSelectedWarehouse(item);
                  setIsModalOpen(true);
                }}>
                  <Edit3 size={18} />
                </button>
                <button className="action-dot delete" onClick={() => handleDelete(item.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          />
        ) : (
          <div className="warehouse-cards-grid animate-fade-in">
            {filteredWarehouses.map(w => (
              <div key={w.id} className={`warehouse-card-premium ${w.status === 'ativo' ? 'active' : ''}`}>
                <div className="card-left-section">
                  <div className="card-avatar">
                    {w.tipo?.includes('Silo') ? <Boxes size={28} /> : <Layout size={28} />}
                  </div>
                  <div className="card-bottom-actions">
                    <button className="action-icon-btn" onClick={() => {
                      setSelectedWarehouse(w);
                      setIsModalOpen(true);
                    }} title="Editar"><Edit3 size={16} /></button>
                    <button className="action-icon-btn delete" onClick={() => handleDelete(w.id)} title="Excluir"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="card-main-content">
                  <div className="card-header-info">
                    <div className="title-row">
                      <h3>{w.name || w.nome}</h3>
                      <span className={`status-pill mini ${w.status === 'ativo' ? 'active' : ''}`}>
                        {w.status === 'ativo' ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                    <div className="card-type-meta">{w.tipo || 'DEPÓSITO GERAL'}</div>
                  </div>

                  <div className="card-occupation-section">
                    <div className="occ-header">
                      <span>OCUPAÇÃO ATUAL</span>
                      <span className={w.capacidade_maxima > 0 && (w.saldo_atual / w.capacidade_maxima) > 0.9 ? 'critical' : ''}>
                        {w.capacidade_maxima > 0 ? Math.round((w.saldo_atual / w.capacidade_maxima) * 100) : 0}%
                      </span>
                    </div>
                    <div className="occ-bar-container">
                      <div 
                        className={`occ-bar-fill ${w.capacidade_maxima > 0 && (w.saldo_atual / w.capacidade_maxima) > 0.9 ? 'critical' : (w.saldo_atual / w.capacidade_maxima) > 0.7 ? 'warning' : ''}`}
                        style={{ width: `${Math.min(w.capacidade_maxima > 0 ? (w.saldo_atual / w.capacidade_maxima) * 100 : 0, 100)}%` }}
                      />
                    </div>
                    <div className="occ-footer">
                      {w.saldo_atual} / {w.capacidade_maxima || '∞'} {w.unidade_capacidade || 'un'}
                    </div>
                  </div>

                  <div className="card-footer-meta">
                    <div className="meta-item">
                      <Boxes size={12} />
                      <span>{w.localizacao_tecnica || 'Sede'}</span>
                    </div>
                    <div className="meta-item">
                      <Activity size={12} />
                      <span className="card-farm-meta">{isGlobalMode ? 'Multi-Fazenda' : (activeFarm?.name || 'Unidade')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button className="add-warehouse-card-premium" onClick={() => {
              setSelectedWarehouse(null);
              setIsModalOpen(true);
            }}>
              <Plus size={32} />
              <span>NOVO DEPÓSITO</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        .warehouse-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 8px;
        }

        @media (max-width: 1400px) {
          .warehouse-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .warehouse-cards-grid { grid-template-columns: 1fr; }
        }

        .warehouse-card-premium {
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

        .warehouse-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: #94a3b8;
          transition: 0.3s;
        }

        .warehouse-card-premium.active::before {
          background: #10b981;
          box-shadow: 4px 0 15px rgba(16, 185, 129, 0.3);
        }

        .warehouse-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.3);
        }

        .card-left-section {
          width: 110px;
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
          margin-bottom: 12px;
        }

        .card-main-content {
          flex: 1;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-header-info .title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .card-header-info h3 {
          font-size: 17px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .status-pill.mini {
          font-size: 9px;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .card-type-meta {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-occupation-section {
          margin: 10px 0;
        }

        .occ-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 4px;
          color: #64748b;
        }

        .occ-header .critical { color: #ef4444; }

        .occ-bar-container {
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .occ-bar-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 3px;
          transition: 0.5s;
        }

        .occ-bar-fill.warning { background: #f59e0b; }
        .occ-bar-fill.critical { background: #ef4444; }

        .occ-footer {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
        }

        .card-footer-meta {
          display: flex;
          gap: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }

        .view-mode-toggle {
          display: flex;
          background: #f8fafc;
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
          border: 1px solid hsl(var(--border));
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
          color: #94a3b8;
          cursor: pointer;
          transition: 0.2s;
        }

        .view-btn.active {
          background: white;
          color: #10b981;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          border: 1px solid rgba(16, 185, 129, 0.1);
        }

        .card-farm-meta {
          color: #10b981;
          font-weight: 800;
        }

        .card-bottom-actions {
          display: flex;
          gap: 8px;
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: hsl(var(--brand));
          color: white;
          border-color: hsl(var(--brand));
        }

        .action-icon-btn.delete:hover { background: #ef4444; border-color: #ef4444; }

        .add-warehouse-card-premium {
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
          height: 180px;
        }

        .add-warehouse-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-warehouse-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

      `}</style>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedWarehouse(null);
        }}
        onSubmit={handleSubmit}
        title={selectedWarehouse ? "Editar Depósito" : "Novo Depósito"}
        subtitle={`Vincule este almoxarifado à fazenda ${activeFarm?.nome}`}
        icon={Package}
        submitLabel={selectedWarehouse ? "Salvar Alterações" : "Confirmar Cadastro"}
        size="large"
      >
        <div className="elite-field-group">
          <label className="elite-label">
            <Plus size={14} /> NOME DO DEPÓSITO
          </label>
          <input name="nome" type="text" className="elite-input" placeholder="Ex: Almoxarifado Central" defaultValue={selectedWarehouse?.nome} required />
        </div>

        <div className="elite-field-group">
          <label className="elite-label">
            <Layout size={14} /> TIPO DE ESTRUTURA
          </label>
          <select name="tipo" className="elite-input" defaultValue={selectedWarehouse?.tipo || 'Galpão'}>
            <option value="Galpão">Galpão Geral</option>
            <option value="Silo">Silo de Grãos/Sementes</option>
            <option value="Câmara Fria">Câmara Fria</option>
            <option value="Tanque">Tanque de Líquidos</option>
            <option value="Defensivos">Defensivos</option>
          </select>
        </div>

        <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="elite-label">
            <FileText size={14} /> DESCRIÇÃO / FINALIDADE
          </label>
          <textarea name="descricao" className="elite-input" style={{ height: '50px', resize: 'none' }} placeholder="Detalhes estratégicos..." defaultValue={selectedWarehouse?.descricao}></textarea>
        </div>

        <div className="elite-field-group">
          <label className="elite-label">
            <Scale size={14} /> CAPACIDADE MÁXIMA
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input name="capacidade_maxima" type="number" className="elite-input" style={{ flex: 1 }} placeholder="0.00" defaultValue={selectedWarehouse?.capacidade_maxima} />
            <select name="unidade_capacidade" className="elite-input" style={{ width: '75px' }} defaultValue={selectedWarehouse?.unidade_capacidade || 'un'}>
              <option value="un">un</option>
              <option value="kg">kg</option>
              <option value="ton">ton</option>
              <option value="L">L</option>
              <option value="m³">m³</option>
            </select>
          </div>
        </div>

        <div className="elite-field-group">
          <label className="elite-label">
            <Plus size={14} /> LOCALIZAÇÃO TÉCNICA / GPS
          </label>
          <input name="localizacao_tecnica" type="text" className="elite-input" placeholder="Ex: Setor Norte, Lote 14..." defaultValue={selectedWarehouse?.localizacao_tecnica} />
        </div>

        <div className="elite-field-group">
          <label className="elite-label">
            <Layout size={14} /> FAZENDA VINCULADA
          </label>
          <select name="fazenda_id" className="elite-input" defaultValue={selectedWarehouse?.fazenda_id || activeFarm?.id} required>
            <option value="">Selecione...</option>
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>

        <div className="elite-field-group">
          <label className="elite-label">
            <Activity size={14} /> STATUS DO ATIVO
          </label>
          <div className="elite-form-radio-group">
            <input type="hidden" name="status" value={selectedWarehouse?.status || 'ativo'} />
            <div 
              className={`elite-form-radio-item ${(selectedWarehouse?.status || 'ativo') === 'ativo' ? 'active' : ''}`}
              onClick={(e) => {
                const hiddenInput = e.currentTarget.parentElement?.querySelector('input[name="status"]') as HTMLInputElement;
                if (hiddenInput) hiddenInput.value = 'ativo';
                const items = e.currentTarget.parentElement?.querySelectorAll('.elite-form-radio-item');
                items?.forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
              }}
            >
              <CheckCircle2 size={16} /> OPERACIONAL
            </div>
            <div 
              className={`elite-form-radio-item ${(selectedWarehouse?.status || 'ativo') === 'inativo' ? 'active' : ''}`}
              onClick={(e) => {
                const hiddenInput = e.currentTarget.parentElement?.querySelector('input[name="status"]') as HTMLInputElement;
                if (hiddenInput) hiddenInput.value = 'inativo';
                const items = e.currentTarget.parentElement?.querySelectorAll('.elite-form-radio-item');
                items?.forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
              }}
            >
              <X size={16} /> INATIVO
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
};
