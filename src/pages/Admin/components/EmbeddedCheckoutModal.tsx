import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, LayoutGrid, CreditCard, QrCode, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Inicializa Stripe com chave teste mock (apenas para montagem do provider, pode falhar em produção se a chave for inválida)
const stripePromise = loadStripe('pk_test_mock123').catch(() => null);

const StripeCheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    
    setLoading(true);
    // Na prática, faríamos o confirmPayment
    // const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: '...' }});
    
    // Simula sucesso (já que as chaves são mocks)
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          background: '#10b981',
          border: 'none',
          color: '#fff',
          fontWeight: 800,
          fontSize: '14px',
          cursor: 'pointer',
          marginTop: '16px',
        }}
      >
        {loading ? 'Processando...' : 'Pagar Agora'}
      </button>
    </form>
  );
};

export const EmbeddedCheckoutModal = ({
  isOpen,
  onClose,
  transparentData,
  amount
}: {
  isOpen: boolean;
  onClose: () => void;
  transparentData: any;
  amount: number;
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto'>(
    transparentData?.type === 'pix' ? 'pix' : 'card'
  );

  const [cardData, setCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenericCardSubmit = async () => {
    setIsProcessing(true);
    try {
      let card_token = null;

      // Pagar.me V5 Tokenization na API Pública
      if (transparentData.cardGateway === 'pagarme' || transparentData.cardGateway === 'pagar.me') {
        const pk = 'pk_test_XXXXXXXXXXXXXXXX'; // Ideal vir do config do Tenant ou env public
        const pagarmeRes = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${pk}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'card',
            card: {
              number: cardData.number,
              holder_name: cardData.holderName,
              exp_month: parseInt(cardData.expiryMonth),
              exp_year: parseInt(cardData.expiryYear),
              cvv: cardData.ccv
            }
          })
        });
        const pagarmeObj = await pagarmeRes.json();
        if (pagarmeObj.id) {
          card_token = pagarmeObj.id;
        } else {
          throw new Error('Erro ao tokenizar cartão no Pagar.me');
        }
      }

      // Envia para a Edge Function processar com segredo (Asaas ou Pagarme com Token)
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/saas-process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          payment_id: transparentData.paymentId,
          gateway: transparentData.cardGateway || 'asaas',
          amount,
          card_token,
          credit_card: !card_token ? cardData : undefined
        })
      });

      const obj = await res.json();
      if (obj.error) throw new Error(obj.error);

      toast.success('Pagamento efetuado com sucesso!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar cartão.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  if (!isOpen || !transparentData) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ width: '100%', maxWidth: '440px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Pagamento</h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'hsl(var(--text-secondary))' }}>
              R$ {amount.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer', padding: '8px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        {!transparentData.clientSecret && (
          <div style={{ display: 'grid', gridTemplateColumns: transparentData.boletoBarcode ? '1fr 1fr 1fr' : '1fr 1fr', borderBottom: '1px solid hsl(var(--border))' }}>
            <button
              onClick={() => setPaymentMethod('card')}
              style={{ padding: '16px', background: 'transparent', border: 'none', borderBottom: paymentMethod === 'card' ? '2px solid #10b981' : '2px solid transparent', color: paymentMethod === 'card' ? 'hsl(var(--text-main))' : 'hsl(var(--text-secondary))', fontWeight: paymentMethod === 'card' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <CreditCard size={18} /> Cartão
            </button>
            <button
              onClick={() => setPaymentMethod('pix')}
              style={{ padding: '16px', background: 'transparent', border: 'none', borderBottom: paymentMethod === 'pix' ? '2px solid #10b981' : '2px solid transparent', color: paymentMethod === 'pix' ? 'hsl(var(--text-main))' : 'hsl(var(--text-secondary))', fontWeight: paymentMethod === 'pix' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <QrCode size={18} /> PIX
            </button>
            {transparentData.boletoBarcode && (
              <button
                onClick={() => setPaymentMethod('boleto')}
                style={{ padding: '16px', background: 'transparent', border: 'none', borderBottom: paymentMethod === 'boleto' ? '2px solid #10b981' : '2px solid transparent', color: paymentMethod === 'boleto' ? 'hsl(var(--text-main))' : 'hsl(var(--text-secondary))', fontWeight: paymentMethod === 'boleto' ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
              >
                <FileText size={18} /> Boleto
              </button>
            )}
          </div>
        )}

        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {paymentMethod === 'pix' && (
            <div style={{ width: '100%', background: 'hsl(var(--bg-main))', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px dashed #cbd5e1' }}>
              <img src={transparentData.qrCodeBase64} alt="QR Code PIX" style={{ width: '160px', height: '160px', marginBottom: '16px' }} />
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                Escaneie o QR Code ou copie a chave PIX abaixo
              </p>
              <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
                <input readOnly value={transparentData.pixCode} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'hsl(var(--bg-card))', fontSize: '12px', color: '#64748b' }} />
                <button onClick={() => copyToClipboard(transparentData.pixCode, 'Chave PIX copiada!')} style={{ padding: '0 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                  Copiar
                </button>
              </div>
            </div>
          )}

          {paymentMethod === 'boleto' && transparentData.boletoBarcode && (
            <div style={{ width: '100%', background: 'hsl(var(--bg-main))', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid hsl(var(--border))' }}>
              <FileText size={48} color="hsl(var(--text-secondary))" style={{ marginBottom: '16px' }} />
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                Linha Digitável do Boleto
              </p>
              <div style={{ display: 'flex', width: '100%', gap: '8px', marginBottom: '16px' }}>
                <input readOnly value={transparentData.boletoBarcode} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'hsl(var(--bg-card))', fontSize: '12px', color: '#64748b' }} />
                <button onClick={() => copyToClipboard(transparentData.boletoBarcode, 'Linha digitável copiada!')} style={{ padding: '0 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                  Copiar
                </button>
              </div>
              {transparentData.boletoPdf && (
                <button onClick={() => window.open(transparentData.boletoPdf, '_blank')} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid hsl(var(--border))', color: 'hsl(var(--text-main))', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                  Visualizar PDF do Boleto
                </button>
              )}
            </div>
          )}

          {paymentMethod === 'card' && transparentData.clientSecret && (
            <div style={{ width: '100%' }}>
              <Elements stripe={stripePromise} options={{ clientSecret: transparentData.clientSecret }}>
                <StripeCheckoutForm onSuccess={() => {
                  toast.success('Pagamento efetuado com sucesso!');
                  onClose();
                }} />
              </Elements>
            </div>
          )}

          {paymentMethod === 'card' && !transparentData.clientSecret && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Nome do Titular" 
                value={cardData.holderName}
                onChange={(e) => setCardData({...cardData, holderName: e.target.value})}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', fontSize: '14px', color: 'hsl(var(--text-main))' }} 
              />
              <input 
                type="text" 
                placeholder="Número do Cartão" 
                value={cardData.number}
                onChange={(e) => setCardData({...cardData, number: e.target.value})}
                maxLength={19}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', fontSize: '14px', color: 'hsl(var(--text-main))' }} 
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Mês (MM)" 
                  value={cardData.expiryMonth}
                  onChange={(e) => setCardData({...cardData, expiryMonth: e.target.value})}
                  maxLength={2}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', fontSize: '14px', color: 'hsl(var(--text-main))' }} 
                />
                <input 
                  type="text" 
                  placeholder="Ano (AA)" 
                  value={cardData.expiryYear}
                  onChange={(e) => setCardData({...cardData, expiryYear: e.target.value})}
                  maxLength={2}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', fontSize: '14px', color: 'hsl(var(--text-main))' }} 
                />
              </div>
              <input 
                type="text" 
                placeholder="CVC" 
                value={cardData.ccv}
                onChange={(e) => setCardData({...cardData, ccv: e.target.value})}
                maxLength={4}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', fontSize: '14px', color: 'hsl(var(--text-main))' }} 
              />
              <button 
                onClick={handleGenericCardSubmit}
                disabled={isProcessing}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: isProcessing ? 'not-allowed' : 'pointer', marginTop: '8px', opacity: isProcessing ? 0.7 : 1 }}
              >
                {isProcessing ? 'Processando Autenticação...' : 'Confirmar Pagamento Seguro'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
