import React from 'react';
import { Link } from 'react-router-dom';
import { CountdownTimer } from '../../../components/UI/CountdownTimer';

interface PricingSectionProps {
  plans: any[];
  activeCampaign: any;
  loadingPlans: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  plans,
  activeCampaign,
  loadingPlans,
}) => {
  return (
    <section
      id="planos"
      style={{
        padding: '100px 40px',
        background: 'rgba(0,184,101,0.01)',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
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
            TABELA DE PLANOS
          </div>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 42px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              marginBottom: 16,
            }}
          >
            Planos flexíveis para a escala do seu negócio
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.45)',
              maxWidth: 500,
              margin: '0 auto',
            }}
          >
            Escolha a oferta comercial ideal para o tamanho da sua fazenda e integre toda a sua
            operação.
          </p>
          {activeCampaign && (
            <div
              style={{
                marginTop: 30,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 20,
                background:
                  'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.2) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                padding: '12px 24px',
                borderRadius: 100,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#f59e0b',
                      textTransform: 'uppercase',
                    }}
                  >
                    {activeCampaign.name}
                  </div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>
                    {activeCampaign.discount_percentage}% OFF em todos os planos
                  </div>
                </div>
              </div>
              <div style={{ width: 1, height: 30, background: 'rgba(245, 158, 11, 0.3)' }} />
              <CountdownTimer targetDate={activeCampaign.end_date} />
            </div>
          )}
        </div>

        {loadingPlans ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '40px 0' }}>
            Carregando ofertas comerciais...
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                document.getElementById('plans-container')?.scrollBy({ left: -350, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                left: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            
            <button
              onClick={() => {
                document.getElementById('plans-container')?.scrollBy({ left: 350, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                right: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>

            <div
              id="plans-container"
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                gap: 30,
                paddingTop: 24, // added so top badges aren't clipped
                paddingBottom: 20,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {/* Highlight Card: Plano Prenhez */}
              <div
                style={{
                  minWidth: 320,
                  maxWidth: 380,
                  flex: '0 0 auto',
                  scrollSnapAlign: 'center',
                  background: 'linear-gradient(135deg, rgba(0,184,101,0.15) 0%, rgba(8,13,20,0.8) 100%)',
                  border: '2px solid #00b865',
                  borderRadius: 24,
                  padding: '40px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 0 50px rgba(0,184,101,0.2)',
                  marginLeft: 10,
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#00b865',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '4px 14px',
                    borderRadius: 100,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🚀 TESTE TODAS AS FUNCIONALIDADES
                </span>

                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
                    Plano Prenhez
                  </h3>
                  <p style={{ fontSize: 14, color: '#00b865', fontWeight: 700, marginBottom: 12 }}>
                    TRIAL COMPLETO DE 14 DIAS
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                    Não tem certeza de qual plano escolher? Teste a plataforma completa sem limitações por 14 dias gratuitamente e decida depois.
                  </p>
                </div>

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    marginBottom: 40,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                    <span style={{ color: '#00b865', fontWeight: 900 }}>✓</span>
                    <span>Todos os módulos liberados</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                    <span style={{ color: '#00b865', fontWeight: 900 }}>✓</span>
                    <span>Usuários e Animais Ilimitados no Trial</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                    <span style={{ color: '#00b865', fontWeight: 900 }}>✓</span>
                    <span>Sem cartão de crédito</span>
                  </div>
                </div>

                <Link
                  to="/cadastro"
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '16px',
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 900,
                    textAlign: 'center',
                    boxShadow: '0 10px 25px rgba(0,184,101,0.4)',
                  }}
                >
                  COMEÇAR TESTE COMPLETO
                </Link>
              </div>

            {plans.map((plan: any, idx: number) => (
              <div
                key={plan.id || idx}
                style={{
                  minWidth: 320,
                  maxWidth: 380,
                  flex: '0 0 auto',
                  scrollSnapAlign: 'center',
                  background: plan.isPopular
                    ? 'linear-gradient(135deg, rgba(0,184,101,0.08) 0%, rgba(8,13,20,0.6) 100%)'
                    : 'rgba(255,255,255,0.02)',
                  border: plan.isPopular ? '2px solid #00b865' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 24,
                  padding: '40px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: plan.isPopular ? '0 20px 40px rgba(0,184,101,0.15)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {plan.isPopular && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#00b865',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '4px 14px',
                      borderRadius: 100,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    ★ MAIS POPULAR (RECOMENDADO)
                  </span>
                )}

                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 12 }}>
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {activeCampaign && plan.price > 0 && (
                      <span
                        style={{
                          fontSize: 14,
                          color: 'rgba(255,255,255,0.4)',
                          textDecoration: 'line-through',
                          fontWeight: 600,
                        }}
                      >
                        De R$ {plan.price.toLocaleString('pt-BR')}
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span
                        style={{
                          fontSize: 'clamp(32px, 4vw, 42px)',
                          fontWeight: 900,
                          color: activeCampaign ? '#f59e0b' : '#fff',
                        }}
                      >
                        {plan.price === 0
                          ? 'Grátis'
                          : activeCampaign
                            ? `R$ ${(plan.price * (1 - activeCampaign.discount_percentage / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : `R$ ${plan.price.toLocaleString('pt-BR')}`}
                      </span>
                      {plan.price !== 0 && (
                        <span
                          style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}
                        >
                          /mês
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Limits badge/grid */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 16,
                    padding: '16px 20px',
                    marginBottom: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 700,
                    }}
                  >
                    <span>👥</span>
                    <span>
                      Até{' '}
                      <strong>
                        {plan.usersLimit === 999 ? 'Ilimitados' : `${plan.usersLimit} usuários`}
                      </strong>
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 700,
                    }}
                  >
                    <span>🐂</span>
                    <span>
                      Até{' '}
                      <strong>
                        {plan.animalsLimit === 99999
                          ? 'Ilimitados'
                          : `${plan.animalsLimit.toLocaleString('pt-BR')} cabeças`}
                      </strong>
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 700,
                    }}
                  >
                    <span>💾</span>
                    <span>
                      Base de <strong>{plan.storageLimit} GB</strong> armazenamento
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 28 }}
                />

                {/* Features */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    marginBottom: 20,
                  }}
                >
                  {plan.features.map((feat: string, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.65)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: '#00b865', fontWeight: 900 }}>✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action button connected to SaaS provision / login */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link
                    to={`/cadastro?plan=${encodeURIComponent(plan.name)}`}
                    className={plan.isPopular ? 'btn-primary' : 'btn-ghost'}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '16px',
                      borderRadius: 14,
                      fontSize: 14,
                      fontWeight: 800,
                      textAlign: 'center',
                    }}
                  >
                    TESTE GRATUITO
                  </Link>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontWeight: 600 }}>
                    14 dias de teste grátis (funcionalidades deste plano)
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
