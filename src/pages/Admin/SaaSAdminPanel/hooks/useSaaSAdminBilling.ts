import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { logAudit } from '../../../../utils/audit';
import toast from 'react-hot-toast';

export const useSaaSAdminBilling = (user?: any) => {
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const { data, error }: any = await supabase
        .from('saas_invoices')
        .select('*, tenants(id, nome)', { count: 'exact' }).eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedInvoices = (data || []).map((inv: any) => {
        const numAmount = Number(inv.amount) || 0;
        const gatewayRaw = inv.gateway || (inv.payment_link?.includes('stripe')
          ? 'Stripe'
          : inv.payment_link?.includes('asaas')
            ? 'Asaas'
            : 'Manual');
        return {
          ...inv,
          plan: inv.plan_name || 'Plano Personalizado',
          price:
            numAmount === 0
              ? 'Grátis'
              : `R$ ${numAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          gateway: gatewayRaw,
          due: inv.due_date ? new Date(inv.due_date).toLocaleDateString('pt-BR') : 'Sem data',
          tenants: inv.tenants
            ? {
                ...inv.tenants,
                name: inv.tenants.name || inv.tenants.nome || 'Tenant Sem Nome',
              }
            : { name: 'Tenant Sem Nome' },
        };
      });

      setInvoicesList(mappedInvoices);
    } catch (err) {
      console.error('Erro ao buscar Faturas SaaS:', err);
      setInvoicesList([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  // ─── Criar nova fatura manualmente ─────────────────────────────────────────
  const handleSaveCharge = async (formData: {
    tenant_id: string;
    plan_name: string;
    amount: number;
    due_date: string;
    gateway: string;
    boleto_url?: string;
    notes?: string;
  }) => {
    try {
      if (formData.gateway === 'manual') {
        // Fallback for manual charges
        const { error } = await supabase.from('saas_invoices').insert([
          {
            tenant_id: formData.tenant_id,
            plan_name: formData.plan_name,
            amount: formData.amount,
            status: 'pendente',
            due_date: formData.due_date,
            gateway: 'manual',
            boleto_url: formData.boleto_url || null,
            notes: formData.notes || null,
            payment_link: formData.boleto_url || null,
          },
        ]);
        if (error) throw error;
      } else {
        // Call Edge Function for real gateways
        const { data, error } = await supabase.functions.invoke('saas-create-checkout', {
          body: {
            tenant_id: formData.tenant_id,
            plan_name: formData.plan_name,
            amount: formData.amount,
            due_date: formData.due_date,
            gateway: formData.gateway,
          },
        });
        
        if (error) throw new Error(error.message || 'Erro ao comunicar com o Gateway');
      }

      await logAudit({
        tenant_id: formData.tenant_id,
        user_id: user?.id,
        action: 'INVOICE_CREATED',
        entity: 'saas_invoices',
        description: `Fatura criada: ${formData.plan_name} via ${formData.gateway} — R$ ${formData.amount}`,
      });

      toast.success('Fatura criada com sucesso!');
      setIsChargeModalOpen(false);
      await fetchInvoices();
    } catch (err: any) {
      console.error('Erro ao criar fatura:', err);
      toast.error(`Erro ao criar fatura: ${err.message}`);
    }
  };

  // ─── Marcar fatura como paga ────────────────────────────────────────────────
  const handleMarkPaid = async (invoice: any) => {
    try {
      const { error } = await supabase
        .from('saas_invoices')
        .update({ status: 'pago', paid_at: new Date().toISOString() })
        .eq('id', invoice.id);

      if (error) throw error;

      // Atualiza otimisticamente o estado local
      setInvoicesList((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id
            ? { ...inv, status: 'pago', paid_at: new Date().toISOString() }
            : inv
        )
      );

      await logAudit({
        tenant_id: invoice.tenant_id,
        user_id: user?.id,
        action: 'INVOICE_PAID',
        entity: 'saas_invoices',
        entity_id: invoice.id,
        description: `Fatura #${invoice.invoice_number || invoice.id.substring(0, 8)} marcada como paga manualmente`,
      });

      toast.success('Fatura marcada como paga!');
    } catch (err: any) {
      console.error('Erro ao marcar fatura como paga:', err);
      toast.error(`Erro: ${err.message}`);
    }
  };

  // ─── Bloquear fatura / suspender tenant ────────────────────────────────────
  const handleBlockInvoice = async (invoice: any) => {
    try {
      // 1. Atualiza status da fatura
      const { error: invError } = await supabase
        .from('saas_invoices')
        .update({ status: 'bloqueado' })
        .eq('id', invoice.id);

      if (invError) throw invError;

      // 2. Suspende o tenant
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({ status: 'Suspenso' })
        .eq('id', invoice.tenant_id);

      if (tenantError) throw tenantError;

      // 3. Atualiza estado local
      setInvoicesList((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id ? { ...inv, status: 'bloqueado' } : inv
        )
      );

      await logAudit({
        tenant_id: invoice.tenant_id,
        user_id: user?.id,
        action: 'INVOICE_BLOCKED',
        entity: 'saas_invoices',
        entity_id: invoice.id,
        description: `Serviço suspenso por inadimplência. Fatura #${invoice.invoice_number || invoice.id.substring(0, 8)}`,
      });

      toast.success('Serviço suspenso. Tenant notificado sobre inadimplência.');
    } catch (err: any) {
      console.error('Erro ao bloquear fatura:', err);
      toast.error(`Erro ao bloquear: ${err.message}`);
    }
  };

  // ─── Reprocessar faturas pendentes/atrasadas ────────────────────────────────
  const handleReprocessFailures = async (setAuditLogsList: any, userId?: string, userEmail?: string) => {
    const pendingInvoices = invoicesList.filter(
      (inv) => inv.status === 'pendente' || inv.status === 'atrasado'
    );
    const pendingCount = pendingInvoices.length;

    if (pendingCount === 0) {
      toast('Nenhuma fatura pendente encontrada.', { icon: 'ℹ️' });
      return;
    }

    try {
      // Atualiza status das atrasadas para pendente (reprocessamento)
      const overdueIds = pendingInvoices
        .filter((inv) => inv.status === 'atrasado')
        .map((inv) => inv.id);

      if (overdueIds.length > 0) {
        await supabase
          .from('saas_invoices')
          .update({ status: 'pendente' })
          .in('id', overdueIds);
      }

      await logAudit({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: userId,
        action: 'BILLING_REPROCESS',
        entity: 'System',
        description: `Reprocessamento de ${pendingCount} faturas pendentes/atrasadas`,
      });

      const log = {
        id: `audit-${Date.now()}`,
        action: 'BILLING_REPROCESS_SUCCESS',
        tenant: 'System / Billing',
        admin: userEmail || 'Administrador',
        time: 'Agora mesmo',
        status: 'success',
        details: `${pendingCount} faturas reprocessadas com sucesso.`,
      };
      setAuditLogsList((prev: any[]) => [log, ...prev]);

      toast.success(`${pendingCount} faturas re-encaminhadas para reprocessamento.`);
      await fetchInvoices();
    } catch (err: any) {
      toast.error(`Erro no reprocessamento: ${err.message}`);
    }
  };

  // ─── Recobrança Individual (Gerar Novo Link) ────────────────────────────────
  const handleResendCharge = async (invoice: any) => {
    try {
      if (invoice.gateway === 'manual') {
        toast.error('Não é possível gerar novo link para cobranças manuais. Edite a fatura ou crie uma nova.');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('saas-create-checkout', {
        body: {
          tenant_id: invoice.tenant_id,
          plan_name: invoice.plan_name,
          amount: invoice.amount,
          due_date: invoice.due_date,
          gateway: invoice.gateway,
        },
      });

      if (error) throw new Error(error.message || 'Erro ao comunicar com o Gateway');

      // Atualizar a fatura antiga com o novo link (ou gerar uma nova)
      // Neste caso, estamos sobreescrevendo o link na mesma fatura para simplificar
      const newUrl = data?.data?.boleto_url;
      if (newUrl) {
        await supabase
          .from('saas_invoices')
          .update({ boleto_url: newUrl, payment_link: newUrl, status: 'pendente' })
          .eq('id', invoice.id);
      }

      await logAudit({
        tenant_id: invoice.tenant_id,
        user_id: user?.id,
        action: 'INVOICE_RESENT',
        entity: 'saas_invoices',
        description: `Novo link gerado via ${invoice.gateway} para a fatura R$ ${invoice.amount}`,
      });

      toast.success('Novo link de cobrança gerado com sucesso!');
      await fetchInvoices();
    } catch (err: any) {
      console.error('Erro ao re-enviar cobrança:', err);
      toast.error(`Erro ao gerar novo link: ${err.message}`);
    }
  };

  return {
    invoicesList,
    invoicesLoading,
    fetchInvoices,
    isChargeModalOpen,
    setIsChargeModalOpen,
    selectedInvoice,
    setSelectedInvoice,
    handleSaveCharge,
    handleMarkPaid,
    handleBlockInvoice,
    handleReprocessFailures,
    handleResendCharge,
  };
};
