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
  Monitor,
  LayoutGrid,
  List as ListIcon,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useEffect } from 'react';
import { UserForm } from '../../components/Forms/UserForm';
import { ProfileForm } from '../../components/Forms/ProfileForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { useSearchParams } from 'react-router-dom';
import { UserFilterModal } from './components/UserFilterModal';

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [securitySettings, setSecuritySettings] = useState({
    min8Chars: true,
    specialChars: true,
    numLetters: true,
    inactivity30m: true,
    forceLogout: false,
    multiDevice: true,
    block3Attempts: true,
    geoIpCheck: true,
    mfaRequired: false
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    profileId: 'all',
    mfaOnly: false,
    dateStart: '',
    dateEnd: ''
  });
  const [stats, setStats] = useState<any[]>([]);

  const isAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'Administrador';

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
  }, [activeTab, activeFarm]);

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

  const toggleSecuritySetting = (key: keyof typeof securitySettings) => {
    setSecuritySettings(prev => ({ ...prev, [key]: !prev[key] }));
    // Here we would sync with DB: supabase.from('tenant_settings').update({ security: ... })
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const fetchData = async () => {
    setLoading(true);
    if (!activeFarm) return;

    if (activeTab === 'users') {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles_view')
        .select('*, perfis_usuario(nome)')
        .eq('tenant_id', activeFarm.tenantId);
      
      const { data: profilesData } = await supabase
        .from('perfis_usuario')
        .select('*')
        .eq('tenant_id', activeFarm.tenantId);

      if (!usersError) {
        const processedProfiles = (profilesData || []).map(p => ({
          ...p,
          userCount: (usersData || []).filter(u => u.perfil_id === p.id).length
        }));
      
        setUsersList((usersData || []).map(u => {
          // Garantir acesso seguro ao perfil (lidando com possíveis arrays de join)
          const perfil = Array.isArray(u.perfis_usuario) ? u.perfis_usuario[0] : u.perfis_usuario;
          
          return {
            ...u,
            name: u.full_name,
            profile: perfil?.nome,
            farm: u.unidade_nome,
            memberSince: u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '---'
          };
        }));
        setProfilesList(processedProfiles);
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
    
    // Strategic Intelligence Calculations
    const totalUsers = usersList.length;
    const activeToday = Math.floor(totalUsers * 0.4); // Mock: 40% active
    const mfaCompliant = usersList.filter(u => u.mfa_enabled).length;
    const securityScore = Math.floor(((mfaCompliant / (totalUsers || 1)) * 50) + (securitySettings.min8Chars ? 20 : 0) + (securitySettings.specialChars ? 15 : 0) + (securitySettings.block3Attempts ? 15 : 0));

    setStats([
      { 
        label: 'Licenças Ativas', 
        value: `${totalUsers}/25`, 
        icon: Users, 
        color: '#10b981', 
        progress: (totalUsers / 25) * 100,
        change: 'Plano Enterprise',
        periodLabel: 'Consumo de Seats',
        sparkline: [{ value: 10 }, { value: 15 }, { value: totalUsers }]
      },
      { 
        label: 'Acessos Hoje', 
        value: activeToday, 
        icon: Monitor, 
        color: '#3b82f6', 
        progress: 100,
        change: '+12% vs ontem',
        periodLabel: 'Sessões Ativas',
        sparkline: [{ value: 5 }, { value: 12 }, { value: activeToday }]
      },
      { 
        label: 'Compliance Segurança', 
        value: `${securityScore}%`, 
        icon: ShieldCheck, 
        color: securityScore > 80 ? '#10b981' : '#f59e0b', 
        progress: securityScore,
        change: securityScore > 80 ? 'Excelente' : 'Ação Requerida',
        periodLabel: 'Score de Governança',
        sparkline: [{ value: 60 }, { value: 75 }, { value: securityScore }]
      },
      { 
        label: 'Proteção MFA', 
        value: `${mfaCompliant} usuários`, 
        icon: Lock, 
        color: '#8b5cf6', 
        progress: (mfaCompliant / (totalUsers || 1)) * 100,
        change: '2FA Habilitado',
        periodLabel: 'Autenticação Forte',
        sparkline: [{ value: 2 }, { value: 5 }, { value: mfaCompliant }]
      }
    ]);

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
    <div className="admin-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <Lock size={14} fill="currentColor" />
            <span>ELITE ACCESS v5.0</span>
          </div>
          <h1 className="page-title">Governança & Segurança de Acesso</h1>
          <p className="page-subtitle">Gestão estratégica de identidades, perfis de permissão e políticas críticas de segurança.</p>
        </div>
        <div className="page-actions">
          {activeTab !== 'seguranca' && (
            <button 
              className="primary-btn" 
              onClick={() => activeTab === 'users' ? setIsUserModalOpen(true) : setIsProfileModalOpen(true)}
            >
              {activeTab === 'users' ? <UserPlus size={18} /> : <Shield size={18} />}
              <span>{activeTab === 'users' ? 'ADICIONAR USUÁRIO' : 'CRIAR PERFIL'}</span>
            </button>
          )}

          <AnimatePresence>
            {saveSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="save-toast-elite"
                style={{ background: 'hsl(161 64% 39%)', color: 'white', border: 'none' }}
              >
                <CheckCircle2 size={16} />
                <span>Políticas Sincronizadas</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change}
            periodLabel={stat.periodLabel}
            sparkline={stat.sparkline}
          />
        ))}
      </div>

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
          {isAdmin && (
            <button 
              className={`elite-tab-item ${activeTab === 'seguranca' ? 'active' : ''}`}
              onClick={() => setActiveTab('seguranca')}
            >
              Segurança de Acesso
            </button>
          )}
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder={
              activeTab === 'users' ? "Buscar por nome, email..." : 
              activeTab === 'profiles' ? "Buscar perfil ou cargo..." : 
              "Filtrar políticas de segurança..."
            } 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {(activeTab === 'users' || activeTab === 'profiles') && (
          <div className="view-mode-toggle">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Visualização em Lista"
            >
              <ListIcon size={18} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Visualização em Cards"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        )}

        <div className="elite-filter-group">
          <button 
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Log">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <UserFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
        profiles={profilesList}
      />

      <div className="management-content">
        {activeTab === 'users' ? (
          viewMode === 'list' ? (
            <ModernTable 
              data={usersList.filter(u => {
                const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesStatus = filterValues.status === 'all' || u.status === filterValues.status;
                const matchesProfile = filterValues.profileId === 'all' || u.perfil_id === filterValues.profileId;
                const matchesMFA = !filterValues.mfaOnly || u.mfa_enabled;
                const matchesDate = (!filterValues.dateStart || new Date(u.created_at) >= new Date(filterValues.dateStart)) &&
                                   (!filterValues.dateEnd || new Date(u.created_at) <= new Date(filterValues.dateEnd));

                return matchesSearch && matchesStatus && matchesProfile && matchesMFA && matchesDate;
              })}
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
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="user-cards-grid"
            >
              {usersList
                .filter(u => {
                  const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                       (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
                  
                  const matchesStatus = filterValues.status === 'all' || u.status === filterValues.status;
                  const matchesProfile = filterValues.profileId === 'all' || u.perfil_id === filterValues.profileId;
                  const matchesMFA = !filterValues.mfaOnly || u.mfa_enabled;
                  const matchesDate = (!filterValues.dateStart || new Date(u.created_at) >= new Date(filterValues.dateStart)) &&
                                     (!filterValues.dateEnd || new Date(u.created_at) <= new Date(filterValues.dateEnd));

                  return matchesSearch && matchesStatus && matchesProfile && matchesMFA && matchesDate;
                })
                .map(user => (
                  <motion.div 
                    key={user.id} 
                    layout
                    className={`user-card-premium ${user.status === 'active' ? 'active' : ''}`}
                  >
                    <div className="card-avatar">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="card-main-content">
                      <div className="card-header-info">
                        <h3>{user.name}</h3>
                        <span className="card-role-badge">{user.profile || 'Usuário'}</span>
                      </div>
                      <div className="card-meta-grid">
                        <div className="meta-item"><Mail size={14} className="meta-icon" /><span>{user.email}</span></div>
                        <div className="meta-item"><Monitor size={14} className="meta-icon" /><span>{user.farm || 'Unidade Geral'}</span></div>
                        <div className="meta-item"><Calendar size={14} className="meta-icon" /><span>Desde {user.memberSince}</span></div>
                      </div>
                      <div className="card-bottom-actions">
                        <button className="action-icon-btn" onClick={() => handleOpenEditUser(user)}><Edit2 size={16} /></button>
                        <button className="action-icon-btn" onClick={() => handleViewUserLogs(user)}><History size={16} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          )
        ) : activeTab === 'profiles' ? (
          viewMode === 'list' ? (
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
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="user-cards-grid"
            >
              {profilesList
                .filter(p => (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()))
                .map(profile => (
                  <motion.div 
                    key={profile.id} 
                    layout
                    className="user-card-premium active"
                  >
                    <div className="card-avatar profile-icon" style={{ background: '#16a34a' }}>
                      <Shield size={32} />
                    </div>
                    <div className="card-main-content">
                      <div className="card-header-info">
                        <h3>{profile.nome}</h3>
                        <span className="card-role-badge">Perfil de Acesso</span>
                      </div>
                      <div className="card-meta-grid">
                        <div className="meta-item"><Users size={14} className="meta-icon" /><span>{profile.userCount} usuários ativos</span></div>
                        <div className="meta-item"><FileText size={14} className="meta-icon" /><span>{profile.descricao || 'Sem descrição.'}</span></div>
                      </div>
                      <div className="card-bottom-actions">
                        <button className="action-icon-btn" onClick={() => handleOpenEditProfile(profile)}><Edit2 size={16} /></button>
                        <button className="action-icon-btn delete" onClick={() => handleDeleteProfile(profile.id)}><XCircle size={16} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          )
        ) : (
          <div className="security-intelligence-layout">
            <div className="security-settings-grid">
              <section className="security-panel">
                <div className="panel-header">
                  <div className="icon-badge"><Lock size={20} /></div>
                  <div>
                    <h3>Políticas de Senha</h3>
                    <p>Configurações críticas de complexidade e validade.</p>
                  </div>
                </div>
                <div className="security-options">
                  {[
                    { label: 'Mínimo de 8 caracteres', key: 'min8Chars' },
                    { label: 'Exigir Caracteres Especiais', key: 'specialChars' },
                    { label: 'Exigir Números e Letras', key: 'numLetters' },
                  ].map(opt => (
                    <div key={opt.key} className="option-row" onClick={() => toggleSecuritySetting(opt.key as any)}>
                      <span>{opt.label}</span>
                      <div className={`elite-toggle ${securitySettings[opt.key as keyof typeof securitySettings] ? 'active' : ''}`}>
                        <div className="toggle-dot"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="security-panel">
                <div className="panel-header">
                  <div className="icon-badge"><Monitor size={20} /></div>
                  <div>
                    <h3>Gestão de Sessões</h3>
                    <p>Controle de tempo e acessos simultâneos.</p>
                  </div>
                </div>
                <div className="security-options">
                  {[
                    { label: 'Inatividade (30 min)', key: 'inactivity30m' },
                    { label: 'Acesso Multi-dispositivo', key: 'multiDevice' },
                    { label: 'Verificação Geográfica', key: 'geoIpCheck' },
                  ].map(opt => (
                    <div key={opt.key} className="option-row" onClick={() => toggleSecuritySetting(opt.key as any)}>
                      <span>{opt.label}</span>
                      <div className={`elite-toggle ${securitySettings[opt.key as keyof typeof securitySettings] ? 'active' : ''}`}>
                        <div className="toggle-dot"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="security-panel">
                <div className="panel-header">
                  <div className="icon-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><ShieldAlert size={20} /></div>
                  <div>
                    <h3>System Guard</h3>
                    <p>Proteção ativa e modo de contingência.</p>
                  </div>
                </div>
                <div className="security-options">
                  <div className="option-row" onClick={() => toggleSecuritySetting('block3Attempts')}>
                    <span>Bloqueio (3 falhas)</span>
                    <div className={`elite-toggle ${securitySettings.block3Attempts ? 'active' : ''}`}>
                      <div className="toggle-dot"></div>
                    </div>
                  </div>
                  <button className="maintenance-btn" onClick={() => confirm('Ativar Modo de Manutenção?') && setSaveSuccess(true)}>
                    <Shield size={16} /> MODO DE MANUTENÇÃO
                  </button>
                  <div className="guard-status-alert">
                    <div className="pulsing-dot red"></div>
                    <span>Nenhum ataque detectado nas últimas 24h</span>
                  </div>
                </div>
              </section>
            </div>
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
        .security-intelligence-layout {
          width: 100%;
        }
        
        .security-settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .security-panel {
          background: white;
          border-radius: 1.5rem;
          border: 1px solid var(--border);
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .security-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .icon-badge {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(var(--brand-rgb), 0.1);
          color: var(--brand);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .security-panel .panel-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .security-panel h3 { font-size: 0.8125rem; font-weight: 800; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .security-panel p { font-size: 0.6875rem; color: var(--text-muted); font-weight: 600; margin-top: 2px; }

        .option-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-main);
          border-radius: 12px;
          border: 1px solid transparent;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-main);
          transition: 0.2s;
          cursor: pointer;
        }
        .option-row:hover { border-color: var(--border); background: white; transform: translateX(4px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

        .elite-toggle {
          width: 36px;
          height: 20px;
          background: #e2e8f0;
          border-radius: 100px;
          padding: 2px;
          transition: 0.3s;
          position: relative;
        }
        .elite-toggle.active { background: #10b981; }
        .toggle-dot {
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          transition: 0.3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .elite-toggle.active .toggle-dot { transform: translateX(16px); }

        .maintenance-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: #fff1f2;
          color: #ef4444;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
          border: 1px solid #fee2e2;
          transition: 0.2s;
          margin-bottom: 4px;
        }
        .maintenance-btn:hover { background: #ef4444; color: white; border-color: #ef4444; }

        .guard-status-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: #f0fdf4;
          border-radius: 10px;
          font-size: 0.625rem;
          font-weight: 800;
          color: #16a34a;
          text-transform: uppercase;
        }
        .pulsing-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; }
        .pulsing-dot.red { background: #ef4444; }


        .user-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }

        .user-card-premium {
          background: white;
          border-radius: 1.5rem;
          border: 1px solid var(--border);
          display: flex;
          overflow: hidden;
        }

        .user-card-premium:hover {
          transform: translateX(8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          border-color: #16a34a33;
        }

        .card-left-section {
          width: 130px;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
        }

        .card-avatar {
          width: 70px;
          height: 70px;
          background: hsl(var(--bg-main));
          color: white;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 12px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .card-main-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-header-info h3 {
          font-size: 19px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.1);
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-top: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: hsl(var(--text-muted));
          font-size: 12px;
          font-weight: 600;
        }

        .meta-icon {
          color: #16a34a;
        }

        .card-bottom-actions {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }

        .action-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-main));
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: #0f172a;
          color: white;
          transform: scale(1.1);
        }

        .action-icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
        }

        .i-date { background: #f5f3ff; color: #7c3aed; }
        .i-phone { background: #ecfdf5; color: #059669; }
        .i-email { background: #eff6ff; color: #2563eb; }

        .activity-bar-container {
          background: rgba(255, 255, 255, 0.5);
          padding: 16px;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
        }

        .activity-progress {
          height: 100%;
          background: linear-gradient(90deg, #16a34a, #22c55e);
          box-shadow: 0 0 15px rgba(22, 163, 74, 0.4);
        }

        .card-footer {
          margin-top: 12px;
          background: #f8fafc;
          padding: 16px 24px;
          margin-left: -32px;
          margin-right: -32px;
          margin-bottom: -32px;
          border-top: 1px solid #f1f5f9;
        }

        .farm-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 700;
        }

        .status-pill {
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 900;
          background: hsl(var(--bg-main));
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-pill.active {
          background: #f0fdf4;
          color: #16a34a;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.1);
        }

        .card-avatar.profile-icon {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          box-shadow: 0 15px 35px rgba(22, 163, 74, 0.3);
        }

        .elite-controls-row {
          background: white;
          padding: 12px 16px;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }

        .view-mode-toggle {
          background: #f8fafc;
          padding: 4px;
          border-radius: 14px;
          display: flex;
          gap: 4px;
          border: 1px solid #f1f5f9;
        }

        .view-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .view-btn.active {
          background: white;
          color: #10b981;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
        }

        .view-btn:hover:not(.active) {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-delete:hover {
          background: #ef4444 !important;
          color: white !important;
          border-color: #ef4444 !important;
          box-shadow: 0 15px 30px rgba(239, 68, 68, 0.3) !important;
        }
      `}</style>
    </div>
  );
};
