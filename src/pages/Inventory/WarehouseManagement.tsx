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
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';

export const WarehouseManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, applyTenantFilter, canCreate, insertPayload } = useFarmFilter();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [farms, setFarms] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarmId && !isGlobalMode) return;
    fetchWarehouses();
    fetchFarms();
  }, [activeFarmId, isGlobalMode]);

  const fetchFarms = async () => {
    let query = supabase.from('fazendas').select('id, nome');
    query = applyTenantFilter(query);
    const { data } = await query;
    if (data) setFarms(data);
  };

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      let query = supabase.from('depositos').select(`
          *,
          movimentacoes_estoque (
            quantidade,
            tipo
          )
        `).order('nome', { ascending: true });
      query = applyFarmFilter(query);
      const { data, error } = await query;

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
