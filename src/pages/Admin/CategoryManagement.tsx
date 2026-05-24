import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tag, Search, Plus, Trash2, Edit2, AlertTriangle, Layers, CheckCircle, XCircle, Database } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { FormModal } from '../../components/Forms/FormModal';

interface Categoria {
  id: string;
  modulo: string;
  nome: string;
  cor: string;
  is_active: boolean;
}

export const CategorySettingsTab: React.FC<{ modulo: string, searchTerm: string, triggerCreate: number }> = ({ modulo, searchTerm, triggerCreate }) => {
  const { tenant } = useTenant();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#94a3b8',
    is_active: true
  });

  // Removed local modules list

  useEffect(() => {
    fetchCategorias();
  }, [tenant]);

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
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('nome');

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.warn('[CategoryManagement] Resilience Pattern Engaged:', err);
      // Fallback mock data if the table doesn't exist yet
      const mockCategorias: Categoria[] = [
        { id: '1', modulo: 'estoque', nome: 'Semente', cor: '#10b981', is_active: true },
        { id: '2', modulo: 'estoque', nome: 'Adubo', cor: '#8b5cf6', is_active: true },
        { id: '3', modulo: 'estoque', nome: 'Defensivo', cor: '#ef4444', is_active: false },
        { id: '4', modulo: 'financeiro', nome: 'Receita Operacional', cor: '#10b981', is_active: true },
        { id: '5', modulo: 'financeiro', nome: 'Despesa Administrativa', cor: '#f59e0b', is_active: true },
        { id: '6', modulo: 'parceiros', nome: 'Fornecedor', cor: '#3b82f6', is_active: true },
      ];
      setCategorias(mockCategorias);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditItem(null);
    setFormData({ nome: '', cor: '#94a3b8', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Categoria) => {
    setEditItem(cat);
    setFormData({ nome: cat.nome, cor: cat.cor || '#94a3b8', is_active: cat.is_active });
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
          updated_at: new Date().toISOString()
        })
        .eq('id', editItem.id);

      if (!error) {
        setIsModalOpen(false);
        fetchCategorias();
      } else {
        alert('Erro ao atualizar: ' + error.message);
      }
    } else {
      const { error } = await supabase
        .from('categorias_sistema')
        .insert({
          tenant_id: tenant.id,
          modulo: modulo,
          nome: formData.nome,
          cor: formData.cor,
          is_active: formData.is_active
        });

      if (!error) {
        setIsModalOpen(false);
        fetchCategorias();
      } else {
        alert('Erro ao criar: ' + error.message);
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
        alert('Não é possível excluir pois já existem registros usando esta categoria. Recomendamos INATIVÁ-LA.');
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
        </div>
      ),
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
          data={filtered}
          columns={columns}
          loading={loading}
          hideHeader={true}
          actions={(cat: Categoria) => (
            <>
              <button className="icon-btn-secondary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(cat); }}>
                <Edit2 size={16} />
              </button>
              <button className="icon-btn-secondary" onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }} style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}>
                <Trash2 size={16} />
              </button>
            </>
          )}
        />
      </main>

      {isModalOpen && (
        <FormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          title={editItem ? 'Editar Categoria' : 'Nova Categoria'}
          subtitle={`Módulo selecionado: ${modules.find(m => m.id === activeTab)?.label}`}
          icon={Tag}
          submitLabel="Salvar Categoria"
          size="small"
        >
          <div className="tauze-field-group">
            <label className="tauze-label">Nome da Categoria</label>
            <input 
              type="text" 
              className="tauze-input"
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              placeholder="Ex: Combustível, Suplementos, etc..."
              required
            />
          </div>

          <div className="tauze-field-group">
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

          <div className="tauze-field-group" style={{ marginTop: '8px', gridColumn: '1 / -1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', background: 'hsl(var(--bg-body))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
              <input 
                type="checkbox" 
                checked={formData.is_active}
                onChange={e => setFormData({...formData, is_active: e.target.checked})}
                style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--brand))', flexShrink: 0, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Categoria Ativa</span>
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>Permite usar esta categoria nos formulários do sistema</span>
              </div>
            </label>
          </div>
        </FormModal>
      )}
    </div>
  );
};
