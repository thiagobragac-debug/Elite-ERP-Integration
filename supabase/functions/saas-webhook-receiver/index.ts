import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

// ─── WEBHOOK SEGURO COM VALIDAÇÃO DE ASSINATURA ───────────────────────────────
// Qualquer requisição sem as chaves secretas corretas é bloqueada com 401.

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const bodyText = await req.text();
    let payload: any = {};

    // ── AUTENTICAÇÃO POR GATEWAY ───────────────────────────────────────────
    let gateway = '';
    const userAgent = req.headers.get('user-agent') || '';

    if (userAgent.toLowerCase().includes('stripe')) {
      // STRIPE: valida assinatura criptográfica
      gateway = 'stripe';
      const stripeSignature = req.headers.get('stripe-signature');
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

      if (!stripeSignature || !webhookSecret) {
        return new Response('Stripe signature/secret missing', { status: 401 });
      }
      try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2022-11-15' });
        payload = await stripe.webhooks.constructEventAsync(bodyText, stripeSignature, webhookSecret);
      } catch (err: any) {
        console.error('Stripe signature validation failed:', err.message);
        return new Response('Invalid Stripe signature', { status: 400 });
      }
    } else if (req.headers.has('asaas-access-token')) {
      // ASAAS: valida token de acesso no header
      gateway = 'asaas';
      const asaasToken = req.headers.get('asaas-access-token');
      const expectedToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');

      if (!expectedToken || asaasToken !== expectedToken) {
        return new Response('Invalid Asaas access token', { status: 401 });
      }
      payload = JSON.parse(bodyText);
    } else if (req.headers.get('x-webhook-token')) {
      // PAGAR.ME / GENÉRICO: valida token customizado
      gateway = 'pagarme';
      const pagarmeToken = req.headers.get('x-webhook-token');
      const expectedToken = Deno.env.get('PAGARME_WEBHOOK_TOKEN');

      if (!expectedToken || pagarmeToken !== expectedToken) {
        return new Response('Invalid Pagarme token', { status: 401 });
      }
      payload = JSON.parse(bodyText);
    } else {
      // Requisição sem nenhuma assinatura conhecida — bloqueio imediato
      return new Response('Unauthorized Webhook Request', { status: 401 });
    }
    // ── FIM DA AUTENTICAÇÃO ────────────────────────────────────────────────

    let paymentId = null;
    let customerId = null;
    let isPaid = false;
    let amount = 0;

    // ── IDENTIFICAR EVENTO POR GATEWAY ────────────────────────────────────
    if (gateway === 'stripe') {
      // Stripe envia 'invoice.paid' para cobranças de assinatura recorrente
      if ((payload.type === 'invoice.paid' || payload.type === 'invoice.payment_succeeded') && payload.data?.object) {
        paymentId = payload.data.object.payment_intent || payload.data.object.id;
        customerId = payload.data.object.customer;
        amount = (payload.data.object.amount_paid || 0) / 100;
        isPaid = true;
      } else if (payload.type === 'payment_intent.succeeded' && payload.data?.object?.id) {
        paymentId = payload.data.object.id;
        customerId = payload.data.object.customer;
        amount = (payload.data.object.amount_received || 0) / 100;
        isPaid = true;
      }
    } else if (gateway === 'asaas') {
      if (payload.event === 'PAYMENT_RECEIVED' || payload.event === 'PAYMENT_CONFIRMED') {
        paymentId = payload.payment?.id;
        customerId = payload.payment?.customer;
        amount = payload.payment?.value || 0;
        isPaid = true;
      }
    } else if (gateway === 'pagarme') {
      if (payload.type === 'order.paid' && payload.data?.id) {
        paymentId = payload.data.id;
        customerId = payload.data.customer?.id;
        amount = (payload.data.amount || 0) / 100;
        isPaid = true;
      }
    }

    if (!paymentId || !isPaid) {
      return new Response(
        JSON.stringify({ received: true, message: 'Ignorado - Evento não é de pagamento aprovado' }),
        { status: 200 }
      );
    }

    // ── BUSCAR FATURA EXISTENTE (Checkout inicial) ─────────────────────────
    const { data: invoice } = await supabase
      .from('saas_invoices')
      .select('*')
      .or(`payment_id.eq.${paymentId},gateway_payment_ids->>stripe.eq.${paymentId},gateway_payment_ids->>asaas_pix.eq.${paymentId},gateway_payment_ids->>pagarme_boleto.eq.${paymentId}`)
      .limit(1)
      .single();

    let tenantId = invoice?.tenant_id;
    let finalInvoiceId = invoice?.id;

    // ── SE NÃO ACHOU FATURA: é cobrança RECORRENTE (2º mês em diante) ─────
    if (!tenantId && customerId) {
      let tenantQuery = supabase.from('tenants').select('id, valid_until, plano').limit(1);

      if (gateway === 'asaas') {
        tenantQuery = tenantQuery.eq('gateway_ids->asaas->>customerId', customerId);
      } else if (gateway === 'stripe') {
        tenantQuery = tenantQuery.eq('gateway_ids->stripe->>customerId', customerId);
      } else if (gateway === 'pagarme') {
        tenantQuery = tenantQuery.eq('gateway_ids->pagarme->>customerId', customerId);
      }

      const { data: tenants } = await tenantQuery;

      if (tenants && tenants.length > 0) {
        tenantId = tenants[0].id;

        // Criar nova fatura já como "pago" para registrar no histórico
        const { data: newInvoice } = await supabase
          .from('saas_invoices')
          .insert([{
            tenant_id: tenantId,
            plan_name: tenants[0].plano || 'Assinatura',
            amount: amount,
            status: 'pago',
            due_date: new Date().toISOString().split('T')[0],
            gateway: gateway,
            payment_id: paymentId,
            notes: 'Pagamento Recorrente — Renovação Automática via Webhook'
          }])
          .select()
          .single();

        if (newInvoice) finalInvoiceId = newInvoice.id;
      }
    } else if (tenantId) {
      // Fatura existente: marcar como paga
      await supabase
        .from('saas_invoices')
        .update({ status: 'pago', updated_at: new Date().toISOString() })
        .eq('id', finalInvoiceId);
    }

    if (!tenantId) {
      return new Response(
        JSON.stringify({ received: true, message: 'Tenant não localizado para o cliente/assinatura' }),
        { status: 200 }
      );
    }

    // ── RENOVAR ACESSO DO TENANT (+30 dias) ───────────────────────────────
    const { data: tenant } = await supabase
      .from('tenants')
      .select('valid_until')
      .eq('id', tenantId)
      .single();

    let currentValidUntil = tenant?.valid_until ? new Date(tenant.valid_until) : new Date();
    if (currentValidUntil < new Date()) {
      currentValidUntil = new Date(); // Se vencido, renova a partir de hoje
    }
    const newValidUntil = new Date(currentValidUntil.setDate(currentValidUntil.getDate() + 30)).toISOString();

    await supabase
      .from('tenants')
      .update({ valid_until: newValidUntil, status: 'ativo' })
      .eq('id', tenantId);

    // ── REGISTRAR AUDITORIA ────────────────────────────────────────────────
    await supabase.from('saas_audit_logs').insert([{
      tenant_id: tenantId,
      user_id: null,
      action: 'INVOICE_PAID',
      entity: 'saas_invoices',
      entity_id: finalInvoiceId || tenantId,
      description: `Pagamento via Webhook Autenticado (${gateway}). Assinatura renovada até ${newValidUntil.split('T')[0]}`,
    }]);

    return new Response(
      JSON.stringify({ received: true, message: 'Conciliação de assinatura efetuada com sucesso' }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
