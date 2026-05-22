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
    { id: 'global_view', label: 'Visão Global Multi-Fazendas' },
    { id: 'panorama', label: 'Executive Dashboard (Panorama)' },
    
    { id: 'pecuaria', label: 'Pecuária: Acesso Total' },
    { id: 'pecuaria_dashboard', label: 'Pecuária: Dashboards' },
    { id: 'pecuaria_animais', label: 'Pecuária: Animais e Lotes' },
    { id: 'pecuaria_saude', label: 'Pecuária: Sanidade e Nutrição' },
    
    { id: 'financeiro', label: 'Financeiro: Acesso Total' },
    { id: 'financeiro_dashboard', label: 'Financeiro: Inteligência Hub' },
    { id: 'financeiro_operacoes', label: 'Financeiro: Contas a Pagar/Receber' },
    { id: 'financeiro_bancos', label: 'Financeiro: Conciliação e Bancos' },
    
    { id: 'comercial', label: 'Comercial: Acesso Total' },
    { id: 'comercial_pedidos', label: 'Comercial: Pedidos e Contratos' },
    { id: 'comercial_clientes', label: 'Comercial: Gestão de Clientes' },

    { id: 'compras', label: 'Compras: Acesso Total' },
    { id: 'compras_pedidos', label: 'Compras: Requisições e Pedidos' },
    { id: 'compras_fornecedores', label: 'Compras: Gestão de Fornecedores' },
    
    { id: 'logistica', label: 'Logística & Estoque: Acesso Total' },
    { id: 'logistica_armazens', label: 'Estoque: Gestão de Armazéns' },
    
    { id: 'frota', label: 'Frota: Acesso Total' },
    { id: 'frota_abastecimento', label: 'Frota: Abastecimento' },
    { id: 'frota_manutencao', label: 'Frota: Manutenção' },

    { id: 'mercado', label: 'Inteligência de Mercado: Acesso Total' },
    
    { id: 'ia', label: 'Hub de Inteligência IA' },
    
    { id: 'admin', label: 'Governança: Acesso Administrativo' }
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
        <div className="tauze-permissions-grid">
          {availablePermissions.map(perm => (
            <div 
              key={perm.id} 
              onClick={() => togglePermission(perm.id)}
              className={`tauze-permission-item ${formData.permissoes.includes(perm.id) ? 'active' : ''}`}
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
