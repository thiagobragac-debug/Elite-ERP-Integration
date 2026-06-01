import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Briefcase, Edit2, Trash2 } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { SidePanel } from '../../components/Layout/SidePanel';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';

interface Cargo {
  id: string;
  nome: string;
  descricao: string;
  is_active: boolean;
}

export const RoleSettingsTab: React.FC<{ searchTerm: string, triggerCreate: number }> = ({ searchTerm, triggerCreate }) => {
  const { tenant } = useTenant();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Cargo | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    is_active: true
  });

  useEffect(() => {
    fetchCargos();
  }, [tenant]);

  useEffect(() => {
    if (triggerCreate > 0) {
      handleOpenCreate();
    }
  }, [triggerCreate]);

  const fetchCargos = async () => {
    if (!tenant) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('cargos')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('nome');

      if (error) throw error;
      setCargos(data || []);
    } catch (err) {
      console.error('Error fetching cargos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditItem(null);
    setFormData({ nome: '', descricao: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cargo: Cargo) => {
    setEditItem(cargo);
    setFormData({ 
      nome: cargo.nome, 
      descricao: cargo.descricao || '', 
      is_active: cargo.is_active
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (editItem) {
      const { error } = await supabase
        .from('cargos')
        .update({
          nome: formData.nome,
          descricao: formData.descricao || null,
          is_active: formData.is_active
        })
        .eq('id', editItem.id);

      if (!error) {
        setIsModalOpen(false);
        fetchCargos();
      } else {
        toast.error('Erro ao atualizar: ' + error.message);
      }
    } else {
      const { error } = await supabase
        .from('cargos')
        .insert({
          tenant_id: tenant.id,
          nome: formData.nome,
          descricao: formData.descricao || null,
          is_active: formData.is_active
        });

      if (!error) {
        setIsModalOpen(false);
        fetchCargos();
      } else {
        toast.error('Erro ao criar: ' + error.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cargo? Usuários vinculados perderão a referência.')) return;
    
    const { error } = await supabase
      .from('cargos')
      .delete()
      .eq('id', id);
      
    if (!error) {
      fetchCargos();
    } else {
      alert('Erro ao deletar: ' + error.message);
    }
  };

  const filteredData = cargos.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Nome do Cargo',
      accessor: (item: Cargo) => (
        <div className="table-cell-title">
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={16} />
          </div>
          <div className="flex flex-col">
            <span className="main-text">{item.nome}</span>
            {item.descricao && <span className="sub-meta text-[10px] uppercase font-bold text-slate-400">{item.descricao}</span>}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: Cargo) => (
        <span className={`status-pill ${item.is_active ? 'active' : 'stopped'}`}>
          {item.is_active ? 'Ativo' : 'Inativo'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="hub-content fade-in">
      <main className="recent-activity-section" style={{ marginTop: 0, padding: 0, border: 'none', background: 'transparent' }}>
        <ModernTable 
          emptyState={
            cargos.length === 0 ? (
              <EmptyState
                title="Nenhum cargo cadastrado"
                description="Você ainda não possui cargos cadastrados. Crie o primeiro para organizar a estrutura da empresa."
                actionLabel="Novo Cargo"
                onAction={handleOpenCreate}
                icon={Briefcase}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          } 
          data={filteredData}
          columns={columns}
          loading={loading}
          hideHeader={true}
          actions={(cargo: Cargo) => (
            <>
              <button className="icon-btn-secondary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(cargo); }}>
                <Edit2 size={16} />
              </button>
              <button className="icon-btn-secondary" onClick={(e) => { e.stopPropagation(); handleDelete(cargo.id); }} style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}>
                <Trash2 size={16} />
              </button>
            </>
          )}
        />
      </main>

      {isModalOpen && (
        <SidePanel
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          title={editItem ? 'Editar Cargo' : 'Novo Cargo'}
          subtitle={`Cadastre funções e cargos para a estrutura organizacional da empresa.`}
          icon={Briefcase}
          submitLabel="Salvar Cargo"
          size="small"
        >
          <div className="tauze-field-group" style={{ gridColumn: '1 / -1' }}>
            <label className="tauze-label">Nome do Cargo</label>
            <input 
              type="text" 
              className="tauze-input"
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              placeholder="Ex: Gerente Financeiro, Comprador, Diretor..."
              required
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: '1 / -1' }}>
            <label className="tauze-label">Descrição (Opcional)</label>
            <textarea 
              className="tauze-input"
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
              placeholder="Descreva as responsabilidades deste cargo..."
              rows={2}
            />
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
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Cargo Ativo</span>
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>Permite usar este cargo nos formulários e regras do sistema</span>
              </div>
            </label>
          </div>
        </SidePanel>
      )}
    </div>
  );
};
