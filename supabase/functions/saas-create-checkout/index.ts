import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL configurável via variável de ambiente. Em produção deve ser https://api.asaas.com
const asaasApiUrl = Deno.env.get('ASAAS_API_URL') || 'https://sandbox.asaas.com';

// ─── HELPERS: Gestão de Clientes nos Gateways ────────────────────────────────

async function getOrCreateAsaasCustomer(asaasKey: string, tenant: any, supabase: any): Promise<string | null> {
  let customerId = tenant.gateway_ids?.asaas?.customerId;
  if (!customerId) {
    const res = await fetch(`${asaasApiUrl}/api/v3/customers`, {
      method: 'POST',
      headers: { 'access_token': asaasKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: tenant.nome || 'Cliente ERP',
        cpfCnpj: tenant.documento || '00000000000',
        email: tenant.email || 'contato@cliente.com'
      })
    });
    const obj = await res.json();
    if (obj.id) {
      customerId = obj.id;
      const newGatewayIds = { ...tenant.gateway_ids, asaas: { ...tenant.gateway_ids?.asaas, customerId } };
      await supabase.from('tenants').update({ gateway_ids: newGatewayIds }).eq('id', tenant.id);
      tenant.gateway_ids = newGatewayIds;
    }
  }
  return customerId;
}

async function getOrCreateStripeCustomer(stripeSecret: string, tenant: any, supabase: any): Promise<string | null> {
  let customerId = tenant.gateway_ids?.stripe?.customerId;
  if (!customerId) {
    const body = new URLSearchParams({
      name: tenant.nome || 'Cliente ERP',
      email: tenant.email || 'contato@cliente.com'
    });
    const res = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeSecret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const obj = await res.json();
    if (obj.id) {
      customerId = obj.id;
      const newGatewayIds = { ...tenant.gateway_ids, stripe: { ...tenant.gateway_ids?.stripe, customerId } };
      await supabase.from('tenants').update({ gateway_ids: newGatewayIds }).eq('id', tenant.id);
      tenant.gateway_ids = newGatewayIds;
    }
  }
  return customerId;
}

// ─── HANDLER PRINCIPAL ───────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tenant_id, plan_id } = await req.json();

    if (!tenant_id || !plan_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields: tenant_id e plan_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar dados do Tenant e do Plano
    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenant_id).single();
    if (!tenant) throw new Error('Tenant não encontrado');

    const { data: plan } = await supabase.from('saas_plans').select('*').eq('id', plan_id).single();
    if (!plan) throw new Error('Plano não encontrado');

    // Obter Add-ons ativos do Tenant para calcular o total
    const { data: tenantAddons } = await supabase
      .from('saas_tenant_addons')
      .select('saas_addons(price)')
      .eq('tenant_id', tenant_id)
      .eq('status', 'active');

    let addonsTotal = 0;
    if (tenantAddons) {
      tenantAddons.forEach((ta: any) => {
        if (ta.saas_addons?.price) addonsTotal += Number(ta.saas_addons.price);
      });
    }

    const totalAmount = plan.price + addonsTotal;
    const due_date = new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0];

    // Obter configurações de Smart Routing
    const { data: settings } = await supabase.from('saas_payment_settings').select('*').limit(1).single();
    const routing = {
      card: settings?.default_card_gateway || 'stripe',
      pix: settings?.default_pix_gateway || 'asaas',
      boleto: settings?.default_boleto_gateway || 'pagarme'
    };

    const asaasKey = Deno.env.get('ASAAS_API_KEY') || '';
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || '';
    const pagarmeSecret = Deno.env.get('PAGARME_SECRET_KEY') || '';

    let transparent_data: any = { type: 'all' };
    let gateway_payment_ids: any = {};
    let updatedGatewayIds = { ...tenant.gateway_ids };
    const promises: Promise<void>[] = [];

    // ── CARTÃO via Stripe (Subscription) ──────────────────────────────────
    if (routing.card === 'stripe') {
      promises.push((async () => {
        if (!stripeSecret) return;
        const customerId = await getOrCreateStripeCustomer(stripeSecret, tenant, supabase);
        if (!customerId) return;

        const stripePlanId = plan?.settings?.stripePlanId;

        if (stripePlanId) {
          // Criar Subscription real no Stripe
          const body = new URLSearchParams({
            customer: customerId,
            'items[0][price]': stripePlanId,
            'payment_behavior': 'default_incomplete',
            'expand[]': 'latest_invoice.payment_intent'
          });
          const res = await fetch('https://api.stripe.com/v1/subscriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${stripeSecret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
          });
          const obj = await res.json();
          if (obj.id) {
            transparent_data.clientSecret = obj.latest_invoice?.payment_intent?.client_secret;
            transparent_data.publicKey = Deno.env.get('STRIPE_PUBLIC_KEY') || '';
            gateway_payment_ids.stripe = obj.id;
            updatedGatewayIds.stripe = { ...updatedGatewayIds.stripe, subscriptionId: obj.id };
          }
        } else {
          // Fallback: Payment Intent avulso caso não tenha Price ID configurado
          const body = new URLSearchParams({
            amount: Math.round(totalAmount * 100).toString(),
            currency: 'brl',
            'payment_method_types[0]': 'card',
            'metadata[tenant_id]': tenant_id,
            'metadata[plan_name]': plan.name
          });
          const res = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${stripeSecret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
          });
          const obj = await res.json();
          if (obj.id) {
            transparent_data.clientSecret = obj.client_secret;
            transparent_data.publicKey = Deno.env.get('STRIPE_PUBLIC_KEY') || '';
            gateway_payment_ids.stripe = obj.id;
          }
        }
      })());
    }

    // ── PIX via Asaas (Subscription) ──────────────────────────────────────
    if (routing.pix === 'asaas') {
      promises.push((async () => {
        if (!asaasKey) return;
        const customerId = await getOrCreateAsaasCustomer(asaasKey, tenant, supabase);
        if (!customerId) return;

        // Criar Assinatura Mensal no Asaas
        const subRes = await fetch(`${asaasApiUrl}/api/v3/subscriptions`, {
          method: 'POST',
          headers: { 'access_token': asaasKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: customerId,
            billingType: 'PIX',
            value: totalAmount,
            nextDueDate: due_date,
            cycle: 'MONTHLY',
            description: `Assinatura ${plan.name}`
          })
        });
        const subObj = await subRes.json();
        if (subObj.id) {
          gateway_payment_ids.asaas_subscription = subObj.id;
          updatedGatewayIds.asaas = { ...updatedGatewayIds.asaas, subscriptionId: subObj.id };

          // Buscar a primeira cobrança (payment) gerada pela assinatura
          const payRes = await fetch(`${asaasApiUrl}/api/v3/subscriptions/${subObj.id}/payments`, {
            method: 'GET',
            headers: { 'access_token': asaasKey }
          });
          const payObj = await payRes.json();
          const firstPayment = payObj.data?.[0];

          if (firstPayment) {
            gateway_payment_ids.asaas_pix = firstPayment.id;
            const qrRes = await fetch(`${asaasApiUrl}/api/v3/payments/${firstPayment.id}/pixQrCode`, {
              method: 'GET',
              headers: { 'access_token': asaasKey }
            });
            const qrObj = await qrRes.json();
            transparent_data.pixCode = qrObj.payload;
            transparent_data.qrCodeBase64 = `data:image/png;base64,${qrObj.encodedImage}`;
            transparent_data.paymentId = firstPayment.id;
          }
        }
      })());
    }

    // ── BOLETO via Pagar.me (Subscription) ────────────────────────────────
    if (routing.boleto === 'pagarme') {
      promises.push((async () => {
        if (!pagarmeSecret) return;
        const base64Key = btoa(`${pagarmeSecret}:`);
        const pagarmePlanId = plan?.settings?.pagarmePlanId;

        if (pagarmePlanId) {
          // Criar Subscription no Pagar.me
          const pRes = await fetch('https://api.pagar.me/core/v5/subscriptions', {
            method: 'POST',
            headers: { 'Authorization': `Basic ${base64Key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan_id: pagarmePlanId,
              payment_method: 'boleto',
              customer: {
                name: tenant.nome || 'Cliente',
                email: tenant.email || 'c@c.com',
                type: 'individual',
                document: tenant.documento || '00000000000'
              }
            })
          });
          const pObj = await pRes.json();
          if (pObj.id) {
            gateway_payment_ids.pagarme_subscription = pObj.id;
            updatedGatewayIds.pagarme = { ...updatedGatewayIds.pagarme, subscriptionId: pObj.id };
          }
        } else {
          // Fallback: Boleto avulso
          const pRes = await fetch('https://api.pagar.me/core/v5/orders', {
            method: 'POST',
            headers: { 'Authorization': `Basic ${base64Key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [{ amount: Math.round(totalAmount * 100), description: plan.name, quantity: 1 }],
              customer: {
                name: tenant.nome || 'Cliente ERP',
                email: tenant.email || 'c@c.com',
                type: 'individual',
                document: tenant.documento || '00000000000'
              },
              payments: [{
                payment_method: 'boleto',
                boleto: { bank: '033', instructions: 'Pagamento Sistema', due_at: new Date(due_date).toISOString() }
              }]
            })
          });
          const pObj = await pRes.json();
          if (pObj.id) {
            gateway_payment_ids.pagarme_boleto = pObj.id;
            const charge = pObj.charges?.find((c: any) => c.payment_method === 'boleto');
            if (charge) {
              transparent_data.boletoBarcode = charge.last_transaction?.line;
              transparent_data.boletoPdf = charge.last_transaction?.pdf;
            }
          }
        }
      })());
    }

    await Promise.allSettled(promises);
    transparent_data.cardGateway = routing.card;

    // Salvar gateway_ids atualizados no Tenant
    await supabase.from('tenants').update({ gateway_ids: updatedGatewayIds, plano: plan.name }).eq('id', tenant_id);

    // Criar Fatura no banco
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('saas_invoices')
      .insert([{
        tenant_id,
        plan_name: plan.name,
        amount: totalAmount,
        status: 'pendente',
        due_date,
        gateway: 'smart_routing',
        payment_id: gateway_payment_ids.stripe || gateway_payment_ids.asaas_pix || gateway_payment_ids.asaas_subscription || gateway_payment_ids.pagarme_subscription || gateway_payment_ids.pagarme_boleto,
        gateway_payment_ids,
        boleto_url: transparent_data.boletoPdf || '',
        payment_link: transparent_data.boletoPdf || '',
        notes: 'Checkout criado via Orquestrador de Assinaturas',
      }])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    await supabase.from('saas_audit_logs').insert([{
      tenant_id,
      user_id: null,
      action: 'CHECKOUT_CREATED',
      entity: 'saas_invoices',
      entity_id: invoiceData.id,
      description: `Checkout de assinatura criado para o plano ${plan.name}`,
    }]);

    return new Response(
      JSON.stringify({ message: 'Checkout orquestrado com sucesso', data: invoiceData, transparent_data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
