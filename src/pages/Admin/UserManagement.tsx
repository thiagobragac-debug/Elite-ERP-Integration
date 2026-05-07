import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Filter,
  Mail, 
  Phone, 
  Building2, 
  MoreVertical,
  CheckCircle2,
  Edit2,
  Lock,
  Eye,
  XCircle,
  FileText,
  History,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useEffect } from 'react';
import { UserForm } from '../../components/Forms/UserForm';
import { ProfileForm } from '../../components/Forms/ProfileForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { useSearchParams } from 'react-router-dom';

export const UserManagement: React.FC = () => {
  const { activeFarm, userProfile, refreshProfile } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'profiles' | 'seguranca'>('users');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchParams] = useSearchParams();

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'meu-perfil' || tabParam === 'users' || tabParam === 'profiles' || tabParam === 'seguranca') {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
    if (activeTab === 'seguranca') {
      fetchSecurityLogs();
    }
  }, [activeTab]);

  const fetchSecurityLogs = async () => {
    if (!activeFarm) return;
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', activeFarm.tenantId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setGlobalLogs(data.map(log => ({
          id: log.id,
          title: log.action,
          date: log.created_at,
          value: log.details || log.entity_name,
          user: log.user_email
        })));
      }
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    if (!activeFarm) return;

    if (activeTab === 'users') {
      const { data, error } = await supabase
        .from('profiles_view')
        .select('*')
        .eq('tenant_id', activeFarm.tenantId);
      
      if (!error && data) {
        setUsersList(data.map(u => ({
          ...u,
          profile: u.profile_name || u.base_role
        })));
      } else {
        setUsersList([]);
      }
    } else {
      const { data, error } = await supabase
        .from('perfis_usuario')
        .select('*')
        .eq('tenant_id', activeFarm.tenantId);
        
      if (!error && data) {
        setProfilesList(data.map(p => ({
          ...p,
          name: p.nome,
          description: p.descricao,
          permissions: p.permissoes || []
        })));
      } else {
        setProfilesList([]);
      }
    }
    setLoading(false);
  };

  const handleAddUser = async (data: any) => {
    if (!activeFarm) return;
    
    // In a real scenario, this would be an invite. 
    // For now, we insert into profiles as a mock invitation.
    const { error } = await supabase.from('profiles').insert([{
      full_name: data.name,
      email: data.email,
      tenant_id: activeFarm.tenantId,
      perfil_id: data.profile_id,
      role: 'USER'
    }]);

    if (!error) {
      setIsUserModalOpen(false);
      fetchData();
    }
  };

  const handleAddProfile = async (data: any) => {
    if (!activeFarm) return;

    const payload = {
      nome: data.nome,
      descricao: data.descricao,
      permissoes: data.permissoes,
      tenant_id: activeFarm.tenantId
    };

    if (selectedProfile) {
      const { error } = await supabase
        .from('perfis_usuario')
        .update(payload)
        .eq('id', selectedProfile.id);
      
      if (!error) {
        setIsProfileModalOpen(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('perfis_usuario').insert([payload]);
      if (!error) {
        setIsProfileModalOpen(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchData();
      }
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil? Usuários vinculados a ele podem perder acesso.')) return;
    
    const { error } = await supabase
      .from('perfis_usuario')
      .delete()
      .eq('id', id);
    
    if (!error) {
      fetchData();
    }
  };

  const handleOpenEditProfile = (profile: any) => {
    setSelectedProfile({
      id: profile.id,
      name: profile.name,
      description: profile.description,
      permissions: profile.permissions
    });
    setIsProfileModalOpen(true);
  };
  const handleOpenEditUser = (user: any) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleViewUserLogs = (user: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    // Mocking logs for now
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: new Date().toISOString(), title: 'Login efetuado', subtitle: 'Acesso via Web', value: 'IP: 189.x.x.x', status: 'success' },
        { id: '2', date: new Date(Date.now() - 3600000).toISOString(), title: 'Alteração de Animal', subtitle: 'Brinco 1234', value: 'Status -> Ativo', status: 'info' },
        { id: '3', date: new Date(Date.now() - 86400000).toISOString(), title: 'Criação de Lote', subtitle: 'LOTE-A1', value: 'Novo', status: 'success' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const userColumns = [
    {
      header: 'Usuário',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 overflow-hidden">
              {item.avatar ? <img src={item.avatar} alt="" /> : item.name?.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="main-text">{item.name}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.profile || 'Sem Perfil'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Contato',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Mail size={14} />
          <span>{item.email}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'active' ? 'active' : 'stopped'}`}>
          {item.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  const profileColumns = [
    {
      header: 'Perfil',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.descricao || 'Controle de acesso'}
          </div>
        </div>
      )
    },
    {
      header: 'Permissões',
      accessor: (item: any) => (
        <div className="flex flex-wrap gap-1">
          {(item.permissoes || []).slice(0, 3).map((p: string) => (
            <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tighter">
              {p === 'all' ? 'Total' : p.replace('_', ' ')}
            </span>
          ))}
          {(item.permissoes || []).length > 3 && <span className="text-[10px] font-bold text-slate-400">+{item.permissoes.length - 3}</span>}
        </div>
      )
    }
  ];

  return (
    <div className="admin-page">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Lock size={14} fill="currentColor" />
            <span>ELITE ACCESS v5.0</span>
          </div>
          <h1 className="page-title">Controle de Usuários & Perfis</h1>
          <p className="page-subtitle">Gerencie quem tem acesso ao sistema e quais permissões cada perfil possui em tempo real.</p>
        </div>
        <button 
          className="primary-btn" 
          onClick={() => activeTab === 'users' ? setIsUserModalOpen(true) : setIsProfileModalOpen(true)}
        >
          {activeTab === 'users' ? <UserPlus size={18} /> : <Shield size={18} />}
          {activeTab === 'users' ? 'NOVO USUÁRIO' : 'NOVO PERFIL'}
        </button>

        <AnimatePresence>
          {saveSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="save-success-toast"
            >
              <CheckCircle2 size={16} />
              <span>Alterações salvas com sucesso!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Usuários
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'profiles' ? 'active' : ''}`}
            onClick={() => setActiveTab('profiles')}
          >
            Perfis de Acesso
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'seguranca' ? 'active' : ''}`}
            onClick={() => setActiveTab('seguranca')}
          >
            Segurança
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder={activeTab === 'users' ? "Buscar por nome, email..." : "Buscar perfil..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Log">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        {activeTab === 'users' ? (
          <ModernTable 
            data={usersList.filter(u => 
              (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
              (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
            )}
            columns={userColumns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Buscar por nome, email..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewUserLogs(item)} title="Logs">
                  <Eye size={18} />
                </button>
                <button className="action-dot edit" onClick={() => handleOpenEditUser(item)} title="Editar">
                  <Edit2 size={18} />
                </button>
              </div>
            )}
          />
        ) : activeTab === 'profiles' ? (
          <ModernTable 
            data={profilesList.filter(p => (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()))}
            columns={profileColumns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Buscar perfil..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot edit" onClick={() => handleOpenEditProfile(item)} title="Editar">
                  <Edit2 size={18} />
                </button>
                <button className="action-dot delete" onClick={() => handleDeleteProfile(item.id)} title="Excluir">
                  <XCircle size={18} />
                </button>
              </div>
            )}
          />
        ) : (
          <div className="security-log-container">
             <ModernTable 
                data={globalLogs}
                columns={[
                  { header: 'Evento', accessor: (i: any) => (
                    <div className="elite-event-cell">
                      <span className="event-title">{i.title}</span>
                      <span className="event-user">{i.user}</span>
                    </div>
                  ) },
                  { header: 'Data', accessor: (i: any) => i.date ? new Date(i.date).toLocaleString() : '---' },
                  { header: 'Detalhes', accessor: 'value' }
                ]}
                loading={logsLoading}
                hideHeader={true}
                searchPlaceholder="Filtrar logs..."
             />
          </div>
        )}
      </div>

       <UserForm 
         isOpen={isUserModalOpen} 
         onClose={() => setIsUserModalOpen(false)} 
         onSubmit={handleAddUser}
         initialData={selectedUser}
       />

       <HistoryModal 
         isOpen={isHistoryModalOpen}
         onClose={() => setIsHistoryModalOpen(false)}
         title="Logs de Atividade"
         subtitle="Rastreamento de ações do usuário"
         items={historyItems}
         loading={historyLoading}
       />

      <ProfileForm 
        isOpen={isProfileModalOpen} 
        onClose={() => { setIsProfileModalOpen(false); setSelectedProfile(null); }} 
        onSubmit={handleAddProfile} 
        initialData={selectedProfile}
      />

      <style>{`
        .save-success-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          background: #16a34a;
          color: white;
          padding: 12px 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 13px;
          box-shadow: 0 10px 30px rgba(22, 163, 74, 0.2);
          z-index: 9999;
        }

        .elite-event-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .event-title {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
        }

        .event-user {
          font-size: 11px;
          color: #16a34a;
          font-weight: 700;
          text-transform: lowercase;
        }
      `}</style>
    </div>
  );
};
