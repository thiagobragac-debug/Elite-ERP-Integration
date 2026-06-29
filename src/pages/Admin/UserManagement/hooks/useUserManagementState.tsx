import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import { useTenant } from '../../../../contexts/TenantContext';
import { useFarmFilter } from '../../../../hooks/useFarmFilter';
import { usePersistentState } from '../../../../hooks/usePersistentState';
import { hasDraftForKey } from '../../../../hooks/useFormDraft';
import { useConfirm } from '../../../../contexts/ConfirmContext';
import { Users, Monitor, ShieldCheck, Lock, Mail, Shield, Eye, Edit2, Search } from 'lucide-react';

export function useUserManagementState() {
  const { confirm } = useConfirm();
  const { activeFarm, userProfile } = useTenant();
  const { isGlobalMode, activeTenantId, activeFarmId } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');

  const [usersList, setUsersList] = useState<any[]>([]);
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = usePersistentState(
    'UserManagement_isUserModalOpen',
    false
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = usePersistentState(
    'UserManagement_isProfileModalOpen',
    false
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';
  const setActiveTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  };

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'UserManagement_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [securitySettings, setSecuritySettings] = useState({
    min_8_chars: true,
    special_chars: true,
    num_letters: true,
    inactivity_30m: true,
    force_logout: false,
    multi_device: true,
    block_3_attempts: true,
    geo_ip_check: true,
    mfa_required: false,
    maintenance_mode: false,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'UserManagement_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    profileId: 'all',
    mfaOnly: false,
    dateStart: '',
    dateEnd: '',
  });
  const [stats, setStats] = useState<any[]>([]);

  const isAdmin =
    userProfile?.role === 'SAAS_ADMIN' ||
    userProfile?.role === 'ADMIN' ||
    userProfile?.role === 'Administrador';

  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [terminalSeverity, setTerminalSeverity] = useState<'ALL' | 'INFO' | 'WARN' | 'CRITICAL'>(
    'ALL'
  );
  const [isTerminalRunning, setIsTerminalRunning] = useState(true);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  // Auto-reabrir: restaura formulário se existe rascunho (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isUserModalOpen) return;
    if (hasDraftForKey(`user_form_${activeTenantId}`)) setIsUserModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  const fetchSecurityLogs = async () => {
    if (!activeTenantId) {
      return;
    }
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setGlobalLogs(
          data.map((log) => ({
            id: log.id,
            title: log.action,
            date: log.created_at,
            value: log.details || log.entity_name,
            user: log.user_email,
          }))
        );

        const mappedLogs = data.map((log: any) => {
          const act = (log.action || '').toUpperCase();
          const details = (log.details || log.description || '').toUpperCase();
          let type: 'INFO' | 'WARN' | 'CRITICAL' = 'INFO';

          if (
            act.includes('DELETE') ||
            act.includes('ALERT') ||
            act.includes('FAIL') ||
            act.includes('SECURITY') ||
            details.includes('BLOQUE') ||
            details.includes('ERR')
          ) {
            type = 'CRITICAL';
          } else if (
            act.includes('UPDATE') ||
            act.includes('WARN') ||
            details.includes('SESSÃO') ||
            details.includes('ALTERAÇÃO')
          ) {
            type = 'WARN';
          }

          return {
            id: log.id,
            date: log.created_at,
            type,
            msg:
              log.details ||
              log.description ||
              `${log.action} em ${log.entity_name || log.entity || 'sistema'}`,
            user: log.user_email || 'SYSTEM',
            ip: log.ip_address || '127.0.0.1',
          };
        });
        setLiveLogs(mappedLogs);

        const mappedAnomalies = data
          .filter((log: any) => {
            const act = (log.action || '').toUpperCase();
            const details = (log.details || log.description || '').toUpperCase();
            return (
              act.includes('DELETE') ||
              act.includes('ALERT') ||
              act.includes('FAIL') ||
              act.includes('SECURITY') ||
              details.includes('FALHA') ||
              details.includes('ERRO')
            );
          })
          .map((log: any) => {
            return {
              id: log.id,
              title: log.action || 'Alerta do Sistema',
              desc:
                log.details ||
                log.description ||
                `${log.action} em ${log.entity_name || log.entity}`,
              severity: 'CRITICAL' as const,
              user: log.user_email || 'SYSTEM',
              user_id: log.user_id,
              ip_address: log.ip_address || '127.0.0.1',
              date: log.created_at,
              mitigated: false,
            };
          });
        setAnomalies(mappedAnomalies);
      }
    } catch (err: any) {
      console.warn('UserManagement: Error fetching security logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Real-Time Database Stream Polling
  useEffect(() => {
    if (!isTerminalRunning || !activeFarm) {
      return;
    }

    fetchSecurityLogs();

    const interval = setInterval(() => {
      fetchSecurityLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [isTerminalRunning, activeFarm]);

  const handleMitigateAnomaly = async (id: string, action: 'block' | 'suspend' | 'dismiss') => {
    const anom = anomalies.find((a) => a.id === id);
    if (!anom) return;
    setAnomalies((prev) => prev.filter((a) => a.id !== id));

    let actionText = '';
    try {
      if (action === 'block') {
        actionText = `Bloqueio de IP concluído para ${anom?.user || 'usuário'}.`;
        if (anom.ip_address) {
          await supabase.rpc('block_ip_address', {
            p_ip_address: anom.ip_address,
            p_reason: `Ameaça detectada: ${anom.title}`
          });
        }
      } else if (action === 'suspend') {
        actionText = `Conta do usuário ${anom?.user} suspensa temporariamente.`;
        if (anom.user_id) {
          await supabase.rpc('suspend_user_account', {
            p_user_id: anom.user_id,
            p_action: 'suspend'
          });
        }
      } else {
        actionText = `Alerta de anomalia de ${anom?.user} ignorado pelo administrador.`;
      }
    } catch (err) {
      console.error('Erro ao mitigar anomalia:', err);
    }

    const newLog = {
      id: Math.random().toString(),
      date: new Date().toISOString(),
      type: action === 'dismiss' ? 'INFO' : 'CRITICAL',
      msg: `System Guard: ${actionText}`,
      user: userProfile?.full_name || 'ADMIN',
      ip: '127.0.0.1',
    };
    setLiveLogs((prev) => [newLog, ...prev]);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    if (activeTenantId) {
      try {
        const { error } = await supabase.from('audit_logs').insert([
          {
            tenant_id: activeTenantId,
            user_id: userProfile?.id || null,
            action:
              action === 'dismiss'
                ? 'SECURITY_DISMISS'
                : action === 'block'
                  ? 'SECURITY_BLOCK'
                  : 'SECURITY_SUSPEND',
            entity: 'system_guard',
            entity_id: anom?.id && /^[0-9a-fA-F-]{36}$/.test(anom.id) ? anom.id : null,
            description: `System Guard: ${actionText} Alvo: ${anom?.user || 'Desconhecido'}`,
          },
        ]);

        if (error) {
          console.warn('Failed to persist mitigation log to database:', error);
        }
      } catch (err) {
        console.warn('Error inserting mitigation log:', err);
      }
    }
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam === 'meu-perfil' ||
      tabParam === 'users' ||
      tabParam === 'profiles' ||
      tabParam === 'seguranca'
    ) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    if (!activeTenantId) {
      setLoading(false);
      return;
    }

    try {
      const [
        { data: usersData },
        { data: profilesData },
        { data: activeLogs },
        { data: tenantData },
      ] = await Promise.all([
        supabase.from('profiles_view').select('*').eq('tenant_id', activeTenantId),
        supabase.from('perfis_usuario').select('*').eq('tenant_id', activeTenantId).limit(500).eq('tenant_id', activeTenantId),
        supabase
          .from('audit_logs')
          .select('user_email')
          .eq('tenant_id', activeTenantId)
          .gte(
            'created_at',
            new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .split('T')[0]
          ),
        supabase.from('tenant_security_settings').select('*').eq('tenant_id', activeTenantId).maybeSingle(),
      ]);

      if (tenantData) {
        setSecuritySettings({
          min_8_chars: tenantData.min_8_chars ?? true,
          special_chars: tenantData.special_chars ?? true,
          num_letters: tenantData.num_letters ?? true,
          inactivity_30m: tenantData.inactivity_30m ?? true,
          force_logout: tenantData.force_logout ?? false,
          multi_device: tenantData.multi_device ?? true,
          block_3_attempts: tenantData.block_3_attempts ?? true,
          geo_ip_check: tenantData.geo_ip_check ?? true,
          mfa_required: tenantData.mfa_required ?? false,
          maintenance_mode: tenantData.maintenance_mode ?? false,
        });
      }

      const processedProfiles = (profilesData || []).map((p: any) => ({
        ...p,
        userCount: (usersData || []).filter((u: any) => u.perfil_id === p.id).length,
        name: p.nome,
        description: p.descricao,
        permissions: p.permissoes || [],
      }));

      const processedUsers = (usersData || []).map((u: any) => {
        return {
          ...u,
          name: u.name || u.full_name,
          profile: u.profile_name,
          farm: u.unidade_nome,
          status: u.status || 'active',
          memberSince: u.created_at
            ? new Date(u.created_at).toLocaleDateString('pt-BR', {
                month: 'short',
                year: 'numeric',
              })
            : '---',
        };
      });

      setUsersList(processedUsers);
      setProfilesList(processedProfiles);

      const totalUsers = processedUsers.length;
      const activeEmails = new Set(
        (activeLogs || []).map((l: any) => l.user_email).filter(Boolean)
      );
      const activeToday = Math.max(1, activeEmails.size);
      const mfaCompliant = processedUsers.filter((u: any) => u.mfa_enabled).length;
      const securityScore = Math.floor((mfaCompliant / (totalUsers || 1)) * 100);

      setStats([
        {
          label: 'Licenças Ativas',
          value: `${totalUsers}/25`,
          icon: Users,
          color: '#10b981',
          progress: totalUsers > 0 ? (totalUsers / 25) * 100 : 0,
          change: 'Plano Enterprise',
          periodLabel: 'Consumo de Seats',
          sparkline:
            totalUsers > 0
              ? [
                  {
                    value: Math.max(1, totalUsers - 5),
                    label: `${Math.max(1, totalUsers - 5)} users`,
                  },
                  {
                    value: Math.max(1, totalUsers - 4),
                    label: `${Math.max(1, totalUsers - 4)} users`,
                  },
                  {
                    value: Math.max(1, totalUsers - 3),
                    label: `${Math.max(1, totalUsers - 3)} users`,
                  },
                  {
                    value: Math.max(1, totalUsers - 2),
                    label: `${Math.max(1, totalUsers - 2)} users`,
                  },
                  {
                    value: Math.max(1, totalUsers - 1),
                    label: `${Math.max(1, totalUsers - 1)} users`,
                  },
                  { value: totalUsers, label: `${totalUsers} users` },
                  { value: totalUsers, label: `Hoje: ${totalUsers}/25` },
                ]
              : [],
        },
        {
          label: 'Acessos Hoje',
          value: activeToday > 1 ? activeToday : 0,
          icon: Monitor,
          color: '#3b82f6',
          progress: activeToday > 1 ? 100 : 0,
          change: 'Sessões Ativas',
          periodLabel: 'Sessões Ativas',
          sparkline:
            activeToday > 1
              ? [
                  {
                    value: Math.max(1, activeToday - 5),
                    label: `${Math.max(1, activeToday - 5)} sess.`,
                  },
                  {
                    value: Math.max(1, activeToday - 4),
                    label: `${Math.max(1, activeToday - 4)} sess.`,
                  },
                  {
                    value: Math.max(1, activeToday - 3),
                    label: `${Math.max(1, activeToday - 3)} sess.`,
                  },
                  {
                    value: Math.max(1, activeToday - 2),
                    label: `${Math.max(1, activeToday - 2)} sess.`,
                  },
                  {
                    value: Math.max(1, activeToday - 1),
                    label: `${Math.max(1, activeToday - 1)} sess.`,
                  },
                  { value: activeToday, label: `${activeToday} sess.` },
                  { value: activeToday, label: `Hoje: ${activeToday}` },
                ]
              : [],
        },
        {
          label: 'Compliance Segurança',
          value: securityScore > 0 ? `${securityScore}%` : '---',
          icon: ShieldCheck,
          color: securityScore > 80 ? '#10b981' : '#f59e0b',
          progress: securityScore > 0 ? securityScore : 0,
          change: securityScore > 0 ? (securityScore > 80 ? 'Excelente' : 'Ação Requerida') : '---',
          periodLabel: 'Score Atual',
          sparkline:
            securityScore > 0
              ? [
                  {
                    value: Math.max(10, securityScore - 20),
                    label: `${Math.max(10, securityScore - 20)}%`,
                  },
                  {
                    value: Math.max(15, securityScore - 15),
                    label: `${Math.max(15, securityScore - 15)}%`,
                  },
                  {
                    value: Math.max(20, securityScore - 10),
                    label: `${Math.max(20, securityScore - 10)}%`,
                  },
                  {
                    value: Math.max(30, securityScore - 7),
                    label: `${Math.max(30, securityScore - 7)}%`,
                  },
                  {
                    value: Math.max(40, securityScore - 4),
                    label: `${Math.max(40, securityScore - 4)}%`,
                  },
                  {
                    value: Math.max(50, securityScore - 2),
                    label: `${Math.max(50, securityScore - 2)}%`,
                  },
                  { value: securityScore, label: `Hoje: ${securityScore}%` },
                ]
              : [],
        },
        {
          label: 'Proteção MFA',
          value: `${mfaCompliant} usuários`,
          icon: Lock,
          color: '#8b5cf6',
          progress: mfaCompliant > 0 ? (mfaCompliant / (totalUsers || 1)) * 100 : 0,
          change: '2FA Habilitado',
          periodLabel: 'Autenticação Forte',
          sparkline:
            mfaCompliant > 0
              ? [
                  { value: 0, label: '0 MFA' },
                  {
                    value: Math.round(mfaCompliant * 0.2),
                    label: `${Math.round(mfaCompliant * 0.2)} MFA`,
                  },
                  {
                    value: Math.round(mfaCompliant * 0.4),
                    label: `${Math.round(mfaCompliant * 0.4)} MFA`,
                  },
                  {
                    value: Math.round(mfaCompliant * 0.6),
                    label: `${Math.round(mfaCompliant * 0.6)} MFA`,
                  },
                  {
                    value: Math.round(mfaCompliant * 0.75),
                    label: `${Math.round(mfaCompliant * 0.75)} MFA`,
                  },
                  {
                    value: Math.round(mfaCompliant * 0.9),
                    label: `${Math.round(mfaCompliant * 0.9)} MFA`,
                  },
                  { value: mfaCompliant, label: `Hoje: ${mfaCompliant} users` },
                ]
              : [],
        },
      ]);
    } catch (err: any) {
      console.error('UserManagement: Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isReady = !!activeTenantId;
    if (isReady) {
      fetchData();
      if (activeTab === 'seguranca') {
        fetchSecurityLogs();
      }
    } else {
      setLoading(false);
    }
  }, [activeTab, activeTenantId]);

  const toggleSecuritySetting = async (key: keyof typeof securitySettings) => {
    const newValue = !securitySettings[key];
    const updatedSettings = { ...securitySettings, [key]: newValue };

    setSecuritySettings(updatedSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    if (activeTenantId) {
      try {
        const payload = {
          min_8_chars: updatedSettings.min_8_chars,
          special_chars: updatedSettings.special_chars,
          num_letters: updatedSettings.num_letters,
          inactivity_30m: updatedSettings.inactivity_30m,
          force_logout: updatedSettings.force_logout,
          multi_device: updatedSettings.multi_device,
          block_3_attempts: updatedSettings.block_3_attempts,
          geo_ip_check: updatedSettings.geo_ip_check,
          mfa_required: updatedSettings.mfa_required,
          maintenance_mode: updatedSettings.maintenance_mode,
        };
        await supabase
          .from('tenant_security_settings')
          .update(payload)
          .eq('tenant_id', activeTenantId);
      } catch (err) {
        console.warn('Failed to sync security setting with database:', err);
      }
    }
  };

  const handleToggleMaintenanceMode = async () => {
    const isActivating = !securitySettings.maintenance_mode;
    const msg = isActivating
      ? 'Deseja realmente ATIVAR o Modo de Manutenção? Isso restringirá o acesso de usuários não-administradores.'
      : 'Deseja realmente DESATIVAR o Modo de Manutenção? O acesso normal será restabelecido.';

    const isConfirmed = await confirm({
      title: isActivating ? 'Ativar Modo de Manutenção' : 'Desativar Modo de Manutenção',
      description: msg,
      confirmText: isActivating ? 'Sim, Ativar' : 'Sim, Desativar',
      variant: isActivating ? 'warning' : 'primary',
    });

    if (isConfirmed) {
      await toggleSecuritySetting('maintenance_mode');
    }
  };

  const handleAddUser = async (data: any) => {
    if (!activeFarm) {
      return;
    }

    const payload: any = {
      full_name: data.name,
      email: data.email,
      tenant_id: activeFarm.tenantId,
      perfil_id: data.profile_id,
      status: data.status || 'active',
      role: 'USER',
      fazendas_permitidas: data.fazendas_permitidas || [],
      cargo_id: data.cargo_id || null,
    };

    if (selectedUser) {
      const { error } = await supabase.from('profiles').update(payload).eq('id', selectedUser.id).eq('tenant_id', activeTenantId);
      if (!error) {
        try {
          await supabase.rpc('admin_set_user_ban', {
            target_user_id: selectedUser.id,
            banned: data.status === 'inactive',
          });
        } catch (rpcErr) {
          console.warn('[handleAddUser] admin_set_user_ban RPC not available');
        }
        setIsUserModalOpen(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('profiles').insert([payload]);
      if (!error) {
        setIsUserModalOpen(false);
        fetchData();
      }
    }
  };

  const handleAddProfile = async (data: any) => {
    if (!activeFarm) {
      return;
    }

    const payload = {
      nome: data.nome,
      descricao: data.descricao,
      permissoes: data.permissoes,
      tenant_id: activeFarm.tenantId,
    };

    if (selectedProfile) {
      const { error } = await supabase
        .from('perfis_usuario')
        .update(payload)
        .eq('id', selectedProfile.id).eq('tenant_id', activeTenantId);

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
    const isConfirmed = await confirm({
      title: 'Atenção',
      description:
        'Tem certeza que deseja excluir este perfil? Usuários vinculados a ele podem perder acesso.',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) {
      return;
    }

    const { error } = await supabase.from('perfis_usuario').delete().eq('id', id).eq('tenant_id', activeTenantId);
    if (!error) {
      fetchData();
    }
  };

  const handleOpenEditProfile = (profile: any) => {
    setSelectedProfile({
      id: profile.id,
      nome: profile.nome || profile.name,
      descricao: profile.descricao || profile.description,
      permissoes: profile.permissoes || profile.permissions || [],
    });
    setIsProfileModalOpen(true);
  };

  const handleOpenEditUser = (user: any) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleViewUserLogs = async (user: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*').eq('tenant_id', activeTenantId)
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      if (data) {
        setHistoryItems(
          data.map((log: any) => ({
            id: log.id,
            date: log.created_at,
            title: log.action || 'Ação do Usuário',
            subtitle: log.details || log.entity_name || 'Operação realizada',
            value: log.ip_address ? `IP: ${log.ip_address}` : undefined,
            status:
              log.action?.toLowerCase().includes('erro') ||
              log.action?.toLowerCase().includes('falha')
                ? 'error'
                : 'success',
          }))
        );
      } else {
        setHistoryItems([]);
      }
    } catch (err) {
      console.error('Error fetching user audit logs:', err);
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    const isConfirmed = await confirm({
      title: 'Remover Usuário',
      description: `Tem certeza que deseja remover ${user.name || user.email} da organização?`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) {
      return;
    }

    const { error } = await supabase.from('profiles').delete().eq('id', user.id).eq('tenant_id', activeTenantId);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      fetchData();
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterValues.status === 'all' || u.status === filterValues.status;
    const matchesProfile =
      filterValues.profileId === 'all' || u.perfil_id === filterValues.profileId;
    const matchesMFA = !filterValues.mfaOnly || u.mfa_enabled;
    const matchesDate =
      (!filterValues.dateStart || new Date(u.created_at) >= new Date(filterValues.dateStart)) &&
      (!filterValues.dateEnd || new Date(u.created_at) <= new Date(filterValues.dateEnd));

    return matchesSearch && matchesStatus && matchesProfile && matchesMFA && matchesDate;
  });

  const filteredProfiles = profilesList.filter((p) =>
    (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userColumns = [
    {
      header: 'Usuário',
      accessor: (item: any) => {
        const isUserAdmin =
          item.profile?.toLowerCase().includes('admin') || item.role?.toLowerCase() === 'admin';
        return (
          <div className="table-cell-title">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold overflow-hidden ${isUserAdmin ? 'admin-table-avatar' : ''}`}
                style={
                  isUserAdmin
                    ? {
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
                      }
                    : {
                        background: 'hsl(var(--brand) / 0.1)',
                        color: 'hsl(var(--brand))',
                        border: '1px solid hsl(var(--brand) / 0.2)',
                      }
                }
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
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  {item.profile || 'Sem Perfil'}
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Contato',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Mail size={14} />
          <span>{item.email}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'active' ? 'active' : 'stopped'}`}>
          {item.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      ),
      align: 'center' as const,
    },
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
      ),
    },
    {
      header: 'Permissões',
      accessor: (item: any) => (
        <div className="flex flex-wrap gap-1">
          {(item.permissoes || []).slice(0, 3).map((p: string) => (
            <span
              key={p}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tighter"
            >
              {p === 'all' ? 'Total' : p.replace('_', ' ')}
            </span>
          ))}
          {(item.permissoes || []).length > 3 && (
            <span className="text-[10px] font-bold text-slate-400">
              +{item.permissoes.length - 3}
            </span>
          )}
        </div>
      ),
    },
  ];

  return {
    searchTerm,
    setSearchTerm,
    usersList,
    profilesList,
    loading,
    isUserModalOpen,
    setIsUserModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    openMenuId,
    setOpenMenuId,
    saveSuccess,
    activeTab,
    setActiveTab,
    selectedProfile,
    setSelectedProfile,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    historyItems,
    historyLoading,
    selectedUser,
    setSelectedUser,
    globalLogs,
    logsLoading,
    viewMode,
    setViewMode,
    securitySettings,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filterValues,
    setFilterValues,
    stats,
    isAdmin,
    liveLogs,
    setLiveLogs,
    terminalSeverity,
    setTerminalSeverity,
    isTerminalRunning,
    setIsTerminalRunning,
    anomalies,
    handleMitigateAnomaly,
    toggleSecuritySetting,
    handleToggleMaintenanceMode,
    fetchData,
    handleAddUser,
    handleAddProfile,
    handleDeleteProfile,
    handleOpenEditProfile,
    handleOpenEditUser,
    handleViewUserLogs,
    handleDeleteUser,
    activeFarm,
    isGlobalMode,
    filteredUsers,
    filteredProfiles,
    userColumns,
    profileColumns,
  };
}
