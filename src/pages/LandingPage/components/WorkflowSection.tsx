import React from 'react';

export const WorkflowSection: React.FC = () => {
  return (
    <>
      {/* ──── WORKFLOW SECTION ──── */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#00b865',
                letterSpacing: '0.1em',
                marginBottom: 14,
              }}
            >
              FLUXO INTEGRADO
            </div>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                marginBottom: 16,
              }}
            >
              Do campo ao balanço em um único fluxo
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.45)',
                maxWidth: 500,
                margin: '0 auto',
              }}
            >
              Cada operação física alimenta automaticamente o financeiro. Sem redigitação.
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            {/* connector line */}
            <div
              style={{
                position: 'absolute',
                top: 28,
                left: 28,
                right: 28,
                height: 2,
                background: 'linear-gradient(90deg, #00b865, #3b82f6, #8b5cf6, #f59e0b)',
                borderRadius: 2,
                opacity: 0.3,
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                {
                  step: '01',
                  icon: '🐄',
                  label: 'Campo',
                  desc: 'Pesagem RFID, abastecimentos, colheitas e movimentos físicos registrados no app',
                },
                {
                  step: '02',
                  icon: '📊',
                  label: 'ERP',
                  desc: 'Dados sincronizados e organizados por módulo: estoque, frota, pecuária, agrícola',
                },
                {
                  step: '03',
                  icon: '💰',
                  label: 'Financeiro',
                  desc: 'DRE, fluxo de caixa e contas gerados automaticamente a partir das operações',
                },
                {
                  step: '04',
                  icon: '🤖',
                  label: 'IA + BI',
                  desc: 'Dashboards executivos, alertas preditivos e recomendações baseadas nos seus dados',
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{ position: 'relative', textAlign: 'center', padding: '0 16px' }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      background: 'rgba(0,184,101,0.1)',
                      border: '1px solid rgba(0,184,101,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      margin: '0 auto 16px',
                    }}
                  >
                    {s.icon}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: 'rgba(255,255,255,0.25)',
                      letterSpacing: '0.08em',
                      marginBottom: 6,
                    }}
                  >
                    PASSO {s.step}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──── WHY TAUZE ──── */}
      <section
        style={{
          padding: '100px 40px',
          background: 'rgba(255,255,255,0.015)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#00b865',
                letterSpacing: '0.1em',
                marginBottom: 14,
              }}
            >
              POR QUE O TAUZE
            </div>
            <h2
              style={{
                fontSize: 'clamp(26px, 3.5vw, 42px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                marginBottom: 20,
              }}
            >
              Construído por quem conhece o campo de perto
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.75,
                marginBottom: 36,
              }}
            >
              A maioria dos ERPs foi criada para indústrias urbanas e adaptada ao agro com
              gambiarras. O Tauze nasceu para pecuária e agricultura — com lógicas de lotes, talhões
              e telemetria de campo no coração do sistema.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                [
                  'Offline-first',
                  'Funciona sem internet no campo. Sincroniza automaticamente ao voltar à rede.',
                ],
                [
                  'Suporte em português real',
                  'Time de suporte brasileiro, com conhecimento do dia a dia do produtor rural.',
                ],
                [
                  'Sem telas desnecessárias',
                  'Interface projetada para o gerente de fazenda usar no celular ou tablet.',
                ],
              ].map(([t, d]) => (
                <div key={t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: 'rgba(0,184,101,0.12)',
                      border: '1px solid rgba(0,184,101,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <span style={{ color: '#00b865', fontSize: 14, fontWeight: 900 }}>✓</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                      {t}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                      {d}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              {
                icon: '⚡',
                title: 'Implantação em 7 dias',
                desc: 'Migração de dados, treinamento e configuração de integrações incluídos',
              },
              {
                icon: '🔒',
                title: 'Dados 100% seus',
                desc: 'Backup automático, export completo a qualquer momento',
              },
              {
                icon: '📱',
                title: 'App mobile incluído',
                desc: 'Android e iOS para uso no campo sem custo adicional',
              },
              {
                icon: '🔧',
                title: 'Suporte sem chatbot',
                desc: 'Atendimento humano por WhatsApp em horário comercial',
              },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 18,
                  padding: 22,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  {c.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
