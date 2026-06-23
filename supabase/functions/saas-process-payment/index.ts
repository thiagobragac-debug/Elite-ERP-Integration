import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { payment_id, gateway, credit_card, card_token, amount, description } = await req.json();

    if (!payment_id || !gateway) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const gatewayName = gateway.toLowerCase();

    if (gatewayName === 'asaas') {
      const apiKey = Deno.env.get('ASAAS_API_KEY') || '';
      if (!apiKey) throw new Error('ASAAS_API_KEY não configurada no servidor.');

      // No Asaas, o payment_id já existe (criado no PIX).
      // Como o Asaas não permite atualizar o tipo de cobrança (billingType) facilmente após criado,
      // a prática recomendada em transparente híbrido é criar um NOVO payment de cartão e cancelar o PIX.
      // Aqui, faremos uma chamada direta de criação de cartão para fins do MVP robusto:
      
      const paymentRes = await fetch('https://sandbox.asaas.com/api/v3/payments', {
        method: 'POST',
        headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: 'cus_000005230912', // Mock, ideal buscar o ID real
          billingType: 'CREDIT_CARD',
          value: amount,
          dueDate: new Date().toISOString().split('T')[0],
          description: description || 'Pagamento Cartão',
          creditCard: {
            holderName: credit_card.holderName,
            number: credit_card.number,
            expiryMonth: credit_card.expiryMonth,
            expiryYear: credit_card.expiryYear,
            ccv: credit_card.ccv
          },
          creditCardHolderInfo: {
            name: credit_card.holderName,
            email: 'contato@cliente.com',
            cpfCnpj: '00000000000',
            postalCode: '00000000',
            addressNumber: '0',
            phone: '0000000000'
          }
        })
      });
      
      const paymentObj = await paymentRes.json();
      if (paymentObj.errors) throw new Error(paymentObj.errors[0].description);
      
      // Atualizar a fatura no banco com o novo payment_id e marcar como pago/processando
      const { error: invoiceError } = await supabase
        .from('saas_invoices')
        .update({ 
          payment_id: paymentObj.id,
          status: paymentObj.status === 'CONFIRMED' || paymentObj.status === 'RECEIVED' ? 'pago' : 'processando'
        })
        .eq('payment_id', payment_id); // payment_id antigo (PIX)

      return new Response(
        JSON.stringify({ message: 'Pagamento processado com sucesso', status: paymentObj.status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (gatewayName === 'pagarme' || gatewayName === 'pagar.me') {
      const pagarmeSecret = Deno.env.get('PAGARME_SECRET_KEY') || '';
      if (!pagarmeSecret) throw new Error('PAGARME_SECRET_KEY não configurada.');
      const base64Key = btoa(`${pagarmeSecret}:`);

      // No Pagar.me V5, se um Order foi criado com PIX, ele está "pending".
      // Não podemos adicionar cartão nele diretamente. Precisamos criar uma nova Order com o card_token.
      const pagarmeRes = await fetch('https://api.pagar.me/core/v5/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${base64Key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{ amount: Math.round(amount * 100), description: description || 'Pagamento Cartão', quantity: 1 }],
          customer: { name: 'Cliente Transparente', email: 'contato@cliente.com', type: 'individual', document: '00000000000' },
          payments: [{
            payment_method: 'credit_card',
            credit_card: {
              card_token: card_token,
              operation_type: 'auth_and_capture',
              installments: 1
            }
          }]
        })
      });

      const pagarmeObj = await pagarmeRes.json();
      if (pagarmeObj.message) throw new Error(pagarmeObj.message);

      const status = pagarmeObj.status;

      // Atualiza fatura no banco
      await supabase
        .from('saas_invoices')
        .update({ 
          payment_id: pagarmeObj.id,
          status: status === 'paid' ? 'pago' : 'processando'
        })
        .eq('payment_id', payment_id);

      return new Response(
        JSON.stringify({ message: 'Pagamento processado com sucesso', status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else {
      throw new Error('Gateway não suportado para processamento manual (Stripe usa Elements nativo).');
    }

  } catch (error: any) {
    console.error('Process payment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
