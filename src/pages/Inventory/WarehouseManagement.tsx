import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const WarehouseManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [farms, setFarms] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchWarehouses();
    fetchFarms();
  }, [activeFarm]);

  const fetchFarms = async () => {
    if (!activeFarm) return;
    const { data } = await supabase
      .from('fazendas')
      .select('id, nome')
      .eq('tenant_id', activeFarm.tenantId || activeFarm.tenant_id);
    if (data) setFarms(data);
  };

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      // Fetch warehouses and calculate current balance per warehouse
      const { data, error } = await supabase
        .from('depositos')
        .select(`
          *,
          movimentacoes_estoque (
            quantidade,
            tipo
          )
        `)
        .eq('fazenda_id', activeFarm.id)
        .order('nome', { ascending: true });

      if (data) {
        const processed = data.map((w: any) => {
          const saldo = w.movimentacoes_estoque?.reduce((acc: number, curr: any) => {
            return acc + (curr.tipo === 'IN' || curr.tipo === 'in' ? Number(curr.quantidade) : -Number(curr.quantidade));
          }, 0) || 0;
          return { ...w, saldo_atual: saldo };
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
    if (!activeFarm) return;
    const formData = new FormData(e.currentTarget);
    const payload = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
      status: formData.get('status'),
      fazenda_id: formData.get('fazenda_id') || activeFarm.id,
      capacidade_maxima: Number(formData.get('capacidade_maxima') || 0),
      unidade_capacidade: formData.get('unidade_capacidade') || 'un',
      tipo: formData.get('tipo'),
      localizacao_tecnica: formData.get('localizacao_tecnica'),
      tenant_id: activeFarm.tenantId
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
      const { error } = await supabase.from('depositos').insert([payload]);
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

  const filteredWarehouses = warehouses.filter(w => 
    w.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.descricao || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Nome do Depósito',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {activeFarm?.nome}
          </div>
        </div>
      )
    },
    {
      header: 'Descrição',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <span>{item.descricao || 'Sem descrição'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'ativo' ? 'active' : ''}`}>
          {item.status === 'ativo' ? 'Ativo' : 'Inativo'}
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
      </div>

      <div className="elite-controls-row">
        <div className="elite-search-wrapper" style={{ flex: 1 }}>
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
        </div>
      </div>

      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="advanced-filter-panel"
            style={{ marginBottom: '20px', overflow: 'hidden' }}
          >
            <div className="filter-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              background: 'hsl(var(--bg-card))',
              padding: '24px',
              borderRadius: '24px',
              border: '1px solid hsl(var(--border))'
            }}>
              <div className="filter-field">
                <label className="elite-label">Status do Depósito</label>
                <select className="elite-input elite-select">
                  <option value="all">Todos os Status</option>
                  <option value="active">Apenas Ativos</option>
                  <option value="inactive">Apenas Inativos</option>
                </select>
              </div>
              <div className="filter-field">
                <label className="elite-label">Ocupação</label>
                <select className="elite-input elite-select">
                  <option value="all">Qualquer Ocupação</option>
                  <option value="high">Alta (&gt; 80%)</option>
                  <option value="low">Baixa (&lt; 20%)</option>
                </select>
              </div>
              <div className="filter-actions-inline" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="text-btn" onClick={() => setShowAdvancedFilters(false)}>LIMPAR FILTROS</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="warehouse-grid animate-fade-in">
            {filteredWarehouses.map(w => (
              <div key={w.id} className="warehouse-card">
                <div className="type-badge">{w.tipo || 'Galpão'}</div>
                <div className="w-icon">
                  <Layout size={24} />
                </div>
                <div className="w-info">
                  <h3>{w.nome}</h3>
                  <p>{w.descricao || 'Sem descrição cadastrada'}</p>
                </div>

                {w.capacidade_maxima > 0 && (
                  <div className="occupation-wrapper" style={{ marginBottom: '20px' }}>
                    <div className="m-item" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px' }}>OCUPAÇÃO ATUAL</span>
                      <span style={{ fontWeight: 800 }}>{Math.round((w.saldo_atual / w.capacidade_maxima) * 100)}%</span>
                    </div>
                    <div className="occupation-bar">
                      <div 
                        className={`occupation-fill ${(w.saldo_atual / w.capacidade_maxima) > 0.9 ? 'danger' : (w.saldo_atual / w.capacidade_maxima) > 0.7 ? 'warning' : ''}`}
                        style={{ width: `${Math.min((w.saldo_atual / w.capacidade_maxima) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="sub-meta" style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {w.saldo_atual} / {w.capacidade_maxima} {w.unidade_capacidade || 'un'}
                    </div>
                  </div>
                )}

                <div className="w-meta">
                  <div className="m-item">
                    <Boxes size={14} />
                    <span>{w.localizacao_tecnica || 'Localização não definida'}</span>
                  </div>
                  <div className="m-item">
                    <div className={`status-dot ${w.status === 'ativo' ? 'active' : ''}`} />
                    <span>{w.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
                <div className="w-actions">
                  <button onClick={() => {
                    setSelectedWarehouse(w);
                    setIsModalOpen(true);
                  }}>EDITAR</button>
                  <button className="delete" onClick={() => handleDelete(w.id)}>EXCLUIR</button>
                </div>
              </div>
            ))}
            <button className="add-warehouse-card" onClick={() => {
              setSelectedWarehouse(null);
              setIsModalOpen(true);
            }}>
              <Plus size={32} />
              <span>CRIAR NOVO DEPÓSITO</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        .view-mode-toggle {
          display: flex;
          background: hsl(var(--bg-main));
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
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
          background: white;
          color: hsl(var(--brand));
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .elite-filter-group {
          display: flex;
          gap: 8px;
          margin-left: 8px;
        }

        .icon-btn-secondary {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .icon-btn-secondary:hover {
          background: hsl(var(--bg-main));
          color: hsl(var(--brand));
          border-color: hsl(var(--brand) / 0.3);
        }

        .icon-btn-secondary.active {
          background: hsl(var(--brand) / 0.1);
          color: hsl(var(--brand));
          border-color: hsl(var(--brand));
        }

        .warehouse-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .warehouse-card { background: white; border-radius: 24px; padding: 24px; border: 1px solid #e2e8f0; position: relative; transition: 0.3s; }
        .warehouse-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1); border-color: hsl(var(--brand)); }
        .w-icon { width: 50px; height: 50px; background: #f8fafc; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #64748b; margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .w-info h3 { font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; }
        .w-info p { font-size: 12px; color: #64748b; margin: 4px 0 20px; min-height: 36px; }
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

        .occupation-bar { width: 100%; height: 6px; background: #f1f5f9; border-radius: 3px; margin: 12px 0; overflow: hidden; }
        .occupation-fill { height: 100%; background: hsl(var(--brand)); border-radius: 3px; transition: 0.5s; }
        .occupation-fill.warning { background: #f59e0b; }
        .occupation-fill.danger { background: #ef4444; }
        .type-badge { position: absolute; top: 24px; right: 24px; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 20px; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; text-transform: uppercase; }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px); z-index: 10000; display: flex;
          align-items: center; justify-content: center; padding: 20px;
        }
        .plan-builder-modal {
          background: white; width: 100%; max-width: 850px;
          border-radius: 28px; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5);
          display: flex; flex-direction: column; max-height: 90vh;
        }
        .plan-builder-modal form {
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          width: 100%;
        }
        .builder-header { padding: 28px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .icon-badge.brand { background: #eff6ff; color: #3b82f6; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .builder-header h2 { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
        .builder-header p { font-size: 13px; color: #64748b; margin: 2px 0 0; }
        .builder-body { flex: 1; padding: 32px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
        .builder-footer { padding: 24px 32px; border-top: 1px solid #f1f5f9; background: #f8fafc; display: flex; justify-content: flex-end; gap: 16px; }
        .input-group-row { display: flex; flex-direction: column; gap: 20px; }
        .elite-label { display: block; font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .elite-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 14px; transition: 0.2s; background: #f8fafc; color: #1e293b; font-weight: 600; }
        .elite-input:focus { border-color: #3b82f6; background: white; outline: none; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .close-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; transition: 0.2s; color: #94a3b8; background: transparent; border: none; cursor: pointer; }
        .close-btn:hover { background: #fee2e2; color: #ef4444; }

        .form-section { display: flex; flex-direction: column; gap: 12px; padding: 16px 0; border-top: 1px solid #f1f5f9; }
        .form-section:first-child { border-top: none; padding-top: 0; }
        .section-title { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 4px; display: flex; align-items: center; gap: 10px; }
        .input-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .elite-label { margin-bottom: 0 !important; }
        
        /* Premium Scrollbar */
        .builder-body::-webkit-scrollbar { width: 6px; }
        .builder-body::-webkit-scrollbar-track { background: transparent; }
        .builder-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        
        .field .elite-input {
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          border-color: #e2e8f0;
        }
        
        .field .elite-input:hover {
          border-color: hsl(var(--brand) / 0.4);
        }
      `}</style>

      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="plan-builder-modal"
                onClick={e => e.stopPropagation()}
              >
                <form onSubmit={handleSubmit}>
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
                    <button type="button" className="close-btn" onClick={() => setIsModalOpen(false)}>
                      <X size={20} />
                    </button>
                  </header>

                  <div className="builder-body" style={{ padding: '20px 32px' }}>
                    {/* Seção 1: Identificação & Tipo */}
                    <div className="form-section">
                      <h3 className="section-title">Informações Básicas</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                        <div className="field">
                          <label className="elite-label">Nome do Depósito</label>
                          <input name="nome" type="text" className="elite-input" placeholder="Ex: Almoxarifado Central" defaultValue={selectedWarehouse?.nome} required />
                        </div>
                        <div className="field">
                          <label className="elite-label">Tipo de Estrutura</label>
                          <select name="tipo" className="elite-input" defaultValue={selectedWarehouse?.tipo || 'Galpão'}>
                            <option value="Galpão">Galpão Geral</option>
                            <option value="Silo">Silo de Grãos/Sementes</option>
                            <option value="Câmara Fria">Câmara Fria</option>
                            <option value="Tanque">Tanque de Líquidos</option>
                            <option value="Depósito de Defensivos">Depósito de Defensivos</option>
                          </select>
                        </div>
                      </div>
                      <div className="field">
                        <label className="elite-label">Descrição / Finalidade</label>
                        <textarea name="descricao" className="elite-input" style={{ height: '60px', resize: 'none' }} placeholder="Detalhes estratégicos..." defaultValue={selectedWarehouse?.descricao}></textarea>
                      </div>
                    </div>

                    {/* Seção 2: Engenharia & Logística */}
                    <div className="form-section">
                      <h3 className="section-title">Engenharia & Logística</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                        <div className="field">
                          <label className="elite-label">Capacidade Máxima</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input name="capacidade_maxima" type="number" className="elite-input" style={{ flex: 1 }} placeholder="0.00" defaultValue={selectedWarehouse?.capacidade_maxima} />
                            <select name="unidade_capacidade" className="elite-input" style={{ width: '75px', padding: '12px 8px' }} defaultValue={selectedWarehouse?.unidade_capacidade || 'un'}>
                              <option value="un">un</option>
                              <option value="kg">kg</option>
                              <option value="ton">ton</option>
                              <option value="L">L</option>
                              <option value="m³">m³</option>
                            </select>
                          </div>
                        </div>
                        <div className="field">
                          <label className="elite-label">Localização Técnica / GPS / Setor</label>
                          <input name="localizacao_tecnica" type="text" className="elite-input" placeholder="Ex: Setor Norte, Lote 14..." defaultValue={selectedWarehouse?.localizacao_tecnica} />
                        </div>
                      </div>
                    </div>

                    {/* Seção 3: Governança Operacional */}
                    <div className="form-section">
                      <h3 className="section-title">Governança Operacional</h3>
                      <div className="input-grid-2">
                        <div className="field">
                          <label className="elite-label">Fazenda Vinculada</label>
                          <select name="fazenda_id" className="elite-input" defaultValue={selectedWarehouse?.fazenda_id || activeFarm?.id} required>
                            <option value="">Selecione...</option>
                            {farms.map(f => (
                              <option key={f.id} value={f.id}>{f.nome}</option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label className="elite-label">Status do Ativo</label>
                          <select name="status" className="elite-input" defaultValue={selectedWarehouse?.status || 'ativo'}>
                            <option value="ativo">Operacional</option>
                            <option value="inativo">Inativo</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <footer className="builder-footer" style={{ padding: '32px 40px' }}>
                    <button type="button" className="text-btn" onClick={() => setIsModalOpen(false)}>DESCARTAR ALTERAÇÕES</button>
                    <button type="submit" className="primary-btn" style={{ padding: '14px 48px', minWidth: '220px', fontSize: '12px' }}>
                      <CheckCircle2 size={20} />
                      {selectedWarehouse ? 'ATUALIZAR DEPÓSITO' : 'CONFIRMAR CADASTRO'}
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
