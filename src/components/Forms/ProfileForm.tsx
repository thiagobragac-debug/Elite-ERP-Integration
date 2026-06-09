import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  Shield, 
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Globe,
  MapPin,
  Eye,
  Edit2,
  CheckSquare,
  Trash2,
  Copy
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

const MODULES = [
  { id: 'pecuaria', label: 'Pecuária & Lotes', actions: ['read', 'write', 'delete'] },
  { id: 'financeiro', label: 'Gestão Financeira', actions: ['read', 'write', 'approve', 'delete'] },
  { id: 'comercial', label: 'Comercial & Contratos', actions: ['read', 'write', 'approve', 'delete'] },
  { id: 'compras', label: 'Suprimentos & Compras', actions: ['read', 'write', 'approve', 'delete'] },
  { id: 'logistica', label: 'Estoque & Armazéns', actions: ['read', 'write', 'delete'] },
  { id: 'frota', label: 'Máquinas & Frota', actions: ['read', 'write', 'delete'] },
  { id: 'admin', label: 'Administração do Sistema', actions: ['read', 'write', 'delete'] },
];

const TEMPLATES = [
  { value: 'none', label: 'Começar do Zero' },
  { value: 'admin', label: 'Administrador Total' },
  { value: 'cfo', label: 'Diretor Financeiro (CFO)' },
  { value: 'gerente_fazenda', label: 'Gerente da Fazenda' },
  { value: 'operador', label: 'Operador / Lançador' },
];

export const ProfileForm: React.FC<ProfileFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const [formData, setFormData] = usePersistentState('ProfileForm_formData', {
    nome: '',
    descricao: '',
    is_global: false,
    permissoes: {} as Record<string, string[]> // Ex: { pecuaria: ['read', 'write'], financeiro: ['read'] }
  });

  const [selectedTemplate, setSelectedTemplate] = useState('none');

  useEffect(() => {
    if (initialData) {
      // Migração reversa básica para o novo formato caso seja legado string[]
      let perms: Record<string, string[]> = {};
      if (typeof initialData.permissoes === 'object' && !Array.isArray(initialData.permissoes)) {
        perms = initialData.permissoes || {};
      }
      
      setFormData({
        nome: initialData.nome || '',
        descricao: initialData.descricao || '',
        is_global: initialData.is_global || false,
        permissoes: perms
      });
      setSelectedTemplate('none');
    } else {
      setFormData({
        nome: '',
        descricao: '',
        is_global: false,
        permissoes: {}
      });
      setSelectedTemplate('none');
    }
  }, [initialData, isOpen, actionId]);

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === 'none') {
      setFormData(prev => ({ ...prev, permissoes: {} }));
      return;
    }

    let newPerms: Record<string, string[]> = {};
    if (templateId === 'admin') {
      MODULES.forEach(m => newPerms[m.id] = [...m.actions]);
    } else if (templateId === 'cfo') {
      newPerms['financeiro'] = ['read', 'write', 'approve', 'delete'];
      newPerms['compras'] = ['read', 'approve'];
      newPerms['comercial'] = ['read', 'approve'];
      newPerms['pecuaria'] = ['read'];
      newPerms['logistica'] = ['read'];
      newPerms['frota'] = ['read'];
    } else if (templateId === 'gerente_fazenda') {
      MODULES.forEach(m => {
        if (m.id !== 'admin' && m.id !== 'financeiro') {
          newPerms[m.id] = m.actions.filter(a => a !== 'delete');
        }
      });
      newPerms['financeiro'] = ['read', 'write'];
    } else if (templateId === 'operador') {
      newPerms['pecuaria'] = ['read', 'write'];
      newPerms['logistica'] = ['read', 'write'];
      newPerms['frota'] = ['read', 'write'];
    }

    setFormData(prev => ({ ...prev, permissoes: newPerms, is_global: templateId === 'admin' || templateId === 'cfo' }));
  };

  const toggleAction = (moduleId: string, action: string) => {
    const currentModulePerms = formData.permissoes[moduleId] || [];
    let updatedPerms = [...currentModulePerms];
    
    if (updatedPerms.includes(action)) {
      updatedPerms = updatedPerms.filter(a => a !== action);
    } else {
      updatedPerms.push(action);
      // Auto-check read if writing/approving/deleting
      if (action !== 'read' && !updatedPerms.includes('read')) {
        updatedPerms.push('read');
      }
    }

    // Auto-uncheck others if unchecking read
    if (action === 'read' && !updatedPerms.includes('read')) {
      updatedPerms = [];
    }

    setFormData({
      ...formData,
      permissoes: { ...formData.permissoes, [moduleId]: updatedPerms }
    });
  };

  const hasAction = (moduleId: string, action: string) => {
    return (formData.permissoes[moduleId] || []).includes(action);
  };

  const toggleFullRow = (moduleId: string, actions: string[]) => {
    const current = formData.permissoes[moduleId] || [];
    if (current.length === actions.length) {
      setFormData({ ...formData, permissoes: { ...formData.permissoes, [moduleId]: [] } });
    } else {
      setFormData({ ...formData, permissoes: { ...formData.permissoes, [moduleId]: [...actions] } });
    }
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel 
      size="xxlarge"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Perfil de Acesso" : "Criar Perfil de Acesso"}
      subtitle="Configure a Matriz de Segregação de Função (SoD) e controle exatamente o que a equipe pode acessar."
      icon={Shield}
      loading={loading}
      submitLabel="Salvar Regras do Perfil"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px', gridColumn: 'span 2' }}>
        
        {/* COLUNA ESQUERDA: DADOS BASE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="tauze-form-section" style={{ margin: 0, padding: '24px', background: 'hsl(var(--bg-card))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px', marginBottom: '20px' }}>
              <FileText size={16} color="hsl(var(--brand))" /> 
              Identificação do Papel
            </div>
            
            <div className="tauze-field-group">
              <label className="tauze-label">Nome do Perfil</label>
              <input 
                type="text" 
                className="tauze-input"
                placeholder="Ex: Gerente Geral, Fiscal de Campo" 
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required 
              />
            </div>

            <div className="tauze-field-group" style={{ marginTop: '16px' }}>
              <label className="tauze-label">Descrição da Responsabilidade</label>
              <textarea 
                className="tauze-input tauze-textarea"
                placeholder="Breve resumo sobre o que este grupo faz." 
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                rows={3}
                style={{ minHeight: '60px' }}
              />
            </div>
          </section>

          <section className="tauze-form-section" style={{ margin: 0, padding: '24px', background: 'hsl(var(--bg-card))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px', marginBottom: '20px' }}>
              <Globe size={16} color="hsl(var(--brand))" /> 
              Escopo Territorial
            </div>
            
            <div className="tauze-form-radio-group" style={{ flexDirection: 'column', margin: 0, gap: '8px' }}>
              <div 
                className={`tauze-form-radio-item ${formData.is_global ? 'active' : ''}`}
                onClick={() => setFormData({...formData, is_global: true})}
                style={{ padding: '12px', display: 'flex', justifyContent: 'flex-start', gap: '12px' }}
              >
                <Globe size={18} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '12px' }}>Holding (Todas as Fazendas)</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Vê dados de todos os CNPJs.</div>
                </div>
              </div>
              <div 
                className={`tauze-form-radio-item ${!formData.is_global ? 'active' : ''}`}
                onClick={() => setFormData({...formData, is_global: false})}
                style={{ padding: '12px', display: 'flex', justifyContent: 'flex-start', gap: '12px' }}
              >
                <MapPin size={18} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '12px' }}>Unidade (Restrito)</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Preso à unidade logada.</div>
                </div>
              </div>
            </div>
          </section>
        </div>


        {/* COLUNA DIREITA: MATRIZ DE PERMISSÕES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--bg-main)/0.3)', padding: '16px 20px', borderRadius: '12px', border: '1px dashed hsl(var(--brand)/0.4)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Matriz de Segurança (CRUD)</div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Preencha os papéis manualmente ou use um atalho.</div>
            </div>
            <div style={{ width: '250px' }}>
              <SearchableSelect 
                value={selectedTemplate}
                onChange={(val: any) => applyTemplate(val)}
                options={TEMPLATES}
              />
            </div>
          </div>

          <div style={{ background: 'hsl(var(--bg-card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: 'hsl(var(--bg-main))', borderBottom: '1px solid hsl(var(--border))' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Módulo do Sistema</th>
                  <th style={{ padding: '16px', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                    <Eye size={14} style={{ margin: '0 auto 4px' }} /> Visualizar
                  </th>
                  <th style={{ padding: '16px', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                    <Edit2 size={14} style={{ margin: '0 auto 4px' }} /> Criar/Editar
                  </th>
                  <th style={{ padding: '16px', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--success))', textTransform: 'uppercase' }}>
                    <CheckSquare size={14} style={{ margin: '0 auto 4px' }} /> Aprovar
                  </th>
                  <th style={{ padding: '16px', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--danger))', textTransform: 'uppercase' }}>
                    <Trash2 size={14} style={{ margin: '0 auto 4px' }} /> Excluir
                  </th>
                  <th style={{ padding: '16px', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map(mod => {
                  const perms = formData.permissoes[mod.id] || [];
                  const isAll = perms.length === mod.actions.length && mod.actions.length > 0;
                  
                  return (
                    <tr key={mod.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>
                        {mod.label}
                      </td>
                      
                      {['read', 'write', 'approve', 'delete'].map(action => {
                        const isAvailable = mod.actions.includes(action);
                        const isChecked = hasAction(mod.id, action);
                        return (
                          <td key={action} style={{ padding: '12px' }}>
                            {isAvailable ? (
                              <div 
                                onClick={() => toggleAction(mod.id, action)}
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  width: '24px', 
                                  height: '24px', 
                                  borderRadius: '6px',
                                  border: `2px solid ${isChecked ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                                  background: isChecked ? 'hsl(var(--brand))' : 'transparent',
                                  color: 'white',
                                  cursor: 'pointer',
                                  transition: '0.2s'
                                }}
                              >
                                {isChecked && <CheckCircle2 size={14} strokeWidth={3} />}
                              </div>
                            ) : (
                              <div style={{ width: '8px', height: '2px', background: 'hsl(var(--border))', margin: '0 auto', borderRadius: '2px' }} />
                            )}
                          </td>
                        );
                      })}

                      <td style={{ padding: '12px' }}>
                        <button 
                          type="button"
                          onClick={() => toggleFullRow(mod.id, mod.actions)}
                          title="Marcar/Desmarcar Linha"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isAll ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))', padding: '4px' }}
                        >
                          <Copy size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </SidePanel>
  );
};
