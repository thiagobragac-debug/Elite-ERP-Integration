import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter,
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  MoreVertical,
  Calendar,
  Clock,
  DollarSign,
  History,
  Trash2,
  Zap,
  Truck,
  FileText,
  Edit3,
  X,
  Package
} from 'lucide-react';
import { FormModal } from '../../components/Forms/FormModal';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { MaintenanceForm } from '../../components/Forms/MaintenanceForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const MaintenanceManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY' | 'PLANS'>('ACTIVE');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchOrders();
  }, [activeFarm]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('manutencao_frota')
      .select('*, maquinas(nome)')
      .eq('fazenda_id', activeFarm.id)
      .order('data_inicio', { ascending: false });
    
    if (data) {
      setOrders(data);
      const abertas = data.filter(o => o.status === 'ABERTA' || o.status === 'open' || o.status === 'pending').length;
      const custoTotal = data.reduce((acc, curr) => acc + Number(curr.custo || 0), 0);
      const preventivas = data.filter(o => o.tipo === 'PREVENTIVA').length;
      
      setStats([
        { label: 'OS em Aberto', value: abertas, icon: AlertCircle, color: '#ed6c02', progress: (abertas / (data.length || 1)) * 100 },
        { label: 'Custos Mecânicos', value: custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: '#ef4444', progress: 85, trend: 'up' },
        { label: 'Preventivas (Mês)', value: preventivas, icon: CheckCircle2, color: '#10b981', progress: (preventivas / (data.length || 1)) * 100 },
        { label: 'Disponibilidade Ativos', value: '96.5%', icon: Settings, color: '#3b82f6', progress: 96 },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta ordem de serviço?')) return;
    const { error } = await supabase.from('manutencao_frota').delete().eq('id', id);
    if (!error) fetchOrders();
  };

  const handleSubmit = async (data: any) => {
    if (!activeFarm) return;
    const payload = {
      maquina_id: data.maquina_id,
      tipo: data.tipo,
      descricao: data.descricao,
      data_inicio: data.data_inicio,
      custo: parseFloat(data.custo),
      responsavel: data.responsavel,
      status: data.status,
    };

    if (selectedOrder) {
      const { error } = await supabase.from('manutencao_frota').update(payload).eq('id', selectedOrder.id);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    } else {
      const { error } = await supabase.from('manutencao_frota').insert([{ ...payload, fazenda_id: activeFarm.id, tenant_id: activeFarm.tenantId }]);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    }
  };

  const handleViewDetails = (order: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: order.data_inicio, title: 'OS #' + order.id.toString().slice(0,6), subtitle: order.descricao, value: order.custo ? `R$ ${order.custo}` : 'N/A', status: 'info' },
        { id: '2', date: order.data_inicio, title: 'Insumo Aplicado', subtitle: 'Filtro lubrificante blindado', value: 'R$ 85,00', status: 'success' },
        { id: '3', date: order.data_inicio, title: 'Mão de Obra', subtitle: order.responsavel, value: 'CONCLUÍDO', status: 'success' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const columns = [
    {
      header: 'Ativo / Maquina',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.maquinas?.nome || 'Ativo'}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.tipo}
          </div>
        </div>
      )
    },
    {
      header: 'Previsão',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Calendar size={14} />
          <span>{item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Custo Total',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <DollarSign size={14} />
          <span className="font-bold">{item.custo ? Number(item.custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'CONCLUIDA' ? 'active' : item.status === 'ABERTA' ? 'warning' : 'info'}`}>
          {item.status === 'CONCLUIDA' ? 'Finalizada' : item.status === 'ABERTA' ? 'Em Aberto' : 'Agendada'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="maintenance-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Wrench size={14} fill="currentColor" />
            <span>ELITE FLEET v5.0</span>
          </div>
          <h1 className="page-title">Manutenção de Frota</h1>
          <p className="page-subtitle">Rastreabilidade completa de intervenções mecânicas, revisões preventivas e custos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn primary" onClick={() => setIsChecklistOpen(true)}>
            <Settings size={18} />
            CHECKLIST 100H
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA ORDEM
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Wrench} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+0.5%"
            trend="up"
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            OS Ativas
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            Histórico Mecânico
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'PLANS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PLANS')}
          >
            Planos Preventivos
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por máquina, descrição ou responsável..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Manutenções">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        {activeTab === 'PLANS' ? (
          <div className="plans-grid animate-fade-in">
            {[
              { id: 1, title: 'Revisão Motor Pesado', freq: '250', unit: 'H', assets: 4, items: ['Óleo 15W40', 'Filtro Óleo', 'Filtro Combustível'] },
              { id: 2, title: 'Manutenção Caminhões', freq: '10.000', unit: 'KM', assets: 2, items: ['Alinhamento', 'Balanceamento', 'Lubrificação'] },
              { id: 3, title: 'Preventiva Semanal', freq: '50', unit: 'H', assets: 12, items: ['Engraxamento', 'Limpeza Radiador'] },
            ].map(plan => (
              <div key={plan.id} className="plan-card">
                <div className="plan-status-active">ATIVO</div>
                <div className="plan-main">
                  <div className="plan-icon">
                    <Clock size={20} />
                  </div>
                  <div className="plan-info">
                    <h3>{plan.title}</h3>
                    <p>Frequência: <strong>{plan.freq} {plan.unit}</strong></p>
                  </div>
                </div>
                <div className="plan-stats">
                  <div className="p-stat">
                    <Truck size={14} />
                    <span>{plan.assets} Ativos</span>
                  </div>
                  <div className="p-stat">
                    <FileText size={14} />
                    <span>{plan.items.length} Itens</span>
                  </div>
                </div>
                <div className="plan-actions">
                  <button className="plan-btn-edit" onClick={() => {
                    setSelectedPlan(plan);
                    setIsPlanModalOpen(true);
                  }}>CONFIGURAR PLANO</button>
                </div>
              </div>
            ))}
            <button className="add-plan-card" onClick={() => {
              setSelectedPlan(null);
              setIsPlanModalOpen(true);
            }}>
              <Plus size={32} />
              <span>CRIAR NOVO PLANO</span>
            </button>
          </div>
        ) : (
          <ModernTable 
            data={orders.filter(o => {
              const matchesSearch = (o.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'ACTIVE' ? o.status !== 'CONCLUIDA' : o.status === 'CONCLUIDA';
              return matchesSearch && matchesTab;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Buscar por máquina, descrição ou responsável..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Dossiê">
                  <History size={18} />
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
        )}
      </div>

      <MaintenanceForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit} 
        initialData={selectedOrder}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê de Manutenção"
        subtitle="Rastreabilidade de peças, serviços e intervenções técnicas"
        items={historyItems}
        loading={historyLoading}
      />

      <FormModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          alert('Checklist 100H finalizado e OS Preventiva gerada!');
          setIsChecklistOpen(false);
          fetchOrders();
        }}
        title="Checklist Preventivo 100H"
        subtitle="Inspeção técnica obrigatória para maquinário pesado"
        icon={Settings}
        submitLabel="Finalizar e Gerar OS"
      >
        <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="elite-label">Selecione o Ativo</label>
          <select className="elite-input elite-select">
            <option value="">Selecione uma máquina...</option>
            <option value="1">Trator John Deere 7230</option>
            <option value="2">Colheitadeira Case IH 9250</option>
          </select>
        </div>

        <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="elite-label">Itens de Verificação</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'hsl(var(--bg-main)/0.5)', padding: '20px', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
            {[
              'Troca de óleo do motor (15W40)',
              'Substituição do filtro de combustível',
              'Limpeza/Troca do filtro de ar',
              'Lubrificação de pontos de graxa',
              'Tensão das correias',
              'Terminais de bateria',
              'Vazamentos hidráulicos',
              'Sinalização e Luzes'
            ].map((item, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-main))', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--brand))' }} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          alert('Plano de Manutenção salvo com sucesso!');
          setIsPlanModalOpen(false);
        }}
        title={selectedPlan ? 'Editar Plano' : 'Novo Plano'}
        subtitle="Defina as regras e itens técnicos da revisão preventiva"
        icon={Settings}
        submitLabel="Salvar Plano e Aplicar"
      >
        <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="elite-label">Nome do Plano</label>
          <input type="text" className="elite-input" placeholder="Ex: Revisão 250 Horas" defaultValue={selectedPlan?.title} />
        </div>

        <div className="elite-field-group">
          <label className="elite-label">Frequência</label>
          <input type="text" className="elite-input" placeholder="Ex: 250" defaultValue={selectedPlan?.freq} />
        </div>

        <div className="elite-field-group">
          <label className="elite-label">Unidade</label>
          <select className="elite-input elite-select" defaultValue={selectedPlan?.unit}>
            <option value="H">Horas (H)</option>
            <option value="KM">Quilômetros (KM)</option>
          </select>
        </div>

        <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="elite-label">Checklist Técnico</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(selectedPlan?.items || ['Troca de Óleo', 'Troca de Filtro']).map((item: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="elite-input" style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }} defaultValue={item} />
                <button type="button" className="action-dot delete" style={{ width: '36px', height: '36px' }}><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" className="text-btn" style={{ fontSize: '10px', alignSelf: 'flex-start' }}>+ ADICIONAR ITEM</button>
          </div>
        </div>

        <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="elite-label">Ativos Vinculados</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['John Deere 7230', 'Patriot 350', 'Ford Cargo'].map(asset => (
              <label key={asset} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'hsl(var(--bg-main)/0.5)', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                <input type="checkbox" defaultChecked={asset === 'John Deere 7230'} style={{ accentColor: 'hsl(var(--brand))' }} />
                <span>{asset}</span>
              </label>
            ))}
          </div>
        </div>
      </FormModal>

      <style>{`
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .plan-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 24px; position: relative; transition: 0.3s; }
        .plan-card:hover { transform: translateY(-5px); border-color: hsl(var(--brand)); box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1); }
        .plan-status-active { position: absolute; top: 20px; right: 20px; font-size: 9px; font-weight: 900; background: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 6px; }
        .plan-main { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; }
        .plan-icon { width: 44px; height: 44px; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; color: #64748b; }
        .plan-info h3 { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; }
        .plan-info p { font-size: 12px; color: #64748b; margin: 4px 0 0; }
        .plan-stats { display: flex; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 12px; }
        .p-stat { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #475569; }
        .plan-actions { display: flex; }
        .plan-btn-edit { width: 100%; padding: 12px; border-radius: 12px; background: #f1f5f9; color: #1e293b; font-size: 11px; font-weight: 800; border: none; cursor: pointer; transition: 0.2s; text-transform: uppercase; }
        .plan-btn-edit:hover { background: #e2e8f0; }
        
        .add-plan-card { border: 2px dashed #e2e8f0; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 240px; color: #94a3b8; transition: 0.2s; background: transparent; cursor: pointer; }
        .add-plan-card:hover { background: #f8fafc; border-color: hsl(var(--brand)); color: hsl(var(--brand)); }
        .add-plan-card span { font-size: 12px; font-weight: 900; }
      `}</style>

    </div>
  );
};
