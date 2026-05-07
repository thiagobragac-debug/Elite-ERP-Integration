import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Mail,
  Phone,
  Building2,
  Shield,
  Camera,
  CheckCircle2,
  User,
  Tag,
  Activity
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profile_id: '',
    status: 'active',
    company_id: ''
  });

  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen]);

  const fetchProfiles = async () => {
    if (!activeFarm) return;
    const { data } = await supabase
      .from('perfis_usuario')
      .select('id, nome')
      .eq('tenant_id', activeFarm.tenantId);
    
    if (data) {
      setProfiles(data.map(p => ({ id: p.id, name: p.nome })));
    } else {
      setProfiles([
        { id: '1', name: 'Administrador Master' },
        { id: '2', name: 'Gerente de Fazenda' },
        { id: '3', name: 'Operador de Campo' }
      ]);
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
      title="Convidar Novo Usuário"
      subtitle="O usuário receberá um convite por e-mail para acessar o sistema."
      icon={UserPlus}
      loading={loading}
      submitLabel="Enviar Convite"
    >
      <div className="form-group full-width">
        <label><User size={14} /> Nome Completo</label>
        <input 
          type="text" 
          placeholder="Ex: João da Silva..." 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Mail size={14} /> E-mail Profissional</label>
        <input 
          type="email" 
          placeholder="email@empresa.com.br" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Phone size={14} /> Telefone / WhatsApp</label>
        <input 
          type="text" 
          placeholder="(00) 00000-0000" 
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Shield size={14} /> Perfil de Acesso</label>
        <select 
          value={formData.profile_id}
          onChange={(e) => setFormData({...formData, profile_id: e.target.value})}
          required
        >
          <option value="">Selecione um perfil...</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Building2 size={14} /> Empresa / Unidade</label>
        <input 
          type="text" 
          placeholder="Agropecuária Matriz..." 
          value={formData.company_id}
          onChange={(e) => setFormData({...formData, company_id: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><Activity size={14} /> Status Inicial</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.status === 'active' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, status: 'active'})}
          >
            <CheckCircle2 size={16} />
            <span>Ativo</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.status === 'inactive' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, status: 'inactive'})}
          >
            <Shield size={16} />
            <span>Bloqueado</span>
          </div>
        </div>
      </div>
    </FormModal>
  );
};
