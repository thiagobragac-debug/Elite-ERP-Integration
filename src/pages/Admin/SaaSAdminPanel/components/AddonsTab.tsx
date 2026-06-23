import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../lib/supabase';
import { ModernTable } from '../../../../components/DataTable/ModernTable';
import { Plus, Edit2, Trash2, LayoutGrid, Search, List as ListIcon, Filter, Globe, Star, DollarSign, Package } from 'lucide-react';
import { EmptyState } from '../../../../components/Feedback/EmptyState';
import { ExportDropdown } from '../../../../components/UI/ExportDropdown';
import { TauzeStatCard } from '../../../../components/Cards/TauzeStatCard';
import toast from 'react-hot-toast';
import { SidePanel } from '../../../../components/Layout/SidePanel';
import { SAAS_MODULES } from '../../../../config/saasModules';

interface AddonsTabProps {
  showAdvancedFilters?: boolean;
  setShowAdvancedFilters?: (show: boolean) => void;
  filterValues?: any;
}

export const AddonsTab: React.FC<AddonsTabProps> = ({
  showAdvancedFilters = false,
  setShowAdvancedFilters = () => {},
  filterValues = {}
}) => {
  const [addons, setAddons] = useState<any[]>([]);
  const [plans, setPlans] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list'|'grid'>('list');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: string;
    price: string;
    billing_cycle: string;
    addition_value: string;
    eligible_plans: string[];
  }>({
    name: '',
    description: '',
    type: 'module',
    price: '',
    billing_cycle: 'monthly',
    addition_value: '',
    eligible_plans: [],
  });

  const fetchAddons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('saas_addons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAddons(data || []);
    } catch (err: any) {
      toast.error('Erro ao buscar add-ons.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase.from('saas_plans').select('name');
      if (error) throw error;
      
      // Filtra planos de teste (Trial) e planos ilimitados/administrativos
      const filteredPlans = data
        ?.map(p => p.name)
        .filter(name => !name.toLowerCase().includes('trial') && !name.toLowerCase().includes('admin'));
        
      setPlans(filteredPlans || []);
    } catch (err: any) {
      // Ignored empty catch to remove console.log
    }
  };

  useEffect(() => {
    fetchAddons();
    fetchPlans();
    
    const handleOpen = () => handleOpenModal();
    window.addEventListener('open-addon-modal', handleOpen);
    return () => window.removeEventListener('open-addon-modal', handleOpen);
  }, []);

  const handleOpenModal = (addon?: any) => {
    if (addon) {
      setEditingAddon(addon);
      
      let initialType = addon.type;
      // Normalização de legados no banco de dados
      if (initialType === 'Módulo') initialType = 'module';
      if (initialType === 'Serviço/Consultoria') initialType = 'service';
      if (initialType === 'Armazenamento') initialType = 'storage_gb';
      if (initialType === 'Recurso/Usuários') {
        if (addon.metadata?.animals) initialType = 'animals';
        else initialType = 'users';
      }

      let initialValue = '';
      if (addon.metadata) {
        if ('module_id' in addon.metadata) {
          initialType = 'module';
          initialValue = addon.metadata.module_id;
        } else if ('users' in addon.metadata) {
          initialType = 'users';
          initialValue = addon.metadata.users?.toString() || '';
        } else if ('animals' in addon.metadata) {
          initialType = 'animals';
          initialValue = addon.metadata.animals?.toString() || '';
        } else if ('storage_gb' in addon.metadata) {
          initialType = 'storage_gb';
          initialValue = addon.metadata.storage_gb?.toString() || '';
        } else if (addon.metadata.addition_value) {
          initialValue = addon.metadata.addition_value?.toString() || '';
        }
      }

      setFormData({
        name: addon.name,
        description: addon.description || '',
        type: initialType,
        price: addon.price.toString(),
        billing_cycle: addon.billing_cycle,
        addition_value: initialValue,
        eligible_plans: addon.metadata?.eligible_plans || [],
      });
    } else {
      setEditingAddon(null);
      setFormData({
        name: '',
        description: '',
        type: 'module',
        price: '',
        billing_cycle: 'monthly',
        addition_value: '',
        eligible_plans: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.type) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      let metadata: any = {};
      if ((formData.type === 'users' || formData.type === 'animals' || formData.type === 'storage_gb') && formData.addition_value) {
        metadata = { [formData.type]: parseInt(formData.addition_value, 10) };
      } else if (formData.type === 'module' && formData.addition_value) {
        metadata = { module_id: formData.addition_value };
      }

      if (formData.eligible_plans.length > 0) {
        metadata.eligible_plans = formData.eligible_plans;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        price: parseFloat(formData.price),
        billing_cycle: formData.billing_cycle,
        metadata: metadata,
      };

      if (editingAddon) {
        const { error } = await supabase.from('saas_addons').update(payload).eq('id', editingAddon.id);
        if (error) throw error;
        toast.success('Módulo extra atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('saas_addons').insert([payload]);
        if (error) throw error;
        toast.success('Módulo extra criado com sucesso!');
      }
      setIsModalOpen(false);
      fetchAddons();
    } catch (err: any) {
      toast.error('Erro ao salvar add-on.');
      console.error(err);
    }
  };

  const handleDelete = (id: string) => {
    if (pendingDeleteId === id) {
      // Segunda clicada — confirma e executa
      setPendingDeleteId(null);
      supabase.from('saas_addons').delete().eq('id', id)
        .then(({ error }) => {
          if (error) {
            toast.error('Erro ao excluir módulo extra.');
            console.error(error);
          } else {
            toast.success('Módulo extra excluído com sucesso.');
            fetchAddons();
          }
        });
    } else {
      // Primeira clicada — entra em modo de confirmação
      setPendingDeleteId(id);
      toast(
        (t) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Clique em <strong>Excluir</strong> novamente para confirmar.</span>
            <button
              onClick={() => { toast.dismiss(t.id); setPendingDeleteId(null); }}
              style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </span>
        ),
        { duration: 4000, icon: '⚠️' }
      );
      // Auto-cancela após 4s
      setTimeout(() => setPendingDeleteId((prev) => prev === id ? null : prev), 4000);
    }
  };

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Descrição', accessor: (item: any) => <span style={{ color: '#64748b' }}>{item.description || '-'}</span> },
    { 
      header: 'Tipo', 
      accessor: (item: any) => {
        const typeLabels: any = {
          'module': 'Módulo Extra',
          'users': 'Pacote de Usuários',
          'animals': 'Pacote de Animais',
          'storage_gb': 'Pacote de Armazenamento',
          'service': 'Serviço',
          'feature': 'Recurso Extra (Legado)',
          'storage': 'Armazenamento (Legado)'
        };
        return (
          <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', background: 'hsl(var(--bg-main))' }}>
            {typeLabels[item.type] || item.type}
          </span>
        );
      }
    },
    { 
      header: 'Preço', 
      accessor: (item: any) => `R$ ${Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / ${item.billing_cycle === 'monthly' ? 'mês' : 'ano'}` 
    },
    {
      header: 'Ações',
      accessor: (item: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn-secondary" onClick={() => handleOpenModal(item)}>
            <Edit2 size={14} />
          </button>
          <button
            className="icon-btn-secondary"
            onClick={() => handleDelete(item.id)}
            title={pendingDeleteId === item.id ? 'Clique para confirmar exclusão' : 'Excluir'}
            style={{
              color: pendingDeleteId === item.id ? '#ffffff' : 'hsl(var(--danger))',
              background: pendingDeleteId === item.id ? 'hsl(var(--danger))' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filterValues.addonType && filterValues.addonType !== 'all') count++;
    if (filterValues.addonBilling && filterValues.addonBilling !== 'all') count++;
    if (filterValues.minPrice !== undefined && filterValues.minPrice > 0) count++;
    if (filterValues.maxPrice !== undefined && filterValues.maxPrice < 10000) count++;
    return count;
  }, [filterValues]);

  const [localStatusFilter, setLocalStatusFilter] = React.useState<'all' | 'global' | 'exclusive'>('all');

  const filteredAddonsBase = addons.filter(addon => {
    // Busca por texto
    const matchesSearch = addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (addon.description && addon.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Filtros Avançados
    if (filterValues.addonType && filterValues.addonType !== 'all') {
      if (addon.type !== filterValues.addonType) return false;
    }

    if (filterValues.addonBilling && filterValues.addonBilling !== 'all') {
      if (addon.billing_cycle !== filterValues.addonBilling) return false;
    }

    if (filterValues.minPrice !== undefined && Number(addon.price) < filterValues.minPrice) {
      return false;
    }

    if (filterValues.maxPrice !== undefined && Number(addon.price) > filterValues.maxPrice) {
      return false;
    }

    return true;
  });

  const filteredAddons = React.useMemo(() => {
    let list = filteredAddonsBase;
    if (localStatusFilter !== 'all') {
      list = list.filter((a: any) => {
        const isGlobal = !a.metadata?.eligible_plans || a.metadata.eligible_plans.length === 0;
        if (localStatusFilter === 'global') return isGlobal;
        if (localStatusFilter === 'exclusive') return !isGlobal;
        return true;
      });
    }
    return list;
  }, [filteredAddonsBase, localStatusFilter]);

  // --- STATS CALCULATION ---
  const averagePrice = addons.length > 0 
    ? addons.reduce((sum, a) => sum + (Number(a.price) || 0), 0) / addons.length
    : 0;
  const globalAddonsCount = addons.filter(a => !a.metadata?.eligible_plans || a.metadata.eligible_plans.length === 0).length;
  const exclusiveAddonsCount = addons.length - globalAddonsCount;
  // -------------------------

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="saas-view-wrapper"
      style={{ width: '100%' }}
    >
      <div
        className="dashboard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        <TauzeStatCard
          label="Total de Módulos Extras"
          value={addons.length.toString()}
          icon={Package}
          color="hsl(var(--brand))"
        />
        <TauzeStatCard
          label="Módulos Globais (Todos Planos)"
          value={globalAddonsCount.toString()}
          icon={Globe}
          color="#10b981"
        />
        <TauzeStatCard
          label="Módulos Exclusivos (Restritos)"
          value={exclusiveAddonsCount.toString()}
          icon={Star}
          color="#f59e0b"
        />
        <TauzeStatCard
          label="Ticket Médio (Add-ons)"
          value={`R$ ${averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="#3b82f6"
        />
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          {(['all', 'global', 'exclusive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setLocalStatusFilter(status)}
              className={`tauze-tab-item ${localStatusFilter === status ? 'active' : ''}`}
            >
              {status === 'all' ? 'Todos' : status === 'global' ? 'Globais' : 'Exclusivos'}
            </button>
          ))}
        </div>

        <div className="tauze-search-wrapper" style={{ flex: 1 }}>
          <Search size={18} className="s-icon" />
          <input
            className="tauze-search-input"
            type="text"
            placeholder="Buscar módulo extra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
              style={{ position: 'relative' }}
            >
              <Filter size={20} />
              {activeFilterCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9px',
                  background: 'hsl(var(--brand))',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  lineHeight: '1',
                  pointerEvents: 'none',
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            <ExportDropdown onExport={(format) => {
              console.log('Exporting addons as', format);
              toast.success(`Exportação em ${format.toUpperCase()} iniciada!`);
            }} />
          </div>
        </div>
      </div>

      <ModernTable
        data={filteredAddons}
        columns={columns}
        loading={loading}
        emptyState={
          <EmptyState
            title="Nenhum Add-on encontrado"
            description="Crie seu primeiro módulo extra ou altere os filtros de busca."
            icon={Search}
            actionLabel="Criar Add-on"
            onAction={() => handleOpenModal()}
          />
        }
      />

      <SidePanel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddon ? 'Editar Módulo Extra' : 'Novo Módulo Extra'}
        icon={LayoutGrid}
        onSubmit={handleSave}
        submitLabel="Salvar"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="tauze-field-group">
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>NOME DO RECURSO</label>
            <input 
              className="tauze-input" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              placeholder="Ex: Armazenamento Extra 10GB" 
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="tauze-field-group">
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>TIPO DE MÓDULO</label>
              <select className="tauze-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                <option value="module">Módulo Adicional do Sistema</option>
                <option value="users">Pacote de Usuários Extras</option>
                <option value="animals">Pacote de Animais Extras</option>
                <option value="storage_gb">Pacote de Armazenamento (GB)</option>
                <option value="service">Serviço / Consultoria</option>
              </select>
            </div>
            <div className="tauze-field-group">
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>CICLO DE FATURAMENTO</label>
              <select className="tauze-input" value={formData.billing_cycle} onChange={e => setFormData({ ...formData, billing_cycle: e.target.value })}>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
                <option value="one_time">Taxa Única</option>
              </select>
            </div>
            <div className="tauze-field-group">
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>PREÇO (R$)</label>
              <input 
                className="tauze-input" 
                type="number" 
                step="0.01" 
                value={formData.price} 
                onChange={e => setFormData({ ...formData, price: e.target.value })} 
                placeholder="0.00" 
                required
              />
            </div>
          </div>

          {formData.type === 'module' && (
            <div className="tauze-field-group animate-slide-up" style={{ padding: '16px', background: 'hsl(var(--brand) / 0.05)', borderRadius: '8px', border: '1px solid hsl(var(--brand) / 0.1)' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--brand))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LayoutGrid size={12} /> CONFIGURAÇÃO DO MÓDULO
              </label>
              <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
                Selecione qual módulo ou submódulo do sistema será liberado para o cliente que assinar este pacote.
              </p>
              
              <select 
                className="tauze-input" 
                value={formData.addition_value} 
                onChange={e => setFormData({ ...formData, addition_value: e.target.value })}
              >
                <option value="">Selecione um módulo...</option>
                {SAAS_MODULES.map(module => (
                  <optgroup key={module.id} label={module.label}>
                    <option value={module.id}>Módulo Completo: {module.label}</option>
                    {module.submodules.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {(formData.type === 'users' || formData.type === 'animals' || formData.type === 'storage_gb') && (
            <div className="tauze-field-group animate-slide-up" style={{ padding: '16px', background: 'hsl(var(--brand) / 0.05)', borderRadius: '8px', border: '1px solid hsl(var(--brand) / 0.1)' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--brand))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={12} /> QUANTIDADE ADICIONAL ({formData.type.toUpperCase()})
              </label>
              <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
                Qual a quantidade que este pacote irá adicionar aos limites do cliente?
              </p>
              
              <input 
                className="tauze-input" 
                type="number" 
                value={formData.addition_value} 
                onChange={e => setFormData({ ...formData, addition_value: e.target.value })} 
                placeholder="Ex: 500" 
              />
            </div>
          )}

          <div className="tauze-field-group">
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>PLANOS ELEGÍVEIS</label>
            <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
              Selecione quais planos podem visualizar/comprar este módulo. Se nenhum for selecionado, será visível para todos.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'hsl(var(--bg-main))', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {plans.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Nenhum plano cadastrado.</span>
              ) : (
                plans.map((plan, index) => {
                  const isSelected = formData.eligible_plans.includes(plan);
                  const PLAN_COLORS = [
                    'hsl(var(--brand))', // primary
                    '#3b82f6', // blue
                    '#a855f7', // purple
                    '#f59e0b', // amber
                    '#ec4899', // pink
                    '#06b6d4', // cyan
                    'hsl(var(--danger))', // red
                    '#14b8a6', // teal
                  ];
                  const color = PLAN_COLORS[index % PLAN_COLORS.length];
                  
                  return (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          eligible_plans: isSelected 
                            ? prev.eligible_plans.filter(p => p !== plan)
                            : [...prev.eligible_plans, plan]
                        }));
                      }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: `1px solid ${isSelected ? color : 'var(--border)'}`,
                        background: isSelected ? color : 'hsl(var(--bg-card))',
                        color: isSelected ? '#ffffff' : 'hsl(var(--text-muted))',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                        width: '100%',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {plan}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="tauze-field-group">
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>DESCRIÇÃO</label>
            <textarea 
              className="tauze-input" 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Descreva o que o cliente ganha ao assinar..."
              style={{ minHeight: '80px' }}
            />
          </div>
        </div>
      </SidePanel>
    </motion.div>
  );
};
