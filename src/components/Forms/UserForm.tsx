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
  Activity,
  Briefcase
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ToggleSwitch } from '../UI/ToggleSwitch';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm, farms, activeTenantId } = useTenant();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profile_id: '',
    status: 'active',
    company_id: '',
    fazendas_permitidas: [] as string[],
    cargo_id: ''
  });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      let fazendas = [];
      if (Array.isArray(initialData.fazendas_permitidas)) {
        fazendas = initialData.fazendas_permitidas;
      } else if (typeof initialData.fazendas_permitidas === 'string') {
        try { fazendas = JSON.parse(initialData.fazendas_permitidas); } catch (e) { fazendas = []; }
      }
      if (!Array.isArray(fazendas)) fazendas = [];

      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        profile_id: initialData.perfil_id || '',
        status: initialData.status || 'active',
        company_id: initialData.unidade_id || '',
        fazendas_permitidas: fazendas,
        cargo_id: initialData.cargo_id || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        profile_id: '',
        status: 'active',
        company_id: '',
        fazendas_permitidas: [],
        cargo_id: ''
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
      fetchCargos();
    }
  }, [isOpen]);

  const fetchProfiles = async () => {
    if (!activeTenantId) return;
    const { data, error } = await supabase
      .from('perfis_usuario')
      .select('id, nome')
      .eq('tenant_id', activeTenantId);
    
    if (data && !error) {
      setProfiles(data.map(p => ({ id: p.id, name: p.nome })));
    } else {
      setProfiles([]);
    }
  };

  const fetchCargos = async () => {
    if (!activeTenantId) return;
    const { data, error } = await supabase
      .from('cargos')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .eq('is_active', true);
    
    if (data && !error) {
      setCargos(data.map(c => ({ id: c.id, name: c.nome })));
    } else {
      setCargos([]);
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
      title={initialData ? "Editar Usuário" : "Convidar Novo Usuário"}
      subtitle={initialData ? "Atualize as permissões e dados de acesso deste usuário." : "O usuário receberá um convite por e-mail para acessar o sistema."}
      icon={initialData ? User : UserPlus}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Enviar Convite"}
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
        <label><Briefcase size={14} /> Cargo / Função</label>
        <select 
          value={formData.cargo_id}
          onChange={(e) => setFormData({...formData, cargo_id: e.target.value})}
        >
          <option value="">Nenhum cargo...</option>
          {cargos.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
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
        <label><Building2 size={14} /> Fazendas Permitidas (Acesso Restrito)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '8px' }}>
          {farms.map(farm => (
            <label key={farm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', background: 'hsl(var(--bg-main))', padding: '10px', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
              <input 
                type="checkbox" 
                checked={formData.fazendas_permitidas.includes(farm.id)}
                onChange={(e) => {
                  const newPermitidas = e.target.checked 
                    ? [...formData.fazendas_permitidas, farm.id]
                    : formData.fazendas_permitidas.filter(id => id !== farm.id);
                  setFormData({...formData, fazendas_permitidas: newPermitidas});
                }}
                style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--brand))' }}
              />
              {farm.name}
            </label>
          ))}
          {farms.length === 0 && <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Nenhuma fazenda cadastrada.</span>}
        </div>
        <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
          * Deixe desmarcado se o usuário tiver a permissão "Visão Global" no perfil (que já garante acesso total).
        </p>
      </div>

      <div className="form-group full-width">
        <label><Activity size={14} /> Status do Usuário</label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderRadius: 12,
          border: `2px solid ${formData.status === 'active' ? '#10b98130' : '#ef444430'}`,
          background: formData.status === 'active' ? '#10b98108' : '#ef444408',
          transition: 'all 0.25s ease'
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--text-main))' }}>
              {formData.status === 'active' ? 'Conta Ativa' : 'Conta Bloqueada'}
            </div>
            <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginTop: 2 }}>
              {formData.status === 'active'
                ? 'Usuário pode acessar o sistema normalmente'
                : 'Login bloqueado — usuário não consegue entrar'}
            </div>
          </div>
          <ToggleSwitch
            checked={formData.status === 'active'}
            onChange={(val) => setFormData({ ...formData, status: val ? 'active' : 'inactive' })}
            size="lg"
            labelOn="Ativo"
            labelOff="Inativo"
            showStatus={false}
          />
        </div>
      </div>
    </FormModal>
  );
};
