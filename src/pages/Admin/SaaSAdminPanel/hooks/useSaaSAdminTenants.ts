import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { logAudit } from '../../../../utils/audit';
import toast from 'react-hot-toast';

export const useSaaSAdminTenants = (
  user: any,
  isSaving: boolean,
  setIsSaving: (v: boolean) => void,
  setAuditLogsList: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const [isCreateDemoModalOpen, setIsCreateDemoModalOpen] = useState(false);
  const [isDeleteDemoModalOpen, setIsDeleteDemoModalOpen] = useState(false);
  const [demoTenantName, setDemoTenantName] = useState('');
  const [tenantToDelete, setTenantToDelete] = useState<any>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
  const [selectedAuditTenant, setSelectedAuditTenant] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchTenants = async () => {
    try {
      setTenantsLoading(true);
      const { data, error }: any = await supabase
        .from('tenants')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedData = (data || []).map((t: any) => ({
        ...t,
        name: t.name || t.nome || 'Tenant Sem Nome',
        plan: t.plan || t.plano || 'Starter',
        users: Number(t.users) || 0,
        storage: t.storage || '0 GB',
        status: t.status || 'Ativo',
      }));
      setTenantsList(mappedData);
    } catch (err) {
      console.error('Erro ao buscar Tenants:', err);
      setTenantsList([]);
    } finally {
      setTenantsLoading(false);
    }
  };

  const fetchAuditLogs = async (tenantId: string) => {
    try {
      setLogsLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mappedLogs = (data || []).map((log: any) => ({
        id: log.id,
        action: log.action || 'AÇÃO',
        entity: log.entity || 'Tenant',
        entity_id: tenantId,
        created_at: log.created_at,
        description: log.description || log.details || `Entidade: ${log.entity || ''}`,
        new_data: log.new_data || null,
      }));

      setAuditLogs(mappedLogs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setAuditLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const openAuditLogs = (tenant: any) => {
    setSelectedAuditTenant(tenant);
    setIsAuditLogModalOpen(true);
    fetchAuditLogs(tenant.id);
  };

  const handleSaveTenant = async (data: any) => {
    try {
      const tenantData: any = {
        status: data.status,
        email: data.email,
        nome: data.name,
        plano: data.plan,
        settings: data.settings,
      };

      // Atualiza gateway_ids apenas se algum Customer ID foi informado manualmente
      if (data.stripeCustomerId || data.asaasCustomerId || data.pagarmeCustomerId) {
        const { data: currentTenant } = await supabase
          .from('tenants')
          .select('gateway_ids').eq('tenant_id', activeTenantId)
          .eq('id', selectedTenant?.id || '')
          .single();
        const existingIds = currentTenant?.gateway_ids || {};
        tenantData.gateway_ids = {
          ...existingIds,
          ...(data.stripeCustomerId ? { stripe: { ...existingIds.stripe, customerId: data.stripeCustomerId } } : {}),
          ...(data.asaasCustomerId ? { asaas: { ...existingIds.asaas, customerId: data.asaasCustomerId } } : {}),
          ...(data.pagarmeCustomerId ? { pagarme: { ...existingIds.pagarme, customerId: data.pagarmeCustomerId } } : {}),
        };
      }

      if (selectedTenant) {
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', selectedTenant.id).eq('tenant_id', activeTenantId);
        if (error) throw error;
      } else {
        const { data: newTenant, error } = await supabase
          .from('tenants')
          .insert([{ ...tenantData, is_template: true }])
          .select()
          .single();
        if (error) throw error;

        if (newTenant) {
          const defaultProfiles = [
            {
              tenant_id: newTenant.id,
              nome: 'Administrador',
              descricao: 'Acesso total e irrestrito ao sistema.',
              permissoes: ['all'],
              ativo: true,
            },
            {
              tenant_id: newTenant.id,
              nome: 'Gerente de Pecuária',
              descricao: 'Gestão completa do rebanho, nutrição, sanidade e pesagens.',
              permissoes: ['pecuaria', 'pecuaria_dashboard', 'pecuaria_animais', 'pecuaria_saude'],
              ativo: true,
            },
            {
              tenant_id: newTenant.id,
              nome: 'Analista Financeiro',
              descricao: 'Acesso às operações de contas a pagar, receber e fluxo de caixa.',
              permissoes: ['financeiro', 'financeiro_dashboard', 'financeiro_operacoes', 'financeiro_bancos'],
              ativo: true,
            },
            {
              tenant_id: newTenant.id,
              nome: 'Comprador',
              descricao: 'Gestão de cotações, fornecedores e pedidos de compra.',
              permissoes: ['compras', 'compras_pedidos', 'compras_fornecedores'],
              ativo: true,
            },
            {
              tenant_id: newTenant.id,
              nome: 'Gestor de Frota',
              descricao: 'Controle de abastecimentos e manutenções de máquinas.',
              permissoes: ['frota', 'frota_abastecimento', 'frota_manutencao'],
              ativo: true,
            },
            {
              tenant_id: newTenant.id,
              nome: 'Encarregado de Estoque',
              descricao: 'Controle de movimentações e armazéns.',
              permissoes: ['logistica', 'logistica_armazens'],
              ativo: true,
            },
          ];

          const { error: profileError } = await supabase.from('perfis_usuario').insert(defaultProfiles);
          if (profileError) console.error('Erro ao criar perfis padrão:', profileError);

          await supabase.from('categorias_sistema').delete().eq('tenant_id', newTenant.id);
          await supabase.from('perfis_usuario').delete().eq('tenant_id', newTenant.id);

          const { error: cloneError } = await supabase.rpc('clone_tenant_from_template', {
            p_new_tenant_id: newTenant.id,
            p_nome: newTenant.nome || data.name,
            p_documento: newTenant.documento || data.cnpj,
            p_is_demo: false,
          });

          if (cloneError) {
            console.error('Erro ao clonar dados do template master:', cloneError);
          } else {
            await supabase.from('audit_logs').delete().eq('tenant_id', newTenant.id);
            await supabase.from('saas_audit_logs').delete().eq('tenant_id', newTenant.id);
            await supabase.from('tenants').update({ is_template: false }).eq('id', newTenant.id).eq('tenant_id', activeTenantId);
          }
        }
      }

      await fetchTenants();
      toast.success(`Parceiro "${data.name}" ${selectedTenant ? 'atualizado' : 'cadastrado'} com sucesso!`);
      setIsTenantModalOpen(false);
      logAudit({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: user?.id,
        action: selectedTenant ? 'Update Tenant' : 'Create Tenant',
        entity: 'Tenants',
        new_data: { details: `Tenant ${data.name} ${selectedTenant ? 'updated' : 'created'}`, status: 'success' },
      });

      const newAuditLog = {
        id: `audit-${Date.now()}`,
        action: selectedTenant ? 'TENANT_UPDATE' : 'TENANT_CREATE',
        tenant: data.name,
        admin: user?.email || 'Administrador',
        time: 'Agora mesmo',
        status: 'success',
        details: `Parceiro "${data.name}" ${selectedTenant ? 'atualizado' : 'cadastrado'} no ecossistema.`,
      };
      setAuditLogsList((prev) => [newAuditLog, ...prev]);
    } catch (err) {
      console.error('Error saving tenant:', err);
      toast.error('Erro ao salvar parceiro.');
    }
  };

  const handleToggleTenant = async (tenant: any, active: boolean) => {
    const newStatus = active ? 'Ativo' : 'Suspenso';
    setTenantsList((prev) =>
      prev.map((t) => (t.id === tenant.id ? { ...t, status: newStatus } : t))
    );
    try {
      await supabase.from('tenants').update({ status: newStatus }).eq('id', tenant.id).eq('tenant_id', activeTenantId);
      try {
        await supabase.rpc('admin_set_tenant_ban', {
          target_tenant_id: tenant.id,
          banned: !active,
        });
      } catch (rpcErr) {
        console.warn('[ToggleTenant] admin_set_tenant_ban RPC not available');
      }
      await logAudit({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: user?.id,
        action: `TENANT_${active ? 'ATIVADO' : 'SUSPENSO'}`,
        entity: 'tenants',
        entity_id: tenant.id,
        description: `Status alterado para ${newStatus}`,
      });
      toast.success('Status atualizado!');
    } catch (err) {
      setTenantsList((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, status: active ? 'Suspenso' : 'Ativo' } : t))
      );
      console.error('[ToggleTenant] Error:', err);
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleCreateDemoTenant = async (config: {
    name: string;
    trialDuration: number;
    seedData: boolean;
    modules: string[];
  }) => {
    if (!config.name.trim()) {
      toast.error('Por favor, informe o nome do tenant.');
      return;
    }
    setIsSaving(true);
    try {
      const { data: newTenant, error } = await supabase
        .from('tenants')
        .insert([
          {
            nome: config.name.trim(),
            email: 'demo@sistema.internal',
            plano: 'Porteira Aberta',
            status: 'Trial',
            is_demo: true,
            is_template: true,
            settings: {
              trialDuration: config.trialDuration,
              seedData: config.seedData,
              modules: config.modules,
            },
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (newTenant) {
        await supabase.from('categorias_sistema').delete().eq('tenant_id', newTenant.id);
        await supabase.from('perfis_usuario').delete().eq('tenant_id', newTenant.id);

        const { error: cloneError } = await supabase.rpc('clone_tenant_from_template', {
          p_new_tenant_id: newTenant.id,
          p_nome: newTenant.nome,
          p_documento: null,
          p_is_demo: true,
        });

        if (cloneError) {
          console.error('Erro ao clonar dados para a Demo:', cloneError);
          toast.error(`Erro ao criar base/clonar: ${cloneError.message}`);
        } else {
          await supabase.from('audit_logs').delete().eq('tenant_id', newTenant.id);
          await supabase.from('saas_audit_logs').delete().eq('tenant_id', newTenant.id);
          await supabase.from('tenants').update({ is_template: false }).eq('id', newTenant.id).eq('tenant_id', activeTenantId);
        }
      }

      logAudit({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: undefined,
        action: 'Create Demo Tenant',
        entity: 'Tenants',
        new_data: { details: `Demo Tenant ${config.name.trim()} created`, status: 'success' },
      });

      await fetchTenants();
      setIsCreateDemoModalOpen(false);
      setDemoTenantName('');
      toast.success('Base de demonstração criada com sucesso! Cargos e permissões foram herdados do Template Master.');
    } catch (err: any) {
      console.error('Erro ao criar Demo Tenant:', err);
      toast.error(`Falha ao criar base demo: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDemoTenant = async () => {
    if (!tenantToDelete) return;
    if (deleteConfirmationInput !== tenantToDelete.name) {
      toast.error('O nome digitado não confere.');
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_demo_tenant', {
        target_tenant_id: tenantToDelete.id,
      });

      if (error) throw error;

      if (localStorage.getItem('saas_impersonate_tenant_id') === tenantToDelete.id) {
        localStorage.removeItem('saas_impersonate_tenant_id');
      }

      logAudit({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: undefined,
        action: 'Delete Demo Tenant',
        entity: 'Tenants',
        new_data: { details: `Demo Tenant ${tenantToDelete.name} deleted`, status: 'success' },
      });

      await fetchTenants();
      setIsDeleteDemoModalOpen(false);
      setTenantToDelete(null);
      setDeleteConfirmationInput('');
      toast.success('Base de demonstração excluída com sucesso de forma limpa do ecossistema.');
    } catch (err: any) {
      console.error('Erro ao deletar Demo Tenant:', err);
      toast.error(`Erro de segurança ao excluir base demo: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    tenantsList, setTenantsList,
    tenantsLoading,
    fetchTenants,
    isTenantModalOpen, setIsTenantModalOpen,
    selectedTenant, setSelectedTenant,
    handleSaveTenant,
    handleToggleTenant,
    isCreateDemoModalOpen, setIsCreateDemoModalOpen,
    isDeleteDemoModalOpen, setIsDeleteDemoModalOpen,
    demoTenantName, setDemoTenantName,
    tenantToDelete, setTenantToDelete,
    deleteConfirmationInput, setDeleteConfirmationInput,
    isDeleting, setIsDeleting,
    handleCreateDemoTenant,
    handleDeleteDemoTenant,
    fetchAuditLogs,
    isAuditLogModalOpen, setIsAuditLogModalOpen,
    selectedAuditTenant, setSelectedAuditTenant,
    auditLogs, setAuditLogs,
    logsLoading,
    openAuditLogs,
  };
};
