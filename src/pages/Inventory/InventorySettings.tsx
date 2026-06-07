import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { supabase } from '../../lib/supabase';
import { Tag, Plus, Trash2, Edit2, Layers, CheckCircle, XCircle, Search, Hash, CloudDownload, ChevronRight, Download } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { SidePanel } from '../../components/Layout/SidePanel';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';

interface NCM {
  id: string;
  codigo: string;
  descricao: string;
  is_active: boolean;
}

export const NcmSettingsTab: React.FC<{ searchTerm: string, triggerCreate: number, triggerImport: number }> = ({ searchTerm, triggerCreate, triggerImport }) => {
  const { tenant } = useTenant();
  const [ncms, setNcms] = useState<NCM[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = usePersistentState('InventorySettings_isModalOpen', false);
  const [editItem, setEditItem] = useState<NCM | null>(null);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSearch, setImportSearch] = useState('');
  const [importResults, setImportResults] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  
  const [formData, setFormData] = usePersistentState('InventorySettings_formData', {
    codigo: '',
    descricao: '',
    is_active: true
  });

  useEffect(() => {
    fetchNCMs();
  }, [tenant]);

  useEffect(() => {
    if (triggerCreate > 0) {
      handleOpenCreate();
    }
  }, [triggerCreate]);

  useEffect(() => {
    if (triggerImport > 0) {
      setIsImportModalOpen(true);
      setImportSearch('');
      setImportResults([]);
    }
  }, [triggerImport]);

  const handleSearchReceita = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!importSearch) return;
    setImporting(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/ncm/v1?search=${encodeURIComponent(importSearch)}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Filter out NCMs that don't have exactly 8 digits
        const filtered = data.filter(item => item.codigo.replace(/\D/g, '').length === 8);
        setImportResults(filtered);
      } else {
        setImportResults([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar na Receita Federal. O serviço pode estar temporariamente indisponível.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportNcm = async (ncm: any) => {
    try {
      // Ensure it's formatted as NNNN.NN.NN
      let codigoFormatado = ncm.codigo.replace(/\D/g, '');
      codigoFormatado = codigoFormatado.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3');

      const { error } = await supabase.from('estoque_ncms').insert([{
        tenant_id: tenant!.id,
        codigo: codigoFormatado,
        descricao: ncm.descricao,
        is_active: true
      }]);
      
      if (error) throw error;
      
      toast.success('NCM importado com sucesso!');
      fetchNCMs();
      // Remove from list so it doesn't get imported again
      setImportResults(prev => prev.filter(r => r.codigo !== ncm.codigo));
    } catch (err: any) {
      toast.error('Erro ao importar. Este código já deve estar cadastrado no seu sistema.');
    }
  };

  const fetchNCMs = async () => {
    if (!tenant) return;
    setLoading(true);
    
    try {
      const fetchPromise = supabase
        .from('estoque_ncms')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('codigo');

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) throw error;
      setNcms(data || []);
    } catch (err) {
      console.warn('[InventorySettings] Fetch error:', err);
      setNcms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditItem(null);
    setFormData({ codigo: '', descricao: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ncm: NCM) => {
    setEditItem(ncm);
    setFormData({
      codigo: ncm.codigo,
      descricao: ncm.descricao,
      is_active: ncm.is_active
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      if (editItem) {
        const { error } = await supabase
          .from('estoque_ncms')
          .update(formData)
          .eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('estoque_ncms')
          .insert([{ ...formData, tenant_id: tenant.id }]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchNCMs();
    } catch (err) {
      console.error('Error saving NCM:', err);
      toast.error('Erro ao salvar NCM. Verifique se o código já existe.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este NCM?')) return;
    try {
      const { error } = await supabase.from('estoque_ncms').delete().eq('id', id);
      if (error) throw error;
      fetchNCMs();
    } catch (err) {
      console.error('Error deleting NCM:', err);
      toast.error('Erro ao excluir NCM. Ele pode estar sendo usado por um insumo.');
    }
  };

  const filtered = ncms.filter(c => 
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Código NCM',
      accessor: (ncm: NCM) => (
        <span className="main-text" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ncm.codigo}</span>
      ),
      align: 'left' as const,
      width: '180px'
    },
    {
      header: 'Descrição Fiscal',
      accessor: (ncm: NCM) => (
        <span style={{ color: 'hsl(var(--text-muted))' }}>{ncm.descricao}</span>
      ),
      align: 'left' as const
    },
    {
      header: 'Status',
      accessor: (ncm: NCM) => (
        <span className={`status-chip ${ncm.is_active ? 'success' : 'danger'}`}>
          <div className="dot"></div>
          {ncm.is_active ? 'ATIVO' : 'INATIVO'}
        </span>
      ),
      align: 'left' as const,
      width: '120px'
    }
  ];

  return (
    <div className="tab-content-wrapper animate-slide-up">
      <main className="hub-content" style={{ padding: 0 }}>
        <ModernTable 
          emptyState={
            ncms.length === 0 ? (
              <EmptyState
                title="Nenhum NCM cadastrado"
                description="Você ainda não possui códigos NCM cadastrados no sistema. Cadastre manualmente ou importe da Receita Federal."
                actionLabel="Importar da Receita"
                onAction={() => setIsImportModalOpen(true)}
                icon={Hash}
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
          actions={(ncm: NCM) => (
            <>
              <button className="icon-btn-secondary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(ncm); }}>
                <Edit2 size={16} />
              </button>
              <button className="icon-btn-secondary" onClick={(e) => { e.stopPropagation(); handleDelete(ncm.id); }} style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}>
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
          title={editItem ? 'Editar NCM' : 'Novo NCM'}
          subtitle="Cadastre o código fiscal NCM do produto."
          icon={Hash}
          submitLabel="Salvar NCM"
          size="small"
        >
          <div className="form-grid">
            <div className="tauze-field-group">
              <label className="tauze-label">Código NCM</label>
              <input 
                type="text" 
                className="tauze-input"
                value={formData.codigo}
                onChange={e => {
                  // Remove non-numeric characters and format as NNNN.NN.NN
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 8) val = val.substring(0, 8);
                  if (val.length > 6) val = val.replace(/(\d{4})(\d{2})(\d{1,2})/, '$1.$2.$3');
                  else if (val.length > 4) val = val.replace(/(\d{4})(\d{1,2})/, '$1.$2');
                  setFormData({...formData, codigo: val});
                }}
                placeholder="Ex: 3105.20.00"
                required
              />
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label">Descrição Fiscal</label>
              <textarea 
                className="tauze-input"
                value={formData.descricao}
                onChange={e => setFormData({...formData, descricao: e.target.value})}
                placeholder="Ex: Adubos (fertilizantes) minerais ou químicos..."
                required
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <div className="tauze-field-group" style={{ marginTop: '8px', gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', background: 'hsl(var(--bg-body))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  style={{ width: '18px', height: '18px', accentColor: 'hsl(var(--brand))', flexShrink: 0, cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>NCM Ativo</span>
                  <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>Permite usar este NCM nos cadastros de insumo do sistema</span>
                </div>
              </label>
            </div>
          </div>
        </SidePanel>
      )}

      {isImportModalOpen && (
        <SidePanel
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSubmit={() => {}} // No main submit
          title="Importador da Receita"
          subtitle="Busque e adicione códigos NCM oficiais."
          icon={CloudDownload}
          submitLabel="Fechar"
          size="medium"
        >
          <form onSubmit={handleSearchReceita} className="tauze-field-group" style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
            <label className="tauze-label">Buscar NCM na Receita Federal (BrasilAPI)</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                className="tauze-input"
                value={importSearch}
                onChange={e => setImportSearch(e.target.value)}
                placeholder="Ex: Milho, Adubo, Trator..."
                autoFocus
              />
              <button 
                type="submit"
                className="primary-btn" 
                disabled={importing || !importSearch}
                style={{ whiteSpace: 'nowrap' }}
              >
                {importing ? 'Buscando...' : 'Buscar NCM'}
              </button>
            </div>
          </form>

          {importResults.length > 0 && (
            <div style={{ gridColumn: '1 / -1', maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
              {importResults.map((res, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'hsl(var(--bg-body))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '16px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'hsl(var(--brand))', fontSize: '15px' }}>
                      {res.codigo}
                    </span>
                    <span style={{ fontSize: '13px', color: 'hsl(var(--text-main))', lineHeight: 1.4 }}>
                      {res.descricao}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleImportNcm(res)}
                    style={{ background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    <Download size={16} />
                    Importar
                  </button>
                </div>
              ))}
            </div>
          )}

          {importResults.length === 0 && importSearch && !importing && (
             <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: 'hsl(var(--text-muted))', background: 'hsl(var(--bg-body))', borderRadius: '12px' }}>
               Nenhum resultado encontrado para a sua busca.
             </div>
          )}
        </SidePanel>
      )}
    </div>
  );
};
