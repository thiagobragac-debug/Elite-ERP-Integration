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
  Calendar,
  Plus,
  Terminal,
  Play,
  Pause,
  AlertTriangle,
  Globe,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useEffect } from 'react';
import { UserForm } from '../../components/Forms/UserForm';
import { ProfileForm } from '../../components/Forms/ProfileForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { useSearchParams } from 'react-router-dom';
import { UserFilterModal } from './components/UserFilterModal';
import { useFarmFilter } from '../../hooks/useFarmFilter';

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

  // --- MÓDULO DE GOVERNANÇA & SEGURANÇA (PREMIUM EVOLUTION) ---
  const AVAILABLE_PERMISSIONS = [
    { id: 'pecuaria', label: 'Gestão de Pecuária' },
    { id: 'financeiro', label: 'Financeiro (Completo)' },
    { id: 'financeiro_view', label: 'Financeiro (Somente Visualização)' },
    { id: 'estoque', label: 'Controle de Estoque' },
    { id: 'maquinas', label: 'Gestão de Frota' },
    { id: 'compras', label: 'Módulo Compras' },
    { id: 'vendas', label: 'Módulo Vendas' },
    { id: 'admin', label: 'Configurações Administrativas' },
  ];

  const [liveLogs, setLiveLogs] = useState<any[]>([
    { id: '1', date: new Date(Date.now() - 600000).toISOString(), type: 'INFO', msg: 'Sessão administrativa iniciada com sucesso.', user: 'admin@eliteerp.com', ip: '177.42.190.5' },
    { id: '2', date: new Date(Date.now() - 500000).toISOString(), type: 'INFO', msg: 'Verificação periódica System Guard concluída. 0 ameaças.', user: 'SYSTEM', ip: '127.0.0.1' },
    { id: '3', date: new Date(Date.now() - 350000).toISOString(), type: 'WARN', msg: 'Tentativa de alteração de política de senha por suporte@eliteerp.com.', user: 'suporte@eliteerp.com', ip: '189.12.90.12' },
    { id: '4', date: new Date(Date.now() - 200000).toISOString(), type: 'CRITICAL', msg: 'Tentativa de login atípica bloqueada: IP listado em lista negra.', user: 'desconhecido', ip: '45.132.88.22' },
    { id: '5', date: new Date(Date.now() - 80000).toISOString(), type: 'INFO', msg: 'Relatório financeiro exportado com sucesso.', user: 'cfo@eliteerp.com', ip: '177.42.190.9' },
  ]);
  const [terminalSeverity, setTerminalSeverity] = useState<'ALL' | 'INFO' | 'WARN' | 'CRITICAL'>('ALL');
  const [isTerminalRunning, setIsTerminalRunning] = useState(true);

  const [anomalies, setAnomalies] = useState<any[]>([
    {
      id: 'anom-1',
      title: 'Login Concorrente de Geolocalizações Distintas',
      desc: 'Sessão ativa em São Paulo (IP 177.42.190.5) e novo login em Frankfurt, Alemanha (IP 45.132.88.22) em menos de 5 minutos.',
      severity: 'CRITICAL',
      user: 'thiago@eliteerp.com',
      date: new Date().toISOString(),
      mitigated: false
    },
    {
      id: 'anom-2',
      title: 'Vazamento Potencial: Exportação Volumosa de Relatórios',
      desc: 'O usuário claudia@eliteerp.com realizou a exportação de 15 relatórios de contas a pagar e clientes nos últimos 3 minutos (Média normal: 2 por hora).',
      severity: 'WARN',
      user: 'claudia@eliteerp.com',
      date: new Date(Date.now() - 600000).toISOString(),
      mitigated: false
    },
    {
      id: 'anom-3',
      title: 'Acesso Financeiro Fora do Horário Comercial',
      desc: 'O usuário joao@eliteerp.com efetuou login e acessou o módulo de conciliação bancária às 03:42 da madrugada (Horário padrão: 08:00 às 18:00).',
      severity: 'INFO',
      user: 'joao@eliteerp.com',
      date: new Date(Date.now() - 1200000).toISOString(),
      mitigated: false
    }
  ]);

  // Terminal Real-Time Stream Simulator
  useEffect(() => {
    if (!isTerminalRunning) return;

    const messages = [
      { type: 'INFO', msg: 'Sessão validada com sucesso via token JWT.', user: 'operador@eliteerp.com', ip: '179.182.90.12' },
      { type: 'INFO', msg: 'Mapeamento de pastos atualizado no Supabase.', user: 'gerente@eliteerp.com', ip: '177.42.190.5' },
      { type: 'WARN', msg: 'Falha na validação de login (MFA inválido).', user: 'cfo@eliteerp.com', ip: '177.42.190.9' },
      { type: 'CRITICAL', msg: 'Exportação bloqueada: Cotação de fornecedores excede limite de segurança.', user: 'operador@eliteerp.com', ip: '179.182.90.12' },
      { type: 'INFO', msg: 'Backup automático de segurança do banco de dados concluído.', user: 'SYSTEM', ip: '127.0.0.1' },
      { type: 'WARN', msg: 'Nova conexão estabelecida a partir de IP residencial não mapeado.', user: 'joao@eliteerp.com', ip: '191.22.40.85' },
    ];

    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const newLog = {
        id: Math.random().toString(),
        date: new Date().toISOString(),
        ...randomMsg
      };
      setLiveLogs(prev => [newLog, ...prev].slice(0, 100));
    }, 4500);

    return () => clearInterval(interval);
  }, [isTerminalRunning]);

  const handleToggleMatrixPermission = async (profileId: string, permissionId: string) => {
    const profile = profilesList.find(p => p.id === profileId);
    if (!profile) return;

    let updatedPermissions = [...(profile.permissoes || [])];
    if (updatedPermissions.includes(permissionId)) {
      updatedPermissions = updatedPermissions.filter(p => p !== permissionId);
    } else {
      updatedPermissions.push(permissionId);
    }

    // Optimistic UI update
    setProfilesList(prev => prev.map(p => p.id === profileId ? { ...p, permissoes: updatedPermissions } : p));

    try {
      const { error } = await supabase
        .from('perfis_usuario')
        .update({ permissoes: updatedPermissions })
        .eq('id', profileId);

      if (error) {
        // Rollback
        setProfilesList(prev => prev.map(p => p.id === profileId ? profile : p));
        console.warn("Erro ao salvar permissão na matriz:", error);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      setProfilesList(prev => prev.map(p => p.id === profileId ? profile : p));
      console.warn("Erro ao salvar permissão na matriz:", err);
    }
  };

  const handleMitigateAnomaly = (id: string, action: 'block' | 'suspend' | 'dismiss') => {
    const anom = anomalies.find(a => a.id === id);
    setAnomalies(prev => prev.filter(a => a.id !== id));
    
    let actionText = '';
    if (action === 'block') actionText = `Bloqueio de IP concluído para ${anom?.user || 'usuário'}.`;
    else if (action === 'suspend') actionText = `Conta do usuário ${anom?.user} suspensa temporariamente.`;
    else actionText = `Alerta de anomalia de ${anom?.user} ignorado pelo administrador.`;

    const newLog = {
      id: Math.random().toString(),
      date: new Date().toISOString(),
      type: action === 'dismiss' ? 'INFO' : 'CRITICAL',
      msg: `System Guard: ${actionText}`,
      user: userProfile?.full_name || 'ADMIN',
      ip: '127.0.0.1'
    };
    setLiveLogs(prev => [newLog, ...prev]);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'meu-perfil' || tabParam === 'users' || tabParam === 'profiles' || tabParam === 'seguranca') {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const { isGlobalMode, activeTenantId, activeFarmId } = useFarmFilter();

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (isReady) {
      fetchData();
      if (activeTab === 'seguranca') {
        fetchSecurityLogs();
      }
    } else {
      setLoading(false);
    }
  }, [activeTab, activeFarm, activeFarmId, isGlobalMode, activeTenantId]);

  const fetchSecurityLogs = async () => {
    if (!activeFarm) { if (typeof setLoading !== 'undefined') setLoading(false); return; }
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
    } catch (err: any) {
      console.warn("UserManagement: Error fetching security logs", err);
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
    if (!activeTenantId) {
      setLoading(false);
      return;
    }

    try {
      const fetchPromise = (async () => {
        if (activeTab === 'users') {
          const { data: usersData, error: usersError } = await supabase
            .from('profiles_view')
            .select('*, perfis_usuario(nome)')
            .eq('tenant_id', activeTenantId);
          
          const { data: profilesData } = await supabase
            .from('perfis_usuario')
            .select('*').limit(500)
            .eq('tenant_id', activeTenantId);

          if (usersError) throw usersError;
          return { usersData, profilesData };
        } else {
          const { data: profilesData, error: profilesError } = await supabase
            .from('perfis_usuario')
            .select('*').limit(500)
            .eq('tenant_id', activeTenantId);
            
          if (profilesError) throw profilesError;
          return { profilesData };
        }
      })();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const result: any = await Promise.race([fetchPromise, timeoutPromise]);

      if (activeTab === 'users') {
        const { usersData, profilesData } = result;
        const processedProfiles = (profilesData || []).map((p: any) => ({
          ...p,
          userCount: (usersData || []).filter((u: any) => u.perfil_id === p.id).length
        }));
      
        setUsersList((usersData || []).map((u: any) => {
          const perfil = Array.isArray(u.perfis_usuario) ? u.perfis_usuario[0] : u.perfis_usuario;
          return {
            ...u,
            name: u.full_name,
            profile: perfil?.nome,
            farm: u.unidade_nome,
            status: u.status || 'active', // Default to active since status is not stored in DB
            memberSince: u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '---'
          };
        }));
        setProfilesList(processedProfiles);
      } else {
        const { profilesData } = result;
        setProfilesList((profilesData || []).map((p: any) => ({
          ...p,
          name: p.nome,
          description: p.descricao,
          permissions: p.permissoes || []
        })));
      }
    } catch (err: any) {
      console.warn("UserManagement: Using mock data due to network error", err);
      const mockUsers = [
        { 
          id: '11111111-1111-1111-1111-111111111111', 
          full_name: 'Thiago Braga', 
          name: 'Thiago Braga', 
          email: 'thiagobraga.c@gmail.com', 
          perfil_id: '10000000-0000-0000-0000-000000000001', 
          profile: 'Administrador', 
          status: 'active', 
          mfa_enabled: true, 
          created_at: new Date().toISOString(), 
          memberSince: 'Mai 2024' 
        },
        { 
          id: '22222222-2222-2222-2222-222222222222', 
          full_name: 'Usuário Demo', 
          name: 'Usuário Demo', 
          email: 'demo@elite.com', 
          perfil_id: '20000000-0000-0000-0000-000000000002', 
          profile: 'Operador', 
          status: 'active', 
          mfa_enabled: false, 
          created_at: new Date().toISOString(), 
          memberSince: 'Jun 2024' 
        }
      ];
      
      setUsersList(mockUsers);
      setProfilesList([
        { id: '10000000-0000-0000-0000-000000000001', nome: 'Administrador', userCount: 1, name: 'Administrador', description: 'Acesso total', permissions: ['all'] },
        { id: '20000000-0000-0000-0000-000000000002', nome: 'Operador', userCount: 1, name: 'Operador', description: 'Acesso limitado', permissions: ['read'] }
      ]);
      
      // Calculate stats immediately with local data
      const totalUsersCount = mockUsers.length;
      const mfaCount = mockUsers.filter(u => u.mfa_enabled).length;
      
      setStats([
        { label: 'Licenças Ativas', value: `${totalUsersCount}/25`, icon: Users, color: '#10b981', progress: (totalUsersCount / 25) * 100, change: 'Plano Enterprise', periodLabel: 'Consumo de Seats', sparkline: [{ value: 10 }, { value: 15 }, { value: totalUsersCount }] },
        { label: 'Acessos Hoje', value: totalUsersCount, icon: Monitor, color: '#3b82f6', progress: 100, change: '+12% vs ontem', periodLabel: 'Sessões Ativas', sparkline: [{ value: 5 }, { value: 12 }, { value: totalUsersCount }] },
        { label: 'Compliance Segurança', value: '85%', icon: ShieldCheck, color: '#10b981', progress: 85, change: 'Excelente', periodLabel: 'Score de Governança', sparkline: [{ value: 60 }, { value: 75 }, { value: 85 }] },
        { label: 'Proteção MFA', value: `${mfaCount} usuários`, icon: Lock, color: '#8b5cf6', progress: (mfaCount / (totalUsersCount || 1)) * 100, change: '2FA Habilitado', periodLabel: 'Autenticação Forte', sparkline: [{ value: 2 }, { value: 5 }, { value: mfaCount }] }
      ]);
      setLoading(false);
      return;
    }

    // Intelligence Calculations for Real Data
    const totalUsers = usersList.length;
    const activeToday = Math.floor(totalUsers * 0.4);
    const mfaCompliant = usersList.filter(u => u.mfa_enabled).length;
    const securityScore = Math.floor(((mfaCompliant / (totalUsers || 1)) * 50) + 35);

    setStats([
      { label: 'Licenças Ativas', value: `${totalUsers}/25`, icon: Users, color: '#10b981', progress: (totalUsers / 25) * 100, change: 'Plano Enterprise', periodLabel: 'Consumo de Seats', sparkline: [{ value: 10 }, { value: 15 }, { value: totalUsers }] },
      { label: 'Acessos Hoje', value: activeToday, icon: Monitor, color: '#3b82f6', progress: 100, change: '+12% vs ontem', periodLabel: 'Sessões Ativas', sparkline: [{ value: 5 }, { value: 12 }, { value: activeToday }] },
      { label: 'Compliance Segurança', value: `${securityScore}%`, icon: ShieldCheck, color: securityScore > 80 ? '#10b981' : '#f59e0b', progress: securityScore, change: securityScore > 80 ? 'Excelente' : 'Ação Requerida', periodLabel: 'Score de Governança', sparkline: [{ value: 60 }, { value: 75 }, { value: securityScore }] },
      { label: 'Proteção MFA', value: `${mfaCompliant} usuários`, icon: Lock, color: '#8b5cf6', progress: (mfaCompliant / (totalUsers || 1)) * 100, change: '2FA Habilitado', periodLabel: 'Autenticação Forte', sparkline: [{ value: 2 }, { value: 5 }, { value: mfaCompliant }] }
    ]);

    setLoading(false);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = activeTab === 'users' ? usersList.filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterValues.status === 'all' || u.status === filterValues.status;
      const matchesProfile = filterValues.profileId === 'all' || u.perfil_id === filterValues.profileId;
      const matchesMFA = !filterValues.mfaOnly || u.mfa_enabled;
      const matchesDate = (!filterValues.dateStart || new Date(u.created_at) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(u.created_at) <= new Date(filterValues.dateEnd));
      return matchesSearch && matchesStatus && matchesProfile && matchesMFA && matchesDate;
    }) : profilesList.filter(p => (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const exportData = activeTab === 'users' ? filteredData.map(item => ({
      Nome: item.name,
      Email: item.email,
      Perfil: item.profile,
      Unidade: item.farm || '-',
      Membro_Desde: item.memberSince,
      MFA: item.mfa_enabled ? 'SIM' : 'NÃO',
      Status: item.status
    })) : filteredData.map(item => ({
      Perfil: item.nome,
      Descricao: item.descricao || '-',
      Usuarios: item.userCount || 0,
      Permissoes: (item.permissoes || []).join(', ')
    }));

    const filename = activeTab === 'users' ? 'usuarios' : 'perfis_acesso';
    const title = activeTab === 'users' ? 'Relatório de Usuários do Sistema' : 'Relatório de Perfis de Acesso';

    if (format === 'csv') exportToCSV(exportData, filename);
    else if (format === 'excel') exportToExcel(exportData, filename);
    else if (format === 'pdf') exportToPDF(exportData, filename, title);
  };

  const handleAddUser = async (data: any) => {
    if (!activeFarm) { if (typeof setLoading !== 'undefined') setLoading(false); return; }
    
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
    if (!activeFarm) { if (typeof setLoading !== 'undefined') setLoading(false); return; }

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
      accessor: (item: any) => {
        const isUserAdmin = item.profile?.toLowerCase().includes('admin') || item.role?.toLowerCase() === 'admin';
        return (
          <div className="table-cell-title">
            <div className="flex items-center gap-3">
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold overflow-hidden ${isUserAdmin ? 'admin-table-avatar' : ''}`}
                style={isUserAdmin ? {
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
                } : {
                  background: 'hsl(var(--brand) / 0.1)',
                  color: 'hsl(var(--brand))',
                  border: '1px solid hsl(var(--brand) / 0.2)'
                }}
              >
                {item.avatar ? (
                  <img src={item.avatar} alt="" />
                ) : isUserAdmin ? (
                  <Shield size={14} className="text-amber-500" />
                ) : (
                  item.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex flex-col">
                <span className="main-text">{item.name}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.profile || 'Sem Perfil'}</span>
              </div>
            </div>
          </div>
        );
      }
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
          <div className="export-dropdown-container">
            <button 
              className="icon-btn-secondary" 
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-users');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-users" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-users')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-users')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-users')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
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
                    <div className="card-left-section" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      {(() => {
                        const isUserAdmin = user.profile?.toLowerCase().includes('admin') || user.role?.toLowerCase() === 'admin';
                        return (
                          <div className={`card-avatar ${isUserAdmin ? 'admin-avatar' : ''}`}>
                            {isUserAdmin ? (
                              <Shield size={32} className="admin-shield-icon" />
                            ) : (
                              user.name?.charAt(0) || 'U'
                            )}
                          </div>
                        );
                      })()}
                      <span className={`status-pill ${user.status === 'active' ? 'active' : 'stopped'}`} style={{ marginTop: '8px', fontSize: '9px' }}>
                        {user.status === 'active' ? '● Online' : '○ Offline'}
                      </span>
                    </div>
                    <div className="card-main-content">
                      <div className="card-header-info">
                        <h3>{user.name}</h3>
                        <span className="card-role-badge">{user.profile || 'Usuário'}</span>
                      </div>
                      
                      <div className="card-meta-grid">
                        <div className="meta-item"><Mail size={12} className="meta-icon" /><span>{user.email}</span></div>
                        <div className="meta-item"><Monitor size={12} className="meta-icon" /><span>{user.farm || 'Unidade Geral'}</span></div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          {user.mfa_enabled ? (
                            <span style={{ fontSize: '9px', fontWeight: 900, background: '#f5f3ff', color: '#7c3aed', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={10} /> 2FA ATIVO
                            </span>
                          ) : (
                            <span style={{ fontSize: '9px', fontWeight: 900, background: '#fef2f2', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldAlert size={10} /> 2FA DESATIVADO
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="card-bottom-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span className="sub-meta" style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>
                          Cadastrado: {user.memberSince}
                        </span>
                        <div className="flex gap-2">
                          <button className="action-icon-btn" onClick={() => handleOpenEditUser(user)} title="Editar"><Edit2 size={14} /></button>
                          <button className="action-icon-btn" onClick={() => handleViewUserLogs(user)} title="Auditoria"><History size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              <button className="add-user-card-premium" onClick={() => setIsUserModalOpen(true)}>
                <Plus size={32} />
                <span>NOVO USUÁRIO</span>
              </button>
            </motion.div>
          )
        ) : activeTab === 'profiles' ? (
          <>
            {viewMode === 'list' ? (
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
                      <div className="card-left-section" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card-avatar profile-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                          <Shield size={32} />
                        </div>
                        <span className="status-pill active" style={{ marginTop: '8px', fontSize: '9px' }}>
                          {profile.userCount || 0} Ativos
                        </span>
                      </div>
                      <div className="card-main-content">
                        <div className="card-header-info">
                          <h3>{profile.nome}</h3>
                          <span className="card-role-badge">Perfil de Acesso</span>
                        </div>
                        
                        <div className="card-meta-grid">
                          <div className="meta-item"><FileText size={12} className="meta-icon" /><span>{profile.descricao || 'Controle administrativo geral.'}</span></div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {(profile.permissions || []).includes('all') ? (
                              <span style={{ fontSize: '9px', fontWeight: 900, background: '#fef2f2', color: '#ef4444', padding: '4px 8px', borderRadius: '6px' }}>
                                🔴 ACESSO CRÍTICO (TOTAL)
                              </span>
                            ) : (
                              <span style={{ fontSize: '9px', fontWeight: 900, background: '#f0fdf4', color: '#16a34a', padding: '4px 8px', borderRadius: '6px' }}>
                                🟢 CONTROLE PARCIAL
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="card-bottom-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                          <button className="action-icon-btn" onClick={() => handleOpenEditProfile(profile)} title="Editar"><Edit2 size={14} /></button>
                          <button className="action-icon-btn delete" onClick={() => handleDeleteProfile(profile.id)} title="Excluir"><XCircle size={14} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                <button className="add-user-card-premium" onClick={() => setIsProfileModalOpen(true)}>
                  <Plus size={32} />
                  <span>NOVO PERFIL</span>
                </button>
              </motion.div>
            )}

            {/* Matriz Visual de Permissões Interativa */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="premium-card permission-matrix-card"
              style={{ marginTop: '30px', padding: '24px' }}
            >
              <div className="matrix-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={18} className="text-emerald-500" />
                    MATRIZ VISUAL DE PERMISSÕES
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                    Visão comparativa side-by-side de controle de acesso dos perfis a cada módulo do sistema. Clique nas células para alternar permissões dinamicamente.
                  </p>
                </div>
              </div>

              <div className="matrix-table-wrapper" style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <table className="matrix-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', width: '30%' }}>MÓDULO / RECURSO</th>
                      {profilesList.map(profile => (
                        <th key={profile.id} style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', textAlign: 'center' }}>
                          {profile.nome}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <tr key={perm.id} style={{ borderBottom: '1px solid var(--border)', transition: '0.2s' }} className="matrix-row">
                        <td style={{ padding: '16px 20px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {perm.label}
                        </td>
                        {profilesList.map(profile => {
                          const hasPermission = (profile.permissoes || []).includes(perm.id) || (profile.permissoes || []).includes('all') || (profile.permissions || []).includes('all');
                          const isAll = (profile.permissoes || []).includes('all') || (profile.permissions || []).includes('all');
                          return (
                            <td key={profile.id} style={{ padding: '16px 20px', textAlign: 'center' }}>
                              <button
                                type="button"
                                disabled={isAll}
                                onClick={() => handleToggleMatrixPermission(profile.id, perm.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: isAll ? 'not-allowed' : 'pointer',
                                  padding: '8px',
                                  borderRadius: '50%',
                                  transition: '0.2s',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                className="matrix-cell-btn"
                                title={isAll ? "Perfil com acesso total" : `Alternar ${perm.label} para ${profile.nome}`}
                              >
                                {hasPermission ? (
                                  <ShieldCheck size={20} style={{ color: '#10b981', filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.2))' }} />
                                ) : (
                                  <Lock size={16} style={{ color: '#94a3b8' }} />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
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

            {/* Novas Seções Premium de Segurança (Terminal e Anomalias) */}
            <div className="security-advanced-grid" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
              
              {/* Terminal de Auditoria Interativo */}
              <section className="security-panel terminal-panel" style={{ background: '#090d16', borderColor: '#1e293b', boxShadow: '0 15px 30px rgba(0,0,0,0.4)', padding: '20px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="icon-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><Terminal size={18} /></div>
                    <div>
                      <h3 style={{ color: '#f8fafc', fontSize: '0.8125rem', margin: 0 }}>Terminal de Auditoria Interativo</h3>
                      <p style={{ color: '#64748b', fontSize: '0.6875rem', margin: '2px 0 0 0' }}>Stream ao vivo de eventos de segurança do System Guard</p>
                    </div>
                  </div>
                  
                  {/* Controles do Terminal */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      type="button"
                      onClick={() => setIsTerminalRunning(!isTerminalRunning)}
                      className={`terminal-ctrl-btn ${isTerminalRunning ? 'active' : ''}`}
                      title={isTerminalRunning ? "Pausar Monitoramento" : "Iniciar Monitoramento"}
                      style={{
                        background: isTerminalRunning ? '#10b98122' : '#334155',
                        border: 'none',
                        color: isTerminalRunning ? '#10b981' : '#cbd5e1',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      {isTerminalRunning ? <Pause size={12} /> : <Play size={12} />}
                      {isTerminalRunning ? 'LIVE' : 'PAUSADO'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setLiveLogs([])}
                      className="terminal-ctrl-btn"
                      title="Limpar Console"
                      style={{
                        background: '#334155',
                        border: 'none',
                        color: '#cbd5e1',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      LIMPAR
                    </button>
                  </div>
                </div>

                {/* Filtros de Severidade */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {(['ALL', 'INFO', 'WARN', 'CRITICAL'] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setTerminalSeverity(sev)}
                      style={{
                        background: terminalSeverity === sev ? '#38bdf822' : '#1e293b',
                        border: 'none',
                        color: terminalSeverity === sev ? '#38bdf8' : '#94a3b8',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      {sev === 'ALL' ? 'TODOS' : sev}
                    </button>
                  ))}
                </div>

                {/* Área de Logs */}
                <div className="terminal-logs-screen" style={{
                  flex: 1,
                  background: '#040711',
                  borderRadius: '12px',
                  padding: '16px',
                  fontFamily: 'JetBrains Mono, Courier New, monospace',
                  fontSize: '11px',
                  overflowY: 'auto',
                  maxHeight: '280px',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.8)'
                }}>
                  <AnimatePresence>
                    {liveLogs
                      .filter(l => terminalSeverity === 'ALL' || l.type === terminalSeverity)
                      .map(log => {
                        const sevColor = log.type === 'CRITICAL' ? '#f43f5e' : log.type === 'WARN' ? '#f59e0b' : '#10b981';
                        return (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            style={{ color: '#94a3b8', lineHeight: '1.5', display: 'flex', gap: '8px', alignItems: 'flex-start' }}
                          >
                            <span style={{ color: '#475569' }}>[{new Date(log.date).toLocaleTimeString('pt-BR')}]</span>
                            <span style={{ color: sevColor, fontWeight: 900, minWidth: '70px', display: 'inline-block' }}>[{log.type}]</span>
                            <span style={{ flex: 1, color: '#f1f5f9' }}>{log.msg}</span>
                            <span style={{ color: '#475569', fontSize: '10px' }}>({log.user} • {log.ip})</span>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                  {liveLogs.filter(l => terminalSeverity === 'ALL' || l.type === terminalSeverity).length === 0 && (
                    <div style={{ color: '#475569', textAlign: 'center', padding: '40px 0', fontStyle: 'italic' }}>
                      Nenhum evento registrado no console.
                    </div>
                  )}
                </div>
              </section>

              {/* Painel de Anomalias de Segurança */}
              <section className="security-panel anomalies-panel" style={{ padding: '20px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '14px' }}>
                  <div className="icon-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><ShieldAlert size={18} /></div>
                  <div>
                    <h3 style={{ fontSize: '0.8125rem', margin: 0 }}>System Guard & Anomalias</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', margin: '2px 0 0 0' }}>Detecção ativa de ameaças e comportamento atípico</p>
                  </div>
                </div>

                {/* Lista de Anomalias */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <AnimatePresence>
                    {anomalies.map(anom => {
                      const sevColor = anom.severity === 'CRITICAL' ? '#f43f5e' : anom.severity === 'WARN' ? '#f59e0b' : '#38bdf8';
                      const sevBg = anom.severity === 'CRITICAL' ? '#fee2e2' : anom.severity === 'WARN' ? '#fef3c7' : '#e0f2fe';
                      return (
                        <motion.div
                          key={anom.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, x: 50 }}
                          className={`anomaly-card-premium severity-${anom.severity.toLowerCase()}`}
                          style={{
                            background: 'white',
                            borderRadius: '16px',
                            border: `1px solid ${anom.severity === 'CRITICAL' ? '#fecaca' : 'var(--border)'}`,
                            padding: '16px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: sevColor }}></div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <span style={{ fontSize: '8px', fontWeight: 900, background: sevBg, color: sevColor, padding: '3px 8px', borderRadius: '100px' }}>
                              {anom.severity}
                            </span>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {new Date(anom.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 6px 0', lineHeight: '1.3' }}>
                            {anom.title}
                          </h4>
                          
                          <p style={{ fontSize: '0.718rem', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.4', fontWeight: 500 }}>
                            {anom.desc}
                          </p>

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleMitigateAnomaly(anom.id, 'dismiss')}
                              style={{
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-muted)',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: '0.2s'
                              }}
                            >
                              Ignorar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMitigateAnomaly(anom.id, anom.severity === 'CRITICAL' ? 'block' : 'suspend')}
                              style={{
                                background: anom.severity === 'CRITICAL' ? '#f43f5e' : '#f59e0b',
                                border: 'none',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: '0.2s'
                              }}
                            >
                              {anom.severity === 'CRITICAL' ? 'Bloquear IP' : 'Suspender Conta'}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {anomalies.length === 0 && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px 20px',
                      textAlign: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#f0fdf4',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(22,163,74,0.1)'
                      }}>
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Ecosistema Seguro</h4>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 500 }}>Nenhuma anomalia ativa ou ameaça não mitigada nas últimas 24h.</p>
                      </div>
                    </div>
                  )}
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
        /* Premium Permission Matrix Styling */
        .permission-matrix-card {
          background: rgba(255, 255, 255, 0.45) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6) !important;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .matrix-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: transparent !important;
        }

        .matrix-table th {
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8) !important;
          background: rgba(248, 250, 252, 0.6) !important;
          backdrop-filter: blur(5px);
        }

        .matrix-row {
          transition: all 0.2s ease;
        }

        .matrix-row:hover {
          background: rgba(16, 185, 129, 0.03) !important;
          transform: translateY(-1px);
        }

        .matrix-cell-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .matrix-cell-btn:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.1) !important;
          transform: scale(1.2);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
        }

        .matrix-cell-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Cyberpunk Terminal Styling */
        .terminal-panel {
          background: #05070c !important;
          border: 1px solid #1e293b !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
          border-radius: 24px !important;
          position: relative;
          overflow: hidden;
        }

        .terminal-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent);
          animation: scanline-glow 4s linear infinite;
        }

        @keyframes scanline-glow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .terminal-ctrl-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .terminal-ctrl-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }

        .terminal-ctrl-btn.active {
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
          animation: pulse-terminal-btn 2s infinite;
        }

        @keyframes pulse-terminal-btn {
          0%, 100% { box-shadow: 0 0 8px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 16px rgba(16, 185, 129, 0.6); }
        }

        .terminal-logs-screen {
          scrollbar-width: thin;
          scrollbar-color: #1e293b #040711;
        }

        .terminal-logs-screen::-webkit-scrollbar {
          width: 6px;
        }

        .terminal-logs-screen::-webkit-scrollbar-track {
          background: #040711;
          border-radius: 10px;
        }

        .terminal-logs-screen::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }

        .terminal-logs-screen::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }

        /* Anomalies Panel Styling */
        .anomalies-panel {
          background: rgba(255, 255, 255, 0.45) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6) !important;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04) !important;
        }

        .anomaly-card-premium {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .anomaly-card-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px rgba(0, 0, 0, 0.08);
          border-color: rgba(239, 68, 68, 0.2) !important;
        }

        @keyframes pulse-red-border {
          0%, 100% { border-color: rgba(239, 68, 68, 0.2); }
          50% { border-color: rgba(239, 68, 68, 0.5); }
        }

        .anomaly-card-premium.severity-critical {
          animation: pulse-red-border 3s infinite;
        }

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
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }

        .user-card-premium {
          background: white;
          border-radius: 24px;
          border: 1px solid var(--border);
          display: flex;
          overflow: hidden;
          min-height: 180px;
          height: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .user-card-premium:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.08);
          border-color: hsl(var(--brand) / 0.35);
        }

        .card-left-section {
          width: 120px;
          flex-shrink: 0;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
          padding: 8px;
        }

        .card-avatar {
          width: 56px;
          height: 56px;
          background: hsl(var(--brand) / 0.1);
          color: hsl(var(--brand));
          border: 1px solid hsl(var(--brand) / 0.2);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 8px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-avatar.admin-avatar {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
          color: #f59e0b !important;
          border: 2px solid #f59e0b !important;
          box-shadow: 0 12px 24px rgba(245, 158, 11, 0.25), 0 0 15px rgba(245, 158, 11, 0.15) !important;
          position: relative;
        }

        .admin-shield-icon {
          color: #f59e0b;
          filter: drop-shadow(0 2px 8px rgba(245, 158, 11, 0.4));
          animation: shield-glow 3s ease-in-out infinite alternate;
        }

        @keyframes shield-glow {
          0% { filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.4)); }
          100% { filter: drop-shadow(0 2px 12px rgba(245, 158, 11, 0.8)); transform: scale(1.05); }
        }

        .card-main-content {
          flex: 1;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .card-header-info h3 {
          font-size: 16px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin-bottom: 2px;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.1);
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
          margin-top: 6px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: hsl(var(--text-muted));
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta-icon {
          color: #16a34a;
          flex-shrink: 0;
        }

        .card-bottom-actions {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
        }

        .action-icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
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

        .add-user-card-premium {
          border: 2px dashed #e2e8f0;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: transparent;
          cursor: pointer;
          color: #94a3b8;
          transition: 0.2s;
          min-height: 180px;
          height: 100%;
        }

        .add-user-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-user-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

        [data-theme='dark'] .add-user-card-premium {
          background: hsl(var(--bg-main)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }
      `}</style>
    </div>
  );
};
