import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

export const LeadFormSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Por favor, preencha pelo menos Nome e E-mail.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from('saas_leads').insert([
        {
          name,
          email,
          phone: phone || null,
          company_name: companyName || null,
          notes: notes || null,
          status: 'Pendente',
        },
      ]);

      if (error) throw error;

      toast.success('Contato enviado com sucesso! Retornaremos em breve.');
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setCompanyName('');
      setNotes('');
    } catch (err: any) {
      console.error('Erro ao enviar lead:', err);
      toast.error(`Falha ao enviar contato: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="lead-contact-form"
      style={{
        padding: '80px 40px',
        background: 'rgba(255, 255, 255, 0.005)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#00b865',
              letterSpacing: '0.1em',
              marginBottom: 14,
            }}
          >
            FALE CONOSCO
          </div>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#fff',
              marginBottom: 12,
            }}
          >
            Pronto para impulsionar seus resultados?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>
            Preencha os campos abaixo e nosso especialista entrará em contato para agendar uma demonstração exclusiva com base nas necessidades da sua fazenda.
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'rgba(0, 184, 101, 0.08)',
              border: '1px solid rgba(0, 184, 101, 0.2)',
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(0, 184, 101, 0.15)',
                color: '#00b865',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 20px',
              }}
            >
              ✓
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: 10 }}>
              Mensagem Recebida!
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 20 }}>
              Agradecemos seu contato. Nossa equipe técnica de consultoria agrícola e bovinocultura está analisando suas informações e entrará em contato por telefone ou e-mail muito em breve.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="btn-ghost"
              style={{ fontSize: '13px', padding: '10px 24px' }}
            >
              Enviar outra mensagem
            </button>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              background: 'rgba(255, 255, 255, 0.015)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '24px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  Nome Completo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand))')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  E-mail <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand))')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  Celular / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand))')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  Nome da Fazenda ou Empresa
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fazenda Santa Maria"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand))')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                Como podemos ajudar? (Mensagem)
              </label>
              <textarea
                rows={3}
                placeholder="Conte-nos brevemente o tamanho da sua propriedade ou os desafios principais atuais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--brand))')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 800,
                marginTop: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'ENVIANDO INFORMAÇÕES...' : 'SOLICITAR DEMONSTRAÇÃO GRATUITA'}
            </button>
          </motion.form>
        )}
      </div>
    </section>
  );
};
