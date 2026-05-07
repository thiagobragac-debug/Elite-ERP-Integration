import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { FormModal } from './FormModal';

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    permissoes: [] as string[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        descricao: initialData.descricao || '',
        permissoes: initialData.permissoes || []
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        permissoes: []
      });
    }
  }, [initialData, isOpen]);

  const availablePermissions = [
    { id: 'pecuaria', label: 'Gestão de Pecuária' },
    { id: 'financeiro', label: 'Financeiro (Completo)' },
    { id: 'financeiro_view', label: 'Financeiro (Somente Visualização)' },
    { id: 'estoque', label: 'Controle de Estoque' },
    { id: 'maquinas', label: 'Gestão de Frota' },
    { id: 'compras', label: 'Módulo Compras' },
    { id: 'vendas', label: 'Módulo Vendas' },
    { id: 'admin', label: 'Configurações Administrativas' },
  ];

  const togglePermission = (id: string) => {
    if (formData.permissoes.includes(id)) {
      setFormData({...formData, permissoes: formData.permissoes.filter(p => p !== id)});
    } else {
      setFormData({...formData, permissoes: [...formData.permissoes, id]});
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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Criar Perfil de Acesso"
      subtitle="Defina o nome e as permissões de acesso para este grupo."
      icon={Shield}
      loading={loading}
      submitLabel="Salvar Perfil"
    >
      <div className="form-group full-width">
        <label><Shield size={14} /> Nome do Perfil</label>
        <input 
          type="text" 
          placeholder="Ex: Gerente Administrativo, Tratorista..." 
          value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})}
          required 
        />
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Descrição Curta</label>
        <input 
          type="text" 
          placeholder="Ex: Acesso total aos módulos de campo e estoque." 
          value={formData.descricao}
          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
        />
      </div>

      <div className="form-group full-width">
        <label><Lock size={14} /> Permissões de Acesso</label>
        <div className="elite-permissions-grid">
          {availablePermissions.map(perm => (
            <div 
              key={perm.id} 
              onClick={() => togglePermission(perm.id)}
              className={`elite-permission-item ${formData.permissoes.includes(perm.id) ? 'active' : ''}`}
            >
              {formData.permissoes.includes(perm.id) ? <CheckCircle2 size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--border)' }}></div>}
              {perm.label}
            </div>
          ))}
        </div>
      </div>
    </FormModal>
  );
};
