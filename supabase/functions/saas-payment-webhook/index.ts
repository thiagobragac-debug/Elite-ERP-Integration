import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const event = await req.json();

    // Very basic verification to see what kind of event it is.
    // In production, verify signatures here (Stripe Signature or Asaas Webhook Token).

    let paymentId = '';
    let status = '';

    if (event.event === 'PAYMENT_RECEIVED' || event.event === 'PAYMENT_CONFIRMED') {
      // Asaas Webhook
      paymentId = event.payment?.id;
      status = 'pago';
    } else if (event.type === 'invoice.paid' || event.type === 'checkout.session.completed') {
      // Stripe Webhook
      paymentId = event.data?.object?.id;
      status = 'pago';
    } else {
      return new Response(JSON.stringify({ message: 'Event ignored' }), { status: 200 });
    }

    // 1. Encontrar a fatura correspondente (aqui assumimos que você salvou o paymentId ou enviou pelo gateway)
    // Para simplificar, vamos assumir que o paymentId = boleto_url que foi gerado, ou um campo external_id
    // Em produção, você precisa de uma coluna 'external_reference'
    const { data: invoices, error: searchError } = await supabase
      .from('saas_invoices')
      .select('*')
      .ilike('boleto_url', `%${paymentId}%`)
      .limit(1);

    if (searchError) throw searchError;

    if (invoices && invoices.length > 0) {
      const invoice = invoices[0];
      
      // 2. Atualiza Fatura
      await supabase
        .from('saas_invoices')
        .update({ status: 'pago', paid_at: new Date().toISOString() })
        .eq('id', invoice.id);

      // 3. Desbloqueia o Tenant (se estivesse suspenso ou em bloqueio parcial)
      await supabase
        .from('tenants')
        .update({ status: 'Ativo' })
        .eq('id', invoice.tenant_id);

      // 4. Registrar auditoria
      await supabase.from('saas_audit_logs').insert([
        {
          tenant_id: invoice.tenant_id,
          user_id: null,
          action: 'PAYMENT_RECEIVED_WEBHOOK',
          entity: 'saas_invoices',
          entity_id: invoice.id,
          description: `Pagamento recebido via Webhook (${paymentId})`,
        }
      ]);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
