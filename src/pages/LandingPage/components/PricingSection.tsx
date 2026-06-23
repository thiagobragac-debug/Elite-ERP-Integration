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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 30,
              alignItems: 'stretch',
            }}
          >
            {plans.map((plan: any, idx: number) => (
              <div
                key={plan.id || idx}
                style={{
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
                    marginBottom: 40,
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
                <Link
                  to={`/login?plan=${encodeURIComponent(plan.name)}`}
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
                  {plan.price === 0 ? 'Iniciar Teste Grátis' : 'Escolher este Plano'}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
