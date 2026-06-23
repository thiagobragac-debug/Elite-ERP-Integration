import React from 'react';
import { Link } from 'react-router-dom';
import { TauzeLogo } from './HeroSection';
import { useSystemSettings } from '../../../contexts/SystemSettingsContext';
import { LeadFormSection } from './LeadFormSection';

interface FAQSectionProps {
  faqOpen: number | null;
  setFaqOpen: (index: number | null) => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ faqOpen, setFaqOpen }) => {
  const { settings } = useSystemSettings();

  const defaultFaqs = [
    {
      q: 'O sistema funciona sem internet no campo?',
      a: 'Sim. O Tauze foi construído offline-first. Todas as pesagens RFID, abastecimentos e registros de campo funcionam sem conexão e sincronizam automaticamente ao retornar ao wi-fi da sede.',
    },
    {
      q: 'Como funciona a integração bancária?',
      a: 'Conectamos via Open Finance com BB, Itaú, Bradesco, Sicredi, Cresol e BTG. O extrato é importado automaticamente e o sistema casa os lançamentos com seu controle interno sem digitação.',
    },
    {
      q: 'É possível gerenciar múltiplas fazendas?',
      a: 'Sim. O painel central consolida todas as unidades num único dashboard executivo. Você pode filtrar por fazenda, ver o agregado do grupo ou comparar desempenho entre propriedades.',
    },
    {
      q: 'Quanto tempo leva a implantação?',
      a: 'A média de go-live completo é de 7 dias úteis. Realizamos a migração dos dados históricos de planilhas, treinamento da equipe e configuração das integrações nesse período.',
    },
    {
      q: 'O sistema emite NF-e e documentos fiscais?',
      a: 'Sim. NF-e, CT-e e MDF-e de forma integrada ao módulo de vendas e compras. A nota é gerada automaticamente no momento da venda ou da entrada de mercadoria, sem necessidade de outro sistema.',
    },
  ];

  const faqs = settings.landing_faq_items && settings.landing_faq_items.length > 0
    ? settings.landing_faq_items
    : defaultFaqs;

  const defaultTestimonials = [
    {
      name: 'Carlos Mendes',
      role: 'Pecuarista · 3.200 cabeças · MS',
      text: 'A pesagem RFID eliminou o estresse do manejo. Antes perdia 2 arrobas por animal no dia da pesagem. Hoje o sistema registra sozinho toda semana.',
    },
    {
      name: 'Adriana Fonseca',
      role: 'Gestora Agrícola · 8.500 ha · GO',
      text: 'O controle de diesel foi o que me convenceu. Em 60 dias identificamos um desvio de R$ 38 mil no consumo de combustível que nunca teríamos encontrado em planilha.',
    },
    {
      name: 'Roberto Pinheiro',
      role: 'Produtor Integrado · MT',
      text: 'A conciliação bancária economizou 3 dias de trabalho do meu financeiro todo mês. O sistema casa os lançamentos automaticamente com uma taxa de 94% de acerto.',
    },
  ];

  const testimonials = settings.landing_testimonials && settings.landing_testimonials.length > 0
    ? settings.landing_testimonials
    : defaultTestimonials;

  return (
    <>
      {/* ──── TESTIMONIALS ──── */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#00b865',
                letterSpacing: '0.1em',
                marginBottom: 14,
              }}
            >
              DEPOIMENTOS
            </div>
            <h2
              style={{
                fontSize: 'clamp(26px, 3.5vw, 42px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
              }}
            >
              O que dizem os produtores
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card" style={{ padding: 28 }}>
                <div
                  style={{
                    fontSize: 32,
                    color: 'rgba(0,184,101,0.3)',
                    fontWeight: 900,
                    marginBottom: 16,
                    lineHeight: 1,
                  }}
                >
                  "
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.8,
                    marginBottom: 24,
                  }}
                >
                  {t.text}
                </p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    {t.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FAQ ──── */}
      <section
        id="faq"
        style={{
          padding: '100px 40px',
          background: 'rgba(255,255,255,0.015)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#00b865',
                letterSpacing: '0.1em',
                marginBottom: 14,
              }}
            >
              PERGUNTAS FREQUENTES
            </div>
            <h2
              style={{
                fontSize: 'clamp(26px, 3.5vw, 42px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
              }}
            >
              Dúvidas comuns
            </h2>
          </div>

          <div>
            {faqs.map((f, i) => (
              <div key={i} className="faq-item">
                <button className="faq-btn" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span>{f.q}</span>
                  <span
                    style={{
                      fontSize: 20,
                      color: 'rgba(255,255,255,0.3)',
                      flexShrink: 0,
                      transform: faqOpen === i ? 'rotate(45deg)' : 'none',
                      transition: 'transform 0.3s',
                    }}
                  >
                    +
                  </span>
                </button>
                {faqOpen === i && <div className="faq-answer">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <LeadFormSection />

      {/* ──── CTA ──── */}
      <section
        id="contato"
        style={{ padding: '100px 40px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 800,
              height: 800,
              background: 'radial-gradient(circle, rgba(0,184,101,0.1) 0%, transparent 65%)',
              animation: 'glow-pulse 5s ease-in-out infinite',
            }}
          />
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background: 'rgba(0,184,101,0.12)',
              border: '1px solid rgba(0,184,101,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 28px',
            }}
          >
            <TauzeLogo size={38} />
          </div>

          <h2
            style={{
              fontSize: 'clamp(30px, 5vw, 52px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              marginBottom: 18,
              lineHeight: 1.1,
            }}
          >
            Pronto para transformar
            <br />a gestão da sua fazenda?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.7,
              marginBottom: 40,
              maxWidth: 500,
              margin: '0 auto 40px',
            }}
          >
            Agende uma demonstração de 30 minutos com nossa equipe técnica e veja o sistema
            funcionando com dados reais do seu negócio.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={`https://wa.me/${settings.landing_whatsapp || '5511999999999'}?text=Olá!%20Tenho%20interesse%20em%20conhecer%20o%20${encodeURIComponent(settings.system_name || 'Tauze ERP')}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: 16, padding: '17px 36px' }}
            >
              <span>💬</span>
              <span>Falar no WhatsApp</span>
            </a>
            <Link to="/login" className="btn-ghost" style={{ fontSize: 16, padding: '17px 36px' }}>
              Acessar o ERP agora →
            </Link>
          </div>

          <div
            style={{
              marginTop: 32,
              display: 'flex',
              gap: 28,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {['Sem cartão de crédito', 'Demo gratuita', 'Dados reais da sua fazenda'].map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.3)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ color: '#00b865' }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
