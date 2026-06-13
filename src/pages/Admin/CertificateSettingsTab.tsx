import React, { useState, useEffect, useRef } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { Edit3, Shield, Key, FilePlus, Eye, Search, AlertTriangle, X, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { SidePanel } from '../../components/Layout/SidePanel';
import { useConfirm } from '../../contexts/ConfirmContext';

interface CertificateSettingsTabProps {
  searchTerm: string;
  triggerCreate: number;
}

const FORM_SESSION_KEY = 'cert_form_draft';

export const CertificateSettingsTab: React.FC<CertificateSettingsTabProps> = ({ searchTerm, triggerCreate }) => {
  const { tenant, activeTenantId } = useTenant();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  
  const [isModalOpen, setIsModalOpen] = useState(() => {
    // Restaura o modal aberto caso o usuário tenha trocado de janela com ele aberto
    try { return sessionStorage.getItem(FORM_SESSION_KEY + '_open') === 'true'; }
    catch { return false; }
  });
  const [editingCert, setEditingCert] = useState<any>(null);
  
  const [formData, setFormData] = usePersistentState('CertificateSettingsTab_formData', { company_id: '', titular: '', cnpj_cpf: '', senha: '', pfx_base64: '' });

  // Persiste o estado do formulário no sessionStorage a cada mudança
  useEffect(() => {
    try {
      sessionStorage.setItem(FORM_SESSION_KEY, JSON.stringify(formData));
      sessionStorage.setItem(FORM_SESSION_KEY + '_open', String(isModalOpen));
    } catch {}
  }, [formData, isModalOpen]);

  // Limpa o rascunho quando o modal é fechado com sucesso
  const clearDraft = () => {
    try {
      sessionStorage.removeItem(FORM_SESSION_KEY);
      sessionStorage.removeItem(FORM_SESSION_KEY + '_open');
    } catch {}
  };

  useEffect(() => {
    if (triggerCreate > 0) {
      setEditingCert(null);
      setFormData({ company_id: '', titular: '', cnpj_cpf: '', senha: '', pfx_base64: '' });
      setIsModalOpen(true);
    }
  }, [triggerCreate]);

  // Query: Certificados Digitais
  const { data: certificados = [], isLoading: loadingCerts } = useQuery({
    queryKey: ['certificados_digitais', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase.rpc('get_certificados_digitais', { p_tenant_id: activeTenantId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId
  });

  // Query: Fazendas/Empresas
  const { data: empresas = [], isLoading: loadingEmpresas } = useQuery({
    queryKey: ['empresas_certificados', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase.from('fazendas').select('id, nome, ie_produtor, nirf').eq('tenant_id', activeTenantId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId
  });

  const loading = loadingCerts || loadingEmpresas;

  // Mutation: Upsert Certificado
  const upsertMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.rpc('upsert_certificado_digital', {
        p_tenant_id: activeTenantId,
        p_company_id: payload.company_id,
        p_titular: payload.titular,
        p_cnpj_cpf: payload.cnpj_cpf,
        p_senha: payload.senha,
        p_pfx_base64: payload.pfx_base64,
        p_data_vencimento: payload.data_vencimento,
        p_existing_id: editingCert ? editingCert.id : null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editingCert ? 'Certificado atualizado com sucesso!' : 'Certificado importado com sucesso!');
      clearDraft();
      setIsModalOpen(false);
      setFormData({ company_id: '', titular: '', cnpj_cpf: '', senha: '', pfx_base64: '' });
      queryClient.invalidateQueries({ queryKey: ['certificados_digitais', activeTenantId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao salvar certificado');
    }
  });

  // Mutation: Delete Certificado
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('certificados_digitais').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Certificado excluído');
      queryClient.invalidateQueries({ queryKey: ['certificados_digitais', activeTenantId] });
    },
    onError: () => {
      toast.error('Erro ao excluir');
    }
  });

  const handleFileDrop = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
      toast.error('O arquivo deve ser um certificado digital A1 válido (.pfx ou .p12)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (base64) {
        setFormData(prev => ({ ...prev, pfx_base64: base64 }));
        toast.success('Arquivo lido com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenantId) return;

    if (!formData.company_id || !formData.titular || !formData.cnpj_cpf || !formData.senha || !formData.pfx_base64) {
      toast.error('Preencha todos os campos e faça o upload do arquivo .pfx');
      return;
    }

    // Validade mockada — em produção real lemos de dentro do PFX
    const validade = new Date();
    validade.setFullYear(validade.getFullYear() + 1);

    upsertMutation.mutate({
      company_id: formData.company_id,
      titular: formData.titular,
      cnpj_cpf: formData.cnpj_cpf,
      senha: formData.senha,
      pfx_base64: formData.pfx_base64,
      data_vencimento: validade.toISOString()
    });
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ title: 'Atenção', description: 'Deseja realmente excluir este certificado? Ele não poderá mais assinar NF-e ou realizar buscas.', confirmText: 'Confirmar', cancelText: 'Cancelar', variant: 'danger' });
    if (!isConfirmed) return;
    deleteMutation.mutate(id);
  };

  const filteredCerts = certificados.filter((c: any) => 
    c.titular.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj_cpf.includes(searchTerm)
  );

  const columns = [
    {
      header: 'Titular do Certificado',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.titular}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            CNPJ/CPF: {item.cnpj_cpf}
          </div>
        </div>
      )
    },
    {
      header: 'Vínculo (Empresa/Fazenda)',
      accessor: (item: any) => {
        const empresa = empresas.find(e => e.id === item.company_id);
        return (
          <div className="table-cell-meta">
            <span>{empresa ? empresa.nome : 'Empresa não encontrada'}</span>
          </div>
        );
      }
    },
    {
      header: 'Validade',
      accessor: (item: any) => {
        const validade = new Date(item.data_vencimento);
        const agora = new Date();
        const diasRestantes = Math.floor((validade.getTime() - agora.getTime()) / (1000 * 3600 * 24));
        const isVencido = diasRestantes < 0;
        const isExpirando = diasRestantes >= 0 && diasRestantes <= 30;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: 8, height: 8, borderRadius: '50%', 
              background: isVencido ? '#ef4444' : isExpirando ? '#f59e0b' : '#10b981' 
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: isVencido ? '#ef4444' : 'inherit' }}>
              {validade.toLocaleDateString('pt-BR')} {isExpirando && `(${diasRestantes} dias)`}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Tipo',
      accessor: () => (
        <span className="status-pill active" style={{ background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))' }}>
          <Key size={12} style={{ marginRight: 4 }} /> A1 Arquivo
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="tab-pane animate-fade-in">
      <div className="hub-content">
        <ModernTable
          emptyState={
            <EmptyState
              title="Nenhum certificado cadastrado"
              description="Para automatizar buscas de notas e emitir DF-e, adicione o certificado digital A1 da sua empresa."
              icon={Shield}
              actionLabel="Adicionar Certificado"
              onAction={() => {
                setEditingCert(null);
                setFormData({ company_id: '', titular: '', cnpj_cpf: '', senha: '', pfx_base64: '' });
                setIsModalOpen(true);
              }}
            />
          }
          data={filteredCerts}
          columns={columns}
          loading={loading}
          hideHeader={true}
          searchPlaceholder="Pesquisar certificado por titular..."
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot edit" onClick={() => {
                setEditingCert(item);
                setFormData({
                  company_id: item.company_id,
                  titular: item.titular,
                  cnpj_cpf: item.cnpj_cpf,
                  senha: item.senha,
                  pfx_base64: item.pfx_base64
                });
                setIsModalOpen(true);
              }} title="Editar">
                <Edit3 size={18} />
              </button>
              <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Remover">
                <AlertTriangle size={18} />
              </button>
            </div>
          )}
        />
      </div>

      <SidePanel
        isOpen={isModalOpen}
        onClose={() => { clearDraft(); setIsModalOpen(false); setFormData({ company_id: '', titular: '', cnpj_cpf: '', senha: '', pfx_base64: '' }); }}
        onSubmit={handleSubmit}
        title={editingCert ? 'Editar Certificado A1' : 'Importar Certificado A1'}
        subtitle="O certificado ficará armazenado na nuvem para uso automático por nossos robôs."
        icon={Shield}
        submitLabel="SALVAR CERTIFICADO"
        size="medium"
      >
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 01</div>
            <h4 className="tauze-section-title">Dados do Certificado</h4>
          </div>
          
          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group span-1">
              <label className="tauze-label">Vincular a qual Fazenda / Empresa?</label>
              <select 
                className="tauze-input" 
                value={formData.company_id} 
                onChange={e => setFormData({ ...formData, company_id: e.target.value })}
                required
              >
                <option value="">Selecione...</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome} (IE: {emp.ie_produtor || 'N/A'})</option>
                ))}
              </select>
            </div>

            <div className="tauze-field-group span-1">
              <label className="tauze-label">CNPJ / CPF</label>
              <input 
                type="text" 
                className="tauze-input" 
                value={formData.cnpj_cpf} 
                onChange={e => setFormData({ ...formData, cnpj_cpf: e.target.value })}
                required
              />
            </div>

            <div className="tauze-field-group span-1">
              <label className="tauze-label">Titular (Nome da Empresa)</label>
              <input 
                type="text" 
                className="tauze-input" 
                value={formData.titular} 
                onChange={e => setFormData({ ...formData, titular: e.target.value })}
                required
              />
            </div>

            <div className="tauze-field-group span-1">
              <label className="tauze-label">Senha do Certificado</label>
              <input 
                type="password" 
                className="tauze-input" 
                value={formData.senha} 
                onChange={e => setFormData({ ...formData, senha: e.target.value })}
                required
              />
            </div>

            <div className="tauze-field-group span-2" style={{ marginTop: '8px' }}>
              <label className="tauze-label">Arquivo do Certificado (.pfx ou .p12)</label>
              <div 
                className="file-dropzone" 
                style={{ 
                  border: '2px dashed hsl(var(--border))', 
                  borderRadius: '12px', 
                  padding: '32px', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  background: formData.pfx_base64 ? 'hsl(var(--brand) / 0.05)' : 'hsl(var(--bg-main))',
                  borderColor: formData.pfx_base64 ? 'hsl(var(--brand))' : 'hsl(var(--border))',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                onClick={() => document.getElementById('cert-upload')?.click()}
              >
                <input 
                  id="cert-upload"
                  type="file" 
                  accept=".pfx,.p12" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileDrop([e.target.files[0]]);
                    }
                  }}
                />
                <UploadCloud size={32} style={{ margin: '0 auto 16px', color: formData.pfx_base64 ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: formData.pfx_base64 ? 'hsl(var(--brand))' : 'hsl(var(--text-main))', marginBottom: '4px' }}>
                  {formData.pfx_base64 ? "Arquivo Carregado!" : "Arraste o certificado A1"}
                </h4>
                <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                  {formData.pfx_base64 ? "Pronto para salvar." : "ou clique para buscar o arquivo"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </SidePanel>
    </div>
  );
};
