import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { supabase } from '../../lib/supabase';
import { Tag, Search, Plus, Trash2, Edit2, AlertTriangle, Layers, CheckCircle, XCircle, Database } from 'lucide-react'; 
import { useServerPagination } from '../../hooks/useServerPagination';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { SidePanel } from '../../components/Layout/SidePanel';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';

interface Categoria {
  id: string;
  modulo: string;
  nome: string;
  cor: string;
  is_active: boolean;
  modulo_vinculado?: string;
  is_system?: boolean;
  categoria_financeira_id?: string;
  tipo_item?: string;
}

export const CategorySettingsTab: React.FC<{ modulo: string, searchTerm: string, triggerCreate: number }> = ({ modulo, searchTerm, triggerCreate }) => {
  const { tenant } = useTenant();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = usePersistentState('CategoryManagement_isModalOpen', false);
  const [editItem, setEditItem] = useState<Categoria | null>(null);
  const [formData, setFormData] = usePersistentState('CategoryManagement_formData', {
    nome: '',
    cor: '#94a3b8',
    is_active: true,
    modulo_vinculado: '',
    categoria_financeira_id: '',
    tipo_item: 'ambos'
  });

  // Removed local modules list

  useEffect(() => {
    fetchCategorias();
  }, [tenant, modulo]);

  useEffect(() => {
    if (triggerCreate > 0) {
      handleOpenCreate();
    }
  }, [triggerCreate]);

  const fetchCategorias = async () => {
    if (!tenant) return;
    setLoading(true);
    
    try {
      const fetchPromise = supabase
        .from('categorias_sistema')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.id)
        .order('nome');

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) throw error;
      
      let fetchedData = data || [];
      
      // Auto-seed for financeiro, compras, parceiros, frota, racas, pecuaria or unidades if completely empty
      if (fetchedData.filter((c: any) => c.modulo === modulo).length === 0) {
        let defaultCategories: any[] = [];
        
        if (modulo === 'financeiro') {
          defaultCategories = [
            { tenant_id: tenant.id, modulo: 'financeiro', nome: 'Receita Operacional', cor: '#10b981', is_active: true },
            { tenant_id: tenant.id, modulo: 'financeiro', nome: 'Venda de Animais', cor: '#059669', is_active: true },
            { tenant_id: tenant.id, modulo: 'financeiro', nome: 'Despesa Administrativa', cor: '#f59e0b', is_active: true },
            { tenant_id: tenant.id, modulo: 'financeiro', nome: 'Nutrição Animal', cor: '#d97706', is_active: true },
            { tenant_id: tenant.id, modulo: 'financeiro', nome: 'Sanidade Animal', cor: '#b45309', is_active: true },
            { tenant_id: tenant.id, modulo: 'financeiro', nome: 'Insumos Agrícolas', cor: '#f97316', is_active: true },
            { tenant_id: tenant.id, modulo: 'financeiro', nome: 'Mão de Obra', cor: '#ef4444', is_active: true },
            { tenant_id: tenant.id, modulo: 'financeiro', nome: 'Manutenção de Frota', cor: '#8b5cf6', is_active: true },
            { tenant_id: tenant.id, modulo: 'financeiro', nome: 'Combustível', cor: '#ec4899', is_active: true }
          ];
        } else if (modulo === 'compras') {
          defaultCategories = [
            { tenant_id: tenant.id, modulo: 'compras', nome: 'Geral', cor: '#94a3b8', is_active: true },
            { tenant_id: tenant.id, modulo: 'compras', nome: 'Insumos', cor: '#3b82f6', is_active: true },
            { tenant_id: tenant.id, modulo: 'compras', nome: 'Máquinas', cor: '#f59e0b', is_active: true },
            { tenant_id: tenant.id, modulo: 'compras', nome: 'Serviços', cor: '#8b5cf6', is_active: true },
            { tenant_id: tenant.id, modulo: 'compras', nome: 'Nutrição', cor: '#10b981', is_active: true }
          ];
        } else if (modulo === 'parceiros') {
          defaultCategories = [
            { tenant_id: tenant.id, modulo: 'parceiros', nome: 'Frigorífico', cor: '#ef4444', is_active: true },
            { tenant_id: tenant.id, modulo: 'parceiros', nome: 'Trader', cor: '#3b82f6', is_active: true },
            { tenant_id: tenant.id, modulo: 'parceiros', nome: 'Pessoa Física', cor: '#10b981', is_active: true },
            { tenant_id: tenant.id, modulo: 'parceiros', nome: 'Leilão', cor: '#f59e0b', is_active: true }
          ];
        } else if (modulo === 'frota') {
          defaultCategories = [
            { tenant_id: tenant.id, modulo: 'frota', nome: 'Trator', cor: '#ef4444', is_active: true },
            { tenant_id: tenant.id, modulo: 'frota', nome: 'Implemento', cor: '#f59e0b', is_active: true },
            { tenant_id: tenant.id, modulo: 'frota', nome: 'Caminhonete / Carro', cor: '#3b82f6', is_active: true },
            { tenant_id: tenant.id, modulo: 'frota', nome: 'Caminhão', cor: '#10b981', is_active: true },
            { tenant_id: tenant.id, modulo: 'frota', nome: 'Outros', cor: '#64748b', is_active: true }
          ];
        } else if (modulo === 'racas') {
          defaultCategories = [
            { tenant_id: tenant.id, modulo: 'racas', nome: 'Nelore', cor: '#ef4444', is_active: true },
            { tenant_id: tenant.id, modulo: 'racas', nome: 'Angus', cor: '#0f172a', is_active: true },
            { tenant_id: tenant.id, modulo: 'racas', nome: 'Senepol', cor: '#b45309', is_active: true },
            { tenant_id: tenant.id, modulo: 'racas', nome: 'Brahman', cor: '#94a3b8', is_active: true },
            { tenant_id: tenant.id, modulo: 'racas', nome: 'Cruzamento Industrial', cor: '#8b5cf6', is_active: true }
          ];
        } else if (modulo === 'pecuaria') {
          defaultCategories = [
            { tenant_id: tenant.id, modulo: 'pecuaria', nome: 'Bezerro', cor: '#64748b', is_active: true },
            { tenant_id: tenant.id, modulo: 'pecuaria', nome: 'Garrote', cor: '#3b82f6', is_active: true },
            { tenant_id: tenant.id, modulo: 'pecuaria', nome: 'Boi', cor: '#ef4444', is_active: true },
            { tenant_id: tenant.id, modulo: 'pecuaria', nome: 'Vaca', cor: '#10b981', is_active: true },
            { tenant_id: tenant.id, modulo: 'pecuaria', nome: 'Novilha', cor: '#f59e0b', is_active: true },
            { tenant_id: tenant.id, modulo: 'pecuaria', nome: 'Touro', cor: '#0f172a', is_active: true }
          ];
        } else if (modulo === 'unidades') {
          defaultCategories = [
            { tenant_id: tenant.id, modulo: 'unidades', nome: 'un', cor: '#94a3b8', is_active: true },
            { tenant_id: tenant.id, modulo: 'unidades', nome: 'kg', cor: '#3b82f6', is_active: true },
            { tenant_id: tenant.id, modulo: 'unidades', nome: 'ton', cor: '#ef4444', is_active: true },
            { tenant_id: tenant.id, modulo: 'unidades', nome: 'L', cor: '#10b981', is_active: true },
            { tenant_id: tenant.id, modulo: 'unidades', nome: 'm³', cor: '#f59e0b', is_active: true }
          ];
        } else if (modulo === 'estoque') {
          defaultCategories = [
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'Combustíveis', cor: '#ef4444', is_active: true, is_system: true },
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'Defensivos', cor: '#f59e0b', is_active: true, is_system: true },
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'Fertilizantes', cor: '#10b981', is_active: true, is_system: true },
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'Peças', cor: '#64748b', is_active: true, is_system: true },
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'Medicamentos', cor: '#3b82f6', is_active: true, is_system: true },
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'Suplementos', cor: '#8b5cf6', is_active: true, is_system: true },
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'Sementes', cor: '#d97706', is_active: true, is_system: true },
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'Rações', cor: '#b45309', is_active: true, is_system: true },
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'Vacinas', cor: '#ec4899', is_active: true, is_system: true },
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'EPIs', cor: '#0f172a', is_active: true, is_system: true },
            { tenant_id: tenant.id, modulo: 'estoque', nome: 'Geral', cor: '#94a3b8', is_active: true, is_system: false }
          ];
        }
        
        if (defaultCategories.length > 0) {
          const { data: inserted, error: insertErr } = await supabase
            .from('categorias_sistema')
            .insert(defaultCategories)
            .select();
            
          if (!insertErr && inserted) {
            fetchedData = [...fetchedData, ...inserted];
          }
        }
      }

      setCategorias(fetchedData);
    } catch (err) {
      console.warn('[CategoryManagement] Fetch error:', err);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditItem(null);
    setFormData({ nome: '', cor: '#94a3b8', is_active: true, modulo_vinculado: '', categoria_financeira_id: '', tipo_item: 'ambos' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Categoria) => {
    setEditItem(cat);
    setFormData({ 
      nome: cat.nome, 
      cor: cat.cor || '#94a3b8', 
      is_active: cat.is_active,
      modulo_vinculado: cat.modulo_vinculado || '',
      categoria_financeira_id: cat.categoria_financeira_id || '',
      tipo_item: cat.tipo_item || 'ambos'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (editItem) {
      const { error } = await supabase
        .from('categorias_sistema')
        .update({
          nome: formData.nome,
          cor: formData.cor,
          is_active: formData.is_active,
          modulo_vinculado: formData.modulo_vinculado || null,
          categoria_financeira_id: formData.categoria_financeira_id || null,
          tipo_item: modulo === 'estoque' ? formData.tipo_item : 'ambos',
          updated_at: new Date().toISOString()
        })
        .eq('id', editItem.id);

      if (!error) {
        setIsModalOpen(false);
        fetchCategorias();
      } else {
        toast.error('Erro ao atualizar: ' + error.message);
      }
    } else {
      const { error } = await supabase
        .from('categorias_sistema')
        .insert({
          tenant_id: tenant.id,
          modulo: modulo,
          nome: formData.nome,
          cor: formData.cor,
          is_active: formData.is_active,
          modulo_vinculado: formData.modulo_vinculado || null,
          categoria_financeira_id: formData.categoria_financeira_id || null,
          tipo_item: modulo === 'estoque' ? formData.tipo_item : 'ambos'
        });

      if (!error) {
        setIsModalOpen(false);
        fetchCategorias();
      } else {
        toast.error('Erro ao criar: ' + error.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Atenção: Se esta categoria estiver em uso, não poderá ser excluída (você pode apenas Inativá-la). Deseja tentar excluir?")) {
      const { error } = await supabase
        .from('categorias_sistema')
        .delete()
        .eq('id', id);
        
      if (error) {
        toast.error('Não é possível excluir pois já existem registros usando esta categoria. Recomendamos INATIVÁ-LA.');
      } else {
        fetchCategorias();
      }
    }
  };

  const filtered = categorias.filter(c => 
    c.modulo === modulo && 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Nome da Categoria',
      accessor: (cat: Categoria) => (
        <div className="table-cell-title" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: cat.cor || '#94a3b8' }}></div>
          <span className="main-text">{cat.nome}</span>
          {cat.is_system && (
            <span style={{ fontSize: '10px', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
              SISTEMA
            </span>
          )}
        </div>
      ),
      align: 'left' as const
    },
    ...(modulo === 'estoque' ? [{
      header: 'Aplicável a',
      accessor: (cat: Categoria) => {
        const labels: Record<string, string> = {
          'produto': 'Produto / Insumo',
          'servico': 'Serviço',
          'ambos': 'Ambos'
        };
        const label = labels[cat.tipo_item || 'ambos'] || 'Ambos';
        const isProd = (cat.tipo_item || 'ambos') === 'produto';
        const isServ = (cat.tipo_item || 'ambos') === 'servico';
        
        return (
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 750, 
            padding: '4px 8px', 
            borderRadius: '6px',
            background: isProd ? 'rgba(16, 185, 129, 0.08)' : isServ ? 'rgba(99, 102, 241, 0.08)' : 'hsl(var(--bg-main))',
            color: isProd ? '#10b981' : isServ ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
            border: `1px solid ${isProd ? 'rgba(16, 185, 129, 0.2)' : isServ ? 'rgba(99, 102, 241, 0.2)' : 'hsl(var(--border))'}`,
            textTransform: 'uppercase' as const
          }}>
            {label}
          </span>
        );
      },
      align: 'left' as const
    }] : []),
    {
      header: modulo === 'estoque' ? 'Vínculo Financeiro' : 'Vínculo Operacional',
      accessor: (cat: Categoria) => {
        if (modulo === 'estoque') {
          const finCat = categorias.find(c => c.id === cat.categoria_financeira_id);
          return (
            <span style={{ fontSize: '12px', fontWeight: 600, color: finCat ? '#8b5cf6' : '#94a3b8' }}>
              {finCat ? finCat.nome.toUpperCase() : 'SEM VÍNCULO'}
            </span>
          );
        }
        return (
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
            {cat.modulo_vinculado ? cat.modulo_vinculado.toUpperCase() : 'GERAL / MISTO'}
          </span>
        );
      },
      align: 'left' as const
    },
    {
      header: 'Status',
      accessor: (cat: Categoria) => (
        <span className={`status-chip ${cat.is_active ? 'success' : 'danger'}`}>
          <div className="dot"></div>
          {cat.is_active ? 'ATIVO' : 'INATIVO'}
        </span>
      ),
      align: 'left' as const
    }
  ];

  return (
    <div className="tab-content-wrapper animate-slide-up">
      <main className="hub-content" style={{ padding: 0 }}>
        <ModernTable 
          emptyState={
            categorias.filter(c => c.modulo === modulo).length === 0 ? (
              <EmptyState
                title="Nenhuma categoria cadastrada"
                description="Você ainda não possui categorias cadastradas para este módulo. Crie a primeira para começar."
                actionLabel="Nova Categoria"
                onAction={handleOpenCreate}
                icon={Tag}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          } 
          data={filtered}
          columns={columns}
          loading={loading}
          hideHeader={true}
          actions={(cat: Categoria) => (
            <>
              <button className="icon-btn-secondary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(cat); }}>
                <Edit2 size={16} />
              </button>
              {!cat.is_system && (
                <button className="icon-btn-secondary danger" onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }}>
                  <Trash2 size={16} />
                </button>
              )}
            </>
          )}
        />
      </main>

      {isModalOpen && (
        <SidePanel
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          title={editItem ? 'Editar Categoria' : 'Nova Categoria'}
          subtitle={`Adicionar nova categoria para o módulo: ${modulo.toUpperCase()}`}
          icon={Tag}
          submitLabel="Salvar Categoria"
          size="medium"
        >
          <div className="form-grid">
            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label">Nome da Categoria</label>
              <input 
                type="text" 
                className="tauze-input"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Combustível, Suplementos, etc..."
                disabled={editItem?.is_system}
                required
              />
              {editItem?.is_system && <span style={{ fontSize: '11px', color: '#ef4444' }}>O nome desta categoria não pode ser alterado, pois é essencial para o sistema.</span>}
            </div>

            {modulo === 'financeiro' && (
              <div className="tauze-field-group">
                <label className="tauze-label">Vínculo Operacional</label>
                <select 
                  className="tauze-input"
                  value={formData.modulo_vinculado}
                  onChange={e => setFormData({...formData, modulo_vinculado: e.target.value})}
                >
                  <option value="">Geral / Administrativo (Sede)</option>
                  <option value="pecuaria">Pecuária (Gado)</option>
                  <option value="estoque">Estoque & Agricultura</option>
                  <option value="frota">Máquinas & Frota</option>
                  <option value="logistica">Logística & Frete</option>
                </select>
              </div>
            )}

            {modulo === 'estoque' && (
              <>
                <div className="tauze-field-group">
                  <label className="tauze-label">Aplicável a</label>
                  <select 
                    className="tauze-input"
                    value={formData.tipo_item}
                    onChange={e => setFormData({...formData, tipo_item: e.target.value})}
                  >
                    <option value="ambos">Ambos (Produto e Serviço)</option>
                    <option value="produto">Apenas Insumo / Produto</option>
                    <option value="servico">Apenas Serviço</option>
                  </select>
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">Categoria Financeira Padrão (Opcional)</label>
                  <select 
                    className="tauze-input"
                    value={formData.categoria_financeira_id}
                    onChange={e => setFormData({...formData, categoria_financeira_id: e.target.value})}
                  >
                    <option value="">-- Não vincular nenhuma --</option>
                    {categorias.filter(c => c.modulo === 'financeiro').map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                    Automatiza o lançamento no Contas a Pagar/Receber
                  </span>
                </div>
              </>
            )}

            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label">Cor de Identificação</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['#94a3b8', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
                  <div 
                    key={color}
                    onClick={() => setFormData({...formData, cor: color})}
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', background: color, cursor: 'pointer',
                      border: formData.cor === color ? '3px solid hsl(var(--text-main))' : '3px solid transparent',
                      boxShadow: formData.cor === color ? '0 0 0 2px hsl(var(--bg-card)) inset' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  ></div>
                ))}
              </div>
            </div>

            <div className="tauze-field-group" style={{ marginTop: '8px', gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: editItem?.is_system ? 'not-allowed' : 'pointer', padding: '12px 16px', background: 'hsl(var(--bg-body))', borderRadius: '12px', border: '1px solid hsl(var(--border))', opacity: editItem?.is_system ? 0.7 : 1 }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  disabled={editItem?.is_system}
                  style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--brand))', flexShrink: 0, cursor: editItem?.is_system ? 'not-allowed' : 'pointer' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Categoria Ativa</span>
                  <span style={{ fontSize: '12px', color: editItem?.is_system ? '#ef4444' : 'hsl(var(--text-muted))', fontWeight: 500 }}>
                    {editItem?.is_system ? 'Categorias do sistema não podem ser desativadas.' : 'Permite usar esta categoria nos formulários do sistema'}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </SidePanel>
      )}
    </div>
  );
};
